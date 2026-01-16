import { FootprintCell, FootprintData, Kline } from '@shared/types/market';

/**
 * Footprint candlestick rendering utilities
 * Her mumun içinde fiyat seviyelerine göre bid/ask hacim hücreleri çizer
 */

export interface FootprintRenderOptions {
  cellHeight: number;
  showVolumes: boolean;
  minCellWidth: number;
}

/**
 * Tek bir footprint candlestick çizer
 */
export function drawFootprintCandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  kline: Kline,
  footprint: FootprintData | null,
  candleWidth: number,
  priceToY: (price: number) => number,
  options: FootprintRenderOptions = {
    cellHeight: 8,
    showVolumes: false,
    minCellWidth: 20,
  }
) {
  if (!footprint || footprint.cells.length === 0) {
    // Footprint yoksa normal candlestick çiz
    drawTraditionalCandle(ctx, x, kline, candleWidth, priceToY);
    return;
  }

  const cellWidth = Math.max(options.minCellWidth, candleWidth * 0.9);

  // Her fiyat seviyesi için hücre çiz
  footprint.cells.forEach((cell) => {
    const y = priceToY(cell.price);

    // Hücre arka planı (delta yoğunluk rengi)
    ctx.fillStyle = getCellBackgroundColor(cell);
    ctx.fillRect(x - cellWidth / 2, y - options.cellHeight / 2, cellWidth, options.cellHeight);

    // Sol yarı: Sell Volume (Kırmızı)
    if (cell.sellVolume > 0) {
      const sellRatio = cell.totalVolume > 0 ? cell.sellVolume / cell.totalVolume : 0;
      const sellWidth = (cellWidth / 2) * sellRatio;
      ctx.fillStyle = getSellVolumeColor(cell.sellVolume, cell.totalVolume);
      ctx.fillRect(x - cellWidth / 2, y - options.cellHeight / 2, sellWidth, options.cellHeight);
    }

    // Sağ yarı: Buy Volume (Yeşil)
    if (cell.buyVolume > 0) {
      const buyRatio = cell.totalVolume > 0 ? cell.buyVolume / cell.totalVolume : 0;
      const buyWidth = (cellWidth / 2) * buyRatio;
      ctx.fillStyle = getBuyVolumeColor(cell.buyVolume, cell.totalVolume);
      ctx.fillRect(x, y - options.cellHeight / 2, buyWidth, options.cellHeight);
    }

    // Orta çizgi (bid/ask ayırıcı)
    ctx.strokeStyle = '#8ba0ba';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - options.cellHeight / 2);
    ctx.lineTo(x, y + options.cellHeight / 2);
    ctx.stroke();

    // Volume rakamlarını göster (eğer isteniyorsa ve yeterli yer varsa)
    if (options.showVolumes && candleWidth > 40) {
      drawVolumeNumbers(ctx, x, y, cell, cellWidth, options.cellHeight);
    }
  });

  // Mum gövdesinin dış çerçevesi (opsiyonel)
  drawCandleOutline(ctx, x, kline, candleWidth, priceToY);
}

/**
 * Normal candlestick çiz (footprint verisi yoksa)
 */
function drawTraditionalCandle(
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
  const bodyWidth = Math.max(8, candleWidth * 0.7);
  const isUp = kline.close >= kline.open;

  // Wick (fitil)
  ctx.strokeStyle = '#8ba0ba';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, yHigh);
  ctx.lineTo(x, yLow);
  ctx.stroke();

  // Body (gövde) - Doji kontrolü ile
  const colors = getCandleBodyColor(kline);
  ctx.fillStyle = colors.body;
  ctx.globalAlpha = colors.alpha;
  ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
  ctx.globalAlpha = 1;

  // Border
  ctx.strokeStyle = isUp ? '#36c88a' : '#e0656a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
}

/**
 * Mum gövdesinin dış çerçevesini çiz
 */
