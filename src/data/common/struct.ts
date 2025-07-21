import { BigNumber } from 'bignumber.js';

export abstract class IInfo {
  abstract getUniqueKey(): string;
  // 声明必须实现的静态方法
  static copy(info: any): IInfo {
    throw new Error('Static method copy must be implemented');
  }
}

export enum SummaryStatus {
  NORMAL = 0,
  PENDING = 1,
  RESUMMARYED = 2,
}


export class SummaryResult extends IInfo {
  walletAddress: string;
  userInfo: UserInfo;
  tokenInfo: Map<string, TokenInfo>;
  dailyInfo: Map<string, DailyInfo>;
  // roundInfo: RoundInfo[]
  roundResultStatsInfo: Map<string, RoundResultStatsInfo>;
  latestRoundResultsMap: Map<string, RoundInfo>;

  constructor(walletAddress: string) {
    super();
    this.walletAddress = walletAddress;
    this.userInfo = new UserInfo(walletAddress);
    this.tokenInfo = new Map<string, TokenInfo>();
    this.dailyInfo = new Map<string, DailyInfo>();
    this.roundResultStatsInfo = new Map<string, RoundResultStatsInfo>();
    this.latestRoundResultsMap = new Map<string, RoundInfo>();

  }

  getUniqueKey(): string {
    return this.walletAddress;
  }

  static copy(info: any): SummaryResult {
    const copy = new SummaryResult(info.walletAddress);
    Object.assign(copy, info);
    return copy;
  }

}

export interface MqMessage{
  type: string;
  data: any[];
}

export class TokenInfo extends IInfo {
  wallet_address: string;
  token_address: string;
  total_buy_volume: BigNumber | number;
  total_sell_volume: BigNumber | number;
  total_buy_amount: BigNumber | number;
  total_sell_amount: BigNumber | number;
  last_buy_time: number | BigNumber;
  last_active_time: BigNumber | number;
  buy_count: BigNumber | number;
  sell_count: BigNumber | number;
  realized_pnL: BigNumber | number;
  total_sold_cost: BigNumber | number;
  holding_duration: number | BigNumber;
  round_count: number | BigNumber;
  transfer_in_amount: BigNumber | number;
  transfer_out_amount: BigNumber | number;

  constructor(wallet_address: string, token_address: string) {
    super();
    this.wallet_address = wallet_address;
    this.token_address = token_address;
    this.total_buy_volume = new BigNumber(0);
    this.total_sell_volume = new BigNumber(0);
    this.total_buy_amount = new BigNumber(0);
    this.total_sell_amount = new BigNumber(0);
    this.last_buy_time = 0;
    this.last_active_time = new BigNumber(0);
    this.buy_count = new BigNumber(0);
    this.sell_count = new BigNumber(0);
    this.realized_pnL = new BigNumber(0);
    this.total_sold_cost = new BigNumber(0);
    this.holding_duration = 0;
    this.round_count = 0;
    this.transfer_in_amount = new BigNumber(0);
    this.transfer_out_amount = new BigNumber(0);
  }

  getUniqueKey(): string {
    return `${this.wallet_address}-${this.token_address}`;
  }

  static copy(info: any): TokenInfo {
    const copy = new TokenInfo(info.wallet_address, info.token_address);
    Object.assign(copy, info);
    return copy;
  }

