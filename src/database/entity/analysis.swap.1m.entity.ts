import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { CommonEntity } from "./common.entity";

export const ANALYSIS_SWAP_UNIQUE_COLUMNS = ['wallet_address', 'token_address', 'trade_time', 'wallet_type', 'side'];
export const ANALYSIS_SWAP_INDEX_COLUMNS = ['token_address', 'trade_time'];


@Entity('analysis_swap_1m')
@Index(ANALYSIS_SWAP_UNIQUE_COLUMNS, { unique: true })
@Index(ANALYSIS_SWAP_INDEX_COLUMNS, { unique: false })
export class AnalysisSwapEntity1M extends CommonEntity{

    @PrimaryColumn('varchar', { length: 64, comment: '钱包地址', default: '' })
    wallet_address: string;

    @PrimaryColumn('varchar', { length: 64, comment: '代币地址', default: '' })
    token_address: string;

    @PrimaryColumn('int', { comment: '交易时间', default: 0 })
    trade_time: number;
    
    @PrimaryColumn('varchar', { length: 64, comment: '钱包类型, kol, monitor', default: '' })
    wallet_type: string;

    @PrimaryColumn('varchar', { length: 64, comment: '交易方向', default: '' })
    side: string;

    @Column('decimal', { precision: 36, scale: 18, comment: '交易金额', default: 0 })
    volume: number;

    @Column('decimal', { precision: 62, scale: 18, comment: '交易数量', default: 0 })
    amount: number;

}