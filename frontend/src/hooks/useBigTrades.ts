import { useEffect, useState } from 'react';
import { Trade } from '@shared/types/market';

export interface BigTrade extends Trade {
  isBig: boolean;
  multiplier: number; // Ortalama hacmin kaç katı
}

/**
 * useBigTrades hook
 *
 * Trade listesini analiz ederek threshold'u geçen büyük işlemleri tespit eder.
 * Büyük işlemler grafik üzerinde balon şeklinde gösterilir.
 *
 * @param trades - Trade listesi
 * @param thresholdMultiplier - Ortalama hacmin kaç katı büyük sayılacak (varsayılan: 2)
 * @returns Büyük trade'lerin listesi
 */
export function useBigTrades(trades: Trade[], thresholdMultiplier: number = 2): BigTrade[] {
  const [bigTrades, setBigTrades] = useState<BigTrade[]>([]);

  useEffect(() => {
    if (trades.length < 100) {
      setBigTrades([]);
      return;
    }

    // Son 100 trade'in ortalama hacmini hesapla
    const recentTrades = trades.slice(-100);
    const avgVolume = recentTrades.reduce((sum, t) => sum + t.quantity, 0) / 100;
    const threshold = avgVolume * thresholdMultiplier;

    // Büyük trade'leri filtrele ve sadece son 50 tanesini tut (performans için)
    const bigTradesList: BigTrade[] = trades
      .filter(t => t.quantity >= threshold)
      .slice(-50) // Son 50 büyük trade
      .map(t => ({
        ...t,
        isBig: true,
        multiplier: t.quantity / avgVolume
      }));

    setBigTrades(bigTradesList);
  }, [trades, thresholdMultiplier]);

  return bigTrades;
}
