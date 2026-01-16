import { Trade, VolumeProfileData } from '@shared/types/market';

/**
 * Fixed Range Volume Profile (FRVP) hesaplama utility
 * Belirli bir zaman aralığında fiyat seviyelerine göre hacim dağılımını hesaplar
 */

export interface CalculateVolumeProfileOptions {
  trades: Trade[];
  startTime: number;
  endTime: number;
  priceRange: { min: number; max: number };
  tickSize?: number;
}

/**
 * Volume Profile hesapla
 */
export function calculateVolumeProfile({
  trades,
  startTime,
  endTime,
  priceRange,
  tickSize = 1,
}: CalculateVolumeProfileOptions): VolumeProfileData {
  // Zaman aralığındaki trade'leri filtrele
  const filteredTrades = trades.filter((t) => t.time >= startTime && t.time <= endTime);

  if (filteredTrades.length === 0) {
    return {
      volumeAtPrice: new Map(),
      pocPrice: 0,
      maxVolume: 0,
      valueArea: { high: 0, low: 0 },
      totalVolume: 0,
    };
  }

  // Fiyat seviyelerine göre hacim topla
  const volumeAtPrice = new Map<number, number>();

  filteredTrades.forEach((trade) => {
    const priceLevel = roundToTick(trade.price, tickSize);
    const currentVolume = volumeAtPrice.get(priceLevel) || 0;
    volumeAtPrice.set(priceLevel, currentVolume + trade.quantity);
  });

  // POC (Point of Control) - En yüksek hacimli fiyat seviyesi
  let pocPrice = 0;
  let maxVolume = 0;

  volumeAtPrice.forEach((volume, price) => {
    if (volume > maxVolume) {
      maxVolume = volume;
      pocPrice = price;
    }
  });

  // Toplam hacim
  const totalVolume = Array.from(volumeAtPrice.values()).reduce((sum, v) => sum + v, 0);

  // Value Area hesapla (%70 hacim)
  const valueArea = calculateValueArea(volumeAtPrice, totalVolume);

  return {
    volumeAtPrice,
    pocPrice,
    maxVolume,
    valueArea,
    totalVolume,
  };
}

/**
 * Value Area hesapla - Toplam hacmin %70'inin bulunduğu fiyat aralığı
 */
function calculateValueArea(
  volumeAtPrice: Map<number, number>,
  totalVolume: number
): { high: number; low: number } {
  if (volumeAtPrice.size === 0 || totalVolume === 0) {
    return { high: 0, low: 0 };
  }

  const targetVolume = totalVolume * 0.7;

  // Fiyat seviyelerini hacme göre sırala (en yüksekten en düşüğe)
  const sortedEntries = Array.from(volumeAtPrice.entries()).sort((a, b) => b[1] - a[1]);

  let accumulatedVolume = 0;
  const valueAreaPrices: number[] = [];

  // En yüksek hacimli seviyelerden başla, %70'e ulaşana kadar topla
  for (const [price, volume] of sortedEntries) {
    if (accumulatedVolume >= targetVolume) break;
    accumulatedVolume += volume;
    valueAreaPrices.push(price);
  }

  if (valueAreaPrices.length === 0) {
    return { high: 0, low: 0 };
  }

  return {
    high: Math.max(...valueAreaPrices),
    low: Math.min(...valueAreaPrices),
  };
}

/**
 * Fiyatı tick size'a yuvarla
 */
function roundToTick(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

/**
 * Volume Profile verilerini düz array'e çevir (rendering için)
 */
export function volumeProfileToArray(
  volumeAtPrice: Map<number, number>
): Array<{ price: number; volume: number }> {
  return Array.from(volumeAtPrice.entries())
    .map(([price, volume]) => ({ price, volume }))
    .sort((a, b) => b.price - a.price); // Yüksek fiyattan düşüğe
}
