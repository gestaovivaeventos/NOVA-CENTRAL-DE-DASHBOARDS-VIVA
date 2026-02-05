/**
 * TabelaSegmentos - Tabela de segmentos estratégicos
 * Exibe comparativo entre segmentos de mercado
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';
import type { SegmentoEstrategico } from '../types';

interface TabelaSegmentosProps {
  segmentos: SegmentoEstrategico[];
}

export default function TabelaSegmentos({ segmentos }: TabelaSegmentosProps) {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'premium': return '#FFD700';
      case 'volume': return '#3B82F6';
      case 'crescimento': return '#10B981';
      case 'estavel': return '#6B7280';
      default: return '#ADB5BD';
    }
  };

  const getTipoBadge = (tipo: string) => {
    const labels: Record<string, string> = {
      premium: 'Premium',
      volume: 'Volume',
      crescimento: 'Crescimento',
      estavel: 'Estável',
    };
    return labels[tipo] || tipo;
  };

  const getPrevisibilidadeColor = (prev: string) => {
    switch (prev) {
      case 'alta': return '#10B981';
      case 'media': return '#F59E0B';
      case 'baixa': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    if (tendencia === 'crescimento') {
      return <TrendingUp size={16} color="#10B981" />;
    }
    if (tendencia === 'declinio') {
      return <TrendingDown size={16} color="#EF4444" />;
    }
    return <Minus size={16} color="#6B7280" />;
  };

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #495057',
        overflowX: 'auto',
      }}
    >
      <h3 style={{ 
        color: '#F8F9FA', 
        fontSize: '1.1rem', 
        fontWeight: 600, 
        marginBottom: '20px',
        fontFamily: 'Poppins, sans-serif'
      }}>
        Segmentos Estratégicos
      </h3>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #495057' }}>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'left', padding: '12px 8px', fontSize: '0.875rem' }}>
              Segmento
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'center', padding: '12px 8px', fontSize: '0.875rem' }}>
              Tipo
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'right', padding: '12px 8px', fontSize: '0.875rem' }}>
              Ticket Médio
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'right', padding: '12px 8px', fontSize: '0.875rem' }}>
              Volume/Ano
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'center', padding: '12px 8px', fontSize: '0.875rem' }}>
              Previsibilidade
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'center', padding: '12px 8px', fontSize: '0.875rem' }}>
              Tendência
            </th>
            <th style={{ color: '#ADB5BD', fontWeight: 600, textAlign: 'right', padding: '12px 8px', fontSize: '0.875rem' }}>
              Margem
            </th>
          </tr>
        </thead>
        <tbody>
          {segmentos.map((seg, idx) => (
            <tr 
              key={seg.id} 
              style={{ 
                borderBottom: '1px solid #495057',
                backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
              }}
            >
              <td style={{ padding: '14px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {seg.tipo === 'premium' && <Star size={16} color="#FFD700" fill="#FFD700" />}
                  <span style={{ color: '#F8F9FA', fontWeight: 500 }}>{seg.nome}</span>
                </div>
                {seg.destaque && (
                  <p style={{ color: '#6C757D', fontSize: '0.75rem', marginTop: '4px' }}>
                    {seg.destaque}
                  </p>
                )}
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: `${getTipoColor(seg.tipo)}20`,
                    color: getTipoColor(seg.tipo),
                  }}
                >
                  {getTipoBadge(seg.tipo)}
                </span>
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'right', color: '#F8F9FA', fontWeight: 600 }}>
                R$ {seg.ticket_medio.toLocaleString('pt-BR')}
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'right', color: '#ADB5BD' }}>
                {seg.volume_anual.toLocaleString('pt-BR')}
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: `${getPrevisibilidadeColor(seg.previsibilidade)}20`,
                    color: getPrevisibilidadeColor(seg.previsibilidade),
                  }}
                >
                  {seg.previsibilidade.charAt(0).toUpperCase() + seg.previsibilidade.slice(1)}
                </span>
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  {getTendenciaIcon(seg.tendencia)}
                  <span style={{ color: '#ADB5BD', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    {seg.tendencia}
                  </span>
                </div>
              </td>
              <td style={{ padding: '14px 8px', textAlign: 'right', color: '#10B981', fontWeight: 600 }}>
                {seg.margem_percentual}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
