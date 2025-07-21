import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { CommonEntity } from './common.entity';
import { Index } from 'typeorm';

export const SMART_USER_DAILY_UNIQUE_COLUMNS = [
  'wallet_address',
  'token_address',
  'buy_date',
];
export const SMART_USER_DAILY_COLUMNS_WALLET_ADDRESS_BUY_DATE = [
  'wallet_address',
  'buy_date',
];
export const SMART_USER_DAILY_FIELDS = [
  'updated_at',
  'wallet_address',
  'token_address',
  'buy_date',
  'buy_count',
  'sell_count',
  'total_buy_volume',
  'total_sell_volume',
  'realized_pnL',
  'total_sold_cost',
];

@Entity('smart_user_daily')
@Index(SMART_USER_DAILY_COLUMNS_WALLET_ADDRESS_BUY_DATE)
@Index(SMART_USER_DAILY_UNIQUE_COLUMNS, { unique: true })
export class SmartUserDailyEntity extends CommonEntity {
  @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
  wallet_address: string;

  @PrimaryColumn('varchar', { length: 64, comment: 'token地址', default: '' })
  token_address: string;

  @PrimaryColumn('int', { comment: '买入日期', nullable: false })
  buy_date: number;

  @Column('int', { comment: '买入次数', default: 0 })
  buy_count: number;

  @Column('int', { comment: '卖出次数', default: 0 })
  sell_count: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '买入总金额',
    default: 0,
  })
  total_buy_volume: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '卖出总金额',
    default: 0,
  })
  total_sell_volume: number;
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
}
