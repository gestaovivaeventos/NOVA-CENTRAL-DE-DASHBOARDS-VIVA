/**
 * SecaoAlunos — Análise de Alunos com Storytelling
 * 
 * Fluxo narrativo:
 * 1. Evolução Histórica — como o mercado evoluiu
 * 2. Distribuição — 4 cards expansíveis (Modalidade, Instituição, Gênero, Faixa Etária)
 * 3. Tabela Comparativa — detalhamento ano a ano (expansível)
 * 4. Análise por Curso — tabela detalhada estilo fluxo realizado
 * 5. Cursos por Instituição — ranking das IES
 * 6. Distribuição Geográfica — mapa + ranking por estado
 */

import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { BookOpen, Building2, Users, Calendar, Globe, BarChart3 } from 'lucide-react';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado, MetricaAtiva, DadosEstado, DadosInstituicao } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import dynamic from 'next/dynamic';

const MapaBrasil = dynamic(() => import('./MapaBrasilLeaflet'), { ssr: false });
import TabelaRanking from './TabelaRanking';
import GraficoEvolucao from './GraficoEvolucao';
import TabelaComparativa from './TabelaComparativa';
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

interface SecaoAlunosProps {
  dados: DadosAnaliseMercado;
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
}

export default function SecaoAlunos({ dados, filtros, onEstadoClick }: SecaoAlunosProps) {
  const { evolucaoAlunos, distribuicaoEstados, rankingCursos, instituicoes, cidadesPorEstado, demografia } = dados;
  const metricas = filtros.metricasAtivas;
  const unica = metricas.length === 1;
  const primaria = metricas[0];

  const tituloLabel = unica
    ? METRICA_LABEL[primaria]
    : metricas.map(k => METRICA_LABEL[k]).join(' / ');

  const ultimoAno = evolucaoAlunos[evolucaoAlunos.length - 1];

  // Map metric key: DadosEstado só tem matriculas e concluintes
  const mapMetricKey: 'matriculas' | 'concluintes' = primaria === 'concluintes' ? 'concluintes' : 'matriculas';

  // Colunas do ranking de instituições
  const colunasInstituicao: { key: keyof DadosInstituicao & string; label: string; tipo: 'texto' | 'numero'; largura?: string }[] = [
    { key: 'nome', label: 'Instituição', tipo: 'texto' },
    { key: 'tipo', label: 'Tipo', tipo: 'texto', largura: '70px' },
    { key: 'cursos', label: 'Cursos', tipo: 'numero', largura: '70px' },
    ...metricas.map(m => ({
      key: m as keyof DadosInstituicao & string, label: METRICA_LABEL[m], tipo: 'numero' as const,
    })),
    { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
  ];

  // Colunas do ranking de estados
  const rankEstadoColunas: { key: keyof DadosEstado & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
    ...metricas.filter(m => m !== 'ingressantes').map(m => ({
      key: (m === 'concluintes' ? 'concluintes' : 'matriculas') as keyof DadosEstado & string,
      label: METRICA_LABEL[m], tipo: 'numero' as const,
    })),
    { key: 'percentual', label: '% Brasil', tipo: 'percentual' },
  ];
  if (!rankEstadoColunas.find(c => c.key === 'matriculas' || c.key === 'concluintes')) {
    rankEstadoColunas.splice(1, 0, { key: 'matriculas', label: 'Matrículas', tipo: 'numero' });
  }

  // ─── Chart configs reutilizáveis ───
  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#F8F9FA',
        font: { size: 12, weight: 'bold' as const },
        formatter: (value: number, ctx: any) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          return `${((value / total) * 100).toFixed(1)}%`;
        },
      },
    },
  };

  // ─── Helper: mini bar de proporção ───
  const PropBar = ({ a, b, corA, corB, labelA, labelB }: { a: number; b: number; corA: string; corB: string; labelA: string; labelB: string }) => {
    const total = a + b || 1;
    const pctA = (a / total) * 100;
    const pctB = (b / total) * 100;
    return (
      <div style={{ marginTop: 12 }}>
        {/* Bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${pctA}%`, backgroundColor: corA, transition: 'width 0.3s' }} />
          <div style={{ width: `${pctB}%`, backgroundColor: corB, transition: 'width 0.3s' }} />
        </div>
        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: corA }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>{labelA}</span>
            <span style={{ color: corA, fontSize: '0.78rem', fontWeight: 700 }}>{fmtNum(a)}</span>
            <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>({pctA.toFixed(1)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: corB }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>{labelB}</span>
            <span style={{ color: corB, fontSize: '0.78rem', fontWeight: 700 }}>{fmtNum(b)}</span>
            <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>({pctB.toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Gênero evolution chart data ───
  const generoLineData = {
    labels: evolucaoAlunos.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Feminino', data: evolucaoAlunos.map(e => e.genero.feminino),
        borderColor: CORES.rosa, backgroundColor: `${CORES.rosa}15`,
        tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: CORES.rosa, borderWidth: 2,
      },
      {
        label: 'Masculino', data: evolucaoAlunos.map(e => e.genero.masculino),
        borderColor: CORES.azul, backgroundColor: `${CORES.azul}15`,
        tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: CORES.azul, borderWidth: 2,
      },
    ],
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

  // Total gênero para cálculos
  const totalGenero = (ultimoAno?.genero.feminino || 0) + (ultimoAno?.genero.masculino || 0);

  // Top 5 cursos por métrica principal (para bar chart no card de cursos por instituição)
  const top5Inst = [...instituicoes].sort((a, b) => b.cursos - a.cursos).slice(0, 15);
  const instBarData = {
    labels: top5Inst.map(i => i.nome.length > 15 ? i.nome.substring(0, 15) + '…' : i.nome),
    datasets: [{
      label: 'Cursos', data: top5Inst.map(i => i.cursos),
      backgroundColor: CORES.laranja, borderRadius: 3,
    }],
  };

  // ─── Seção de narrador (número + subtítulo) ───
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

  return (
    <div>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           1. EVOLUÇÃO HISTÓRICA — Como o mercado evoluiu
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="1" label="Evolução Histórica" cor={CORES.azul} />
      <div style={{ marginBottom: 24 }}>
        <GraficoEvolucao dados={evolucaoAlunos} metricasAtivas={metricas} />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           2. DISTRIBUIÇÃO — Como os números se dividem
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="2" label="Distribuição do Mercado" cor={CORES.verde} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Modalidade · Instituição · Gênero · Faixa Etária"
          cor={CORES.verde}
          icone={<BarChart3 size={16} />}
          resumo={[
            { label: 'Presencial', valor: fmtNum(ultimoAno?.presencial || 0), cor: CORES.verde },
            { label: 'EAD', valor: fmtNum(ultimoAno?.ead || 0), cor: CORES.roxo },
            { label: 'Pública', valor: fmtNum(ultimoAno?.publica || 0), cor: CORES.azul },
            { label: 'Privada', valor: fmtNum(ultimoAno?.privada || 0), cor: CORES.laranja },
          ]}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14,
          }}>
          {/* ── Modalidade (Presencial vs EAD) ── */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
            <h4 style={{
              color: CORES.verde, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
              fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Por Modalidade
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <PropBar
                a={ultimoAno?.presencial || 0} b={ultimoAno?.ead || 0}
                corA={CORES.verde} corB={CORES.roxo}
                labelA="Presencial" labelB="EAD"
              />
              <div style={{ height: 160 }}>
                <Doughnut data={{
                  labels: ['Presencial', 'EAD'],
                  datasets: [{ data: [ultimoAno?.presencial || 0, ultimoAno?.ead || 0], backgroundColor: [CORES.verde, CORES.roxo], borderColor: '#343A40', borderWidth: 3 }],
                }} options={donutOptions} />
              </div>
            </div>
          </div>

          {/* ── Tipo de Instituição (Pública vs Privada) ── */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
            <h4 style={{
              color: CORES.azul, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
              fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Por Tipo de Instituição
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <PropBar
                a={ultimoAno?.publica || 0} b={ultimoAno?.privada || 0}
                corA={CORES.azul} corB={CORES.laranja}
                labelA="Pública" labelB="Privada"
              />
              <div style={{ height: 160 }}>
                <Doughnut data={{
                  labels: ['Pública', 'Privada'],
                  datasets: [{ data: [ultimoAno?.publica || 0, ultimoAno?.privada || 0], backgroundColor: [CORES.azul, CORES.laranja], borderColor: '#343A40', borderWidth: 3 }],
                }} options={donutOptions} />
              </div>
            </div>
          </div>

          {/* ── Gênero ── */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
            <h4 style={{
              color: CORES.rosa, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
              fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Por Gênero
            </h4>
            <PropBar
              a={ultimoAno?.genero.feminino || 0} b={ultimoAno?.genero.masculino || 0}
              corA={CORES.rosa} corB={CORES.azul}
              labelA="Feminino" labelB="Masculino"
            />
            <div style={{ height: 180, marginTop: 16 }}>
              <Line data={generoLineData} options={miniChartOpts} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, justifyContent: 'center' }}>
              {[
                { label: 'Feminino', cor: CORES.rosa },
                { label: 'Masculino', cor: CORES.azul },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: l.cor }} />
                  <span style={{ color: '#ADB5BD', fontSize: '0.65rem' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Faixa Etária ── */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
            <h4 style={{
              color: CORES.amarelo, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
              fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Faixa Etária
            </h4>
            <div style={{ height: 180 }}>
              <Bar
                data={{
                  labels: demografia.faixaEtaria.map(f => f.faixa),
                  datasets: [{
                    label: 'Alunos', data: demografia.faixaEtaria.map(f => f.total),
                    backgroundColor: CORES.amarelo, borderRadius: 3,
                  }],
                }}
                options={{
                  ...miniChartOpts,
                  plugins: {
                    ...miniChartOpts.plugins,
                    datalabels: {
                      color: '#F8F9FA', font: { size: 8, weight: 'bold' as const },
                      anchor: 'end' as const, align: 'top' as const,
                      formatter: (v: number) => fmtNum(v),
                    },
                  },
                }}
              />
            </div>
          </div>
          </div>
        </CardInsight>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           3. DETALHAMENTO — Tabela comparativa ano a ano
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="3" label="Detalhamento Anual" cor={CORES.roxo} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Tabela Comparativa — Evolução Anual"
          cor={CORES.roxo}
          icone={<BarChart3 size={16} />}
          resumo={metricas.map(m => ({
            label: METRICA_LABEL[m],
            valor: fmtNum(ultimoAno?.[m] || 0),
            cor: METRICA_COR[m],
          }))}
        >
          <div style={{ marginTop: 14 }}>
            <TabelaComparativa dados={evolucaoAlunos} metricasAtivas={metricas} />
          </div>
        </CardInsight>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           4. POR CURSO — Análise detalhada por curso
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="4" label="Análise por Curso" cor={CORES.laranja} />
      <div style={{ marginBottom: 24 }}>
        <TabelaCursos
          dados={rankingCursos}
          areaFiltro={filtros.areaConhecimento}
          metricasAtivas={metricas}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           5. POR INSTITUIÇÃO — Ranking de IES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="5" label="Cursos por Instituição" cor={CORES.laranja} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Cursos por Instituição"
          cor={CORES.laranja}
          icone={<Building2 size={16} />}
          resumo={[
            { label: 'Ensino Superior', valor: fmtInteiro(instituicoes.length), cor: CORES.laranja },
            { label: 'Total Cursos', valor: fmtInteiro(instituicoes.reduce((s, i) => s + i.cursos, 0)), cor: '#ADB5BD' },
          ]}
        >
          <div style={{ marginTop: 14 }}>
            {/* Bar chart - top 15 instituições por nº de cursos */}
            <div style={{ height: 200, marginBottom: 16 }}>
              <Bar data={instBarData} options={{
                ...miniChartOpts,
                indexAxis: 'x' as const,
                plugins: { ...miniChartOpts.plugins,
                  tooltip: { ...miniChartOpts.plugins.tooltip,
                    callbacks: {
                      ...miniChartOpts.plugins.tooltip.callbacks,
                      title: (items: any[]) => items.length ? top5Inst[items[0].dataIndex]?.nome || '' : '',
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
            {/* Tabela completa */}
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
           6. GEOGRAFIA — Distribuição territorial
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="6" label="Distribuição Geográfica" cor={CORES.verde} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
        <MapaBrasil
          dados={distribuicaoEstados}
          metrica={mapMetricKey}
          cidades={cidadesPorEstado}
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
        />
        <TabelaRanking
          titulo={`Ranking por Estado — ${tituloLabel}`}
          dados={distribuicaoEstados}
          colunas={rankEstadoColunas}
          linhasVisiveis={10}
        />
      </div>
    </div>
  );
}
