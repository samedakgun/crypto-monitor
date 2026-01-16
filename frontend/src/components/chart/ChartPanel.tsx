import { useEffect, useRef, useState, useCallback } from 'react';
import { Kline, OrderBook, FootprintData, Trade, FRVPRange } from '@shared/types/market';
import PriceScale from './PriceScale';
import TimeScale from './TimeScale';
import FRVPOverlay from './FRVPOverlay';
import { useMarketStore } from '../../store/marketStore';
import { useToolStore } from '../../store/toolStore';
import { drawFootprintCandle, hasFootprintData } from './FootprintCandle';
import { useDrawingTools } from '../../hooks/useDrawingTools';
import { useOrderBookFlash } from '../../hooks/useOrderBookFlash';
import { useBigTrades, BigTrade } from '../../hooks/useBigTrades';
import { useFilteredTradeBubbles, FilteredTradeBubble } from '../../hooks/useFilteredTradeBubbles';

interface ChartPanelProps {
  klines: Kline[];
  trades: Trade[];
  orderBook?: OrderBook | null;
  footprintData?: FootprintData | null;
  footprintHistory?: Map<number, FootprintData>;
  enableFootprint?: boolean;
  tradeFilterThreshold?: number;
}

function ChartPanel({ klines, trades, orderBook, footprintData, footprintHistory, enableFootprint = true, tradeFilterThreshold = 0 }: ChartPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [containerWidth, setContainerWidth] = useState(800);
  const { selectedInterval, bigTradeThreshold } = useMarketStore();
  const { activeTool, isSelectingFRVP, frvpRange, setFRVPRange, setIsSelectingFRVP } = useToolStore();

  // Mouse selection state for FRVP
  const [selectionStart, setSelectionStart] = useState<{ x: number; index: number } | null>(null);

  // Fixed dimensions
  const CHART_HEIGHT = 500;
  const PRICE_SCALE_WIDTH = 80;
  const TIME_SCALE_HEIGHT = 30;

  const chartWidth = containerWidth - PRICE_SCALE_WIDTH;
  const chartHeight = CHART_HEIGHT - TIME_SCALE_HEIGHT;

  // Drawing tools hook
  const {
    drawings,
    crosshair,
    isDrawingToolActive,
    handleMouseDown: handleDrawingMouseDown,
    handleMouseMove: handleDrawingMouseMove,
    handleMouseUp: handleDrawingMouseUp,
    handleMouseLeave: handleDrawingMouseLeave,
    renderDrawings,
    clearAllDrawings,
  } = useDrawingTools({
    klines,
    priceRange,
    chartWidth,
    chartHeight,
  });

  // Order book flash effect hook
  const flashingOrders = useOrderBookFlash(orderBook || null);

  // Big trades detection hook
  const bigTrades = useBigTrades(trades, bigTradeThreshold);

  // Filtered trade bubbles hook
  const filteredBubbles = useFilteredTradeBubbles(trades, tradeFilterThreshold);

  // Get container width on mount
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      setContainerWidth(container.clientWidth);
    }
  }, []);

  // Fiyat aralığını hesapla
  useEffect(() => {
    if (klines.length === 0) {
      setPriceRange({ min: 0, max: 0 });
      return;
    }

    const minPrice = Math.min(...klines.map((c) => c.low));
    const maxPrice = Math.max(...klines.map((c) => c.high));

    // %5 padding ekle
    const padding = (maxPrice - minPrice) * 0.05;
    setPriceRange({
      min: minPrice - padding,
      max: maxPrice + padding,
    });
  }, [klines]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = chartWidth * ratio;
    canvas.height = chartHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear
    ctx.fillStyle = '#0b101a';
    ctx.fillRect(0, 0, chartWidth, chartHeight);

    if (!klines.length) {
      ctx.fillStyle = '#9fb0c7';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Waiting for data...', 16, 28);
      return;
    }

    drawGrid(ctx, chartWidth, chartHeight);
    drawCandles(ctx, chartWidth, chartHeight, klines, priceRange, footprintData, footprintHistory, enableFootprint);

    // Big trades baloncuklarını çiz
    if (bigTrades.length > 0) {
      drawBigTradeBubbles(ctx, bigTrades, klines, chartWidth, chartHeight, priceRange);
    }

    // Filtered trade baloncuklarını çiz
    if (filteredBubbles.length > 0 && tradeFilterThreshold > 0) {
      drawFilteredTradeBubbles(ctx, filteredBubbles, klines, chartWidth, chartHeight, priceRange);
    }
  }, [klines, priceRange, chartWidth, chartHeight, footprintData, footprintHistory, enableFootprint, bigTrades, filteredBubbles, tradeFilterThreshold]);

  // Drawing overlay canvas rendering
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = chartWidth * ratio;
    canvas.height = chartHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear
    ctx.clearRect(0, 0, chartWidth, chartHeight);

    // Render drawings and crosshair
    renderDrawings(ctx);
  }, [chartWidth, chartHeight, drawings, crosshair, renderDrawings]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const newWidth = container.clientWidth;
      setContainerWidth(newWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unified mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // FRVP selection mode
      if (isSelectingFRVP && klines.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = chartWidth / klines.length;
        const clickedIndex = Math.floor((x - 10) / step);

        if (clickedIndex >= 0 && clickedIndex < klines.length) {
          setSelectionStart({ x, index: clickedIndex });
        }
        return;
      }

      // Drawing tools
      if (isDrawingToolActive) {
        handleDrawingMouseDown(e);
      }
    },
    [isSelectingFRVP, klines, chartWidth, isDrawingToolActive, handleDrawingMouseDown]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Drawing tools (crosshair dahil)
      if (isDrawingToolActive || activeTool === 'select' || activeTool === 'crosshair') {
        handleDrawingMouseMove(e);
      }
    },
    [isDrawingToolActive, activeTool, handleDrawingMouseMove]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // FRVP selection mode
      if (isSelectingFRVP && selectionStart && klines.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const step = chartWidth / klines.length;
        const clickedIndex = Math.floor((x - 10) / step);

        if (clickedIndex >= 0 && clickedIndex < klines.length) {
          const startIndex = Math.min(selectionStart.index, clickedIndex);
          const endIndex = Math.max(selectionStart.index, clickedIndex);

          const range: FRVPRange = {
            startTime: klines[startIndex].openTime,
            endTime: klines[endIndex].closeTime,
            startIndex,
            endIndex,
          };

          setFRVPRange(range);
          setIsSelectingFRVP(false);
          setSelectionStart(null);
        }
        return;
      }

      // Drawing tools
      if (isDrawingToolActive) {
        handleDrawingMouseUp();
      }
    },
    [isSelectingFRVP, selectionStart, klines, chartWidth, isDrawingToolActive, handleDrawingMouseUp, setFRVPRange, setIsSelectingFRVP]
  );

  const handleMouseLeave = useCallback(() => {
    if (isSelectingFRVP && selectionStart) {
      setSelectionStart(null);
    }
    handleDrawingMouseLeave();
  }, [isSelectingFRVP, selectionStart, handleDrawingMouseLeave]);

  // Cursor style
  const getCursorStyle = () => {
    if (isSelectingFRVP) return 'crosshair';
    if (activeTool === 'crosshair') return 'crosshair';
    if (activeTool === 'horizontal') return 'row-resize';
    if (activeTool === 'vertical') return 'col-resize';
    if (isDrawingToolActive) return 'crosshair';
    return 'default';
  };

  return (
    <div className="panel chart">
      <div className="panel-head">
        <div>
          <h3>Footprint Chart (live)</h3>
          <p>Trades, kline ve derinlik akışı</p>
        </div>
        {drawings.length > 0 && (
          <button
            className="clear-drawings-btn"
            onClick={clearAllDrawings}
            title="Clear all drawings"
          >
            Clear Drawings ({drawings.length})
          </button>
        )}
      </div>
      <div ref={containerRef} className="chart-container">
        <canvas
          ref={canvasRef}
          className="chart-canvas"
        />
        {/* Drawing overlay canvas */}
        <canvas
          ref={drawingCanvasRef}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            cursor: getCursorStyle(),
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${chartWidth}px`,
            height: `${chartHeight}px`,
            pointerEvents: 'auto',
          }}
        />
        <FRVPOverlay
          frvpRange={frvpRange}
          trades={trades}
          priceRange={priceRange}
          width={chartWidth}
          height={chartHeight}
          priceToY={(p) =>
            10 + ((priceRange.max - p) / (priceRange.max - priceRange.min || 1)) * (chartHeight - 20)
          }
          chartArea={{
            x: 10,
            y: 10,
            width: chartWidth - 20,
            height: chartHeight - 20,
          }}
        />
        <PriceScale
          orderBook={orderBook || null}
          priceRange={priceRange}
          height={chartHeight}
          width={PRICE_SCALE_WIDTH}
          flashingOrders={flashingOrders}
        />
        <TimeScale
          klines={klines}
          width={chartWidth}
          height={TIME_SCALE_HEIGHT}
          timeframe={selectedInterval}
        />
      </div>
    </div>
  );
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = '#1b2636';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);

  const rows = 6;
  for (let i = 0; i <= rows; i += 1) {
    const y = (height / rows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const cols = 10;
  const colStep = width / cols;
  for (let i = 0; i <= cols; i += 1) {
    const x = colStep * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

function drawCandles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  klines: Kline[],
  priceRange: { min: number; max: number },
  footprintData: FootprintData | null | undefined,
  footprintHistory: Map<number, FootprintData> | undefined,
  enableFootprint: boolean
) {
  const padding = { top: 10, bottom: 10, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const priceToY = (p: number) =>
    padding.top + ((priceRange.max - p) / (priceRange.max - priceRange.min || 1)) * chartHeight;

  const step = chartWidth / klines.length;
  const candleWidth = Math.min(60, Math.max(8, step * 0.8));

  // Footprint rendering kontrolü
  const useFootprint = enableFootprint && hasFootprintData(footprintData);

  klines.forEach((kline, idx) => {
    const x = padding.left + idx * step + step / 2;

    // Look up footprint from history using openTime as key
    let klineFootprint: FootprintData | null = null;

    if (footprintHistory && footprintHistory.has(kline.openTime)) {
      klineFootprint = footprintHistory.get(kline.openTime)!;
    } else if (footprintData && footprintData.openTime === kline.openTime) {
      // Fallback to current footprint if not in history yet
      klineFootprint = footprintData;
    }

    if (useFootprint && klineFootprint) {
      // Footprint candlestick çiz
      drawFootprintCandle(ctx, x, kline, klineFootprint, candleWidth, priceToY, {
        cellHeight: 6,
        showVolumes: candleWidth > 40,
        minCellWidth: 20,
      });
    } else {
      // Normal candlestick çiz (legacy mod veya footprint verisi olmayan mumlar)
      drawTraditionalCandleLocal(ctx, x, kline, candleWidth, priceToY);
    }
  });
}

/**
 * Traditional candlestick rendering (footprint olmadan)
 */
function drawTraditionalCandleLocal(
  ctx: CanvasRenderingContext2D,
  x: number,
  kline: Kline,
  candleWidth: number,
  priceToY: (price: number) => number
) {
  const yHigh = priceToY(kline.high);
  const yLow = priceToY(kline.low);
  const yOpen = priceToY(kline.open);
  const yClose = priceToY(kline.close);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyBottom = Math.max(yOpen, yClose);
  const bodyHeight = Math.max(2, bodyBottom - bodyTop);
  const bodyWidth = Math.max(6, candleWidth * 0.7);
  const isUp = kline.close >= kline.open;

  // Wick (fitil)
  ctx.strokeStyle = '#8ba0ba';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, yHigh);
  ctx.lineTo(x, yLow);
  ctx.stroke();

  // Body (gövde)
  ctx.fillStyle = isUp ? '#36c88a' : '#e0656a';
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
  ctx.globalAlpha = 1;

  // Border
  ctx.strokeStyle = isUp ? '#2a9d6f' : '#c24d51';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
}

/**
 * Big trade baloncuklarını çiz
 */
function drawBigTradeBubbles(
  ctx: CanvasRenderingContext2D,
  bigTrades: BigTrade[],
  klines: Kline[],
  chartWidth: number,
  chartHeight: number,
  priceRange: { min: number; max: number }
) {
  const padding = { top: 10, bottom: 10, left: 10, right: 10 };
  const chartArea = {
    width: chartWidth - padding.left - padding.right,
    height: chartHeight - padding.top - padding.bottom,
  };

  // Koordinat dönüşüm fonksiyonları
  const timeToX = (time: number) => {
    if (klines.length === 0) return 0;

    const firstTime = klines[0].openTime;
    const lastTime = klines[klines.length - 1].closeTime;
    const timeRange = lastTime - firstTime;

    if (timeRange === 0) return padding.left;

    const relativeTime = time - firstTime;
    return padding.left + (relativeTime / timeRange) * chartArea.width;
  };

  const priceToY = (price: number) => {
    return padding.top + ((priceRange.max - price) / (priceRange.max - priceRange.min || 1)) * chartArea.height;
  };

  const baseSize = 10;
  const maxSize = 60;

  bigTrades.forEach(trade => {
    const x = timeToX(trade.time);
    const y = priceToY(trade.price);

    // X koordinatı canvas dışındaysa çizme
    if (x < padding.left || x > chartWidth - padding.right) {
      return;
    }

    // Balon boyutu (multiplier'a göre, sqrt ile daha yumuşak büyüme)
    const size = Math.min(
      maxSize,
      baseSize * Math.sqrt(trade.multiplier)
    );

    // Renk - isBuyerMaker kontrolü (true = satış, false = alış)
    const isBuy = !trade.isBuyerMaker;
    const fillColor = isBuy
      ? 'rgba(54, 200, 138, 0.4)'  // Alış - yeşil
      : 'rgba(224, 101, 106, 0.4)'; // Satış - kırmızı

    const strokeColor = isBuy
      ? 'rgba(54, 200, 138, 0.9)'
      : 'rgba(224, 101, 106, 0.9)';

    // Balon gölgesi
    ctx.shadowColor = isBuy ? 'rgba(54, 200, 138, 0.5)' : 'rgba(224, 101, 106, 0.5)';
    ctx.shadowBlur = 8;

    // Balon çiz
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Kenar çizgisi
    ctx.shadowBlur = 0; // Gölgeyi kapat
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hacim etiketi (büyük baloncuklarda)
    if (size > 25) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 3;

      const volumeText = trade.quantity.toFixed(2);
      ctx.fillText(volumeText, x, y);

      ctx.shadowBlur = 0; // Gölgeyi kapat
    }

    // Multiplier göstergesi (çok büyük trade'ler için)
    if (trade.multiplier > 5) {
      ctx.fillStyle = '#ffd700'; // Altın sarısı
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${trade.multiplier.toFixed(1)}x`, x, y + size / 2 + 4);
    }
  });

  // Shadow'u sıfırla
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

