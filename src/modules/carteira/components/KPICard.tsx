/**
 * Componente KPICard para o módulo Carteira
 * Baseado no padrão do módulo de Vendas
 * Com tooltip explicativo do indicador
 */

import React from 'react';
import { formatCurrency, formatPercent, formatNumber, getColorForPercentage, getProgressGradient } from '@/modules/carteira/utils/formatacao';
import { HelpCircle } from 'lucide-react';

interface KPICardProps {
  titulo: string;
  valor: number | string;
  subtitulo?: string;
  percentual?: number;
  meta?: number;
  formatarComoMoeda?: boolean;
  formatarComoNumero?: boolean;
  loading?: boolean;
  icone?: React.ReactNode;
  destaque?: string; // Texto destacado em laranja abaixo do valor (ex: porcentagem)
  tooltip?: string; // Explicação do indicador
}

// Skeleton para loading
const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div 
    className={`animate-pulse bg-gray-700 rounded ${className}`}
    style={{ opacity: 0.5 }}
  />
);

export default function KPICard({
  titulo,
  valor,
  subtitulo,
  percentual,
  meta,
  formatarComoMoeda = false,
  formatarComoNumero = true,
  loading = false,
  icone,
  destaque,
  tooltip,
}: KPICardProps) {
  const showProgress = percentual !== undefined;
  const progressWidth = showProgress ? Math.min(percentual * 100, 100) : 0;
  const percentColor = showProgress ? getColorForPercentage(percentual) : '#9ca3af';
  const progressGradient = showProgress ? getProgressGradient(percentual) : '';

  // Formatar valor
  const valorFormatado = typeof valor === 'string' 
    ? valor 
    : formatarComoMoeda 
      ? formatCurrency(valor) 
      : formatarComoNumero 
        ? formatNumber(valor) 
        : valor;

  if (loading) {
    return (
      <div 
        className="rounded-lg p-5 flex flex-col gap-2"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.03))',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <SkeletonPulse className="h-4 w-1/2" />
        <SkeletonPulse className="h-9 w-3/4" />
        <SkeletonPulse className="h-5 w-1/2" />
        <SkeletonPulse className="h-2.5 w-full mt-1" />
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-5 flex flex-col gap-2"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.03))',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Título com tooltip */}
      <div className="flex items-center gap-2">
        <span 
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#9ca3af', fontFamily: "'Poppins', sans-serif" }}
        >
          {titulo}
        </span>
        {tooltip && (
          <div className="relative group">
            <HelpCircle 
              size={14} 
              style={{ color: '#6b7280', cursor: 'help' }} 
            />
            <div 
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 pointer-events-none"
              style={{ minWidth: '200px', whiteSpace: 'normal' }}
            >
              {tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Valor Principal */}
      <span 
        className="text-3xl font-bold"
        style={{ color: '#F8F9FA', fontFamily: "'Poppins', sans-serif" }}
      >
        {valorFormatado}
      </span>

      {/* Destaque em laranja (ex: porcentagem) */}
      {destaque && (
        <span 
          className="text-sm font-light"
          style={{ color: '#FF6600', fontFamily: "'Poppins', sans-serif" }}
        >
          {destaque}
        </span>
      )}
      
      {/* Subtítulo ou Percentual + Meta */}
      {(subtitulo || showProgress) && (
        <span className="text-sm">
          {showProgress && (
            <>
              <span className="font-bold" style={{ color: percentColor }}>
                {formatPercent(percentual)}
              </span>
              {meta !== undefined && (
                <span style={{ color: '#6c757d' }}>
                  {' de '}
                  {formatarComoMoeda ? formatCurrency(meta) : formatNumber(meta)}
                  {' META'}
                </span>
              )}
            </>
          )}
          {subtitulo && !showProgress && (
            <span style={{ color: '#6c757d' }}>{subtitulo}</span>
          )}
        </span>
      )}
      
      {/* Barra de Progresso */}
      {showProgress && (
        <div 
          className="w-full h-2.5 rounded-full overflow-hidden mt-1"
          style={{ backgroundColor: '#374151' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progressWidth}%`,
              background: progressGradient,
            }}
          />
        </div>
      )}
    </div>
  );
}
