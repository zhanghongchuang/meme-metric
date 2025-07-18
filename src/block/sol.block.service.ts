import { RedisService } from '@zqlc/redis';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { Injectable, Inject } from '@nestjs/common';
import { SOL_IGNORE_TOKENS } from 'src/config/redis.key';
import {
  EXCHANGE_NAME,
  SOL_MEMESTATS_QUEUE_NAME,
  SOL_SMARTMONEY_QUEUE_NAME,
} from 'src/config/rabbitMQ';
import { ConfigService } from '@nestjs/config';
import { BlockHandle } from './block.handle';
import { UserTagsService } from 'src/userTag/user-tags.service';
import { CHAIN_NAMES } from 'src/common/constants/chain.constants';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { AliOssService } from 'src/plugins/alioss.service';
import { Chain } from 'src/config/constant';

@Injectable()
export class SolBlockService extends BlockHandle {
  constructor(
    readonly redisService: RedisService,
    readonly rabbitmqService: RabbitMQService,
    readonly configService: ConfigService,
    @Inject('sol') readonly targetDatasource: DataSource,
    @Inject('sol_source') readonly datasource: DataSource,
    @InjectQueue(SOL_MEMESTATS_QUEUE_NAME) readonly queue: any,
    readonly ossClient: AliOssService,
  ) {
    super();
    this.userTagService = new UserTagsService(redisService.getClient('sol_json'), CHAIN_NAMES.SOL);
    this.rabbitmq = rabbitmqService;
    this.redis = redisService.getClient('sol');
    this.targetRedis = this.redisService.getClient('target');
    this.commonRedis = this.redisService.getClient('sol_common');
    this.memeRedis = this.redisService.getClient('sol_meme');
    this.bundleSize = this.configService.get<number>('BundleSize') ?? 4;
    this.chain = Chain.SOLANA;
    this.ignoreTokenKey = SOL_IGNORE_TOKENS;
    this.mqExchange = EXCHANGE_NAME;
    this.mqQueue = SOL_SMARTMONEY_QUEUE_NAME;
    this.ignoreTokens = this.configService.get<string[]>('SolIgnoreToken') ?? [];
    console.log('SolBlockService initialized with chain:', this.chain, this.ignoreTokens);
  }
}
