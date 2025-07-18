/**
 * 定义支持的区块链类型
 */
export const CHAIN_NAMES = {
  SOL: 'sol',
  BSC: 'bsc',
} as const;

/**
 * 区块链类型
 */
export type ChainName = (typeof CHAIN_NAMES)[keyof typeof CHAIN_NAMES];

/**
 * 获取所有支持的区块链类型数组
 */
export const getSupportedChains = (): ChainName[] => {
  return Object.values(CHAIN_NAMES);
};

/**
 * 检查是否为支持的区块链类型
 */
export const isSupportedChain = (chain: string): chain is ChainName => {
  return getSupportedChains().includes(chain as ChainName);
};
