import { Command, CommandRunner } from 'nest-commander';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require('os');

@Injectable()
export class FixBuySellCountCommand {
    private readonly COMPLETION_FLAG_FILE = path.join(os.tmpdir(), 'fix-buy-sell-count-completed.flag');
    private readonly COMPLETION_ID_FILE = path.join(os.tmpdir(), 'fix-buy-sell-count-completed.id');
    private readonly APP_COMPLETION_FLAG_FILE = path.join(process.cwd(), 'fix-buy-sell-count-completed.flag');
    private readonly APP_COMPLETION_ID_FILE = path.join(process.cwd(), 'fix-buy-sell-count-completed.id');

    private getFlagFilePath(): string {
      return fs.existsSync(this.COMPLETION_FLAG_FILE)
        ? this.COMPLETION_FLAG_FILE
        : this.APP_COMPLETION_FLAG_FILE;
    }

    private getIdFilePath(): string {
      return fs.existsSync(this.APP_COMPLETION_ID_FILE)
        ? this.APP_COMPLETION_ID_FILE
        : this.COMPLETION_ID_FILE;
    }

    private isCompleted(): boolean {
      return fs.existsSync(this.COMPLETION_FLAG_FILE) || fs.existsSync(this.APP_COMPLETION_FLAG_FILE);
    }

    private saveCompletionFlag(data: any): void {
      fs.writeFileSync(this.APP_COMPLETION_FLAG_FILE, JSON.stringify(data));
    }

    private saveLastProcessedId(id: number): void {
      fs.writeFileSync(this.APP_COMPLETION_ID_FILE, id.toString());
    }
    private isExecuting = false;

    constructor(
    @Inject('sol') private readonly datasource: DataSource
  ) {
    }
    @Cron('*/10 * * * * *') // 每10秒执行一次
    async scheduledTask() {
      console.log('FixBuySellCountCommand 已启动');
      
      // 检查是否已经执行过
      if (this.isCompleted()) {
        console.log('修复任务已完成，跳过执行');
        return;
      }

      // 异步执行，不阻塞主进程
      this.runAsync().catch(error => {
        console.error('后台修复任务执行失败:', error);
      });
  }

  private async runAsync(): Promise<void> {
    if (this.isExecuting) {
      console.log('修复任务正在执行中，跳过重复执行');
      return;
    }

    this.isExecuting = true;
    
    try {
      // 添加延迟，确保应用完全启动后再执行
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('开始后台执行数据修复任务...');
      await this.run();
      
      // 创建完成标记
      this.saveCompletionFlag(
        {
        completedAt: new Date().toISOString(),
        message: '数据修复任务已完成'
      });
      console.log('后台修复任务完成');
      
    } catch (error) {
      console.error('后台修复任务失败:', error);
    } finally {
      this.isExecuting = false;
    }
  }

  private getLastProcessedId(): number {
  try {
    const f = this.getIdFilePath();
    if (fs.existsSync(f)) {
      const idContent = fs.readFileSync(f, 'utf8');
      const id = parseInt(idContent.trim(), 10);
      return isNaN(id) ? 0 : id;
    }
    return 0;
  } catch (error) {
    console.error('读取 ID 文件失败:', error);
    return 0;
  }
}

  async run(): Promise<void> {
    console.log('开始查询数据...');
    const begin = Date.now();
    let total = 0;
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;
    let lastId = this.getLastProcessedId();
    let endDate = lastId + 4 * 60 * 60; // 4小时后
    while (hasMore) {
      let sql = `
        SELECT
          wallet_address,
          token_address,
          buy_date,
          buy_count,
          sell_count
        FROM
          smart_user_daily_4h
      `;
      if (lastId > 0) {
        sql += ` WHERE buy_date >= ${lastId} AND buy_date < ${endDate} `;
      }
      const result = await this.datasource.query(sql);
      if (!result || result.length === 0) {
        if (offset === 0) {
          console.log('没有需要修复的数据');
        }
        break;
      }
      console.log(`查询到 ${result.length} 条数据，偏移量: ${offset}`);
    //   if (offset === 0) {
    //     total = await this.datasource.query(`SELECT COUNT(*) as count FROM smart_user_daily_4h`);
    //     console.log(`查询到 ${total[0].count} 条需要修复的数据`);
    //   }
    let fixCnt = 0;
      for (const item of result) {
        const { wallet_address, token_address, buy_date, buy_count, sell_count } = item;
        try {
          await this.fixData(wallet_address, token_address, buy_date, buy_count, sell_count);
          fixCnt++;
          if (fixCnt % 100 === 0) {
            console.log(`已修复 ${fixCnt} 条数据`);
          }
        } catch (error) {
          console.error(`修复数据失败: ${wallet_address}, ${token_address}, ${buy_date}`, error);
          continue;
        }
        }
      this.saveLastProcessedId(endDate); // 保存最后处理的时间
      console.log(`已处理 ${result.length} 条数据，最后处理的时间: ${endDate}`);
      offset += pageSize;
      hasMore = result.length === pageSize;
    }
    const end = Date.now();
    console.log(`数据修复完成，总耗时 ${(end - begin)} 毫秒`);
}

  async fixData(walletAddress: string, tokenAddress: string, buyDate: number, oldBuyCount: number, oldSellCount: number): Promise<void> {
    const endDate = Number(buyDate) + 4 * 60 * 60; // 4小时后
    let buyCount = 0;
    let sellCount = 0;
    const sql = `
      SELECT
        from_token,
        to_token
      FROM
        sol_swap
      WHERE
        initiator = '${walletAddress}'
        AND from_token = '${tokenAddress}'
        AND block_time >= ${buyDate}
        AND block_time < ${endDate} 
    
    UNION ALL

      SELECT
        from_token,
        to_token
      FROM
        sol_swap
      WHERE
        initiator = '${walletAddress}'
        AND to_token = '${tokenAddress}'
        AND block_time >= ${buyDate}
        AND block_time < ${endDate}
      `;
    const swaps = await this.datasource.query(sql);
    // if (!swaps || swaps.length === 0) {
    //   console.log(`没有找到相关交易数据: ${walletAddress}, ${tokenAddress}, ${buyDate}`);
    //   return;
    // }
    for (const swap of swaps) {
      if (swap.from_token === tokenAddress) {
        sellCount++;
      } else if (swap.to_token === tokenAddress) {
        buyCount++;
      }
    }
    if (buyCount === oldBuyCount && sellCount === oldSellCount) {
      // console.log(`数据无需修复: ${walletAddress}, ${tokenAddress}, ${buyDate}, 买入数量: ${oldBuyCount}->${buyCount}, 卖出数量: ${oldSellCount}->${sellCount}`);
      return;
    }
    const updateSql = `
      UPDATE
        smart_user_daily_4h
      SET
        buy_count = ${buyCount},
        sell_count = ${sellCount}
      WHERE
        wallet_address = '${walletAddress}'
        AND token_address = '${tokenAddress}'
        AND buy_date = ${buyDate}
    `;
    await this.datasource.query(updateSql);
    // console.log(`修复完成: ${walletAddress}, ${tokenAddress}, ${buyDate}, 买入数量: ${oldBuyCount}->${buyCount}, 卖出数量: ${oldSellCount}->${sellCount}`);
}
}