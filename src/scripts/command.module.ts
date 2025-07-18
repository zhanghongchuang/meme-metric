import { Module } from '@nestjs/common';
import { ExportStatsCommand } from './export-stats.command';
import { ConfigModule } from '@nestjs/config';
import { PluginsModule } from '../plugins/plugin.module';
import { DatabaseModule } from '../database/database.module';
import configuration from '../config/configuration';
import { FixBuySellCountCommand } from './fix-buy-sell-count';


@Module({
  imports: [
    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [configuration],
      }
    ),
    // 其他必要的模块
    PluginsModule,
    DatabaseModule
  ],
  providers: [ExportStatsCommand, FixBuySellCountCommand],
})
export class CommandModule {}