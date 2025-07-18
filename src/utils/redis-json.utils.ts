import { Redis } from 'ioredis';

export class RedisJsonUtils {
  /**
   * 获取 JSON 对象
   */
  static async get<T>(redis: Redis, key: string, path: string = '$'): Promise<T | null> {
    const result = await redis.call('JSON.GET', key, path);
    if (!result) {
      return null;
    }
    return JSON.parse(result as string) as T;
  }

  /**
   * 设置 JSON 对象
   */
  static async set(redis: Redis, key: string, path: string, value: unknown): Promise<void> {
    await redis.call('JSON.SET', key, path, JSON.stringify(value));
  }
}
