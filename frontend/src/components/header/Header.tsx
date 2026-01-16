import SymbolSelector from './SymbolSelector';
import TimeframeSelector from './TimeframeSelector';
import ThemeToggle from './ThemeToggle';
import ThresholdControl from './ThresholdControl';
import { useToolStore } from '../../store/toolStore';
import { useMarketStore } from '../../store/marketStore';

interface HeaderProps {
  wsConnected: boolean;
}

function Header({ wsConnected }: HeaderProps) {
  const { activeTool, frvpRange, isSelectingFRVP } = useToolStore();
  const { bigTradeThreshold, setBigTradeThreshold } = useMarketStore();

  return (
    <header className="header">
      <div className="title">
        <span className="brand">Crypto Monitor</span>
        <span className={`status-dot ${wsConnected ? 'online' : 'offline'}`} />
        {/* Aktif araç göstergesi */}
        {activeTool !== 'select' && (
          <span className="active-tool-badge">
            {activeTool.toUpperCase()}
          </span>
        )}
      </div>
      <div className="selectors">
        <SymbolSelector />
        <TimeframeSelector />
        <ThresholdControl
          value={bigTradeThreshold}
          onChange={setBigTradeThreshold}
        />
        {/* FRVP durumu */}
        {isSelectingFRVP && !frvpRange && (
          <span className="tool-hint">Click and drag on chart to select FRVP range</span>
        )}
        {frvpRange && (
          <span className="tool-info">FRVP Active</span>
        )}
      </div>
      <div className="actions">
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
