/**
 * Componente TicketMedioChart - Gráfico de Ticket Médio (barras horizontais)
 * Usado para: Ticket Médio Anual e Ticket Médio Mensal
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

interface TicketDataPoint {
  label: string;
  ticketMedio: number;
}

interface TicketMedioChartProps {
  data: TicketDataPoint[];
  title?: string;
  horizontal?: boolean;
  onBarClick?: (label: string) => void;
}

export default function TicketMedioChart({ 
  data, 
  title, 
  horizontal = true,
  onBarClick 
}: TicketMedioChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Ticket Médio',
        data: data.map(d => d.ticketMedio),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#FF6600';
          
          // Gradiente vertical (top to bottom) para barras verticais
          // Gradiente horizontal (left to right) para barras horizontais
          const gradient = horizontal
            ? ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
            : ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          
          gradient.addColorStop(0, '#ff8a33');
          gradient.addColorStop(0.5, '#FF6600');
          gradient.addColorStop(1, '#e65500');
          return gradient;
        },
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }), [data, horizontal]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'end' as const,
        color: COLORS.TEXT,
        font: { weight: 'bold' as const, size: 15, family: 'Poppins, sans-serif' },
        formatter: function(value: number) {
          if (!value || value === 0) return '';
          if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.0', '')}k`;
          return value.toLocaleString('pt-BR');
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: COLORS.TEXT,
        bodyColor: COLORS.TEXT,
        bodyFont: { size: 16, family: 'Poppins, sans-serif', weight: 'bold' as const },
        titleFont: { size: 18, family: 'Poppins, sans-serif', weight: 'bold' as const },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            return `Ticket Médio: ${formatCurrency(context.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        beginAtZero: horizontal,
        afterDataLimits: horizontal ? (scale: any) => { scale.max *= 1.2; } : undefined,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
          callback: horizontal 
            ? function(value: any) {
                // Para gráficos horizontais, eixo X mostra valores numéricos
                const num = Number(value);
                if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}mi`;
                if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return num;
              }
            : function(this: any, value: any) { return this.getLabelForValue(value); },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        display: true,
        beginAtZero: !horizontal,
        afterDataLimits: !horizontal ? (scale: any) => { scale.max *= 1.15; } : undefined,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
          callback: !horizontal 
            ? function(value: any) {
                // Para gráficos verticais, eixo Y mostra valores numéricos
                const num = Number(value);
                if (Math.abs(num) >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}mi`;
                if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}k`;
                return num;
              }
            : function(this: any, value: any) { return this.getLabelForValue(value); },
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
  }), [data, horizontal, onBarClick]);

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

