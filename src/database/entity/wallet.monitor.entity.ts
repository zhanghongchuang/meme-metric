import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

export const WALLET_MONITOR_UNIQUE_COLUMNS = [
  'privy_id',
  'chain',
  'tracked_wallet_address',
];

@Entity('wallet_monitor')
@Index(WALLET_MONITOR_UNIQUE_COLUMNS, { unique: true })
export class WalletMonitorEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { default: '' })
  privy_id: string;
  @Column('varchar', { default: '' })
  chain: string;

  @Column('varchar', { length: 64, comment: '关注地址', default: '' })
  tracked_wallet_address: string;

  @Column('varchar', { default: '' })
  name: string;

  @Column('varchar', { default: '' })
  emoji: string;

  @Column('tinyint', {
    comment: '开启推送 (否: 0,  是: 1)',
    default: 0,
  })
  is_alerts_on: number;
}
