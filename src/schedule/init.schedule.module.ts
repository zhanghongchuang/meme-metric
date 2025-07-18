import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SmartMoneyScheduleService } from './smart-money/smart.money.schedule.service';
import { BscNewWalletSchedule } from './new-wallet/bsc.new-wallet.schedule';
import { SolNewWalletSchedule } from './new-wallet/sol.new-wallet.schedule';
import { BscSmartMoneySchedule } from './smart-money/bsc.smart.monry.schedule';
import { SolSmartMoneySchedule } from './smart-money/sol.smart.money.schedule';
import { FixBuySellCountCommand } from './smart-money/fix-buy-sell-count';
import { SolAnalysisScheduleService } from './analysis/sol.analysis.schedule';
import { BscAnalysisScheduleService } from './analysis/bsc.analysis.schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // BullModule.registerQueueAsync(createMemeQueueConfig('mm-sol-pnl', 'memestats')),
    // BullModule.registerQueueAsync(createMemeQueueConfig('mm-evm-56-pnl', 'memestats_bsc')),
  ],
  providers: [BscNewWalletSchedule, SolNewWalletSchedule,
     BscSmartMoneySchedule, SolSmartMoneySchedule, FixBuySellCountCommand,
     SolAnalysisScheduleService
  ],
})
export class InitScheduleModule {}
