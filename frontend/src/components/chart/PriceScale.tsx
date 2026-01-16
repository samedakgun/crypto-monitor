import { useEffect, useRef, useMemo, memo } from 'react';
import { OrderBook } from '@shared/types/market';

interface PriceScaleProps {
  orderBook: OrderBook | null;
  priceRange: { min: number; max: number };
  height: number;
  width?: number;
  flashingOrders?: Set<string>;
}

interface PriceLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  y: number;
}

function PriceScale({ orderBook, priceRange, height, width = 80, flashingOrders }: PriceScaleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Memoize price levels calculation to avoid recalculating on every render
  const priceLevels = useMemo(() => {
    if (!orderBook || priceRange.max === priceRange.min) {
      return null;
    }
    return buildPriceLevels(orderBook, priceRange, height);
  }, [orderBook, priceRange, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear canvas
    ctx.fillStyle = '#0b101a';
    ctx.fillRect(0, 0, width, height);

    if (!priceLevels) {
      drawSimpleScale(ctx, width, height, priceRange);
      return;
    }

    // Order book barlarını çiz
    drawOrderBookBars(ctx, priceLevels, width, flashingOrders);

    // Fiyat etiketlerini çiz
    drawPriceLabels(ctx, priceLevels, width);

  }, [priceLevels, priceRange, height, width, flashingOrders]);

  return (
    <canvas
      ref={canvasRef}
      className="price-scale-canvas"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        right: 0,
        top: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Price level'ları oluştur ve order book ile eşleştir
 */
function buildPriceLevels(
  orderBook: OrderBook,
  priceRange: { min: number; max: number },
  height: number
): PriceLevel[] {
  const levels: PriceLevel[] = [];
  const priceStep = (priceRange.max - priceRange.min) / 20; // 20 seviye

  for (let i = 0; i <= 20; i++) {
    const price = priceRange.min + (priceStep * i);
    const y = height - ((price - priceRange.min) / (priceRange.max - priceRange.min)) * height;

    // Use binary search to find closest bid/ask (O(log n) instead of O(n))
    const closestBid = findClosestPriceLevel(orderBook.bids, price, priceStep / 2);
    const closestAsk = findClosestPriceLevel(orderBook.asks, price, priceStep / 2);

    levels.push({
      price,
      bidVolume: closestBid?.quantity || 0,
      askVolume: closestAsk?.quantity || 0,
      y,
    });
  }

  return levels;
}

/**
 * Binary search to find closest price level
 * Assumes the array is sorted by price (bids descending, asks ascending)
 */
function findClosestPriceLevel(
  levels: { price: number; quantity: number }[],
  targetPrice: number,
  maxDistance: number
): { price: number; quantity: number } | undefined {
  if (levels.length === 0) return undefined;

  let left = 0;
  let right = levels.length - 1;
  let closest: { price: number; quantity: number } | undefined;
  let minDistance = maxDistance;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const distance = Math.abs(levels[mid].price - targetPrice);

    if (distance < minDistance) {
      minDistance = distance;
      closest = levels[mid];
    }

    // Move towards target price
    if (levels[mid].price < targetPrice) {
      left = mid + 1;
    } else if (levels[mid].price > targetPrice) {
      right = mid - 1;
    } else {
      // Exact match
      return levels[mid];
    }
  }

  // Check adjacent elements for potentially closer matches
  if (left < levels.length) {
    const distance = Math.abs(levels[left].price - targetPrice);
    if (distance < minDistance) {
      closest = levels[left];
    }
  }

  return closest;
}

/**
 * Order book barlarını çiz (renklendirme ile)
 */
function drawOrderBookBars(
  ctx: CanvasRenderingContext2D,
  levels: PriceLevel[],
  width: number,
  flashingOrders?: Set<string>
) {
  const maxBidVolume = Math.max(...levels.map(l => l.bidVolume), 1);
  const maxAskVolume = Math.max(...levels.map(l => l.askVolume), 1);
  const barMaxWidth = width * 0.7; // Maksimum %70 genişlik

  levels.forEach((level) => {
    const colorInfo = getColorIntensity(level.bidVolume, level.askVolume);

    if (colorInfo.intensity > 0) {
      // Bar genişliği
      let barWidth: number;
      if (colorInfo.color === 'green') {
        // Ask dominant
        barWidth = (level.askVolume / maxAskVolume) * barMaxWidth;
      } else {
        // Bid dominant
        barWidth = (level.bidVolume / maxBidVolume) * barMaxWidth;
      }

      // Flash kontrolü
      const isBidFlashing = flashingOrders?.has(`bid-${level.price}`);
      const isAskFlashing = flashingOrders?.has(`ask-${level.price}`);
      const isFlashing = isBidFlashing || isAskFlashing;

      // Renk
      let color = getBarColor(colorInfo.color, colorInfo.intensity);

      // Flash efekti - sarı/altın rengi ile parlat
      if (isFlashing) {
        color = 'rgba(255, 215, 0, 0.8)'; // Altın sarısı, yüksek alpha
      }

      // Bar çiz (sağdan sola)
      ctx.fillStyle = color;
      ctx.fillRect(width - barWidth, level.y - 2, barWidth, 4);

      // Flash border ekle
      if (isFlashing) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(width - barWidth, level.y - 2, barWidth, 4);
      }
    }
  });
}

