import { Redis } from "ioredis";
import { BaseTask } from "./base.task";
import * as _ from 'lodash';
import { hasSubscribePnlUpdate } from "src/common/channel";
import { MQ_CFG_MAP } from "src/config/rabbitMQ";


export class TokenSwapTask extends BaseTask {
    chain: string;
    redis: Redis;
    rabbitmq: any;
    ignoreTokens: string[] = [];
    
    constructor(
        chain: string,
        redis: Redis,
        rabbitmq: any,
        ignoreTokens: string[] = []
    ) {
        super();
        this.chain = chain;
        this.redis = redis;
        this.rabbitmq = rabbitmq;
        this.ignoreTokens = ignoreTokens;
    }

    async onMessage(message: any): Promise<void> {
        const priceMap = new Map<string, number>();
        for (const swap of message) {
            if (!this.ignoreTokens.includes(swap.from_token)) {
                priceMap.set(swap.from_token, swap.from_token_price);
            }
            if (!this.ignoreTokens.includes(swap.to_token)) {
                priceMap.set(swap.to_token, swap.to_token_price);
            }
        }
        
        // 处理地址信息
        await this.handlePriceInfo(priceMap);
        // console.log(`[${this.chain}] Processed ${Object.keys(addressInfo).length} addresses`);
    }

    async onModuleInit(): Promise<void> {
        // 模块初始化逻辑
        console.log('TokenSwapTask module initialized');
    }

    getMqInfo(): { exchange: string; queue: string } {
        return MQ_CFG_MAP[this.chain]['pnlQueueCfg']
    }

    protected async handlePriceInfo(priceMap: Map<string, number>) {
        const cfg = this.getMqInfo();
        const entries = Array.from(priceMap.entries());
        for (let i = 0; i < entries.length; i += 5) {
            const batch = entries.slice(i, i + 5);
            await Promise.all(
            batch.map(async ([token, price]) => {
                if (await hasSubscribePnlUpdate(this.redis, this.chain, token)) {
                    // 发布价格更新消息到 RabbitMQ
                    await this.rabbitmq.publish(
                        cfg.exchange,
                        cfg.queue,
                        {
                            tokenAddr: token,
                            price: price
                        }
                    );
                }
            })
            );
        }
    }
}