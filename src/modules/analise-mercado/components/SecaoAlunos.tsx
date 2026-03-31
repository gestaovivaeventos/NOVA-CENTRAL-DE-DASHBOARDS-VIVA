/**
 * SecaoAlunos — Análise de Alunos com Storytelling
 * 
 * Fluxo narrativo:
 * 1. Evolução Histórica — como o mercado evoluiu
 * 2. Distribuição — 3 cards expansíveis (Modalidade, Instituição, Gênero)
 * 3. Tabela Comparativa — detalhamento ano a ano (expansível)
 * 4. Análise por Curso — tabela detalhada estilo fluxo realizado
 * 5. Cursos por Instituição — ranking das IES
 * 6. Distribuição Geográfica — mapa + ranking por estado
 */

import React, { useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
} from 'chart.js';
import { BookOpen, Building2, Users, Globe, BarChart3 } from 'lucide-react';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado, MetricaAtiva, DadosEstado, DadosInstituicao } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import dynamic from 'next/dynamic';

ChartJS.register(ArcElement);

const MapaBrasil = dynamic(() => import('./MapaBrasilLeaflet'), { ssr: false });
import TabelaRanking from './TabelaRanking';
import TabelaCursos from './TabelaCursos';
import CardInsight from './CardInsight';

const METRICA_LABEL: Record<MetricaAtiva, string> = {
  matriculas: 'Matrículas',
  concluintes: 'Concluintes',
  ingressantes: 'Ingressantes',
};

const METRICA_COR: Record<MetricaAtiva, string> = {
  matriculas: CORES.azul,
  concluintes: CORES.verde,
  ingressantes: CORES.roxo,
};

const METRICAS_OPTIONS: { key: MetricaAtiva; label: string; cor: string }[] = [
  { key: 'matriculas', label: 'Matriculados', cor: '#3B82F6' },
  { key: 'concluintes', label: 'Concluintes', cor: '#10B981' },
  { key: 'ingressantes', label: 'Ingressantes', cor: '#8B5CF6' },
];

interface SecaoAlunosProps {
  dados: DadosAnaliseMercado;
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
  onMetricaChange: (key: MetricaAtiva) => void;
  loadingEvolucao?: boolean;
}

