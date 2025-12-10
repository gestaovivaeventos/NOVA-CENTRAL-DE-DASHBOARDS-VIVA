/**
 * Componente CumulativeChart - Gráfico de evolução acumulada (linha)
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { COLORS } from '@/modules/vendas/config/app.config';
import { formatCurrency } from '@/modules/vendas/utils/formatacao';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface DataPoint {
  dia: number;
  acumulado: number;
  metaProjetada: number;
}

interface CumulativeChartProps {
  data: DataPoint[];
  title?: string;
  metaTotal?: number;
}

export default function CumulativeChart({ 
  data, 
  title = 'Evolução Acumulada',
  metaTotal = 0,
}: CumulativeChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => `Dia ${d.dia}`),
    datasets: [
      {
        label: 'Realizado Acumulado',
        data: data.map(d => d.acumulado),
        borderColor: COLORS.SUCCESS,
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
      },
      {
        label: 'Meta Projetada',
        data: data.map(d => d.metaProjetada),
        borderColor: COLORS.PRIMARY,
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      },
      ...(metaTotal > 0 ? [{
        label: 'Meta Total',
        data: data.map(() => metaTotal),
        borderColor: COLORS.DANGER,
        backgroundColor: 'transparent',
        borderDash: [10, 5],
        tension: 0,
        pointRadius: 0,
        borderWidth: 2,
      }] : []),
    ],
  }), [data, metaTotal]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: COLORS.TEXT,
          font: { size: 14 },
        },
      },
      title: {
        display: !!title,
        text: title,
        color: COLORS.TEXT,
        font: { size: 18, weight: 'bold' as const },
      },
      tooltip: {
        backgroundColor: COLORS.DARK_SECONDARY,
        titleColor: COLORS.TEXT,
        bodyColor: COLORS.TEXT,
        borderColor: COLORS.PRIMARY,
        borderWidth: 1,
        titleFont: { size: 18, weight: 'bold' as const, family: 'Poppins, Arial, sans-serif' },
        bodyFont: { size: 16, weight: 'bold' as const, family: 'Poppins, Arial, sans-serif' },
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
          },
        },
      },
      datalabels: {
        display: (context: any) => context.datasetIndex === 0, // Só mostrar para Realizado Acumulado
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#FFFFFF',
        font: {
          size: 12,
          weight: 'bold' as const,
          family: 'Poppins, Arial, sans-serif',
        },
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
          return value.toFixed(0);
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#F8F9FA' },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#F8F9FA',
          callback: function(value: any) {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          },
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), [title]);

  return (
    <div className="w-full h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}

