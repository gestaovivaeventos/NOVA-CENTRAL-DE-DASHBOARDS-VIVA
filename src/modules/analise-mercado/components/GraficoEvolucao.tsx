/**
 * GraficoEvolucao - Gráfico de evolução do mercado
 * Mostra evolução de matriculados/concluintes ao longo do tempo
 */

import React from 'react';
import { Line } from 'react-chartjs-2';
import type { DadosEvolucaoMercado } from '../types';

interface GraficoEvolucaoProps {
  dados: DadosEvolucaoMercado[];
  tipo: 'matriculados' | 'concluintes' | 'modalidade';
  titulo: string;
}

export default function GraficoEvolucao({ dados, tipo, titulo }: GraficoEvolucaoProps) {
  const labels = dados.map(d => d.ano.toString());

  const getDatasets = () => {
    if (tipo === 'matriculados') {
      return [
        {
          label: 'Total',
          data: dados.map(d => d.matriculados_total / 1000000),
          borderColor: '#FF6600',
          backgroundColor: 'rgba(255, 102, 0, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Presencial',
          data: dados.map(d => d.matriculados_presencial / 1000000),
          borderColor: '#3B82F6',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [5, 5],
        },
        {
          label: 'EAD',
          data: dados.map(d => d.matriculados_ead / 1000000),
          borderColor: '#8B5CF6',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderDash: [5, 5],
        },
      ];
    }

    if (tipo === 'concluintes') {
      return [
        {
          label: 'Total',
          data: dados.map(d => d.concluintes_total / 1000),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Presencial',
          data: dados.map(d => d.concluintes_presencial / 1000),
          borderColor: '#3B82F6',
          backgroundColor: 'transparent',
          tension: 0.4,
        },
        {
          label: 'EAD',
          data: dados.map(d => d.concluintes_ead / 1000),
          borderColor: '#8B5CF6',
          backgroundColor: 'transparent',
          tension: 0.4,
        },
      ];
    }

    // Modalidade (comparação Presencial x EAD)
    return [
      {
        label: 'Presencial',
        data: dados.map(d => d.matriculados_presencial / 1000000),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'EAD',
        data: dados.map(d => d.matriculados_ead / 1000000),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ];
  };

  const data = {
    labels,
    datasets: getDatasets(),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ADB5BD',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: '#343A40',
        titleColor: '#F8F9FA',
        bodyColor: '#ADB5BD',
        borderColor: '#495057',
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            const suffix = tipo === 'concluintes' ? 'K' : 'M';
            return `${context.dataset.label}: ${value.toFixed(2)}${suffix}`;
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ADB5BD',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#ADB5BD',
          callback: (value: any) => {
            const suffix = tipo === 'concluintes' ? 'K' : 'M';
            return `${value}${suffix}`;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #495057',
      }}
    >
      <h3 style={{ 
        color: '#F8F9FA', 
        fontSize: '1.1rem', 
        fontWeight: 600, 
        marginBottom: '20px',
        fontFamily: 'Poppins, sans-serif'
      }}>
        {titulo}
      </h3>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
