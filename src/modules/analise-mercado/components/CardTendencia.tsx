/**
 * CardTendencia - Card para exibição de tendências de mercado
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from 'lucide-react';
import type { TendenciaMercado } from '../types';

interface CardTendenciaProps {
  tendencia: TendenciaMercado;
}

export default function CardTendencia({ tendencia }: CardTendenciaProps) {
  const getImpactoConfig = () => {
    switch (tendencia.impacto) {
      case 'positivo':
        return { icon: TrendingUp, color: '#10B981', label: 'Impacto Positivo' };
      case 'negativo':
        return { icon: TrendingDown, color: '#EF4444', label: 'Impacto Negativo' };
      default:
        return { icon: Minus, color: '#6B7280', label: 'Impacto Neutro' };
    }
  };

  const getProbabilidadeColor = () => {
    switch (tendencia.probabilidade) {
      case 'alta': return '#EF4444';
      case 'media': return '#F59E0B';
      case 'baixa': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoriaColor = () => {
    switch (tendencia.categoria) {
      case 'tecnologia': return '#8B5CF6';
      case 'regulatorio': return '#F59E0B';
      case 'demografico': return '#3B82F6';
      case 'economico': return '#10B981';
      case 'comportamental': return '#EC4899';
      default: return '#6B7280';
    }
  };

  const impactoConfig = getImpactoConfig();
  const ImpactoIcon = impactoConfig.icon;

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #495057',
        borderLeft: `4px solid ${impactoConfig.color}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImpactoIcon size={20} color={impactoConfig.color} />
          <span
            style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: `${getCategoriaColor()}20`,
              color: getCategoriaColor(),
              fontWeight: 500,
              textTransform: 'capitalize',
            }}
          >
            {tendencia.categoria}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6C757D', fontSize: '0.75rem' }}>
          <Clock size={12} />
          {tendencia.horizonte}
        </div>
      </div>

      {/* Título */}
      <h4 style={{ color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
        {tendencia.titulo}
      </h4>

      {/* Descrição */}
      <p style={{ color: '#ADB5BD', fontSize: '0.875rem', lineHeight: 1.5, flex: 1 }}>
        {tendencia.descricao}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #495057' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} color={getProbabilidadeColor()} />
          <span style={{ color: '#ADB5BD', fontSize: '0.75rem' }}>
            Probabilidade: 
            <span style={{ color: getProbabilidadeColor(), fontWeight: 600, marginLeft: '4px', textTransform: 'capitalize' }}>
              {tendencia.probabilidade}
            </span>
          </span>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: `${impactoConfig.color}20`,
            color: impactoConfig.color,
            fontWeight: 500,
          }}
        >
          {impactoConfig.label}
        </span>
      </div>
    </div>
  );
}
