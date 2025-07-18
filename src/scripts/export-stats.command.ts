import { Command, CommandRunner } from 'nest-commander';
import { Inject, Injectable } from '@nestjs/common';
import { AliOssService } from '../plugins/alioss.service';
import { DataSource } from 'typeorm';
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require('os');

@Injectable()
@Command({ name: 'export-stats', description: '导出数据' })
export class ExportStatsCommand extends CommandRunner {
  constructor(
    private readonly aliOssService: AliOssService,
    @Inject('sol') private readonly datasource: DataSource
) {
    super();
  }

  async run(): Promise<void> {
    console.log('开始查询数据...');
    const begin = Math.floor(Date.now() / 1000) - 60 * 60 * 2; 
    // const begin = 1749067200;
    console.log(`查询开始时间: ${begin}`);
    const sql = `
    SELECT 
    a.token_address, 
    a.wallet_tag,
    DATE_FORMAT(FROM_UNIXTIME(a.stats_time), '%Y-%m-%d %H:%i:%s') AS stats_time,
    a.total_buy_volume,
    a.total_sell_volume,
    a.net_buy_volume,
    a.buy_tx,
    a.sell_tx,
    a.net_buy_tx,
    a.dex,
    a.mcap,
    a.create_time
    FROM 
        token_stats as a
    where 
        stats_time>=${begin}
        and wallet_tag like '3H%'
    `;
    await this.getDbData(sql, '3H');
    console.log('开始查询第二批数据...');
    const sql2 = `
    SELECT 
    a.token_address, 
    a.wallet_tag,
    DATE_FORMAT(FROM_UNIXTIME(a.stats_time), '%Y-%m-%d %H:%i:%s') AS stats_time,
    a.total_buy_volume,
    a.total_sell_volume,
    a.net_buy_volume,
    a.buy_tx,
    a.sell_tx,
    a.net_buy_tx,
    a.dex,
    a.mcap,
    a.create_time
    FROM 
        token_stats as a
    where 
        stats_time>=${begin}
        and wallet_tag not like '3H%'
    `;
    await this.getDbData(sql2, 'normal');
    console.log('数据导出完成！');
  }

private formatTimestamp(timestamp: number, format: 'datetime' | 'date' | 'time' = 'datetime'): string {
    // 转为毫秒并加上8小时的偏移量
    const date = new Date((timestamp + 8 * 60 * 60) * 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = pad(date.getUTCMonth() + 1);
    const day = pad(date.getUTCDate());
    const hour = pad(date.getUTCHours());
    const minute = pad(date.getUTCMinutes());
    const second = pad(date.getUTCSeconds());

    switch (format) {
      case 'datetime':
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      case 'date':
        return `${year}-${month}-${day}`;
      case 'time':
        return `${hour}:${minute}:${second}`;
      default:
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
}

  async getDbData(sql: string, prefix: string) {
    const headers = [
        'token_address', 
        'wallet_tag', 
        'stats_time', 
        'total_buy_volume',
        'total_sell_volume',
        'net_buy_volume',
        'buy_tx',
        'sell_tx',
        'net_buy_tx',
        'dex',
        'mcap',
        'create_time'
    ];
    const queryRunner = this.datasource.createQueryRunner();

    // 用于收集所有字段名（包括 create_time）
    // const headersSet = new Set<string>();
    // let headersWritten = false;
    // let headers: string[] = [];

    await queryRunner.connect();

    const stream = await queryRunner.stream(sql);
    const timeMap = new Map<string, string>();
    let fetchNum = 0;
    const allRows: any[] = [];
    stream.on('data', (row: any) => {
        allRows.push(row);
    });
    
    await new Promise<void>((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
    });

    // 处理每一行数据
    console.log(`开始处理 ${allRows.length} 行数据...`);

    // 处理所有数据
    const processedRows: any[] = [];
    for (let i = 0; i < allRows.length; i++) {
        const row = allRows[i];
        const tokenAddress = row.token_address;
        let createTime = row.create_time || '';
        if (!createTime) {
            try {
            if (timeMap.has(tokenAddress)) {
                createTime = timeMap.get(tokenAddress) || '';
            } else {
                const ossFile = await this.aliOssService.getOssFileContent(`tokenStatsNew/${tokenAddress}`);
                if (ossFile !== -1 && ossFile) {
                    console.log(`获取到 ${tokenAddress} 的 OSS 文件内容, ${JSON.stringify(ossFile)}`);
                    const ossData = JSON.parse(ossFile);
                    createTime = this.formatTimestamp(parseInt(ossData?.createTime || '0', 10));
                } else {
                    createTime = '';
                }
                timeMap.set(tokenAddress, createTime);
            }
        } catch (error) {
            console.log(`Error fetching or parsing OSS file for token ${tokenAddress}:`, error);
            createTime = '';
            timeMap.set(tokenAddress, createTime);
        }
    } else {
        createTime = this.formatTimestamp(parseInt(createTime, 10));
    }
        
        const resultRow = { ...row, create_time: createTime };
        processedRows.push(resultRow);
        
        if ((i + 1) % 1000 === 0) {
            console.log(`已处理 ${i + 1}/${allRows.length} 行数据...`);
        }
    }
    // 写入文件
    const tmpFilePath = path.join('.', `stats-result-${prefix}.csv`);
    console.log(`CSV文件将保存到: ${tmpFilePath}`);
    const writeStream = fs.createWriteStream(tmpFilePath, { encoding: 'utf8' });
    
    // 写入表头
    writeStream.write(headers.join(',') + '\n');
    
    // 写入所有数据
    processedRows.forEach(resultRow => {
        const rowArr = headers.map(h => JSON.stringify(resultRow[h] ?? ''));
        writeStream.write(rowArr.join(',') + '\n');
    });

    writeStream.end();

    // 等待写入完成
    await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
    await queryRunner.release();
  }

}