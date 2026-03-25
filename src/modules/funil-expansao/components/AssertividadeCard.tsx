/**
 * Componente de Assertividade com grafico de rosca (donut)
 * Exibe metricas de assertividade de territorio ou persona
 */

import React from 'react';
import type { DadosAssertividade } from '../types';
import { formatNumber, formatPercent } from '../utils/formatacao';

const CORES_ASSERTIVIDADE: Record<string, string> = {
  'Foco': '#28a745',
  'Oportunidade': '#ffc107',
  'Foco Franquia Operacao': '#17a2b8',
  'Fora': '#dc3545',
  'Sem Validacao': '#6c757d',
};

function getCorAssertividade(cat: string): string {
  // Busca exata primeiro
  if (CORES_ASSERTIVIDADE[cat]) return CORES_ASSERTIVIDADE[cat];
  // Busca parcial (case-insensitive)
  const upper = cat.toUpperCase();
  if (upper.includes('FOCO FRANQUIA') || upper.includes('FOCO FRANQ')) return '#17a2b8';
  if (upper === 'FOCO') return '#28a745';
  if (upper.includes('OPORTUNIDADE')) return '#ffc107';
  if (upper.includes('FORA')) return '#dc3545';
  return '#6c757d';
}

interface AssertividadeCardProps {
  titulo: string;
  dados: DadosAssertividade[];
  regiaoInfo?: { regiao: string; qtd: number; label: string };
  menorInfo?: { nome: string; qtd: number; label: string };
}

/** Gera os segmentos de um SVG donut chart */
function DonutChart({ dados, size = 180 }: { dados: DadosAssertividade[]; size?: number }) {
  const total = dados.reduce((sum, d) => sum + d.quantidade, 0);
  if (total === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.6;

  let cumAngle = -90; // comeca no topo
  const segments: React.ReactNode[] = [];

  dados.forEach((d, idx) => {
    if (d.quantidade === 0) return;
    const angle = (d.quantidade / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;

    const start = polarToCartesian(cx, cy, outerR, startAngle);
    const end = polarToCartesian(cx, cy, outerR, endAngle);
    const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
    const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);

    const largeArc = angle > 180 ? 1 : 0;

    const pathD = [
      `M ${start.x} ${start.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');

    const cor = getCorAssertividade(d.categoria);
    segments.push(
      <path key={idx} d={pathD} fill={cor} stroke="#343A40" strokeWidth="1">
        <title>{`${d.categoria}: ${formatNumber(d.quantidade)} (${formatPercent(d.percentual)})`}</title>
      </path>
    );

    cumAngle = endAngle;
  });

  // Texto central com total
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#F8F9FA" fontSize="22" fontWeight="bold" fontFamily="Orbitron, sans-serif">
        {formatNumber(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6c757d" fontSize="10" fontFamily="Poppins, sans-serif">
        total
      </text>
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function AssertividadeCard({ titulo, dados, regiaoInfo, menorInfo }: AssertividadeCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {/* Titulo padronizado */}
      <h3
        className="text-sm font-semibold uppercase tracking-wider pb-3 mb-4"
        style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif', borderBottom: '1px solid #495057' }}
      >
        {titulo}
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="flex-shrink-0">
          <DonutChart dados={dados} />
        </div>

        {/* Legendas */}
        <div className="flex-1 space-y-2">
          {dados.map(d => {
            const cor = getCorAssertividade(d.categoria);
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
      </div>

      {/* Maior e Menor assertividade na mesma linha */}
      {(regiaoInfo?.regiao || menorInfo?.nome) && (
        <div className="mt-4 pt-3 flex gap-6" style={{ borderTop: '1px solid #495057' }}>
          {regiaoInfo && regiaoInfo.regiao && (
            <div className="flex-1">
              <span className="text-[10px] uppercase" style={{ color: '#6c757d' }}>Maior Assertividade</span>
              <p className="text-xs font-bold" style={{ color: '#28a745' }}>
                {regiaoInfo.regiao} ({formatNumber(regiaoInfo.qtd)} leads)
              </p>
            </div>
          )}
          {menorInfo && menorInfo.nome && (
            <div className="flex-1">
              <span className="text-[10px] uppercase" style={{ color: '#6c757d' }}>Menor Assertividade</span>
              <p className="text-xs font-bold" style={{ color: '#dc3545' }}>
                {menorInfo.nome} ({formatNumber(menorInfo.qtd)} leads)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
