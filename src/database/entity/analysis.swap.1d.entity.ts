import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { CommonEntity } from "./common.entity";

export const ANALYSIS_SWAP_UNIQUE_COLUMNS = ['wallet_address', 'token_address', 'trade_time', 'wallet_type'];
export const ANALYSIS_SWAP_INDEX_COLUMNS = ['token_address', 'trade_time'];


@Entity('analysis_swap_1d')
@Index(ANALYSIS_SWAP_UNIQUE_COLUMNS, { unique: true })
@Index(ANALYSIS_SWAP_INDEX_COLUMNS, { unique: false })
export class AnalysisSwapEntity1D extends CommonEntity{

    @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
    wallet_address: string;

    @PrimaryColumn('varchar', { length: 64, comment: '代币地址', default: '' })
    token_address: string;

    @PrimaryColumn('varchar', { length: 64, comment: '钱包类型, kol, monitor', default: '' })
    wallet_type: string;

    @PrimaryColumn('int', { comment: '交易时间', default: 0 })
    trade_time: number;

    @Column('varchar', { length: 64, comment: '交易方向', default: '' })
    side: string;

}