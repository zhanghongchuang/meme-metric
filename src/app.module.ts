import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@zqlc/redis';
import configuration from './config/configuration';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { BlockModule } from './block/block.module';
import { DatabaseModule } from './database/database.module';
import { InitScheduleModule } from './schedule/init.schedule.module';
import { PluginsModule } from './plugins/plugin.module';

@Module({
  imports: [
    // 配置
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // redis
    RedisModule.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
        return {
          clientOptions: [
            {
              options: configService.get('bsc_redis'),
              name: 'bsc',
            },
            {
              options: configService.get('target_redis'),
              name: 'target',
            },
            {
              options: configService.get('sol_redis'),
              name: 'sol',
            },
            {
              name: 'sol_common',
              options: configService.get('sol_redis_common'),
            },
            {
              name: 'bsc_common',
              options: configService.get('bsc_redis_common'),
            },
            {
              name: 'sol_json',
              options: configService.get('sol_redis_json'),
            },
            {
              name: 'bsc_json',
              options: configService.get('bsc_redis_json'),
            },
            {
              name: 'sol_meme',
              options: configService.get('sol_redis_meme'),
            },
            {
              name: 'bsc_meme',
              options: configService.get('bsc_redis_meme'),
            },
          ],
        };
      },
      inject: [ConfigService],
    }),
    PluginsModule,
    DatabaseModule,
    RabbitmqModule,
    BlockModule,
    InitScheduleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
