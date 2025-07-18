import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import moment from 'moment';
import { SmartUserDailyEntity } from 'src/database/entity/smart.user.daily.entity';
import { Redis } from 'ioredis';
import { SmartUserDaily4hEntity } from 'src/database/entity/smart.user.daily.4h.entity';

// @Injectable()
export class SmartMoneyScheduleService {
  datasource: DataSource;
  redis: Redis;
  chain: string;
  private calulateTopWalletRunning: boolean = false;

  @Cron('*/30 * * * *')
  async calulateTopWallet() {
    if (this.calulateTopWalletRunning) {
      console.log('calulateTopWallet is already running, skipping this execution');
      return;
    }

    try {
      this.calulateTopWalletRunning = true;
      
      const key = `${this.chain}:walletMonitor:recommended`;
      const oneDay = 24 * 3600;
      const now = Math.floor(Date.now() / 1000);
      const beginTime = now - 7 * oneDay;
      
      // 使用原生 SQL，性能更好
      const sql = `
        SELECT 
          wallet_address AS walletAddress,
          SUM(total_sold_cost) AS totalSoldCost,
          SUM(realized_pnL) AS totalRealizedPnL
        FROM smart_user_daily 
        WHERE buy_date >= ?
          AND realized_pnL > 0  -- 在聚合前过滤，减少计算量
        GROUP BY wallet_address
        HAVING SUM(realized_pnL) > 0  -- 确保总收益为正
        ORDER BY totalRealizedPnL DESC
        LIMIT 100
      `;
      
      const results = await this.datasource.query(sql, [beginTime]);
      
      console.log(`execute smart money schedule, result count: ${results.length}`);
      
      if (results.length > 0) {
        await this.redis.set(key, JSON.stringify(results));
      }
      
    } catch (error) {
      console.error('Error in calulateTopWallet:', error);
    } finally {
      this.calulateTopWalletRunning = false;
    }
  }

  @Cron('0 0 * * *') // 每天执行一次
  async deleteDailyInfo() {
    try {
      // 删除 SmartUserDailyEntity 数据（保留7天）
      let endOfDay = moment().subtract(8, 'days').startOf('day').unix();
      console.log(`Deleting daily info older than ${endOfDay}`);
      
      const result1 = await this.datasource.query(
        'DELETE FROM smart_user_daily WHERE buy_date <= ?',
        [endOfDay]
      );
      console.log(`Deleted ${result1.affectedRows} records from smart_user_daily`);
      
      // 删除 SmartUserDaily4hEntity 数据（保留31天）
      endOfDay = moment().subtract(31, 'days').startOf('day').unix();
      console.log(`Deleting 4h daily info older than ${endOfDay}`);
      
      const result2 = await this.datasource.query(
        'DELETE FROM smart_user_daily_4h WHERE buy_date <= ?',
        [endOfDay]
      );
      console.log(`Deleted ${result2.affectedRows} records from smart_user_daily_4h`);
      
    } catch (error) {
      console.error('Error in deleteDailyInfo:', error);
    }
  }
}
