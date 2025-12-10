/**
 * Componente VVRChart - Gráfico de Valor Vendido Realizado (barras)
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { COLORS } from '@/modules/vendas/config/app.config';
import { formatCurrency } from '@/modules/vendas/utils/formatacao';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface DataPoint {
  label: string;
  realizado: number;
  meta: number;
}

interface VVRChartProps {
  data: DataPoint[];
  title?: string;
}

export default function VVRChart({ data, title = 'Valor Vendido Realizado' }: VVRChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Realizado',
        data: data.map(d => d.realizado),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#FF6600';
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#ff8a33');
          gradient.addColorStop(0.5, '#FF6600');
          gradient.addColorStop(1, '#e65500');
          return gradient;
        },
        borderColor: COLORS.PRIMARY,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Meta',
        data: data.map(d => d.meta),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#6c757d';
          
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, '#868e96');
          gradient.addColorStop(0.5, '#6c757d');
          gradient.addColorStop(1, '#495057');
          return gradient;
        },
        borderColor: '#6c757d',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }), [data]);

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
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        color: '#FFFFFF',
        font: {
          size: 14,
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
  }), [title]);

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

