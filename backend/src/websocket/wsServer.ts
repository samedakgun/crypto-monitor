import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { FootprintCalculator } from '../services/footprintCalculator';
import { BinanceWebSocketClient } from './binanceWebSocket';
import { AggressiveAnalysis, CVDData, Kline, Trade } from '@shared/types/market';
import {
  IncomingClientMessage,
  SubscribeMessage,
  WebSocketMessage,
} from '@shared/types/websocket';
import { getSymbolConfig } from '@shared/config/symbols';
import { logger } from '../utils/logger';

interface ClientSubscriptions {
  binanceWs?: BinanceWebSocketClient;
  symbol?: string;
  interval?: string;
  tradeBuffer: Trade[];
  lastKlineTime?: number;
  footprintCalculator?: FootprintCalculator;
  cumulativeDelta: number; // CVD tracking
}

const MAX_TRADE_BUFFER_SIZE = 10000; // Prevent memory leak

export function setupWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (clientWs: WebSocket) => {
    logger.info('✅ Client connected to WebSocket');

    const subscriptions: ClientSubscriptions = {
      tradeBuffer: [],
      cumulativeDelta: 0,
    };

    const connectedMsg: WebSocketMessage = {
      type: 'connected',
      data: { message: 'Connected to Crypto Monitor WebSocket' },
    };
    clientWs.send(JSON.stringify(connectedMsg));

    clientWs.on('message', async (data: Buffer) => {
      try {
        const message: IncomingClientMessage = JSON.parse(data.toString());
        logger.info('📨 Received client message:', message);

        if (message.type === 'subscribe') {
          await handleSubscribe(clientWs, message, subscriptions);
        } else if (message.type === 'unsubscribe') {
          handleUnsubscribe(subscriptions);
        }
      } catch (error) {
        logger.error('❌ Error handling message:', error as Error);
        const errorMsg: WebSocketMessage = {
          type: 'error',
          error: 'Invalid message format',
        };
        clientWs.send(JSON.stringify(errorMsg));
      }
    });

    clientWs.on('close', () => {
      logger.info('❌ Client disconnected');
      handleUnsubscribe(subscriptions);
    });

    clientWs.on('error', (error) => {
      logger.error('❌ Client WebSocket error:', error);
    });
  });

  async function handleSubscribe(
    clientWs: WebSocket,
    message: SubscribeMessage,
    subs: ClientSubscriptions
  ): Promise<void> {
    const { symbol, channels, interval } = message;
    logger.info(`🔔 Subscribing to ${symbol} | Channels: [${channels.join(', ')}] | Interval: ${interval || '1m'}`);

    // Clean up existing subscriptions
    handleUnsubscribe(subs);

    // Wait a bit for old connection to close properly
    await new Promise(resolve => setTimeout(resolve, 100));

    // Symbol'e gore tickSize al
    const symbolConfig = getSymbolConfig(symbol);
    logger.info(`📐 Using tickSize ${symbolConfig.tickSize} for ${symbol}`);

    subs.symbol = symbol;
    subs.interval = interval || '1m';
    subs.binanceWs = new BinanceWebSocketClient();
    subs.footprintCalculator = new FootprintCalculator(symbolConfig.tickSize);
    subs.cumulativeDelta = 0; // Reset CVD for new subscription

    // Use new subscribe API
    subs.binanceWs.subscribe(
      symbol,
      channels as Array<'trade' | 'kline' | 'depth'>,
      subs.interval,
      {
        onTrade: (trade) => {
          // Send trade to client
          const tradeMsg: WebSocketMessage = {
            type: 'trade',
            data: trade,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(tradeMsg));
          }

          // Buffer trade for footprint calculation
          subs.tradeBuffer.push(trade);

          // Prevent memory leak - limit buffer size
          if (subs.tradeBuffer.length > MAX_TRADE_BUFFER_SIZE) {
            logger.warn(`⚠️  Trade buffer exceeded ${MAX_TRADE_BUFFER_SIZE}, clearing old trades`);
            subs.tradeBuffer = subs.tradeBuffer.slice(-MAX_TRADE_BUFFER_SIZE / 2);
          }
        },

        onKline: (kline) => {
          // Send kline to client
          const klineMsg: WebSocketMessage = {
            type: 'kline',
            data: kline,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(klineMsg));
          }

          // Calculate footprint when kline closes (new candle starts)
          if (kline.closeTime > (subs.lastKlineTime || 0)) {
            calculateAndSendFootprint(clientWs, subs, kline);
            subs.lastKlineTime = kline.closeTime;
            subs.tradeBuffer = []; // Clear buffer after footprint calculation
          }
        },

        onDepth: (orderBook) => {
          // Add timestamp to order book
          const orderBookWithTimestamp = {
            ...orderBook,
            timestamp: Date.now(),
          };

          // Send order book to client
          const depthMsg: WebSocketMessage = {
            type: 'depth',
            data: orderBookWithTimestamp,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(depthMsg));
          }
        },

        onError: (error) => {
          logger.error('❌ Binance stream error:', error);

          // Notify client about the error
          const errorMsg: WebSocketMessage = {
            type: 'error',
            error: `Binance connection error: ${error.message}`,
          };
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(errorMsg));
          }
        },
      }
    );
  }

  function calculateAndSendFootprint(clientWs: WebSocket, subs: ClientSubscriptions, kline: Kline): void {
    try {
      if (subs.tradeBuffer.length === 0) {
        logger.debug('No trades to calculate footprint');
        return;
      }

      if (!subs.footprintCalculator) {
        logger.error('FootprintCalculator not initialized');
        return;
      }

      const footprint = subs.footprintCalculator.calculateFootprint(subs.tradeBuffer, kline);
      const supportResistance = subs.footprintCalculator.identifySupportResistance(footprint);
      const aggressiveAnalysis: AggressiveAnalysis = subs.footprintCalculator.analyzeAggressiveTrades(footprint);

      // CVD hesapla ve guncelle
      const klineDelta = footprint.cumulativeDelta;
      subs.cumulativeDelta += klineDelta;

      const cvdData: CVDData = {
        time: kline.closeTime,
        value: subs.cumulativeDelta,
        change: klineDelta,
      };

      const footprintMsg: WebSocketMessage = {
        type: 'footprint',
        data: {
          footprint,
          supportResistance,
          aggressiveAnalysis,
          cvd: cvdData, // CVD verisini de gonder
        },
      };

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(footprintMsg));
      }

      logger.info(
        `📊 Footprint calculated: ${footprint.cells.length} price levels | Delta: ${klineDelta.toFixed(2)} | CVD: ${subs.cumulativeDelta.toFixed(2)} | Trades: ${subs.tradeBuffer.length}`
      );
    } catch (error) {
      logger.error('❌ Error calculating footprint:', error as Error);
    }
  }

  function handleUnsubscribe(subs: ClientSubscriptions): void {
    if (subs.binanceWs) {
      logger.info('🔌 Unsubscribing from Binance streams');
      subs.binanceWs.close();
      subs.binanceWs = undefined;
    }
    subs.tradeBuffer = [];
    subs.footprintCalculator = undefined;
    subs.cumulativeDelta = 0;
  }

  logger.info('🚀 WebSocket server started on /ws');
}
