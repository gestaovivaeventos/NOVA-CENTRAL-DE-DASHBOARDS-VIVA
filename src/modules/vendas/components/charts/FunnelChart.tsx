/**
 * Componente FunnelChart - Gráfico de funil de vendas
 */

import React, { useMemo } from 'react';
import { COLORS } from '@/modules/vendas/config/app.config';
import { formatPercent } from '@/modules/vendas/utils/formatacao';

interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  data: FunnelStage[];
  title?: string;
}

const FUNNEL_COLORS = [
  '#007BFF', // Azul - Prospects
  '#17A2B8', // Cyan - Leads
  '#28A745', // Verde - Oportunidades
  '#FFC107', // Amarelo - Propostas
  '#FF6600', // Laranja - Negociação
  '#28A745', // Verde - Conversões
];

export default function FunnelChart({ data, title = 'Funil de Vendas' }: FunnelChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value)), [data]);

  const stages = useMemo(() => {
    return data.map((stage, index) => {
      const widthPercent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
      const conversionRate = index > 0 && data[index - 1].value > 0
        ? stage.value / data[index - 1].value
        : index === 0 ? 1 : 0;
      
      return {
        ...stage,
        widthPercent,
        conversionRate,
        color: stage.color || FUNNEL_COLORS[index % FUNNEL_COLORS.length],
      };
    });
  }, [data, maxValue]);

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-text-muted">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-bold text-text-primary mb-4">{title}</h3>
      )}
      
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage.label} className="relative">
            {/* Barra do funil */}
            <div 
              className="h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-300"
              style={{
                width: `${Math.max(stage.widthPercent, 20)}%`,
                background: `linear-gradient(90deg, ${stage.color} 0%, ${stage.color}99 100%)`,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              <span className="text-white font-semibold text-sm truncate">
                {stage.label}
              </span>
              <span className="text-white font-bold text-lg">
                {stage.value.toLocaleString('pt-BR')}
              </span>
            </div>
            
            {/* Taxa de conversão */}
            {index > 0 && (
              <div className="absolute -top-2 right-0 bg-dark-secondary px-2 py-0.5 rounded text-xs">
                <span className={stage.conversionRate >= 0.5 ? 'text-success' : stage.conversionRate >= 0.3 ? 'text-warning' : 'text-danger'}>
                  ↓ {formatPercent(stage.conversionRate)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Legenda de conversão total */}
      <div className="mt-4 text-center">
        <span className="text-text-muted text-sm">
          Conversão Total: {' '}
          <span className="text-primary-500 font-bold">
            {data.length >= 2 && data[0].value > 0
              ? formatPercent(data[data.length - 1].value / data[0].value)
              : '0%'
            }
          </span>
        </span>
      </div>
    </div>
  );
}

