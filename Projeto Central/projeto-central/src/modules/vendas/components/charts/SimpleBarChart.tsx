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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface SimpleBarChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  horizontal?: boolean;
  onBarClick?: (label: string) => void;
  formatValue?: (value: number) => string;
  datasetLabel?: string;
}

const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' mi';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(0) + 'k';
  }
  return value.toLocaleString('pt-BR');
};

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
  data,
  horizontal = false,
  onBarClick,
  formatValue = formatNumber,
  datasetLabel = 'Valor',
}) => {
  const chartData = useMemo(() => ({
    labels: data.labels,
    datasets: [
      {
        label: datasetLabel,
        data: data.values,
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
        barThickness: horizontal ? 20 : undefined,
      },
    ],
  }), [data, horizontal, datasetLabel]);

  const maxValue = useMemo(() => Math.max(...data.values) * 1.2, [data.values]);

  const options = useMemo(() => ({
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleColor: '#F8F9FA',
        bodyColor: '#F8F9FA',
        titleFont: { size: 18, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        bodyFont: { size: 16, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        cornerRadius: 6,
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12,
        callbacks: {
          label: (context: any) => {
            const labelName = context.dataset.label || 'Valor';
            const value = context.parsed[horizontal ? 'x' : 'y'];
            return ` ${labelName}: ${formatValue(value)}`;
          },
        },
      },
      datalabels: {
        color: '#FFFFFF',
        font: { size: 15, weight: 'bold' as const, family: 'Poppins, Arial, sans-serif' },
        anchor: 'end' as const,
        align: 'end' as const,
        formatter: (value: number) => {
          if (!value || value === 0) return '';
          return formatValue(value);
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: horizontal ? maxValue : undefined,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, Arial, sans-serif' },
          callback: horizontal 
            ? (value: any) => formatValue(Number(value)) 
            : function(this: any, value: any) { return this.getLabelForValue(value); },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        beginAtZero: !horizontal,
        max: !horizontal ? maxValue : undefined,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, Arial, sans-serif' },
          callback: !horizontal 
            ? (value: any) => formatValue(Number(value)) 
            : function(this: any, value: any) { return this.getLabelForValue(value); },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0 && onBarClick) {
        const index = elements[0].index;
        onBarClick(data.labels[index]);
      }
    },
  }), [data, horizontal, maxValue, onBarClick, formatValue]);

  return <Bar data={chartData} options={options} />;
};

