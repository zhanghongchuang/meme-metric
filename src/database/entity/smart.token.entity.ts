import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

export const SMART_TOKEN_UNIQUE_COLUMNS = ['wallet_address', 'token_address'];
export const SMART_TOKEN_INDEX_COLUMNS = [
  'wallet_address',
  'token_address',
  'realized_pnL',
];
export const SMART_TOKEN_FIELDS = [
  'updated_at',
  'wallet_address',
  'symbol',
  'token_address',
  'total_buy_volume',
  'total_sell_volume',
  'total_buy_amount',
  'total_sell_amount',
  'realized_pnL',
  'last_buy_time',
  'last_active_time',
  'buy_count',
  'sell_count',
  'total_sold_cost',
  'holding_duration',
  'round_count',
  'transfer_in_amount',
  'transfer_out_amount',
];

@Entity('smart_token_v2')
@Index(SMART_TOKEN_UNIQUE_COLUMNS, { unique: true })
@Index(SMART_TOKEN_INDEX_COLUMNS, { unique: false })
export class SmartTokenEntity extends CommonEntity {
  @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
  wallet_address: string;

  @PrimaryColumn('varchar', { length: 64, comment: '代币地址', default: '' })
  token_address: string;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '总买入金额',
    default: 0,
  })
  total_buy_volume: number;
  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '总卖出金额',
    default: 0,
  })
  total_sell_volume: number;
  @Column('decimal', {
    precision: 65,
    scale: 18,
    comment: '总买入数量',
    default: 0,
  })
  total_buy_amount: number;
  @Column('decimal', {
    precision: 65,
    scale: 18,
    comment: '总卖出数量',
    default: 0,
  })
  total_sell_amount: number;

  @Column('decimal', {
    precision: 65,
    scale: 18,
    comment: '转入数量',
    default: 0,
  })
  transfer_in_amount: number;

  @Column('decimal', {
    precision: 65,
    scale: 18,
    comment: '转出数量',
    default: 0,
  })
  transfer_out_amount: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '已实现收益',
    default: 0,
  })
  realized_pnL: number;
  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '每笔卖出操作的买入成本，用于计算已实现收益率',
    default: 0,
  })
  total_sold_cost: number;
  @Column('int', { comment: '最近买入时间', default: 0 })
  last_buy_time: number;
  @Column('int', { comment: '最近活动时间', default: 0 })
  last_active_time: number;
  @Column('int', { comment: '买入次数', default: 0 })
  buy_count: number;
  @Column('int', { comment: '卖出次数', default: 0 })
  sell_count: number;
  @Column('int', { comment: '持仓时长', default: 0 })
  holding_duration: number;
  @Column('int', { comment: '持仓轮次', default: 0 })
  round_count: number;
}
