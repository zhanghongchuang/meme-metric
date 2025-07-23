export class AnalysisSwapInfo{
    wallet_address: string;
    token_address: string;
    side: 'buy' | 'sell';
    wallet_type: 'kol' | 'monitor';
    trade_time: number;
    volume: number;

    constructor(walletAddress: string, tokenAddress: string, side: 'buy' | 'sell',
        tradeTime: number, walletType: 'kol' | 'monitor') {
        this.wallet_address = walletAddress;
        this.token_address = tokenAddress;
        this.side = side;
        this.trade_time = tradeTime;
        this.wallet_type = walletType;
        this.volume = 0; // Default value, can be set later
    }

    getUniqueKey(): string {
        return `${this.wallet_address}-${this.token_address}-${this.side}-${this.trade_time}-${this.wallet_type}`;
    }
}