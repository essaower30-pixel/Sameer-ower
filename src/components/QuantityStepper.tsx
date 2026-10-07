import React from 'react';
import { Plus, Minus } from 'lucide-react';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  inputClassName?: string;
  allowDecimals?: boolean;
  disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  size = 'md',
  className = '',
  inputClassName = '',
  allowDecimals = false,
  disabled = false,
}) => {
  const currentVal = Number(value) || min;

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const next = currentVal - step;
    if (min !== undefined && next < min) return;
    const rounded = allowDecimals ? Math.round(next * 100) / 100 : Math.round(next);
    onChange(rounded);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const next = currentVal + step;
    if (max !== undefined && next > max) return;
    const rounded = allowDecimals ? Math.round(next * 100) / 100 : Math.round(next);
    onChange(rounded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(min);
      return;
    }
    const parsed = allowDecimals ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) {
        onChange(min);
      } else if (max !== undefined && parsed > max) {
        onChange(max);
      } else {
        onChange(parsed);
      }
    }
  };

  const sizeClasses = {
    sm: {
      btn: 'w-7 h-7 text-xs',
      input: 'h-7 text-xs px-1',
      icon: 'w-3 h-3',
    },
    md: {
      btn: 'w-9 h-9 text-sm',
      input: 'h-9 text-sm px-2',
      icon: 'w-4 h-4',
    },
    lg: {
      btn: 'w-11 h-11 text-base',
      input: 'h-11 text-base px-2',
      icon: 'w-5 h-5',
    },
  }[size];

  const isMin = min !== undefined && currentVal <= min;
  const isMax = max !== undefined && currentVal >= max;

  return (
    <div
      dir="ltr"
      className={`inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      } ${className}`}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isMin}
        title="إنقاص الكمية (-)"
        aria-label="إنقاص الكمية"
        className={`${sizeClasses.btn} shrink-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none border-r border-slate-200`}
      >
        <Minus className={sizeClasses.icon} strokeWidth={2.5} />
      </button>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value === 0 && min > 0 ? '' : value}
        onChange={handleInputChange}
        disabled={disabled}
        className={`flex-1 min-w-0 text-center font-mono font-bold bg-white text-slate-900 focus:outline-hidden ${sizeClasses.input} ${inputClassName}`}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isMax}
        title="زيادة الكمية (+)"
        aria-label="زيادة الكمية"
        className={`${sizeClasses.btn} shrink-0 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 active:scale-95 text-indigo-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none border-l border-slate-200`}
      >
        <Plus className={sizeClasses.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
};
