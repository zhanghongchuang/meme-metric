import { Redis } from '@zqlc/redis';
import { BigNumber, max } from 'bignumber.js';
import { Queue } from 'bullmq';
import { TokenStatsEntity } from 'src/database/entity/token.stats.entity';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { UserTagsService } from 'src/userTag/user-tags.service';
import { UserTag } from 'src/userTag/user-tags.type';
import { DataSource } from 'typeorm';
import { BaseTask } from './base.task';
import { parse } from 'path';
import { fetchTokenInfo } from 'src/utils/token.utils';
import { AliOssService } from 'src/plugins/alioss.service';
import { ConfigService } from '@nestjs/config';
import { CustomLogger } from 'src/utils/logger.service';
import { MeasureTime } from 'src/utils/helper';


class Result{
    totalBuyVolume: number;
    totalSellVolume: number;
    address: string;
    buyTx: number;
    sellTx: number;
    walletTag: string;
    price: number;

    constructor(address: string, walletTag: string = '') {
        this.walletTag = walletTag;
        this.totalBuyVolume = 0;
        this.totalSellVolume = 0;
        this.address = address;
        this.buyTx = 0;
        this.sellTx = 0;
        this.price = 0;
    }
}

class TokenInfo {
    tokenList: string[];
    migratedTokenList: string[];
    token24HList: string[];
    token1MList: string[];
    tokenDexMap: Map<string, number>;

    constructor() {
        this.tokenList = [];
        this.migratedTokenList = [];
        this.token24HList = [];
        this.token1MList = [];
        this.tokenDexMap = new Map<string, number>();
    }
}

enum NetBuySurgeTimeRange {
  FIFTEEN_SECONDS = 15, // 15秒
  ONE_MINUTE = 30, // 1分钟
  THREE_MINUTES = 60, // 3分钟
}

const MIN_VOLUME_MAP = {
    [NetBuySurgeTimeRange.FIFTEEN_SECONDS]: [2000, 3000, 5000], // 15秒
    [NetBuySurgeTimeRange.ONE_MINUTE]: [5000, 8000, 10000], // 1分钟
    [NetBuySurgeTimeRange.THREE_MINUTES]: [8000, 10000, 15000], // 3分钟
}

const TIMERANGES = [
    NetBuySurgeTimeRange.FIFTEEN_SECONDS,
    // NetBuySurgeTimeRange.ONE_MINUTE,
    // NetBuySurgeTimeRange.THREE_MINUTES
];

export class NetByVolumeTask extends BaseTask{
    AGGSECONDS: number = 15; // 聚合时间间隔，单位为秒
    userTagService: UserTagsService;
    commonRedis: Redis;
    memeRedis: Redis;
    targetRedis: Redis;
    chain: string;
    target: DataSource;
    queue: Queue;
    ossClient: AliOssService;
    configService: ConfigService;
    logger: CustomLogger = new CustomLogger();
    private running: boolean = false;

    constructor(
        chain: string,
        userTagService: UserTagsService,
        commonRedis: Redis,
        memeRedis: Redis,
        target: DataSource,
        queue: Queue,
        ossClient: AliOssService,
        configService: ConfigService,
        targetRedis: Redis
    ){
        super();
        this.chain = chain;
        this.userTagService = userTagService;
        this.commonRedis = commonRedis;
        this.targetRedis = targetRedis;
        this.memeRedis = memeRedis;
        this.target = target;
        this.queue = queue;
        this.ossClient = ossClient;
        this.configService = configService;
    }


    async onModuleInit(): Promise<void> {
        // 模块初始化逻辑
        console.log('NetByVolumeTask module initialized');
    }

    private getVolumeKey(token: string, isMigrated: boolean): string {
        if (isMigrated) {
            return `${this.chain}:netByVolume:zset:migrated-list:${token}`;
        } else {
            return `${this.chain}:netByVolume:zset:nonMigrated-list:${token}`;
        }
        // 列表类型的key
        // if (isMigrated) {
        //     return `${this.chain}:netByVolume:migrated-list:${token}`;
        // } else {
        //     return `${this.chain}:netByVolume:nonMigrated-list:${token}`;
        // }
    }

