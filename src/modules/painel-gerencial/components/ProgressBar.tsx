import React from 'react';

// Função para obter cor baseada no status
const getStatusColor = (status: 'verde' | 'amarelo' | 'vermelho'): string => {
  const colors = {
    verde: '#22C55E',
    amarelo: '#EAB308',
    vermelho: '#EF4444'
  };
  return colors[status] || '#FF6600';
};

interface ProgressBarProps {
  value: number;
  max?: number;
  status?: 'verde' | 'amarelo' | 'vermelho';
  showLabel?: boolean;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  status,
  showLabel = true,
  height = 'h-3'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const color = status ? getStatusColor(status) : '#FF6600';

  return (
    <div className="w-full">
      <div className={`w-full bg-slate-700 rounded-full ${height} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            transitionDuration: '500ms'
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>{value.toFixed(1)}%</span>
          <span>Meta: {max}%</span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
