import { Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "@zqlc/redis";
import { SmartMoneyScheduleService } from "./smart.money.schedule.service";
import { Chain } from "src/config/constant";


@Injectable()
export class BscSmartMoneySchedule extends SmartMoneyScheduleService{
  
    constructor(
        @Inject('bsc') private readonly dataSource: DataSource,
        private readonly redisService: RedisService,
      ) {
        super()
        this.datasource = this.dataSource;
        this.redis = this.redisService.getClient('target');
        this.chain = Chain.BSC;
      }
}