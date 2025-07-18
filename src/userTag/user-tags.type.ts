import { ChainName } from 'src/common/constants/chain.constants';


export class UserTagsKeyGenerator {
  private static readonly USER_TAGS_PREFIX = 't';

  /**
   * Generate Redis key for specific tag set.
   * Format: user-tags:${tokenAddress}:${tag}
   */
  static generateTagKey(tokenAddress: string, tag: UserTag): string {
    return `${this.USER_TAGS_PREFIX}:${tokenAddress}:${tag}`;
  }
}

/**
 * Enum for user tags.
 */
export enum UserTag {
  SNIPER = 's',
  BUNDLER = 'b',
  INSIDER = 'i',
  INSIDER_DEV = 'id',
}

/**
 * Redis JSON structure for string array version.
 */
export interface TokenUserTags {
  users: Record<string, UserTag[]>;
  tagCounts: Record<UserTag, number>;
}

/**
 * Params for adding a user tag to a token.
 */
export interface AddUserTagToTokenParams {
  // readonly chainName: ChainName;
  readonly tokenAddress: string;
  readonly walletAddress: string;
  readonly tag: UserTag;
}

/**
 * Add a tag to the user's tag array.
 */
export function addUserTag(tags: readonly UserTag[], tag: UserTag): UserTag[] {
  return tags.includes(tag) ? [...tags] : [...tags, tag];
}

/**
 * Remove a tag from the user's tag array.
 */
export function removeUserTag(tags: readonly UserTag[], tag: UserTag): UserTag[] {
  return tags.filter((t) => t !== tag);
}

/**
 * Check if the user's tag array contains a tag.
 */
export function hasUserTag(tags: readonly UserTag[], tag: UserTag): boolean {
  return tags.includes(tag);
}

/**
 * Get all tags from a user's tag array.
 */
export function getUserTags(tags: readonly UserTag[]): readonly UserTag[] {
  return tags;
}
