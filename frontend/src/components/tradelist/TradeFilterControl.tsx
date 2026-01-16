import React from 'react';

interface TradeFilterControlProps {
  value: number;
  onChange: (value: number) => void;
}

function TradeFilterControl({ value, onChange }: TradeFilterControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= 0) {
      onChange(newValue);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: '#9fb0c7' }}>Min Quantity:</span>
      <input
        type="number"
        className="input"
        value={value}
        onChange={handleChange}
        min={0}
        step={0.1}
        placeholder="0"
        style={{
          width: '80px',
          textAlign: 'center',
          fontSize: '12px',
          padding: '4px 8px',
          height: '28px'
        }}
      />
    </div>
  );
}

export default TradeFilterControl;
