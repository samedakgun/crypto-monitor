import WebSocket from 'ws';
import { Kline, OrderBook, Trade } from '@shared/types/market';
import { logger } from '../utils/logger';

interface StreamCallbacks {
  onTrade?: (trade: Trade) => void;
  onKline?: (kline: Kline) => void;
  onDepth?: (orderBook: Partial<OrderBook>) => void;
  onError?: (error: Error) => void;
}

export class BinanceWebSocketClient {
  private ws: WebSocket | null = null;
  private baseURL = process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443';
  private reconnectDelay = 3000;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private callbacks: StreamCallbacks = {};
  private symbol: string = '';
  private streams: string[] = [];
  private isConnecting = false;

  /**
   * Subscribe to multiple streams using combined stream
   * @param symbol Trading pair (e.g., 'BTCUSDT')
   * @param channels Array of channels to subscribe
   * @param interval Time interval for kline (e.g., '1m')
   * @param callbacks Callback functions for each stream type
   */
  subscribe(
    symbol: string,
    channels: Array<'trade' | 'kline' | 'depth'>,
    interval: string,
    callbacks: StreamCallbacks
  ): void {
    this.symbol = symbol;
    this.callbacks = callbacks;
    this.streams = [];

    const symbolLower = symbol.toLowerCase();

    // Build stream names
    channels.forEach((channel) => {
      if (channel === 'trade') {
        this.streams.push(`${symbolLower}@aggTrade`);
      } else if (channel === 'kline') {
        this.streams.push(`${symbolLower}@kline_${interval}`);
      } else if (channel === 'depth') {
        this.streams.push(`${symbolLower}@depth20@100ms`);
      }
    });

    if (this.streams.length === 0) {
      logger.warn('No streams to subscribe');
      return;
    }

    this.connect();
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      logger.warn('Already connected or connecting');
      return;
    }

    this.isConnecting = true;

    // Use combined stream URL
    const streamsParam = this.streams.join('/');
    const url = `${this.baseURL}/stream?streams=${streamsParam}`;

    logger.info(`Connecting to Binance combined stream: ${streamsParam}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.on('open', () => {
        logger.info(`✅ Connected to Binance streams: ${this.streams.join(', ')}`);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());
          this.handleMessage(parsed);
        } catch (error) {
          logger.error('Failed to parse Binance message:', error as Error);
        }
      });

      this.ws.on('error', (error) => {
        logger.error('Binance WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(error as Error);
      });

      this.ws.on('close', (code, reason) => {
        logger.warn(`Binance WebSocket closed: ${code} - ${reason}`);
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      });
    } catch (error) {
      logger.error('Failed to create Binance WebSocket:', error as Error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private handleMessage(data: any): void {
    // Combined stream format: { stream: '...', data: {...} }
    if (!data.stream || !data.data) {
      logger.warn('Unknown message format:', data);
      return;
    }

    const stream = data.stream;
    const payload = data.data;

    try {
      if (stream.includes('@aggTrade')) {
        this.handleTradeMessage(payload);
      } else if (stream.includes('@kline')) {
        this.handleKlineMessage(payload);
      } else if (stream.includes('@depth')) {
        this.handleDepthMessage(payload);
      }
    } catch (error) {
      logger.error(`Error handling ${stream} message:`, error as Error);
    }
  }

  private handleTradeMessage(data: any): void {
    const trade: Trade = {
      symbol: data.s,
      tradeId: data.a,
      price: parseFloat(data.p),
      quantity: parseFloat(data.q),
      time: data.T,
      isBuyerMaker: data.m,
    };
    this.callbacks.onTrade?.(trade);
  }

  private handleKlineMessage(data: any): void {
    const k = data.k;
    const kline: Kline = {
      symbol: k.s,
      interval: k.i,
      openTime: k.t,
      closeTime: k.T,
      open: parseFloat(k.o),
      high: parseFloat(k.h),
      low: parseFloat(k.l),
      close: parseFloat(k.c),
      volume: parseFloat(k.v),
      trades: k.n,
    };
    this.callbacks.onKline?.(kline);
  }

  private handleDepthMessage(data: any): void {
    const orderBook: Partial<OrderBook> = {
      symbol: this.symbol, // Use stored symbol instead of data.s
      lastUpdateId: data.lastUpdateId,
      bids: data.bids.map((b: string[]) => ({
        price: parseFloat(b[0]),
        quantity: parseFloat(b[1]),
      })),
      asks: data.asks.map((a: string[]) => ({
        price: parseFloat(a[0]),
        quantity: parseFloat(a[1]),
      })),
    };
    this.callbacks.onDepth?.(orderBook);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('❌ Max reconnection attempts reached. Giving up.');
      this.callbacks.onError?.(new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      `🔄 Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  close(): void {
    logger.info('Closing Binance WebSocket connection');
    if (this.ws) {
      // Önce listener'ları kaldır
      this.ws.removeAllListeners();

      // WebSocket'i kapat
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
