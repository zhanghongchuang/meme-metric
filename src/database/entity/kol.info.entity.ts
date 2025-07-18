import { Entity, Column, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';
export const KOL_UNIQUE_COLUMNS = ['wallet_address'];

@Entity('kol_info')
@Index(KOL_UNIQUE_COLUMNS, { unique: true })
export class KOLInfoEntity extends CommonEntity {
    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column('varchar', { length: 64, comment: '钱包地址', default: '' })
    wallet_address: string;

    @Column('varchar', { length: 64, comment: 'KOL名称', default: '' })
    name: string;

    @Column('varchar', { length: 255, comment: 'KOL头像', default: '' })
    pfp: string;

    @Column('varchar', { length: 255, comment: 'Twitter链接', default: '' })
    twitter: string;

    @Column('varchar', { length: 255, comment: 'Telegram', default: '' })
    telegram: string;

}
