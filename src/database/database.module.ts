import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';
import { SmartUserEntity } from './entity/smart.user.entity';
import { TokenStatsEntity } from './entity/token.stats.entity';
import { TransfersEntity } from './entity/transfers.entity';
import { SmartUserDailyEntity } from './entity/smart.user.daily.entity';
import { SmartUserDaily4hEntity } from './entity/smart.user.daily.4h.entity';
import { AnalysisSwapEntity } from './entity/analysis.swap.entity';
import { AnalysisSwapEntity1D } from './entity/analysis.swap.1d.entity';
import { AnalysisSwapEntity1H } from './entity/analysis.swap.1h.entity';
import { AnalysisSwapEntity1M } from './entity/analysis.swap.1m.entity';
import { SolSwapEntity } from './entity/sol.swap.entity';
import { BscSwapEntity } from './entity/bsc.swap.entity';
import { WalletMonitorEntity } from './entity/wallet.monitor.entity';
import { KOLInfoEntity } from './entity/kol.info.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'sol',
      useFactory: (configService: ConfigService) =>
        configService.get('sol_mysql') || {},
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'bsc',
      useFactory: (configService: ConfigService) =>
        configService.get('bsc_mysql') || {},
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'sol_source',
      useFactory: (configService: ConfigService) =>
        configService.get('sol_source_mysql') || {},
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'bsc_source',
      useFactory: (configService: ConfigService) =>
        configService.get('bsc_source_mysql') || {},
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [SmartUserEntity,
         TokenStatsEntity, TransfersEntity, SmartUserDailyEntity, SmartUserDaily4hEntity,
          AnalysisSwapEntity, AnalysisSwapEntity1D, AnalysisSwapEntity1H, AnalysisSwapEntity1M, SolSwapEntity,
          WalletMonitorEntity, KOLInfoEntity
        ],
      'sol',
    ),
    TypeOrmModule.forFeature(
      [SmartUserEntity,
        TokenStatsEntity, TransfersEntity, SmartUserDailyEntity, SmartUserDaily4hEntity,
        AnalysisSwapEntity, AnalysisSwapEntity1D, AnalysisSwapEntity1H,
        AnalysisSwapEntity1M, BscSwapEntity, KOLInfoEntity
    ],
      'bsc',
    ),
    TypeOrmModule.forFeature(
      [SmartUserEntity, TokenStatsEntity],
      'bsc_source',
    ),
    TypeOrmModule.forFeature(
      [SmartUserEntity, TokenStatsEntity],
      'sol_source',
    ),
  ],
  providers: [
    {
      provide: 'sol',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken('sol')],
    },
    {
      provide: 'bsc',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken('bsc')],
    },
    {
      provide: 'sol_source',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken('sol_source')],
    },
    {
      provide: 'bsc_source',
      useFactory: (dataSource: DataSource) => dataSource,
      inject: [getDataSourceToken('bsc_source')],
    },
  ],
  exports: ['sol', 'bsc', 'sol_source', 'bsc_source'],
})
export class DatabaseModule {}
