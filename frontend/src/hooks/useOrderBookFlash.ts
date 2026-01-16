import { useEffect, useRef, useState } from 'react';
import { OrderBook } from '@shared/types/market';

/**
 * useOrderBookFlash hook
 *
 * Order book'ta büyük değişimleri tespit eder ve flash efekti için
 * flashing order'ları döndürür.
 */
export function useOrderBookFlash(orderBook: OrderBook | null) {
  const [flashingOrders, setFlashingOrders] = useState<Set<string>>(new Set());
  const prevOrderBook = useRef<OrderBook | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderBook || !prevOrderBook.current) {
      prevOrderBook.current = orderBook;
      return;
    }

    const newFlashing = new Set<string>();
    const threshold = 0.2; // %20 değişim eşiği

    // Bid değişimlerini kontrol et
    orderBook.bids.forEach((bid, index) => {
      const prevBid = prevOrderBook.current?.bids[index];
      if (prevBid && prevBid.price === bid.price) {
        const change = Math.abs(bid.quantity - prevBid.quantity);
        const changePercent = change / prevBid.quantity;

        if (changePercent > threshold) {
          newFlashing.add(`bid-${bid.price}`);
        }
      }
    });

    // Ask değişimlerini kontrol et
    orderBook.asks.forEach((ask, index) => {
      const prevAsk = prevOrderBook.current?.asks[index];
      if (prevAsk && prevAsk.price === ask.price) {
        const change = Math.abs(ask.quantity - prevAsk.quantity);
        const changePercent = change / prevAsk.quantity;

        if (changePercent > threshold) {
          newFlashing.add(`ask-${ask.price}`);
        }
      }
    });

    if (newFlashing.size > 0) {
      setFlashingOrders(newFlashing);

      // 500ms sonra flash efektini kaldır
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setFlashingOrders(new Set());
      }, 500);
    }

    prevOrderBook.current = orderBook;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [orderBook]);

  return flashingOrders;
}
