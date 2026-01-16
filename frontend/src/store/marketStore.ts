import { create } from 'zustand';
import { Timeframe } from '@shared/types/market';

interface MarketState {
  selectedSymbol: string;
  selectedInterval: Timeframe;
  currentPrice: number;
  priceChange24h: number;
  bigTradeThreshold: number;
  tradeFilterThreshold: number;
  orderBookFilterQuantity: number;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: Timeframe) => void;
  updatePrice: (price: number) => void;
  setPriceChange: (change: number) => void;
  setBigTradeThreshold: (threshold: number) => void;
  setTradeFilterThreshold: (threshold: number) => void;
  setOrderBookFilterQuantity: (quantity: number) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  selectedSymbol: 'BTCUSDT',
  selectedInterval: '1m',
  currentPrice: 0,
  priceChange24h: 0,
  bigTradeThreshold: 2, // Default: 2x ortalama hacim
  tradeFilterThreshold: 0, // Default: 0 (show all trades)
  orderBookFilterQuantity: 0, // Default: 0 (show all)
  setSymbol: (symbol) => set({ selectedSymbol: symbol }),
  setInterval: (interval) => set({ selectedInterval: interval }),
  updatePrice: (price) => set({ currentPrice: price }),
  setPriceChange: (change) => set({ priceChange24h: change }),
  setBigTradeThreshold: (threshold) => set({ bigTradeThreshold: threshold }),
  setTradeFilterThreshold: (threshold) => set({ tradeFilterThreshold: Math.max(0, threshold) }),
  setOrderBookFilterQuantity: (quantity) => set({ orderBookFilterQuantity: Math.max(0, quantity) }),
}));
