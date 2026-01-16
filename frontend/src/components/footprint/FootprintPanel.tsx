import { FootprintData } from '@shared/types/market';

interface FootprintPanelProps {
  footprint: FootprintData;
}

function FootprintPanel({ footprint }: FootprintPanelProps) {
  const maxVolume = Math.max(...footprint.cells.map((c) => c.totalVolume), 1);
  const totalBuy = footprint.cells.reduce((sum, c) => sum + c.buyVolume, 0);
  const totalSell = footprint.cells.reduce((sum, c) => sum + c.sellVolume, 0);

  return (
    <div className="panel footprint">
      <div className="panel-head">
        <div>
          <h3>Volume Footprint</h3>
          <p>CVD: {footprint.cumulativeDelta.toFixed(2)}</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="footprint-table">
          <thead>
            <tr>
              <th>Price</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Delta</th>
              <th>Total</th>
              <th>Vol</th>
            </tr>
          </thead>
          <tbody>
            {footprint.cells
              .slice()
              .sort((a, b) => b.price - a.price)
              .map((cell, idx) => {
                const volumePercent = (cell.totalVolume / maxVolume) * 100;
                const isDeltaPositive = cell.delta >= 0;
                return (
                  <tr key={`${cell.price}-${idx}`}>
                    <td>{cell.price.toFixed(2)}</td>
                    <td className="buy">{cell.buyVolume.toFixed(2)}</td>
                    <td className="sell">{cell.sellVolume.toFixed(2)}</td>
                    <td className={isDeltaPositive ? 'buy' : 'sell'}>
                      {cell.delta > 0 ? '+' : ''}
                      {cell.delta.toFixed(2)}
                    </td>
                    <td>{cell.totalVolume.toFixed(2)}</td>
                    <td>
                      <div className="bar-bg">
                        <div
                          className={`bar-fill ${isDeltaPositive ? 'buy' : 'sell'}`}
                          style={{ width: `${volumePercent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="summary">
        <div>
          <span className="label">Total Buy</span>
          <span className="value buy">{totalBuy.toFixed(2)}</span>
        </div>
        <div>
          <span className="label">Total Sell</span>
          <span className="value sell">{totalSell.toFixed(2)}</span>
        </div>
        <div>
          <span className="label">Delta</span>
          <span className={`value ${footprint.cumulativeDelta >= 0 ? 'buy' : 'sell'}`}>
            {footprint.cumulativeDelta >= 0 ? '+' : ''}
            {footprint.cumulativeDelta.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FootprintPanel;
