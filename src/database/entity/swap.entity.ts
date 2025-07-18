import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

export class SwapEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { default: '', comment: '发起人' })
  initiator: string;

  @Column('varchar', { default: '' })
  signature: string;

  @Column('int', { default: 0 })
  router_index: number;

  @Column('int', { default: 0 })
  swap_index: number;

  @Column('int', { default: 0 })
  block: number;

  @Column('int', { default: 0 })
  block_time: number;

  @Column('varchar', { default: '' })
  from_token: string;

  @Column('varchar', { default: '' })
  to_token: string;

  @Column({
    type: 'decimal',
    precision: 28,
    scale: 18,
    default: 0,
    comment: '精度换算后的token数量',
  })
  from_ui_amount: number;

  @Column({
    type: 'decimal',
    precision: 28,
    scale: 18,
    default: 0,
    comment: '精度换算后的token数量',
  })
  to_ui_amount: number;

  @Column('int', { default: 0 })
  from_token_decimals: number;

  @Column('int', { default: 0 })
  to_token_decimals: number;

  @Column({ type: 'decimal', precision: 28, scale: 18, default: 0 })
  from_token_price: number;

  @Column({ type: 'decimal', precision: 28, scale: 18, default: 0 })
  to_token_price: number;
}
