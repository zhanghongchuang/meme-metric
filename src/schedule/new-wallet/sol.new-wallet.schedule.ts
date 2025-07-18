import { Inject, Injectable } from "@nestjs/common";
import { NewWalletScheduleService } from "./new-wallet.schedule";
import { DataSource, In } from "typeorm";
import { RedisService } from "@zqlc/redis";
import { Chain } from "src/config/constant";


@Injectable()
export class SolNewWalletSchedule extends NewWalletScheduleService{
  
    constructor(
        @Inject('sol') private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
      ) {
        super()
        this.datasource = this.dataSource;
        this.redis = this.redisService.getClient('target');
        this.commonRedis = this.redisService.getClient('sol_json');
        this.chain = Chain.SOLANA;
      }
}