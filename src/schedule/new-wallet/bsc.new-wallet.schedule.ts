import { Inject, Injectable } from "@nestjs/common";
import { NewWalletScheduleService } from "./new-wallet.schedule";
import { DataSource } from "typeorm";
import { RedisService } from "@zqlc/redis";
import { Chain } from "src/config/constant";


@Injectable()
export class BscNewWalletSchedule extends NewWalletScheduleService{
  
    constructor(
        @Inject('bsc') private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
      ) {
        super()
        this.datasource = this.dataSource;
        this.redis = this.redisService.getClient('target');
        this.commonRedis = this.redisService.getClient('bsc_json');
        this.chain = Chain.BSC;
      }
}