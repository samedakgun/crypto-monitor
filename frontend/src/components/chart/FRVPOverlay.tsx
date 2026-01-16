import { useEffect, useRef, useMemo, memo } from 'react';
import { Trade, FRVPRange, VolumeProfileData } from '@shared/types/market';
import { calculateVolumeProfile, volumeProfileToArray } from '../../utils/volumeProfile';
import { getSymbolConfig } from '@shared/config/symbols';
import { formatVolume, formatPrice } from '@shared/utils/formatters';
import { useMarketStore } from '../../store/marketStore';

interface FRVPOverlayProps {
  frvpRange: FRVPRange | null;
  trades: Trade[];
  priceRange: { min: number; max: number };
  width: number;
  height: number;
  priceToY: (price: number) => number;
  chartArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

function FRVPOverlay({
  frvpRange,
  trades,
  priceRange,
  width,
  height,
  priceToY,
  chartArea,
}: FRVPOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { selectedSymbol } = useMarketStore();

  // Get symbol config for tickSize
  const symbolConfig = useMemo(() => getSymbolConfig(selectedSymbol), [selectedSymbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (!frvpRange) return;

    // Volume Profile hesapla (use symbol's tickSize)
    const profileData = calculateVolumeProfile({
      trades,
      startTime: frvpRange.startTime,
      endTime: frvpRange.endTime,
      priceRange,
      tickSize: symbolConfig.tickSize,
    });

    // Render Volume Profile
    drawVolumeProfile(ctx, profileData, chartArea, priceToY, frvpRange);

    // Selection range göster
    drawSelectionRange(ctx, frvpRange, chartArea);
  }, [frvpRange, trades, priceRange, width, height, chartArea, priceToY, symbolConfig]);

  return (
    <canvas
      ref={canvasRef}
      className="frvp-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none', // Click'leri altındaki canvas'a geçir
      }}
    />
  );
}

/**
 * Volume Profile çiz
 */
function drawVolumeProfile(
  ctx: CanvasRenderingContext2D,
  profileData: VolumeProfileData,
  chartArea: { x: number; y: number; width: number; height: number },
  priceToY: (price: number) => number,
  frvpRange: FRVPRange
) {
  if (profileData.volumeAtPrice.size === 0) return;

  const maxBarWidth = chartArea.width * 0.25; // Maksimum %25 genişlik
  const volumeArray = volumeProfileToArray(profileData.volumeAtPrice);

  // Hacim barlarını çiz
  volumeArray.forEach(({ price, volume }) => {
    const y = priceToY(price);
    const barWidth = (volume / profileData.maxVolume) * maxBarWidth;

    // Renk gradyanı (yoğunluğa göre)
    const intensity = volume / profileData.maxVolume;
    const alpha = 0.3 + intensity * 0.5; // 0.3 - 0.8 arası
    const color = `rgba(64, 150, 255, ${alpha})`;

    ctx.fillStyle = color;
    ctx.fillRect(chartArea.x, y - 2, barWidth, 4);
  });

  // POC (Point of Control) çizgisi - Altın sarısı
  if (profileData.pocPrice > 0) {
    const pocY = priceToY(profileData.pocPrice);

    ctx.strokeStyle = '#ffd700'; // Altın
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(chartArea.x, pocY);
    ctx.lineTo(chartArea.x + chartArea.width, pocY);
    ctx.stroke();
    ctx.setLineDash([]);

    // POC label
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'right';
    ctx.fillText('POC', chartArea.x + chartArea.width - 5, pocY - 5);
  }

  // Value Area (70% hacim) - Açık mavi background
  if (profileData.valueArea.high > 0 && profileData.valueArea.low > 0) {
    const vaHighY = priceToY(profileData.valueArea.high);
    const vaLowY = priceToY(profileData.valueArea.low);

    ctx.fillStyle = 'rgba(64, 150, 255, 0.08)';
    ctx.fillRect(chartArea.x, vaHighY, chartArea.width, vaLowY - vaHighY);

    // Value Area borders
    ctx.strokeStyle = 'rgba(64, 150, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // VAH line
    ctx.beginPath();
    ctx.moveTo(chartArea.x, vaHighY);
    ctx.lineTo(chartArea.x + chartArea.width, vaHighY);
    ctx.stroke();

    // VAL line
    ctx.beginPath();
    ctx.moveTo(chartArea.x, vaLowY);
    ctx.lineTo(chartArea.x + chartArea.width, vaLowY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Labels
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(64, 150, 255, 0.8)';
    ctx.textAlign = 'right';
    ctx.fillText('VAH', chartArea.x + chartArea.width - 5, vaHighY - 3);
    ctx.fillText('VAL', chartArea.x + chartArea.width - 5, vaLowY + 10);
  }

  // Stats overlay (with time range)
  drawStatsOverlay(ctx, profileData, chartArea, frvpRange);
}

/**
 * Selection range göster (seçim yapılırken)
 */
function drawSelectionRange(
  ctx: CanvasRenderingContext2D,
  frvpRange: FRVPRange,
  chartArea: { x: number; y: number; width: number; height: number }
) {
  // Selection area highlight
  ctx.fillStyle = 'rgba(100, 180, 255, 0.05)';
  ctx.fillRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);

  // Selection borders
  ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(chartArea.x, chartArea.y, chartArea.width, chartArea.height);
}

/**
 * İstatistik bilgileri göster
 */
function drawStatsOverlay(
  ctx: CanvasRenderingContext2D,
  profileData: VolumeProfileData,
  chartArea: { x: number; y: number; width: number; height: number },
  frvpRange: FRVPRange
) {
  const padding = 10;
  const lineHeight = 16;
  const boxX = chartArea.x + padding;
  const boxY = chartArea.y + padding;
  const boxWidth = 200;
  const boxHeight = 110;

  // Background
  ctx.fillStyle = 'rgba(11, 16, 26, 0.85)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  // Border
  ctx.strokeStyle = 'rgba(64, 150, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  // Text
  ctx.font = '11px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#9fb0c7';

  let y = boxY + 15;

  // Title
  ctx.fillStyle = '#e8ecf5';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText('Volume Profile', boxX + 8, y);
  y += lineHeight + 4;

  // Time range (formatted)
  ctx.font = '10px Inter, sans-serif';
  ctx.fillStyle = '#9fb0c7';
  const startTime = new Date(frvpRange.startTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = new Date(frvpRange.endTime).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  ctx.fillText(`Range: ${startTime} - ${endTime}`, boxX + 8, y);
  y += lineHeight;

  // Stats (using symbol from marketStore via closure)
  ctx.font = '11px Inter, sans-serif';
  ctx.fillStyle = '#9fb0c7';

  ctx.fillText(`Total Volume: ${formatVolume(profileData.totalVolume, 'BTCUSDT')}`, boxX + 8, y);
  y += lineHeight;

  ctx.fillText(`POC: ${formatPrice(profileData.pocPrice, 'BTCUSDT')}`, boxX + 8, y);
  y += lineHeight;

  ctx.fillText(
    `VA High: ${formatPrice(profileData.valueArea.high, 'BTCUSDT')}`,
    boxX + 8,
    y
  );
  y += lineHeight;

  ctx.fillText(
    `VA Low: ${formatPrice(profileData.valueArea.low, 'BTCUSDT')}`,
    boxX + 8,
    y
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(FRVPOverlay);
