/**
 * SecaoComparativaTurmas — Análise Comparativa no contexto Turmas (dados mockados)
 *
 * Mesma estrutura da SecaoComparativa, mas com métrica única: Turmas
 * Seções:
 * 1. Resumo do Período — 3 cards (Total Turmas, Presencial, EAD)
 * 2. Taxa de Crescimento Anual — barras YoY para cada métrica
 * 3. Detalhamento Anual — tabela comparativa
 * 4. Evolução Histórica — 3 mini gráficos de linha
 */

import React, { useState } from 'react';
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
import { ArrowUpRight, ArrowDownRight, Minus, Info, ChevronRight, ChevronDown } from 'lucide-react';
import { fmtNum, fmtCompacto, CORES } from '../utils/formatters';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler, ChartDataLabels,
);

// ═══════════════════════════════════════════
// MOCK DATA — Evolução de Turmas (2022–2024)
// ═══════════════════════════════════════════

interface EvolucaoTurmasMock {
  ano: number;
  total: number;
  presencial: number;
  ead: number;
  publica: number;
  privada: number;
  publicaPresencial: number;
  publicaEad: number;
  privadaPresencial: number;
  privadaEad: number;
}

const MOCK_EVOLUCAO: EvolucaoTurmasMock[] = [
  { ano: 2022, total: 724_800, presencial: 310_200, ead: 414_600, publica: 192_100, privada: 532_700, publicaPresencial: 134_500, publicaEad: 57_600, privadaPresencial: 175_700, privadaEad: 357_000 },
  { ano: 2023, total: 762_350, presencial: 308_900, ead: 453_450, publica: 194_800, privada: 567_550, publicaPresencial: 135_300, publicaEad: 59_500, privadaPresencial: 173_600, privadaEad: 393_950 },
  { ano: 2024, total: 799_680, presencial: 312_450, ead: 487_230, publica: 198_680, privada: 601_000, publicaPresencial: 137_200, publicaEad: 61_480, privadaPresencial: 175_250, privadaEad: 425_750 },
];

type MetricaTurma = 'total' | 'presencial' | 'ead';

const METRICAS_TURMAS: { key: MetricaTurma; label: string; cor: string }[] = [
  { key: 'total', label: 'Total Turmas', cor: CORES.laranja },
  { key: 'presencial', label: 'Presencial', cor: CORES.verde },
  { key: 'ead', label: 'EAD', cor: CORES.roxo },
];

// ─── Shared UI ───

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

interface SecaoComparativaTurmasProps {
  ano: number;
}

