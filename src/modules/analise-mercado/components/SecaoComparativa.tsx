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
import { fmtNum, fmtInteiro, CORES } from '../utils/formatters';
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
  const miniLineOpts = (cor: string): any => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1,
        titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
        callbacks: { label: (ctx: any) => fmtNum(ctx.raw) },
      },
    },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 9 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D434920' } },
    },
    elements: { point: { radius: 3, hoverRadius: 5 } },
  });

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                {evolucaoAlunos.map((e, idx) => {
                  const isLast = idx === evolucaoAlunos.length - 1;
                  const isFirst = idx === 0;
                  return (
                    <React.Fragment key={e.ano}>
                      <div style={{ flex: 1, textAlign: isFirst ? 'left' : isLast ? 'right' : 'center' }}>
                        <p style={{ color: '#6C757D', fontSize: '0.58rem', margin: '0 0 2px', textTransform: 'uppercase' }}>{e.ano}</p>
                        <span style={{
                          color: isLast ? '#F8F9FA' : '#ADB5BD',
                          fontSize: isLast ? '0.95rem' : '0.82rem',
                          fontWeight: isLast ? 700 : 500,
                          fontFamily: "'Orbitron', monospace",
                        }}>
                          {fmtNum(e[m.key])}
                        </span>
                      </div>
                      {!isLast && <span style={{ color: '#3D4349', fontSize: '0.7rem', flexShrink: 0 }}>→</span>}
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

      {/* ━━━ 2. Taxa de Crescimento — 1 card por métrica ━━━ */}
      <SectionLabel num="2" label="Taxa de Crescimento Anual" cor={CORES.verde} />
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        backgroundColor: '#2D323820', border: '1px solid #495057',
        borderRadius: 8, padding: '10px 14px', marginBottom: 14,
      }}>
        <Info size={14} color={CORES.verde} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ color: '#ADB5BD', fontSize: '0.7rem', margin: 0, lineHeight: 1.5 }}>
          A <strong style={{ color: '#F8F9FA' }}>taxa de crescimento</strong> mostra a variação percentual ano a ano (YoY) de cada métrica.
          A <strong style={{ color: '#F8F9FA' }}>taxa de crescimento anual</strong> representa o crescimento médio anual ao longo de todo o período,
          indicando a tendência geral independente de oscilações pontuais.
          <span style={{ color: CORES.verde }}> Barras verdes</span> indicam crescimento e
          <span style={{ color: '#EF4444' }}> barras vermelhas</span> indicam queda.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {METRICAS_OPTIONS.map(m => {
          const cagr = calcCAGR(m.key);
          const metricGrowth = growthData.map(g => g[m.key]);
          const lastGrowth = metricGrowth[metricGrowth.length - 1] || 0;
          const maxAbs = Math.max(...metricGrowth.map(v => Math.abs(v)), 1);
          return (
            <div key={m.key} style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 16,
              border: '1px solid #495057', minWidth: 0, overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{
                    color: m.cor, fontSize: '0.68rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0,
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {m.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                    <span style={{
                      color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 700,
                      fontFamily: "'Orbitron', sans-serif",
                    }}>
                      Taxa de crescimento anual {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
                    </span>
                    <span style={{ color: '#6C757D', fontSize: '0.52rem' }}>a.a.</span>
                  </div>
                </div>
                <TrendBadge value={lastGrowth} />
              </div>
              {/* Yearly bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {growthData.map(row => {
                  const val = row[m.key];
                  const isActive = row.ano === ano;
                  const barColor = val > 0 ? CORES.verde : val < 0 ? '#EF4444' : '#6C757D';
                  const barWidth = maxAbs ? (Math.abs(val) / maxAbs) * 100 : 0;
                  return (
                    <div key={row.ano} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        color: isActive ? '#FF6600' : '#6C757D',
                        fontSize: '0.65rem', fontWeight: isActive ? 700 : 500,
                        fontFamily: "'Orbitron', monospace",
                        width: 32, flexShrink: 0,
                      }}>
                        {row.ano}
                      </span>
                      <div style={{
                        flex: 1, height: 14, backgroundColor: '#2D3238',
                        borderRadius: 3, overflow: 'hidden', position: 'relative',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min(barWidth, 100)}%`,
                          backgroundColor: barColor,
                          opacity: isActive ? 1 : 0.7,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{
                        color: barColor, fontSize: '0.68rem', fontWeight: 600,
                        width: 48, textAlign: 'right', flexShrink: 0,
                      }}>
                        {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ━━━ 3. Detalhamento Anual ━━━ */}
      <SectionLabel num="3" label="Detalhamento Anual" cor={CORES.roxo} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Tabela Comparativa — Evolução Anual"
          cor={CORES.roxo}
          icone={<Calendar size={16} />}
          iniciaExpandido
          expandido
          semToggle
          resumo={METRICAS_OPTIONS.map(m => ({
            label: m.label,
            valor: fmtNum(ultimoAno?.[m.key] || 0),
            cor: METRICA_COR[m.key],
          }))}
        >
          <div style={{ marginTop: 14, position: 'relative' }}>
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
        </CardInsight>
      </div>

      {/* ━━━ 4. Evolução Histórica — 3 mini gráficos lado a lado ━━━ */}
      <SectionLabel num="4" label="Evolução Histórica" cor={CORES.azul} />
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
              {/* Header: label + current value */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{
                    color: m.cor, fontSize: '0.68rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0,
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    {m.label}
                  </p>
                  <span style={{
                    color: '#F8F9FA', fontSize: '1.15rem', fontWeight: 700,
                    fontFamily: "'Orbitron', sans-serif",
                  }}>
                    {fmtNum(current)}
                  </span>
                </div>
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
                  options={miniLineOpts(m.cor)}
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
