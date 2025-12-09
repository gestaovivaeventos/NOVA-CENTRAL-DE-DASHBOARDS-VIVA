'use client';

import React from 'react';

interface IndicadorCardProps {
  nome: string;
  valor: number;
  meta: number;
  unidade?: string;
  pontuacao?: number;
  inverso?: boolean;
}

export function IndicadorCard({
  nome,
  valor,
  meta,
  unidade = '',
  pontuacao,
  inverso = false,
}: IndicadorCardProps) {
  // Calcula percentual de atingimento
  const percentual = meta > 0 ? (valor / meta) * 100 : 0;
  
  // Determina cor baseado no desempenho
  const getStatusColor = () => {
    const threshold = inverso ? 100 / percentual * 100 : percentual;
    if (threshold >= 100) return 'text-green-400';
    if (threshold >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProgressColor = () => {
    const threshold = inverso ? 100 / percentual * 100 : percentual;
    if (threshold >= 100) return 'bg-green-500';
    if (threshold >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const progressWidth = Math.min(percentual, 100);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-dark-text-muted uppercase tracking-wider">
          {nome}
        </h3>
        {pontuacao !== undefined && (
          <span className="text-xs font-medium text-viva-primary bg-viva-primary/10 px-2 py-0.5 rounded">
            {pontuacao.toFixed(1)} pts
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className={`text-3xl font-bold ${getStatusColor()}`}>
          {valor.toFixed(1)}
        </span>
        <span className="text-dark-text-muted text-sm">
          {unidade}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-dark-bg rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {/* Meta */}
      <div className="flex justify-between text-xs text-dark-text-muted">
        <span>Meta: {meta.toFixed(1)}{unidade}</span>
        <span>{percentual.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default IndicadorCard;
