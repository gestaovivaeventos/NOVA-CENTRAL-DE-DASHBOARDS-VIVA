/**
 * Cards de Fundos por Saúde
 * Exibe 4 cards com totais de fundos por status de saúde
 */

import React from 'react';
import { formatNumber } from '@/modules/carteira/utils/formatacao';

interface SaudeCardsProps {
  fundosPorSaude: {
    critico: number;
    atencao: number;
    quaseLa: number;
    alcancada: number;
  };
  loading?: boolean;
}

// Cores para cada status de saúde
const SAUDE_CONFIG = {
  critico: { 
    label: 'Crítico', 
    color: '#ef4444', 
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    subtitulo: 'fundos em estado crítico',
  },
  atencao: { 
    label: 'Atenção', 
    color: '#f59e0b', 
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    subtitulo: 'fundos que precisam de atenção',
  },
  quaseLa: { 
    label: 'Quase lá', 
    color: '#3b82f6', 
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    subtitulo: 'fundos próximos da meta',
  },
  alcancada: { 
    label: 'Alcançada', 
    color: '#22c55e', 
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    subtitulo: 'fundos que atingiram a meta',
  },
};

// Skeleton para loading
const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div 
    className={`animate-pulse bg-gray-700 rounded ${className}`}
    style={{ opacity: 0.5 }}
  />
);

export default function SaudeCards({ fundosPorSaude, loading = false }: SaudeCardsProps) {
  // Calcular total de fundos
  const totalFundos = fundosPorSaude.critico + fundosPorSaude.atencao + fundosPorSaude.quaseLa + fundosPorSaude.alcancada;

  const cards = [
    { key: 'critico', value: fundosPorSaude.critico },
    { key: 'atencao', value: fundosPorSaude.atencao },
    { key: 'quaseLa', value: fundosPorSaude.quaseLa },
    { key: 'alcancada', value: fundosPorSaude.alcancada },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const config = SAUDE_CONFIG[card.key as keyof typeof SAUDE_CONFIG];
          return (
            <div 
              key={card.key}
              className="rounded-lg p-5 flex flex-col gap-2"
              style={{
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
              }}
            >
              <SkeletonPulse className="h-4 w-1/2" />
              <SkeletonPulse className="h-9 w-3/4" />
              <SkeletonPulse className="h-4 w-full" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const config = SAUDE_CONFIG[card.key as keyof typeof SAUDE_CONFIG];
        const percentual = totalFundos > 0 ? ((card.value / totalFundos) * 100).toFixed(1) : '0';
        
        return (
          <div 
            key={card.key}
            className="rounded-lg p-5 flex flex-col gap-2"
            style={{
              backgroundColor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
            }}
          >
            {/* Título */}
            <span 
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: config.color, fontFamily: "'Poppins', sans-serif" }}
            >
              {config.label}
            </span>
            
            {/* Valor Principal */}
            <span 
              className="text-3xl font-bold"
              style={{ color: config.color, fontFamily: "'Poppins', sans-serif" }}
            >
              {formatNumber(card.value)}
            </span>

            {/* Percentual em destaque */}
            <span 
              className="text-sm font-medium"
              style={{ color: config.color, fontFamily: "'Poppins', sans-serif" }}
            >
              {percentual}% do total
            </span>

            {/* Subtítulo */}
            <span 
              className="text-xs font-light"
              style={{ color: '#9ca3af', fontFamily: "'Poppins', sans-serif" }}
            >
              {config.subtitulo}
            </span>
          </div>
        );
      })}
    </div>
  );
}
