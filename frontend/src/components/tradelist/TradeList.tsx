import { Trade } from '@shared/types/market';
import { useMarketStore } from '../../store/marketStore';
import TradeFilterControl from './TradeFilterControl';

interface TradeListProps {
  trades: Trade[];
}

function TradeList({ trades }: TradeListProps) {
  const { tradeFilterThreshold, setTradeFilterThreshold } = useMarketStore();

  // Filter trades based on threshold
  const filteredTrades = trades.filter(
    (trade) => tradeFilterThreshold === 0 || trade.quantity >= tradeFilterThreshold
  );

  return (
    <div className="panel trades">
      <div className="panel-head">
        <div>
          <h3>Recent Trades ({filteredTrades.length})</h3>
        </div>
      </div>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #162234' }}>
        <TradeFilterControl
          value={tradeFilterThreshold}
          onChange={setTradeFilterThreshold}
        />
      </div>
      <div className="scroll">
        {filteredTrades.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', color: '#9fb0c7' }}>
            No trades meet the threshold
          </div>
        ) : (
          filteredTrades.map((trade, index) => (
            <div key={`${trade.tradeId}-${index}`} className="trade-row">
              <span className={trade.isBuyerMaker ? 'sell' : 'buy'}>{trade.price.toFixed(2)}</span>
              <span className="muted">{trade.quantity.toFixed(4)}</span>
              <span className="muted">{new Date(trade.time).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TradeList;
