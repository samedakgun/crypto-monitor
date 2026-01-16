import { useEffect, useRef, useMemo, memo } from 'react';
import { Kline, Trade, CVDData } from '@shared/types/market';

interface CVDPanelProps {
  klines: Kline[];
  trades: Trade[];
}

function CVDPanel({ klines, trades }: CVDPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // CVD hesaplama
  const cvdData = useMemo(() => {
    if (klines.length === 0) return [];

    let cumulativeDelta = 0;
    const cvdSeries: CVDData[] = [];

    klines.forEach((kline) => {
      // Bu muma ait trade'leri filtrele
      const klineTrades = trades.filter(
        (t) => t.time >= kline.openTime && t.time < kline.closeTime
      );

      // Delta hesapla
      const buyVolume = klineTrades
        .filter((t) => !t.isBuyerMaker) // Market buy (aggressive buy)
        .reduce((sum, t) => sum + t.quantity, 0);

      const sellVolume = klineTrades
        .filter((t) => t.isBuyerMaker) // Market sell (aggressive sell)
        .reduce((sum, t) => sum + t.quantity, 0);

      const delta = buyVolume - sellVolume;
      cumulativeDelta += delta;

      cvdSeries.push({
        time: kline.closeTime,
        value: cumulativeDelta,
        change: delta,
      });
    });

    return cvdSeries;
  }, [klines, trades]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = 200;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear
    ctx.fillStyle = '#0b101a';
    ctx.fillRect(0, 0, width, height);

    if (cvdData.length === 0) {
      ctx.fillStyle = '#9fb0c7';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Waiting for data...', 16, height / 2);
      return;
    }

    drawCVDChart(ctx, width, height, cvdData);
  }, [cvdData]);

  const latestCVD = cvdData[cvdData.length - 1];
  const cvdChange = latestCVD?.change || 0;
  const isPositive = latestCVD ? latestCVD.value >= 0 : true;

  return (
    <div className="panel cvd cvd-panel">
      <div className="panel-head">
        <div>
          <h3>Cumulative Volume Delta (CVD)</h3>
          <p>Order Flow Balance</p>
        </div>
        <div className="cvd-stats">
          <div className={`cvd-value ${isPositive ? 'buy' : 'sell'}`}>
            {latestCVD ? (latestCVD.value >= 0 ? '+' : '') + latestCVD.value.toFixed(2) : '0.00'}
          </div>
          <div className={`cvd-change ${cvdChange >= 0 ? 'buy' : 'sell'}`}>
            {cvdChange >= 0 ? '▲' : '▼'} {Math.abs(cvdChange).toFixed(2)}
          </div>
        </div>
      </div>
      <div ref={containerRef} className="cvd-chart-container">
        <canvas ref={canvasRef} className="cvd-canvas" />
      </div>
    </div>
  );
}

/**
 * CVD histogram ve line chart çizimi
 */
function drawCVDChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cvdData: CVDData[]
) {
  const padding = { top: 20, bottom: 30, left: 50, right: 10 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  // Min/max değerler
  let maxCVD = Math.max(...cvdData.map((d) => d.value));
  let minCVD = Math.min(...cvdData.map((d) => d.value));
  const maxAbsChange = Math.max(...cvdData.map((d) => Math.abs(d.change)), 1);

  // Ensure zero line is always visible by extending range if needed
  if (minCVD > 0) minCVD = 0;
  if (maxCVD < 0) maxCVD = 0;

  // Add 10% padding to min/max for better visibility
  const range = maxCVD - minCVD;
  const rangePadding = 0.1;
  maxCVD += range * rangePadding;
  minCVD -= range * rangePadding;

  // Zero line position
  const zeroY = padding.top + chartHeight - ((0 - minCVD) / (maxCVD - minCVD || 1)) * chartHeight;

  // Bar width
  const barWidth = Math.max(2, chartWidth / cvdData.length);

  // Improved bar scaling - bars should be visible and proportional
  // Use 40% of chart height as max bar height
  const maxBarHeight = chartHeight * 0.4;
  const barScaleFactor = maxAbsChange > 0 ? maxBarHeight / maxAbsChange : 1;

  // Draw histogram (delta bars)
  cvdData.forEach((data, idx) => {
    const x = padding.left + idx * barWidth;

    // Bar height with minimum visibility
    const barHeight = Math.max(2, Math.abs(data.change) * barScaleFactor);

    // Renk belirleme (CVD trend'e göre)
    let color: string;
    if (idx > 0) {
      const prevValue = cvdData[idx - 1].value;
      if (data.value > prevValue) {
        color = 'rgba(54, 200, 138, 0.7)'; // CVD artıyor - yeşil
      } else if (data.value < prevValue) {
        color = 'rgba(224, 101, 106, 0.7)'; // CVD azalıyor - kırmızı
      } else {
        color = 'rgba(123, 139, 163, 0.5)'; // Nötr - gri
      }
    } else {
      color = 'rgba(123, 139, 163, 0.5)';
    }

    ctx.fillStyle = color;

    if (data.change >= 0) {
      // Yukarı bar (buy pressure)
      ctx.fillRect(x, zeroY - barHeight, barWidth * 0.8, barHeight);
    } else {
      // Aşağı bar (sell pressure)
      ctx.fillRect(x, zeroY, barWidth * 0.8, barHeight);
    }
  });

  // Draw CVD line (cumulative)
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2;
  ctx.beginPath();

  cvdData.forEach((data, idx) => {
    const x = padding.left + idx * barWidth + barWidth / 2;
    const y = padding.top + chartHeight - ((data.value - minCVD) / (maxCVD - minCVD || 1)) * chartHeight;

    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw zero line
  ctx.strokeStyle = '#8ba0ba';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(padding.left, zeroY);
  ctx.lineTo(width - padding.right, zeroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw grid
  drawGrid(ctx, padding, chartWidth, chartHeight);

  // Draw Y-axis labels
  drawYAxisLabels(ctx, padding, chartHeight, minCVD, maxCVD);
}

/**
 * Grid çizimi
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  padding: { top: number; bottom: number; left: number; right: number },
  chartWidth: number,
  chartHeight: number
) {
  ctx.strokeStyle = 'rgba(27, 38, 54, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);

  // Horizontal grid lines
  const rows = 4;
  for (let i = 0; i <= rows; i++) {
    const y = padding.top + (chartHeight / rows) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
  }

  ctx.setLineDash([]);
}

/**
 * Y ekseni etiketleri
 */
function drawYAxisLabels(
  ctx: CanvasRenderingContext2D,
  padding: { top: number; bottom: number; left: number; right: number },
  chartHeight: number,
  minCVD: number,
  maxCVD: number
) {
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#8ba0ba';

  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const value = minCVD + ((maxCVD - minCVD) / steps) * i;
    const y = padding.top + chartHeight - ((value - minCVD) / (maxCVD - minCVD || 1)) * chartHeight;

    ctx.fillText(value.toFixed(1), padding.left - 5, y);
  }

  // Zero line label
  const zeroY = padding.top + chartHeight - ((0 - minCVD) / (maxCVD - minCVD || 1)) * chartHeight;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('0', padding.left - 5, zeroY);
}

// Memoize to prevent unnecessary re-renders
export default memo(CVDPanel);
