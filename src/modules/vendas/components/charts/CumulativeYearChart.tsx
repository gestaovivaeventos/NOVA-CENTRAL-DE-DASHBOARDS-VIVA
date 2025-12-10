/**
 * Componente CumulativeYearChart - Gráfico de VVR Acumulado Anual (Comparativo)
 * Replica o gráfico original: linhas coloridas por ano com seletor de anos
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
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
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface YearData {
  ano: number;
  valores: number[]; // 12 meses, valores acumulados
}

interface CumulativeYearChartProps {
  data: YearData[];
  titulo?: string;
}

// Gerar paleta de cores (cinza -> amarelo -> laranja)
function generateColorPalette(count: number): string[] {
  if (count <= 1) return ['#FF6600'];
  if (count === 2) return ['#8a8a8a', '#FF6600'];
  if (count === 3) return ['#8a8a8a', '#ffc107', '#FF6600'];
  
  const colors: string[] = [];
  const startColor = { r: 138, g: 138, b: 138 }; // Cinza
  const midColor = { r: 255, g: 193, b: 7 };     // Amarelo
  const endColor = { r: 255, g: 102, b: 0 };     // Laranja
  
  for (let i = 0; i < count; i++) {
    const ratio = i / (count - 1);
    let r: number, g: number, b: number;
    
    if (ratio <= 0.5) {
      const localRatio = ratio * 2;
      r = Math.round(startColor.r + (midColor.r - startColor.r) * localRatio);
      g = Math.round(startColor.g + (midColor.g - startColor.g) * localRatio);
      b = Math.round(startColor.b + (midColor.b - startColor.b) * localRatio);
    } else {
      const localRatio = (ratio - 0.5) * 2;
      r = Math.round(midColor.r + (endColor.r - midColor.r) * localRatio);
      g = Math.round(midColor.g + (endColor.g - midColor.g) * localRatio);
      b = Math.round(midColor.b + (endColor.b - midColor.b) * localRatio);
    }
    
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }
  
  return colors;
}

// Labels dos meses abreviados
const MESES_LABELS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function CumulativeYearChart({
  data,
  titulo = 'VVR Acumulado Anual (Comparativo)',
}: CumulativeYearChartProps) {
  // Anos disponíveis
  const anosDisponiveis = useMemo(() => 
    data.map(d => d.ano).sort((a, b) => a - b),
  [data]);

  // Por padrão, selecionar os 2 últimos anos
  const [anosSelecionados, setAnosSelecionados] = useState<number[]>(() => {
    if (anosDisponiveis.length >= 2) {
      return anosDisponiveis.slice(-2);
    }
    return anosDisponiveis;
  });

  // Toggle de ano
  const toggleAno = (ano: number) => {
    setAnosSelecionados(prev => {
      if (prev.includes(ano)) {
        // Se for o único ano selecionado, não remover
        if (prev.length === 1) return prev;
        return prev.filter(a => a !== ano);
      }
      return [...prev, ano].sort((a, b) => a - b);
    });
  };

  // Dados filtrados pelos anos selecionados
  const dadosFiltrados = useMemo(() => 
    data.filter(d => anosSelecionados.includes(d.ano)),
  [data, anosSelecionados]);

  // Cores para cada ano
  const cores = useMemo(() => 
    generateColorPalette(dadosFiltrados.length),
  [dadosFiltrados.length]);

  // Dados do gráfico
  const chartData = useMemo(() => ({
    labels: MESES_LABELS,
    datasets: dadosFiltrados.map((yearData, index) => ({
      label: String(yearData.ano),
      data: yearData.valores,
      borderColor: cores[index],
      backgroundColor: `${cores[index]}33`,
      borderWidth: 3,
      pointBackgroundColor: cores[index],
      pointBorderColor: cores[index],
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      datalabels: {
        display: true,
        anchor: 'end' as const,
        align: 'top' as const,
        offset: 6,
        color: cores[index],
        backgroundColor: 'rgba(33, 37, 41, 0.85)',
        borderRadius: 4,
        padding: 4,
        font: { 
          size: 13, 
          weight: 'bold' as const, 
          family: 'Poppins, Arial, sans-serif' 
        },
        formatter: (value: number) => {
          if (!value || value === 0) return '';
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}mi`;
          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
          return value.toLocaleString('pt-BR');
        },
      },
    })),
  }), [dadosFiltrados, cores]);

  const options: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: COLORS.TEXT,
          font: { size: 16, family: 'Poppins, Arial, sans-serif' },
          usePointStyle: true,
        },
      },
      tooltip: {
        padding: 12,
        usePointStyle: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: COLORS.TEXT,
        bodyColor: COLORS.TEXT,
        borderColor: COLORS.PRIMARY,
        borderWidth: 1,
        titleFont: { size: 18, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        bodyFont: { size: 16, family: 'Poppins, Arial, sans-serif', weight: 'bold' as const },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#F8F9FA',
          font: { size: 14 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#F8F9FA',
          font: { size: 14 },
          callback: function(value: any) {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + ' mi';
            if (value >= 1000) return (value / 1000).toFixed(0) + ' K';
            return value;
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
    },
  }), []);

  return (
    <div className="bg-dark-secondary rounded-xl p-4">
      {/* Título */}
      <h2 className="section-title text-left">
        {titulo}
      </h2>

      {/* Seletor de anos */}
      {anosDisponiveis.length > 0 && (
        <div className="flex justify-start flex-wrap gap-2 mb-4">
          {anosDisponiveis.map(ano => (
            <button
              key={ano}
              onClick={() => toggleAno(ano)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${anosSelecionados.includes(ano)
                  ? 'bg-orange-500/10 border border-orange-500 text-orange-500'
                  : 'text-gray-400 border border-transparent bg-dark-tertiary hover:bg-white/5'
                }
              `}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {ano}
            </button>
          ))}
        </div>
      )}

      {/* Gráfico */}
      <div className="w-full h-80">
        {dadosFiltrados.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            Selecione pelo menos um ano para visualizar
          </div>
        )}
      </div>
    </div>
  );
}

