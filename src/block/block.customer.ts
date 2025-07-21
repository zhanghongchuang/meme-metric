import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  BSC_BLOCK_QUEUE_NAME,
  SOL_BLOCK_QUEUE_NAME,
  SOL_METRIC_BLOCK_QUEUE_NAME,
  BSC_METRIC_BLOCK_QUEUE_NAME,
  SOL_BLOCK_EXCHANGE_NAME,
  BSC_BLOCK_EXCHANGE_NAME,
} from 'src/config/rabbitMQ';
import { BscBlockService } from './bsc.block.service';
import { SolBlockService } from './sol.block.service';

@Injectable()
export class BlockCustomer {
  constructor(
    private readonly bscService: BscBlockService,
    private readonly solService: SolBlockService,
  ) {}

  @RabbitSubscribe({
    exchange: SOL_BLOCK_EXCHANGE_NAME,
    routingKey: 'sol',
    queue: SOL_METRIC_BLOCK_QUEUE_NAME,
    queueOptions: {
        channel: 'channel-metric',
        durable: true,             // ✅ 队列持久化
        autoDelete: false,
        // maxPriority: 10,
    },
    batchOptions: {
      size: 2000,
      timeout: 100,
    },
  })
  async handleSolMetricBlock(info) {
    try {
      await this.solService.handleMetricMessage(info);
    } catch (error) {
      Logger.error({
        title: this.constructor.name + '-handleMetricBlock-err',
        data: { info },
        error: {
          data: error?.response?.data ?? [],
          msg: error?.stack ?? error + '',
        },
      });
    }
  }

  @RabbitSubscribe({
    exchange: BSC_BLOCK_EXCHANGE_NAME,
    routingKey: 'evm:56',
    queue: BSC_METRIC_BLOCK_QUEUE_NAME,
    queueOptions: {
        channel: 'channel-metric',
        durable: true,             // ✅ 队列持久化
        autoDelete: false,
        // maxPriority: 10,
    },
    batchOptions: {
      size: 2000,
      timeout: 100,
    },
  })
  async handleBscMetricBlock(info) {
    try {
      await this.bscService.handleMetricMessage(info);
    } catch (error) {
      Logger.error({
        title: this.constructor.name + '-handleMetricBlock-err',
        data: { info },
        error: {
          data: error?.response?.data ?? [],
          msg: error?.message ?? error + '',
        },
      });
    }
  }
}
