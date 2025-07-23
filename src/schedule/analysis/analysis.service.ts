import { Cron } from '@nestjs/schedule';
import { SwapEntity } from 'src/database/entity/swap.entity';
import {Redis} from "ioredis";
import { DataSource, EntityManager } from "typeorm";
import { generateIncrInsertOnDuplicateSQL, getStartOfMinute, MeasureTime } from "src/utils/helper";
import { ANALYSIS_SWAP_FIELDS, ANALYSIS_SWAP_UNIQUE_COLUMNS, AnalysisSwapEntity } from "src/database/entity/analysis.swap.entity";
import { AnalysisSwapEntity1M } from "src/database/entity/analysis.swap.1m.entity";
import { AnalysisSwapEntity1H } from "src/database/entity/analysis.swap.1h.entity";
import { AnalysisSwapEntity1D } from "src/database/entity/analysis.swap.1d.entity";
import { WalletMonitorEntity } from "src/database/entity/wallet.monitor.entity";
import { AnalysisSwapInfo } from './common/struct';
import { OnModuleInit } from '@nestjs/common';
import { KOLInfoEntity } from 'src/database/entity/kol.info.entity';
import { ClickHouseService } from 'src/database/clickhouse.service';
import BigNumber from 'bignumber.js';


export class AnalysisService<T extends SwapEntity> implements OnModuleInit {
    redis: Redis;
    targetDatasource: DataSource;  // 分析交易数据存储库
    monitorDatasource: DataSource;  // 监控地址存储库
    chain: string;
    clickhouseService: ClickHouseService;
    ignoreTokens: string[];
    private entityClass: new () => T;
    isProcessing: boolean = false;

    constructor(
        entityClass: new () => T,
    ){
        this.entityClass = entityClass;
    }

    async onModuleInit() {
        const key = `${this.chain}:kol`;
        const pipeline = this.redis.pipeline();
        pipeline.del(key);
        const data = await this.targetDatasource.getRepository(
            KOLInfoEntity
        ).createQueryBuilder('kol')
        .getMany();
        const addressList = data.map((item) => item.wallet_address);
        if (addressList.length > 0) {
            pipeline.sadd(key, ...addressList);
        }
        await pipeline.exec();
        console.log(`kol info init success, chain: ${this.chain}, count: ${addressList.length}`);
    }

    @Cron('*/5 * * * * *')
    @MeasureTime()
    async cronTask() {
        if (this.isProcessing) {
            console.log(`${this.chain} analysis service is already running, skipping this execution`);
            return;
        }
        this.isProcessing = true;
        try{
            const swapData = await this.getSwapData();
            await this.handleSwap(swapData);
        } finally {
            this.isProcessing = false;
        }
    }

    async getSwapData(): Promise<any[]> {
        if (!this.clickhouseService) {
            return [];
        }
        // 从数据源获取交易数据
        const key = `${this.chain}:analysis:last_swap_time`;
        let lastTime = await this.redis.get(key);
        if (!lastTime) {
            const rt = await this.clickhouseService.query(`
                SELECT MAX(block_time) AS maxTime
                FROM swap_24h limit 1;
            `);
            if (rt.length == 0) {
                console.warn(`No swap data found for chain: ${this.chain}`);
            }
            const { maxTime } = rt[0];
            if (!maxTime) {
                console.warn(`No swap data found for chain: ${this.chain}`);
                return [];
            }
            console.log(`No lastTime found, using maxTime: ${maxTime}`);
            lastTime = maxTime;
        }
        const time = parseInt(lastTime || '0', 10);
        if (!time) {
            console.warn(`Invalid lastTime: ${lastTime} for chain: ${this.chain}`);
            return [];
        }
        const sql = `
            select *
            from swap_24h
            where block_time > ${time}
            and block_time <= ${time + 10}
            order by block_time asc
        `
        // console.log(`Fetching swap data for chain: ${this.chain}, lastTime: ${lastTime}, sql: ${sql}`);
        const swapData = await this.clickhouseService.query(sql);
        if (swapData.length > 0) {
            console.log(`Fetched ${swapData.length} swap records for chain: ${JSON.stringify(swapData[swapData.length - 1].block_time)}`);
            await this.redis.set(key, swapData[swapData.length - 1].block_time); // 更新最后处理时间
        } else {
            // 这里查的24小时的表，如果没有可能是掉线了很长时间，或者消费速度更不上更新的
            // 为了避免死循环，没有就从最新的记录开始
            await this.redis.del(key);
        }
        return swapData;
    }

