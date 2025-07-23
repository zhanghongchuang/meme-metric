export class AnalysisSwapInfo{
    walletAddress: string;
    tokenAddress: string;
    side: 'buy' | 'sell';
    walletType: 'kol' | 'monitor';
    tradeTime: number;
    volume: number;

    constructor(walletAddress: string, tokenAddress: string, side: 'buy' | 'sell',
        tradeTime: number, walletType: 'kol' | 'monitor') {
        this.walletAddress = walletAddress;
        this.tokenAddress = tokenAddress;
        this.side = side;
        this.tradeTime = tradeTime;
        this.walletType = walletType;
        this.volume = 0; // Default value, can be set later
    }

    getUniqueKey(): string {
        return `${this.walletAddress}-${this.tokenAddress}-${this.side}-${this.tradeTime}-${this.walletType}`;
    }
}