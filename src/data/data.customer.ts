import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  EXCHANGE_NAME,
  SOL_DB_QUEUE_NAME,
} from 'src/config/rabbitMQ';
import { SolSaveService } from './summarySink/sol.save.service';

@Injectable()
export class DataCustomer {
  constructor(
    private readonly solSaveService: SolSaveService,
  ) {}

  @RabbitSubscribe({
    exchange: EXCHANGE_NAME,
    routingKey: SOL_DB_QUEUE_NAME,
    queue: SOL_DB_QUEUE_NAME,
    queueOptions: {
      channel: 'channel-savedb',
    },
    batchOptions: {
      size: 1000,
      timeout: 100,
    },
  })
  async handleSolSaveDb(datas: any[]) {

    try {
      const messages = datas.map((data) => {
        try {
          return JSON.parse(data);
        } catch (error) {
          Logger.error({
            title: this.constructor.name + '-handleSolSaveDb-parse-err',
            data: { data },
            error: {
              data: error?.response?.data ?? [],
              msg: error?.stack ?? error + '',
            },
          });
          return null; // 如果解析失败，返回null
        }
      }).filter((item) => item !== null); // 过滤掉解析失败的项
      datas.length = 0; // 清空datas，避免内存泄漏
      await this.solSaveService.onMessage(messages);
      messages.length = 0; // 清空messages，避免内存泄漏
    } catch (error) {
      Logger.error({
        title: this.constructor.name + '-handleSolSaveDb-err',
        data: { datas: datas.slice(0, 10), length: datas.length },
        error: {
          data: error?.response?.data ?? [],
          msg: error?.stack ?? error + '',
        },
      });
      throw error;
    }
  }

}
