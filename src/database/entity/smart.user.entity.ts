import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

export const SMART_USER_UNIQUE_COLUMNS = ['wallet_address'];

@Entity('smart_users_v2')
@Index(SMART_USER_UNIQUE_COLUMNS, { unique: true })
export class SmartUserEntity extends CommonEntity {
  @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
  wallet_address: string;

  @Column('varchar', { comment: '标签（用|包裹起来）', default: '' })
  tag: string;

  @Column('tinyint', { comment: '是否为smartmoney钱包', default: 0 })
  is_smart: number;

  @Column('tinyint', {
    comment: '状态 (default: 0,  finished: 1)',
    default: 0,
  })
  sync_status: number;

  @Column('tinyint', {
    comment: '黑名单用户 (否: 0,  是: 1)',
    default: 0,
  })
  is_black: number;

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
    comment: '买入总数量',
    default: 0,
  })
  total_buy_amount: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '卖出总数量',
    default: 0,
  })
  total_sell_amount: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '已实现收益',
    default: 0,
  })
  realized_pnL: number;

  @Column('int', { comment: '买入次数', default: 0 })
  buy_count: number;

  @Column('int', { comment: '卖出次数', default: 0 })
  sell_count: number;

  @Column('int', { comment: '最近活跃时间', default: 0 })
  last_active_time: number;

  @Column('int', { comment: '同步swap表ID', default: 0 })
  sync_id: number;
  
  @Column('int', { comment: '创建时间', default: 0 })
  create_time: number;
}
