// Symbol configuration for crypto pairs
export interface SymbolConfig {
  symbol: string;
  tickSize: number;
  minQuantity: number;
  quantityPrecision: number;
  pricePrecision: number;
  baseAsset: string;
  quoteAsset: string;
}

// Binance USDT perpetual futures / spot common symbols
const SYMBOL_CONFIGS: Record<string, SymbolConfig> = {
  BTCUSDT: {
    symbol: 'BTCUSDT',
    tickSize: 0.01,
    minQuantity: 0.001,
    quantityPrecision: 3,
    pricePrecision: 2,
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
  },
  ETHUSDT: {
    symbol: 'ETHUSDT',
    tickSize: 0.01,
    minQuantity: 0.001,
    quantityPrecision: 3,
    pricePrecision: 2,
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
  },
  SOLUSDT: {
    symbol: 'SOLUSDT',
    tickSize: 0.01,
    minQuantity: 0.01,
    quantityPrecision: 2,
    pricePrecision: 2,
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
  },
  BNBUSDT: {
    symbol: 'BNBUSDT',
    tickSize: 0.01,
    minQuantity: 0.001,
    quantityPrecision: 3,
    pricePrecision: 2,
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
  },
  XRPUSDT: {
    symbol: 'XRPUSDT',
    tickSize: 0.0001,
    minQuantity: 0.1,
    quantityPrecision: 1,
    pricePrecision: 4,
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
  },
  DOGEUSDT: {
    symbol: 'DOGEUSDT',
    tickSize: 0.00001,
    minQuantity: 1,
    quantityPrecision: 0,
    pricePrecision: 5,
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
  },
  ADAUSDT: {
    symbol: 'ADAUSDT',
    tickSize: 0.0001,
    minQuantity: 1,
    quantityPrecision: 0,
    pricePrecision: 4,
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
  },
};

// Default config for unknown symbols
const DEFAULT_CONFIG: SymbolConfig = {
  symbol: 'UNKNOWN',
  tickSize: 0.01,
  minQuantity: 0.001,
  quantityPrecision: 3,
  pricePrecision: 2,
  baseAsset: 'UNKNOWN',
  quoteAsset: 'USDT',
};

/**
 * Get symbol configuration
 * @param symbol - Symbol name (e.g., 'BTCUSDT')
 * @returns Symbol configuration
 */
export function getSymbolConfig(symbol: string): SymbolConfig {
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_CONFIGS[upperSymbol] || { ...DEFAULT_CONFIG, symbol: upperSymbol };
}

/**
 * Get all available symbols
 */
export function getAvailableSymbols(): string[] {
  return Object.keys(SYMBOL_CONFIGS);
}

/**
 * Check if symbol is supported
 */
export function isSymbolSupported(symbol: string): boolean {
  return symbol.toUpperCase() in SYMBOL_CONFIGS;
}
