import {Redis} from 'ioredis';
import { getChainAddress } from 'src/utils/helper';


export async function getWalletMonitorInfo(redis: Redis, chain: string, walletAddr: string, needWalletAddr: string) {
    const key = `${chain}:walletMonitor:trackedInfo:${walletAddr}`;
    const data = await redis.hget(key, needWalletAddr);
    return data ? JSON.parse(data) : null;
}

export async function getSubscribedWalletMonitorList(redis: Redis, chain: string, walletAddr: string) {
    const key = `${chain}:walletMonitor:walletInfo:${walletAddr}`;
    const data = await redis.smembers(key);
    return data;
}

export async function subscribePnlUpdate(redis: Redis, chain: string, walletAddress: string, tokenAddress: string) {
    const pipeline = redis.pipeline();
    const monitorKey = `${chain}:pnl-update:${getChainAddress(chain, tokenAddress)}`;
    pipeline.sadd(monitorKey, walletAddress);
    pipeline.expire(monitorKey, 60 * 60 * 24); // 1 day in seconds
    await pipeline.exec();
    await subscribeRealTimeTx(redis, chain, walletAddress, tokenAddress);
    console.log(`Subscribed to pnl update for ${chain} wallet: ${walletAddress}, token: ${tokenAddress}`);
}

export async function unsubscribePnlUpdate(redis: Redis, chain: string, walletAddress: string, tokenAddress: string) {
    const monitorKey = `${chain}:pnl-update:${getChainAddress(chain, tokenAddress)}`;
    await redis.srem(monitorKey, walletAddress);
    await unsubscribeRealTimeTx(redis, chain, walletAddress, tokenAddress);
    console.log(`Unsubscribed from pnl update for ${chain} wallet: ${walletAddress}, token: ${tokenAddress}`);
}

export async function isSubscribePnlUpdate(redis: Redis, chain: string, walletAddress: string, tokenAddress: string){
    const monitorKey = `${chain}:pnl-update:${getChainAddress(chain, tokenAddress)}`;
    return await redis.sismember(monitorKey, walletAddress);
}

export async function hasSubscribePnlUpdate(redis: Redis, chain: string, tokenAddress: string){
    const monitorKey = `${chain}:pnl-update:${getChainAddress(chain, tokenAddress)}`;
    return await redis.scard(monitorKey) > 0;
}

export async function getSubscribePnlUpdateWallets(redis: Redis, chain: string, tokenAddress: string){
    const monitorKey = `${chain}:pnl-update:${getChainAddress(chain, tokenAddress)}`;
    return await redis.smembers(monitorKey);
}

export async function subscribeRealTimeTx(redis: Redis, chain: string, walletAddress: string, tokenAddress: string) {
    const pipeline = redis.pipeline();
    const monitorKey = `${chain}:realtime-tx:${getChainAddress(chain, walletAddress)}`;
    pipeline.sadd(monitorKey, getChainAddress(chain, tokenAddress));
    pipeline.expire(monitorKey, 60 * 60 * 24); // 1 day in seconds
    await pipeline.exec();
    console.log(`Subscribed to real-time transactions for ${chain} wallet: ${walletAddress}, token: ${tokenAddress}`);
}

export async function unsubscribeRealTimeTx(redis: Redis, chain: string, walletAddress: string, tokenAddress: string) {
    const monitorKey = `${chain}:realtime-tx:${getChainAddress(chain, walletAddress)}`;
    await redis.srem(monitorKey, getChainAddress(chain, tokenAddress));
    console.log(`Unsubscribed from real-time transactions for ${chain} wallet: ${walletAddress}, token: ${tokenAddress}`);
}

export async function isSubscribedToRealTimeTx(redis: Redis, chain: string, walletAddress: string) {
    const monitorKey = `${chain}:realtime-tx:${getChainAddress(chain, walletAddress)}`;
    return await redis.scard(monitorKey) > 0;
}