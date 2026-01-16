import { useState, useCallback } from 'react';
import { useToolStore } from '../store/toolStore';
// Varsayilan stiller
const DEFAULT_STYLES = {
    horizontal: { color: '#4096ff', lineWidth: 1, lineDash: [5, 5] },
    vertical: { color: '#4096ff', lineWidth: 1, lineDash: [5, 5] },
    trendline: { color: '#f59e0b', lineWidth: 2 },
    rectangle: { color: '#8b5cf6', lineWidth: 1, fillColor: '#8b5cf6', fillAlpha: 0.1 },
    measure: { color: '#ffd700', lineWidth: 2, lineDash: [5, 5] },
};
// ID generator
const generateId = () => `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// Tool to DrawingType mapping
const toolToDrawingType = {
    horizontal: 'horizontal',
    vertical: 'vertical',
    trendline: 'trendline',
    rectangle: 'rectangle',
    measure: 'measure',
};
export function useDrawingTools({ klines, priceRange, chartWidth, chartHeight, padding = { top: 10, bottom: 10, left: 10, right: 10 }, }) {
    const { activeTool, magnetEnabled } = useToolStore();
    const [drawings, setDrawings] = useState([]);
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedDrawingId, setSelectedDrawingId] = useState(null);
    // Crosshair position
    const [crosshair, setCrosshair] = useState(null);
    // Conversion helpers
    const xToTime = useCallback((x) => {
        if (klines.length === 0)
            return 0;
        const effectiveWidth = chartWidth - padding.left - padding.right;
        const step = effectiveWidth / klines.length;
        const index = Math.floor((x - padding.left) / step);
        const clampedIndex = Math.max(0, Math.min(index, klines.length - 1));
        return klines[clampedIndex]?.openTime || 0;
    }, [klines, chartWidth, padding]);
    const yToPrice = useCallback((y) => {
        const effectiveHeight = chartHeight - padding.top - padding.bottom;
        const ratio = (y - padding.top) / effectiveHeight;
        return priceRange.max - ratio * (priceRange.max - priceRange.min);
    }, [priceRange, chartHeight, padding]);
    const priceToY = useCallback((price) => {
        const effectiveHeight = chartHeight - padding.top - padding.bottom;
        return padding.top + ((priceRange.max - price) / (priceRange.max - priceRange.min)) * effectiveHeight;
    }, [priceRange, chartHeight, padding]);
    const timeToX = useCallback((time) => {
        if (klines.length === 0)
            return padding.left;
        const effectiveWidth = chartWidth - padding.left - padding.right;
        const step = effectiveWidth / klines.length;
        const index = klines.findIndex((k) => k.openTime >= time);
        if (index === -1)
            return padding.left + effectiveWidth;
        return padding.left + index * step + step / 2;
    }, [klines, chartWidth, padding]);
    // Magnet - en yakin OHLC noktasina yapistir
    const snapToCandle = useCallback((time, price) => {
        if (!magnetEnabled || klines.length === 0)
            return price;
        const candle = klines.find((k) => k.openTime <= time && k.closeTime >= time);
        if (!candle)
            return price;
        const distances = [
            { point: 'high', value: candle.high, distance: Math.abs(price - candle.high) },
            { point: 'low', value: candle.low, distance: Math.abs(price - candle.low) },
            { point: 'open', value: candle.open, distance: Math.abs(price - candle.open) },
            { point: 'close', value: candle.close, distance: Math.abs(price - candle.close) },
        ];
        // Fiyat farkini pixel'e cevir
        const pricePerPixel = (priceRange.max - priceRange.min) / (chartHeight - padding.top - padding.bottom);
        const snapThreshold = pricePerPixel * 10; // 10 pixel threshold
        const nearest = distances.sort((a, b) => a.distance - b.distance)[0];
        if (nearest.distance < snapThreshold) {
            return nearest.value;
        }
        return price;
    }, [magnetEnabled, klines, priceRange, chartHeight, padding]);
    // Mouse event handlers
    const handleMouseDown = useCallback((e) => {
        const drawingType = toolToDrawingType[activeTool];
        if (!drawingType)
            return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const time = xToTime(x);
        let price = yToPrice(y);
        // Magnet mode
        if (magnetEnabled) {
            price = snapToCandle(time, price);
        }
        setIsDrawing(true);
        setCurrentDrawing({
            id: generateId(),
            type: drawingType,
            points: [{ x, y: priceToY(price), time, price }],
            style: { ...DEFAULT_STYLES[drawingType] },
            locked: false,
            visible: true,
        });
    }, [activeTool, xToTime, yToPrice, priceToY, magnetEnabled, snapToCandle]);
    const handleMouseMove = useCallback((e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const time = xToTime(x);
        let price = yToPrice(y);
        // Crosshair guncelle
        if (activeTool === 'crosshair' || activeTool === 'select') {
            setCrosshair({ x, y, price, time });
        }
        else {
            setCrosshair(null);
        }
        // Cizim devam ediyor
        if (!isDrawing || !currentDrawing)
            return;
        // Magnet mode
        if (magnetEnabled) {
            price = snapToCandle(time, price);
        }
        const newPoint = { x, y: priceToY(price), time, price };
        setCurrentDrawing((prev) => {
            if (!prev || !prev.points)
                return prev;
            // Horizontal ve vertical line icin sadece ilk nokta + mevcut nokta
            if (prev.type === 'horizontal' || prev.type === 'vertical') {
                return { ...prev, points: [prev.points[0], newPoint] };
            }
            // Diger araclar icin
            return { ...prev, points: [prev.points[0], newPoint] };
        });
    }, [activeTool, isDrawing, currentDrawing, xToTime, yToPrice, priceToY, magnetEnabled, snapToCandle]);
    const handleMouseUp = useCallback(() => {
        if (!isDrawing || !currentDrawing)
            return;
        // Minimum mesafe kontrolu (tek tikla cizim onleme)
        if (currentDrawing.points && currentDrawing.points.length >= 2) {
            const [p1, p2] = currentDrawing.points;
            const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            if (distance > 5) {
                // 5px minimum mesafe
                setDrawings((prev) => [...prev, currentDrawing]);
            }
        }
        setCurrentDrawing(null);
        setIsDrawing(false);
    }, [isDrawing, currentDrawing]);
    const handleMouseLeave = useCallback(() => {
        setCrosshair(null);
        if (isDrawing) {
            setCurrentDrawing(null);
            setIsDrawing(false);
        }
    }, [isDrawing]);
    // Drawing management
    const deleteDrawing = useCallback((id) => {
        setDrawings((prev) => prev.filter((d) => d.id !== id));
        if (selectedDrawingId === id) {
            setSelectedDrawingId(null);
        }
    }, [selectedDrawingId]);
    const clearAllDrawings = useCallback(() => {
        setDrawings([]);
        setSelectedDrawingId(null);
    }, []);
    const toggleDrawingLock = useCallback((id) => {
        setDrawings((prev) => prev.map((d) => (d.id === id ? { ...d, locked: !d.locked } : d)));
    }, []);
    const toggleDrawingVisibility = useCallback((id) => {
        setDrawings((prev) => prev.map((d) => (d.id === id ? { ...d, visible: !d.visible } : d)));
    }, []);
    // Cizim render fonksiyonu
    const renderDrawings = useCallback((ctx) => {
        // Tum cizimleri render et
        [...drawings, currentDrawing].forEach((drawing) => {
            if (!drawing || !drawing.visible || !drawing.points || drawing.points.length < 1 || !drawing.style)
                return;
            const { type, points, style } = drawing;
            ctx.strokeStyle = style.color;
            ctx.lineWidth = style.lineWidth;
            if (style.lineDash) {
                ctx.setLineDash(style.lineDash);
            }
            else {
                ctx.setLineDash([]);
            }
            switch (type) {
                case 'horizontal':
                    if (points.length >= 1) {
                        const y = priceToY(points[0].price);
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(chartWidth, y);
                        ctx.stroke();
                        // Fiyat etiketi
                        ctx.fillStyle = style.color;
                        ctx.fillRect(chartWidth - 60, y - 10, 55, 20);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '11px Inter';
                        ctx.textAlign = 'center';
                        ctx.fillText(points[0].price.toFixed(2), chartWidth - 32, y + 4);
                    }
                    break;
                case 'vertical':
                    if (points.length >= 1) {
                        const x = points[0].x;
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, chartHeight);
                        ctx.stroke();
                    }
                    break;
                case 'trendline':
                    if (points.length >= 2) {
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, priceToY(points[0].price));
                        ctx.lineTo(points[1].x, priceToY(points[1].price));
                        ctx.stroke();
                    }
                    break;
                case 'rectangle':
                    if (points.length >= 2) {
                        const x1 = Math.min(points[0].x, points[1].x);
                        const y1 = Math.min(priceToY(points[0].price), priceToY(points[1].price));
                        const w = Math.abs(points[1].x - points[0].x);
                        const h = Math.abs(priceToY(points[1].price) - priceToY(points[0].price));
                        // Fill
                        if (style.fillColor && style.fillAlpha) {
                            ctx.fillStyle = style.fillColor;
                            ctx.globalAlpha = style.fillAlpha;
                            ctx.fillRect(x1, y1, w, h);
                            ctx.globalAlpha = 1;
                        }
                        // Stroke
                        ctx.strokeRect(x1, y1, w, h);
                    }
                    break;
                case 'measure':
                    if (points.length >= 2) {
                        const p1 = points[0];
                        const p2 = points[1];
                        // Cizgi
                        ctx.beginPath();
                        ctx.moveTo(p1.x, priceToY(p1.price));
                        ctx.lineTo(p2.x, priceToY(p2.price));
                        ctx.stroke();
                        // Olcum bilgileri
                        const priceDiff = Math.abs(p2.price - p1.price);
                        const priceChangePercent = ((priceDiff / p1.price) * 100).toFixed(2);
                        const timeDiff = Math.abs(p2.time - p1.time);
                        const barCount = klines.filter((k) => k.openTime >= Math.min(p1.time, p2.time) && k.openTime <= Math.max(p1.time, p2.time)).length;
                        // Info box
                        const infoX = (p1.x + p2.x) / 2;
                        const infoY = (priceToY(p1.price) + priceToY(p2.price)) / 2;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                        ctx.fillRect(infoX - 60, infoY - 40, 120, 80);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '11px Inter';
                        ctx.textAlign = 'left';
                        ctx.fillText(`Price: $${priceDiff.toFixed(2)}`, infoX - 50, infoY - 22);
                        ctx.fillText(`${priceChangePercent}%`, infoX - 50, infoY - 6);
                        ctx.fillText(`Bars: ${barCount}`, infoX - 50, infoY + 10);
                        ctx.fillText(`Time: ${formatTimeDiff(timeDiff)}`, infoX - 50, infoY + 26);
                    }
                    break;
            }
            ctx.setLineDash([]);
        });
        // Crosshair
        if (crosshair && (activeTool === 'crosshair' || activeTool === 'select')) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            // Horizontal line
            ctx.beginPath();
            ctx.moveTo(0, crosshair.y);
            ctx.lineTo(chartWidth, crosshair.y);
            ctx.stroke();
            // Vertical line
            ctx.beginPath();
            ctx.moveTo(crosshair.x, 0);
            ctx.lineTo(crosshair.x, chartHeight);
            ctx.stroke();
            ctx.setLineDash([]);
            // Price label
            ctx.fillStyle = '#4096ff';
            ctx.fillRect(chartWidth - 60, crosshair.y - 10, 55, 20);
            ctx.fillStyle = '#ffffff';
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(crosshair.price.toFixed(2), chartWidth - 32, crosshair.y + 4);
        }
    }, [drawings, currentDrawing, crosshair, activeTool, priceToY, chartWidth, chartHeight, klines]);
    // Cizim aracinin aktif olup olmadigini kontrol et
    const isDrawingToolActive = toolToDrawingType[activeTool] !== undefined || activeTool === 'crosshair';
    return {
        drawings,
        currentDrawing,
        isDrawing,
        crosshair,
        selectedDrawingId,
        isDrawingToolActive,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleMouseLeave,
        deleteDrawing,
        clearAllDrawings,
        toggleDrawingLock,
        toggleDrawingVisibility,
        setSelectedDrawingId,
        renderDrawings,
    };
}
// Zaman farki formatlama
function formatTimeDiff(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ${hours % 24}h`;
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m`;
    return `${seconds}s`;
}