function drawCandleOutline(
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

  // Fitil çizgisi
  ctx.strokeStyle = 'rgba(139, 160, 186, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, yHigh);
  ctx.lineTo(x, Math.min(yOpen, yClose));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, Math.max(yOpen, yClose));
  ctx.lineTo(x, yLow);
  ctx.stroke();
}

/**
 * Hücre arka plan rengini hesapla (delta yoğunluğuna göre)
 */
function getCellBackgroundColor(cell: FootprintCell): string {
  if (cell.totalVolume === 0) {
    return 'rgba(11, 16, 26, 0.8)'; // Boş hücre
  }

  const deltaRatio = Math.abs(cell.delta) / cell.totalVolume;
  const intensity = Math.min(1, deltaRatio);

  if (cell.delta > 0) {
    // Pozitif delta - yeşil ton (alıcı baskısı)
    const alpha = 0.1 + intensity * 0.3;
    return `rgba(54, 200, 138, ${alpha})`;
  } else if (cell.delta < 0) {
    // Negatif delta - kırmızı ton (satıcı baskısı)
    const alpha = 0.1 + intensity * 0.3;
    return `rgba(224, 101, 106, ${alpha})`;
  }

  // Delta = 0 - nötr gri
  return 'rgba(123, 139, 163, 0.1)';
}

/**
 * Buy volume rengi (yeşil gradyan)
 */
function getBuyVolumeColor(buyVolume: number, totalVolume: number): string {
  if (totalVolume === 0) return 'rgba(54, 200, 138, 0.2)';

  const ratio = buyVolume / totalVolume;
  const alpha = 0.4 + ratio * 0.5; // 0.4 - 0.9 arası

  return `rgba(54, 200, 138, ${alpha})`;
}

/**
 * Sell volume rengi (kırmızı gradyan)
 */
function getSellVolumeColor(sellVolume: number, totalVolume: number): string {
  if (totalVolume === 0) return 'rgba(224, 101, 106, 0.2)';

  const ratio = sellVolume / totalVolume;
  const alpha = 0.4 + ratio * 0.5; // 0.4 - 0.9 arası

  return `rgba(224, 101, 106, ${alpha})`;
}

/**
 * Volume rakamlarını hücre içinde göster
 */
function drawVolumeNumbers(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: FootprintCell,
  cellWidth: number,
  cellHeight: number
) {
  ctx.font = '9px Inter, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Sol taraf - Sell volume
  if (cell.sellVolume > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    const sellText = formatVolume(cell.sellVolume);
    ctx.fillText(sellText, x - cellWidth / 4, y);
  }

  // Sağ taraf - Buy volume
  if (cell.buyVolume > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    const buyText = formatVolume(cell.buyVolume);
    ctx.fillText(buyText, x + cellWidth / 4, y);
  }

  ctx.globalAlpha = 1;
}

/**
 * Volume formatla (1.2K, 3.5M gibi)
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  } else if (volume >= 1) {
    return volume.toFixed(1);
  } else {
    return volume.toFixed(3);
  }
}

/**
 * Mum gövdesi rengini hesapla (Doji kontrolü ile)
 * Roadmap 2.2 implementasyonu
 */
export function getCandleBodyColor(kline: Kline): { body: string; alpha: number } {
  const priceChange = kline.close - kline.open;
  const bodySize = Math.abs(priceChange);
  const fullRange = kline.high - kline.low;
  const averageSize = fullRange * 0.5;

  // Doji kontrolü (gövde, toplam menzile göre çok küçükse)
  if (bodySize < fullRange * 0.1) {
    return { body: '#7b8ba3', alpha: 0.6 }; // Gri/soluk - belirsiz piyasa
  }

  if (kline.close > kline.open) {
    return { body: '#36c88a', alpha: 0.9 }; // Yeşil - yükseliş
  } else {
    return { body: '#e0656a', alpha: 0.9 }; // Kırmızı - düşüş
  }
}

/**
 * Footprint veri var mı kontrol et
 */
export function hasFootprintData(footprint: FootprintData | null | undefined): boolean {
  return footprint !== null && footprint !== undefined && footprint.cells.length > 0;
}
