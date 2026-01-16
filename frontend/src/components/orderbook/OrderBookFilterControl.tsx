import { useMemo } from 'react';
import { getSymbolConfig } from '@shared/config/symbols';

interface OrderBookFilterControlProps {
  symbol: string;
  value: number;
  onChange: (value: number) => void;
}

function OrderBookFilterControl({ symbol, value, onChange }: OrderBookFilterControlProps) {
  const symbolConfig = useMemo(() => getSymbolConfig(symbol), [symbol]);

  // Smart defaults based on symbol's minQuantity
  const baseValue = symbolConfig.minQuantity;
  const presets = [
    { label: '10x', value: baseValue * 10 },
    { label: '100x', value: baseValue * 100 },
    { label: '1000x', value: baseValue * 1000 },
  ];

  const handlePresetClick = (presetValue: number) => {
    onChange(presetValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= 0) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    onChange(0);
  };

  return (
    <div style={{ padding: '8px 10px', borderBottom: '1px solid #162234' }}>
      <div style={{ fontSize: '11px', color: '#9fb0c7', marginBottom: '6px' }}>
        Min Quantity
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handlePresetClick(preset.value)}
            className="pill"
            style={{
              fontSize: '11px',
              height: '24px',
              padding: '0 8px',
              background: value === preset.value ? '#4096ff' : '#111827',
              borderColor: value === preset.value ? '#4096ff' : '#26344c',
              color: value === preset.value ? '#fff' : '#dfe4ef',
            }}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="pill"
          style={{
            fontSize: '11px',
            height: '24px',
            padding: '0 8px',
            background: value === 0 ? '#4096ff' : '#111827',
            borderColor: value === 0 ? '#4096ff' : '#26344c',
            color: value === 0 ? '#fff' : '#dfe4ef',
          }}
        >
          All
        </button>
      </div>
      <input
        type="number"
        className="input"
        value={value}
        onChange={handleInputChange}
        min={0}
        step={symbolConfig.minQuantity}
        placeholder="Custom value"
        style={{
          width: '100%',
          fontSize: '12px',
          padding: '4px 8px',
          height: '28px',
        }}
      />
    </div>
  );
}

export default OrderBookFilterControl;
