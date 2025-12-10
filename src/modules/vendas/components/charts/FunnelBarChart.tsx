/**
 * Gráfico de Barras Horizontais para Funil
 * Usado para Negociações por Fase e Perdas por Fase
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

interface FaseData {
  fase: string;
  quantidade: number;
  cor: string;
}

interface FunnelBarChartProps {
  dados: FaseData[];
  titulo?: string;
  height?: number;
}

export const FunnelBarChart: React.FC<FunnelBarChartProps> = ({
  dados,
  titulo,
  height = 500,
}) => {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Nenhum dado disponível
      </div>
    );
  }

  const data = {
    labels: dados.map(d => d.fase),
    datasets: [
      {
        label: 'Quantidade',
        data: dados.map(d => d.quantidade),
        backgroundColor: dados.map(d => d.cor),
        borderColor: dados.map(d => d.cor),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: any = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 60,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!titulo,
        text: titulo,
        color: '#F8F9FA',
        font: {
          size: 18,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#F8F9FA',
        bodyColor: '#F8F9FA',
        titleFont: {
          size: 18,
          weight: 'bold' as const,
          family: 'Poppins, Arial, sans-serif',
        },
        bodyFont: {
          size: 16,
          weight: 'bold' as const,
          family: 'Poppins, Arial, sans-serif',
        },
        padding: 12,
        cornerRadius: 8,
      },
      datalabels: {
        anchor: 'end' as const,
        align: 'right' as const,
        color: '#F8F9FA',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        formatter: (value: number) => value.toLocaleString('pt-BR'),
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#F8F9FA',
          font: {
            size: 14,
          },
          stepSize: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
      },
      y: {
        ticks: {
          color: '#F8F9FA',
          font: {
            size: 14,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};

// Cores padrão para as fases do funil (laranja)
export const CORES_FASES_FUNIL = [
  { nome: '1.1 Qualificação do Lead', cor: '#FFE082' },
  { nome: '1.2 Qualificação Comissão', cor: '#FFCC02' },
  { nome: '1.3 Reunião Agendada', cor: '#FFC107' },
  { nome: '2.1 Diagnóstico Realizado', cor: '#FF9800' },
  { nome: '2.2 Apresentação Proposta', cor: '#F57C00' },
  { nome: '3.1 Proposta Enviada', cor: '#EF6C00' },
  { nome: '3.2 Apresentação Turma', cor: '#E65100' },
  { nome: '3.3 Gerar Contrato', cor: '#D84315' },
  { nome: '4.1 Fechamento Comissão', cor: '#BF360C' },
  { nome: '4.1.1 Indicação', cor: '#A6300C' },
  { nome: '5.1 Captação de Adesões', cor: '#942A09' },
  { nome: '6.2 Novo Cliente Concluído', cor: '#8A2A0B' },
  { nome: '7.2 Perdido', cor: '#D32F2F' },
];

// Cores para perdas (vermelho)
export const CORES_FASES_PERDAS = [
  { nome: '1.1 Qualificação do Lead', cor: '#FFCDD2' },
  { nome: '1.2 Qualificação Comissão', cor: '#EF9A9A' },
  { nome: '1.3 Reunião Agendada', cor: '#E57373' },
  { nome: '2.1 Diagnóstico Realizado', cor: '#EF5350' },
  { nome: '2.2 Apresentação Proposta', cor: '#F44336' },
  { nome: '3.1 Proposta Enviada', cor: '#E53935' },
  { nome: '3.2 Apresentação Turma', cor: '#D32F2F' },
  { nome: '3.3 Gerar Contrato', cor: '#C62828' },
  { nome: '4.1 Fechamento Comissão', cor: '#B71C1C' },
  { nome: '5.1 Captação de Adesões', cor: '#8D1F1F' },
];

// Helper para obter cor da fase
export function getCorFase(fase: string, tipo: 'funil' | 'perdas' = 'funil'): string {
  const cores = tipo === 'funil' ? CORES_FASES_FUNIL : CORES_FASES_PERDAS;
  const faseConfig = cores.find(f => f.nome === fase);
  return faseConfig?.cor || (tipo === 'funil' ? '#FF8F00' : '#E53935');
}

