/**
 * KPICard - Card de indicador chave
 * Exibe métricas principais com variação e tendência
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPIMercado } from '../types';

interface KPICardProps {
  kpi: KPIMercado;
}

export default function KPICard({ kpi }: KPICardProps) {
  const formatValue = (valor: number, unidade: string) => {
    if (unidade === '%') {
      return `${valor.toFixed(2)}%`;
    }
    if (unidade === 'R$') {
      return `R$ ${valor.toLocaleString('pt-BR')}`;
    }
    if (valor >= 1000000) {
      return `${(valor / 1000000).toFixed(1)}M`;
    }
    if (valor >= 1000) {
      return `${(valor / 1000).toFixed(0)}K`;
    }
    return valor.toLocaleString('pt-BR');
  };

  const getTrendIcon = () => {
    if (kpi.tendencia === 'up') {
      return <TrendingUp size={18} color="#10B981" />;
    }
    if (kpi.tendencia === 'down') {
      return <TrendingDown size={18} color="#EF4444" />;
    }
    return <Minus size={18} color="#6B7280" />;
  };

  const getVariacaoColor = () => {
    if (kpi.variacao > 0) return '#10B981';
    if (kpi.variacao < 0) return '#EF4444';
    return '#6B7280';
  };

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #495057',
        borderLeft: `4px solid ${kpi.cor || '#FF6600'}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <p style={{ color: '#ADB5BD', fontSize: '0.875rem', marginBottom: '8px' }}>
        {kpi.titulo}
      </p>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ 
          color: '#F8F9FA', 
          fontSize: '1.75rem', 
          fontWeight: 700,
          fontFamily: 'Poppins, sans-serif'
        }}>
          {formatValue(kpi.valor, kpi.unidade)}
        </span>
        {kpi.unidade !== '%' && kpi.unidade !== 'R$' && (
          <span style={{ color: '#6C757D', fontSize: '0.75rem' }}>
            {kpi.unidade}
          </span>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        marginTop: '12px' 
      }}>
        {getTrendIcon()}
        <span style={{ 
          color: getVariacaoColor(), 
          fontSize: '0.875rem',
          fontWeight: 600 
        }}>
          {kpi.variacao > 0 ? '+' : ''}{kpi.variacao.toFixed(1)}%
        </span>
        <span style={{ color: '#6C757D', fontSize: '0.75rem' }}>
          vs. ano anterior
        </span>
      </div>
    </div>
  );
}