    async handleSwap(swapData: any) {
        if (!swapData || swapData.length === 0) {
            return [];
        }
        const wallets: string[] = Array.from(new Set(swapData.map((swap: any) => swap.initiator)));
        const kolMap = await this.isKol(wallets);
        const monitorMap = await this.isMonitor(wallets);
        const resultMap = new Map<string, AnalysisSwapInfo>();
        swapData.forEach(async (swap: any) => {
            const walletAddress = swap.initiator;
            let walletType;
            if (kolMap.get(walletAddress)) {
                walletType = 'kol';
            } else if (monitorMap.get(walletAddress)) {
                walletType = 'monitor';
            } else {
                return;
            }
            let side: 'buy' | 'sell';
            let token: string;
            let volume: number;
            if (this.ignoreTokens.includes(swap.from_token)) {
                side = 'buy';
                token = swap.to_token;
                volume = BigNumber(swap.to_ui_amount || 0).multipliedBy(BigNumber(swap.to_token_price || 0)).toNumber();
            } else {
                side = 'sell';
                token = swap.from_token;
                volume = BigNumber(swap.from_ui_amount || 0).multipliedBy(BigNumber(swap.from_token_price || 0)).toNumber();
            }
            const obj = new AnalysisSwapInfo(swap.initiator, token, side, swap.block_time, walletType);
            obj.volume = Number(BigNumber(volume || 0).toFixed(18));
            const key = obj.getUniqueKey();
            const existingSwap = resultMap.get(key);
            if (!existingSwap) {
                resultMap.set(key, obj);
            } else {
                existingSwap.volume = Number(BigNumber(existingSwap.volume || 0).plus(obj.volume).toFixed(18));
            }
        });
        await this.targetDatasource.transaction(async (manager: EntityManager) => {
            const kolSwaps = Array.from(resultMap.values());
            if (kolSwaps.length > 0) {
                await this.saveSwapsToDB(manager, kolSwaps);
            }
        });
    }

    async isKol(walletAddress: string[]): Promise<Map<string, boolean>> {
        const key = `${this.chain}:kol`;
        const kolMap = new Map<string, boolean>();
        const batchSize = 10; // Adjust batch size as needed
        for (let i = 0; i < walletAddress.length; i += batchSize) {
            const batch = walletAddress.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(address => this.redis.sismember(key, address))
            );
            batch.forEach((address, idx) => {
                kolMap.set(address, results[idx] === 1);
            });
        }
        return kolMap;
    }

    async isMonitor(walletAddress: string[]): Promise<Map<string, boolean>> {
        const rt = new Map<string, boolean>();
        const data = await this.monitorDatasource.getRepository(WalletMonitorEntity)
            .createQueryBuilder('monitor')
            .select('monitor.tracked_wallet_address', 'wallet_address')
            .where('monitor.tracked_wallet_address IN (:...wallets)', { wallets: walletAddress })
            .getRawMany();
        data.forEach(item => {
            rt.set(item.wallet_address, true);
        });
        return rt;
    }

    mergeSwapInfo(swaps: AnalysisSwapInfo[], minute){
        const swapMap = new Map<string, AnalysisSwapInfo>();
        for (const swap of swaps) {
            const time = getStartOfMinute(swap.tradeTime, minute);
            const key = `${swap.walletAddress}-${swap.tokenAddress}-${time}`;
            const existingSwap = swapMap.get(key);
            if (!existingSwap) {
                const obj = new AnalysisSwapInfo(
                    swap.walletAddress,
                    swap.tokenAddress,
                    swap.side,
                    time,
                    swap.walletType
                );
                swapMap.set(key, obj);
            } else {
                existingSwap.volume = Number(BigNumber(existingSwap.volume || 0).plus(swap.volume).toFixed(18));
            }
        }
        return Array.from(swapMap.values());
    }

    private async saveSwapsToDB(
        manager: EntityManager,
        kolSwaps: AnalysisSwapInfo[],
    ){
        if (kolSwaps.length == 0){
            return;
        }
        const spColumms = {
                wallet_address: 'VALUES(wallet_address)',
                trade_time: 'VALUES(trade_time)',
                token_address: 'VALUES(token_address)',
                wallet_type: 'VALUES(wallet_type)',
                side: 'VALUES(side)',
                updated_at: 'VALUES(updated_at)',
            }
        const tasks: any[] = []
        const sql = generateIncrInsertOnDuplicateSQL(
            'analysis_swap',
            ANALYSIS_SWAP_FIELDS,
            ANALYSIS_SWAP_UNIQUE_COLUMNS,
            kolSwaps,
            spColumms
        )
        tasks.push(manager.query(sql.sql, sql.values));
        // 1分钟
        const sql2 = generateIncrInsertOnDuplicateSQL(
            'analysis_swap_1m',
            ANALYSIS_SWAP_FIELDS,
            ANALYSIS_SWAP_UNIQUE_COLUMNS,
            this.mergeSwapInfo(kolSwaps, 1),
            spColumms
        )
        tasks.push(manager.query(sql2.sql, sql2.values));
        // 1小时
        const sql1h = generateIncrInsertOnDuplicateSQL(
            'analysis_swap_1h',
            ANALYSIS_SWAP_FIELDS,
            ANALYSIS_SWAP_UNIQUE_COLUMNS,
            this.mergeSwapInfo(kolSwaps, 60),
            spColumms
        )
        tasks.push(manager.query(sql1h.sql, sql1h.values));
        // 1天
        const sql1d = generateIncrInsertOnDuplicateSQL(
            'analysis_swap_1d',
            ANALYSIS_SWAP_FIELDS,
            ANALYSIS_SWAP_UNIQUE_COLUMNS,
            this.mergeSwapInfo(kolSwaps, 60 * 24),
            spColumms
        )
        tasks.push(manager.query(sql1d.sql, sql1d.values));
        await Promise.all(tasks);

    }

}