  merge(info1: TokenInfo, info2: TokenInfo, newObj?: false): TokenInfo {
    let rst = info1;
    if (newObj) {
      rst = new TokenInfo(info1.wallet_address, info1.token_address);
      Object.assign(rst, info1);
    }
    rst.total_buy_volume = BigNumber(rst.total_buy_volume).plus(info2.total_buy_volume);
    rst.total_sell_volume = BigNumber(rst.total_sell_volume).plus(info2.total_sell_volume);
    rst.total_buy_amount = BigNumber(rst.total_buy_amount).plus(info2.total_buy_amount);
    rst.total_sell_amount = BigNumber(rst.total_sell_amount).plus(info2.total_sell_amount);
    rst.last_buy_time = BigNumber.max(BigNumber(rst.last_buy_time), BigNumber(info2.last_buy_time)).toNumber();
    rst.last_active_time = BigNumber.max(BigNumber(rst.last_active_time), BigNumber(info2.last_active_time));
    rst.buy_count = BigNumber(rst.buy_count).plus(info2.buy_count);
    rst.sell_count = BigNumber(rst.sell_count).plus(info2.sell_count);
    rst.realized_pnL = BigNumber(rst.realized_pnL).plus(info2.realized_pnL);
    rst.total_sold_cost = BigNumber(rst.total_sold_cost).plus(info2.total_sold_cost);
    rst.holding_duration = BigNumber(rst.holding_duration).plus(info2.holding_duration).toNumber();
    rst.round_count = BigNumber(rst.round_count).plus(info2.round_count).toNumber();
    rst.transfer_in_amount = BigNumber(rst.transfer_in_amount).plus(info2.transfer_in_amount);
    rst.transfer_out_amount = BigNumber(rst.transfer_out_amount).plus(info2.transfer_out_amount);
    return rst;
  }
}

export class DailyInfo extends IInfo {
  wallet_address: string;
  token_address: string;
  buy_date: number;
  total_buy_volume: BigNumber | number;
  total_sell_volume: BigNumber | number;
  total_buy_amount: BigNumber | number;
  total_sell_amount: BigNumber | number;
  buy_count: BigNumber | number;
  sell_count: BigNumber | number;
  realized_pnL: BigNumber | number;
  total_sold_cost: BigNumber | number;

  constructor(wallet_address: string, token_address: string, buy_date: number) {
    super();
    this.wallet_address = wallet_address;
    this.token_address = token_address;
    this.buy_date = buy_date;
    this.total_buy_volume = new BigNumber(0);
    this.total_sell_volume = new BigNumber(0);
    this.total_buy_amount = new BigNumber(0);
    this.total_sell_amount = new BigNumber(0);
    this.buy_count = new BigNumber(0);
    this.sell_count = new BigNumber(0);
    this.realized_pnL = new BigNumber(0);
    this.total_sold_cost = new BigNumber(0);
  }

  getUniqueKey(): string {
    return `${this.wallet_address}-${this.token_address}-${this.buy_date}`;
  }

  static copy(info: any): DailyInfo {
    const copy = new DailyInfo(info.wallet_address, info.token_address, info.buy_date);
    Object.assign(copy, info);
    return copy;
  }

  merge(info1: DailyInfo, info2: DailyInfo, newObj?: false) {
    let rst = info1;
    if (newObj) {
      rst = new DailyInfo(
        info1.wallet_address,
        info1.token_address,
        info1.buy_date,
      );
      Object.assign(rst, info1);
    }
    rst.total_buy_volume = BigNumber(rst.total_buy_volume).plus(
      info2.total_buy_volume
    );
    rst.total_sell_volume = BigNumber(rst.total_sell_volume).plus(
      info2.total_sell_volume
    );
    rst.total_buy_amount = BigNumber(rst.total_buy_amount).plus(
      info2.total_buy_amount
    );
    rst.total_sell_amount = BigNumber(rst.total_sell_amount).plus(
      info2.total_sell_amount
    );
    rst.buy_count = BigNumber(rst.buy_count).plus(info2.buy_count);
    rst.sell_count = BigNumber(rst.sell_count).plus(info2.sell_count);
    rst.realized_pnL = BigNumber(rst.realized_pnL).plus(info2.realized_pnL);
    rst.total_sold_cost = BigNumber(rst.total_sold_cost).plus(
      info2.total_sold_cost,
    );
    return rst;
  }
}

