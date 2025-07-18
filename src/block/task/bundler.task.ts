import { UserTagsService } from "src/userTag/user-tags.service";
import { BaseTask } from "./base.task";
import Redis from "ioredis";
import { UserTag } from "src/userTag/user-tags.type";
import { Mutex } from "async-mutex"; // 导入 Mutex
import { create } from "lodash";
import BigNumber from "bignumber.js";
import { MeasureTime } from "src/utils/helper";


export class BundlerTask extends BaseTask {

    userTagService: UserTagsService;
    ignoreTokens: string[] = [];
    ignoreTokenKey: string;
    bundleSize: number;
    targetRedis: Redis;
    memeRedis: Redis;
    insiderSize: number = 3;
    private swaps: any[] = [];
    cacheIgnoreTokens: string[] = []; // 缓存忽略代币列表

    // 使用 async-mutex 替换自定义锁
    private dataMutex = new Mutex(); // 数据操作锁
    private isProcessing: boolean = false; // 保留处理状态标志
    private checkTimer: NodeJS.Timeout | null = null;


    constructor(
        userTagService: UserTagsService,
        ignoreTokens: string[] = [],
        ignoreTokenKey: string = '',
        bundleSize: number = 4,
        targetRedis: Redis,
        memeRedis: Redis
    ){
        super();
        this.userTagService = userTagService;
        this.ignoreTokens = ignoreTokens;
        this.ignoreTokenKey = ignoreTokenKey;
        this.bundleSize = bundleSize;
        this.targetRedis = targetRedis;
        this.memeRedis = memeRedis;
    }

    splitBlockSwaps(){
        const swaps: any[][] = [];
        while (this.swaps.at(0).block != this.swaps.at(-1).block && swaps.length < 30) {
            let lastestIdx = 0;
            if (this.swaps.length > 0) {
                const firstBlock = this.swaps[0].block;
                for (let i = 0; i < this.swaps.length; i++) {
                    if (this.swaps[i].block !== firstBlock) {
                        break;
                    }
                    lastestIdx = i;
                }
            }

            // 直接截取要处理的数据
            const currentSwaps = this.swaps.slice(0, lastestIdx + 1);
            swaps.push(currentSwaps);
            // 立即清理已处理的数据（原子操作）
            this.swaps.splice(0, lastestIdx + 1);
        }
        return swaps;
    }

    async handleSwaps(swaps){
        const bundleBlockInfo = {};
        const sellInfo = {};
        const hashWalletMap = new Map<string, Set<string>>();        
        for (const swap of swaps) {
            if (!(swap.to_token in bundleBlockInfo)) {
                bundleBlockInfo[swap.to_token] = {
                    wallets: new Set<string>(),
                    totalBuyAmount: BigNumber(0),
                };
            }
            if (!(swap.from_token in sellInfo)) {
                sellInfo[swap.from_token] = {
                    wallets: new Set<string>(),
                };
            }
            // 同一个hash有多个钱包买入一个token，设置为老鼠仓
            const hashKey = `${swap.signature}:${swap.to_token}`;
            if (!hashWalletMap.has(hashKey)) {
                hashWalletMap.set(hashKey, new Set<string>());
            }
            hashWalletMap.get(hashKey)?.add(swap.initiator);
            bundleBlockInfo[swap.to_token]['wallets'].add(swap.initiator);
            bundleBlockInfo[swap.to_token]['totalBuyAmount'] = BigNumber(bundleBlockInfo[swap.to_token]['totalBuyAmount']).plus(BigNumber(swap.to_ui_amount));
            sellInfo[swap.from_token]['wallets'].add(swap.initiator);
        }
        // 异步处理bundle，不阻塞下一批数据
        await this.handleBundle(bundleBlockInfo, sellInfo);
        // await this.handleInsider(hashWalletMap);
        await this.executeSubTasks(swaps);

    }

    @MeasureTime()
    async onMessage(message: any): Promise<void> {
        // 处理消息逻辑
        // console.log(`[BundlerTask] Received ${message.length} swaps, first block: ${message[0]?.block} last block:${message.at(-1)?.block}, first block in mem: ${JSON.stringify(this.swaps.at(0))}`);
        this.swaps.push(...message);
        this.swaps.sort((a, b) => a.block - b.block); // 确保按区块排序
        const swaps = this.splitBlockSwaps();
        if (swaps.length > 0) {
            console.log(`[BundlerTask] Splitting into ${swaps.length} blocks for processing, remaining in mem: ${this.swaps.length} swaps`);
        }
        await Promise.all(swaps.map(async (swap) => {
            await this.handleSwaps(swap);
        }));
    }

    async onModuleInit(): Promise<void> {
        // 模块初始化逻辑
        console.log('BundlerTask module initialized');
    }


    private async getIgnoreTokens() {
        let ignoreTokens: string[] = [];
        if (this.ignoreTokens && this.ignoreTokens.length > 0) {
            ignoreTokens = this.ignoreTokens;
        } else if (this.ignoreTokenKey) {
            if (this.cacheIgnoreTokens.length > 0) {
                ignoreTokens = this.cacheIgnoreTokens;
            } else {
                ignoreTokens = await this.targetRedis.smembers(this.ignoreTokenKey);
                this.cacheIgnoreTokens = ignoreTokens;
                console.log(`[BundlerTask] Initialized ignore tokens cache: ${this.cacheIgnoreTokens.length} tokens`);
                setInterval(async () => {
                    this.cacheIgnoreTokens = await this.targetRedis.smembers(this.ignoreTokenKey);
                    console.log(`[BundlerTask] Updated ignore tokens cache: ${this.cacheIgnoreTokens.length} tokens`);
                }, 60 * 1000); // 每60秒更新一次缓存
            }
        }
        return ignoreTokens;
  }

