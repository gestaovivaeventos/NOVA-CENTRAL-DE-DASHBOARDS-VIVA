/**
 * Tabela de barras horizontais para distribuição de dados
 * Usada para: Leads por Origem, Distribuição por Persona, Perfil, Motivos
 */

import React, { useState } from 'react';
import { formatNumber } from '../utils/formatacao';
import { COLORS } from '../config/app.config';

interface DataItem {
  label: string;
  geral: number;
  mql: number;
  sql: number;
}

interface HorizontalBarTableProps {
  titulo: string;
  dados: DataItem[];
  maxItems?: number;
  hideTabs?: boolean;
}

type TabType = 'GERAL' | 'MQL' | 'SQL';

export default function HorizontalBarTable({ titulo, dados, maxItems = 15, hideTabs = false }: HorizontalBarTableProps) {
  const [tab, setTab] = useState<TabType>('GERAL');

  const getValue = (item: DataItem) => {
    switch (tab) {
      case 'MQL': return item.mql;
      case 'SQL': return item.sql;
      default: return item.geral;
    }
  };

  const visibleData = dados.slice(0, maxItems);
  const maxVal = Math.max(...visibleData.map(getValue), 1);

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
        className="text-sm font-semibold uppercase tracking-wider pb-3 mb-3"
        style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', borderBottom: '1px solid #495057' }}
      >
        {titulo}
      </h3>

      {/* Tabs */}
      {!hideTabs && (
        <div className="flex gap-2 mb-4">
          {(['GERAL', 'MQL', 'SQL'] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                tab === t ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
              style={{
                backgroundColor: tab === t ? '#FF6600' : '#495057',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Barras */}
      <div className="space-y-2">
        {visibleData.map((item, idx) => {
          const val = getValue(item);
          const widthPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const cor = COLORS.CHART[idx % COLORS.CHART.length];

          return (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className="text-xs text-right truncate"
                style={{
                  width: '180px',
                  minWidth: '180px',
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.7rem',
                }}
                title={item.label}
              >
                {item.label}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="rounded-sm overflow-hidden"
                  style={{ height: '18px', flex: 1, backgroundColor: '#2a2d31' }}
                >
                  <div
                    className="h-full rounded-sm transition-all duration-500"
                    style={{
                      width: `${Math.max(widthPct, 1)}%`,
                      backgroundColor: cor,
                    }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: '#F8F9FA', minWidth: '30px', textAlign: 'right' }}>
                  {formatNumber(val)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
