# 🚀 Crypto Monitor - Eksiklikler ve Uygulama Yol Haritası

## 📋 İÇİNDEKİLER
1. [Mevcut Durum Analizi](#mevcut-durum-analizi)
2. [Eksiklikler Listesi](#eksiklikler-listesi)
3. [Öncelik Sıralaması](#öncelik-sıralaması)
4. [Detaylı Uygulama Planı](#detaylı-uygulama-planı)
5. [Teknik Mimari Önerileri](#teknik-mimari-önerileri)

---

## 📊 MEVCUT DURUM ANALİZİ

### ✅ Mevcut Çalışan Özellikler

| Özellik | Durum | Notlar |
|---------|-------|--------|
| WebSocket Bağlantısı | ✅ Çalışıyor | Binance WS entegrasyonu tamamlandı |
| Trade Stream | ✅ Çalışıyor | Gerçek zamanlı trade akışı aktif |
| Kline Stream | ✅ Çalışıyor | Mum verileri geliyor |
| Order Book Stream | ✅ Çalışıyor | Depth data aktif |
| Footprint Hesaplama | ✅ Çalışıyor | Backend'de footprint calculator çalışıyor |
| Basit Mum Grafiği | ⚠️ Kısmi | Canvas ile basit çizim var ama eksikler çok |
| Header/Navigation | ✅ Çalışıyor | Symbol ve timeframe seçimi aktif |
| Theme Toggle | ✅ Çalışıyor | Dark/Light mod çalışıyor |

### ❌ Eksik/Geliştirilmesi Gereken Özellikler

**Kritik Eksiklikler (index.html tasarımında var, React'ta yok):**

1. **Sol Taraf Çizim Araçları Rail** - Tamamen eksik
2. **Footprint Candlestick Görünümü** - Sadece tablo var, mumların içinde hücre yok
3. **Price Scale Renklendirme** - Bid/Ask baskısı gösterilmiyor
4. **CVD Paneli** - Sadece placeholder, işlevsel değil
5. **Volume Profile (FRVP)** - Tamamen eksik
6. **Çizim Araçları** - Hiçbiri yok
7. **Big Trades Bubble** - Tamamen eksik
8. **Threshold Kontrolü** - UI yok
9. **Magnet Mode** - Eksik
10. **Order Book - Price Scale Hizalama** - Yan yana değil, entegre değil

---

## 🎯 EKSİKLİKLER LİSTESİ

### 1. ANA GRAFİK BİLEŞENLERİ

#### 1.1 Fiyat Barı (Price Scale) - Sağ Taraf ❌
**Durum:** Sadece basit rakamlar var, renklendirme yok

**Eksikler:**
- ✅ Fiyat seviyelerini gösteriyor
- ❌ Bid/Ask baskısına göre renklendirme yok
- ❌ Yoğunluk derecesi renklendirmesi yok
- ❌ Order book ile senkronizasyon eksik
- ❌ Otomatik ölçeklendirme yok

**Uygulama:**
```typescript
// Yeni component: PriceScale.tsx
interface PriceScaleProps {
  orderBook: OrderBook;
  priceRange: { min: number; max: number };
  height: number;
}

// Renklendirme algoritması:
const getColorIntensity = (bidVolume: number, askVolume: number) => {
  const total = bidVolume + askVolume;
  if (total === 0) return { color: 'neutral', intensity: 0 };

  if (askVolume > bidVolume) {
    const intensity = ((askVolume - bidVolume) / total) * 100;
    return { color: 'green', intensity }; // Alıcı baskısı
  } else {
    const intensity = ((bidVolume - askVolume) / total) * 100;
    return { color: 'red', intensity }; // Satıcı baskısı
  }
};
```

**Dosyalar:**
- `frontend/src/components/chart/PriceScale.tsx` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (GÜNCELLE)

---

#### 1.2 Zaman Ekseni (Time Scale) - Alt Taraf ⚠️
**Durum:** Basit var ama geliştirilmeli

**Eksikler:**
- ✅ Zaman gösterimi var
- ❌ Dinamik format (HH:MM vs GG/AA HH:MM) yok
- ❌ Timezone desteği yok
- ❌ Smooth scrolling sırasında güncelleme eksik

**Uygulama:**
```typescript
// ChartPanel.tsx içinde güncelleme
const formatTimeLabel = (timestamp: number, timeframe: string) => {
  const date = new Date(timestamp);

  if (['1m', '5m', '15m'].includes(timeframe)) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};
```

---

### 2. FOOTPRINT ANALİZİ

#### 2.1 Volume Footprint Candlestick ❌❌❌
**Durum:** TAMAMEN EKSİK - En kritik özellik!

**Mevcut:** Sadece ayrı bir tabloda footprint gösteriliyor
**Gerekli:** Her mumun içinde bid/ask hacim hücreleri olmalı

**Uygulama:**
```typescript
// Yeni component: FootprintCandle.tsx
interface FootprintCell {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  delta: number;
}

interface FootprintCandle {
  candle: Kline;
  cells: FootprintCell[];
}

const drawFootprintCandle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  candle: FootprintCandle,
  candleWidth: number,
  priceToY: (price: number) => number
) => {
  const cellHeight = 8; // Her fiyat seviyesi için hücre yüksekliği

  candle.cells.forEach(cell => {
    const y = priceToY(cell.price);
    const cellWidth = candleWidth * 0.9;

    // Hücre arka planı
    ctx.fillStyle = getCellBackgroundColor(cell);
    ctx.fillRect(x - cellWidth/2, y - cellHeight/2, cellWidth, cellHeight);

    // Sol: Bid (Kırmızı)
    const bidWidth = (cell.bidVolume / cell.totalVolume) * (cellWidth / 2);
    ctx.fillStyle = getBidColor(cell.bidVolume, cell.totalVolume);
    ctx.fillRect(x - cellWidth/2, y - cellHeight/2, bidWidth, cellHeight);

    // Sağ: Ask (Yeşil)
    const askWidth = (cell.askVolume / cell.totalVolume) * (cellWidth / 2);
    ctx.fillStyle = getAskColor(cell.askVolume, cell.totalVolume);
    ctx.fillRect(x, y - cellHeight/2, askWidth, cellHeight);

    // Orta çizgi (fiyat ayırıcı)
    ctx.strokeStyle = '#8ba0ba';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - cellHeight/2);
    ctx.lineTo(x, y + cellHeight/2);
    ctx.stroke();
  });
};

const getCellBackgroundColor = (cell: FootprintCell) => {
  if (cell.askVolume > cell.bidVolume) {
    // Yeşil ton - alıcı baskısı
    const intensity = Math.min(1, cell.delta / cell.totalVolume);
    return `rgba(54, 200, 138, ${0.1 + intensity * 0.3})`;
  } else if (cell.bidVolume > cell.askVolume) {
    // Kırmızı ton - satıcı baskısı
    const intensity = Math.min(1, Math.abs(cell.delta) / cell.totalVolume);
    return `rgba(224, 101, 106, ${0.1 + intensity * 0.3})`;
  }
  return 'rgba(123, 139, 163, 0.1)'; // Nötr
};
```

**Veri Hazırlama (Backend'den gelecek):**
```typescript
// footprintCalculator.ts içinde ekleme yapılmalı
// Her mum için fiyat seviyelerine göre trade'leri grupla
const buildFootprintCells = (trades: Trade[], kline: Kline): FootprintCell[] => {
  const tickSize = 0.01; // Fiyat adımı (Binance'den alınmalı)
  const priceRange = { min: kline.low, max: kline.high };
  const levels = Math.ceil((priceRange.max - priceRange.min) / tickSize);

  const cells: FootprintCell[] = [];

  for (let i = 0; i <= levels; i++) {
    const price = priceRange.min + (i * tickSize);
    const tradesAtPrice = trades.filter(t =>
      Math.abs(t.price - price) < tickSize / 2
    );

    const bidVolume = tradesAtPrice
      .filter(t => t.isBuyerMaker)
      .reduce((sum, t) => sum + t.quantity, 0);

    const askVolume = tradesAtPrice
      .filter(t => !t.isBuyerMaker)
      .reduce((sum, t) => sum + t.quantity, 0);

    if (bidVolume > 0 || askVolume > 0) {
      cells.push({
        price,
        bidVolume,
        askVolume,
        totalVolume: bidVolume + askVolume,
        delta: askVolume - bidVolume
      });
    }
  }

  return cells;
};
```

**Dosyalar:**
- `frontend/src/components/chart/FootprintCandle.tsx` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (BÜYÜK GÜNCELLEME)
- `backend/src/services/footprintCalculator.ts` (GÜNCELLE)
- `shared/src/types/market.ts` (FootprintCell tipi ekle)

---

#### 2.2 Mum Gövdesi Renklendirme Standardı ⚠️
**Durum:** Basit yeşil/kırmızı var, footprint entegrasyonu yok

**Eksikler:**
- ✅ Yükseliş/düşüş renklendirmesi var
- ❌ Footprint iç hücre renklendirmesi eksik
- ❌ Doji mumlar için özel renk yok

**Uygulama:**
```typescript
const getCandleBodyColor = (candle: Kline) => {
  const priceChange = candle.close - candle.open;
  const bodySize = Math.abs(priceChange);
  const averageSize = (candle.high - candle.low) * 0.5;

  // Doji kontrolü
  if (bodySize < averageSize * 0.1) {
    return { body: '#7b8ba3', alpha: 0.6 }; // Gri/soluk
  }

  if (candle.close > candle.open) {
    return { body: '#36c88a', alpha: 0.9 }; // Yeşil
  } else {
    return { body: '#e0656a', alpha: 0.9 }; // Kırmızı
  }
};
```

---

### 3. CUMULATIVE VOLUME DELTA (CVD)

#### 3.1 Alt Panel CVD Göstergesi ❌
**Durum:** Placeholder var, işlevsel değil

**Eksikler:**
- ❌ CVD hesaplama yok
- ❌ Histogram/çizgi grafik yok
- ❌ Renklendirme algoritması yok
- ❌ Divergence tespiti yok

**Uygulama:**
```typescript
// Yeni component: CVDPanel.tsx
interface CVDPanelProps {
  klines: Kline[];
  trades: Trade[];
}

const CVDPanel = ({ klines, trades }: CVDPanelProps) => {
  const cvdData = useMemo(() => {
    let cumulativeDelta = 0;
    const cvdSeries: { time: number; value: number; change: number }[] = [];

    klines.forEach(kline => {
      // Bu muma ait trade'leri filtrele
      const klineTrades = trades.filter(t =>
        t.time >= kline.openTime && t.time < kline.closeTime
      );

      // Delta hesapla
      const buyVolume = klineTrades
        .filter(t => !t.isBuyerMaker) // Market buy
        .reduce((sum, t) => sum + t.quantity, 0);

      const sellVolume = klineTrades
        .filter(t => t.isBuyerMaker) // Market sell
        .reduce((sum, t) => sum + t.quantity, 0);

      const delta = buyVolume - sellVolume;
      cumulativeDelta += delta;

      cvdSeries.push({
        time: kline.closeTime,
        value: cumulativeDelta,
        change: delta
      });
    });

    return cvdSeries;
  }, [klines, trades]);

  return (
    <div className="cvd-panel">
      <div className="cvd-header">
        <h4>Cumulative Volume Delta (CVD)</h4>
        <span className="cvd-value">
          {cvdData[cvdData.length - 1]?.value.toFixed(2) || '0.00'}
        </span>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

// Canvas çizim fonksiyonu
const drawCVDChart = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cvdData: CVDData[]
) => {
  const padding = { top: 10, bottom: 20, left: 40, right: 10 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = width - padding.left - padding.right;

  const maxChange = Math.max(...cvdData.map(d => Math.abs(d.change)));
  const barWidth = chartWidth / cvdData.length;

  cvdData.forEach((data, idx) => {
    const x = padding.left + idx * barWidth;
    const barHeight = (Math.abs(data.change) / maxChange) * chartHeight * 0.5;

    // Renk belirleme
    let color: string;
    if (idx > 0) {
      const prevValue = cvdData[idx - 1].value;
      if (data.value > prevValue) {
        color = '#36c88a'; // CVD artıyor - yeşil
      } else if (data.value < prevValue) {
        color = '#e0656a'; // CVD azalıyor - kırmızı
      } else {
        color = '#7b8ba3'; // Nötr - gri
      }
    } else {
      color = '#7b8ba3';
    }

    ctx.fillStyle = color;

    if (data.change >= 0) {
      // Yukarı bar
      ctx.fillRect(x, height / 2 - barHeight, barWidth * 0.8, barHeight);
    } else {
      // Aşağı bar
      ctx.fillRect(x, height / 2, barWidth * 0.8, barHeight);
    }
  });

  // Sıfır çizgisi
  ctx.strokeStyle = '#8ba0ba';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, height / 2);
  ctx.lineTo(width - padding.right, height / 2);
  ctx.stroke();
};
```

**Dosyalar:**
- `frontend/src/components/cvd/CVDPanel.tsx` (YENİ)
- `frontend/src/pages/DashboardPage.tsx` (CVD component ekle)

---

### 4. FIXED RANGE VOLUME PROFILE (FRVP)

#### 4.1 Hacim Profili Aracı ❌❌
**Durum:** TAMAMEN EKSİK - Hiç yok!

**Gerekli:**
- Kullanıcı başlangıç/bitiş noktası seçer
- Sistem otomatik hacim dağılımını hesaplar
- POC (Point of Control) çizgisi çizer
- Value Area gösterir

**Uygulama:**
```typescript
// Yeni component: VolumeProfile.tsx
interface VolumeProfileProps {
  trades: Trade[];
  startTime: number;
  endTime: number;
  priceRange: { min: number; max: number };
}

const VolumeProfile = ({ trades, startTime, endTime, priceRange }: VolumeProfileProps) => {
  const profileData = useMemo(() => {
    const tickSize = 0.01;
    const levels = Math.ceil((priceRange.max - priceRange.min) / tickSize);
    const volumeAtPrice: Map<number, number> = new Map();

    // Trade'leri fiyat seviyelerine göre grupla
    trades
      .filter(t => t.time >= startTime && t.time <= endTime)
      .forEach(trade => {
        const priceLevel = Math.round(trade.price / tickSize) * tickSize;
        const current = volumeAtPrice.get(priceLevel) || 0;
        volumeAtPrice.set(priceLevel, current + trade.quantity);
      });

    // POC (En yüksek hacimli seviye) bul
    let pocPrice = 0;
    let maxVolume = 0;
    volumeAtPrice.forEach((volume, price) => {
      if (volume > maxVolume) {
        maxVolume = volume;
        pocPrice = price;
      }
    });

    // Value Area hesapla (%70 hacim)
    const totalVolume = Array.from(volumeAtPrice.values())
      .reduce((sum, v) => sum + v, 0);
    const targetVolume = totalVolume * 0.7;

    // POC'tan başlayarak yukarı ve aşağı genişlet
    const sortedEntries = Array.from(volumeAtPrice.entries())
      .sort((a, b) => b[1] - a[1]); // Hacme göre sırala

    let valueAreaVolume = 0;
    const valueAreaPrices: number[] = [];

    for (const [price, volume] of sortedEntries) {
      if (valueAreaVolume >= targetVolume) break;
      valueAreaVolume += volume;
      valueAreaPrices.push(price);
    }

    const valueAreaHigh = Math.max(...valueAreaPrices);
    const valueAreaLow = Math.min(...valueAreaPrices);

    return {
      volumeAtPrice,
      pocPrice,
      maxVolume,
      valueArea: { high: valueAreaHigh, low: valueAreaLow }
    };
  }, [trades, startTime, endTime, priceRange]);

  return (
    <div className="volume-profile-overlay">
      <canvas ref={canvasRef} />
    </div>
  );
};

// Canvas çizim
const drawVolumeProfile = (
  ctx: CanvasRenderingContext2D,
  profileData: ProfileData,
  chartArea: { x: number; y: number; width: number; height: number },
  priceToY: (price: number) => number
) => {
  const maxBarWidth = chartArea.width * 0.3; // Maksimum %30 genişlik

  // Hacim barlarını çiz
  profileData.volumeAtPrice.forEach((volume, price) => {
    const y = priceToY(price);
    const barWidth = (volume / profileData.maxVolume) * maxBarWidth;

    // Renk gradyanı
    const intensity = volume / profileData.maxVolume;
    const color = `rgba(64, 150, 255, ${0.3 + intensity * 0.5})`;

    ctx.fillStyle = color;
    ctx.fillRect(chartArea.x, y - 2, barWidth, 4);
  });

  // POC çizgisi çiz (en yüksek hacim)
  const pocY = priceToY(profileData.pocPrice);
  ctx.strokeStyle = '#ffd700'; // Altın sarısı
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(chartArea.x, pocY);
  ctx.lineTo(chartArea.x + chartArea.width, pocY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Value Area (opsiyonel)
  const vaHighY = priceToY(profileData.valueArea.high);
  const vaLowY = priceToY(profileData.valueArea.low);
  ctx.fillStyle = 'rgba(64, 150, 255, 0.1)';
  ctx.fillRect(chartArea.x, vaHighY, chartArea.width, vaLowY - vaHighY);
};
```

**Kullanıcı Etkileşimi:**
```typescript
// ChartPanel.tsx içinde
const [frvpRange, setFrvpRange] = useState<{start: number; end: number} | null>(null);
const [isSelectingFRVP, setIsSelectingFRVP] = useState(false);

const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
  if (!isSelectingFRVP) return;

  const rect = canvasRef.current?.getBoundingClientRect();
  if (!rect) return;

  const x = e.clientX - rect.left;
  const clickedTime = xToTime(x); // X koordinatından zamana çevir

  if (!frvpRange) {
    // İlk tıklama - başlangıç
    setFrvpRange({ start: clickedTime, end: clickedTime });
  } else {
    // İkinci tıklama - bitiş
    setFrvpRange({ ...frvpRange, end: clickedTime });
    setIsSelectingFRVP(false);
  }
};
```

**Dosyalar:**
- `frontend/src/components/chart/VolumeProfile.tsx` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (FRVP entegrasyonu)
- `frontend/src/components/toolbar/FRVPTool.tsx` (YENİ - Toolbar butonu)

---

### 5. ÇİZİM ARAÇLARI (Drawing Tools)

#### 5.1 Sol Rail ve Araç Çubuğu ❌❌
**Durum:** TAMAMEN EKSİK - index.html'de var, React'ta yok!

**Gerekli Araçlar:**
1. ✅ Select (Seçim aracı)
2. ✅ Crosshair (Artı)
3. ✅ Vertical Line (Dikey çizgi)
4. ✅ Horizontal Line (Yatay çizgi)
5. ✅ Trend Line (Eğilim çizgisi)
6. ✅ Rectangle (Dikdörtgen)
7. ✅ Measure (Ölçüm aracı)
8. ✅ Magnet Mode (Mıknatıslama)

**Uygulama:**

**A) Sol Rail Component:**
```typescript
// Yeni component: DrawingToolbar.tsx
interface Tool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
}

const tools: Tool[] = [
  { id: 'select', name: 'Select', icon: '⛶', cursor: 'default' },
  { id: 'crosshair', name: 'Crosshair', icon: '✚', cursor: 'crosshair' },
  { id: 'vertical', name: 'Vertical', icon: '┃', cursor: 'col-resize' },
  { id: 'horizontal', name: 'Horizontal', icon: '━', cursor: 'row-resize' },
  { id: 'trend', name: 'Trend', icon: '／', cursor: 'crosshair' },
  { id: 'rectangle', name: 'Rectangle', icon: '▭', cursor: 'crosshair' },
  { id: 'measure', name: 'Measure', icon: '📏', cursor: 'crosshair' },
];

const DrawingToolbar = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [magnetEnabled, setMagnetEnabled] = useState(false);

  return (
    <aside className="left-rail">
      <div className="brand">CM</div>

      <div className="tool-group">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`rail-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.id)}
            title={tool.name}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="tool-group">
        <button
          className={`rail-btn ${magnetEnabled ? 'active' : ''}`}
          onClick={() => setMagnetEnabled(!magnetEnabled)}
          title="Magnet Mode"
        >
          🧲
        </button>
      </div>
    </aside>
  );
};
```

**B) Çizim Nesneleri Yönetimi:**
```typescript
// Yeni: useDrawingTools.ts hook
interface DrawingObject {
  id: string;
  type: 'horizontal' | 'vertical' | 'trend' | 'rectangle' | 'measure';
  points: { x: number; y: number; time: number; price: number }[];
  style: {
    color: string;
    lineWidth: number;
    lineDash?: number[];
    fillColor?: string;
    fillAlpha?: number;
  };
  locked: boolean;
  visible: boolean;
}

const useDrawingTools = () => {
  const [drawings, setDrawings] = useState<DrawingObject[]>([]);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [magnetEnabled, setMagnetEnabled] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Partial<DrawingObject> | null>(null);

  const handleCanvasMouseDown = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (activeTool === 'select') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Koordinatları time/price'a çevir
    const time = xToTime(x);
    let price = yToPrice(y);

    // Magnet mode aktifse en yakın OHLC'ye yapış
    if (magnetEnabled) {
      price = snapToCandle(time, price);
    }

    setIsDrawing(true);
    setCurrentDrawing({
      id: generateId(),
      type: activeTool as any,
      points: [{ x, y, time, price }],
      style: getDefaultStyle(activeTool),
      locked: false,
      visible: true
    });
  };

  const handleCanvasMouseMove = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    if (!isDrawing || !currentDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = xToTime(x);
    let price = yToPrice(y);

    if (magnetEnabled) {
      price = snapToCandle(time, price);
    }

    setCurrentDrawing({
      ...currentDrawing,
      points: [...currentDrawing.points!, { x, y, time, price }]
    });
  };

  const handleCanvasMouseUp = () => {
    if (!currentDrawing) return;

    setDrawings([...drawings, currentDrawing as DrawingObject]);
    setCurrentDrawing(null);
    setIsDrawing(false);
  };

  return {
    drawings,
    currentDrawing,
    activeTool,
    setActiveTool,
    magnetEnabled,
    setMagnetEnabled,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    deleteDrawing: (id: string) => setDrawings(drawings.filter(d => d.id !== id)),
    toggleLock: (id: string) => setDrawings(drawings.map(d =>
      d.id === id ? { ...d, locked: !d.locked } : d
    ))
  };
};

// Magnet fonksiyonu
const snapToCandle = (time: number, price: number): number => {
  const candle = findCandleAtTime(time);
  if (!candle) return price;

  const snapThreshold = 5; // pixel
  const distances = [
    { point: 'high', value: candle.high, distance: Math.abs(price - candle.high) },
    { point: 'low', value: candle.low, distance: Math.abs(price - candle.low) },
    { point: 'open', value: candle.open, distance: Math.abs(price - candle.open) },
    { point: 'close', value: candle.close, distance: Math.abs(price - candle.close) },
  ];

  const nearest = distances.sort((a, b) => a.distance - b.distance)[0];

  if (nearest.distance < snapThreshold) {
    return nearest.value;
  }

  return price;
};
```

**C) Çizim Rendering:**
```typescript
// ChartPanel.tsx içinde
const drawDrawingObjects = (
  ctx: CanvasRenderingContext2D,
  drawings: DrawingObject[]
) => {
  drawings.forEach(drawing => {
    if (!drawing.visible) return;

    ctx.strokeStyle = drawing.style.color;
    ctx.lineWidth = drawing.style.lineWidth;
    if (drawing.style.lineDash) {
      ctx.setLineDash(drawing.style.lineDash);
    }

    switch (drawing.type) {
      case 'horizontal':
        drawHorizontalLine(ctx, drawing);
        break;
      case 'vertical':
        drawVerticalLine(ctx, drawing);
        break;
      case 'trend':
        drawTrendLine(ctx, drawing);
        break;
      case 'rectangle':
        drawRectangle(ctx, drawing);
        break;
      case 'measure':
        drawMeasureTool(ctx, drawing);
        break;
    }

    ctx.setLineDash([]);
  });
};

const drawHorizontalLine = (ctx: CanvasRenderingContext2D, drawing: DrawingObject) => {
  const y = drawing.points[0].y;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(ctx.canvas.width, y);
  ctx.stroke();

  // Fiyat etiketi
  ctx.fillStyle = drawing.style.color;
  ctx.fillRect(ctx.canvas.width - 60, y - 10, 55, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Inter';
  ctx.fillText(drawing.points[0].price.toFixed(2), ctx.canvas.width - 55, y + 4);
};

const drawTrendLine = (ctx: CanvasRenderingContext2D, drawing: DrawingObject) => {
  if (drawing.points.length < 2) return;

  const [p1, p2] = drawing.points;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Açı gösterimi (opsiyonel)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
  ctx.fillStyle = drawing.style.color;
  ctx.font = '11px Inter';
  ctx.fillText(`${angle.toFixed(1)}°`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 10);
};

const drawMeasureTool = (ctx: CanvasRenderingContext2D, drawing: DrawingObject) => {
  if (drawing.points.length < 2) return;

  const [p1, p2] = drawing.points;

  // Çizgi çiz
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ölçüm bilgileri
  const priceDiff = Math.abs(p2.price - p1.price);
  const priceChangePercent = ((priceDiff / p1.price) * 100).toFixed(2);
  const timeDiff = Math.abs(p2.time - p1.time);
  const barCount = Math.round(timeDiff / (60 * 1000)); // Dakika cinsinden

  // Bilgi kutusu
  const infoX = (p1.x + p2.x) / 2;
  const infoY = (p1.y + p2.y) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(infoX - 60, infoY - 35, 120, 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '11px Inter';
  ctx.fillText(`Δ Price: $${priceDiff.toFixed(2)}`, infoX - 50, infoY - 20);
  ctx.fillText(`Δ %: ${priceChangePercent}%`, infoX - 50, infoY - 5);
  ctx.fillText(`Bars: ${barCount}`, infoX - 50, infoY + 10);
  ctx.fillText(`Time: ${formatTimeDiff(timeDiff)}`, infoX - 50, infoY + 25);
};
```

**Dosyalar:**
- `frontend/src/components/toolbar/DrawingToolbar.tsx` (YENİ)
- `frontend/src/hooks/useDrawingTools.ts` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (ÇİZİM ENTEGRASYONU)
- `frontend/src/utils/drawingUtils.ts` (YENİ - Helper functions)

---

### 6. ORDER BOOK VİZUALİZASYONU

#### 6.1 Fiyat Skalası ile Hizalı Order Book ⚠️
**Durum:** Order book var ama ayrı panel, fiyat skalasıyla entegre değil

**Eksikler:**
- ✅ Order book verileri geliyor
- ✅ Bid/Ask gösterimi var
- ❌ Fiyat skalasıyla hizalı değil (index.html'deki gibi)
- ❌ Büyük emirlerde flash efekti yok
- ❌ Emir ekleme/çıkarma animasyonu yok

**Uygulama:**
```typescript
// ChartPanel.tsx içinde PriceScale ile birleşik rendering
const drawOrderBookOnPriceScale = (
  ctx: CanvasRenderingContext2D,
  orderBook: OrderBook,
  priceToY: (price: number) => number,
  chartWidth: number,
  chartHeight: number
) => {
  const scaleWidth = 80; // Fiyat skalası genişliği
  const obBarMaxWidth = 60; // Order book bar maksimum genişlik

  // Maksimum hacim
  const maxBidQty = Math.max(...orderBook.bids.map(b => b.quantity), 1);
  const maxAskQty = Math.max(...orderBook.asks.map(a => a.quantity), 1);

  // Ask duvarlarını çiz (yukarıda)
  orderBook.asks.slice(0, 20).forEach((ask, index) => {
    const y = priceToY(ask.price);
    const barWidth = (ask.quantity / maxAskQty) * obBarMaxWidth;

    // Yoğunluk hesapla
    const intensity = ask.quantity / maxAskQty;
    const color = `rgba(224, 101, 106, ${0.3 + intensity * 0.5})`;

    // Bar çiz (sağdan sola)
    ctx.fillStyle = color;
    ctx.fillRect(chartWidth + scaleWidth - barWidth, y - 2, barWidth, 4);

    // Fiyat etiketi
    if (index % 2 === 0) { // Her iki seviyede bir göster
      ctx.fillStyle = '#e0656a';
      ctx.font = '10px Inter';
      ctx.fillText(ask.price.toFixed(2), chartWidth + 5, y + 3);
    }
  });

  // Bid duvarlarını çiz (aşağıda)
  orderBook.bids.slice(0, 20).forEach((bid, index) => {
    const y = priceToY(bid.price);
    const barWidth = (bid.quantity / maxBidQty) * obBarMaxWidth;

    const intensity = bid.quantity / maxBidQty;
    const color = `rgba(54, 200, 138, ${0.3 + intensity * 0.5})`;

    ctx.fillStyle = color;
    ctx.fillRect(chartWidth + scaleWidth - barWidth, y - 2, barWidth, 4);

    if (index % 2 === 0) {
      ctx.fillStyle = '#36c88a';
      ctx.font = '10px Inter';
      ctx.fillText(bid.price.toFixed(2), chartWidth + 5, y + 3);
    }
  });
};
```

**Flash Efekti (büyük emir değişimlerinde):**
```typescript
// useOrderBookFlash.ts hook
const useOrderBookFlash = (orderBook: OrderBook | null) => {
  const [flashingOrders, setFlashingOrders] = useState<Set<string>>(new Set());
  const prevOrderBook = useRef<OrderBook | null>(null);

  useEffect(() => {
    if (!orderBook || !prevOrderBook.current) {
      prevOrderBook.current = orderBook;
      return;
    }

    const newFlashing = new Set<string>();

    // Büyük değişimleri tespit et
    orderBook.bids.forEach((bid, index) => {
      const prevBid = prevOrderBook.current?.bids[index];
      if (prevBid) {
        const change = Math.abs(bid.quantity - prevBid.quantity);
        const threshold = prevBid.quantity * 0.2; // %20 değişim

        if (change > threshold) {
          newFlashing.add(`bid-${bid.price}`);
        }
      }
    });

    orderBook.asks.forEach((ask, index) => {
      const prevAsk = prevOrderBook.current?.asks[index];
      if (prevAsk) {
        const change = Math.abs(ask.quantity - prevAsk.quantity);
        const threshold = prevAsk.quantity * 0.2;

        if (change > threshold) {
          newFlashing.add(`ask-${ask.price}`);
        }
      }
    });

    setFlashingOrders(newFlashing);

    // Flash efektini 500ms sonra kaldır
    const timeout = setTimeout(() => {
      setFlashingOrders(new Set());
    }, 500);

    prevOrderBook.current = orderBook;
    return () => clearTimeout(timeout);
  }, [orderBook]);

  return flashingOrders;
};
```

**Dosyalar:**
- `frontend/src/components/chart/ChartPanel.tsx` (ORDER BOOK ENTEGRASYONU)
- `frontend/src/hooks/useOrderBookFlash.ts` (YENİ)

---

### 7. BIG TRADES VİZUALİZASYONU

#### 7.1 Büyük İşlem Baloncukları ❌
**Durum:** TAMAMEN EKSİK

**Gerekli:**
- Threshold'u geçen büyük trade'lerde balon gösterimi
- Yeşil: Büyük alıcı işlemi
- Kırmızı: Büyük satıcı işlemi
- Balon boyutu işlem hacmiyle orantılı

**Uygulama:**
```typescript
// useBigTrades.ts hook
interface BigTrade extends Trade {
  isBig: boolean;
  multiplier: number; // Ortalama hacmin kaç katı
}

const useBigTrades = (trades: Trade[], thresholdMultiplier: number = 2) => {
  const [bigTrades, setBigTrades] = useState<BigTrade[]>([]);

  useEffect(() => {
    if (trades.length < 100) return; // Minimum 100 trade olmalı

    // Son 100 trade'in ortalama hacmini hesapla
    const recentTrades = trades.slice(-100);
    const avgVolume = recentTrades.reduce((sum, t) => sum + t.quantity, 0) / 100;
    const threshold = avgVolume * thresholdMultiplier;

    // Büyük trade'leri filtrele
    const bigTradesList: BigTrade[] = trades
      .filter(t => t.quantity >= threshold)
      .map(t => ({
        ...t,
        isBig: true,
        multiplier: t.quantity / avgVolume
      }));

    setBigTrades(bigTradesList);
  }, [trades, thresholdMultiplier]);

  return bigTrades;
};

// ChartPanel.tsx içinde rendering
const drawBigTradeBubbles = (
  ctx: CanvasRenderingContext2D,
  bigTrades: BigTrade[],
  timeToX: (time: number) => number,
  priceToY: (price: number) => number
) => {
  const baseSize = 10;
  const maxSize = 100;

  bigTrades.forEach(trade => {
    const x = timeToX(trade.time);
    const y = priceToY(trade.price);

    // Balon boyutu (multiplier'a göre)
    const size = Math.min(
      maxSize,
      baseSize * Math.sqrt(trade.multiplier)
    );

    // Renk
    const color = trade.isBuyerMaker
      ? 'rgba(224, 101, 106, 0.4)' // Satış - kırmızı
      : 'rgba(54, 200, 138, 0.4)';  // Alış - yeşil

    // Balon çiz
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Kenar çizgisi
    ctx.strokeStyle = trade.isBuyerMaker
      ? 'rgba(224, 101, 106, 0.8)'
      : 'rgba(54, 200, 138, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hacim etiketi (hover'da veya büyük baloncuklarda)
    if (size > 30) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${trade.quantity.toFixed(2)}`,
        x,
        y + 4
      );
    }
  });
};
```

**Threshold Kontrolü UI:**
```typescript
// Header.tsx içinde ekle
const ThresholdControl = () => {
  const [threshold, setThreshold] = useState(2);

  return (
    <div className="field">
      <span className="field-label">Big Trade Threshold</span>
      <input
        type="number"
        className="input"
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        min={1}
        max={10}
        step={0.5}
      />
      <span className="field-label">x</span>
    </div>
  );
};
```

**Dosyalar:**
- `frontend/src/hooks/useBigTrades.ts` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (BIG TRADES RENDERING)
- `frontend/src/components/header/ThresholdControl.tsx` (YENİ)

---

### 8. GEÇMİŞ VERİ YÖNETİMİ

#### 8.1 Lazy Loading ❌
**Durum:** TAMAMEN EKSİK - Sadece son veriler yükleniyor

**Gerekli:**
- Grafik sola kaydırıldığında otomatik geçmiş veri yükleme
- Cache stratejisi
- Loading indicator

**Uygulama:**
```typescript
// useHistoricalData.ts hook
const useHistoricalData = (
  symbol: string,
  interval: string,
  onLoadMore: (oldestTime: number) => Promise<Kline[]>
) => {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollPositionRef = useRef(0);

  const loadMoreData = async () => {
    if (isLoading || !hasMore || klines.length === 0) return;

    setIsLoading(true);

    try {
      const oldestTime = klines[0].openTime;
      const olderKlines = await onLoadMore(oldestTime);

      if (olderKlines.length === 0) {
        setHasMore(false);
      } else {
        setKlines([...olderKlines, ...klines]);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll event listener
  useEffect(() => {
    const handleScroll = (e: WheelEvent) => {
      const container = e.currentTarget as HTMLElement;
      const scrollLeft = container.scrollLeft;

      // Sol tarafa %20'den fazla scroll edilmişse yükle
      if (scrollLeft < container.scrollWidth * 0.2) {
        loadMoreData();
      }
    };

    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer) {
      chartContainer.addEventListener('wheel', handleScroll);
      return () => chartContainer.removeEventListener('wheel', handleScroll);
    }
  }, [klines, isLoading, hasMore]);

  return { klines, isLoading, hasMore, setKlines };
};

// API çağrısı
const fetchHistoricalKlines = async (
  symbol: string,
  interval: string,
  endTime: number,
  limit: number = 500
): Promise<Kline[]> => {
  const response = await fetch(
    `http://localhost:4000/api/market/klines?symbol=${symbol}&interval=${interval}&endTime=${endTime}&limit=${limit}`
  );

  if (!response.ok) throw new Error('Failed to fetch klines');

  return response.json();
};
```

**Backend endpoint (gerekirse):**
```typescript
// backend/src/routes/market.routes.ts
router.get('/klines', async (req, res) => {
  const { symbol, interval, endTime, limit = 500 } = req.query;

  try {
    const klines = await binanceService.getHistoricalKlines(
      symbol as string,
      interval as string,
      Number(limit),
      Number(endTime)
    );

    res.json(klines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch klines' });
  }
});
```

**Loading Indicator:**
```typescript
// ChartPanel.tsx içinde
{isLoadingHistory && (
  <div className="loading-indicator">
    <div className="spinner"></div>
    <span>Loading historical data...</span>
  </div>
)}
```

**Dosyalar:**
- `frontend/src/hooks/useHistoricalData.ts` (YENİ)
- `frontend/src/components/chart/ChartPanel.tsx` (LAZY LOADING ENTEGRASYONU)
- `backend/src/routes/market.routes.ts` (YENİ ENDPOINT)
- `backend/src/services/binanceService.ts` (HISTORICAL DATA METODU)

---

## 🎨 TASARIM VE LAYOUT EKSİKLERİ

### 9.1 Ana Layout Yapısı ⚠️
**Mevcut:** Header + Main Area (2 sütun: chart + sidebar)
**Gerekli (index.html):** Left Rail + Main Panel (Chart + CVD)

**Düzeltme:**
```typescript
// DashboardPage.tsx layout güncellemesi
return (
  <div className="app-shell">
    <DrawingToolbar /> {/* Sol rail */}

    <main className="main-panel">
      <Header wsConnected={wsConnected} /> {/* Üst bar */}

      <section className="content">
        <div className="chart-wrap">
          <ChartPanel klines={klines} trades={trades} orderBook={orderBook} />
          <OrderBookOverlay orderBook={orderBook} /> {/* Sağda entegre */}
        </div>

        <CVDPanel klines={klines} trades={trades} /> {/* Alt panel */}
      </section>
    </main>
  </div>
);
```

**CSS:**
```css
.app-shell {
  display: grid;
  grid-template-columns: 60px 1fr; /* Left rail + Main */
  height: 100vh;
}

.main-panel {
  display: flex;
  flex-direction: column;
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.chart-wrap {
  flex: 3;
  position: relative;
  display: flex;
}

.cvd-panel {
  flex: 1;
  border-top: 1px solid #162234;
  min-height: 150px;
  max-height: 250px;
}
```

---

## 📌 ÖNCELİK SIRALAMASI

### 🔴 YÜKSEK ÖNCELİK (Kritik Eksiklikler)

1. **Footprint Candlestick Görünümü** ⭐⭐⭐⭐⭐
   - En önemli özellik, projenin ana değeri
   - Mum içinde bid/ask hücre gösterimi
   - Süre: 2-3 gün

2. **CVD Panel İşlevselleştirme** ⭐⭐⭐⭐⭐
   - Kritik analiz aracı
   - Histogram/çizgi grafik
   - Süre: 1 gün

3. **Sol Rail Çizim Araçları** ⭐⭐⭐⭐
   - Kullanıcı etkileşimi için gerekli
   - Tüm çizim araçları
   - Süre: 3-4 gün

4. **Price Scale Renklendirme** ⭐⭐⭐⭐
   - Bid/Ask baskısı görselleştirme
   - Order book entegrasyonu
   - Süre: 1 gün

5. **Big Trades Bubble** ⭐⭐⭐⭐
   - Önemli piyasa hareketlerini gösterir
   - Threshold kontrolü
   - Süre: 1 gün

### 🟡 ORTA ÖNCELİK

6. **Fixed Range Volume Profile (FRVP)** ⭐⭐⭐
   - Gelişmiş analiz aracı
   - POC ve Value Area
   - Süre: 2-3 gün

7. **Magnet Mode** ⭐⭐⭐
   - Kullanıcı deneyimi iyileştirmesi
   - Çizim hassasiyeti
   - Süre: 0.5 gün

8. **Order Book Flash Efekti** ⭐⭐⭐
   - Görsel geri bildirim
   - Animasyonlar
   - Süre: 0.5 gün

9. **Lazy Loading** ⭐⭐⭐
   - Performans ve kullanılabilirlik
   - Cache stratejisi
   - Süre: 1-2 gün

### 🟢 DÜŞÜK ÖNCELİK

10. **Gelişmiş Zaman Ekseni** ⭐⭐
    - Timezone desteği
    - Dinamik format
    - Süre: 0.5 gün

11. **Çizim Nesnesi Kopyalama/Kilitleme** ⭐⭐
    - Gelişmiş özellikler
    - Katman yönetimi
    - Süre: 1 gün

12. **Keyboard Shortcuts** ⭐
    - Kullanıcı deneyimi
    - Hızlı erişim
    - Süre: 0.5 gün

---

## 🏗️ TEKNİK MİMARİ ÖNERİLERİ

### A) Component Organizasyonu

```
frontend/src/
├── components/
│   ├── chart/
│   │   ├── ChartPanel.tsx (ANA COMPONENT - BÜYÜK GÜNCELLEME)
│   │   ├── PriceScale.tsx (YENİ)
│   │   ├── TimeScale.tsx (YENİ)
│   │   ├── FootprintCandle.tsx (YENİ)
│   │   ├── VolumeProfile.tsx (YENİ)
│   │   └── BigTradeBubble.tsx (YENİ)
│   ├── cvd/
│   │   └── CVDPanel.tsx (YENİ)
│   ├── toolbar/
│   │   ├── DrawingToolbar.tsx (YENİ)
│   │   ├── FRVPTool.tsx (YENİ)
│   │   └── ThresholdControl.tsx (YENİ)
│   ├── header/ (MEVCUT)
│   ├── orderbook/ (MEVCUT - GÜNCELLEME)
│   ├── tradelist/ (MEVCUT)
│   └── footprint/ (MEVCUT - SADECE TABLO)
├── hooks/
│   ├── useWebSocket.ts (MEVCUT)
│   ├── useDrawingTools.ts (YENİ)
│   ├── useBigTrades.ts (YENİ)
│   ├── useHistoricalData.ts (YENİ)
│   ├── useOrderBookFlash.ts (YENİ)
│   └── useCanvas.ts (YENİ)
├── utils/
│   ├── drawingUtils.ts (YENİ)
│   ├── canvasUtils.ts (YENİ)
│   └── priceUtils.ts (YENİ)
└── types/ (shared'dan import)
```

### B) Canvas Optimizasyonu

**Çok katmanlı canvas yaklaşımı:**
```typescript
// ChartPanel.tsx
<div className="chart-container">
  <canvas ref={backgroundRef} /> {/* Grid, sabit elemanlar */}
  <canvas ref={candlesRef} />     {/* Mum çubukları */}
  <canvas ref={footprintRef} />   {/* Footprint hücreleri */}
  <canvas ref={volumeProfileRef} /> {/* FRVP */}
  <canvas ref={drawingsRef} />    {/* Kullanıcı çizimleri */}
  <canvas ref={interactionRef} /> {/* Mouse interactions */}
</div>
```

**Avantajları:**
- Her katman bağımsız render edilir
- Sadece değişen katman yenilenir
- Performans artışı
- Katman sıralaması kolay

### C) State Yönetimi

**Zustand store yapısı:**
```typescript
// chartStore.ts
interface ChartStore {
  // Data
  klines: Kline[];
  trades: Trade[];
  orderBook: OrderBook | null;

  // View state
  timeRange: { start: number; end: number };
  priceRange: { min: number; max: number };
  zoom: number;
  pan: number;

  // Tools
  activeTool: string;
  magnetEnabled: boolean;
  drawings: DrawingObject[];

  // Settings
  threshold: number;
  showFootprint: boolean;
  showVolumeProfile: boolean;

  // Actions
  setKlines: (klines: Kline[]) => void;
  addDrawing: (drawing: DrawingObject) => void;
  setActiveTool: (tool: string) => void;
  // ...
}
```

### D) Performance Optimizasyonu

**1. Canvas Rendering:**
```typescript
// requestAnimationFrame kullan
const rafRef = useRef<number>();

useEffect(() => {
  const render = () => {
    drawChart();
    rafRef.current = requestAnimationFrame(render);
  };

  rafRef.current = requestAnimationFrame(render);

  return () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  };
}, [/* dependencies */]);
```

**2. Memoization:**
```typescript
// Ağır hesaplamaları memoize et
const footprintData = useMemo(() => {
  return calculateFootprint(trades, klines);
}, [trades, klines]);

const cvdSeries = useMemo(() => {
  return calculateCVD(trades);
}, [trades]);
```

**3. Debounce/Throttle:**
```typescript
// Mouse move gibi sık çalışan eventler için
import { throttle } from 'lodash';

const handleMouseMove = throttle((e: MouseEvent) => {
  // Handle mouse move
}, 16); // 60fps
```

---

## 📝 UYGULAMA ADIMLARI

### Faz 1: Temel Altyapı (1 hafta)

**Hafta 1:**
- [ ] Layout güncellemesi (Left Rail + Main Panel)
- [ ] DrawingToolbar component
- [ ] useDrawingTools hook
- [ ] Çok katmanlı canvas yapısı
- [ ] Chart store (Zustand)
- [ ] Keyboard shortcuts altyapısı

### Faz 2: Footprint ve CVD (1 hafta)

**Hafta 2:**
- [ ] FootprintCandle component
- [ ] Backend footprint cell hesaplama
- [ ] Footprint rendering engine
- [ ] CVDPanel component işlevselleştirme
- [ ] CVD hesaplama ve rendering
- [ ] Renklendirme algoritmaları

### Faz 3: Çizim Araçları (1 hafta)

**Hafta 3:**
- [ ] Horizontal/Vertical line
- [ ] Trend line
- [ ] Rectangle tool
- [ ] Measure tool
- [ ] Magnet mode
- [ ] Çizim düzenleme/silme

### Faz 4: Gelişmiş Özellikler (1 hafta)

**Hafta 4:**
- [ ] Volume Profile (FRVP)
- [ ] POC ve Value Area
- [ ] Big Trades bubble
- [ ] Threshold kontrolü
- [ ] Order Book flash efekti
- [ ] Price Scale renklendirme

### Faz 5: Optimizasyon ve Son Rötuşlar (3 gün)

**Hafta 5:**
- [ ] Lazy loading
- [ ] Performance optimizasyonu
- [ ] Bug fixes
- [ ] UI polish
- [ ] Documentation

---

## ✅ SONUÇ

**Toplam Eksik Özellik:** 15 ana kategori, 40+ alt özellik
**Tahmini Süre:** 4-5 hafta (full-time)
**En Kritik:** Footprint Candlestick, CVD Panel, Çizim Araçları

**Önerilen Yaklaşım:**
1. Önce kritik özellikleri tamamla (Footprint, CVD)
2. Sonra çizim araçlarını ekle
3. Son olarak gelişmiş özellikleri uygula (FRVP, Lazy Loading)

**Not:** Bu roadmap index.html tasarımına ve dökümanınıza göre hazırlanmıştır. Her özellik için detaylı kod örnekleri verilmiştir.
