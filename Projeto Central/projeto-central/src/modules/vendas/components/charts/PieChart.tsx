/**
 * Componente PieChart - Gráfico de pizza/rosca
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { COLORS } from '@/modules/vendas/config/app.config';
import { formatCurrency, formatPercent } from '@/modules/vendas/utils/formatacao';

// Registrar componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface DataItem {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: DataItem[];
  title?: string;
  formatAsMoney?: boolean;
}

const CHART_COLORS = [
  '#FF6600',
  '#28A745',
  '#007BFF',
  '#FFC107',
  '#17A2B8',
  '#6C757D',
  '#DC3545',
  '#6610F2',
  '#E83E8C',
  '#20C997',
];

export default function PieChart({ data, title, formatAsMoney = true }: PieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: COLORS.DARK_PRIMARY,
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '50%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: COLORS.TEXT,
          font: { size: 13 },
          padding: 15,
          usePointStyle: true,
          generateLabels: function(chart: any) {
            const dataset = chart.data.datasets[0];
            return chart.data.labels.map((label: string, i: number) => {
              const value = dataset.data[i];
              const percent = total > 0 ? value / total : 0;
              return {
                text: `${label}: ${formatPercent(percent)}`,
                fillStyle: dataset.backgroundColor[i],
                strokeStyle: dataset.backgroundColor[i],
                hidden: false,
                index: i,
              };
            });
          },
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
            const value = context.raw;
            const percent = total > 0 ? value / total : 0;
            const valueStr = formatAsMoney ? formatCurrency(value) : value.toLocaleString('pt-BR');
            return `${context.label}: ${valueStr} (${formatPercent(percent)})`;
          },
        },
      },
    },
  }), [title, total, formatAsMoney]);

  if (data.length === 0 || total === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-text-muted">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

