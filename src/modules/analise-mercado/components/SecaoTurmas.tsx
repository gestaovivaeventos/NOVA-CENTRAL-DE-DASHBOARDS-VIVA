/**
 * SecaoTurmas — Seção de Análises de Turmas (Mercado Brasil)
 * TAM (Total Addressable Market) — cada turma = 1 contrato potencial
 */

import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import MapaBrasil from './MapaBrasil';
import TabelaRanking from './TabelaRanking';

interface SecaoTurmasProps {
  dados: DadosAnaliseMercado;
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
}

export default function SecaoTurmas({ dados, filtros, onEstadoClick }: SecaoTurmasProps) {
  const { evolucaoTurmas, turmasPorSemestre, distribuicaoEstados, rankingCursos, gruposEducacionais } = dados;

  const ultimoAno = evolucaoTurmas[evolucaoTurmas.length - 1];

  // Cards de turma (mini)
  const miniCards = [
    { label: 'Total de Turmas', valor: ultimoAno?.totalTurmas || 0, cor: CORES.laranja },
    { label: 'Média Alunos/Turma', valor: ultimoAno?.mediaPorTurma || 0, cor: CORES.azul },
    { label: 'Mediana Alunos/Turma', valor: ultimoAno?.medianaPorTurma || 0, cor: CORES.verde },
    { label: 'Turmas Presencial', valor: ultimoAno?.turmasPresencial || 0, cor: CORES.roxo },
    { label: 'Turmas EAD', valor: ultimoAno?.turmasEad || 0, cor: CORES.rosa },
  ];

  // Evolução do número de turmas
  const evolucaoChartData = {
    labels: evolucaoTurmas.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Total Turmas',
        data: evolucaoTurmas.map(e => e.totalTurmas),
        borderColor: CORES.laranja,
        backgroundColor: 'rgba(255,102,0,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: CORES.laranja,
      },
    ],
  };

  // Turmas por semestre (barras)
  const semestreChartData = {
    labels: turmasPorSemestre.map(s => s.periodo),
    datasets: [{
      label: 'Colações por Semestre',
      data: turmasPorSemestre.map(s => s.total),
      backgroundColor: turmasPorSemestre.map((_, i) => i % 2 === 0 ? CORES.azul : CORES.verde),
      borderRadius: 4,
    }],
  };

  // Donut: Presencial vs EAD (turmas)
  const donutModalidade = {
    labels: ['Presencial', 'EAD'],
    datasets: [{
      data: [ultimoAno?.turmasPresencial || 0, ultimoAno?.turmasEad || 0],
      backgroundColor: [CORES.verde, CORES.roxo],
      borderColor: '#343A40',
      borderWidth: 3,
    }],
  };

  // Donut: Pública vs Privada (turmas)
  const donutInstituicao = {
    labels: ['Pública', 'Privada'],
    datasets: [{
      data: [ultimoAno?.turmasPublica || 0, ultimoAno?.turmasPrivada || 0],
      backgroundColor: [CORES.azul, CORES.laranja],
      borderColor: '#343A40',
      borderWidth: 3,
    }],
  };

  // Ranking cursos por turmas
  const top10CursosTurmas = [...rankingCursos].sort((a, b) => b.turmas - a.turmas).slice(0, 10);
  const barCursosTurmas = {
    labels: top10CursosTurmas.map(c => c.nome),
    datasets: [{
      label: 'Turmas',
      data: top10CursosTurmas.map(c => c.turmas),
      backgroundColor: CORES.laranja,
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#ADB5BD', padding: 12, font: { size: 11 } } },
      datalabels: { display: false },
    },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#ADB5BD', padding: 12, font: { size: 11 } } },
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

  return (
    <div>
      {/* Título */}
      <h2 style={{
        color: '#F8F9FA', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', borderBottom: '2px solid #FF6600', paddingBottom: 8,
        marginBottom: 20, fontFamily: "'Poppins', sans-serif",
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#FF6600' }}>●</span> Análise de Turmas — Mercado Brasil (TAM)
      </h2>

      {/* Mini Cards Turmas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {miniCards.map(card => (
          <div key={card.label} style={{
            backgroundColor: '#343A40', borderRadius: 10, padding: 14,
            borderTop: `3px solid ${card.cor}`,
            textAlign: 'center',
          }}>
            <p style={{ color: '#6C757D', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 6px' }}>
              {card.label}
            </p>
            <div style={{
              color: card.cor, fontSize: '1.4rem', fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif",
            }}>
              {fmtNum(card.valor)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de Evolução de Turmas */}
      <div style={{ backgroundColor: '#343A40', borderRadius: 12, overflow: 'hidden', border: '1px solid #495057', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
            Evolução Anual — Turmas
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2D3238' }}>
                {['Ano', 'Total Turmas', 'Média/Turma', 'Presencial', 'EAD', 'Pública', 'Privada'].map((h, i) => (
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
              {evolucaoTurmas.map((e, i) => (
                <tr key={e.ano} style={{
                  borderBottom: '1px solid #3D4349',
                  backgroundColor: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                }}>
                  <td style={{ padding: '10px', textAlign: 'left', color: '#F8F9FA', fontWeight: 600 }}>{e.ano}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: CORES.laranja, fontWeight: 600 }}>{fmtInteiro(e.totalTurmas)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: CORES.azul, fontWeight: 600 }}>{e.mediaPorTurma}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPresencial)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasEad)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPublica)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtInteiro(e.turmasPrivada)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Evolução gráfico + Sazonalidade + Donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Evolução do total de turmas */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Evolução Anual de Turmas
          </h3>
          <div style={{ height: 260 }}>
            <Line data={evolucaoChartData} options={chartOptions} />
          </div>
        </div>

        {/* Sazonalidade por semestre */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Colações por Semestre
          </h3>
          <div style={{ height: 260 }}>
            <Bar data={semestreChartData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                datalabels: {
                  color: '#F8F9FA', font: { size: 10, weight: 'bold' as const },
                  anchor: 'end' as const, align: 'top' as const,
                  formatter: (v: number) => fmtNum(v),
                },
              },
            }} />
          </div>
        </div>
      </div>

      {/* Donuts: Modalidade + Instituição (turmas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
            Turmas: Presencial vs EAD
          </h3>
          <div style={{ height: 220 }}>
            <Doughnut data={donutModalidade} options={donutOptions} />
          </div>
        </div>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
            Turmas: Pública vs Privada
          </h3>
          <div style={{ height: 220 }}>
            <Doughnut data={donutInstituicao} options={donutOptions} />
          </div>
        </div>
      </div>

      {/* Grid: Mapa (turmas) + Ranking Estados */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 20 }}>
        <MapaBrasil
          dados={distribuicaoEstados}
          metrica="turmas"
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
        />

        <TabelaRanking
          titulo="Ranking por Estado (Turmas)"
          dados={distribuicaoEstados}
          colunas={[
            { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
            { key: 'turmas', label: 'Turmas', tipo: 'numero' },
            { key: 'instituicoes', label: 'IES', tipo: 'numero' },
            { key: 'percentual', label: '% Brasil', tipo: 'percentual' },
          ]}
          linhasVisiveis={10}
        />
      </div>

      {/* Grid: Ranking Cursos por Turmas + Grupos Educacionais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Top 10 Cursos por Turmas */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Top 10 Cursos por Volume de Turmas
          </h3>
          <div style={{ height: 350 }}>
            <Bar
              data={barCursosTurmas}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  datalabels: {
                    color: '#F8F9FA', font: { size: 10, weight: 'bold' },
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
        </div>

        {/* Grupos Educacionais */}
        <TabelaRanking
          titulo="Grupos Educacionais (Mantenedoras)"
          dados={gruposEducacionais}
          colunas={[
            { key: 'nome', label: 'Grupo', tipo: 'texto' },
            { key: 'turmas', label: 'Turmas', tipo: 'numero' },
            { key: 'matriculas', label: 'Matrículas', tipo: 'numero' },
            { key: 'percentual', label: '% Total', tipo: 'percentual' },
          ]}
          linhasVisiveis={10}
        />
      </div>
    </div>
  );
}
