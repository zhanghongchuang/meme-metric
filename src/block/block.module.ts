import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { createMemeQueueConfig } from 'src/redismq/queue.config';

import { BscBlockService } from './bsc.block.service';
import { SolBlockService } from './sol.block.service';
import { BSC_MEMESTATS_QUEUE_NAME, SOL_MEMESTATS_QUEUE_NAME } from 'src/config/rabbitMQ';
import { BlockCustomer } from './block.customer';

@Module({
  imports: [
    BullModule.registerQueueAsync(createMemeQueueConfig(SOL_MEMESTATS_QUEUE_NAME, 'sol_memestats_queue_redis')),
    BullModule.registerQueueAsync(createMemeQueueConfig(BSC_MEMESTATS_QUEUE_NAME, 'bsc_memestats_queue_redis')),
  ],
  providers: [BscBlockService, SolBlockService, BlockCustomer],
})
export class BlockModule {}
