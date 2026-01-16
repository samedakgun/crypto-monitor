import { create } from 'zustand';
export const useMarketStore = create((set) => ({
    selectedSymbol: 'BTCUSDT',
    selectedInterval: '1m',
    currentPrice: 0,
    priceChange24h: 0,
    setSymbol: (symbol) => set({ selectedSymbol: symbol }),
    setInterval: (interval) => set({ selectedInterval: interval }),
    updatePrice: (price) => set({ currentPrice: price }),
    setPriceChange: (change) => set({ priceChange24h: change }),
}));
