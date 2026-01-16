import { useMemo } from 'react';
import { Trade } from '@shared/types/market';

export interface FilteredTradeBubble extends Trade {
  excessQuantity: number; // quantity - threshold
  size: number; // calculated radius
  opacity: number; // calculated opacity
}

const BUBBLE_CONFIG = {
  baseRadius: 6,
  maxRadius: 20,
  baseOpacity: 0.3,
  maxOpacity: 0.9,
  maxBubbles: 100, // performance limit
};

export function useFilteredTradeBubbles(
  trades: Trade[],
  threshold: number
): FilteredTradeBubble[] {
  return useMemo(() => {
    // Don't filter if threshold is 0
    if (threshold === 0) {
      return [];
    }

    // Filter trades that meet the threshold
    const filtered = trades
      .filter((trade) => trade.quantity >= threshold)
      .slice(0, BUBBLE_CONFIG.maxBubbles); // Limit for performance

    if (filtered.length === 0) {
      return [];
    }

    // Calculate excess quantities
    const withExcess = filtered.map((trade) => ({
      ...trade,
      excessQuantity: trade.quantity - threshold,
    }));

    // Find max excess to calculate scale factors
    const maxExcess = Math.max(...withExcess.map((t) => t.excessQuantity));

    // Avoid division by zero
    if (maxExcess === 0) {
      return withExcess.map((trade) => ({
        ...trade,
        size: BUBBLE_CONFIG.baseRadius,
        opacity: BUBBLE_CONFIG.baseOpacity,
      }));
    }

    // Calculate scale factors
    const sizeScaleFactor =
      (BUBBLE_CONFIG.maxRadius - BUBBLE_CONFIG.baseRadius) / maxExcess;
    const opacityScaleFactor =
      (BUBBLE_CONFIG.maxOpacity - BUBBLE_CONFIG.baseOpacity) / maxExcess;

    // Apply calculations to each bubble
    return withExcess.map((trade) => ({
      ...trade,
      size: BUBBLE_CONFIG.baseRadius + trade.excessQuantity * sizeScaleFactor,
      opacity:
        BUBBLE_CONFIG.baseOpacity + trade.excessQuantity * opacityScaleFactor,
    }));
  }, [trades, threshold]);
}
