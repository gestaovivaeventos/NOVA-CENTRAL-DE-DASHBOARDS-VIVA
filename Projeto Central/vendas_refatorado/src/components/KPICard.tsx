/**
 * Componente KPICard - Card de indicador principal
 * Estilo baseado no dashboard original de vendas
 */

import React from 'react';
import { formatCurrency, formatPercent } from '@/utils/formatacao';
import { getColorForPercentage, getSolidColorForPercentage } from '@/utils/calculos';

interface KPICardProps {
  titulo: string;
  valorRealizado: number;
  valorMeta: number;
  formatarComoMoeda?: boolean;
  labelMeta?: string; // Ex: "META TOTAL", "META VENDAS", "META PÓS VENDAS"
}

export default function KPICard({
  titulo,
  valorRealizado,
  valorMeta,
  formatarComoMoeda = true,
  labelMeta = 'META',
}: KPICardProps) {
  const percent = valorMeta > 0 ? valorRealizado / valorMeta : 0;
  const progressWidth = Math.min(percent * 100, 100);
  const percentColor = getSolidColorForPercentage(percent);
  
  // Gradiente da barra de progresso baseada no percentual (igual ao original)
  const progressBarGradient = getColorForPercentage(percent);

  return (
    <div 
      className="rounded-lg p-5 flex flex-col gap-2"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.03))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Título */}
      <span className="kpi-card-title">
        {titulo}
      </span>
      
      {/* Valor Realizado */}
      <span className="text-text-primary text-3xl font-bold">
        {formatarComoMoeda ? formatCurrency(valorRealizado) : valorRealizado.toLocaleString('pt-BR')}
      </span>
      
      {/* Percentual + Meta */}
      <span className="text-sm">
        <span className="font-bold" style={{ color: percentColor }}>
          {formatPercent(percent)}
        </span>
        <span className="kpi-meta-value">
          {' de '}
          {formatarComoMoeda ? formatCurrency(valorMeta) : valorMeta.toLocaleString('pt-BR')}
          {' '}{labelMeta}
        </span>
      </span>
      
      {/* Barra de Progresso */}
      <div className="w-full h-2.5 bg-dark-tertiary rounded-full overflow-hidden mt-1">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progressWidth}%`,
            background: progressBarGradient,
          }}
        />
      </div>
    </div>
  );
}
