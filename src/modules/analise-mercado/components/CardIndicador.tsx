/**
 * CardIndicador — Card de indicador numérico principal
 * Exibe valor, variação, tendência e comparativo opcional
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { IndicadorCard } from '../types';
import { fmtNum, fmtVariacao, corVariacao } from '../utils/formatters';

interface CardIndicadorProps {
  indicador: IndicadorCard;
  /** Quando há franquia selecionada, exibir comparativo Brasil */
  comparativo?: { label: string; valor: number };
  compacto?: boolean;
}

export default function CardIndicador({ indicador, comparativo, compacto }: CardIndicadorProps) {
  const IconeTrend = indicador.tendencia === 'up' ? TrendingUp : indicador.tendencia === 'down' ? TrendingDown : Minus;
  const corTrend = corVariacao(indicador.variacao);

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: 12,
        padding: compacto ? 14 : 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}
    >
      {/* Barra topo colorida */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: indicador.cor }} />

      {/* Label */}
      <p style={{
        color: '#ADB5BD', fontSize: compacto ? '0.65rem' : '0.7rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {indicador.titulo}
      </p>

      {/* Valor principal */}
      <div style={{
        color: indicador.cor,
        fontSize: compacto ? '1.5rem' : '2rem',
        fontWeight: 700,
        fontFamily: "'Orbitron', sans-serif",
        lineHeight: 1.1,
      }}>
        {fmtNum(indicador.valor)}
      </div>

      {/* Subtítulo */}
      {indicador.subtitulo && (
        <p style={{ color: '#6C757D', fontSize: '0.68rem', margin: '4px 0 0' }}>
          {indicador.subtitulo}
        </p>
      )}

      {/* Comparativo com Brasil (quando franquia selecionada) */}
      {comparativo && (
        <div style={{ margin: '8px 0 0', padding: '6px 0', borderTop: '1px solid #495057' }}>
          <p style={{ color: '#6C757D', fontSize: '0.6rem', textTransform: 'uppercase', margin: '0 0 2px' }}>{comparativo.label}</p>
          <span style={{ color: '#FF6600', fontSize: '1rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
            {fmtNum(comparativo.valor)}
          </span>
        </div>
      )}

      {/* Variação */}
      <div style={{ borderTop: '1px solid #495057', marginTop: 10, paddingTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconeTrend size={14} color={corTrend} />
        <span style={{ color: corTrend, fontSize: '0.75rem', fontWeight: 600 }}>
          {fmtVariacao(indicador.variacao)}
        </span>
        <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>vs. ano anterior</span>
      </div>
    </div>
  );
}
