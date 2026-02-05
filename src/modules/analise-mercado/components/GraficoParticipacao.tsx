/**
 * GraficoParticipacao - Gráfico de participação de mercado Viva
 * Mostra evolução do market share
 */

import React from 'react';
import { Bar } from 'react-chartjs-2';
import type { ParticipacaoMercado } from '../types';

interface GraficoParticipacaoProps {
  dados: ParticipacaoMercado[];
  titulo: string;
}

export default function GraficoParticipacao({ dados, titulo }: GraficoParticipacaoProps) {
  const labels = dados.map(d => d.ano.toString());

  const data = {
    labels,
    datasets: [
      {
        label: 'Share Total',
        data: dados.map(d => d.participacao_total),
        backgroundColor: '#FF6600',
        borderRadius: 4,
      },
      {
        label: 'Share Presencial',
        data: dados.map(d => d.participacao_presencial),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
      {
        label: 'Share Medicina',
        data: dados.map(d => d.participacao_medicina),
        backgroundColor: '#8B5CF6',
        borderRadius: 4,
      },
    ],
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
            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
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
          display: false,
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
          callback: (value: any) => `${value}%`,
        },
      },
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
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
