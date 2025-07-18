import { Command, CommandRunner } from 'nest-commander';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AliOssService } from '../plugins/alioss.service';
import { DataSource } from 'typeorm';
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require('os');

// @Injectable()
// @Command({ name: 'fix-buy-sell-count', description: '修复买卖数量' })
export class FixBuySellCountCommand implements OnApplicationBootstrap {
    private readonly COMPLETION_FLAG_FILE = path.join(os.tmpdir(), 'fix-buy-sell-count-completed.flag');
    private isExecuting = false;

    constructor(
    private readonly aliOssService: AliOssService,
    @Inject('sol') private readonly datasource: DataSource
) {
  }

    async onApplicationBootstrap() {
    console.log('FixBuySellCountCommand 已启动');
    
    // 检查是否已经执行过
    if (fs.existsSync(this.COMPLETION_FLAG_FILE)) {
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
      fs.writeFileSync(this.COMPLETION_FLAG_FILE, JSON.stringify({
        completedAt: new Date().toISOString(),
        message: '数据修复任务已完成'
      }));
      
      console.log('后台修复任务完成');
      
    } catch (error) {
      console.error('后台修复任务失败:', error);
    } finally {
      this.isExecuting = false;
    }
  }

  async run(): Promise<void> {
    console.log('开始查询数据...');
    const begin = Date.now();
    let total = 0;
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const sql = `
        SELECT
          wallet_address,
          token_address,
          buy_date,
          buy_count,
          sell_count
        FROM
          smart_user_daily_4h
        LIMIT ${pageSize} OFFSET ${offset}
      `;
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
      for (const item of result) {
        const { wallet_address, token_address, buy_date, buy_count, sell_count } = item;
        try {
          await this.fixData(wallet_address, token_address, buy_date, buy_count, sell_count);
        } catch (error) {
          console.error(`修复数据失败: ${wallet_address}, ${token_address}, ${buy_date}`, error);
          continue;
        }
      }
      offset += pageSize;
      hasMore = result.length === pageSize;
    }
    const end = Date.now();
    console.log(`数据修复完成，总耗时 ${(end - begin)} 毫秒`);
}

  async fixData(walletAddress: string, tokenAddress: string, buyDate: number, oldBuyCount: number, oldSellCount: number): Promise<void> {
    const endDate = Number(buyDate) + 4 * 60 * 60; // 4小时后
    console.log(`开始修复数据: ${walletAddress}, ${tokenAddress}, ${buyDate}`);
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
      
    // //   return;
    // }
    for (const swap of swaps) {
      if (swap.from_token === tokenAddress) {
        sellCount++;
      } else if (swap.to_token === tokenAddress) {
        buyCount++;
      }
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
    console.log(`修复完成: ${walletAddress}, ${tokenAddress}, ${buyDate}, 买入数量: ${oldBuyCount}->${buyCount}, 卖出数量: ${oldSellCount}->${sellCount}`);
  }
}