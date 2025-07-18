import { Inject, Injectable } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";
import { SolSwapEntity } from "src/database/entity/sol.swap.entity";
import { DataSource } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "@zqlc/redis";
import { Chain } from "src/config/constant";
import { ClickHouseService } from "src/database/clickhouse.service";


@Injectable()
export class SolAnalysisScheduleService extends AnalysisService<SolSwapEntity> {

  constructor(
    @Inject('sol') readonly targetDatasource: DataSource,
    readonly configService: ConfigService,
    readonly redisService: RedisService,
  ) {
    super(SolSwapEntity);
    this.chain = Chain.SOLANA;
    this.monitorDatasource = targetDatasource;
    this.clickhouseService = new ClickHouseService(this.configService.get('sol_clickhouse'));
    this.redis = this.redisService.getClient('target');
    this.ignoreTokens = this.configService.get<string[]>('SolIgnoreToken') ?? [];
  }

}