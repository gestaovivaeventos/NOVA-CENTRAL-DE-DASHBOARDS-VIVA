/**
 * SecaoAlunos — Seção de Análises de Alunos (Mercado Brasil)
 * Evolução, distribuição geográfica (mapa), ranking cursos, demografia
 */

import React from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import MapaBrasil from './MapaBrasil';
import TabelaRanking from './TabelaRanking';

interface SecaoAlunosProps {
  dados: DadosAnaliseMercado;
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
}

export default function SecaoAlunos({ dados, filtros, onEstadoClick }: SecaoAlunosProps) {
  const { evolucaoAlunos, distribuicaoEstados, rankingCursos, demografia } = dados;

  // Dados para gráfico de evolução
  const evolucaoChartData = {
    labels: evolucaoAlunos.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Matrículas',
        data: evolucaoAlunos.map(e => e.matriculas),
        borderColor: CORES.azul,
        backgroundColor: 'rgba(59,130,246,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: CORES.azul,
      },
      {
        label: 'Concluintes',
        data: evolucaoAlunos.map(e => e.concluintes),
        borderColor: CORES.verde,
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [5, 5],
        pointRadius: 4,
        pointBackgroundColor: CORES.verde,
        yAxisID: 'y1',
      },
      {
        label: 'Ingressantes',
        data: evolucaoAlunos.map(e => e.ingressantes),
        borderColor: CORES.roxo,
        backgroundColor: 'transparent',
        tension: 0.4,
        borderDash: [3, 3],
        pointRadius: 3,
        pointBackgroundColor: CORES.roxo,
        yAxisID: 'y1',
      },
    ],
  };

  // Donut: Presencial vs EAD
  const ultimoAno = evolucaoAlunos[evolucaoAlunos.length - 1];
  const donutModalidadeData = {
    labels: ['Presencial', 'EAD'],
    datasets: [{
      data: [ultimoAno?.presencial || 0, ultimoAno?.ead || 0],
      backgroundColor: [CORES.verde, CORES.roxo],
      borderColor: '#343A40',
      borderWidth: 3,
    }],
  };

  // Donut: Pública vs Privada
  const donutInstituicaoData = {
    labels: ['Pública', 'Privada'],
    datasets: [{
      data: [ultimoAno?.publica || 0, ultimoAno?.privada || 0],
      backgroundColor: [CORES.azul, CORES.laranja],
      borderColor: '#343A40',
      borderWidth: 3,
    }],
  };

  // Barras horizontais: Ranking cursos top 10
  const top10Cursos = [...rankingCursos].sort((a, b) => b.matriculas - a.matriculas).slice(0, 10);
  const barCursosData = {
    labels: top10Cursos.map(c => c.nome),
    datasets: [{
      label: 'Matrículas',
      data: top10Cursos.map(c => c.matriculas),
      backgroundColor: CORES.laranja,
      borderRadius: 4,
    }],
  };

  // Demografia - Faixa Etária
  const barIdadeData = {
    labels: demografia.faixaEtaria.map(f => f.faixa),
    datasets: [{
      label: 'Alunos',
      data: demografia.faixaEtaria.map(f => f.total),
      backgroundColor: CORES.azul,
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
      {/* Título da seção */}
      <h2 style={{
        color: '#F8F9FA', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', borderBottom: '2px solid #3B82F6', paddingBottom: 8,
        marginBottom: 20, fontFamily: "'Poppins', sans-serif",
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#3B82F6' }}>●</span> Análise de Alunos — Mercado Brasil
      </h2>

      {/* Grid: Gráfico Evolução + Tabela Evolução */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 20 }}>
        {/* Tabela de Evolução */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, overflow: 'hidden', border: '1px solid #495057' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #495057' }}>
            <h3 style={{ color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
              Evolução Anual — Alunos
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2D3238' }}>
                  {['Ano', 'Matrículas', 'Concluintes', 'Ingressantes', 'Presencial', 'EAD', 'Pública', 'Privada'].map((h, i) => (
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
                {evolucaoAlunos.map((e, i) => (
                  <tr key={e.ano} style={{
                    borderBottom: '1px solid #3D4349',
                    backgroundColor: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}>
                    <td style={{ padding: '10px', textAlign: 'left', color: '#F8F9FA', fontWeight: 600 }}>{e.ano}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: CORES.azul, fontWeight: 600 }}>{fmtNum(e.matriculas)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: CORES.verde, fontWeight: 600 }}>{fmtNum(e.concluintes)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: CORES.roxo, fontWeight: 600 }}>{fmtNum(e.ingressantes)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtNum(e.presencial)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtNum(e.ead)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtNum(e.publica)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#ADB5BD' }}>{fmtNum(e.privada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Evolução gráfica + Donuts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Gráfico Evolução Matrículas/Concluintes */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Evolução Histórica
          </h3>
          <div style={{ height: 280 }}>
            <Line
              data={evolucaoChartData}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y: { ...chartOptions.scales.y, position: 'left' as const },
                  y1: {
                    position: 'right' as const,
                    ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) },
                    grid: { display: false },
                  },
                },
                interaction: { intersect: false, mode: 'index' as const },
              }}
            />
          </div>
        </div>

        {/* Donut: Modalidade */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
            Presencial vs EAD
          </h3>
          <div style={{ height: 220 }}>
            <Doughnut data={donutModalidadeData} options={donutOptions} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ color: '#6C757D', fontSize: '0.68rem' }}>
              Total: {fmtNum((ultimoAno?.presencial || 0) + (ultimoAno?.ead || 0))}
            </span>
          </div>
        </div>

        {/* Donut: Instituição */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textAlign: 'center', fontFamily: "'Poppins', sans-serif" }}>
            Pública vs Privada
          </h3>
          <div style={{ height: 220 }}>
            <Doughnut data={donutInstituicaoData} options={donutOptions} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <span style={{ color: '#6C757D', fontSize: '0.68rem' }}>
              Total: {fmtNum((ultimoAno?.publica || 0) + (ultimoAno?.privada || 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Mapa + Ranking Estados */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 20 }}>
        <MapaBrasil
          dados={distribuicaoEstados}
          metrica="matriculas"
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
        />

        <TabelaRanking
          titulo="Ranking por Estado"
          dados={distribuicaoEstados}
          colunas={[
            { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
            { key: 'matriculas', label: 'Matrículas', tipo: 'numero' },
            { key: 'concluintes', label: 'Concluintes', tipo: 'numero' },
            { key: 'percentual', label: '% Brasil', tipo: 'percentual' },
          ]}
          linhasVisiveis={10}
        />
      </div>

      {/* Grid: Ranking Cursos + Demografia */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Ranking Cursos — Barras Horizontais */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
          <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
            Top 10 Cursos por Matrículas
          </h3>
          <div style={{ height: 350 }}>
            <Bar
              data={barCursosData}
              options={{
                indexAxis: 'y' as const,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  datalabels: {
                    color: '#F8F9FA', font: { size: 10, weight: 'bold' },
                    anchor: 'end' as const, align: 'end' as const,
                    formatter: (v: number) => fmtNum(v),
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

        {/* Demografia */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Faixa Etária */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057', flex: 1 }}>
            <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, fontFamily: "'Poppins', sans-serif" }}>
              Distribuição por Idade
            </h3>
            <div style={{ height: 140 }}>
              <Bar data={barIdadeData} options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  datalabels: {
                    color: '#F8F9FA', font: { size: 9, weight: 'bold' as const },
                    anchor: 'end' as const, align: 'top' as const,
                    formatter: (v: number) => fmtNum(v),
                  },
                },
              }} />
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
