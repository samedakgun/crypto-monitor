import { useToolStore, TOOLS, Tool } from '../../store/toolStore';

function DrawingToolbar() {
  const { activeTool, setActiveTool, magnetEnabled, toggleMagnet, startFRVPSelection, frvpRange, cancelFRVPSelection } = useToolStore();

  const handleToolClick = (tool: Tool) => {
    if (tool === 'frvp') {
      if (activeTool === 'frvp') {
        cancelFRVPSelection();
      } else {
        startFRVPSelection();
      }
    } else {
      setActiveTool(tool);
    }
  };

  // Araçları gruplandır
  const selectionTools = TOOLS.filter((t) => ['select', 'crosshair'].includes(t.id));
  const lineTools = TOOLS.filter((t) => ['vertical', 'horizontal', 'trendline'].includes(t.id));
  const shapeTools = TOOLS.filter((t) => ['rectangle', 'measure'].includes(t.id));
  const analysisTools = TOOLS.filter((t) => ['frvp'].includes(t.id));

  return (
    <aside className="left-rail">
      <div className="rail-brand">CM</div>

      {/* Seçim Araçları */}
      <div className="tool-group">
        {selectionTools.map((tool) => (
          <button
            key={tool.id}
            className={`rail-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="rail-icon">{tool.icon}</span>
          </button>
        ))}
      </div>

      <div className="rail-divider" />

      {/* Çizgi Araçları */}
      <div className="tool-group">
        {lineTools.map((tool) => (
          <button
            key={tool.id}
            className={`rail-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="rail-icon">{tool.icon}</span>
          </button>
        ))}
      </div>

      <div className="rail-divider" />

      {/* Şekil ve Ölçüm Araçları */}
      <div className="tool-group">
        {shapeTools.map((tool) => (
          <button
            key={tool.id}
            className={`rail-btn ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="rail-icon">{tool.icon}</span>
          </button>
        ))}
      </div>

      <div className="rail-divider" />

      {/* Analiz Araçları */}
      <div className="tool-group">
        {analysisTools.map((tool) => (
          <button
            key={tool.id}
            className={`rail-btn ${activeTool === tool.id ? 'active' : ''} ${frvpRange ? 'has-data' : ''}`}
            onClick={() => handleToolClick(tool.id)}
            title={`${tool.name} (${tool.shortcut})`}
          >
            <span className="rail-icon">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="rail-spacer" />

      {/* Magnet Mode */}
      <div className="tool-group">
        <button
          className={`rail-btn magnet-btn ${magnetEnabled ? 'active' : ''}`}
          onClick={toggleMagnet}
          title={`Magnet Mode (${magnetEnabled ? 'ON' : 'OFF'})`}
        >
          <span className="rail-icon">🧲</span>
        </button>
      </div>

      {/* FRVP Temizle */}
      {frvpRange && (
        <div className="tool-group">
          <button
            className="rail-btn clear-btn"
            onClick={cancelFRVPSelection}
            title="Clear FRVP"
          >
            <span className="rail-icon">✕</span>
          </button>
        </div>
      )}
    </aside>
  );
}

export default DrawingToolbar;