/**
 * Fiyat etiketlerini çiz
 */
function drawPriceLabels(
  ctx: CanvasRenderingContext2D,
  levels: PriceLevel[],
  width: number
) {
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';

  levels.forEach((level, index) => {
    // Her 2 seviyede bir etiket göster
    if (index % 2 !== 0) return;

    const colorInfo = getColorIntensity(level.bidVolume, level.askVolume);
    const textColor = colorInfo.color === 'green' ? '#36c88a' :
                      colorInfo.color === 'red' ? '#e0656a' : '#8ba0ba';

    // Arka plan
    ctx.fillStyle = 'rgba(11, 16, 26, 0.9)';
    ctx.fillRect(5, level.y - 8, width - 10, 16);

    // Fiyat metni
    ctx.fillStyle = textColor;
    ctx.fillText(level.price.toFixed(2), 8, level.y + 4);
  });

  // Grid çizgileri
  ctx.strokeStyle = 'rgba(27, 38, 54, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);

  levels.forEach((level, index) => {
    if (index % 2 !== 0) return;

    ctx.beginPath();
    ctx.moveTo(0, level.y);
    ctx.lineTo(width, level.y);
    ctx.stroke();
  });

  ctx.setLineDash([]);
}

/**
 * Basit scale çiz (order book olmadığında)
 */
function drawSimpleScale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  priceRange: { min: number; max: number }
) {
  const steps = 10;
  const priceStep = (priceRange.max - priceRange.min) / steps;

  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#8ba0ba';

  for (let i = 0; i <= steps; i++) {
    const price = priceRange.min + (priceStep * i);
    const y = height - (i / steps) * height;

    // Grid line
    ctx.strokeStyle = 'rgba(27, 38, 54, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    // Fiyat etiketi
    ctx.fillStyle = 'rgba(11, 16, 26, 0.9)';
    ctx.fillRect(5, y - 8, width - 10, 16);

    ctx.fillStyle = '#8ba0ba';
    ctx.fillText(price.toFixed(2), 8, y + 4);
  }

  ctx.setLineDash([]);
}

/**
 * Bid/Ask baskısına göre renk ve yoğunluk hesapla
 */
function getColorIntensity(
  bidVolume: number,
  askVolume: number
): { color: 'green' | 'red' | 'neutral'; intensity: number } {
  const total = bidVolume + askVolume;

  if (total === 0) {
    return { color: 'neutral', intensity: 0 };
  }

  if (askVolume > bidVolume) {
    // Alıcı baskısı (yeşil)
    const intensity = ((askVolume - bidVolume) / total);
    return { color: 'green', intensity };
  } else if (bidVolume > askVolume) {
    // Satıcı baskısı (kırmızı)
    const intensity = ((bidVolume - askVolume) / total);
    return { color: 'red', intensity };
  }

  return { color: 'neutral', intensity: 0 };
}

/**
 * Renk ve yoğunluğa göre RGBA renk döndür
 */
function getBarColor(color: 'green' | 'red' | 'neutral', intensity: number): string {
  const alpha = 0.3 + (intensity * 0.6); // 0.3 - 0.9 arası

  if (color === 'green') {
    return `rgba(54, 200, 138, ${alpha})`; // Yeşil - alıcı baskısı
  } else if (color === 'red') {
    return `rgba(224, 101, 106, ${alpha})`; // Kırmızı - satıcı baskısı
  }

  return `rgba(123, 139, 163, ${alpha})`; // Nötr gri
}

// Memoize the entire component to prevent unnecessary re-renders
export default memo(PriceScale);
