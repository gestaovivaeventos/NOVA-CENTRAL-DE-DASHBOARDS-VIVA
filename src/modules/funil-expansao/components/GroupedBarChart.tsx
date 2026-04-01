/**
 * Gráfico de colunas verticais agrupadas (lado a lado)
 * Mostra Geral, MQL e SQL simultaneamente com toggles para mostrar/ocultar cada série
 */

import React, { useState } from 'react';
import { formatNumber } from '../utils/formatacao';

interface DataItem {
  label: string;
  geral: number;
  mql: number;
  sql: number;
}

interface GroupedBarChartProps {
  titulo: string;
  dados: DataItem[];
  maxItems?: number;
  hideToggles?: boolean;
}

type SeriesKey = 'geral' | 'mql' | 'sql';

const SERIES_CONFIG: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'geral', label: 'Geral', color: '#FF6600' },
  { key: 'mql', label: 'MQL', color: '#60a5fa' },
  { key: 'sql', label: 'SQL', color: '#a78bfa' },
];

const CHART_HEIGHT = 260;

export default function GroupedBarChart({ titulo, dados, maxItems = 15, hideToggles = false }: GroupedBarChartProps) {
  const [activeSeries, setActiveSeries] = useState<Set<SeriesKey>>(new Set(hideToggles ? ['geral'] : ['geral', 'mql', 'sql']));
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const visibleData = dados.slice(0, maxItems);
  const activeConfigs = SERIES_CONFIG.filter(s => activeSeries.has(s.key));

  // Escala máxima global baseada apenas nas séries ativas
  const maxVal = Math.max(
    ...visibleData.flatMap(item => activeConfigs.map(s => item[s.key])),
    1
  );

  // Linhas de grade horizontais
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <h2 className="section-title text-left">
        {titulo}
      </h2>

      {/* Toggles de séries */}
      {!hideToggles && (
      <div className="flex flex-wrap gap-2 mb-4">
        {SERIES_CONFIG.map(s => {
          const active = activeSeries.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSeries(s.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? 'border'
                  : 'text-gray-400 border border-transparent hover:bg-white/5'
                }
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                ...(active
                  ? {
                      backgroundColor: `${s.color}15`,
                      borderColor: s.color,
                      color: s.color,
                    }
                  : {
                      backgroundColor: '#2a2d31',
                    }
                ),
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      )}

      {/* Área do gráfico */}
      <div className="flex">
        {/* Eixo Y - labels de escala */}
        <div
          className="flex flex-col justify-between items-end pr-2"
          style={{ height: `${CHART_HEIGHT}px`, minWidth: '36px', marginTop: '20px' }}
        >
          {[...gridLines].reverse().map((v, i) => (
            <span
              key={i}
              className="text-[10px] leading-none"
              style={{ color: '#6c757d', fontFamily: 'Poppins, sans-serif' }}
            >
              {formatNumber(v)}
            </span>
          ))}
        </div>

        {/* Área de colunas */}
        <div className="flex-1 relative" style={{ height: `${CHART_HEIGHT}px`, marginTop: '20px' }}>
          {/* Linhas de grade */}
          {gridLines.map((v, i) => {
            const bottom = maxVal > 0 ? (v / maxVal) * 100 : 0;
            return (
              <div
                key={i}
                className="absolute left-0 right-0"
                style={{
                  bottom: `${bottom}%`,
                  borderTop: '1px solid #3a3f46',
                }}
              />
            );
          })}

          {/* Grupos de colunas */}
          <div
            className="absolute inset-0 flex items-end overflow-visible"
            style={{ zIndex: 1, gap: '8px', padding: '0 4px' }}
          >
            {visibleData.map((item) => (
              <div
                key={item.label}
                className="flex-1 flex items-end justify-center relative"
                style={{ gap: '3px', height: '100%' }}
                onMouseEnter={() => setHoveredGroup(item.label)}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                {activeConfigs.map(s => {
                  const val = item[s.key];
                  const heightPx = maxVal > 0 ? (val / maxVal) * CHART_HEIGHT : 0;
                  return (
                    <div
                      key={s.key}
                      className="flex-1 flex flex-col items-center"
                      style={{ maxWidth: '32px', alignSelf: 'flex-end' }}
                    >
                      {val > 0 && (
                        <span
                          className="text-[11px] font-bold mb-0.5 whitespace-nowrap"
                          style={{ color: s.color, fontFamily: 'Poppins, sans-serif' }}
                        >
                          {formatNumber(val)}
                        </span>
                      )}
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${Math.max(heightPx, val > 0 ? 4 : 0)}px`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                  );
                })}

                {/* Tooltip no hover */}
                {hoveredGroup === item.label && (
                  <div
                    className="absolute z-50 rounded-lg px-4 py-3 shadow-xl pointer-events-none"
                    style={{
                      bottom: '105%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#1a1d21',
                      border: '1px solid #495057',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div
                      className="text-xs font-bold mb-2"
                      style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {item.label}
                    </div>
                    {SERIES_CONFIG.map(s => {
                      const val = item[s.key];
                      const pctText = (s.key === 'mql' || s.key === 'sql') && item.geral > 0
                        ? ` (${((val / item.geral) * 100).toFixed(1)}%)`
                        : '';
                      return (
                        <div key={s.key} className="flex items-center gap-2 mb-0.5">
                          <span
                            className="inline-block rounded-full"
                            style={{ width: '8px', height: '8px', backgroundColor: s.color }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: '#ccc', fontFamily: 'Poppins, sans-serif' }}
                          >
                            {s.label}: <strong style={{ color: s.color }}>{formatNumber(val)}</strong>
                            {pctText && <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{pctText}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eixo X - labels com margem para eixo Y */}
      <div className="flex" style={{ marginTop: '6px' }}>
        <div style={{ minWidth: '36px', paddingRight: '8px' }} />
        <div className="flex-1 flex" style={{ gap: '8px', padding: '0 4px' }}>
          {visibleData.map((item) => (
            <div
              key={item.label}
              className="flex-1 text-center"
              style={{
                color: '#adb5bd',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.68rem',
                lineHeight: '1.3',
                wordBreak: 'break-word',
                hyphens: 'auto',
                padding: '0 2px',
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
