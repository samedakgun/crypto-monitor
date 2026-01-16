import { useMarketStore } from '../../store/marketStore';

const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin' },
  { symbol: 'ETHUSDT', name: 'Ethereum' },
  { symbol: 'BNBUSDT', name: 'BNB' },
  { symbol: 'SOLUSDT', name: 'Solana' },
  { symbol: 'XRPUSDT', name: 'Ripple' },
];

function SymbolSelector() {
  const { selectedSymbol, setSymbol } = useMarketStore();

  return (
    <label className="field">
      <span className="field-label">Symbol</span>
      <select
        className="input"
        value={selectedSymbol}
        onChange={(e) => setSymbol(e.target.value)}
      >
        {SYMBOLS.map((s) => (
          <option key={s.symbol} value={s.symbol}>
            {s.symbol} — {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default SymbolSelector;
