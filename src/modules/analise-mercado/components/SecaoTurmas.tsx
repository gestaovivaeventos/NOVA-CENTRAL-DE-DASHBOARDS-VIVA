/**
 * SecaoTurmas — Analise de Turmas com Storytelling
 * TAM (Total Addressable Market) — cada turma = 1 contrato potencial
 *
 * Fluxo narrativo (identico ao SecaoAlunos):
 * 1. Evolucao Historica — como o total de turmas evoluiu
 * 2. Distribuicao — 4 paineis (Modalidade, Instituicao, Sazonalidade, Media/Turma)
 * 3. Detalhamento Anual — tabela comparativa ano a ano
 * 4. Analise por Curso — ranking de cursos por turmas
 * 5. Grupos Educacionais — ranking das mantenedoras
 * 6. Distribuicao Geografica — mapa + ranking por estado
 */

import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { BookOpen, Building2, Users, Calendar, Globe, BarChart3 } from 'lucide-react';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado, DadosEstado } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import dynamic from 'next/dynamic';

const MapaBrasil = dynamic(() => import('./MapaBrasilLeaflet'), { ssr: false });
import TabelaRanking from './TabelaRanking';
import CardInsight from './CardInsight';

interface SecaoTurmasProps {
  dados: DadosAnaliseMercado;
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
}

