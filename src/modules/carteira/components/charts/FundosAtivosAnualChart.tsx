/**
 * Gráfico de Fundos Ativos por Ano (barras horizontais)
 * Estilo igual ao TicketMedioChart do módulo vendas
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

interface FundosAnualDataPoint {
  ano: string;
  valor: number;
}

interface FundosAtivosAnualChartProps {
  data: FundosAnualDataPoint[];
  title?: string;
  suffix?: string; // Sufixo para o tooltip (ex: " fundos", "%")
  showSuffixOnScale?: boolean; // Se true, mostra suffix na escala e datalabels (para %)
  onBarClick?: (item: FundosAnualDataPoint) => void;
}

const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR');
};

export default function FundosAtivosAnualChart({ 
  data, 
  title,
  suffix = '',
  showSuffixOnScale = false,
  onBarClick 
}: FundosAtivosAnualChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => String(d.ano)),
    datasets: [
      {
        label: 'Média de Fundos Ativos',
        data: data.map(d => d.valor),
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return '#FF6600';
          
          // Gradiente horizontal (left to right) para barras horizontais
          const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
          gradient.addColorStop(0, '#ff8a33');
          gradient.addColorStop(0.5, '#FF6600');
          gradient.addColorStop(1, '#e65500');
          return gradient;
        },
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  }), [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
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
        color: '#F8F9FA',
        font: { weight: 'bold' as const, size: 15, family: 'Poppins, sans-serif' },
        formatter: function(value: number) {
          if (!value || value === 0) return '';
          return formatNumber(value) + (showSuffixOnScale ? suffix : '');
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#F8F9FA',
        bodyColor: '#F8F9FA',
        bodyFont: { size: 16, family: 'Poppins, sans-serif', weight: 'bold' as const },
        titleFont: { size: 18, family: 'Poppins, sans-serif', weight: 'bold' as const },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            return `Total: ${formatNumber(context.raw)}${suffix}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        beginAtZero: true,
        afterDataLimits: (scale: any) => { scale.max *= 1.2; },
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
          callback: function(value: any) {
            return formatNumber(Number(value)) + (showSuffixOnScale ? suffix : '');
          },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        display: true,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, sans-serif' },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onBarClick) {
        const item = data[elements[0].index];
        onBarClick(item);
      }
    },
  }), [data, onBarClick, suffix, showSuffixOnScale]);

  if (data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-gray-400">
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