/**
 * Filtered trade baloncuklarını çiz
 */
function drawFilteredTradeBubbles(
  ctx: CanvasRenderingContext2D,
  filteredBubbles: FilteredTradeBubble[],
  klines: Kline[],
  chartWidth: number,
  chartHeight: number,
  priceRange: { min: number; max: number }
) {
  if (klines.length === 0 || filteredBubbles.length === 0) return;

  const padding = { top: 10, bottom: 10, left: 10, right: 10 };
  const chartArea = {
    width: chartWidth - padding.left - padding.right,
    height: chartHeight - padding.top - padding.bottom,
  };

  const candleWidth = chartArea.width / klines.length;

  // Koordinat dönüşüm fonksiyonu
  const priceToY = (price: number) => {
    return padding.top + ((priceRange.max - price) / (priceRange.max - priceRange.min || 1)) * chartArea.height;
  };

  // Track overlapping bubbles for offset
  const positionMap = new Map<string, number>();

  filteredBubbles.forEach((bubble) => {
    // Find which candle the trade belongs to
    const candleIndex = klines.findIndex(
      (k) => bubble.time >= k.openTime && bubble.time <= k.closeTime
    );

    if (candleIndex === -1) return; // Trade outside visible range

    const candle = klines[candleIndex];
    const candleStartX = padding.left + candleIndex * candleWidth;

    // Position within candle based on exact time
    const timeProgress =
      (bubble.time - candle.openTime) / (candle.closeTime - candle.openTime);
    const x = candleStartX + timeProgress * candleWidth;

    let y = priceToY(bubble.price);

    // Handle overlapping bubbles - add small random offset
    const posKey = `${Math.round(x)}-${Math.round(y)}`;
    const overlapCount = positionMap.get(posKey) || 0;
    if (overlapCount > 0) {
      // Add small offset for overlapping bubbles
      y += (Math.random() * 4 - 2) + overlapCount * 2;
    }
    positionMap.set(posKey, overlapCount + 1);

    // X koordinatı canvas dışındaysa çizme
    if (x < padding.left || x > chartWidth - padding.right) {
      return;
    }

    // Color based on buy/sell
    const isBuy = !bubble.isBuyerMaker;
    const baseColor = isBuy ? '54, 200, 138' : '224, 101, 106'; // RGB values

    const fillColor = `rgba(${baseColor}, ${bubble.opacity})`;
    const strokeColor = `rgba(${baseColor}, ${Math.min(1, bubble.opacity + 0.2)})`;

    // Draw bubble
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, bubble.size, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Quantity label for larger bubbles
    if (bubble.size > 15) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 2;

      const volumeText = bubble.quantity.toFixed(2);
      ctx.fillText(volumeText, x, y);

      ctx.shadowBlur = 0;
    }
  });

  // Reset shadow
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
}

export default ChartPanel;
