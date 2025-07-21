import { DailyInfo, MqMessage, RoundResultStatsInfo, SummaryResult, TokenInfo, UserInfo } from '../common/struct';
import { DataSource } from 'typeorm';
import {
    consoleLogger,
  MeasureTime,
} from 'src/utils/helper';
import { CustomLogger } from 'src/utils/logger.service';
import { DbHelper } from '../utils/db.helper';

export class DataSaveManager {
  datasource: DataSource;
  chain: string;
  private logger = new CustomLogger();

  clearSummaryResult(result: SummaryResult) {
    result.dailyInfo.clear(); // 清空dailyInfo，避免内存泄漏
    result.tokenInfo.clear(); // 清空tokenInfo，避免内存泄漏
    result.latestRoundResultsMap.clear(); // 清空latestRoundResultsMap，避免内存泄漏
    result.roundResultStatsInfo.clear(); // 清空roundResultStatsInfo，避免内存泄漏
    // result.userInfo = null; // 清空userInfo，避免内存泄漏
  }


  @MeasureTime()
  async onMessage(messages: MqMessage[]){
    if (!messages || messages.length === 0) {
      this.logger.warn('No messages to process');
      return;
    }
    this.logger.log(`Processing ${messages.length} db messages`);
    const resultMap = new Map<string, SummaryResult>();
    let total = 0;
    messages.forEach((message) => {
        let walletKey = 'wallet_address';
        let cls;
        if (message.type === 'userInfo') {
            cls = UserInfo;
        } else if (message.type === 'tokenInfo') {
            cls = TokenInfo;
        } else if (message.type === 'dailyInfo') {
            cls = DailyInfo;
        } else if (message.type === 'roundResultStatsInfo') {
            cls = RoundResultStatsInfo;
        } else {
            console.error(`Unknown message type: ${message.type}`);
            return;
        }
        message.data.forEach((result) => {
            let summaryResult = resultMap.get(result[walletKey]);
            if (!summaryResult) {
                summaryResult = new SummaryResult(result[walletKey]);
                resultMap.set(result[walletKey], summaryResult);
            }
            const obj = cls.copy(result);
            total++;
            if (message.type === 'userInfo') {
                const existingValue = summaryResult.userInfo;
                if (existingValue) {
                    existingValue.merge(existingValue, obj);
                } else {
                    summaryResult.userInfo = obj;
                }
            } else {
                const existingValue = summaryResult[message.type].get(obj.getUniqueKey());
                if (existingValue) {
                    existingValue.merge(existingValue, obj);
                } else {
                    summaryResult[message.type].set(obj.getUniqueKey(), obj);
                }
            }
        });
        message.data.length = 0;
    });
    await this.batchSaveToDB(Array.from(resultMap.values()));
  }

  async batchSaveToDB(data: SummaryResult[]) {
    if (data.length == 0) {
        return;
    }
    const userInfos: any[] = [];
    const tokenInfos: any[] = [];
    const dailyInfos: any[] = [];
    const allRoundResultStatsInfos: any[] = [];
    
    for (const result of data) {
        if (result.userInfo) {
            userInfos.push(result.userInfo);
        }
        tokenInfos.push(...result.tokenInfo.values());
        dailyInfos.push(...result.dailyInfo.values());
        allRoundResultStatsInfos.push(...result.roundResultStatsInfo.values());
        this.clearSummaryResult(result); // Clear the result to free memory
    }
    data.length = 0; // Clear the data array to free memory
    await DbHelper.executeWithRetry(
        async () => {
            try{
                await this.datasource.transaction(async (manager) => {
                    await DbHelper.saveSummaryToDB(
                        manager,
                        userInfos,
                        tokenInfos,
                        dailyInfos,
                        allRoundResultStatsInfos,
                    );
                });
            } catch (error) {
                consoleLogger(
                    '',
                    `Error in batchSaveToDB: ${error.message}, chain: ${this.chain}`,
                    'saveDBErr',
                )
            }
            
        }
    );
    console.log(`batchSaveToDB: ${userInfos.length + tokenInfos.length + dailyInfos.length + allRoundResultStatsInfos.length}`);
    userInfos.length = 0; // Clear the userInfos array to free memory
    tokenInfos.length = 0; // Clear the tokenInfos array to free memory
    dailyInfos.length = 0; // Clear the dailyInfos array to free memory
    allRoundResultStatsInfos.length = 0; // Clear the allRoundResultStatsInfos array to free memory
  }

}
