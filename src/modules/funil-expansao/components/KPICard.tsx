/**
 * Card de KPI para o Funil de Expansão
 * Estilo dark theme com ícone e destaque
 */

import React from 'react';
import { formatNumber, formatPercent } from '../utils/formatacao';

interface KPICardProps {
  titulo: string;
  valor: number;
  subtitulo?: string;
  formato?: 'numero' | 'percentual';
  icone?: React.ReactNode;
  corDestaque?: string;
  detalhes?: string;
}

export default function KPICard({
  titulo,
  valor,
  subtitulo,
  formato = 'numero',
  icone,
  corDestaque = '#FF6600',
  detalhes,
}: KPICardProps) {
  const valorFormatado = formato === 'percentual' ? formatPercent(valor) : formatNumber(valor);

  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}
        >
          {titulo}
        </p>
        {icone && (
          <div style={{ color: corDestaque, opacity: 0.8 }}>{icone}</div>
        )}
      </div>

      <p
        className="text-3xl font-bold mb-1"
        style={{
          color: corDestaque,
          fontFamily: "'Orbitron', 'Poppins', sans-serif",
        }}
      >
        {valorFormatado}
      </p>

      {subtitulo && (
        <p className="text-xs" style={{ color: '#6c757d', fontFamily: 'Poppins, sans-serif' }}>
          {subtitulo}
        </p>
      )}

      {detalhes && (
        <p className="text-xs mt-1" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
          {detalhes}
        </p>
      )}
    </div>
  );
}
