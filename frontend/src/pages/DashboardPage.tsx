import { useEffect, useState, useCallback, useRef } from 'react';
import ChartPanel from '../components/chart/ChartPanel';
import FootprintPanel from '../components/footprint/FootprintPanel';
import CVDPanel from '../components/cvd/CVDPanel';
import Header from '../components/header/Header';
import DrawingToolbar from '../components/toolbar/DrawingToolbar';
import OrderBook from '../components/orderbook/OrderBook';
import TradeList from '../components/tradelist/TradeList';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Loading from '../components/common/Loading';
import LoadingIndicator from '../components/chart/LoadingIndicator';
import { useWebSocket } from '../hooks/useWebSocket';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useHistoricalData } from '../hooks/useHistoricalData';
import { useMarketStore } from '../store/marketStore';
import { useSettingsStore } from '../store/settingsStore';
import { FootprintData, Kline, OrderBook as OrderBookType, Trade, CVDData } from '@shared/types/market';
import { WebSocketMessage } from '@shared/types/websocket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MAX_TRADES = 1000; // Trade buffer boyutu arttirildi
const MAX_FOOTPRINT_HISTORY = 500; // Memory leak onleme
const IS_DEV = import.meta.env.DEV;

function DashboardPage() {
  const { selectedSymbol, selectedInterval, updatePrice, tradeFilterThreshold } = useMarketStore();
  const { showFootprint } = useSettingsStore();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBookType | null>(null);
  const [footprint, setFootprint] = useState<FootprintData | null>(null);
  const [footprintHistory, setFootprintHistory] = useState<Map<number, FootprintData>>(new Map());
  const [wsConnected, setWsConnected] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [cvdHistory, setCvdHistory] = useState<Map<number, CVDData>>(new Map());

  // Ref to track if initial data has been fetched for current symbol/interval
  const initialDataFetched = useRef(false);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Historical data hook with lazy loading
  const {
    klines,
    isLoading: isLoadingHistory,
    hasMore,
    loadMoreData,
    setKlines,
    addRealtimeKline,
  } = useHistoricalData({
    symbol: selectedSymbol,
    interval: selectedInterval,
    initialLimit: 500,
    loadMoreLimit: 500,
  });

  // Gecmis verileri REST API'den cek
  const fetchInitialData = useCallback(async () => {
    try {
      // Only show loading on first mount, not on interval/symbol changes
      if (!initialDataFetched.current) {
        setIsLoadingInitial(true);
      }

      // Paralel olarak klines ve trades cek
      const [klinesResponse, tradesResponse] = await Promise.all([
        fetch(`${API_URL}/api/klines/${selectedSymbol}/${selectedInterval}`),
        fetch(`${API_URL}/api/trades/${selectedSymbol}`),
      ]);

      if (klinesResponse.ok) {
        const historicalKlines: Kline[] = await klinesResponse.json();
        setKlines(historicalKlines);

        // Son fiyati guncelle
        if (historicalKlines.length > 0) {
          const lastKline = historicalKlines[historicalKlines.length - 1];
          updatePrice(lastKline.close);
        }
      }

      if (tradesResponse.ok) {
        const historicalTrades: Trade[] = await tradesResponse.json();
        setTrades(historicalTrades.slice(0, MAX_TRADES));
      }

      initialDataFetched.current = true;
    } catch (error) {
      console.error('[Dashboard] Failed to fetch initial data:', error);
    } finally {
      setIsLoadingInitial(false);
    }
  }, [selectedSymbol, selectedInterval, updatePrice, setKlines]);

  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    onMessage: (message: WebSocketMessage) => {
      // Debug log sadece development'ta
      if (IS_DEV) {
        console.log('[Dashboard] Received message:', message.type);
      }

      if (message.type === 'trade') {
        setTrades((prev) => [message.data, ...prev].slice(0, MAX_TRADES));
        updatePrice(message.data.price);
      } else if (message.type === 'kline') {
        // Gerçek zamanlı kline güncellemesi için hook fonksiyonunu kullan
        addRealtimeKline(message.data);
      } else if (message.type === 'depth') {
        setOrderBook(message.data as OrderBookType);
      } else if (message.type === 'footprint') {
        const footprintData = message.data.footprint;
        setFootprint(footprintData);

        // Store in history using openTime as key (with memory limit)
        if (footprintData) {
          setFootprintHistory((prev) => {
            const updated = new Map(prev);
            updated.set(footprintData.openTime, footprintData);

            // Memory leak onleme - eski kayitlari sil
            if (updated.size > MAX_FOOTPRINT_HISTORY) {
              const keysToDelete = Array.from(updated.keys())
                .sort((a, b) => a - b)
                .slice(0, updated.size - MAX_FOOTPRINT_HISTORY);
              keysToDelete.forEach((key) => updated.delete(key));
            }

            return updated;
          });
        }

        // CVD verisini kaydet (backend'den geliyorsa)
        const cvdData = message.data.cvd;
        if (cvdData) {
          setCvdHistory((prev) => {
            const updated = new Map(prev);
            updated.set(cvdData.time, cvdData);

            // Memory limit
            if (updated.size > MAX_FOOTPRINT_HISTORY) {
              const keysToDelete = Array.from(updated.keys())
                .sort((a, b) => a - b)
                .slice(0, updated.size - MAX_FOOTPRINT_HISTORY);
              keysToDelete.forEach((key) => updated.delete(key));
            }

            return updated;
          });
        }
      }
    },
    onConnect: () => {
      if (IS_DEV) {
        console.log('[Dashboard] WebSocket connected');
      }
      setWsConnected(true);
    },
    onDisconnect: () => {
      if (IS_DEV) {
        console.log('[Dashboard] WebSocket disconnected');
      }
      setWsConnected(false);
    },
  });

  // Symbol veya interval degistiginde verileri sifirla ve yeniden cek
  useEffect(() => {
    // Clear data but don't reset initialDataFetched - avoid loading screen
    setKlines([]); // Hook'un setKlines fonksiyonu
    setTrades([]);
    setFootprint(null);
    setFootprintHistory(new Map());
    setCvdHistory(new Map());

    // Fetch new data immediately without showing loading screen
    fetchInitialData();
  }, [selectedSymbol, selectedInterval, setKlines, fetchInitialData]);

  // WebSocket subscription
  useEffect(() => {
    if (!isConnected) {
      if (IS_DEV) {
        console.log('[Dashboard] WebSocket not connected yet, waiting...');
      }
      return;
    }

    const channels: ('trade' | 'kline' | 'depth' | 'footprint')[] = ['trade', 'kline', 'depth'];
    if (showFootprint) channels.push('footprint');

    if (IS_DEV) {
      console.log('[Dashboard] WebSocket connected! Subscribing to:', { symbol: selectedSymbol, channels, interval: selectedInterval });
    }

    subscribe({
      type: 'subscribe',
      symbol: selectedSymbol,
      channels,
      interval: selectedInterval,
    });

    return () => {
      if (IS_DEV) {
        console.log('[Dashboard] Unsubscribing');
      }
      unsubscribe({
        type: 'unsubscribe',
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, selectedSymbol, selectedInterval, showFootprint]);

  // Show loading state while waiting for initial connection or data
  if (!isConnected || isLoadingInitial) {
    return (
      <div className="app-shell">
        <DrawingToolbar />
        <div className="main-panel">
          <Header wsConnected={isConnected} />
          <Loading
            message={!isConnected ? 'Connecting to market data...' : 'Loading historical data...'}
            fullScreen={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sol Rail - Çizim Araçları */}
      <DrawingToolbar />

      {/* Ana Panel */}
      <main className="main-panel">
        {/* Üst Bar - Header */}
        <Header wsConnected={wsConnected} />

        {/* İçerik Alanı */}
        <section className="content">
          <ErrorBoundary>
            {/* Chart Wrap - Ana Grafik + Sağ Taraf Paneller */}
            <div className="chart-wrap">
              <div className="chart-main">
                {/* Historical data loading indicator */}
                {isLoadingHistory && (
                  <LoadingIndicator
                    message="Loading historical data..."
                    position="top-left"
                  />
                )}

                {/* Load More button */}
                {hasMore && klines.length > 0 && !isLoadingHistory && (
                  <button
                    className="load-more-btn"
                    onClick={loadMoreData}
                    title="Load more historical data"
                  >
                    ← Load More
                  </button>
                )}

                <ErrorBoundary>
                  <ChartPanel
                    klines={klines}
                    trades={trades}
                    orderBook={orderBook}
                    footprintData={footprint}
                    footprintHistory={footprintHistory}
                    enableFootprint={showFootprint}
                    tradeFilterThreshold={tradeFilterThreshold}
                  />
                </ErrorBoundary>
              </div>

              {/* Sağ Taraf Paneller */}
              <aside className="right-sidebar">
                <ErrorBoundary>
                  <TradeList trades={trades} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <OrderBook orderBook={orderBook} />
                </ErrorBoundary>
                {showFootprint && footprint && (
                  <ErrorBoundary>
                    <FootprintPanel footprint={footprint} />
                  </ErrorBoundary>
                )}
              </aside>
            </div>
          </ErrorBoundary>

          {/* Alt Panel - CVD */}
          <ErrorBoundary>
            <CVDPanel klines={klines} trades={trades} />
          </ErrorBoundary>
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
