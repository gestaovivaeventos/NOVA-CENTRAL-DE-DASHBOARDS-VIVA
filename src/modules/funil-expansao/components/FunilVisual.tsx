/**
 * Visualização do Funil de Expansão
 * Exibe as etapas do funil com barras horizontais e taxas de conversão
 * Baseado no protótipo Lovable
 */

import React from 'react';
import type { EtapaFunil } from '../types';
import { formatNumber, formatPercent } from '../utils/formatacao';
import { COLORS } from '../config/app.config';

interface FunilVisualProps {
  titulo: string;
  etapas: EtapaFunil[];
  cor: string;
  maxWidth?: number;
  vendas?: { ganhas: number; perdidas: number; recuperacao: number; franquias?: number };
  hideGanhas?: boolean;
}

export default function FunilVisual({ titulo, etapas, cor, vendas, hideGanhas = false }: FunilVisualProps) {
  if (!etapas || etapas.length === 0) return null;

  // Ocultar etapa POTENCIAIS do funil de tratamento
  const etapasVisiveis = etapas.filter(e => e.nome !== 'POTENCIAIS');

  const maxVal = Math.max(...etapasVisiveis.map(e => e.quantidade), 1);

  // Cores fixas por classificação (consistentes entre funis)
  const LABEL_COLORS: Record<string, string> = {
    'PROSPECT': '#6c757d',
    'LEADS': '#FF6600',
    'MQL': '#60a5fa',
    'SQL': '#a78bfa',
  };

  // Determinar label da etapa (PROSPECT/LEADS/MQL/SQL)
  const getLabel = (nome: string): string => {
    const n = nome.toUpperCase();
    if (n.includes('POTENCIAIS')) return 'PROSPECT';
    if (n.includes('NOVO') || n.includes('QUALIFICAÇÃO') || n.includes('DIAGNÓSTICO AGENDADO') || n.includes('DIAGNÓSTICO REALIZADO')) return 'LEADS';
    if (n.includes('MODELO NEGÓCIO')) return 'MQL';
    return 'SQL';
  };

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
        className="text-sm font-semibold uppercase tracking-wider pb-3 mb-4"
        style={{ color: cor, fontFamily: 'Poppins, sans-serif', borderBottom: '1px solid #495057' }}
      >
        {titulo}
      </h3>

      <div className="space-y-3">
        {etapasVisiveis.map((etapa, idx) => {
          const widthPct = maxVal > 0 ? (etapa.quantidade / maxVal) * 100 : 0;
          const label = getLabel(etapa.nome);

          return (
            <div key={etapa.nome} className="relative">
              {/* Nome da etapa e label */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium" style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif' }}>
                    {etapa.nome}
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${LABEL_COLORS[label] || cor}20`, color: LABEL_COLORS[label] || cor }}
                  >
                    {label}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: '#F8F9FA' }}>
                  {formatNumber(etapa.quantidade)}
                </span>
              </div>

              {/* Barra de progresso */}
              <div
                className="w-full rounded-full overflow-hidden"
                style={{ height: '20px', backgroundColor: '#495057' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(widthPct, 2)}%`,
                    background: `linear-gradient(90deg, ${cor}cc, ${cor})`,
                  }}
                />
              </div>

              {/* Taxa de conversão entre etapas */}
              {idx > 0 && etapa.taxaConversao > 0 && (
                <div className="flex justify-end mt-0.5">
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color: etapa.taxaConversao >= 60 ? '#28a745' : etapa.taxaConversao >= 40 ? '#ffc107' : '#dc3545',
                    }}
                  >
                    {formatPercent(etapa.taxaConversao)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vendas (resultados do funil) */}
      {vendas && (
        <div className="mt-4 pt-4 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid #495057' }}>
          {!hideGanhas && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#28a74520', color: '#28a745' }}>
              GANHAS
            </span>
            <span className="text-sm font-bold" style={{ color: '#28a745' }}>{vendas.ganhas}</span>
          </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#dc354520', color: '#dc3545' }}>
              PERDIDAS
            </span>
            <span className="text-sm font-bold" style={{ color: '#dc3545' }}>{vendas.perdidas}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#ffc10720', color: '#ffc107' }}>
              RECUPERAÇÃO
            </span>
            <span className="text-sm font-bold" style={{ color: '#ffc107' }}>{vendas.recuperacao}</span>
          </div>
          {vendas.franquias !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FF660020', color: '#FF6600' }}>
                FRANQUIAS
              </span>
              <span className="text-sm font-bold" style={{ color: '#FF6600' }}>{vendas.franquias}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
