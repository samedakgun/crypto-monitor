import { AggressiveAnalysis, FootprintCell, FootprintData, Kline, Trade } from '@shared/types/market';
import { logger } from '../utils/logger';

export class FootprintCalculator {
  private tickSize: number;

  constructor(tickSize: number = 1) {
    this.tickSize = tickSize;
  }

  calculateFootprint(trades: Trade[], kline: Kline): FootprintData {
    const priceLevels = this.generatePriceLevels(kline.low, kline.high);

    const cells: FootprintCell[] = priceLevels.map((price) => ({
      price,
      buyVolume: 0,
      sellVolume: 0,
      totalVolume: 0,
      delta: 0,
      tradeCount: 0,
    }));

    trades.forEach((trade) => {
      const priceLevel = this.roundToTick(trade.price);
      const cellIndex = cells.findIndex((c) => c.price === priceLevel);

      if (cellIndex !== -1) {
        const cell = cells[cellIndex];

        if (trade.isBuyerMaker) {
          cell.sellVolume += trade.quantity;
        } else {
          cell.buyVolume += trade.quantity;
        }

        cell.totalVolume += trade.quantity;
        cell.tradeCount += 1;
        cell.delta = cell.buyVolume - cell.sellVolume;
      }
    });

    let cumulativeDelta = 0;
    cells.forEach((cell) => {
      cumulativeDelta += cell.delta;
    });

    const populatedCells = cells.filter((c) => c.totalVolume > 0);

    logger.debug(`Footprint populated cells: ${populatedCells.length}`);

    return {
      symbol: kline.symbol,
      interval: kline.interval,
      openTime: kline.openTime,
      closeTime: kline.closeTime,
      open: kline.open,
      high: kline.high,
      low: kline.low,
      close: kline.close,
      volume: kline.volume,
      cells: populatedCells,
      cumulativeDelta,
    };
  }

  private generatePriceLevels(low: number, high: number): number[] {
    const levels: number[] = [];
    let currentPrice = this.roundToTick(low);
    const maxPrice = this.roundToTick(high);

    while (currentPrice <= maxPrice) {
      levels.push(currentPrice);
      currentPrice = parseFloat((currentPrice + this.tickSize).toFixed(8));
    }

    return levels;
  }

  private roundToTick(price: number): number {
    return Math.round(price / this.tickSize) * this.tickSize;
  }

  identifySupportResistance(footprint: FootprintData, threshold: number = 0.1): number[] {
    const totalVolume = footprint.cells.reduce((sum, cell) => sum + cell.totalVolume, 0);
    const minVolume = totalVolume * threshold;

    return footprint.cells
      .filter((cell) => cell.totalVolume >= minVolume)
      .map((cell) => cell.price)
      .sort((a, b) => b - a);
  }

  analyzeAggressiveTrades(footprint: FootprintData): AggressiveAnalysis {
    let aggressiveBuy = 0;
    let aggressiveSell = 0;

    footprint.cells.forEach((cell) => {
      if (cell.delta > 0) {
        aggressiveBuy += cell.buyVolume;
      } else if (cell.delta < 0) {
        aggressiveSell += cell.sellVolume;
      }
    });

    const ratio = aggressiveSell > 0 ? aggressiveBuy / aggressiveSell : 0;

    return { aggressiveBuy, aggressiveSell, ratio };
  }
}
