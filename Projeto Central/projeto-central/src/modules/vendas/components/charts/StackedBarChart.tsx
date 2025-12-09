/**
 * Componente StackedBarChart - Gráfico de barras empilhadas (Venda/Pós-Venda)
 * Usado para: Venda Realizada Total Anual e Venda Realizada Total Mensal
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

interface StackedDataPoint {
  label: string;
  vendas: number;
  posVendas: number;
}

interface StackedBarChartProps {
  data: StackedDataPoint[];
  title?: string;
  horizontal?: boolean;
  onBarClick?: (label: string) => void;
  /** Se true, formata valores como contagem inteira ao invés de moeda (para gráficos de adesões) */
  isCountChart?: boolean;
}

export default function StackedBarChart({ 
  data, 
  title, 
  horizontal = false,
  onBarClick,
  isCountChart = false
}: StackedBarChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Pós Venda',
        data: data.map(d => d.posVendas),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#6c757d';
          
          const gradient = horizontal
            ? ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
            : ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          
          gradient.addColorStop(0, '#868e96');
          gradient.addColorStop(0.5, '#6c757d');
          gradient.addColorStop(1, '#495057');
          return gradient;
        },
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: 'Venda',
        data: data.map(d => d.vendas),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#FF6600';
          
          const gradient = horizontal
            ? ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
            : ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          
          gradient.addColorStop(0, '#ff8a33');
          gradient.addColorStop(0.5, '#FF6600');
          gradient.addColorStop(1, '#e65500');
          return gradient;
        },
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  }), [data, horizontal]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    interaction: {
      mode: horizontal ? 'y' as const : 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: COLORS.TEXT,
          font: { size: 14, family: 'Poppins, sans-serif' },
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      datalabels: {
        color: function(context: any) {
          return context.dataset.label === 'Pós Venda' ? '#212529' : '#FFFFFF';
        },
        font: { weight: 'bold' as const, size: 15, family: 'Poppins, sans-serif' },
        anchor: 'center' as const,
        align: 'center' as const,
        formatter: function(value: number) {
          if (!value || value === 0) return '';
          if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.0', '')}mi`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
          return value.toString();
        },
        display: function(context: any) {
          return context.dataset.data[context.dataIndex] > 0;
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: COLORS.TEXT,
        bodyColor: COLORS.TEXT,
        footerColor: '#FF6600',
        bodyFont: { size: 16, family: 'Poppins, sans-serif', weight: 'bold' as const },
        titleFont: { size: 18, family: 'Poppins, sans-serif', weight: 'bold' as const },
        footerFont: { size: 18, family: 'Poppins, sans-serif', weight: 'bold' as const },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            if (isCountChart) {
              // Para gráficos de contagem (adesões), mostrar número inteiro
              return `${context.dataset.label}: ${Math.round(value).toLocaleString('pt-BR')}`;
            }
            return `${context.dataset.label}: ${formatCurrency(value)}`;
          },
          footer: function(tooltipItems: any[]) {
            const sum = tooltipItems.reduce((acc, item) => acc + item.raw, 0);
            if (isCountChart) {
              // Para gráficos de contagem (adesões), mostrar número inteiro
              return `Total: ${Math.round(sum).toLocaleString('pt-BR')}`;
            }
            return `Total: ${formatCurrency(sum)}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
          callback: function(this: any, value: any) {
            if (horizontal) {
              const num = Number(value);
              if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}mi`;
              if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
              return num;
            }
            return this.getLabelForValue(value);
          },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        stacked: true,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
          callback: function(this: any, value: any) {
            if (!horizontal) {
              const num = Number(value);
              if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}mi`;
              if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
              return num;
            }
            // Para gráfico horizontal, retornar o label (ano)
            return this.getLabelForValue(value);
          },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onBarClick) {
        const label = data[elements[0].index].label;
        onBarClick(label);
      }
    },
  }), [data, horizontal, onBarClick, isCountChart]);

  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-text-muted">
        Sem dados disponíveis
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <Bar data={chartData} options={options} />
    </div>
  );
}

