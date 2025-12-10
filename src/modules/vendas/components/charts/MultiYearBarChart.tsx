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

interface MultiYearBarChartProps {
  data: {
    year: number;
    monthlyData: number[];
  }[];
  activeYears: number[];
  onYearToggle: (year: number) => void;
  formatValue?: (value: number) => string;
}

// Paleta de cores degradê cinza -> amarelo -> laranja
const generatePalette = (count: number): string[] => {
  if (count <= 1) return ['#FF6600'];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    if (t <= 0.5) {
      // Cinza para amarelo
      const localT = t / 0.5;
      const r = Math.round(108 + (255 - 108) * localT);
      const g = Math.round(117 + (179 - 117) * localT);
      const b = Math.round(125 + (0 - 125) * localT);
      colors.push(`rgb(${r},${g},${b})`);
    } else {
      // Amarelo para laranja
      const localT = (t - 0.5) / 0.5;
      const r = Math.round(255 + (255 - 255) * localT);
      const g = Math.round(179 + (102 - 179) * localT);
      const b = Math.round(0 + (0 - 0) * localT);
      colors.push(`rgb(${r},${g},${b})`);
    }
  }
  return colors;
};

// Função para ajustar o brilho de uma cor RGB
const adjustColorBrightness = (color: string, amount: number): string => {
  // Extrair valores RGB da cor
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return color;
  
  let r = parseInt(match[1], 10);
  let g = parseInt(match[2], 10);
  let b = parseInt(match[3], 10);
  
  // Ajustar brilho
  r = Math.min(255, Math.max(0, r + amount));
  g = Math.min(255, Math.max(0, g + amount));
  b = Math.min(255, Math.max(0, b + amount));
  
  return `rgb(${r}, ${g}, ${b})`;
};

const formatNumber = (value: number): string => {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1).replace('.0', '') + ' mi';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1).replace('.0', '') + 'k';
  }
  return value.toLocaleString('pt-BR');
};

export const MultiYearBarChart: React.FC<MultiYearBarChartProps> = ({
  data,
  activeYears,
  onYearToggle,
  formatValue = formatNumber,
}) => {
  const monthLabels = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  const allYears = useMemo(() => data.map(d => d.year).sort(), [data]);
  const palette = useMemo(() => generatePalette(allYears.length), [allYears.length]);

  const chartData = useMemo(() => ({
    labels: monthLabels,
    datasets: data
      .filter(yearData => activeYears.includes(yearData.year))
      .map((yearData) => {
        const index = allYears.indexOf(yearData.year);
        const baseColor = palette[index];
        return {
          label: String(yearData.year),
          data: yearData.monthlyData,
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return baseColor;
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            // Criar variações mais claras e escuras da cor base
            gradient.addColorStop(0, adjustColorBrightness(baseColor, 30));
            gradient.addColorStop(0.5, baseColor);
            gradient.addColorStop(1, adjustColorBrightness(baseColor, -30));
            return gradient;
          },
          borderRadius: 4,
          datalabels: {
            display: true,
            anchor: 'end' as const,
            align: 'top' as const,
            offset: 2,
            color: '#FFFFFF',
            backgroundColor: 'rgba(33, 37, 41, 0.85)',
            borderRadius: 4,
            padding: 3,
            font: { size: 12, weight: 'bold' as const, family: 'Poppins, Arial, sans-serif' },
            formatter: (value: number) => {
              if (!value || value === 0) return '';
              return formatValue(value);
            },
          },
        };
      }),
  }), [data, activeYears, palette, allYears, formatValue]);

  const options: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
          usePointStyle: true,
          boxWidth: 12,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.85)',
        titleFont: { size: 18, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        bodyFont: { size: 16, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${formatValue(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, Arial, sans-serif' },
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14, family: 'Poppins, Arial, sans-serif' },
          callback: (value: any) => formatValue(Number(value)),
        },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
    },
  }), [formatValue]);

  return (
    <div className="flex flex-col h-full">
      {/* Seletor de anos */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allYears.map((year) => (
          <button
            key={year}
            onClick={() => onYearToggle(year)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeYears.includes(year)
                ? 'bg-orange-500/10 border border-orange-500 text-orange-500'
                : 'text-gray-400 border border-transparent bg-dark-tertiary hover:bg-white/5'
              }
            `}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

