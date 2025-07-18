import { OnModuleDestroy } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

export class ClickHouseService implements OnModuleDestroy {
  private client: ClickHouseClient;

  constructor(clickhouseConfig: any) {
    
    this.client = createClient({
      host: `http://${clickhouseConfig?.host || 'localhost'}:${clickhouseConfig?.port || 8123}`,
      username: clickhouseConfig?.username || 'default',
      password: clickhouseConfig?.password || '',
      database: clickhouseConfig?.database || 'default',
      compression: {
        request: true,
        response: true,
      },
      clickhouse_settings: {
        async_insert: 1,
        wait_for_async_insert: 0,
      },
    });
  }

  async query<T = any>(sql: string, params?: Record<string, any>): Promise<T[]> {
    try {
      const result = await this.client.query({
        query: sql,
        query_params: params,
        format: 'JSONEachRow',
      });
      return await result.json<T>();
    } catch (error) {
      console.error('ClickHouse query error:', error);
      throw error;
    }
  }

  async insert(table: string, data: any[]): Promise<void> {
    try {
      await this.client.insert({
        table,
        values: data,
        format: 'JSONEachRow',
      });
    } catch (error) {
      console.error('ClickHouse insert error:', error);
      throw error;
    }
  }

  async command(sql: string): Promise<void> {
    try {
      await this.client.command({ query: sql });
    } catch (error) {
      console.error('ClickHouse command error:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  getClient(): ClickHouseClient {
    return this.client;
  }
}