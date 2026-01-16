import { getSymbolConfig } from '../config/symbols';

/**
 * Format price based on symbol precision
 */
export function formatPrice(price: number, symbol: string): string {
  const config = getSymbolConfig(symbol);
  return price.toFixed(config.pricePrecision);
}

/**
 * Format volume/quantity
 */
export function formatVolume(volume: number, symbol: string): string {
  const config = getSymbolConfig(symbol);
  
  if (volume >= 1_000_000) {
    return (volume / 1_000_000).toFixed(2) + 'M';
  }
  if (volume >= 1_000) {
    return (volume / 1_000).toFixed(2) + 'K';
  }
  
  return volume.toFixed(config.quantityPrecision);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers with abbreviations
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(2);
}

/**
 * Format timestamp to time string
 */
export function formatTime(timestamp: number, locale: string = 'tr-TR'): string {
  return new Date(timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number, locale: string = 'tr-TR'): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp to datetime string
 */
export function formatDateTime(timestamp: number, locale: string = 'tr-TR'): string {
  return new Date(timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format delta value with color hint
 */
export function formatDelta(delta: number): { text: string; isPositive: boolean } {
  const isPositive = delta >= 0;
  const sign = isPositive ? '+' : '';
  return {
    text: `${sign}${formatCompact(delta)}`,
    isPositive,
  };
}
