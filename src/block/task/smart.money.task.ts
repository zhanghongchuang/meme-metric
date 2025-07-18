import { Redis } from "ioredis";
import { BaseTask } from "./base.task";
import * as _ from 'lodash';
import { MeasureTime } from "src/utils/helper";


export class SmartMoneyTask extends BaseTask {

    mqExchange: string;
    mqQueue: string;
    chain: string;
    targetRedis: Redis;
    rabbitmq: any;
    
    constructor(
        chain: string,
        mqExchange: string,
        mqQueue: string,
        targetRedis: Redis,
        rabbitmq: any
    ) {
        super();
        this.chain = chain;
        this.mqExchange = mqExchange;
        this.mqQueue = mqQueue;
        this.targetRedis = targetRedis;
        this.rabbitmq = rabbitmq;
    }

    @MeasureTime()
    async onMessage(message: any): Promise<void> {
        // 处理消息逻辑
        // console.log('Processing message:', message);
        // console.log(`[${this.chain}] Processing ${message.length} swaps `);
            
        const addressInfo = {};
        for (const swap of message) {
            if (!swap.initiator) {
                console.warn('onMessage: swap.initiator is empty', swap);
                continue;
            }
            if (!(swap.initiator in addressInfo)) {
                addressInfo[swap.initiator] = [];
            }
            addressInfo[swap.initiator].push(swap);
        }
        
        // 处理地址信息
        await this.handleAddressInfo(addressInfo);
        // console.log(`[${this.chain}] Processed ${Object.keys(addressInfo).length} addresses`);
    }

    async onModuleInit(): Promise<void> {
        // 模块初始化逻辑
        console.log('SmartMoneyTask module initialized');
    }

    protected async handleAddressInfo(info) {
        const batchedAddresses: string[] = [];
        const multiRedis = this.targetRedis.multi();
        Object.keys(info).map(async (walletAddr) => {
            if (!walletAddr) {
                console.warn('handleAddressInfo: walletAddr is empty', JSON.stringify(info[walletAddr]));
                return;
            }
            const swaps = info[walletAddr].map((swap) => {
                return JSON.stringify(swap);
            });
            const luaScript = `
                local key = KEYS[1]
                local swaps = ARGV
                redis.call('rpush', key, unpack(swaps))
                redis.call('expire', key, 60 * 60 * 24)
            `
            const key = `${this.chain}:swap:${walletAddr}`;
            multiRedis.eval(luaScript, 1, key, ...swaps);
            batchedAddresses.push(walletAddr);
        });
        await multiRedis.exec();
        await Promise.all(_.chunk(batchedAddresses, 50).map(async (list)=>{
            if (list.length === 0) {
                console.warn('send handleAddressInfo to MQ: list is empty');
                return;
            }
            this.rabbitmq.amqpConnection.publish(this.mqExchange, this.mqQueue, list.join(','));
        }));
    }
}