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
  RankingInstituicaoTarget,
} from '../types';
import { fmtNum, fmtPct, CORES } from '../utils/formatters';
import CardInsight from './CardInsight';
import TabelaRanking from './TabelaRanking';

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
        color: '#ADB5BD', fontSize: '0.65rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
        fontFamily: "'Poppins', sans-serif",
      }}>
        {titulo}
      </p>
    </div>
    <div style={{
      color: cor, fontSize: '1.8rem', fontWeight: 700,
      fontFamily: "'Orbitron', sans-serif", lineHeight: 1.1,
    }}>
      {valorStr ?? (valor != null ? fmtNum(valor) : '—')}
    </div>
    {subtitulo && (
      <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: '6px 0 0' }}>{subtitulo}</p>
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

const TABS: { id: TabId; label: string; icone: React.ReactNode; cor: string }[] = [
  { id: 'alunos', label: 'Alunos - Carteira Viva', icone: <Users size={14} />, cor: CORES.azul },
  { id: 'turmas', label: 'Turmas Ativas', icone: <GraduationCap size={14} />, cor: CORES.roxo },
  { id: 'target', label: 'Target', icone: <Target size={14} />, cor: CORES.verde },
];

// ─── Component ──────────────────────────────

interface SecaoMarketShareV2Props {
  dados: DadosMarketShareV2;
}

