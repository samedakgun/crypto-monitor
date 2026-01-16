// Type-safe timeframe intervals
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface Kline {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades?: number;
  takerBuyVolume?: number;
}

export interface Trade {
  symbol: string;
  tradeId: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

export interface DepthLevel {
  price: number;
  quantity: number;
}

export interface OrderBook {
  symbol: string;
  lastUpdateId: number;
  bids: DepthLevel[];
  asks: DepthLevel[];
  timestamp?: number; // Order book guncelleme zamani
}

export interface FootprintCell {
  price: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  delta: number;
  tradeCount: number;
}

export interface FootprintData {
  symbol: string;
  interval: string;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  cells: FootprintCell[];
  cumulativeDelta: number;
}

export interface FootprintCandle {
  kline: Kline;
  footprint: FootprintData | null;
}

export interface CVDData {
  time: number;
  value: number;
  change: number;
}

export interface VolumeProfileData {
  volumeAtPrice: Map<number, number>;
  pocPrice: number;
  maxVolume: number;
  valueArea: {
    high: number;
    low: number;
  };
  totalVolume: number;
}

export interface FRVPRange {
  startTime: number;
  endTime: number;
  startIndex: number;
  endIndex: number;
}

export interface AggressiveAnalysis {
  aggressiveBuy: number;
  aggressiveSell: number;
  ratio: number;
}

export interface Ticker24h {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}
