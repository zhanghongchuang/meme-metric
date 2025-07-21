import { Entity, Column, Index, PrimaryColumn } from 'typeorm';
import { CommonEntity } from './common.entity';
export const SMART_TOKEN_ROUND_RESULT_STATS_UNIQUE_COLUMNS = [
  'wallet_address',
  'date',
];

export const SMART_TOKEN_ROUND_RESULT_STATS_COLUMNS = [
  'updated_at',
  'wallet_address',
  'date',
  'greater_than_5',
  'between_2_and_5',
  'between_0_and_2',
  'between_neg_0_5_and_0',
  'less_than_neg_0_5',
];

@Entity('smart_token_round_result_stats')
@Index(SMART_TOKEN_ROUND_RESULT_STATS_UNIQUE_COLUMNS, { unique: true })
export class SmartTokenRoundResultStatsEntity extends CommonEntity {
  @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
  wallet_address: string;

  @PrimaryColumn('int', { comment: '日期', default: null })
  date: number;

  @Column('int', { comment: '大于500%', default: 0 })
  greater_than_5: number;
  @Column('int', { comment: '200%-500%', default: 0 })
  between_2_and_5: number;
  @Column('int', { comment: '0-200%', default: 0 })
  between_0_and_2: number;
  @Column('int', { comment: '-50%-0', default: 0 })
  between_neg_0_5_and_0: number;
  @Column('int', { comment: '<50%', default: 0 })
  less_than_neg_0_5: number;
}
