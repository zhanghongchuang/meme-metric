import { generateIncrInsertOnDuplicateSQL, generateInsertOnDuplicatePgSql, getStartOfMinute, MeasureTime, normalizeBigNumberFieldsInPlace } from 'src/utils/helper';
import { EntityManager } from 'typeorm';
import BigNumber from 'bignumber.js';
import {
  SMART_TOKEN_FIELDS,
  SMART_TOKEN_UNIQUE_COLUMNS,
} from 'src/database/entity/smart.token.entity';
import {
  SMART_USER_DAILY_FIELDS,
  SMART_USER_DAILY_UNIQUE_COLUMNS,
} from 'src/database/entity/smart.user.daily.entity';
import {
  SMART_USER_COLUMNS,
  SMART_USER_UNIQUE_COLUMNS,
} from 'src/database/entity/smart.user.entity';
import {
  SMART_TOKEN_ROUND_RESULT_STATS_COLUMNS,
  SMART_TOKEN_ROUND_RESULT_STATS_UNIQUE_COLUMNS,
} from 'src/database/entity/smart.token.round_result.stats.entity';


export class DbHelper{

    static mergeDailyInfo(sourceInfo: any[], mergeMinute: number) {
        const result = new Map<string, Map<string, any>>();
        sourceInfo.forEach((item) => {
          let preResult = result.get(item.wallet_address);
          if (!preResult) {
            preResult = new Map<string, any>();
            result.set(item.wallet_address, preResult);
          }
          const startOfTime = getStartOfMinute(item.buy_date, mergeMinute);
          const key = `${item.token_address}:${startOfTime}`;
          const curInfo = preResult.get(key);
          if (!curInfo) {
            preResult.set(key, { ...item, buy_date: startOfTime });
          } else {
            curInfo.total_buy_volume = BigNumber(curInfo.total_buy_volume).plus(
              BigNumber(item.total_buy_volume),
            );
            curInfo.total_sell_volume = BigNumber(curInfo.total_sell_volume).plus(
              BigNumber(item.total_sell_volume),
            );
            curInfo.total_buy_amount = BigNumber(curInfo.total_buy_amount).plus(
              BigNumber(item.total_buy_amount),
            );
            curInfo.total_sell_amount = BigNumber(curInfo.total_sell_amount).plus(
              BigNumber(item.total_sell_amount),
            );
            curInfo.buy_count = BigNumber(curInfo.buy_count).plus(
              BigNumber(item.buy_count),
            );
            curInfo.sell_count = BigNumber(curInfo.sell_count).plus(
              BigNumber(item.sell_count),
            );
            curInfo.realized_pnL = BigNumber(curInfo.realized_pnL).plus(
              BigNumber(item.realized_pnL),
            );
            curInfo.total_sold_cost = BigNumber(curInfo.total_sold_cost).plus(
              BigNumber(item.total_sold_cost),
            );
          }
        });
        let allDailyInfo: any[] = [];
        for (const tokenDailyInfo of result.values()) {
          allDailyInfo = allDailyInfo.concat([...tokenDailyInfo.values()]);
        }
        return allDailyInfo;
      }
    
    static async executeWithRetry<T>(
        fn: () => Promise<T>,
        maxRetries = 3,
        initialDelay = 50,
    ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 判断是否为死锁错误
        if (
          error.message.includes('Deadlock found') ||
          error.message.includes('Lock wait timeout')
        ) {
          if (attempt < maxRetries) {
            // 使用指数退避算法计算延迟时间
            const delay = initialDelay * Math.pow(2, attempt);
            console.warn(error.message);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        // 如果不是死锁错误或已达到最大重试次数，抛出异常
        throw error;
      }
    }
    // 如果所有尝试都失败，抛出最后一个错误
    throw lastError;
  }

    static async saveSummaryToDB(
        manager: EntityManager,
        userInfo: any,
        tokenInfo: any,
        dailyInfo: any,
        allRoundResultStatsInfo: any,
      ) {
        const BATCH_SIZE = 1000;
        async function batchProcess(
          data: any[],
          handler: (batch: any[]) => Promise<void>,
        ) {
          if (!Array.isArray(data)) {
            console.error('batchProcess: Expected array but got:', typeof data);
            return;
          }
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            await handler(batch);
          }
        }
    
