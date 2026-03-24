/**
 * Componente de Assertividade (Donut visual)
 * Exibe métricas de assertividade de território ou persona
 */

import React from 'react';
import type { DadosAssertividade } from '../types';
import { formatNumber, formatPercent } from '../utils/formatacao';

const CORES_ASSERTIVIDADE: Record<string, string> = {
  'Foco': '#28a745',
  'Oportunidade': '#ffc107',
  'Foco Franquia Operação': '#17a2b8',
  'Fora': '#dc3545',
  'Sem Validação': '#6c757d',
};

interface AssertividadeCardProps {
  titulo: string;
  dados: DadosAssertividade[];
}

export default function AssertividadeCard({ titulo, dados }: AssertividadeCardProps) {
  const total = dados.reduce((sum, d) => sum + d.quantidade, 0);

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <h3
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif' }}
      >
        {titulo}
      </h3>

      {/* Barra empilhada horizontal */}
      <div className="w-full rounded-full overflow-hidden flex" style={{ height: '24px' }}>
        {dados.map(d => {
          const width = total > 0 ? (d.quantidade / total) * 100 : 0;
          const cor = CORES_ASSERTIVIDADE[d.categoria] || '#6c757d';
          return (
            <div
              key={d.categoria}
              style={{
                width: `${width}%`,
                backgroundColor: cor,
                minWidth: width > 0 ? '2px' : '0',
              }}
              title={`${d.categoria}: ${formatNumber(d.quantidade)} (${formatPercent(d.percentual)})`}
            />
          );
        })}
      </div>

      {/* Legendas */}
      <div className="mt-4 space-y-2">
        {dados.map(d => {
          const cor = CORES_ASSERTIVIDADE[d.categoria] || '#6c757d';
          return (
            <div key={d.categoria} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cor }} />
                <span className="text-xs" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                  {d.categoria}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold" style={{ color: '#F8F9FA' }}>
                  {formatNumber(d.quantidade)}
                </span>
                <span className="text-xs" style={{ color: '#6c757d' }}>
                  ({formatPercent(d.percentual)})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Destaques */}
      {dados.length > 0 && (
        <div className="mt-4 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid #495057' }}>
          <div>
            <span className="text-[10px] uppercase" style={{ color: '#6c757d' }}>Mais Leads</span>
            <p className="text-xs font-bold" style={{ color: CORES_ASSERTIVIDADE[dados[0]?.categoria] || '#FF6600' }}>
              {dados[0]?.categoria} {formatNumber(dados[0]?.quantidade || 0)}
            </p>
          </div>
          {dados.length > 1 && (
            <div>
              <span className="text-[10px] uppercase" style={{ color: '#6c757d' }}>Menos Leads</span>
              <p className="text-xs font-bold" style={{ color: CORES_ASSERTIVIDADE[dados[dados.length - 1]?.categoria] || '#6c757d' }}>
                {dados[dados.length - 1]?.categoria} {formatNumber(dados[dados.length - 1]?.quantidade || 0)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
