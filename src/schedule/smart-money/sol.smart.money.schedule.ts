import { Inject, Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { RedisService } from "@zqlc/redis";
import { SmartMoneyScheduleService } from "./smart.money.schedule.service";
import { Chain } from "src/config/constant";


@Injectable()
export class SolSmartMoneySchedule extends SmartMoneyScheduleService{
  
    constructor(
        @Inject('sol') private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
      ) {
        super()
        this.datasource = this.dataSource;
        this.redis = this.redisService.getClient('target');
        this.chain = Chain.SOLANA;
      }
}