import { Redis } from 'ioredis';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { UserTagsService } from 'src/userTag/user-tags.service';
import * as _ from 'lodash';
import { DataSource } from 'typeorm';
import { BaseTask } from './task/base.task';
import { SmartMoneyTask } from './task/smart.money.task';
import { BundlerTask } from './task/bundler.task';
import { NetByVolumeTask } from './task/net-buy.task';
import { Queue } from 'bullmq';
import { AliOssService } from 'src/plugins/alioss.service';
import { ConfigService } from '@nestjs/config';
import { TokenSwapTask } from './task/token.swap.task';
import { Cron } from '@nestjs/schedule';

export abstract class BlockHandle {
  redis: Redis;
  targetRedis: Redis;
  commonRedis: Redis;
  memeRedis: Redis;
  rabbitmq: RabbitMQService;
  chain: string;
  queue: Queue; 
  ossClient: AliOssService;
  configService: ConfigService;
  // protected swapListKey: string;
  protected ignoreTokens: string[];
  protected ignoreTokenKey: string;
  protected bundleSize: number;
  protected mqExchange: string;
  protected mqQueue: string;
  protected userTagService: UserTagsService;
  datasource: DataSource;
  targetDatasource: DataSource;
  tasks: BaseTask[] = [];
  metricTasks: BaseTask[] = [];

  public async onModuleInit(){
    const bundlerTask = new BundlerTask(
      this.userTagService,
      this.ignoreTokens,
      this.ignoreTokenKey,
      this.bundleSize,
      this.targetRedis,
      this.memeRedis
    );
    this.metricTasks.push(bundlerTask);

    const netBuyTask = new NetByVolumeTask(
      this.chain,
      this.userTagService,
      this.commonRedis,
      this.memeRedis,
      this.targetDatasource,
      this.queue,
      this.ossClient,
      this.configService,
      this.targetRedis
    );
    this.metricTasks.push(netBuyTask);

    for (const task of this.tasks) {
      await task.onModuleInit();
    }
    for (const task of this.metricTasks) {
      await task.onModuleInit();
    }
  }
    
  private async handleTask(swaps){
    await Promise.all(
      this.tasks.map(async (task) => {
        await task.onMessage(swaps);
      }),
    );
  }

  private async handleMetricTask(swaps){
    await Promise.all(
      this.metricTasks.map(async (task) => {
        await task.onMessage(swaps);
      }),
    );
  }

  @Cron('*/10 * * * * *')
  async shcedule(){
    await Promise.all(
      this.tasks.map(async (task) => {
        await task.onSchedule();
      }),
    );
    await Promise.all(
      this.metricTasks.map(async (task) => {
        await task.onSchedule();
      }),
    );
  }

  public async handleMessage(message: any[]): Promise<void> {
    // const data = JSON.parse(message);
    message.sort((a, b) => a.block - b.block);
    console.log(`[${this.chain}] Processing ${message.length} swaps,first block: ${message[0].block}, last block: ${message[message.length - 1].block}`);
    await this.handleTask(message);
  }

  public async handleMetricMessage(message: any[]): Promise<void> {
    // const data = JSON.parse(message);
    message.sort((a, b) => a.block - b.block);
    console.log(`[${this.chain}] Processing ${message.length} metric swaps,first block: ${message[0].block}, last block: ${message[message.length - 1].block}`);
    await this.handleMetricTask(message);
  }

}
