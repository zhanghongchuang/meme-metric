import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('transfers')
export class TransfersEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { default: '' })
  signature: string;

  @Column('int', { default: 0 })
  router_index: number;

  @Column('int', { default: 0 })
  transfers_index: number;

  @Column('int', { default: 0 })
  block: number;

  @Column('int', { default: 0 })
  block_time: number;

  @Column('varchar', { default: '' })
  from_address: string;

  @Column('varchar', { default: '' })
  to_address: string;
}