export default function SecaoTurmas({ dados, filtros, onEstadoClick }: SecaoTurmasProps) {
  const { evolucaoTurmas, distribuicaoEstados, rankingCursos, gruposEducacionais, instituicoes, cidadesPorEstado } = dados;

  const ultimoAno = evolucaoTurmas[evolucaoTurmas.length - 1];
  const anoAnterior = evolucaoTurmas.length >= 2 ? evolucaoTurmas[evolucaoTurmas.length - 2] : null;

  // Variacao YoY
  const variacaoTotal = anoAnterior ? ((ultimoAno.totalTurmas - anoAnterior.totalTurmas) / anoAnterior.totalTurmas * 100) : 0;

  // --- Chart configs reutilizaveis ---
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

  const miniChartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, datalabels: { display: false },
      tooltip: {
        backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1,
        titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}` },
      },
    },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 9 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  // --- Helper: mini bar de proporcao ---
  const PropBar = ({ a, b, corA, corB, labelA, labelB }: { a: number; b: number; corA: string; corB: string; labelA: string; labelB: string }) => {
    const total = a + b || 1;
    const pctA = (a / total) * 100;
    const pctB = (b / total) * 100;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${pctA}%`, backgroundColor: corA, transition: 'width 0.3s' }} />
          <div style={{ width: `${pctB}%`, backgroundColor: corB, transition: 'width 0.3s' }} />
        </div>
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

  // --- Evolucao chart data (Turmas) ---
  const evolucaoLineData = {
    labels: evolucaoTurmas.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Total Turmas',
        data: evolucaoTurmas.map(e => e.totalTurmas),
        borderColor: CORES.laranja,
        backgroundColor: `${CORES.laranja}15`,
        tension: 0.4, fill: true,
        pointRadius: 4, pointBackgroundColor: CORES.laranja, borderWidth: 2,
      },
      {
        label: 'Presencial',
        data: evolucaoTurmas.map(e => e.turmasPresencial),
        borderColor: CORES.verde,
        backgroundColor: 'transparent',
        tension: 0.4, fill: false,
        pointRadius: 3, pointBackgroundColor: CORES.verde, borderWidth: 1.5,
        borderDash: [4, 3],
      },
    ],
  };

  const evolucaoOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: { color: '#ADB5BD', padding: 14, font: { size: 11, family: "'Poppins', sans-serif" }, usePointStyle: true, pointStyle: 'circle' },
      },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1,
        titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtInteiro(ctx.raw)}` },
      },
    },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  // --- Evolucao da Media/Turma ---
  const mediaLineData = {
    labels: evolucaoTurmas.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Media Alunos/Turma',
        data: evolucaoTurmas.map(e => e.mediaPorTurma),
        borderColor: CORES.azul,
        backgroundColor: `${CORES.azul}15`,
        tension: 0.4, fill: true,
        pointRadius: 3, pointBackgroundColor: CORES.azul, borderWidth: 2,
      },
      {
        label: 'Mediana Alunos/Turma',
        data: evolucaoTurmas.map(e => e.medianaPorTurma),
        borderColor: CORES.amarelo,
        backgroundColor: 'transparent',
        tension: 0.4, fill: false,
        pointRadius: 3, pointBackgroundColor: CORES.amarelo, borderWidth: 1.5,
        borderDash: [4, 3],
      },
    ],
  };



  // --- Top 10 cursos por turmas ---
  const top10CursosTurmas = [...rankingCursos].sort((a, b) => b.turmas - a.turmas).slice(0, 10);

  // --- Top 15 IES por turmas (bar chart) ---
  const top15Inst = [...instituicoes].sort((a, b) => b.turmas - a.turmas).slice(0, 15);
  const instBarData = {
    labels: top15Inst.map(i => i.nome.length > 15 ? i.nome.substring(0, 15) + '...' : i.nome),
    datasets: [{
      label: 'Turmas', data: top15Inst.map(i => i.turmas),
      backgroundColor: CORES.laranja, borderRadius: 3,
    }],
  };

  // --- Colunas do ranking de estados (turmas) ---
  const rankEstadoColunas: { key: keyof DadosEstado & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
    { key: 'turmas', label: 'Turmas', tipo: 'numero' },
    { key: 'instituicoes', label: 'Ensino Superior', tipo: 'numero' },
    { key: 'percentual', label: '% Brasil', tipo: 'percentual' },
  ];

  // --- Secao de narrador (numero + subtitulo) ---
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
      {/* 1. EVOLUCAO HISTORICA */}
      <SectionLabel num="1" label="Evolução Histórica" cor={CORES.laranja} />
      <div style={{ marginBottom: 24 }}>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          {/* KPI mini-row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'TOTAL TURMAS', valor: fmtInteiro(ultimoAno?.totalTurmas || 0), cor: CORES.laranja },
              { label: 'MÉDIA ALUNOS/TURMA', valor: fmtInteiro(ultimoAno?.mediaPorTurma || 0), cor: CORES.azul },
              { label: 'MEDIANA ALUNOS/TURMA', valor: fmtInteiro(ultimoAno?.medianaPorTurma || 0), cor: CORES.verde },
              { label: 'VARIAÇÃO YoY', valor: `${variacaoTotal >= 0 ? '+' : ''}${variacaoTotal.toFixed(1)}%`, cor: variacaoTotal >= 0 ? CORES.verde : CORES.vermelho },
            ].map(kpi => (
              <div key={kpi.label} style={{
                flex: 1, textAlign: 'center',
                backgroundColor: '#2D3238', borderRadius: 8, padding: '10px 8px',
                border: '1px solid #495057',
              }}>
                <p style={{ color: '#6C757D', fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px', fontFamily: "'Poppins', sans-serif" }}>
                  {kpi.label}
                </p>
                <p style={{ color: kpi.cor, fontWeight: 700, margin: 0, fontSize: '1.1rem', fontFamily: "'Orbitron', monospace" }}>
                  {kpi.valor}
                </p>
              </div>
            ))}
          </div>
          {/* Chart */}
          <div style={{ height: 280 }}>
            <Line data={evolucaoLineData} options={evolucaoOptions} />
          </div>
        </div>
      </div>

      {/* 2. DISTRIBUICAO */}
      <SectionLabel num="2" label="Distribuição do Mercado" cor={CORES.verde} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Instituição · Média/Turma"
          cor={CORES.verde}
          icone={<BarChart3 size={16} />}
          resumo={[
            { label: 'Presencial', valor: fmtNum(ultimoAno?.turmasPresencial || 0), cor: CORES.verde },
            { label: 'Pública', valor: fmtNum(ultimoAno?.turmasPublica || 0), cor: CORES.azul },
            { label: 'Privada', valor: fmtNum(ultimoAno?.turmasPrivada || 0), cor: CORES.laranja },
          ]}
        >
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14,
          }}>
            {/* Tipo de Instituicao (Publica vs Privada) */}
            <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
              <h4 style={{
                color: CORES.azul, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                Por Tipo de Instituição
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <PropBar
                  a={ultimoAno?.turmasPublica || 0} b={ultimoAno?.turmasPrivada || 0}
                  corA={CORES.azul} corB={CORES.laranja}
                  labelA="Pública" labelB="Privada"
                />
                <div style={{ height: 160 }}>
                  <Doughnut data={{
                    labels: ['Pública', 'Privada'],
                    datasets: [{ data: [ultimoAno?.turmasPublica || 0, ultimoAno?.turmasPrivada || 0], backgroundColor: [CORES.azul, CORES.laranja], borderColor: '#343A40', borderWidth: 3 }],
                  }} options={donutOptions} />
                </div>
              </div>
            </div>

            {/* Media / Turma (Evolucao) */}
            <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
              <h4 style={{
                color: CORES.amarelo, fontSize: '0.75rem', fontWeight: 600, margin: '0 0 10px',
                fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                Média e Mediana de Alunos/Turma
              </h4>
              <div style={{ height: 180 }}>
                <Line data={mediaLineData} options={{
                  ...miniChartOpts,
                  plugins: {
                    ...miniChartOpts.plugins,
                    legend: {
                      display: true,
                      position: 'bottom' as const,
                      labels: { color: '#ADB5BD', padding: 10, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' },
                    },
                  },
                }} />
              </div>
            </div>
          </div>
        </CardInsight>
      </div>

      {/* 3. DETALHAMENTO ANUAL */}
      <SectionLabel num="3" label="Detalhamento Anual" cor={CORES.roxo} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Tabela Comparativa — Evolução Anual de Turmas"
          cor={CORES.roxo}
          icone={<BarChart3 size={16} />}
          resumo={[
            { label: 'Total Turmas', valor: fmtInteiro(ultimoAno?.totalTurmas || 0), cor: CORES.laranja },
            { label: 'Média/Turma', valor: fmtInteiro(ultimoAno?.mediaPorTurma || 0), cor: CORES.azul },
          ]}
        >
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D3238' }}>
                  {['Ano', 'Total Turmas', 'Média/Turma', 'Mediana', 'Presencial', 'Pública', 'Privada'].map((h, i) => (
                    <th key={h} style={{
                      color: '#6C757D', fontWeight: 600, padding: '10px 10px',
                      textAlign: i === 0 ? 'left' : 'right', fontSize: '0.7rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      borderBottom: '2px solid #495057',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evolucaoTurmas.map((e, i) => {
                  const prev = i > 0 ? evolucaoTurmas[i - 1] : null;
                  const delta = prev ? ((e.totalTurmas - prev.totalTurmas) / prev.totalTurmas * 100) : 0;
                  return (
                    <tr key={e.ano} style={{
                      borderBottom: '1px solid #3D4349',
                      backgroundColor: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}>
                      <td style={{ padding: '10px', textAlign: 'left', color: '#F8F9FA', fontWeight: 600 }}>{e.ano}</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        <span style={{ color: CORES.laranja, fontWeight: 600 }}>{fmtInteiro(e.totalTurmas)}</span>
                        {prev && (
                          <span style={{ color: delta >= 0 ? CORES.verde : CORES.vermelho, fontSize: '0.65rem', marginLeft: 6 }}>
                            {delta >= 0 ? '\u25B2' : '\u25BC'}{Math.abs(delta).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', color: CORES.azul, fontWeight: 600 }}>{e.mediaPorTurma}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: CORES.amarelo, fontWeight: 600 }}>{e.medianaPorTurma}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPresencial)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPublica)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPrivada)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardInsight>
      </div>

      {/* 4. POR CURSO */}
      <SectionLabel num="4" label="Análise por Curso" cor={CORES.laranja} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Top Cursos por Volume de Turmas"
          cor={CORES.laranja}
          icone={<BookOpen size={16} />}
          resumo={[
            { label: 'Total Cursos', valor: fmtInteiro(rankingCursos.length), cor: '#ADB5BD' },
            { label: 'Total Turmas', valor: fmtInteiro(rankingCursos.reduce((s, c) => s + c.turmas, 0)), cor: CORES.laranja },
          ]}
        >
          <div style={{ marginTop: 14 }}>
            {/* Bar chart horizontal - top 10 */}
            <div style={{ height: 340, marginBottom: 16 }}>
              <Bar
                data={{
                  labels: top10CursosTurmas.map(c => c.nome.length > 20 ? c.nome.substring(0, 20) + '...' : c.nome),
                  datasets: [{
                    label: 'Turmas',
                    data: top10CursosTurmas.map(c => c.turmas),
                    backgroundColor: CORES.laranja,
                    borderRadius: 4,
                  }],
                }}
                options={{
                  indexAxis: 'y' as const,
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    datalabels: {
                      color: '#F8F9FA', font: { size: 10, weight: 'bold' as const },
                      anchor: 'end' as const, align: 'end' as const,
                      formatter: (v: number) => fmtInteiro(v),
                    },
                  },
                  scales: {
                    x: { ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
                    y: { ticks: { color: '#ADB5BD', font: { size: 11 } }, grid: { display: false } },
                  },
                }}
              />
            </div>
            {/* Tabela completa */}
            <TabelaRanking
              titulo=""
              dados={[...rankingCursos].sort((a, b) => b.turmas - a.turmas)}
              colunas={[
                { key: 'nome', label: 'Curso', tipo: 'texto' },
                { key: 'area', label: '\u00c1rea', tipo: 'texto', largura: '90px' },
                { key: 'turmas', label: 'Turmas', tipo: 'numero' },
                { key: 'mediaPorTurma', label: 'M\u00e9dia/Turma', tipo: 'numero' },
                { key: 'instituicoes', label: 'Ensino Superior', tipo: 'numero', largura: '60px' },
              ]}
              linhasVisiveis={10}
            />
          </div>
        </CardInsight>
      </div>

      {/* 5. GRUPOS EDUCACIONAIS */}
      <SectionLabel num="5" label="Grupos Educacionais" cor={CORES.laranja} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Grupos Educacionais (Mantenedoras)"
          cor={CORES.laranja}
          icone={<Building2 size={16} />}
          resumo={[
            { label: 'Grupos', valor: fmtInteiro(gruposEducacionais.length), cor: CORES.laranja },
            { label: 'Total Turmas', valor: fmtInteiro(gruposEducacionais.reduce((s, g) => s + g.turmas, 0)), cor: '#ADB5BD' },
          ]}
        >
          <div style={{ marginTop: 14 }}>
            {/* Bar chart - top instituicoes por turmas */}
            <div style={{ height: 200, marginBottom: 16 }}>
              <Bar data={instBarData} options={{
                ...miniChartOpts,
                indexAxis: 'x' as const,
                plugins: { ...miniChartOpts.plugins, datalabels: {
                  color: '#F8F9FA', font: { size: 8, weight: 'bold' as const },
                  anchor: 'end' as const, align: 'top' as const,
                  formatter: (v: number) => fmtInteiro(v),
                } },
              }} />
            </div>
            {/* Tabela completa */}
            <TabelaRanking
              titulo=""
              dados={gruposEducacionais}
              colunas={[
                { key: 'nome', label: 'Grupo', tipo: 'texto' },
                { key: 'turmas', label: 'Turmas', tipo: 'numero' },
                { key: 'matriculas', label: 'Matr\u00edculas', tipo: 'numero' },
                { key: 'percentual', label: '% Total', tipo: 'percentual' },
              ]}
              linhasVisiveis={10}
            />
          </div>
        </CardInsight>
      </div>

      {/* 6. GEOGRAFIA */}
      <SectionLabel num="6" label="Distribuição Geográfica" cor={CORES.verde} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
        <MapaBrasil
          dados={distribuicaoEstados}
          metrica="turmas"
          cidades={cidadesPorEstado}
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
        />
        <TabelaRanking
          titulo="Ranking por Estado — Turmas"
          dados={distribuicaoEstados}
          colunas={rankEstadoColunas}
          linhasVisiveis={10}
        />
      </div>
    </div>
  );
}
