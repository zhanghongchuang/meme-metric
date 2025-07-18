// redis key 前缀，有些不需要前缀的，所以不统一配置到module里
export const SOL_REDIS_KEY_PREFIX = 'sol:';
export const BSC_REDIS_KEY_PREFIX = 'bsc:';
export const ROUND_KEY_PREFIX = 'round:';
export const SWAP_KEY_PREFIX = 'swap:';
// 忽略代币：集合
export const SOL_IGNORE_TOKENS = SOL_REDIS_KEY_PREFIX + 'ignore-tokens';

// sol 价格：有序集合
export const SOL_PRICE = SOL_REDIS_KEY_PREFIX + 'price:sol';

// smart token klines 价格：有序集合
export function getSmartTokenKlinesKey(address: string) {
  return `${SOL_REDIS_KEY_PREFIX}smartmoney:klines:${address}`;
}
// smartmoney 标签时间范围
export const SMARTMONE_TAG_STARTTIME =
  SOL_REDIS_KEY_PREFIX + 'smartmoney:tag-starttime';
export const SMARTMONE_TAG_ENDTIME =
  SOL_REDIS_KEY_PREFIX + 'smartmoney:tag-endtime';

// common token: hash, 注意价格格式：`${Date.now()}:${price}`
export function getCommonTokenKey(address: string) {
  return `${SOL_REDIS_KEY_PREFIX}token:${address}`;
}
export function getCommonTokenPriceKey(address: string) {
  return `${SOL_REDIS_KEY_PREFIX}price:${address}`;
}

// smart money 判断标准，每月营收 >=
export const SMARTMONEY_MATCH_AMOUNT =
  SOL_REDIS_KEY_PREFIX + 'smartmoney:match-amount';

export const SMARTMONEY_QUEUE_STOP =
  SOL_REDIS_KEY_PREFIX + 'smartmoney:queue-stop';
export const SMARTMONE_USER_START_ID = `${SOL_REDIS_KEY_PREFIX}smartmoney:user-start-id`;
