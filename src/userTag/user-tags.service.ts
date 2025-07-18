import { Injectable, Logger } from '@nestjs/common';
import { ChainName } from 'src/common/constants/chain.constants';
import { UserTag, AddUserTagToTokenParams, TokenUserTags, UserTagsKeyGenerator } from 'src/userTag/user-tags.type';
import { RedisJsonUtils } from 'src/utils/redis-json.utils';
import Redis from 'ioredis';
import { MeasureTime } from 'src/utils/helper';

// @Injectable()
export class UserTagsService {
  private readonly logger = new Logger(UserTagsService.name);
  private jsonRedis: Redis;
  private chainName: ChainName;

  constructor(
    jsonRedis: Redis,
    chainName: ChainName,
  ) {
    this.chainName = chainName;
    this.jsonRedis = jsonRedis;
  }

  /**
 * 批量添加用户标签到代币
 */
async addUserTagsToTokenBatch(params: {
  tokenAddress: string;
  walletAddresses: string[];
  tag: UserTag;
}): Promise<void> {
  const { tokenAddress, walletAddresses, tag } = params;
  
  if (!walletAddresses.length) {
    return;
  }
  const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
  await this.jsonRedis.sadd(key, ...walletAddresses);

}

async addUserTagToToken(params: AddUserTagToTokenParams): Promise<void> {
    const { tokenAddress, walletAddress, tag } = params;
    try {
      const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
      await this.jsonRedis.sadd(key, walletAddress);
    } catch (error) {
      this.logger.error(`Add user tag to token failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Remove a user tag from a token using Redis Set.
   */
  async removeUserTagFromToken(params: AddUserTagToTokenParams): Promise<void> {
    const { tokenAddress, walletAddress, tag } = params;
    try {
      const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
      await this.jsonRedis.srem(key, walletAddress);
    } catch (error) {
      this.logger.error(`Remove user tag from token failed: ${error.message}`, error.stack);
      throw error;
    }
  }
/**
 * 批量删除用户标签
 */
async removeUserTagsFromTokenBatch(params: {
  tokenAddress: string;
  walletAddresses: string[];
  tag: UserTag;
}): Promise<void> {
  const { tokenAddress, walletAddresses, tag } = params;  
  if (!walletAddresses.length) {
    return;
  }
  const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
  await this.jsonRedis.srem(key, ...walletAddresses);
}

  /**
   * Get all user addresses for a token with a specific tag.
   */
  async getUserAddressesByTag(tokenAddress: string, tag: UserTag): Promise<string[]> {
    try {
      const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
      return await this.jsonRedis.smembers(key);
    } catch (error) {
      this.logger.error(`Get user addresses by tag failed: ${error.message}`, error.stack);
      return [];
    }
  }

  @MeasureTime()
  async getUserAddressesByTags(tokenAddress: string, tags: UserTag[]): Promise<Record<UserTag, string[]>> {
    try {
      const pipeline = this.jsonRedis.pipeline();

      tags.forEach((tag) => {
        const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
        pipeline.smembers(key);
      });

      const results = await pipeline.exec();
      const addressesByTag: Record<UserTag, string[]> = {} as Record<UserTag, string[]>;

      tags.forEach((tag, index) => {
        const result = results?.[index];
        addressesByTag[tag] = result && result[0] === null ? (result[1] as string[]) : [];
      });

      return addressesByTag;
    } catch (error) {
      this.logger.error(`Get user addresses by tags failed: ${error.message}`, error.stack);
      return tags.reduce((acc, tag) => ({ ...acc, [tag]: [] }), {} as Record<UserTag, string[]>);
    }
  }

  async hasUserTag(tokenAddress: string, walletAddress: string, tag: UserTag): Promise<boolean> {
    try {
      const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
      const result = await this.jsonRedis.sismember(key, walletAddress);
      return result === 1;
    } catch (error) {
      this.logger.error(`Check user tag failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async getUserTags(tokenAddress: string, walletAddress: string): Promise<UserTag[]> {
    try {
      const pipeline = this.jsonRedis.pipeline();
      const allTags = Object.values(UserTag);

      allTags.forEach((tag) => {
        const key = UserTagsKeyGenerator.generateTagKey(tokenAddress, tag);
        pipeline.sismember(key, walletAddress);
      });

      const results = await pipeline.exec();
      const userTags: UserTag[] = [];

      allTags.forEach((tag, index) => {
        const result = results?.[index];
        if (result && result[0] === null && result[1] === 1) {
          userTags.push(tag);
        }
      });

      return userTags;
    } catch (error) {
      this.logger.error(`Get user tags failed: ${error.message}`, error.stack);
      return [];
    }
  }
}