    private async getTokenInfo(): Promise<TokenInfo> {
        const info = new TokenInfo();
        const tokens1M = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_unmigrated_list`) || '[]');
        console.log(`Fetched ${tokens1M.length} unmigrated tokens from Redis, ${JSON.stringify(tokens1M)}`);
        tokens1M.forEach((item) => {
            info.token1MList.push(item.address);
            info.tokenDexMap.set(item.address, item.dex);
        });
        const tokens24H = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_migrated_list`) || '[]');
        console.log(`Fetched ${tokens24H.length} migrated tokens from Redis, ${JSON.stringify(tokens24H)}`);
        tokens24H.forEach((item) => {
            info.token24HList.push(item.address);
            info.tokenDexMap.set(item.address, item.dex);
            info.migratedTokenList.push(item.address);
        });
        const tokens3H = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_migrated_3h_list`) || '[]');
        tokens3H.forEach((item) => {
            info.tokenDexMap.set(item.address, item.dex);
        });
        console.log(`Fetched ${tokens3H.length} 3-hour migrated tokens from Redis, ${JSON.stringify(tokens3H)}`);
        console.log(`${JSON.stringify(info)}`);
        return info;
    }

    async onSchedule(): Promise<void> {
        if (this.running) {
            return;
        }
        this.running = true;
        try{
            console.log(`Cleaning up old data for ${this.chain} net by volume task`);
            const tokenInfo = await this.getTokenInfo();
            for (const token of tokenInfo.tokenList) {
                const isMigrated = tokenInfo.migratedTokenList.includes(token);
                const redisKey = this.getVolumeKey(token, isMigrated);
                await this.clearTokenVolumeFromRedis(redisKey);
            }
        } finally {
            this.running = false;
        }
        
    }

    @MeasureTime()
    public async onMessage(swaps: any[]): Promise<void> {
        const totalBegin = Date.now();
        try{
            // console.log('handleNetByVolume triggered', this.chain);
            // const startTime = process.hrtime();
            const volumeResult = new Map<string, Map<number, Result>>();
            const begin = Date.now();
            const tokenInfo = await this.getTokenInfo();
            // const tokens1M = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_unmigrated_list`) || '[]');
            // const tokens24H = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_migrated_list`) || '[]');
            // const tokens3H = JSON.parse(await this.commonRedis.get(`${this.chain}:surge_token_migrated_3h_list`) || '[]');
            // console.log(`Fetched ${tokens1M.length} + ${tokens24H.length} + ${tokens3H.length} tokens from Redis cost ${Date.now() - begin}ms`);
            // const tokens = tokens1M.concat(tokens24H).concat(tokens3H);
            // console.log(`Fetched ${tokens1M.length} + ${tokens24H.length} + ${tokens3H.length} tokens from Redis`);
            await this.summaryResult(volumeResult, new Set(tokenInfo.tokenList), swaps);
            const resultTokens = Array.from(volumeResult.keys()).map(key => key.split(':')[0]);
            if (resultTokens.length === 0) {
                return;
            }
            // const beginFetch = Date.now();
            const tokenInfoMap = await fetchTokenInfo(
                this.memeRedis,
                this.target,
                this.ossClient,
                resultTokens
            )
            // console.log(`Fetched token info for ${resultTokens.length} tokens from Redis and OSS cost ${Date.now() - beginFetch}ms`);

            // const beginHandle = Date.now();
            await Promise.all(Array.from(volumeResult.entries()).map(async ([key, values]) => {
                const tokenKeyTag = key.split(':');
                const token = tokenKeyTag[0];
                if (!tokenInfoMap.has(token)) {
                    console.warn(`Token ${token} not found in tokenInfoMap`);
                    return;
                }
                const cacheTokenList = tokenInfoMap.get(token);
                if (!cacheTokenList.symbol || !cacheTokenList.name || !cacheTokenList.logo || !cacheTokenList.holders) {
                    console.warn(`Token ${token} is missing required fields, ${JSON.stringify(cacheTokenList)}`);
                    return;
                }
                let tag = ''
                if (tokenKeyTag.length > 1) {
                    tag = tokenKeyTag[1];
                }
                
                // const totalSupply = parseFloat(cacheTokenList?.totalSupply || cacheTokenList?.total_supply || '1000000000') || 1000000000;
                await Promise.all(Array.from(values.entries()).map(async ([time, value]) => {
                    const totalBuyVolume = value.totalBuyVolume;
                    const totalSellVolume = value.totalSellVolume;
                    const price = value.price || 0;
                    const netByVolume = BigNumber(totalBuyVolume).minus(BigNumber(totalSellVolume));
                    const isMigrated = tokenInfo.migratedTokenList.includes(token);
                    const redisKey = this.getVolumeKey(token, isMigrated);
                    if (tag == '' && (tokenInfo.token1MList.includes(token) || tokenInfo.token24HList.includes(token))) {
                        await this.updateTokenVolume(redisKey, time, netByVolume.toNumber());
                        await this.queue.add('netByVolume', token,
                            {
                                jobId: token,
                            },
                        )
                        const tokenVolumes = await this.getTokenVolumeFromRedis(redisKey);
                        const netBuyList = await this.generateBroadcaseMessage(
                            tokenVolumes, {
                                tokenAddress: token,
                                dex: tokenInfo.tokenDexMap.get(token),
                                price: price
                            }
                        );
                        const publishMessages = await this.prefullMessage(netBuyList, tokenInfoMap);
                        await Promise.all(publishMessages.map(async (message) => {
                            await this.broadcastMessage(`surge`, 'netBuyVolumeUpdate', message);
                        }));
                    }
                }));
            }));
            
        } catch (error) {
            console.error('Error in handleNetByVolume:', error);
        }
        // console.log(`Total processing time for handleNetByVolume: ${Date.now() - totalBegin}ms`);
    }

    private async generateBroadcaseMessage(volumeList: any[], tokenInfo: any){
        const now = Math.floor(Date.now() / 1000);
        const rt: any[] = [];
        for (const timeRange of TIMERANGES) {
            // const needTime = Math.floor((now - timeRange));
            const needTime = Math.floor(now / timeRange) * timeRange;
            // 推送频率限制
            const limitTime = Math.floor(now  / timeRange) * timeRange;
            let totalVolume = 0;
            volumeList.forEach((volume: any) => {
                if (volume.time >= needTime) {
                    totalVolume += volume.netBuyAmount;
                }
            });
            for (const minVolume of MIN_VOLUME_MAP[timeRange]) {
                if (totalVolume < minVolume){
                    continue;
                }
                rt.push({
                    timeRange: timeRange,
                    timestamp: now,
                    netBuyAmount: minVolume,
                    limitTime: limitTime,
                    ...tokenInfo
                });
            }
        }
        return rt;
    }

    private async clearTokenVolumeFromRedis(redisKey: string) {
        if (await this.targetRedis.zcard(redisKey) <= 600) {
            return;
        }
        const cutoffTime = Math.floor(Date.now() / 1000) - 60 * 10;
        const deletedCount = await this.targetRedis.eval(`
            local key = KEYS[1]
            local cutoffTime = tonumber(ARGV[1])
            local members = redis.call('ZRANGE', key, 0, -1)
            local deleted = 0
            
            for i, member in ipairs(members) do
                local memberTime = tonumber(member)
                if memberTime and memberTime < cutoffTime then
                    redis.call('ZREM', key, member)
                    deleted = deleted + 1
                end
            end
            
            return deleted
        `, 1, redisKey, cutoffTime.toString()) as number;
       console.log(`Cleared ${deletedCount} old data entries for redisKey: ${redisKey}, cutoffTime: ${cutoffTime}`);
        // const len = await this.targetRedis.llen(redisKey);
        //     // console.log(`Token ${token} has ${len} entries in Redis list ${redisKey}`);
        // if (len >= 800) {
        //     console.log(`Removing old data for ${redisKey}`);
        //     await this.targetRedis.ltrim(redisKey, -500, -1);
        // }
    }

    private async getTokenVolumeFromRedis(key: string){
        const zsetData = await this.targetRedis.zrange(key, 0, -1, 'WITHSCORES');
        const result: any[] = [];
        for (let i = 0; i < zsetData.length; i += 2) {
            result.push({
                time: parseInt(zsetData[i] || '0'),
                netBuyAmount: parseFloat(zsetData[i + 1] || '0'),
            });
        }
        return result;
        // 升序排列
        // const cacheVolume = await this.targetRedis.lrange(
        //     key,
        //     0,
        //     -1,
        // );
        // // 处理结果为对象数组
        // const result = cacheVolume.map(item => {
        //     const parsed = JSON.parse(item);
        //     return {
        //         netByVolume: parseFloat(parsed.netByVolume) || 0,
        //         time: parseInt(parsed.time) || 0,
        //     };
        // });
        // return result;
    }

    private async updateTokenVolume(redisKey: string, time: number, netByVolume: number) {
        // const pipeline = this.targetRedis.pipeline();
        // pipeline.rpush(redisKey, JSON.stringify({
        //     time, netByVolume
        // }));
        // pipeline.expire(redisKey, 60 * 60 * 24);
        // await pipeline.exec();
        // 上面是按照每个秒数来计算的，下面是按照每个时间范围来计算的
        const pipeline = this.targetRedis.pipeline();
        // 使用 ZINCRBY 累加 netByVolume 到 成员time
        pipeline.zincrby(redisKey, netByVolume, time.toString());
        pipeline.expire(redisKey, 60 * 60 * 24);
        await pipeline.exec();
    }

    filterCondition(signal: any, tokenInfo): boolean {
        if (parseInt(tokenInfo.holders || '0') < 100) {
            // 如果持币地址小于100，则不推送
            return false;
        } else if (parseFloat(tokenInfo.top10 || '0') >= 0.5) {
            return false; // 如果前10大持币地址占比大于50%，则不推送
        } else if (parseFloat(tokenInfo.insiderRate || '0') >= 0.5) {
            return false; // 如果老鼠仓占比大于50%，则不推送
        } else if (parseFloat(tokenInfo.sniperRate || '0') >= 0.5) {
            return false; // 如果狙击手占比大于50%，则不推送
        }
        return true;
    }

    async updateMaxPrice(
        tokenAddress: string,
        timeRange: NetBuySurgeTimeRange,
        netBuyAmount: number,
        price: number,
    ){
        const priceKey = `${this.chain}:netBuyPrice:${tokenAddress}:${timeRange}:${netBuyAmount}`;
        if (!await this.targetRedis.exists(priceKey)) {
            return;
        }
        const maxPrice = await this.targetRedis.hget(priceKey, 'maxPrice');
        if (price > parseFloat(maxPrice || '0')) {
            await this.targetRedis.hset(priceKey, 'maxPrice', price);
            console.log(`Updating max price for ${priceKey} to ${price}`);
        }
    }

    async prefullMessage(signals: any[], tokenInfoMap: any){
        const finalSinals: any[] = [];
        for (const signal of signals){
            const cacheTokenList = tokenInfoMap.get(signal.tokenAddress);
            if (!cacheTokenList){
                console.log(`Token ${signal.tokenAddress} not found in tokenInfoMap size:${tokenInfoMap.size}`)
                continue;
            }
            if (!this.filterCondition(signal, cacheTokenList)){
                console.log(`Token ${signal.tokenAddress} does not meet filter conditions`);
                continue;
            }
            if (!signal.price){
                console.log(`price ${signal.price} is not set`);
                continue;
            }
            // 按照筛选条件进行限流，最新版本限流条件新增K线时间
            // const rateLimitKey = `${this.chain}:netBuyRateLimit:${signal.tokenAddress}:${signal.timeRange}:${signal.netBuyAmount}`;
            const rateLimitKey = `${this.chain}:netBuyRateLimit:${signal.tokenAddress}:${signal.timeRange}:${signal.netBuyAmount}:${signal.limitTime}`;
            const lastPublishTime = await this.targetRedis.get(rateLimitKey);
            if (lastPublishTime && signal.timestamp - parseInt(lastPublishTime || '0')  < signal.timeRange) {
                // 如果信号产生时间-上次产生时间小于配置的值，需要限流不再推送
                continue;
            }
            // 获取并设置价格信息
            const priceKey = `${this.chain}:netBuyPrice:${signal.tokenAddress}:${signal.timeRange}:${signal.netBuyAmount}`;
            const priceInfo = await this.targetRedis.hgetall(priceKey);
            const initPrice = parseFloat(priceInfo?.price || '0');
            const maxPrice = parseFloat(priceInfo?.maxPrice || '0');
            const notifyTimes = parseInt(priceInfo?.notifyTimes || '0') + 1;
            const pipeline = this.targetRedis.pipeline();
            if (!initPrice){
                // 如果没有初始价格，则设置为当前价格
                pipeline.hset(priceKey, 'price', signal.price);
                pipeline.hset(priceKey, 'maxPrice', signal.price);
                console.log(`Setting initial price for ${signal.tokenAddress} at ${signal.price}`);
            }
            pipeline.hset(priceKey, 'notifyTimes', notifyTimes);
            pipeline.expire(priceKey, 60 * 60 * 24); // 设置价格信息的过期时间为24小时
            // 设置限流键，过期时间为signal.timeRange
            pipeline.set(rateLimitKey, signal.timestamp, 'EX', signal.timeRange);
            await pipeline.exec();

            const price = signal.price || 0;
            const totalSupply = parseFloat(cacheTokenList?.totalSupply || cacheTokenList?.total_supply || '1000000000') || 1000000000;
            const message = {
                ...signal,
                mcap: BigNumber(price).times(totalSupply).toNumber(),
                tokenInfo: cacheTokenList,
                initPrice: initPrice || price,
                maxPrice: maxPrice || price,
                notifyTimes: notifyTimes,
            }
            finalSinals.push(message);
        }
        return finalSinals;
    }

    async broadcastMessage(room: string, event: string, data: any): Promise<void> {
        await this.addTokenList(data);
        await this.publishMessage(`ws:channel:broadcast`, JSON.stringify({ room, event, data }));
    }

    private async addTokenList(message) {
        const tokenListKey = `surgeData:${this.chain}:netBuyVolume:publishTokenList:${message['dex']}`;
        const dataCacheKey = `surgeData:${this.chain}:${message['timeRange']}:${message['netBuyAmount']}:${message['tokenAddress']}`;
        const tokenInfoKey = `token_list:${message['tokenAddress']}`;
        // 构建所有符合 dataCacheKey 格式的 key 列表
        const allDataCacheKeys: string[] = [];
        TIMERANGES.forEach((timeRange) => {
            for (const minVolume of MIN_VOLUME_MAP[timeRange]) {
                // 这里要手动加上前缀，KEYS 参数：会自动加前缀，ARGV 参数：不会自动加前缀
                allDataCacheKeys.push(`${this.memeRedis.options.keyPrefix || ''}surgeData:${this.chain}:${timeRange}:${minVolume}:`);
            }
        });

        console.log('Debug - allDataCacheKeys:', allDataCacheKeys);
        console.log('Debug - tokenAddress:', message['tokenAddress']);

        const luaScript = `
            local dataCacheKey = KEYS[1]
            local tokenListKey = KEYS[2]
            local tokenInfoKey = KEYS[3]
            local messageJson = ARGV[1]
            local tokenAddress = ARGV[2]
            local timestamp = tonumber(ARGV[3])

            -- 添加新数据
            redis.call('RPUSH', dataCacheKey, messageJson)
            redis.call('ZADD', tokenListKey, timestamp, tokenAddress)
            redis.call('HSETNX', tokenInfoKey, 'firstSignalTime', timestamp)

            -- 保留分数最大的20条数据
            local count = redis.call('ZCARD', tokenListKey)
            local removedMembers = {}
            if count > 20 then
                removedMembers = redis.call('ZREVRANGE', tokenListKey, 19, -1)
                redis.call('ZREMRANGEBYRANK', tokenListKey, 0, count - 20)
            end

            -- 删除对应的 key
            local deletedKeys = {}
            local checkedKeys = {}
            for i, member in ipairs(removedMembers) do
                for j = 4, #ARGV do
                    local prefix = ARGV[j]
                    local fullKey = prefix .. member
                    table.insert(checkedKeys, fullKey)
                    
                    local keyExists = redis.call('EXISTS', fullKey)
                    if keyExists == 1 then
                        redis.call('DEL', fullKey)
                        table.insert(deletedKeys, fullKey)
                    end
                end
            end

            return cjson.encode({
                removedMembers = removedMembers,
                checkedKeys = checkedKeys,
                deletedKeys = deletedKeys,
                argvCount = #ARGV
            })
        `;
        
        const result = await this.memeRedis.eval(
            luaScript,
            3,
            dataCacheKey,
            tokenListKey,
            tokenInfoKey,
            JSON.stringify(message),
            message['tokenAddress'],
            message['timestamp'].toString(),
            ...allDataCacheKeys
        );

        console.log('Lua script result:', JSON.parse(result as string));
    }

    async publishMessage(channel: string, message: string): Promise<void> {
        try {
            await this.memeRedis.publish(channel, message);
            this.logger.log(`Publishing message to channel ${channel}: ${message}`);

        } catch (error) {
            this.logger.error(`Failed to publish message to channel ${channel}: ${error.message}`, error.stack);
            throw error;
        }
    }

    async batchCheckZSetMembersLua(redis: Redis, key: string, members: string[]): Promise<Map<string, boolean>> {
        const luaScript = `
            local key = KEYS[1]
            local results = {}
            
            for i = 1, #ARGV do
            local score = redis.call('ZSCORE', key, ARGV[i])
            if score then
                results[i] = 1
            else
                results[i] = 0
            end
            end
            
            return results
        `;
        
        const results = await redis.eval(luaScript, 1, key, ...members) as number[];
        const memberExists = new Map<string, boolean>();
        
        members.forEach((member, index) => {
            memberExists.set(member, results[index] === 1);
        });
        // console.log(`Batch check ZSet members for key ${key}:`, memberExists);
        return memberExists;
    }

    @MeasureTime()
    private async summaryResult(volumeMap: Map<string, Map<number, Result>>,
            tokens: Set<any>, result: any[]){
        if (tokens.size === 0) {
            console.log(`No tokens found in Redis for ${this.chain}`);
            return 0;
        }
        // console.log(`begin Fetched swaps from Redis for ${this.chain}`);
        const newWalletKey = `${this.chain}:UserNewWalletSet`;
        const tokenWalletMap = new Map<string, Set<string>>();
        const swaps: any[] = [];
        const allWallets = new Set<string>();
        const hashWalletMap = new Map<string, string[]>();
        const buyHashWalletMap = new Map<string, Set<string>>();
        for (const record of result) {
            allWallets.add(record.initiator);
            // 同一笔hash有地址操作，不参与统计
            if (!hashWalletMap.has(record.signature)) {
                hashWalletMap.set(record.signature, []);
            }
            hashWalletMap.get(record.signature)?.push(record.initiator);
            // 同一个hash一个token有多个钱包买入，钱包识别为老鼠仓，不参与统计
            const hashKey = `${record.signature}:${record.to_token}`;
            if (!buyHashWalletMap.has(hashKey)) {
                buyHashWalletMap.set(hashKey, new Set<string>());
            }
            buyHashWalletMap.get(hashKey)?.add(record.initiator);
            if (tokens.has(record.from_token)) {
                if (!tokenWalletMap.has(record.from_token)) {
                    tokenWalletMap.set(record.from_token, new Set());
                }
                tokenWalletMap.get(record.from_token)?.add(record.initiator);
                swaps.push(record);
            } else if (tokens.has(record.to_token)) {
                if (!tokenWalletMap.has(record.to_token)) {
                    tokenWalletMap.set(record.to_token, new Set());
                }
                swaps.push(record);
                tokenWalletMap.get(record.to_token)?.add(record.initiator);
            }
        }
        if (tokenWalletMap.size == 0) {
            return;
        }
        const insiderWallet: string[] = []
        Array.from(buyHashWalletMap.values()).filter(item => item.size >= 3).map(
            (item: Set<string>) => insiderWallet.push(...item)
        )
        if (insiderWallet.length > 0){
            console.log(`insider wallets${JSON.stringify(insiderWallet)}`)
        }
        const tokenWalletEntries = Array.from(tokenWalletMap.entries());
        const newWallets = await this.batchCheckZSetMembersLua(this.commonRedis, newWalletKey, Array.from(allWallets));
        const concurrency = 10;
        const tagsAddrs = new Set<string>();
        const maxPriceMap = new Map<string, number>();
        for (let i = 0; i < tokenWalletEntries.length; i += concurrency) {
            const batch = tokenWalletEntries.slice(i, i + concurrency);
            await Promise.all(batch.map(async ([token, wallets]) => {
                const tagAddrs = await this.userTagService.getUserAddressesByTags(token, [UserTag.BUNDLER, UserTag.INSIDER]);
                Object.values(tagAddrs).flat().forEach(addr => tagsAddrs.add(addr));
            }));
        }
        for (const record of swaps) {
            if (hashWalletMap.has(record.signature) && (hashWalletMap.get(record.signature)?.length ?? 0) >= 3) {
                continue; // Skip multi-sig wallets
            } else if (insiderWallet.includes(record.initiator)){
                continue;
            } else if (tagsAddrs.has(record.initiator)) {
                continue;
            } else if (newWallets.get(record.initiator)) {
                // tagType = 'newWallet';
                // console.log(`skip new wallet for:${token}`)
                continue;
            }
            let token;
            let amount;
            let isBuy;
            let price;
            let tagType = '';
            // const time = parseInt(record.block_time)
            const time = Math.floor(parseInt(record.block_time) / this.AGGSECONDS) * this.AGGSECONDS; // 15秒对齐
            if (tokens.has(record.from_token)) {
                token = record.from_token;
                amount = parseFloat(record.from_ui_amount);
                price = parseFloat(record.from_token_price);
                isBuy = false; // Assuming from_token indicates a buy transaction
            } else {
                token = record.to_token;
                amount = parseFloat(record.to_ui_amount);
                price = parseFloat(record.to_token_price);
                isBuy = true; // Assuming to_token indicates a sell transaction
            }
            maxPriceMap.set(token, Math.max(maxPriceMap.get(token) || 0, price));
            let tagValue = `${token}`;
            if (tagType != '') {
                tagValue = `${token}:${tagType}`;
            }
            if (!volumeMap.has(tagValue)) {
                volumeMap.set(tagValue, new Map());
            }
            if (!volumeMap.get(tagValue)?.has(time)) {
                volumeMap.get(tagValue)?.set(time, new Result(token, tagType));
            }
            const currentVolume = volumeMap.get(tagValue)!.get(time)!;
            currentVolume.price = price;
            if (isBuy) {
                currentVolume.buyTx += 1;
                currentVolume.totalBuyVolume = BigNumber(currentVolume.totalBuyVolume).plus(BigNumber(amount).times(price)).toNumber();
            } else {
                currentVolume.sellTx += 1;
                currentVolume.totalSellVolume = BigNumber(currentVolume.totalSellVolume).plus(BigNumber(amount).times(price)).toNumber();
            }
        }
        await this.batchUpdateMaxPrice(maxPriceMap);
    }

    @MeasureTime()
    private async batchUpdateMaxPrice(tokenPrices: Map<string, number>) {
        if (tokenPrices.size === 0) {
            return;
        }
        for (const timeRange of TIMERANGES) {
            // 每个时间条件一批并发
            const tasks: any[] = [];
            for (const minVolume of MIN_VOLUME_MAP[timeRange]) {
                for (const [tokenAddress, price] of tokenPrices.entries()) {
                    tasks.push(this.updateMaxPrice(tokenAddress, timeRange, minVolume, price));
                }
            }
            await Promise.all(tasks);
        }
    }

}