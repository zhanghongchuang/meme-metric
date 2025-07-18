import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';


@Entity('token_stats')
export class TokenStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { default: '' })
  token_address: string;

  @Column('varchar', { default: '' })
  wallet_tag: string;

  @Column('int', { default: 0 })
  create_time: number;

  @Column('int', { default: 0 })
  holders: number;

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
    comment: '净买入金额',
    default: 0,
  })
  net_buy_volume: number;

  @Column('decimal', {
    precision: 36,
    scale: 18,
    comment: '市值',
    default: 0,
  })
  mcap: number;

  @Column('int', { default: 0, comment: '统计时间' })
  stats_time: number;

  
  @Column('int', { default: 0, comment: '类型' })
  dex: number;

  @Column('int', { default: 0 })
  buy_tx: number;

  @Column('int', { default: 0 })
  sell_tx: number;

  @Column('int', { default: 0 })
  net_buy_tx: number;

}