        // userInfo
        if (userInfo.length > 0) {
          await batchProcess(userInfo, async (batch) => {
            normalizeBigNumberFieldsInPlace(batch);
            const userSql = generateIncrInsertOnDuplicateSQL(
              'smart_users_v2',
              SMART_USER_COLUMNS,
              SMART_USER_UNIQUE_COLUMNS,
              batch,
              {
                last_active_time:
                  'GREATEST(last_active_time, VALUES(last_active_time))',
                sync_id: 'GREATEST(sync_id, VALUES(sync_id))',
                wallet_address: 'VALUES(wallet_address)',
                updated_at: 'VALUES(updated_at)',
                create_time: 'LEAST(create_time, VALUES(create_time))',
              },
            );
            await manager.query(userSql.sql, userSql.values);
            userSql.values.length = 0; // 清空values数组，避免内存泄漏
          });
        }
    
        // dailyInfo
        if (dailyInfo.length > 0) {
          // 4h
          const dailyInfo4h = DbHelper.mergeDailyInfo(dailyInfo, 60 * 4);
          await batchProcess(dailyInfo4h, async (batch) => {
            normalizeBigNumberFieldsInPlace(batch);
            const dailySql4h = generateIncrInsertOnDuplicateSQL(
              'smart_user_daily_4h',
              SMART_USER_DAILY_FIELDS,
              SMART_USER_DAILY_UNIQUE_COLUMNS,
              batch,
              {
                wallet_address: 'VALUES(wallet_address)',
                symbol: 'VALUES(symbol)',
                token_address: 'VALUES(token_address)',
                buy_date: 'VALUES(buy_date)',
                updated_at: 'VALUES(updated_at)',
              },
            );
            await manager.query(dailySql4h.sql, dailySql4h.values);
            dailySql4h.values.length = 0; // 清空values数组，避免内存泄漏
          });
          // 1d
          await batchProcess(dailyInfo, async (batch) => {
            normalizeBigNumberFieldsInPlace(batch);
            const dailySql = generateIncrInsertOnDuplicateSQL(
              'smart_user_daily',
              SMART_USER_DAILY_FIELDS,
              SMART_USER_DAILY_UNIQUE_COLUMNS,
              batch,
              {
                wallet_address: 'VALUES(wallet_address)',
                symbol: 'VALUES(symbol)',
                token_address: 'VALUES(token_address)',
                buy_date: 'VALUES(buy_date)',
                updated_at: 'VALUES(updated_at)',
              },
            );
            await manager.query(dailySql.sql, dailySql.values);
            dailySql.values.length = 0; // 清空values数组，避免内存泄漏
          });
        }
    
        // allRoundResultStatsInfo
        if (allRoundResultStatsInfo.length > 0) {
          await batchProcess(allRoundResultStatsInfo, async (batch) => {
            normalizeBigNumberFieldsInPlace(batch);
            const roundStatsSql = generateIncrInsertOnDuplicateSQL(
              'smart_token_round_result_stats',
              SMART_TOKEN_ROUND_RESULT_STATS_COLUMNS,
              SMART_TOKEN_ROUND_RESULT_STATS_UNIQUE_COLUMNS,
              batch,
              {
                wallet_address: 'VALUES(wallet_address)',
                date: 'VALUES(date)',
                updated_at: 'VALUES(updated_at)',
              },
            );
            await manager.query(roundStatsSql.sql, roundStatsSql.values);
            roundStatsSql.values.length = 0; // 清空values数组，避免内存泄漏
          });
        }
    
        // tokenInfo
        if (tokenInfo.length > 0) {
          await batchProcess(tokenInfo, async (batch) => {
            normalizeBigNumberFieldsInPlace(batch);
            const tokenSql = generateIncrInsertOnDuplicateSQL(
              'smart_token_v2',
              SMART_TOKEN_FIELDS,
              SMART_TOKEN_UNIQUE_COLUMNS,
              batch,
              {
                last_buy_time: 'GREATEST(last_buy_time, VALUES(last_buy_time))',
                last_active_time:
                  'GREATEST(last_active_time, VALUES(last_active_time))',
                wallet_address: 'VALUES(wallet_address)',
                symbol: 'VALUES(symbol)',
                token_address: 'VALUES(token_address)',
                updated_at: 'VALUES(updated_at)',
              },
            );
            await manager.query(tokenSql.sql, tokenSql.values);
            tokenSql.values.length = 0; // 清空values数组，避免内存泄漏
          });
        }
    }
    
}