  private async getTokenInfo(token: string) {
    const [createTimeStr, totalSupplyStr, bundlerHoldingStr] = await Promise.all([
        this.memeRedis.hget(`token_list:${token}`, 'createTime'),
        this.memeRedis.hget(`token_list:${token}`, 'totalSupply'),
        this.memeRedis.hget(`token_list:${token}`, 'bundlerHolding'),
    ]);
    const createTime = parseInt(createTimeStr || '0');
    const totalSupply = parseFloat(totalSupplyStr || '0');
    const bundlerHolding = parseFloat(bundlerHoldingStr || '0');

    return {
        createTime,
        totalSupply,
        bundlerHolding,
    };
  }

  protected async handleBundle(blockInfo, sellInfo) {
        const ignoreTokens = await this.getIgnoreTokens();
        const now = Math.floor(Date.now() / 1000);
        const begin = Date.now();
        // 方案1：限制token处理的并发数
        const tokens = Object.keys(blockInfo).filter(token => !ignoreTokens.includes(token));
        const tokenBatchSize = 5; // 每批处理5个token
        for (let i = 0; i < tokens.length; i += tokenBatchSize) {
            const batch = tokens.slice(i, i + tokenBatchSize);
            await Promise.all(batch.map(async (token) => {
                const bundle = blockInfo[token];
                const isBundle = bundle.wallets.size >= this.bundleSize;
                
                if (isBundle) {
                    try {
                        const tokenInfo = await this.getTokenInfo(token);
                        // 统计token创建时间在30秒内的bundler持有量
                        if (now - tokenInfo.createTime < 30 && tokenInfo.totalSupply > 0) {
                            const bundlerHolding = BigNumber(tokenInfo.bundlerHolding).plus(bundle.totalBuyAmount);
                            const bundleHoldingRate = bundlerHolding.div(BigNumber(tokenInfo.totalSupply));
                            await this.memeRedis.hset(`token_list:${token}`, {
                                bundleHolding: bundlerHolding.toString(),
                                bundleRate: bundleHoldingRate.toString(),
                            });
                        }
                    } catch (error) {
                        console.error(`[BundlerTask] Error updating token info for ${token}:`, error.message);
                    }
                }
                // 限制钱包操作的并发数
                const beginTag = Date.now();
                if (isBundle){
                    await this.userTagService.addUserTagsToTokenBatch({
                        tokenAddress: token,
                        walletAddresses: Array.from(bundle.wallets),
                        tag: UserTag.BUNDLER,
                    });
                } else {
                    await this.userTagService.removeUserTagsFromTokenBatch({
                        tokenAddress: token,
                        walletAddresses: Array.from(bundle.wallets),
                        tag: UserTag.BUNDLER,
                    });
                }
                // console.log(`[BundlerTask] Processed bundle for token ${token} with ${bundle.wallets.size} wallets, cost ${Date.now() - beginTag} ms`);
            
            }));
        }
        // 卖出操作只判断移除bundler标签，不处理token信息
        const sellTokens = Object.keys(sellInfo).filter(token => !ignoreTokens.includes(token));
        const sellTokenBatchSize = 5; // 每批处理5个token
        for (let i = 0; i < sellTokens.length; i += sellTokenBatchSize) {
            const batch = sellTokens.slice(i, i + sellTokenBatchSize);
            await Promise.all(batch.map(async (token) => {
                const sellBundle = sellInfo[token];
                const isBundle = sellBundle.wallets.size >= this.bundleSize;
                try {
                    if (!isBundle){
                        await this.userTagService.removeUserTagsFromTokenBatch({
                            tokenAddress: token,
                            walletAddresses: Array.from(sellBundle.wallets),
                            tag: UserTag.BUNDLER,
                        });
                    }
                    
                } catch (error) {
                    console.error(`[BundlerTask] Error removing bundler tags for ${token}:`, error.message);
                }
            }));
        }
        const end = Date.now();
        if (end - begin > 1000) {
            console.warn(`[BundlerTask] Processing bundle tokens took too long: ${end - begin} ms`);
        }
    }

protected async handleInsider(insiderInfo: Map<string, Set<string>>) {
        const ignoreTokens = await this.getIgnoreTokens();
        const begin = Date.now();
        // 方案1：限制token处理的并发数
        const keys = Array.from(insiderInfo.keys());
        const tokenBatchSize = 5; // 每批处理5个token
        for (let i = 0; i < keys.length; i += tokenBatchSize) {
            const batch = keys.slice(i, i + tokenBatchSize);
            await Promise.all(batch.map(async (key) => {
                const insider = insiderInfo.get(key);
                if (!insider || insider.size === 0) {
                    return; // 如果没有insider，直接跳过
                }
                const tokenAddress = key.split(':')[1];
                if (ignoreTokens.includes(tokenAddress)) {
                    return; // 如果是忽略的token，直接跳过
                }
                const isInsider = insider !== undefined && insider.size >= this.insiderSize;
                // 限制钱包操作的并发数
                if (isInsider) {
                    console.log(`[BundlerTask] Found insider for token ${tokenAddress} with ${JSON.stringify(Array.from(insider))}`);
                    await this.userTagService.addUserTagsToTokenBatch({
                        tokenAddress: tokenAddress,
                        walletAddresses: Array.from(insider),
                        tag: UserTag.INSIDER,
                    });
                }
            }));
        }

        const end = Date.now();
        if (end - begin > 1000) {
            console.warn(`[BundlerTask] Processing bundle tokens took too long: ${end - begin} ms`);
        }
    }

}
