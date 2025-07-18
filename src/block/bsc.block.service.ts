import { RedisService } from '@zqlc/redis';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';
import { Inject, Injectable } from '@nestjs/common';
import { BSC_MEMESTATS_QUEUE_NAME, BSC_SMARTMONEY_QUEUE_NAME, EXCHANGE_NAME } from 'src/config/rabbitMQ';
import { ConfigService } from '@nestjs/config';
import { BlockHandle } from './block.handle';
import { UserTagsService } from 'src/userTag/user-tags.service';
import { CHAIN_NAMES } from 'src/common/constants/chain.constants';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { AliOssService } from 'src/plugins/alioss.service';
import { Chain } from 'src/config/constant';

@Injectable()
export class BscBlockService extends BlockHandle {
  constructor(
    readonly redisService: RedisService,
    readonly rabbitmqService: RabbitMQService,
    readonly configService: ConfigService,
    @Inject('bsc_source') readonly datasource: DataSource,
    @Inject('bsc') readonly targetDatasource: DataSource,
    @InjectQueue(BSC_MEMESTATS_QUEUE_NAME) readonly queue: any,
    readonly ossClient: AliOssService,
  ) {
    super();
    this.userTagService = new UserTagsService(redisService.getClient('bsc_json'), CHAIN_NAMES.BSC);
    this.rabbitmq = rabbitmqService;
    this.redis = redisService.getClient('bsc');
    this.targetRedis = this.redisService.getClient('target');
    this.commonRedis = this.redisService.getClient('bsc_common');
    this.memeRedis = this.redisService.getClient('bsc_meme');
    this.bundleSize = this.configService.get<number>('BundleSize') ?? 4;
    this.chain = Chain.BSC;
    this.mqExchange = EXCHANGE_NAME;
    this.mqQueue = BSC_SMARTMONEY_QUEUE_NAME;
    this.ignoreTokens = this.configService.get<string[]>('BscIgnoreToken') ?? [];
    
  }
}
