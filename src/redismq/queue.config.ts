import { RegisterQueueAsyncOptions } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 获取队列的通用配置
 * @param configService 配置服务
 * @returns BullMQ队列配置
 */
export const createMemeQueueConfig = (
  name: string,
  configName: string,
): RegisterQueueAsyncOptions => ({
  name,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    connection: (() => {
      const config = { ...configService.get(configName) };
      delete config.keyPrefix;
      return config;
    })(),
    prefix: configService.get(configName).keyPrefix,
    defaultJobOptions: {
      removeOnComplete: true
    },
  }) as RegisterQueueAsyncOptions,
});
