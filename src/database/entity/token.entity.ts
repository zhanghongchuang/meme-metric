import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

export const TOKENS_UNIQUE_COLUMNS = ['address'];

@Entity('tokens')
@Index(TOKENS_UNIQUE_COLUMNS, { unique: true })
export class TokenEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { default: '' })
  address: string;

  @Column('varchar', { default: '' })
  name: string;

  @Column('varchar', { default: '' })
  symbol: string;

  @Column('int', { default: 0 })
  decimals: number;

  @Column('int', { default: 0 })
  holders: number;

  @Column('varchar', { default: '' })
  logo: string;

  @Column('varchar', { default: '' })
  created_by: string;

  @Column('varchar', { default: '' })
  metadata_uri: string;

  @Column({
    type: 'decimal',
    precision: 38,
    scale: 18,
    default: 0,
  })
  total_supply: number | string;
}