export default function SecaoAlunos({ dados, filtros, onEstadoClick, onMetricaChange, loadingEvolucao = false }: SecaoAlunosProps) {
  const { evolucaoAlunos, distribuicaoEstados, rankingCursos, instituicoes, cidadesPorEstado, demografia } = dados;

  // Single shared metric state — synced across all sections
  const [metricaAtiva, setMetricaAtiva] = useState<MetricaAtiva>('matriculas');
  const metricaDistribuicao = metricaAtiva;
  const metricaCurso = metricaAtiva;
  const metricaInstituicao = metricaAtiva;
  const metricaGeo = metricaAtiva;

  const ultimoAno = evolucaoAlunos.find(e => e.ano === filtros.ano) || evolucaoAlunos[evolucaoAlunos.length - 1];

  // Map metric key for state data (only matriculas and concluintes available)
  const mapMetricKey = (m: MetricaAtiva): 'matriculas' | 'concluintes' => m === 'concluintes' ? 'concluintes' : 'matriculas';

  // ─── Reusable metric selector ───
  const MetricaSelector = ({ value, onChange, label }: { value: MetricaAtiva; onChange: (m: MetricaAtiva) => void; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {METRICAS_OPTIONS.map(m => {
        const ativo = value === m.key;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 16,
              backgroundColor: ativo ? `${m.cor}20` : 'transparent',
              border: `1.5px solid ${ativo ? m.cor : '#495057'}`,
              color: ativo ? m.cor : '#6C757D',
              fontSize: '0.7rem', fontWeight: ativo ? 700 : 500,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: ativo ? m.cor : '#495057',
            }} />
            {m.label}
          </button>
        );
      })}
    </div>
  );

  // ─── Section header with metric label ───
  const SectionHeader = ({ num, label, cor, metrica, ano }: { num: string; label: string; cor: string; metrica: MetricaAtiva; ano: number }) => (
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
        {label} ({ano})
      </span>
      <span style={{
        color: METRICA_COR[metrica], fontSize: '0.68rem', fontWeight: 700,
        backgroundColor: `${METRICA_COR[metrica]}15`, padding: '3px 10px',
        borderRadius: 10, border: `1px solid ${METRICA_COR[metrica]}40`,
      }}>
        {METRICA_LABEL[metrica]}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#495057' }} />
    </div>
  );

  // Colunas do ranking de instituições (dynamic per metric)
  const colunasInstituicao: { key: keyof DadosInstituicao & string; label: string; tipo: 'texto' | 'numero'; largura?: string }[] = [
    { key: 'nome', label: 'Instituição', tipo: 'texto' },
    { key: 'tipo', label: 'Tipo', tipo: 'texto', largura: '70px' },
    { key: 'cursos', label: 'Cursos', tipo: 'numero', largura: '70px' },
    { key: metricaInstituicao as keyof DadosInstituicao & string, label: METRICA_LABEL[metricaInstituicao], tipo: 'numero' },
    { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
  ];

  // Colunas do ranking de estados — compute %Brasil dynamically
  const geoMetricKey = mapMetricKey(metricaGeo);
  const totalBrasil = distribuicaoEstados.reduce((s, e) => s + (e[geoMetricKey] || 0), 0) || 1;
  const estadosComPct = distribuicaoEstados.map(e => ({
    ...e,
    percentual: (e[geoMetricKey] / totalBrasil) * 100,
  }));
  const rankEstadoColunas: { key: keyof DadosEstado & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
    { key: geoMetricKey as keyof DadosEstado & string, label: METRICA_LABEL[metricaGeo], tipo: 'numero' },
    { key: 'percentual', label: '% Brasil', tipo: 'percentual' },
  ];

  // ─── Donut chart configs ───
  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#F8F9FA',
        font: { size: 11, weight: 'bold' as const },
        formatter: (value: number, ctx: any) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          return total ? `${((value / total) * 100).toFixed(1)}%` : '-';
        },
      },
    },
  };

  // ─── Helper: Donut legend row ───
  const DonutLegend = ({ items }: { items: { label: string; valor: number; cor: string }[] }) => {
    const total = items.reduce((s, i) => s + i.valor, 0) || 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.cor, flexShrink: 0 }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem', flex: 1 }}>{item.label}</span>
            <span style={{ color: item.cor, fontSize: '0.78rem', fontWeight: 700 }}>{fmtNum(item.valor)}</span>
            <span style={{ color: '#6C757D', fontSize: '0.6rem' }}>({((item.valor / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    );
  };

  // Breakdown for distribution section
  const bd = ultimoAno?.porMetrica?.[metricaDistribuicao] ?? {
    presencial: ultimoAno?.presencial || 0,
    ead: ultimoAno?.ead || 0,
    publica: ultimoAno?.publica || 0,
    privada: ultimoAno?.privada || 0,
    feminino: ultimoAno?.genero?.feminino || 0,
    masculino: ultimoAno?.genero?.masculino || 0,
  };

  // Top 15 institutions by courses (for bar chart)
  const top15Inst = [...instituicoes].sort((a, b) => (b[metricaInstituicao] as number) - (a[metricaInstituicao] as number)).slice(0, 15);
  const instBarData = {
    labels: top15Inst.map(i => i.nome.length > 15 ? i.nome.substring(0, 15) + '…' : i.nome),
    datasets: [{
      label: METRICA_LABEL[metricaInstituicao],
      data: top15Inst.map(i => (i as any)[metricaInstituicao]),
      backgroundColor: CORES.laranja, borderRadius: 3,
    }],
  };

  const miniChartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1, titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}` } } },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 9 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  return (
    <div>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           1. DISTRIBUIÇÃO — 3 Gráficos de Rosca lado a lado
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="1" label="Distribuição do Mercado" cor={CORES.verde} metrica={metricaDistribuicao} ano={filtros.ano} />
      <div style={{ marginBottom: 8 }}>
        <MetricaSelector value={metricaAtiva} onChange={setMetricaAtiva} label="Distribuição" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {/* ── Rosca 1: Gênero ── */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
          <h4 style={{
            color: CORES.rosa, fontSize: '0.73rem', fontWeight: 600, margin: '0 0 10px',
            fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Por Gênero
          </h4>
          <div style={{ height: 170 }}>
            <Doughnut data={{
              labels: ['Feminino', 'Masculino'],
              datasets: [{ data: [bd.feminino, bd.masculino], backgroundColor: [CORES.rosa, CORES.azul], borderColor: '#343A40', borderWidth: 3 }],
            }} options={donutOptions} />
          </div>
          <DonutLegend items={[
            { label: 'Feminino', valor: bd.feminino, cor: CORES.rosa },
            { label: 'Masculino', valor: bd.masculino, cor: CORES.azul },
          ]} />
        </div>

        {/* ── Rosca 2: Modalidade ── */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
          <h4 style={{
            color: CORES.verde, fontSize: '0.73rem', fontWeight: 600, margin: '0 0 10px',
            fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Por Modalidade
          </h4>
          <div style={{ height: 170 }}>
            <Doughnut data={{
              labels: ['Presencial', 'EAD'],
              datasets: [{ data: [bd.presencial, bd.ead], backgroundColor: [CORES.verde, CORES.roxo], borderColor: '#343A40', borderWidth: 3 }],
            }} options={donutOptions} />
          </div>
          <DonutLegend items={[
            { label: 'Presencial', valor: bd.presencial, cor: CORES.verde },
            { label: 'EAD', valor: bd.ead, cor: CORES.roxo },
          ]} />
        </div>

        {/* ── Rosca 3: Tipo de Instituição ── */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
          <h4 style={{
            color: CORES.azul, fontSize: '0.73rem', fontWeight: 600, margin: '0 0 10px',
            fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Por Instituição
          </h4>
          <div style={{ height: 170 }}>
            <Doughnut data={{
              labels: ['Pública', 'Privada'],
              datasets: [{ data: [bd.publica, bd.privada], backgroundColor: [CORES.azul, CORES.laranja], borderColor: '#343A40', borderWidth: 3 }],
            }} options={donutOptions} />
          </div>
          <DonutLegend items={[
            { label: 'Pública', valor: bd.publica, cor: CORES.azul },
            { label: 'Privada', valor: bd.privada, cor: CORES.laranja },
          ]} />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           2. POR CURSO — Análise detalhada por curso
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="2" label="Análise por Curso" cor={CORES.laranja} metrica={metricaCurso} ano={filtros.ano} />
      <div style={{ marginBottom: 8 }}>
        <MetricaSelector value={metricaAtiva} onChange={setMetricaAtiva} label="Curso" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <TabelaCursos
          dados={rankingCursos}
          areaFiltro={filtros.areaConhecimento}
          metricasAtivas={[metricaCurso]}
          ano={filtros.ano}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           3. POR INSTITUIÇÃO — Ranking de IES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="3" label="Cursos por Instituição" cor={CORES.laranja} metrica={metricaInstituicao} ano={filtros.ano} />
      <div style={{ marginBottom: 8 }}>
        <MetricaSelector value={metricaAtiva} onChange={setMetricaAtiva} label="Instituição" />
      </div>
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo={`Cursos por Instituição (${filtros.ano})`}
          cor={CORES.laranja}
          icone={<Building2 size={16} />}
          iniciaExpandido
          resumo={[
            { label: 'Instituições Ativas', valor: fmtInteiro(instituicoes.length), cor: CORES.laranja },
            { label: 'Total Cursos', valor: fmtInteiro(instituicoes.reduce((s, i) => s + i.cursos, 0)), cor: '#ADB5BD' },
          ]}
        >
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 200, marginBottom: 16 }}>
              <Bar data={instBarData} options={{
                ...miniChartOpts,
                indexAxis: 'x' as const,
                plugins: { ...miniChartOpts.plugins,
                  tooltip: { ...miniChartOpts.plugins.tooltip,
                    callbacks: {
                      ...miniChartOpts.plugins.tooltip.callbacks,
                      title: (items: any[]) => items.length ? top15Inst[items[0].dataIndex]?.nome || '' : '',
                    },
                  },
                  datalabels: {
                    color: '#F8F9FA', font: { size: 8, weight: 'bold' as const },
                    anchor: 'end' as const, align: 'top' as const,
                    formatter: (v: number) => fmtInteiro(v),
                  },
                },
              }} />
            </div>
            <TabelaRanking
              titulo=""
              dados={instituicoes}
              colunas={colunasInstituicao}
              linhasVisiveis={10}
            />
          </div>
        </CardInsight>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           4. GEOGRAFIA — Distribuição territorial
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="4" label="Distribuição Geográfica" cor={CORES.verde} metrica={metricaGeo} ano={filtros.ano} />
      <div style={{ marginBottom: 8 }}>
        <MetricaSelector value={metricaAtiva} onChange={setMetricaAtiva} label="Geo" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
        <MapaBrasil
          dados={estadosComPct}
          metrica={mapMetricKey(metricaGeo)}
          cidades={cidadesPorEstado}
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
          ano={filtros.ano}
        />
        {filtros.estado ? (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <TabelaRanking
                titulo={`Ranking por Estado — ${METRICA_LABEL[metricaGeo]} (${filtros.ano})`}
                dados={estadosComPct}
                colunas={rankEstadoColunas}
                linhasVisiveis={10}
                fillHeight
              />
            </div>
          </div>
        ) : (
          <TabelaRanking
            titulo={`Ranking por Estado — ${METRICA_LABEL[metricaGeo]} (${filtros.ano})`}
            dados={estadosComPct}
            colunas={rankEstadoColunas}
            linhasVisiveis={10}
          />
        )}
      </div>
    </div>
  );
}
