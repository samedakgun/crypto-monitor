import { Request, Response } from 'express';
import { BinanceApiService } from '../services/binanceApiService';
import { logger } from '../utils/logger';

export class MarketController {
  private binanceApi = new BinanceApiService();

  getKlines = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol, interval } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 500;
      const endTime = req.query.endTime ? parseInt(req.query.endTime as string, 10) : undefined;

      const klines = await this.binanceApi.getKlines(symbol.toUpperCase(), interval, limit, endTime);
      res.json(klines);
    } catch (error: any) {
      logger.error('Error fetching klines:', error);
      res.status(500).json({ error: error.message });
    }
  };

  getTrades = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 100;

      const trades = await this.binanceApi.getAggregateTrades(symbol.toUpperCase(), limit);
      res.json(trades);
    } catch (error: any) {
      logger.error('Error fetching trades:', error);
      res.status(500).json({ error: error.message });
    }
  };

  getOrderBook = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const orderBook = await this.binanceApi.getOrderBook(symbol.toUpperCase(), limit);
      res.json(orderBook);
    } catch (error: any) {
      logger.error('Error fetching order book:', error);
      res.status(500).json({ error: error.message });
    }
  };

  getTicker = async (req: Request, res: Response): Promise<void> => {
    try {
      const { symbol } = req.params;
      const ticker = await this.binanceApi.get24hrTicker(symbol.toUpperCase());
      res.json(ticker);
    } catch (error: any) {
      logger.error('Error fetching ticker:', error);
      res.status(500).json({ error: error.message });
    }
  };

  getSymbols = async (_req: Request, res: Response): Promise<void> => {
    const symbols = [
      { symbol: 'BTCUSDT', name: 'Bitcoin', tickSize: 1 },
      { symbol: 'ETHUSDT', name: 'Ethereum', tickSize: 0.5 },
      { symbol: 'BNBUSDT', name: 'BNB', tickSize: 0.1 },
      { symbol: 'SOLUSDT', name: 'Solana', tickSize: 0.01 },
      { symbol: 'XRPUSDT', name: 'Ripple', tickSize: 0.0001 },
    ];
    res.json(symbols);
  };
}