export class RoundInfo extends IInfo {
  wallet_address: string;
  token_address: string;
  total_buy_volume: BigNumber | number;
  total_sell_volume: BigNumber | number;
  total_buy_amount: BigNumber | number;
  total_sell_amount: BigNumber | number;
  round_start_time: BigNumber | number;
  round_end_time: BigNumber | number;
  round_start_block: BigNumber | number;
  round_end_block: BigNumber | number;
  effect_sell_amount: BigNumber | number;
  effect_sell_volume: BigNumber | number;
  realized_pnL: BigNumber | number;
  total_buy_cost: BigNumber | number;
  sync_status: BigNumber | number;
  latest_price: BigNumber | number;

  constructor(wallet_address: string, token_address: string) {
    super();
    this.wallet_address = wallet_address;
    this.token_address = token_address;
    this.total_buy_volume = new BigNumber(0);
    this.total_sell_volume = new BigNumber(0);
    this.total_buy_amount = new BigNumber(0);
    this.total_sell_amount = new BigNumber(0);
    this.round_start_time = new BigNumber(0);
    this.round_end_time = new BigNumber(0);
    this.round_start_block = new BigNumber(0);
    this.round_end_block = new BigNumber(0);
    this.effect_sell_amount = new BigNumber(0);
    this.effect_sell_volume = new BigNumber(0);
    this.realized_pnL = new BigNumber(0);
    this.total_buy_cost = new BigNumber(0);
    this.sync_status = new BigNumber(0);
  }

  getUniqueKey(): string {
    return `${this.wallet_address}-${this.token_address}`;
  }

  getAvgBuyPrice(): string {
    return BigNumber(this.total_buy_amount).isZero()
      ? '0'
      : BigNumber(this.total_buy_volume).dividedBy(this.total_buy_amount).toFixed();
  }

  getAvgSellPrice(): string {
    return BigNumber(this.effect_sell_amount).isZero()
      ? '0'
      : BigNumber(this.effect_sell_volume).dividedBy(this.effect_sell_amount).toFixed();
  }

  static copy(info: any): RoundInfo {
    const copy = new RoundInfo(info.wallet_address, info.token_address);
    Object.assign(copy, info);
    return copy;
  }

  init(data) {
    this.wallet_address = data.wallet_address;
    this.token_address = data.token_address;
    this.total_buy_volume = BigNumber(data.total_buy_volume || 0);
    this.total_sell_volume = BigNumber(data.total_sell_volume || 0);
    this.total_buy_amount = BigNumber(data.total_buy_amount || 0);
    this.total_sell_amount = BigNumber(data.total_sell_amount || 0);
    this.round_start_time = BigNumber(data.round_start_time || 0);
    this.round_end_time = BigNumber(data.round_end_time || 0);
    this.round_start_block = BigNumber(data.round_start_block || 0);
    this.round_end_block = BigNumber(data.round_end_block || 0);
    this.effect_sell_amount = BigNumber(data.effect_sell_amount || 0);
    this.effect_sell_volume = BigNumber(data.effect_sell_volume || 0);
    this.realized_pnL = BigNumber(data.realized_pnL || 0);
    this.total_buy_cost = BigNumber(data.total_buy_cost || 0);
    this.sync_status = BigNumber(data.sync_status || 0);
  }
}

export class RoundResultStatsInfo extends IInfo {
  wallet_address: string;
  date: number;
  greater_than_5: number;
  between_2_and_5: number;
  between_0_and_2: number;
  between_neg_0_5_and_0: number;
  less_than_neg_0_5: number;

  constructor(wallet_address: string, date: number) {
    super();
    this.wallet_address = wallet_address;
    this.date = date;
    this.greater_than_5 = 0;
    this.between_2_and_5 = 0;
    this.between_0_and_2 = 0;
    this.between_neg_0_5_and_0 = 0;
    this.less_than_neg_0_5 = 0;
  }

