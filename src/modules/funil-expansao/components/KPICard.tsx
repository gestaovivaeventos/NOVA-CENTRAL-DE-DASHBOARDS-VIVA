/**
 * Card de KPI para o Funil de Expansão
 * Estilo dark theme com ícone e destaque
 * Suporte a conteúdo expandível via seta lateral
 */

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatacao';

interface KPICardProps {
  titulo: string;
  valor: number;
  subtitulo?: string;
  formato?: 'numero' | 'percentual';
  icone?: React.ReactNode;
  corDestaque?: string;
  detalhes?: string;
  /** Conteúdo expandível (lista de cidades, etc.) */
  expandivel?: React.ReactNode;
}

export default function KPICard({
  titulo,
  valor,
  subtitulo,
  formato = 'numero',
  icone,
  corDestaque = '#FF6600',
  detalhes,
  expandivel,
}: KPICardProps) {
  const [expandido, setExpandido] = useState(false);
  const valorFormatado = formato === 'percentual' ? formatPercent(valor) : formatNumber(valor);

  return (
    <div
      className="rounded-xl transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex">
        {/* Conteúdo principal */}
        <div className="flex-1 p-5">
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

        {/* Seta de expansão */}
        {expandivel && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="flex items-center justify-center px-2 transition-colors duration-200 rounded-r-xl"
            style={{
              backgroundColor: expandido ? '#495057' : 'transparent',
              borderLeft: '1px solid #495057',
              cursor: 'pointer',
            }}
            title={expandido ? 'Recolher' : 'Expandir'}
          >
            <ChevronRight
              size={16}
              style={{
                color: '#adb5bd',
                transform: expandido ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </button>
        )}
      </div>

      {/* Área expandida */}
      {expandivel && expandido && (
        <div
          className="px-5 pb-4 pt-2"
          style={{ borderTop: '1px solid #495057' }}
        >
          {expandivel}
        </div>
      )}
    </div>
  );
}
