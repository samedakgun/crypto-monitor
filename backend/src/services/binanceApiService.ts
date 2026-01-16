import axios, { AxiosInstance } from 'axios';
import { Kline, OrderBook, Trade, Ticker24h } from '@shared/types/market';
import { logger } from '../utils/logger';

export class BinanceApiService {
  private client: AxiosInstance;
  private baseURL = process.env.BINANCE_REST_URL || 'https://api.binance.com';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach API key if provided
    const apiKey = process.env.BINANCE_API_KEY;
    if (apiKey) {
      this.client.defaults.headers.common['X-MBX-APIKEY'] = apiKey;
    }

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Binance API Error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async getKlines(symbol: string, interval: string, limit: number = 500, endTime?: number): Promise<Kline[]> {
    try {
      const params: any = { symbol, interval, limit };

      // endTime varsa ekle (geçmiş veri yüklemek için)
      if (endTime) {
        params.endTime = endTime;
      }

      const response = await this.client.get('/api/v3/klines', {
        params,
      });

      return response.data.map((k: any[]) => ({
        symbol,
        interval,
        openTime: k[0],
        closeTime: k[6],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        trades: k[8],
        takerBuyVolume: parseFloat(k[9]),
      }));
    } catch (error) {
      logger.error(`Failed to fetch klines for ${symbol}:`, error);
      throw error;
    }
  }

  async getAggregateTrades(symbol: string, limit: number = 500): Promise<Trade[]> {
    try {
      const response = await this.client.get('/api/v3/aggTrades', {
        params: { symbol, limit },
      });

      return response.data.map((t: any) => ({
        symbol,
        tradeId: t.a,
        price: parseFloat(t.p),
        quantity: parseFloat(t.q),
        time: t.T,
        isBuyerMaker: t.m,
      }));
    } catch (error) {
      logger.error(`Failed to fetch aggregate trades for ${symbol}:`, error);
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      const response = await this.client.get('/api/v3/depth', {
        params: { symbol, limit },
      });

      return {
        symbol,
        lastUpdateId: response.data.lastUpdateId,
        bids: response.data.bids.map((b: string[]) => ({
          price: parseFloat(b[0]),
          quantity: parseFloat(b[1]),
        })),
        asks: response.data.asks.map((a: string[]) => ({
          price: parseFloat(a[0]),
          quantity: parseFloat(a[1]),
        })),
      };
    } catch (error) {
      logger.error(`Failed to fetch order book for ${symbol}:`, error);
      throw error;
    }
  }

  async get24hrTicker(symbol: string): Promise<Ticker24h> {
    try {
      const response = await this.client.get('/api/v3/ticker/24hr', {
        params: { symbol },
      });
      return response.data as Ticker24h;
    } catch (error) {
      logger.error(`Failed to fetch 24hr ticker for ${symbol}:`, error);
      throw error;
    }
  }
}
