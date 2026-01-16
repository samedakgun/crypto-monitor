import { useState, useCallback, useRef } from 'react';
import { Kline } from '@shared/types/market';

interface UseHistoricalDataOptions {
  symbol: string;
  interval: string;
  initialLimit?: number;
  loadMoreLimit?: number;
}

interface UseHistoricalDataReturn {
  klines: Kline[];
  isLoading: boolean;
  hasMore: boolean;
  loadMoreData: () => Promise<void>;
  setKlines: React.Dispatch<React.SetStateAction<Kline[]>>;
  addRealtimeKline: (kline: Kline) => void;
}

/**
 * useHistoricalData hook
 *
 * Geçmiş kline verilerini yönetir ve lazy loading desteği sağlar.
 * Kullanıcı geçmişe doğru gittikçe otomatik olarak daha fazla veri yükler.
 */
export function useHistoricalData({
  symbol,
  interval,
  initialLimit = 500,
  loadMoreLimit = 500,
}: UseHistoricalDataOptions): UseHistoricalDataReturn {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);

  /**
   * Geçmiş verileri yükle
   */
  const loadMoreData = useCallback(async () => {
    // Eğer zaten yüklüyorsa veya daha fazla veri yoksa çık
    if (isLoadingRef.current || !hasMore || klines.length === 0) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      // En eski kline'ın zamanını al
      const oldestTime = klines[0].openTime;

      // API'den geçmiş verileri çek
      const response = await fetch(
        `http://localhost:4000/api/market/klines/${symbol}/${interval}?limit=${loadMoreLimit}&endTime=${oldestTime}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical klines');
      }

      const olderKlines: Kline[] = await response.json();

      // Eğer yeni veri gelmemişse, daha fazla veri yok
      if (olderKlines.length === 0) {
        setHasMore(false);
      } else {
        // Yeni verileri eskilerle birleştir
        setKlines((prevKlines) => {
          // Duplicate kontrolü - aynı openTime'a sahip kline'ları filtrele
          const existingTimes = new Set(prevKlines.map(k => k.openTime));
          const newKlines = olderKlines.filter(k => !existingTimes.has(k.openTime));

          // Yeni kline'ları başa ekle ve zamana göre sırala
          return [...newKlines, ...prevKlines].sort((a, b) => a.openTime - b.openTime);
        });
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
      // Hata durumunda daha fazla yükleme yapmayı durdur
      setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [symbol, interval, loadMoreLimit, klines, hasMore]);

  /**
   * Gerçek zamanlı kline ekle veya güncelle
   */
  const addRealtimeKline = useCallback((newKline: Kline) => {
    setKlines((prevKlines) => {
      // Son kline'ı bul
      if (prevKlines.length === 0) {
        return [newKline];
      }

      const lastKline = prevKlines[prevKlines.length - 1];

      // Eğer aynı openTime'a sahipse, güncelle
      if (lastKline.openTime === newKline.openTime) {
        return [...prevKlines.slice(0, -1), newKline];
      }

      // Yeni kline ise, sona ekle
      return [...prevKlines, newKline];
    });
  }, []);

  return {
    klines,
    isLoading,
    hasMore,
    loadMoreData,
    setKlines,
    addRealtimeKline,
  };
}
