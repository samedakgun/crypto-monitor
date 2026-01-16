import { useEffect, useRef, memo } from 'react';
import { Kline, Timeframe } from '@shared/types/market';

interface TimeScaleProps {
  klines: Kline[];
  width: number;
  height?: number;
  timeframe: Timeframe;
  timezone?: 'UTC' | 'local';
}

function TimeScale({ klines, width, height = 30, timeframe, timezone = 'local' }: TimeScaleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear canvas
    ctx.fillStyle = '#0b101a';
    ctx.fillRect(0, 0, width, height);

    if (klines.length === 0) return;

    // Zaman etiketlerini çiz
    drawTimeLabels(ctx, klines, width, height, timeframe, timezone);

  }, [klines, width, height, timeframe, timezone]);

  return (
    <canvas
      ref={canvasRef}
      className="time-scale-canvas"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'absolute',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Zaman etiketlerini çiz
 */
function drawTimeLabels(
  ctx: CanvasRenderingContext2D,
  klines: Kline[],
  width: number,
  height: number,
  timeframe: Timeframe,
  timezone: 'UTC' | 'local'
) {
  const candleWidth = width / klines.length;
  const labelCount = Math.min(10, Math.floor(width / 100)); // Her 100px'de bir etiket
  const step = Math.max(1, Math.floor(klines.length / labelCount));

  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8ba0ba';

  // Üst border
  ctx.strokeStyle = '#162234';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.stroke();

  // Etiketleri çiz
  klines.forEach((kline, index) => {
    if (index % step !== 0) return;

    const x = (index + 0.5) * candleWidth;

    // Grid line (yukarı doğru)
    ctx.strokeStyle = 'rgba(27, 38, 54, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 5);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zaman etiketi
    const timeLabel = formatTimeLabel(kline.closeTime, timeframe, timezone);
    ctx.fillStyle = '#8ba0ba';
    ctx.fillText(timeLabel, x, height - 8);
  });
}

/**
 * Timeframe'e göre zaman formatla
 */
function formatTimeLabel(
  timestamp: number,
  timeframe: Timeframe,
  timezone: 'UTC' | 'local'
): string {
  const date = new Date(timestamp);

  // UTC veya local
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone === 'UTC' ? 'UTC' : undefined,
  };

  // Timeframe'e göre format
  if (['1m', '5m', '15m', '30m'].includes(timeframe)) {
    // Dakikalık periyotlar: Sadece saat:dakika
    return date.toLocaleTimeString('tr-TR', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (['1h', '4h'].includes(timeframe)) {
    // Saatlik periyotlar: Gün/Ay Saat:Dakika
    return date.toLocaleDateString('tr-TR', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (['1d', '1w'].includes(timeframe)) {
    // Günlük/haftalık: Gün/Ay/Yıl
    return date.toLocaleDateString('tr-TR', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  } else {
    // Varsayılan: Gün/Ay Saat:Dakika
    return date.toLocaleDateString('tr-TR', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

/**
 * Timestamp'ten okunabilir zaman farkı hesapla
 */
export function formatTimeDiff(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Memoize to prevent unnecessary re-renders
export default memo(TimeScale);
