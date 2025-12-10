/**
 * Gráfico de Barra Empilhada Horizontal 100%
 * Para mostrar distribuição de tipos de captação
 */

import React from 'react';
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

interface TipoCaptacaoData {
  tipo: string;
  total: number;
  percentual: number;
}

interface CaptacaoStackedBarProps {
  dados: TipoCaptacaoData[];
  titulo?: string;
  height?: number;
}

// Cores para os tipos de captação (padrão: laranja, amarelo, cinza)
const CORES_CAPTACAO: Record<string, string> = {
  'Captação Ativa': '#FF6600',
  'Captação Passiva': '#6c757d',
  'Captação Passiva - Exclusiva Viva BR': '#FFC107',
};

export const CaptacaoStackedBar: React.FC<CaptacaoStackedBarProps> = ({
  dados,
  titulo,
  height = 80,
}) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-text-muted">
        Nenhum dado disponível
      </div>
    );
  }

  // Calcular total para percentuais
  const total = dados.reduce((acc, d) => acc + d.total, 0);

  // Criar dataset para barra empilhada horizontal
  const datasets = dados.map((d, index) => ({
    label: d.tipo,
    data: [d.total],
    backgroundColor: CORES_CAPTACAO[d.tipo] || `hsl(${index * 60}, 70%, 50%)`,
    borderRadius: 0,
    barPercentage: 0.8,
    categoryPercentage: 1,
  }));

  const data = {
    labels: [''],
    datasets,
  };

  const options: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    plugins: {
      legend: {
        display: false, // Desabilitado - usando legenda customizada com %
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F8F9FA',
        bodyColor: '#F8F9FA',
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const percent = ((value / total) * 100).toFixed(1);
            return `${context.dataset.label}: ${value.toLocaleString('pt-BR')} (${percent}%)`;
          },
        },
      },
      datalabels: {
        color: '#FFFFFF',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        formatter: (value: number) => {
          const percent = ((value / total) * 100).toFixed(0);
          return parseInt(percent) >= 10 ? `${percent}%` : '';
        },
        anchor: 'center' as const,
        align: 'center' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
        display: false,
        max: total,
      },
      y: {
        stacked: true,
        display: false,
      },
    },
  };

  return (
    <div>
      {titulo && (
        <h4 className="text-sm text-text-muted mb-2">{titulo}</h4>
      )}
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
      {/* Legenda com valores */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {dados.map((d, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: CORES_CAPTACAO[d.tipo] || `hsl(${index * 60}, 70%, 50%)` }}
            />
            <span className="text-text-secondary">{d.tipo}:</span>
            <span className="text-text-primary font-medium">
              {d.total.toLocaleString('pt-BR')} ({((d.total / total) * 100).toFixed(1)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

