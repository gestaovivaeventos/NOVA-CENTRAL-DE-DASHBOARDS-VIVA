/**
 * Componente KPICard - Card de indicador principal
 * Estilo baseado no dashboard original de vendas
 */

import React from 'react';
import { formatCurrency, formatPercent } from '@/modules/vendas/utils/formatacao';
import { getColorForPercentage, getSolidColorForPercentage } from '@/modules/vendas/utils/calculos';

interface KPICardProps {
  titulo: string;
  valorRealizado: number;
  valorMeta: number;
  formatarComoMoeda?: boolean;
  labelMeta?: string; // Ex: "META TOTAL", "META VENDAS", "META PÓS VENDAS"
  loading?: boolean; // Indica se os dados ainda estão carregando
}

// Componente de Skeleton para loading
const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div 
    className={`animate-pulse bg-gray-700 rounded ${className}`}
    style={{ opacity: 0.5 }}
  />
);

// Componente de Loading inline (spinner pequeno)
const LoadingSpinner = () => (
  <span className="inline-flex items-center gap-2">
    <span className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full" />
    <span className="text-gray-400 text-sm">Carregando...</span>
  </span>
);

export default function KPICard({
  titulo,
  valorRealizado,
  valorMeta,
  formatarComoMoeda = true,
  labelMeta = 'META',
  loading = false,
}: KPICardProps) {
  const percent = valorMeta > 0 ? valorRealizado / valorMeta : 0;
  const progressWidth = Math.min(percent * 100, 100);
  const percentColor = getSolidColorForPercentage(percent);
  
  // Gradiente da barra de progresso baseada no percentual (igual ao original)
  const progressBarGradient = getColorForPercentage(percent);

  // Se estiver carregando e o valor realizado é zero, mostrar indicador de loading
  // (a meta pode já ter carregado, mas o valor realizado ainda não)
  const isLoadingValue = loading && valorRealizado === 0;
  
  // Skeleton completo só se ambos forem zero e estiver carregando
  const showFullSkeleton = loading && valorRealizado === 0 && valorMeta === 0;

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
      
      {showFullSkeleton ? (
        <>
          {/* Skeleton do valor */}
          <SkeletonPulse className="h-9 w-3/4" />
          
          {/* Skeleton do percentual */}
          <SkeletonPulse className="h-5 w-1/2" />
          
          {/* Skeleton da barra */}
          <SkeletonPulse className="h-2.5 w-full mt-1" />
        </>
      ) : (
        <>
          {/* Valor Realizado - com indicador de loading se necessário */}
          <span className="text-text-primary text-3xl font-bold">
            {isLoadingValue ? (
              <LoadingSpinner />
            ) : (
              formatarComoMoeda ? formatCurrency(valorRealizado) : valorRealizado.toLocaleString('pt-BR')
            )}
          </span>
          
          {/* Percentual + Meta */}
          <span className="text-sm">
            <span className="font-bold" style={{ color: isLoadingValue ? '#6c757d' : percentColor }}>
              {isLoadingValue ? '—' : formatPercent(percent)}
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
              className={`h-full rounded-full transition-all duration-500 ${isLoadingValue ? 'animate-pulse' : ''}`}
              style={{ 
                width: isLoadingValue ? '30%' : `${progressWidth}%`,
                background: isLoadingValue ? '#4a5568' : progressBarGradient,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

