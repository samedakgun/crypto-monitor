import { OrderBook as OrderBookType } from '@shared/types/market';
import { useMarketStore } from '../../store/marketStore';
import OrderBookFilterControl from './OrderBookFilterControl';

interface OrderBookProps {
  orderBook: OrderBookType | null;
}

function OrderBook({ orderBook }: OrderBookProps) {
  const { selectedSymbol, orderBookFilterQuantity, setOrderBookFilterQuantity } = useMarketStore();

  if (!orderBook) {
    return (
      <div className="panel orderbook">
        <div className="panel-head">
          <h3>Order Book</h3>
        </div>
        <div className="panel-body">Loading order book...</div>
      </div>
    );
  }

  // Filter orders based on quantity threshold
  const filteredAsks = orderBook.asks.filter(
    (ask) => orderBookFilterQuantity === 0 || ask.quantity >= orderBookFilterQuantity
  );
  const filteredBids = orderBook.bids.filter(
    (bid) => orderBookFilterQuantity === 0 || bid.quantity >= orderBookFilterQuantity
  );

  const maxBidQty = Math.max(...filteredBids.map((b) => b.quantity), 1);
  const maxAskQty = Math.max(...filteredAsks.map((a) => a.quantity), 1);

  return (
    <div className="panel orderbook">
      <div className="panel-head">
        <h3>Order Book</h3>
      </div>
      <OrderBookFilterControl
        symbol={selectedSymbol}
        value={orderBookFilterQuantity}
        onChange={setOrderBookFilterQuantity}
      />
      <div className="panel-body scroll">
        <div className="ob-section">
          <div className="muted small">Asks (Sell) {filteredAsks.length > 0 && `(${filteredAsks.length})`}</div>
          {filteredAsks
            .slice(0, 12)
            .reverse()
            .map((ask, index) => {
              const widthPercent = (ask.quantity / maxAskQty) * 100;
              return (
                <div key={`ask-${index}`} className="ob-row">
                  <div className="ob-bar sell" style={{ width: `${widthPercent}%` }} />
                  <div className="ob-text">
                    <span className="sell">{ask.price.toFixed(2)}</span>
                    <span className="muted">{ask.quantity.toFixed(4)}</span>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="spread">
          <span className="muted small">Spread</span>
          <span className="value">
            {filteredAsks.length && filteredBids.length
              ? (filteredAsks[0].price - filteredBids[0].price).toFixed(2)
              : '---'}
          </span>
        </div>

        <div className="ob-section">
          <div className="muted small">Bids (Buy) {filteredBids.length > 0 && `(${filteredBids.length})`}</div>
          {filteredBids.slice(0, 12).map((bid, index) => {
            const widthPercent = (bid.quantity / maxBidQty) * 100;
            return (
              <div key={`bid-${index}`} className="ob-row">
                <div className="ob-bar buy" style={{ width: `${widthPercent}%` }} />
                <div className="ob-text">
                  <span className="buy">{bid.price.toFixed(2)}</span>
                  <span className="muted">{bid.quantity.toFixed(4)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderBook;
