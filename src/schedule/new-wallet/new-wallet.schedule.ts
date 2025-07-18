import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { RedisService } from '@zqlc/redis';
import { Redis } from 'ioredis';
import { TransfersEntity } from 'src/database/entity/transfers.entity';
import { SmartUserEntity } from 'src/database/entity/smart.user.entity';
// import { console } from 'inspector';

// @Injectable()
export class NewWalletScheduleService {
  protected datasource: DataSource;
  protected redis: Redis;
  protected commonRedis: Redis;
  protected chain: string;
  private isProcessing: boolean = false;

  constructor(
  ) {
  }

  @Cron('*/10 * * * * *')
  async initNewWallet() {
    // console.log(`${this.chain} new wallet schedule`);
    if (this.isProcessing) {
      console.log(`${this.chain} new wallet schedule is already running, skipping this execution`);
      return;
    }
    this.isProcessing = true;
    try{
      await this.addNewWallet();
    } finally {
      this.isProcessing = false;
    }
  }

  async getLatestWalletTime(): Promise<number> {
  const cacheKey = `${this.chain}:UserNewWalletSet`;
  
  // 方法1：获取分数最高的成员及分数
  const result = await this.commonRedis.zrevrange(cacheKey, 0, 0, 'WITHSCORES');
  
  if (result.length > 0) {
    const latestTime = parseFloat(result[1]);
    console.log(`最新钱包时间: ${latestTime}, 钱包地址: ${result[0]}`);
    return latestTime;
  }
  
  return 0; // 没有数据时返回0
}

  async addNewWallet(){
    const cacheKey = `${this.chain}:UserNewWalletSet`;
    const begin = await this.getLatestWalletTime();
  
    const result = await this.datasource
      .getRepository(SmartUserEntity)
      .createQueryBuilder()
      .select(
        [
            'wallet_address',
            'create_time',
        ]
      )
      .where('create_time >= :begin', { begin })
      .limit(10000)
      .getRawMany();
      const now = Math.floor(Date.now() / 1000);
      // console.log(`now: ${now}`);
      const filteredResult = result.filter(item => (now - item.create_time) <= 48 * 60 * 60 && item.create_time > 0);
      if (filteredResult.length > 0) {
        // console.log(`Adding ${filteredResult.length} new wallets to Redis`);
        const zaddArgs = result.flatMap((item) => [item.create_time, item.wallet_address]);
        await this.commonRedis.zadd(cacheKey, ...zaddArgs);
      }
      const cutoffTime = now - 48 * 60 * 60;
      await this.commonRedis.zremrangebyscore(cacheKey, '-inf', cutoffTime.toString());
  } 

}