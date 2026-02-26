/**
 * SecaoGenero — Métricas de Gênero (INEP)
 * Evolução histórica + distribuição atual + donuts
 */

import React from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import type { DadosEvolucaoAnual, DadosDemografia } from '../types';
import { fmtNum, fmtPct, CORES } from '../utils/formatters';

interface SecaoGeneroProps {
  evolucao: DadosEvolucaoAnual[];
  demografia: DadosDemografia;
}

export default function SecaoGenero({ evolucao, demografia }: SecaoGeneroProps) {
  // Evolução gênero por ano
  const evolucaoGeneroData = {
    labels: evolucao.map(e => e.ano.toString()),
    datasets: [
      {
        label: 'Feminino',
        data: evolucao.map(e => e.genero.feminino),
        borderColor: CORES.rosa,
        backgroundColor: `${CORES.rosa}15`,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: CORES.rosa,
        borderWidth: 2.5,
      },
      {
        label: 'Masculino',
        data: evolucao.map(e => e.genero.masculino),
        borderColor: CORES.azul,
        backgroundColor: `${CORES.azul}15`,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: CORES.azul,
        borderWidth: 2.5,
      },
    ],
  };

  const ultimoAno = evolucao[evolucao.length - 1];
  const totalGenero = ultimoAno.genero.feminino + ultimoAno.genero.masculino;
  const pctFem = (ultimoAno.genero.feminino / totalGenero) * 100;
  const pctMas = (ultimoAno.genero.masculino / totalGenero) * 100;

  const donutGeneroData = {
    labels: ['Feminino', 'Masculino'],
    datasets: [{
      data: [ultimoAno.genero.feminino, ultimoAno.genero.masculino],
      backgroundColor: [CORES.rosa, CORES.azul],
      borderColor: '#343A40',
      borderWidth: 3,
    }],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: { display: false },
      datalabels: { display: false },
      tooltip: {
        backgroundColor: '#1a1d21',
        borderColor: '#495057',
        borderWidth: 1,
        titleColor: '#F8F9FA',
        bodyColor: '#ADB5BD',
        padding: 12,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#ADB5BD', padding: 12, font: { size: 11 } } },
      datalabels: {
        color: '#F8F9FA',
        font: { size: 13, weight: 'bold' },
        formatter: (value: number) => {
          const pct = (value / totalGenero) * 100;
          return `${pct.toFixed(1)}%`;
        },
      },
    },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
      {/* Evolução por gênero */}
      <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
        <h3 style={{
          color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: 12,
          fontFamily: "'Poppins', sans-serif",
        }}>
          Evolução por Gênero
        </h3>
        {/* Mini legenda */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CORES.rosa }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>Feminino</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: CORES.azul }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>Masculino</span>
          </div>
        </div>
        <div style={{ height: 240 }}>
          <Line data={evolucaoGeneroData} options={chartOptions} />
        </div>
      </div>

      {/* Donut + KPIs de gênero */}
      <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
        <h3 style={{
          color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: 12,
          textAlign: 'center', fontFamily: "'Poppins', sans-serif",
        }}>
          Distribuição por Gênero ({ultimoAno.ano})
        </h3>
        <div style={{ height: 180 }}>
          <Doughnut data={donutGeneroData} options={donutOptions} />
        </div>
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <div style={{
            textAlign: 'center', padding: '8px', borderRadius: 8,
            backgroundColor: `${CORES.rosa}10`, border: `1px solid ${CORES.rosa}30`,
          }}>
            <div style={{ color: CORES.rosa, fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
              {fmtNum(ultimoAno.genero.feminino)}
            </div>
            <div style={{ color: '#6C757D', fontSize: '0.65rem', marginTop: 2 }}>
              Feminino ({pctFem.toFixed(1)}%)
            </div>
          </div>
          <div style={{
            textAlign: 'center', padding: '8px', borderRadius: 8,
            backgroundColor: `${CORES.azul}10`, border: `1px solid ${CORES.azul}30`,
          }}>
            <div style={{ color: CORES.azul, fontSize: '1.1rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
              {fmtNum(ultimoAno.genero.masculino)}
            </div>
            <div style={{ color: '#6C757D', fontSize: '0.65rem', marginTop: 2 }}>
              Masculino ({pctMas.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
