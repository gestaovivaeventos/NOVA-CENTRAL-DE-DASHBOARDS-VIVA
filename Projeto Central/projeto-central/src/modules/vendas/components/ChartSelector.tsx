/**
 * Componente ChartSelector - Seletor de tipo de gráfico
 */

import React from 'react';

interface ChartSelectorOption {
  value: string;
  label: string;
}

interface ChartSelectorProps {
  options: ChartSelectorOption[];
  value: string;
  onChange: (value: string) => void;
}

export default function ChartSelector({ options, value, onChange }: ChartSelectorProps) {
  return (
    <div className="chart-selector">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`btn-secondary ${value === option.value ? 'active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

