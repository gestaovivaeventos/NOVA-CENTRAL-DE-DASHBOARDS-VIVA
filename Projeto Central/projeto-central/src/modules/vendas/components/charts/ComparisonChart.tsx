/**
 * Componente ComparisonChart - Gráfico de comparação (Ano atual vs anterior)
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
import { COLORS } from '@/modules/vendas/config/app.config';
import { formatCurrency } from '@/modules/vendas/utils/formatacao';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DataPoint {
  label: string;
  anoAtual: number;
  anoAnterior: number;
}

interface ComparisonChartProps {
  data: DataPoint[];
  title?: string;
  horizontal?: boolean;
}

export default function ComparisonChart({ 
  data, 
  title = 'Comparativo Ano a Ano',
  horizontal = false,
}: ComparisonChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [
      {
        label: `${new Date().getFullYear()}`,
        data: data.map(d => d.anoAtual),
        backgroundColor: COLORS.PRIMARY,
        borderColor: COLORS.PRIMARY,
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: `${new Date().getFullYear() - 1}`,
        data: data.map(d => d.anoAnterior),
        backgroundColor: 'rgba(108, 117, 125, 0.6)',
        borderColor: '#6c757d',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    indexAxis: horizontal ? 'y' as const : 'x' as const,
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
          afterBody: function(tooltipItems: any) {
            if (tooltipItems.length >= 2) {
              const atual = tooltipItems[0].raw;
              const anterior = tooltipItems[1].raw;
              if (anterior > 0) {
                const variacao = ((atual - anterior) / anterior) * 100;
                const sinal = variacao >= 0 ? '+' : '';
                return [`Variação: ${sinal}${variacao.toFixed(1)}%`];
              }
            }
            return [];
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { 
          color: '#F8F9FA',
          callback: horizontal ? function(value: any) {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          } : undefined,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
      y: {
        ticks: {
          color: '#F8F9FA',
          callback: !horizontal ? function(value: any) {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          } : undefined,
        },
        grid: { color: 'rgba(255,255,255,0.05)' },
      },
    },
  }), [title, horizontal]);

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

