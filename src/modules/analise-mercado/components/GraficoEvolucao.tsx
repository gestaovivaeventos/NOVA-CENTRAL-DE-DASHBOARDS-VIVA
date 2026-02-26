/**
 * GraficoEvolucao — Gráfico de Linha comparativo
 * Mostra as métricas ativas selecionadas globalmente (1, 2 ou 3 linhas)
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import type { DadosEvolucaoAnual, MetricaAtiva } from '../types';
import { fmtNum, CORES } from '../utils/formatters';

interface MetricaConfig {
  key: MetricaAtiva;
  label: string;
  cor: string;
  borderDash?: number[];
}

const METRICAS: Record<MetricaAtiva, MetricaConfig> = {
  matriculas: { key: 'matriculas', label: 'Matriculados', cor: CORES.azul },
  concluintes: { key: 'concluintes', label: 'Concluintes', cor: CORES.verde, borderDash: [5, 5] },
  ingressantes: { key: 'ingressantes', label: 'Ingressantes', cor: CORES.roxo, borderDash: [3, 3] },
};

interface GraficoEvolucaoProps {
  dados: DadosEvolucaoAnual[];
  metricasAtivas: MetricaAtiva[];
}

export default function GraficoEvolucao({ dados, metricasAtivas }: GraficoEvolucaoProps) {
  const configs = metricasAtivas.map(k => METRICAS[k]);

  const chartData = {
    labels: dados.map(e => e.ano.toString()),
    datasets: configs.map(m => ({
      label: m.label,
      data: dados.map(e => e[m.key]),
      borderColor: m.cor,
      backgroundColor: `${m.cor}18`,
      tension: 0.4,
      fill: configs.length === 1,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: m.cor,
      borderDash: m.borderDash || [],
      borderWidth: 2.5,
    })),
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    plugins: {
      legend: {
        display: configs.length > 1,
        position: 'top' as const,
        labels: {
          color: '#ADB5BD', padding: 14,
          font: { size: 11, family: "'Poppins', sans-serif" },
          usePointStyle: true, pointStyleWidth: 12,
        },
      },
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
      x: {
        ticks: { color: '#6C757D', font: { size: 11, family: "'Poppins', sans-serif" } },
        grid: { display: false },
      },
      y: {
        position: 'left' as const,
        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmtNum(v) },
        grid: { color: '#3D4349' },
      },
    },
  };

  const titulo = configs.length === 1
    ? `Evolução Histórica — ${configs[0].label}`
    : `Evolução Histórica — Comparativo`;

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20, border: '1px solid #495057' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{
          color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          {titulo}
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          {configs.map(m => (
            <span key={m.key} style={{
              color: m.cor, fontSize: '0.72rem', fontWeight: 600,
              backgroundColor: `${m.cor}15`, padding: '4px 12px',
              borderRadius: 12, border: `1px solid ${m.cor}40`,
            }}>
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 320 }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
