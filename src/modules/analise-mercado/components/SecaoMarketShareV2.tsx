/**
 * SecaoMarketShareV2 — Clientes & Market Share (3 Blocos)
 *
 * Layout inspirado na Análise Comparativa:
 * Bloco 1: Matriculados — carteira ativa de alunos
 * Bloco 2: Turmas — mesma estrutura (sem dados por enquanto)
 * Bloco 3: Target — somente Medicina
 */

import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Users,
  Briefcase,
  Target,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  Stethoscope,
  Building2,
  Award,
} from 'lucide-react';
import type {
  DadosMarketShareV2,
  BlocoMatriculados,
  BlocoTurmas,
  BlocoTarget,
} from '../types';
import { fmtNum, fmtPct, CORES } from '../utils/formatters';
import CardInsight from './CardInsight';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend, ChartDataLabels,
);

// ─── Shared UI Atoms ────────────────────────

const SectionLabel = ({ num, label, cor, icone }: { num: string; label: string; cor: string; icone?: React.ReactNode }) => (
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
    {icone && <span style={{ color: cor, display: 'flex', flexShrink: 0 }}>{icone}</span>}
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

/** KPI Card — same visual pattern as comparativa */
const KpiCard = ({
  titulo, valor, valorStr, cor, subtitulo, icone,
}: {
  titulo: string;
  valor?: number | null;
  valorStr?: string;
  cor: string;
  subtitulo?: string;
  icone?: React.ReactNode;
}) => (
  <div
    style={{
      backgroundColor: '#343A40', borderRadius: 12, padding: 20,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: cor }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      {icone && <span style={{ color: cor }}>{icone}</span>}
      <p style={{
        color: '#ADB5BD', fontSize: '0.72rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
        fontFamily: "'Poppins', sans-serif",
      }}>
        {titulo}
      </p>
    </div>
    <div style={{
      color: cor, fontSize: '2.1rem', fontWeight: 700,
      fontFamily: "'Orbitron', sans-serif", lineHeight: 1.1,
    }}>
      {valorStr ?? (valor != null ? fmtNum(valor) : '—')}
    </div>
    {subtitulo && (
      <p style={{ color: '#ADB5BD', fontSize: '0.82rem', margin: '8px 0 0' }}>{subtitulo}</p>
    )}
  </div>
);

/** Placeholder for blocks without data */
const SemDadosPlaceholder = ({ mensagem }: { mensagem: string }) => (
  <div style={{
    backgroundColor: '#343A40', borderRadius: 12, padding: '40px 24px',
    border: '1px dashed #495057', textAlign: 'center',
  }}>
    <AlertCircle size={32} color="#6C757D" style={{ marginBottom: 12 }} />
    <p style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
      {mensagem}
    </p>
    <p style={{ color: '#495057', fontSize: '0.72rem', margin: '8px 0 0' }}>
      As análises serão habilitadas quando os dados estiverem disponíveis.
    </p>
  </div>
);

// ─── Chart Defaults ─────────────────────────

const CHART_TOOLTIP = {
  backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1,
  titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 12,
};

// ─── Tab definitions ────────────────────────

type TabId = 'alunos' | 'turmas' | 'target';

const TABS_ALUNOS: { id: TabId; label: string; icone: React.ReactNode; cor: string }[] = [
  { id: 'alunos', label: 'Alunos Carteira x Mercado', icone: <Users size={14} />, cor: CORES.azul },
  { id: 'target', label: 'Target Medicina', icone: <Target size={14} />, cor: CORES.verde },
];

const TABS_TURMAS: { id: TabId; label: string; icone: React.ReactNode; cor: string }[] = [
  { id: 'turmas', label: 'Fundos Carteira x Mercado', icone: <GraduationCap size={14} />, cor: CORES.roxo },
  { id: 'target', label: 'Target Medicina', icone: <Target size={14} />, cor: CORES.verde },
];

// ─── Component ──────────────────────────────

interface SecaoMarketShareV2Props {
  dados: DadosMarketShareV2;
  modo: 'alunos' | 'turmas';
}

export default function SecaoMarketShareV2({ dados, modo }: SecaoMarketShareV2Props) {
  const { matriculados, turmas, target } = dados;
  const TABS = modo === 'alunos' ? TABS_ALUNOS : TABS_TURMAS;
  const defaultTab: TabId = modo === 'alunos' ? 'alunos' : 'turmas';
  const [abaAtiva, setAbaAtiva] = useState<TabId>(defaultTab);
  const tv = target[modo];

  // ━━━ BLOCO 1 — MATRICULADOS ━━━━━━━━━━━━━━━

  const compAnualLabels = matriculados.comparativoAnual.map(c => String(c.ano));
  const compAnualData = {
    labels: compAnualLabels,
    datasets: [
      {
        label: 'Carteira Viva',
        data: matriculados.comparativoAnual.map(c => c.matriculados),
        backgroundColor: CORES.laranja,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Mercado Total (INEP)',
        data: matriculados.comparativoAnual.map(c => c.mercadoTotal),
        backgroundColor: `${CORES.azul}80`,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };
  const compAnualOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: { color: '#ADB5BD', padding: 14, font: { size: 11, family: "'Poppins', sans-serif" }, usePointStyle: true, pointStyleWidth: 12 },
      },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'top', offset: 2,
        formatter: (v: number) => fmtNum(v),
      },
      tooltip: { ...CHART_TOOLTIP, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6C757D', font: { size: 12, family: "'Poppins', sans-serif" } } },
      y: {
        beginAtZero: true,
        grid: { color: '#49505730' },
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: number) => fmtNum(v) },
      },
    },
  };

  const rankingSorted = [...matriculados.rankingFranquias].sort((a, b) => b.marketShare - a.marketShare);
  const rankingData = {
    labels: rankingSorted.map(r => r.franquia),
    datasets: [{
      label: 'Market Share %',
      data: rankingSorted.map(r => r.marketShare),
      backgroundColor: `${CORES.azul}CC`,
      borderRadius: 4,
      barPercentage: 0.7,
    }],
  };
  const rankingOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'right', offset: 4,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      tooltip: { ...CHART_TOOLTIP, callbacks: { label: (ctx: any) => `Market Share: ${ctx.raw.toFixed(1)}%` } },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#49505730' },
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: number) => `${v}%` },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#ADB5BD', font: { size: 11, family: "'Poppins', sans-serif" } },
      },
    },
  };

  // ━━━ BLOCO 2 — TURMAS ━━━━━━━━━━━━━━━━━━━━━

  const turmasCompLabels = turmas.comparativoAnual.map(c => String(c.ano));
  const turmasCompData = {
    labels: turmasCompLabels,
    datasets: [
      {
        label: 'Carteira Viva',
        data: turmas.comparativoAnual.map(c => c.matriculados),
        backgroundColor: CORES.laranja,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Mercado Total (INEP)',
        data: turmas.comparativoAnual.map(c => c.mercadoTotal),
        backgroundColor: `${CORES.azul}80`,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };
  const turmasCompOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: { color: '#ADB5BD', padding: 14, font: { size: 11, family: "'Poppins', sans-serif" }, usePointStyle: true, pointStyleWidth: 12 },
      },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'top', offset: 2,
        formatter: (v: number) => fmtNum(v),
      },
      tooltip: { ...CHART_TOOLTIP, callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6C757D', font: { size: 12, family: "'Poppins', sans-serif" } } },
      y: {
        beginAtZero: true,
        grid: { color: '#49505730' },
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: number) => fmtNum(v) },
      },
    },
  };

  const turmasRankingSorted = [...turmas.rankingFranquias].sort((a, b) => b.marketShare - a.marketShare);
  const turmasRankingData = {
    labels: turmasRankingSorted.map(r => r.franquia),
    datasets: [{
      label: 'Market Share %',
      data: turmasRankingSorted.map(r => r.marketShare),
      backgroundColor: `${CORES.azul}CC`,
      borderRadius: 4,
      barPercentage: 0.7,
    }],
  };
  const turmasRankingOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'right', offset: 4,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
      tooltip: { ...CHART_TOOLTIP, callbacks: { label: (ctx: any) => `Market Share: ${ctx.raw.toFixed(1)}%` } },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#49505730' },
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: number) => `${v}%` },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#ADB5BD', font: { size: 11, family: "'Poppins', sans-serif" } },
      },
    },
  };

  // ━━━ BLOCO 3 — TARGET ━━━━━━━━━━━━━━━━━━━━━

  const targetRankingSorted = [...tv.rankingFranquias].sort((a, b) => b.alunosTarget - a.alunosTarget);
  const targetLabel = modo === 'turmas' ? 'Turmas Target' : 'Alunos Target';
  const targetRankingData = {
    labels: targetRankingSorted.map(r => r.franquia),
    datasets: [{
      label: targetLabel,
      data: targetRankingSorted.map(r => r.alunosTarget),
      backgroundColor: targetRankingSorted.map((_, i) =>
        i === 0 ? CORES.verde : `${CORES.verde}${i < 3 ? 'AA' : '60'}`
      ),
      borderRadius: 4,
      barPercentage: 0.7,
    }],
  };
  const targetRankingOptions: any = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'right', offset: 4,
        formatter: (v: number) => fmtNum(v),
      },
      tooltip: { ...CHART_TOOLTIP, callbacks: { label: (ctx: any) => `${targetLabel}: ${fmtNum(ctx.raw)}` } },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: '#49505730' },
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: number) => fmtNum(v) },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#ADB5BD', font: { size: 11, family: "'Poppins', sans-serif" } },
      },
    },
  };

  return (
    <div style={{ minWidth: 0, overflow: 'hidden' }}>

      {/* ━━━ TAB NAVIGATION ━━━━━━━━━━━━━━━━━━━━ */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 24,
        backgroundColor: '#2D3238', borderRadius: 12,
        padding: 6, border: '1px solid #495057',
      }}>
        {TABS.map(tab => {
          const isActive = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id)}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 24px',
                backgroundColor: isActive ? `${tab.cor}20` : 'transparent',
                border: isActive ? `1.5px solid ${tab.cor}` : '1.5px solid transparent',
                borderRadius: 8,
                color: isActive ? '#F8F9FA' : '#6C757D',
                fontSize: '0.82rem', fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase', letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isActive ? `0 0 16px ${tab.cor}30, inset 0 1px 0 ${tab.cor}30` : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#ADB5BD';
                  e.currentTarget.style.backgroundColor = `${tab.cor}10`;
                  e.currentTarget.style.borderColor = `${tab.cor}40`;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color = '#6C757D';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              {/* Icon circle */}
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: isActive ? tab.cor : `${tab.cor}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isActive ? '#fff' : tab.cor,
                flexShrink: 0,
                transition: 'all 0.25s ease',
              }}>
                {tab.icone}
              </span>
              {tab.label}
              {/* Active dot indicator */}
              {isActive && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: tab.cor,
                  boxShadow: `0 0 8px ${tab.cor}`,
                  flexShrink: 0, marginLeft: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ━━━ ABA: ALUNOS — CARTEIRA VIVA ━━━━━━━ */}
      {abaAtiva === 'alunos' && (
        <>
          <SectionLabel num="1" label="Matriculados — Carteira Ativa" cor={CORES.azul} icone={<Users size={14} />} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            <KpiCard
              titulo="TOTAL MATRICULADOS (INEP)"
              valor={matriculados.totalMatriculados}
              cor={CORES.azul}
              subtitulo="alunos no mercado"
              icone={<GraduationCap size={15} />}
            />
            <KpiCard
              titulo="CARTEIRA VIVA (MUNDO VIVA)"
              valor={matriculados.totalCarteiraAtiva}
              cor={CORES.laranja}
              subtitulo="alunos da nossa carteira"
              icone={<Briefcase size={15} />}
            />
            <KpiCard
              titulo="MARKET SHARE"
              valorStr={fmtPct(matriculados.participacao)}
              cor={CORES.roxo}
              subtitulo="participação no mercado"
              icone={<TrendingUp size={15} />}
            />
          </div>

          <CardInsight
              titulo="Ranking Franquias — Market Share"
              cor={CORES.laranja}
              icone={<Award size={16} />}
              iniciaExpandido
              resumo={[
                { label: '1º', valor: `${rankingSorted[0]?.franquia} (${rankingSorted[0]?.marketShare.toFixed(1)}%)`, cor: CORES.laranja },
              ]}
            >
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: "'Poppins', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #495057' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Franquia</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Mercado Total</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Carteira Viva</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Market Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingSorted.map((r, i) => {
                      const mercadoTotal = Math.round(r.matriculados / (r.marketShare / 100));
                      return (
                        <tr key={r.franquia} style={{ borderBottom: '1px solid #343A40', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '6px 8px', color: '#6C757D' }}>{i + 1}</td>
                          <td style={{ padding: '6px 8px', color: '#F8F9FA', fontWeight: 500 }}>{r.franquia}</td>
                          <td style={{ padding: '6px 8px', color: '#ADB5BD', textAlign: 'right' }}>{fmtNum(mercadoTotal)}</td>
                          <td style={{ padding: '6px 8px', color: CORES.laranja, textAlign: 'right', fontWeight: 600 }}>{fmtNum(r.matriculados)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <span style={{ backgroundColor: `${CORES.azul}25`, color: CORES.azul, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem' }}>
                              {r.marketShare.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardInsight>

          {/* Placeholders for upcoming analyses */}
          <SectionLabel num="2" label="Comparativo por Curso" cor={CORES.laranja} icone={<GraduationCap size={14} />} />
          <div style={{
            backgroundColor: '#343A40', borderRadius: 12, padding: '40px 24px',
            border: '1px dashed #495057', textAlign: 'center', marginBottom: 20,
          }}>
            <GraduationCap size={32} color="#6C757D" style={{ marginBottom: 12 }} />
            <p style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
              Comparativo por Curso — Em desenvolvimento
            </p>
            <p style={{ color: '#495057', fontSize: '0.72rem', margin: '8px 0 0' }}>
              Análise de carteira vs mercado por curso. Será habilitada quando a base estiver estruturada.
            </p>
          </div>

          <SectionLabel num="3" label="Comparativo por Instituição" cor={CORES.roxo} icone={<Building2 size={14} />} />
          <div style={{
            backgroundColor: '#343A40', borderRadius: 12, padding: '40px 24px',
            border: '1px dashed #495057', textAlign: 'center',
          }}>
            <Building2 size={32} color="#6C757D" style={{ marginBottom: 12 }} />
            <p style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
              Comparativo por Instituição — Em desenvolvimento
            </p>
            <p style={{ color: '#495057', fontSize: '0.72rem', margin: '8px 0 0' }}>
              Análise de carteira vs mercado por instituição. Será habilitada quando a base estiver estruturada.
            </p>
          </div>
        </>
      )}

      {/* ━━━ ABA: TURMAS — FUNDOS CARTEIRA ━━━━━ */}
      {abaAtiva === 'turmas' && (
        <>
          <SectionLabel num="1" label="Fundos — Carteira Ativa" cor={CORES.roxo} icone={<GraduationCap size={14} />} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14, marginBottom: 20,
          }}>
            <KpiCard
              titulo="TOTAL DE TURMAS (INEP)"
              valor={turmas.totalTurmas}
              cor={CORES.azul}
              subtitulo="turmas no mercado"
              icone={<GraduationCap size={15} />}
            />
            <KpiCard
              titulo="TURMAS CARTEIRA (MUNDO VIVA)"
              valor={turmas.totalTurmasCarteira}
              cor={CORES.laranja}
              subtitulo="turmas da nossa carteira"
              icone={<Briefcase size={15} />}
            />
            <KpiCard
              titulo="MARKET SHARE"
              valorStr={turmas.participacao != null ? fmtPct(turmas.participacao) : '—'}
              cor={CORES.roxo}
              subtitulo="participação no mercado"
              icone={<TrendingUp size={15} />}
            />
          </div>

          <CardInsight
              titulo="Ranking Franquias — Market Share (Turmas)"
              cor={CORES.laranja}
              icone={<Award size={16} />}
              iniciaExpandido
              resumo={[
                { label: '1º', valor: `${turmasRankingSorted[0]?.franquia} (${turmasRankingSorted[0]?.marketShare.toFixed(1)}%)`, cor: CORES.laranja },
              ]}
            >
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: "'Poppins', sans-serif" }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #495057' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Franquia</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Mercado Total</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Carteira Viva</th>
                      <th style={{ textAlign: 'right', padding: '6px 8px', color: '#6C757D', fontWeight: 600 }}>Market Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turmasRankingSorted.map((r, i) => {
                      const mercadoTotal = Math.round(r.matriculados / (r.marketShare / 100));
                      return (
                        <tr key={r.franquia} style={{ borderBottom: '1px solid #343A40', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '6px 8px', color: '#6C757D' }}>{i + 1}</td>
                          <td style={{ padding: '6px 8px', color: '#F8F9FA', fontWeight: 500 }}>{r.franquia}</td>
                          <td style={{ padding: '6px 8px', color: '#ADB5BD', textAlign: 'right' }}>{fmtNum(mercadoTotal)}</td>
                          <td style={{ padding: '6px 8px', color: CORES.roxo, textAlign: 'right', fontWeight: 600 }}>{fmtNum(r.matriculados)}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                            <span style={{ backgroundColor: `${CORES.azul}25`, color: CORES.azul, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem' }}>
                              {r.marketShare.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardInsight>

          {/* Placeholders for upcoming analyses */}
          <SectionLabel num="2" label="Comparativo por Curso" cor={CORES.laranja} icone={<GraduationCap size={14} />} />
          <div style={{
            backgroundColor: '#343A40', borderRadius: 12, padding: '40px 24px',
            border: '1px dashed #495057', textAlign: 'center', marginBottom: 20,
          }}>
            <GraduationCap size={32} color="#6C757D" style={{ marginBottom: 12 }} />
            <p style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
              Comparativo por Curso — Em desenvolvimento
            </p>
            <p style={{ color: '#495057', fontSize: '0.72rem', margin: '8px 0 0' }}>
              Análise de carteira vs mercado por curso. Será habilitada quando a base estiver estruturada.
            </p>
          </div>

          <SectionLabel num="3" label="Comparativo por Instituição" cor={CORES.azul} icone={<Building2 size={14} />} />
          <div style={{
            backgroundColor: '#343A40', borderRadius: 12, padding: '40px 24px',
            border: '1px dashed #495057', textAlign: 'center',
          }}>
            <Building2 size={32} color="#6C757D" style={{ marginBottom: 12 }} />
            <p style={{ color: '#6C757D', fontSize: '0.85rem', fontWeight: 500, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
              Comparativo por Instituição — Em desenvolvimento
            </p>
            <p style={{ color: '#495057', fontSize: '0.72rem', margin: '8px 0 0' }}>
              Análise de carteira vs mercado por instituição. Será habilitada quando a base estiver estruturada.
            </p>
          </div>
        </>
      )}

      {/* ━━━ ABA: TARGET (Medicina) ━━━━━━━━━━━━ */}
      {abaAtiva === 'target' && (
        <>
          <SectionLabel num="1" label={`Target — ${target.curso}`} cor={CORES.verde} icone={<Stethoscope size={14} />} />

          {/* Info banner */}
          <div style={{
            backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 6, padding: '8px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Target size={14} color={CORES.verde} />
            <p style={{ color: '#10B981', fontSize: '0.75rem', margin: 0, flex: 1 }}>
              <strong>Medicina</strong> — Análise target no curso de Medicina ({modo === 'turmas' ? 'Turmas' : 'Alunos'}). Curso prioritário para mapeamento.
            </p>
          </div>

          {/* Conteúdo da visão ativa */}
          {tv.semDados ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 14, marginBottom: 16, opacity: 0.4, pointerEvents: 'none',
              }}>
                <KpiCard titulo={`TOTAL DE ${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} (INEP)`} valorStr="—" cor={CORES.azul} icone={<Users size={15} />} />
                <KpiCard titulo={`${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} TARGET (PIPEFY)`} valorStr="—" cor={CORES.verde} icone={<Target size={15} />} />
                <KpiCard titulo={`${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} VIVA (MUNDO VIVA)`} valorStr="—" cor={CORES.laranja} icone={<Stethoscope size={15} />} />
              </div>
              <SemDadosPlaceholder mensagem={`Análise de ${modo === 'turmas' ? 'Turmas' : 'Alunos'} Target — Dados não disponíveis`} />
            </>
          ) : (
            <>
              {/* KPI Cards — 3 cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 14, marginBottom: 20,
              }}>
                <KpiCard
                  titulo={`TOTAL DE ${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} (INEP)`}
                  valor={tv.totalMercado}
                  cor={CORES.azul}
                  subtitulo={`${modo === 'turmas' ? 'turmas' : 'matriculados'} em medicina`}
                  icone={<Users size={15} />}
                />
                <KpiCard
                  titulo={`${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} TARGET (PIPEFY)`}
                  valor={tv.totalTarget}
                  cor={CORES.verde}
                  subtitulo={tv.totalMercado ? `${((tv.totalTarget / tv.totalMercado) * 100).toFixed(1)}% do total INEP` : `${modo === 'turmas' ? 'turmas' : 'alunos'} do perfil target`}
                  icone={<Target size={15} />}
                />
                <KpiCard
                  titulo={`${modo === 'turmas' ? 'TURMAS' : 'ALUNOS'} VIVA (MUNDO VIVA)`}
                  valor={tv.totalViva || null}
                  valorStr={tv.totalViva ? fmtNum(tv.totalViva) : '—'}
                  cor={CORES.laranja}
                  subtitulo={(() => {
                    const parts: string[] = [];
                    if (tv.participacaoDoTotal) parts.push(`${fmtPct(tv.participacaoDoTotal)} do INEP`);
                    if (tv.participacaoDoTarget) parts.push(`${fmtPct(tv.participacaoDoTarget)} do Target`);
                    return parts.length > 0 ? parts.join(' · ') : `${modo === 'turmas' ? 'turmas' : 'alunos'} na carteira Viva`;
                  })()}
                  icone={<Stethoscope size={15} />}
                />
              </div>

              {/* Ranking por Franquia — Tabela */}
              <div style={{ overflowX: 'auto', border: '1px solid #495057', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif" }}>
                  <thead>
                    <tr style={{ backgroundColor: '#343A40', borderBottom: '2px solid #495057' }}>
                      <th style={{ textAlign: 'left', padding: '10px 14px', color: '#ADB5BD', fontWeight: 700 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '10px 14px', color: '#ADB5BD', fontWeight: 700 }}>Franquia</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: '#ADB5BD', fontWeight: 700 }}>Matric. MED (INEP)</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: CORES.verde, fontWeight: 700 }}>{modo === 'turmas' ? 'Turmas' : 'Alunos'} Target</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: CORES.laranja, fontWeight: 700 }}>{modo === 'turmas' ? 'Turmas' : 'Alunos'} Viva</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: CORES.azul, fontWeight: 700 }}>% do INEP</th>
                      <th style={{ textAlign: 'right', padding: '10px 14px', color: CORES.verde, fontWeight: 700 }}>% do Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetRankingSorted.map((r, i) => {
                      const pctInep = r.matriculadosInep ? (r.alunosViva / r.matriculadosInep * 100).toFixed(1) : '—';
                      return (
                        <tr key={r.franquia} style={{ borderBottom: '1px solid #343A40', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '8px 14px', color: '#6C757D' }}>{i + 1}</td>
                          <td style={{ padding: '8px 14px', color: '#F8F9FA', fontWeight: 500 }}>{r.franquia}</td>
                          <td style={{ padding: '8px 14px', color: '#ADB5BD', textAlign: 'right' }}>{r.matriculadosInep ? fmtNum(r.matriculadosInep) : '—'}</td>
                          <td style={{ padding: '8px 14px', color: CORES.verde, textAlign: 'right', fontWeight: 600 }}>{fmtNum(r.alunosTarget)}</td>
                          <td style={{ padding: '8px 14px', color: CORES.laranja, textAlign: 'right', fontWeight: 600 }}>{fmtNum(r.alunosViva)}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <span style={{ color: CORES.azul, fontWeight: 700 }}>{pctInep !== '—' ? `${pctInep}%` : '—'}</span>
                          </td>
                          <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                            <span style={{ backgroundColor: `${CORES.verde}25`, color: CORES.verde, padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem' }}>
                              {r.participacao.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