export default function SecaoMarketShareV2({ dados }: SecaoMarketShareV2Props) {
  const { matriculados, turmas, target } = dados;
  const [abaAtiva, setAbaAtiva] = useState<TabId>('alunos');
  const [targetVisao, setTargetVisao] = useState<'alunos' | 'turmas'>('alunos');
  const tv = target[targetVisao];

  // ━━━ BLOCO 1 — MATRICULADOS ━━━━━━━━━━━━━━━

  const compAnualLabels = matriculados.comparativoAnual.map(c => String(c.ano));
  const compAnualData = {
    labels: compAnualLabels,
    datasets: [
      {
        label: 'Matriculados (Carteira)',
        data: matriculados.comparativoAnual.map(c => c.matriculados),
        backgroundColor: CORES.azul,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Mercado Total',
        data: matriculados.comparativoAnual.map(c => c.mercadoTotal),
        backgroundColor: `${CORES.cinza}80`,
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
      backgroundColor: rankingSorted.map((_, i) =>
        i === 0 ? CORES.laranja : `${CORES.azul}${i < 3 ? 'CC' : '80'}`
      ),
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
        label: 'Turmas (Carteira)',
        data: turmas.comparativoAnual.map(c => c.matriculados),
        backgroundColor: CORES.roxo,
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Mercado Total',
        data: turmas.comparativoAnual.map(c => c.mercadoTotal),
        backgroundColor: `${CORES.cinza}80`,
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
      backgroundColor: turmasRankingSorted.map((_, i) =>
        i === 0 ? CORES.laranja : `${CORES.roxo}${i < 3 ? 'CC' : '80'}`
      ),
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
  const targetLabel = targetVisao === 'turmas' ? 'Turmas Target' : 'Alunos Target';
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

  const colsInstituicao: { key: keyof RankingInstituicaoTarget & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'instituicao', label: 'Instituição', tipo: 'texto' },
    { key: 'matriculados', label: 'Matriculados', tipo: 'numero' },
    { key: 'alunosViva', label: 'Alunos Viva', tipo: 'numero' },
    { key: 'participacao', label: 'Participação', tipo: 'percentual', largura: '130px' },
  ];

  // ━━━ Tab active color ━━━━━━━━━━━━━━━━━━━━━
  const tabAtiva = TABS.find(t => t.id === abaAtiva)!;

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <CardInsight
              titulo="Comparativo Matriculados × Mercado Total"
              cor={CORES.azul}
              icone={<TrendingUp size={16} />}
              iniciaExpandido
              resumo={matriculados.comparativoAnual.map(c => ({
                label: String(c.ano),
                valor: fmtNum(c.matriculados),
                cor: CORES.azul,
              }))}
            >
              <div style={{ height: 280, marginTop: 8 }}>
                <Bar data={compAnualData} options={compAnualOptions} />
              </div>
            </CardInsight>

            <CardInsight
              titulo="Ranking Franquias — Market Share"
              cor={CORES.laranja}
              icone={<Award size={16} />}
              iniciaExpandido
              resumo={[
                { label: '1º', valor: `${rankingSorted[0]?.franquia} (${rankingSorted[0]?.marketShare.toFixed(1)}%)`, cor: CORES.laranja },
              ]}
            >
              <div style={{ height: 280, marginTop: 8 }}>
                <Bar data={rankingData} options={rankingOptions} />
              </div>
            </CardInsight>
          </div>
        </>
      )}

      {/* ━━━ ABA: TURMAS ATIVAS ━━━━━━━━━━━━━━━━ */}
      {abaAtiva === 'turmas' && (
        <>
          <SectionLabel num="1" label="Turmas Ativas" cor={CORES.roxo} icone={<GraduationCap size={14} />} />

          {turmas.semDados ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 14, marginBottom: 16, opacity: 0.4, pointerEvents: 'none',
              }}>
                <KpiCard
                  titulo="TOTAL DE TURMAS (INEP)"
                  valorStr="—"
                  cor={CORES.azul}
                  subtitulo="sem dados disponíveis"
                  icone={<GraduationCap size={15} />}
                />
                <KpiCard
                  titulo="TURMAS CARTEIRA (MUNDO VIVA)"
                  valorStr="—"
                  cor={CORES.laranja}
                  subtitulo="sem dados disponíveis"
                  icone={<Briefcase size={15} />}
                />
                <KpiCard
                  titulo="MARKET SHARE"
                  valorStr="—"
                  cor={CORES.roxo}
                  subtitulo="sem dados disponíveis"
                  icone={<TrendingUp size={15} />}
                />
              </div>
              <SemDadosPlaceholder mensagem="Análise de Turmas — Dados não disponíveis" />
            </>
          ) : (
            <>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <CardInsight
                  titulo="Comparativo Turmas × Mercado Total"
                  cor={CORES.roxo}
                  icone={<TrendingUp size={16} />}
                  iniciaExpandido
                  resumo={turmas.comparativoAnual.map(c => ({
                    label: String(c.ano),
                    valor: fmtNum(c.matriculados),
                    cor: CORES.roxo,
                  }))}
                >
                  <div style={{ height: 280, marginTop: 8 }}>
                    <Bar data={turmasCompData} options={turmasCompOptions} />
                  </div>
                </CardInsight>

                <CardInsight
                  titulo="Ranking Franquias — Market Share (Turmas)"
                  cor={CORES.laranja}
                  icone={<Award size={16} />}
                  iniciaExpandido
                  resumo={[
                    { label: '1º', valor: `${turmasRankingSorted[0]?.franquia} (${turmasRankingSorted[0]?.marketShare.toFixed(1)}%)`, cor: CORES.laranja },
                  ]}
                >
                  <div style={{ height: 280, marginTop: 8 }}>
                    <Bar data={turmasRankingData} options={turmasRankingOptions} />
                  </div>
                </CardInsight>
              </div>
            </>
          )}
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
              <strong>Medicina</strong> — Análise target no curso de Medicina. Curso prioritário para mapeamento.
            </p>
          </div>

          {/* Toggle Alunos / Turmas */}
          <div style={{
            display: 'inline-flex', backgroundColor: '#2D3238',
            borderRadius: 8, padding: 3, marginBottom: 18,
            border: '1px solid #495057',
          }}>
            {(['alunos', 'turmas'] as const).map(v => {
              const isAct = targetVisao === v;
              const label = v === 'alunos' ? 'Alunos' : 'Turmas';
              const ic = v === 'alunos' ? <Users size={13} /> : <GraduationCap size={13} />;
              return (
                <button
                  key={v}
                  onClick={() => setTargetVisao(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 20px', border: 'none', borderRadius: 6,
                    backgroundColor: isAct ? `${CORES.verde}20` : 'transparent',
                    color: isAct ? CORES.verde : '#6C757D',
                    fontSize: '0.76rem', fontWeight: isAct ? 700 : 500,
                    fontFamily: "'Poppins', sans-serif",
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: isAct ? `0 0 8px ${CORES.verde}20` : 'none',
                  }}
                >
                  {ic}
                  {label}
                  {isAct && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: CORES.verde, boxShadow: `0 0 6px ${CORES.verde}`,
                      marginLeft: 2,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Conteúdo da visão ativa */}
          {tv.semDados ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 14, marginBottom: 16, opacity: 0.4, pointerEvents: 'none',
              }}>
                <KpiCard titulo={`TOTAL DE ${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} (INEP)`} valorStr="—" cor={CORES.azul} icone={<Users size={15} />} />
                <KpiCard titulo={`${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} TARGET (PIPEFY)`} valorStr="—" cor={CORES.verde} icone={<Target size={15} />} />
                <KpiCard titulo={`${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} VIVA (MUNDO VIVA)`} valorStr="—" cor={CORES.laranja} icone={<Stethoscope size={15} />} />
                <KpiCard titulo="PARTICIPAÇÃO TOTAL" valorStr="—" cor={CORES.amarelo} icone={<TrendingUp size={15} />} />
                <KpiCard titulo="PARTICIPAÇÃO TARGET" valorStr="—" cor={CORES.rosa} icone={<TrendingUp size={15} />} />
              </div>
              <SemDadosPlaceholder mensagem={`Análise de ${targetVisao === 'turmas' ? 'Turmas' : 'Alunos'} Target — Dados não disponíveis`} />
            </>
          ) : (
            <>
              {/* KPI Cards — 5 cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: 14, marginBottom: 20,
              }}>
                <KpiCard
                  titulo={`TOTAL DE ${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} (INEP)`}
                  valor={tv.totalMercado}
                  cor={CORES.azul}
                  subtitulo={`${targetVisao === 'turmas' ? 'turmas' : 'matriculados'} em medicina`}
                  icone={<Users size={15} />}
                />
                <KpiCard
                  titulo={`${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} TARGET (PIPEFY)`}
                  valor={tv.totalTarget}
                  cor={CORES.verde}
                  subtitulo={`${targetVisao === 'turmas' ? 'turmas' : 'alunos'} do perfil target`}
                  icone={<Target size={15} />}
                />
                <KpiCard
                  titulo={`${targetVisao === 'turmas' ? 'TURMAS' : 'ALUNOS'} VIVA (MUNDO VIVA)`}
                  valor={tv.totalViva || null}
                  valorStr={tv.totalViva ? fmtNum(tv.totalViva) : '—'}
                  cor={CORES.laranja}
                  subtitulo={`${targetVisao === 'turmas' ? 'turmas' : 'alunos'} na carteira Viva`}
                  icone={<Stethoscope size={15} />}
                />
                <KpiCard
                  titulo="PARTICIPAÇÃO TOTAL"
                  valorStr={tv.participacaoDoTotal ? fmtPct(tv.participacaoDoTotal) : '—'}
                  cor={CORES.amarelo}
                  subtitulo={`do total de ${targetVisao === 'turmas' ? 'turmas' : 'matriculados'}`}
                  icone={<TrendingUp size={15} />}
                />
                <KpiCard
                  titulo="PARTICIPAÇÃO TARGET"
                  valorStr={tv.participacaoDoTarget ? fmtPct(tv.participacaoDoTarget) : '—'}
                  cor={CORES.rosa}
                  subtitulo={`do total de ${targetVisao === 'turmas' ? 'turmas' : 'alunos'} target`}
                  icone={<TrendingUp size={15} />}
                />
              </div>

              {/* Ranking Franquias + Tabela Instituições */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <CardInsight
                  titulo={`Ranking por Franquia — ${targetVisao === 'turmas' ? 'Turmas' : 'Alunos'} Target`}
                  cor={CORES.verde}
                  icone={<Award size={16} />}
                  iniciaExpandido
                  resumo={[
                    { label: '1º', valor: `${targetRankingSorted[0]?.franquia} (${fmtNum(targetRankingSorted[0]?.alunosTarget)})`, cor: CORES.verde },
                  ]}
                >
                  <div style={{ height: 280, marginTop: 8 }}>
                    <Bar data={targetRankingData} options={targetRankingOptions} />
                  </div>
                </CardInsight>

                <CardInsight
                  titulo="Ranking por Instituição"
                  valor={`${tv.rankingInstituicoes.length} IES`}
                  cor={CORES.azul}
                  icone={<Building2 size={16} />}
                  iniciaExpandido
                >
                  <div style={{ marginTop: 8 }}>
                    <TabelaRanking<RankingInstituicaoTarget>
                      titulo=""
                      dados={tv.rankingInstituicoes}
                      colunas={colsInstituicao}
                      linhasVisiveis={8}
                      destaqueCor={CORES.verde}
                    />
                  </div>
                </CardInsight>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
