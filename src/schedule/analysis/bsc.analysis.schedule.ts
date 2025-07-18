import { Inject, Injectable } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@zqlc/redis";
import { BscSwapEntity } from "src/database/entity/bsc.swap.entity";
import { Chain } from "src/config/constant";


@Injectable()
export class BscAnalysisScheduleService extends AnalysisService<BscSwapEntity> {

  constructor(
    @Inject('bsc') readonly targetDatasource: DataSource,
    @Inject('sol') readonly monitorDatasource: DataSource,
    readonly configService: ConfigService,
    readonly redisService: RedisService,
  ) {
    super(BscSwapEntity);
    this.chain = Chain.BSC;
    this.redis = this.redisService.getClient('target');
    this.ignoreTokens = this.configService.get<string[]>('BscIgnoreToken') ?? [];
  }

}