import { useMarketStore } from '../../store/marketStore';
import { Timeframe } from '@shared/types/market';

const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h'];

function TimeframeSelector() {
  const { selectedInterval, setInterval } = useMarketStore();

  return (
    <div className="timeframe">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          className={`pill ${selectedInterval === tf ? 'active' : ''}`}
          onClick={() => setInterval(tf)}
          type="button"
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

export default TimeframeSelector;
