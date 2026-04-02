/**
 * SecaoComparativa — Análise Comparativa (Tendências e Tempo)
 *
 * Layout:
 * 1. Evolução Histórica — 3 mini-gráficos lado a lado (1 por métrica)
 * 2. Detalhamento Anual — tabela comparativa ano a ano
 * 3. Taxa de Crescimento — tabela com variação YoY e taxa de crescimento anual por métrica
 * 4. Visão Consolidada — gráfico compacto todas métricas + resumo numérico
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';
import type { DadosEvolucaoAnual, MetricaAtiva } from '../types';
import { fmtNum, fmtInteiro, fmtCompacto, CORES } from '../utils/formatters';
import TabelaComparativa from './TabelaComparativa';
import CardInsight from './CardInsight';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler, ChartDataLabels,
);

const METRICAS_OPTIONS: { key: MetricaAtiva; label: string; cor: string }[] = [
  { key: 'matriculas', label: 'Matriculados', cor: CORES.azul },
  { key: 'concluintes', label: 'Concluintes', cor: CORES.verde },
  { key: 'ingressantes', label: 'Ingressantes', cor: CORES.roxo },
];

const METRICA_COR: Record<MetricaAtiva, string> = {
  matriculas: CORES.azul,
  concluintes: CORES.verde,
  ingressantes: CORES.roxo,
};

const SectionLabel = ({ num, label, cor }: { num: string; label: string; cor: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
    <span style={{
      width: 26, height: 26, borderRadius: '50%',
      backgroundColor: `${cor}18`, border: `1.5px solid ${cor}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: cor, fontSize: '0.7rem', fontWeight: 700,
      fontFamily: "'Orbitron', monospace", flexShrink: 0,
    }}>
      {num}
    </span>
    <span style={{
      color: '#ADB5BD', fontSize: '0.72rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: "'Poppins', sans-serif",
    }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: '#495057' }} />
  </div>
);

interface SecaoComparativaProps {
  evolucaoAlunos: DadosEvolucaoAnual[];
  ano: number;
  loadingEvolucao?: boolean;
}

export default function SecaoComparativa({ evolucaoAlunos, ano, loadingEvolucao = false }: SecaoComparativaProps) {
  const ultimoAno = evolucaoAlunos.find(e => e.ano === ano) || evolucaoAlunos[evolucaoAlunos.length - 1];
  const anos = evolucaoAlunos.map(e => e.ano.toString());

  // ─── Growth rates YoY ───
  const growthData = evolucaoAlunos.map((e, i) => {
    if (i === 0) return { ano: e.ano, matriculas: 0, concluintes: 0, ingressantes: 0 };
    const prev = evolucaoAlunos[i - 1];
    return {
      ano: e.ano,
      matriculas: prev.matriculas ? ((e.matriculas - prev.matriculas) / prev.matriculas) * 100 : 0,
      concluintes: prev.concluintes ? ((e.concluintes - prev.concluintes) / prev.concluintes) * 100 : 0,
      ingressantes: prev.ingressantes ? ((e.ingressantes - prev.ingressantes) / prev.ingressantes) * 100 : 0,
    };
  }).filter((_, i) => i > 0);

  // ─── CAGR calculation ───
  const calcCAGR = (key: MetricaAtiva) => {
    if (evolucaoAlunos.length < 2) return 0;
    const first = evolucaoAlunos[0][key];
    const last = evolucaoAlunos[evolucaoAlunos.length - 1][key];
    if (!first || first <= 0) return 0;
    const years = evolucaoAlunos.length - 1;
    return (Math.pow(last / first, 1 / years) - 1) * 100;
  };

  // ─── Mini line chart options (shared, no labels) ───
  const miniLineOpts = (cor: string, dataValues: number[]): any => {
    const minVal = Math.min(...dataValues);
    const maxVal = Math.max(...dataValues);
    const range = maxVal - minVal || 1;
    const padding = range * 0.15;
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 22 } },
      plugins: {
        legend: { display: false },
        datalabels: {
          color: '#F8F9FA',
          font: { size: 9, weight: 'bold' as const },
          anchor: 'end' as const,
          align: 'top' as const,
          offset: 4,
          formatter: (v: number) => fmtCompacto(v),
          clamp: true,
          clip: false,
        },
        tooltip: {
          backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1,
          titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
          callbacks: { label: (ctx: any) => fmtNum(ctx.raw) },
        },
      },
      scales: {
        x: { ticks: { color: '#6C757D', font: { size: 9 } }, grid: { display: false } },
        y: {
          min: Math.floor(minVal - padding),
          max: Math.ceil(maxVal + padding),
          ticks: { color: '#6C757D', font: { size: 9 }, callback: (v: any) => fmtCompacto(v) },
          grid: { color: '#3D434920' },
        },
      },
      elements: { point: { radius: 4, hoverRadius: 6 } },
    };
  };

  // ─── Trend icon helper ───
  const TrendBadge = ({ value }: { value: number }) => {
    const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
    const color = value > 0 ? CORES.verde : value < 0 ? '#EF4444' : CORES.cinza;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color, fontSize: '0.72rem', fontWeight: 700 }}>
        <Icon size={13} />
        {value >= 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    );
  };

  // Loading overlay
  const LoadingOverlay = () => loadingEvolucao ? (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundColor: 'rgba(33,37,41,0.75)', borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <div style={{
        width: 18, height: 18,
        border: '2.5px solid #FF6600', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Carregando...</span>
    </div>
  ) : null;

  return (
    <div style={{ minWidth: 0, overflow: 'hidden' }}>
      {/* ━━━ 1. Resumo do Período — 3 cards ━━━ */}
      <SectionLabel num="1" label="Resumo do Período" cor={CORES.laranja} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {METRICAS_OPTIONS.map(m => {
          const first = evolucaoAlunos[0]?.[m.key] || 0;
          const last = ultimoAno?.[m.key] || 0;
          const delta = first ? ((last - first) / first) * 100 : 0;
          const absDelta = last - first;
          const cagr = calcCAGR(m.key);
          const firstYear = evolucaoAlunos[0]?.ano || '—';
          const lastYear = ultimoAno?.ano || '—';
          return (
            <div key={m.key} style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 18,
              border: '1px solid #495057', position: 'relative', overflow: 'hidden',
              minWidth: 0,
            }}>
              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: m.cor }} />
              {/* Metric label */}
              <p style={{
                color: m.cor, fontSize: '0.7rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 14px',
                fontFamily: "'Poppins', sans-serif",
              }}>
                {m.label}
              </p>
              {/* All years */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 14 }}>
                {evolucaoAlunos.map((e, idx) => {
                  const isLast = idx === evolucaoAlunos.length - 1;
                  const isFirst = idx === 0;
                  const prevVal = idx > 0 ? evolucaoAlunos[idx - 1][m.key] : 0;
                  const yoy = idx > 0 && prevVal ? ((e[m.key] - prevVal) / prevVal) * 100 : null;
                  return (
                    <React.Fragment key={e.ano}>
                      <div style={{ flex: 1, textAlign: isFirst ? 'left' : isLast ? 'right' : 'center' }}>
                        <p style={{ color: '#6C757D', fontSize: '0.58rem', margin: '0 0 2px', textTransform: 'uppercase' }}>{e.ano}</p>
                        <span style={{
                          color: isLast ? '#F8F9FA' : '#ADB5BD',
                          fontSize: '0.95rem',
                          fontWeight: isLast ? 700 : 500,
                          fontFamily: "'Orbitron', monospace",
                        }}>
                          {fmtNum(e[m.key])}
                        </span>
                        {yoy !== null ? (
                          <p style={{ color: yoy >= 0 ? CORES.verde : '#EF4444', fontSize: '0.72rem', margin: '4px 0 0', fontWeight: 700 }}>
                            {yoy >= 0 ? '+' : ''}{yoy.toFixed(1)}%
                          </p>
                        ) : (
                          <p style={{ fontSize: '0.72rem', margin: '4px 0 0', visibility: 'hidden' as const }}>&nbsp;</p>
                        )}
                      </div>
                      {!isLast && <span style={{ color: '#3D4349', fontSize: '0.7rem', flexShrink: 0, marginBottom: 10 }}>→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              {/* Divider */}
              <div style={{ height: 1, backgroundColor: '#3D4349', marginBottom: 12 }} />
              {/* Delta + taxa de crescimento anual */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: '#6C757D', fontSize: '0.58rem', margin: '0 0 2px', textTransform: 'uppercase' }}>Variação Total</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendBadge value={delta} />
                    <span style={{ color: '#6C757D', fontSize: '0.62rem' }}>({absDelta >= 0 ? '+' : ''}{fmtNum(absDelta)})</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#6C757D', fontSize: '0.5rem', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Taxa de crescimento anual</p>
                  <span style={{
                    color: m.cor, fontSize: '0.82rem', fontWeight: 700,
                    fontFamily: "'Orbitron', sans-serif",
                  }}>
                    {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ━━━ 2. Detalhamento Anual ━━━ */}
      <SectionLabel num="2" label="Detalhamento Anual" cor={CORES.roxo} />
      <div style={{ marginBottom: 24, position: 'relative' }}>
          <TabelaComparativa dados={evolucaoAlunos} metricasAtivas={['matriculas', 'concluintes', 'ingressantes']} ano={ano} />
          {loadingEvolucao && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: 'rgba(33,37,41,0.75)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{
                width: 16, height: 16,
                border: '2px solid #FF6600', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Completando dados históricos...</span>
            </div>
          )}
      </div>

      {/* ━━━ 3. Evolução Histórica — 3 mini gráficos lado a lado ━━━ */}
      <SectionLabel num="3" label="Evolução Histórica" cor={CORES.azul} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {METRICAS_OPTIONS.map(m => {
          const current = ultimoAno?.[m.key] || 0;
          const prev = evolucaoAlunos.length >= 2 ? evolucaoAlunos[evolucaoAlunos.length - 2]?.[m.key] || 0 : 0;
          const variation = prev ? ((current - prev) / prev) * 100 : 0;
          return (
            <div key={m.key} style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 16,
              border: '1px solid #495057', position: 'relative',
              minWidth: 0, overflow: 'hidden',
            }}>
              {/* Header: label + trend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <p style={{
                  color: m.cor, fontSize: '0.68rem', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0,
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  {m.label}
                </p>
                <TrendBadge value={variation} />
              </div>
              {/* Mini chart */}
              <div style={{ height: 180, position: 'relative' }}>
                <Line
                  data={{
                    labels: anos,
                    datasets: [{
                      data: evolucaoAlunos.map(e => e[m.key]),
                      borderColor: m.cor,
                      backgroundColor: `${m.cor}18`,
                      tension: 0.4,
                      fill: true,
                      borderWidth: 2,
                      pointBackgroundColor: m.cor,
                    }],
                  }}
                  options={miniLineOpts(m.cor, evolucaoAlunos.map(e => e[m.key]))}
                />
                <LoadingOverlay />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