  getUniqueKey(): string {
    return `${this.wallet_address}-${this.date}`;
  }

  static copy(info: any): RoundResultStatsInfo {
    const copy = new RoundResultStatsInfo(info.wallet_address, info.date);
    Object.assign(copy, info);
    return copy;
  }

  merge(
    info1: RoundResultStatsInfo,
    info2: RoundResultStatsInfo,
    newObj?: false,
  ) {
    let rst = info1;
    if (newObj) {
      rst = new RoundResultStatsInfo(info1.wallet_address, info1.date);
      Object.assign(rst, info1);
    }
    rst.greater_than_5 += info2.greater_than_5;
    rst.between_2_and_5 += info2.between_2_and_5;
    rst.between_0_and_2 += info2.between_0_and_2;
    rst.between_neg_0_5_and_0 += info2.between_neg_0_5_and_0;
    rst.less_than_neg_0_5 += info2.less_than_neg_0_5;
    return rst;
  }

  static needSave(info){
    return info.greater_than_5 > 0 ||
    info.between_2_and_5 > 0 ||
    info.between_0_and_2 > 0 ||
    info.between_neg_0_5_and_0 > 0 ||
    info.less_than_neg_0_5 > 0
  }

}

export class UserInfo extends IInfo {
  wallet_address: string;
  total_buy_volume: BigNumber | number;
  total_sell_volume: BigNumber | number;
  buy_count: BigNumber | number;
  sell_count: BigNumber | number;
  sync_id: BigNumber | number;
  last_active_time: BigNumber | number;
  realized_pnL: BigNumber | number;
  total_sold_cost: BigNumber | number;
  create_time: BigNumber | number;

  constructor(wallet_address: string, dbInfo?: any) {
    super();
    this.wallet_address = wallet_address;
    this.total_buy_volume = new BigNumber(0);
    this.total_sell_volume = new BigNumber(0);
    this.buy_count = new BigNumber(0);
    this.sell_count = new BigNumber(0);
    this.sync_id = new BigNumber(0);
    this.last_active_time = new BigNumber(0);
    this.realized_pnL = new BigNumber(0);
    this.total_sold_cost = new BigNumber(0);
    this.create_time = 0;
    if (dbInfo) {
      this.sync_id = dbInfo.sync_id || 0;
      this.last_active_time = dbInfo.last_active_time || 0;
      this.create_time = dbInfo.create_time || 0;
    }
  }

  getUniqueKey(): string {
    return this.wallet_address;
  }

  static copy(info: any): UserInfo {
    const copy = new UserInfo(info.wallet_address);
    Object.assign(copy, info);
    return copy;
  }

  merge(info1: UserInfo, info2: UserInfo, newObj?: false) {
    let rst = info1;
    if (newObj) {
      rst = new UserInfo(info1.wallet_address);
      Object.assign(rst, info1);
    }
    rst.total_buy_volume = BigNumber(rst.total_buy_volume).plus(
      info2.total_buy_volume,
    );
    rst.total_sell_volume = BigNumber(rst.total_sell_volume).plus(
      info2.total_sell_volume,
    );
    rst.buy_count = BigNumber(rst.buy_count).plus(info2.buy_count);
    rst.sell_count = BigNumber(rst.sell_count).plus(info2.sell_count);
    rst.sync_id = BigNumber.max(
      BigNumber(rst.sync_id),
      BigNumber(info2.sync_id),
    );
    rst.last_active_time = BigNumber.max(
      BigNumber(rst.last_active_time),
      BigNumber(info2.last_active_time),
    );
    rst.realized_pnL = BigNumber(rst.realized_pnL).plus(info2.realized_pnL);
    rst.total_sold_cost = BigNumber(rst.total_sold_cost).plus(
      info2.total_sold_cost,
    );
    rst.create_time = Math.min(
      Number(rst.create_time),
      Number(info2.create_time),
    );
    return rst;
  }
}
