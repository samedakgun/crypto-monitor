import { useState } from 'react';

interface ThresholdControlProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function ThresholdControl({
  value,
  onChange,
  min = 1,
  max = 10,
  step = 0.5
}: ThresholdControlProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  return (
    <div className="field threshold-control">
      <span className="field-label">Big Trade Threshold:</span>
      <div className="threshold-input-group">
        <button
          className="threshold-btn"
          onClick={handleDecrement}
          disabled={value <= min}
          title="Decrease threshold"
        >
          −
        </button>
        <input
          type="number"
          className="input threshold-input"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          min={min}
          max={max}
          step={step}
          style={{ width: '60px', textAlign: 'center' }}
        />
        <button
          className="threshold-btn"
          onClick={handleIncrement}
          disabled={value >= max}
          title="Increase threshold"
        >
          +
        </button>
        <span className="field-label">x avg</span>
      </div>
    </div>
  );
}

export default ThresholdControl;
