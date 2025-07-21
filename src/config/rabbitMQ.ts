import { Chain } from "./constant";

export const EXCHANGE_NAME = 'memefind';

export const SOL_BLOCK_EXCHANGE_NAME = 'memefind_sol_multi_block';

export const BSC_BLOCK_EXCHANGE_NAME = 'memefind_evm_56_multi_block';

export const QUEUE_PREFIX = 'mm-';

// smartmoney同步
export const SOL_SMARTMONEY_QUEUE_NAME = QUEUE_PREFIX + 'sol_smartmoney_sync';
export const BSC_SMARTMONEY_QUEUE_NAME =
  QUEUE_PREFIX + 'evm_56_smartmoney_sync';
// 入库队列
export const SOL_DB_QUEUE_NAME = QUEUE_PREFIX + 'sol_db_sync';
export const BSC_DB_QUEUE_NAME = QUEUE_PREFIX + 'evm_56_db_sync';
// block同步
export const SOL_BLOCK_QUEUE_NAME = QUEUE_PREFIX + 'sol_multi_block_sync';
export const BSC_BLOCK_QUEUE_NAME = QUEUE_PREFIX + 'evm_56_multi_block_sync';
export const SOL_METRIC_BLOCK_QUEUE_NAME = QUEUE_PREFIX + 'sol_metric_block_sync';
export const BSC_METRIC_BLOCK_QUEUE_NAME = QUEUE_PREFIX + 'evm_56_metric_block_sync';


export const SOL_MEMESTATS_QUEUE_NAME = 'mm-sol-token-queue';
export const BSC_MEMESTATS_QUEUE_NAME = 'mm-bsc-token-queue';


// NetByVolume同步
export const SOL_VOLUME_QUEUE_NAME = QUEUE_PREFIX + 'sol_net_by_volume_sync';
export const BSC_VLOUME_QUEUE_NAME = QUEUE_PREFIX + 'evm_56_net_by_volume_sync';
// pnl更新
export const SOL_PNL_QUEUE_NAME = QUEUE_PREFIX + 'sol_pnl_sync';
export const BSC_PNL_QUEUE_NAME = QUEUE_PREFIX + 'evm_56_pnl_sync';

// smartmoney标签
export const SMARTMONEY_TAG_QUEUE_NAME = QUEUE_PREFIX + 'smartmoney_tag_sync';

// smart token klines同步
export const SMARTMONEY_TOKEN_KLINES_QUEUE_NAME =
  QUEUE_PREFIX + 'smartmoney_token_klines';

export const MQ_CFG_MAP = {
  [Chain.BSC]: {
    'blockQueueCfg': {
      exchange: EXCHANGE_NAME,
      queue: BSC_SMARTMONEY_QUEUE_NAME
    },
    'pnlQueueCfg': {
      exchange: EXCHANGE_NAME,
      queue: BSC_PNL_QUEUE_NAME
    }
  },
  [Chain.SOLANA]: {
    'queueCfg': {
      exchange: EXCHANGE_NAME,
      queue: SOL_SMARTMONEY_QUEUE_NAME
    },
    'pnlQueueCfg': {
      exchange: EXCHANGE_NAME,
      queue: SOL_PNL_QUEUE_NAME
    }
  }
}