export default function SecaoComparativaTurmas({ ano }: SecaoComparativaTurmasProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const toggleExpandir = (key: string) => {
    setExpandido(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const evolucao = MOCK_EVOLUCAO;
  const ultimoAno = evolucao.find(e => e.ano === ano) || evolucao[evolucao.length - 1];
  const anos = evolucao.map(e => e.ano.toString());

  // ─── Growth rates YoY ───
  const growthData = evolucao.map((e, i) => {
    if (i === 0) return { ano: e.ano, total: 0, presencial: 0, ead: 0 };
    const prev = evolucao[i - 1];
    return {
      ano: e.ano,
      total: prev.total ? ((e.total - prev.total) / prev.total) * 100 : 0,
      presencial: prev.presencial ? ((e.presencial - prev.presencial) / prev.presencial) * 100 : 0,
      ead: prev.ead ? ((e.ead - prev.ead) / prev.ead) * 100 : 0,
    };
  }).filter((_, i) => i > 0);

  // ─── CAGR ───
  const calcCAGR = (key: MetricaTurma) => {
    if (evolucao.length < 2) return 0;
    const first = evolucao[0][key];
    const last = evolucao[evolucao.length - 1][key];
    if (!first || first <= 0) return 0;
    const years = evolucao.length - 1;
    return (Math.pow(last / first, 1 / years) - 1) * 100;
  };

  // ─── Mini line chart options ───
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

  return (
    <div style={{ minWidth: 0, overflow: 'hidden' }}>

      {/* ━━━ 1. Resumo do Período — 3 cards ━━━ */}
      <SectionLabel num="1" label="Resumo do Período" cor={CORES.laranja} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {METRICAS_TURMAS.map(m => {
          const first = evolucao[0]?.[m.key] || 0;
          const last = ultimoAno?.[m.key] || 0;
          const delta = first ? ((last - first) / first) * 100 : 0;
          const absDelta = last - first;
          const cagr = calcCAGR(m.key);
          return (
            <div key={m.key} style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 18,
              border: '1px solid #495057', position: 'relative', overflow: 'hidden',
              minWidth: 0,
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: m.cor }} />
              <p style={{
                color: m.cor, fontSize: '0.7rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 14px',
                fontFamily: "'Poppins', sans-serif",
              }}>
                {m.label}
              </p>
              {/* All years */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 14 }}>
                {evolucao.map((e, idx) => {
                  const isLast = idx === evolucao.length - 1;
                  const isFirst = idx === 0;
                  const prevVal = idx > 0 ? evolucao[idx - 1][m.key] : 0;
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
              <div style={{ height: 1, backgroundColor: '#3D4349', marginBottom: 12 }} />
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D3238' }}>
                  <th style={{
                    color: '#6C757D', fontWeight: 600, padding: '10px 14px',
                    textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase',
                    letterSpacing: '0.04em', borderBottom: '2px solid #495057',
                    position: 'sticky', left: 0, backgroundColor: '#2D3238', zIndex: 1,
                    minWidth: 180,
                  }}>Métrica</th>
                  {evolucao.map(e => (
                    <th key={e.ano} style={{
                      color: '#6C757D', fontWeight: 600, padding: '10px 10px',
                      textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase',
                      letterSpacing: '0.04em', borderBottom: '2px solid #495057',
                      minWidth: 90,
                    }}>{e.ano}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Total Turmas — expandable */}
                {(() => {
                  const isOpen = expandido.has('total');
                  const valores = evolucao.map(e => e.total);
                  const varCell = (vals: number[], idx: number) => {
                    if (idx === 0) return null;
                    return ((vals[idx] - vals[idx - 1]) / vals[idx - 1]) * 100;
                  };
                  const renderCell = (value: number, vr: number | null, cor: string, isSub = false) => (
                    <td key={value + '-' + cor} style={{
                      padding: '9px 10px', textAlign: 'right',
                      color: isSub ? '#ADB5BD' : cor,
                      fontWeight: isSub ? 400 : 600,
                      fontSize: isSub ? '0.72rem' : '0.76rem',
                      whiteSpace: 'nowrap',
                    }}>
                      <div>{fmtNum(value)}</div>
                      {vr !== null && (
                        <div style={{ fontSize: '0.6rem', color: vr >= 0 ? '#10B981' : '#EF4444', marginTop: 1 }}>
                          {vr >= 0 ? '▲' : '▼'} {Math.abs(vr).toFixed(1)}%
                        </div>
                      )}
                    </td>
                  );
                  return (
                    <React.Fragment>
                      <tr
                        onClick={() => toggleExpandir('total')}
                        style={{
                          borderBottom: isOpen ? 'none' : '1px solid #3D4349',
                          backgroundColor: isOpen ? 'rgba(255,102,0,0.04)' : 'transparent',
                          cursor: 'pointer', transition: 'background-color 0.15s',
                          borderLeft: `3px solid ${CORES.laranja}`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = isOpen ? 'rgba(255,102,0,0.06)' : 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = isOpen ? 'rgba(255,102,0,0.04)' : 'transparent'; }}
                      >
                        <td style={{
                          padding: '10px 14px', position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: isOpen ? '#363b42' : '#343A40',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span style={{ color: CORES.laranja, transition: 'transform 0.2s', display: 'flex' }}>
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: CORES.laranja, flexShrink: 0 }} />
                          <span style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.8rem' }}>Total Turmas</span>
                        </td>
                        {valores.map((v, i) => renderCell(v, varCell(valores, i), CORES.laranja))}
                      </tr>
                      {isOpen && (() => {
                        const pubOpen = expandido.has('publica');
                        const privOpen = expandido.has('privada');
                        return (
                          <>
                            {/* Pública — expandable */}
                            <tr
                              onClick={(ev) => { ev.stopPropagation(); toggleExpandir('publica'); }}
                              style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)', cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; }}
                            >
                              <td style={{
                                padding: '7px 14px 7px 36px',
                                position: 'sticky', left: 0, zIndex: 1,
                                backgroundColor: '#343A40',
                                color: CORES.azul, fontSize: '0.72rem', fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                <span style={{ color: CORES.azul, display: 'flex', transition: 'transform 0.2s' }}>
                                  {pubOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                ├ Pública
                              </td>
                              {evolucao.map((e, i) => {
                                const vals = evolucao.map(d => d.publica);
                                return renderCell(e.publica, varCell(vals, i), CORES.azul, true);
                              })}
                            </tr>
                            {pubOpen && (
                              <>
                                <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                  <td style={{
                                    padding: '5px 14px 5px 72px',
                                    position: 'sticky', left: 0, zIndex: 1,
                                    backgroundColor: '#343A40',
                                    color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                                  }}>
                                    ├ Presencial
                                  </td>
                                  {evolucao.map((e, i) => {
                                    const vals = evolucao.map(d => d.publicaPresencial);
                                    return renderCell(e.publicaPresencial, varCell(vals, i), CORES.verde, true);
                                  })}
                                </tr>
                                <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                  <td style={{
                                    padding: '5px 14px 5px 72px',
                                    position: 'sticky', left: 0, zIndex: 1,
                                    backgroundColor: '#343A40',
                                    color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                                  }}>
                                    └ EAD
                                  </td>
                                  {evolucao.map((e, i) => {
                                    const vals = evolucao.map(d => d.publicaEad);
                                    return renderCell(e.publicaEad, varCell(vals, i), CORES.roxo, true);
                                  })}
                                </tr>
                              </>
                            )}
                            {/* Privada — expandable */}
                            <tr
                              onClick={(ev) => { ev.stopPropagation(); toggleExpandir('privada'); }}
                              style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)', cursor: 'pointer' }}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; }}
                            >
                              <td style={{
                                padding: '7px 14px 7px 36px',
                                position: 'sticky', left: 0, zIndex: 1,
                                backgroundColor: '#343A40',
                                color: CORES.laranja, fontSize: '0.72rem', fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: 6,
                              }}>
                                <span style={{ color: CORES.laranja, display: 'flex', transition: 'transform 0.2s' }}>
                                  {privOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </span>
                                ├ Privada
                              </td>
                              {evolucao.map((e, i) => {
                                const vals = evolucao.map(d => d.privada);
                                return renderCell(e.privada, varCell(vals, i), CORES.laranja, true);
                              })}
                            </tr>
                            {privOpen && (
                              <>
                                <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                  <td style={{
                                    padding: '5px 14px 5px 72px',
                                    position: 'sticky', left: 0, zIndex: 1,
                                    backgroundColor: '#343A40',
                                    color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                                  }}>
                                    ├ Presencial
                                  </td>
                                  {evolucao.map((e, i) => {
                                    const vals = evolucao.map(d => d.privadaPresencial);
                                    return renderCell(e.privadaPresencial, varCell(vals, i), CORES.verde, true);
                                  })}
                                </tr>
                                <tr style={{ borderBottom: '1px solid #3D4349', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                  <td style={{
                                    padding: '5px 14px 5px 72px',
                                    position: 'sticky', left: 0, zIndex: 1,
                                    backgroundColor: '#343A40',
                                    color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                                  }}>
                                    └ EAD
                                  </td>
                                  {evolucao.map((e, i) => {
                                    const vals = evolucao.map(d => d.privadaEad);
                                    return renderCell(e.privadaEad, varCell(vals, i), CORES.roxo, true);
                                  })}
                                </tr>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </React.Fragment>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ━━━ 3. Evolução Histórica — 3 mini gráficos ━━━ */}
      <SectionLabel num="3" label="Evolução Histórica" cor={CORES.azul} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 24 }}>
        {METRICAS_TURMAS.map(m => {
          const current = ultimoAno?.[m.key] || 0;
          const prev = evolucao.length >= 2 ? evolucao[evolucao.length - 2]?.[m.key] || 0 : 0;
          const variation = prev ? ((current - prev) / prev) * 100 : 0;
          return (
            <div key={m.key} style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 16,
              border: '1px solid #495057', position: 'relative',
              minWidth: 0, overflow: 'hidden',
            }}>
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
              <div style={{ height: 180 }}>
                <Line
                  data={{
                    labels: anos,
                    datasets: [{
                      data: evolucao.map(e => e[m.key]),
                      borderColor: m.cor,
                      backgroundColor: `${m.cor}18`,
                      tension: 0.4,
                      fill: true,
                      borderWidth: 2,
                      pointBackgroundColor: m.cor,
                    }],
                  }}
                  options={miniLineOpts(m.cor, evolucao.map(e => e[m.key]))}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
