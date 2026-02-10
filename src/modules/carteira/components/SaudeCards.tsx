/**
 * Cards de Fundos por Saúde
 * Exibe 4 cards com totais de fundos por status de saúde
 * Visual neon em degradê com tooltips explicativos
 */

import React from 'react';
import { formatNumber } from '@/modules/carteira/utils/formatacao';
import { HelpCircle, AlertTriangle, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

interface SaudeCardsProps {
  fundosPorSaude: {
    critico: number;
    atencao: number;
    quaseLa: number;
    alcancada: number;
  };
  loading?: boolean;
}

// Configuração de cada status com gradientes suaves
const SAUDE_CONFIG = {
  critico: { 
    label: 'Crítico', 
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0.1) 100%)',
    shadowColor: 'rgba(239, 68, 68, 0.15)',
    tooltip: `Fundos classificados como críticos conforme tempo até o baile:
• Até 6 meses: menos de 90% do MAC
• Até 1 ano: menos de 80% do MAC
• Até 1 ano e meio: menos de 70% do MAC
• Até 2 anos: menos de 65% do MAC
• Mais de 2 anos: menos de 50% do MAC`,
    Icon: AlertTriangle,
  },
  atencao: { 
    label: 'Atenção', 
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0.1) 100%)',
    shadowColor: 'rgba(245, 158, 11, 0.15)',
    tooltip: `Fundos que precisam de monitoramento conforme tempo até o baile:
• Até 6 meses: entre 91% e 95% do MAC
• Até 1 ano: entre 81% e 85% do MAC
• Até 1 ano e meio: entre 71% e 80% do MAC
• Até 2 anos: entre 66% e 70% do MAC
• Mais de 2 anos: entre 50% e 60% do MAC`,
    Icon: AlertCircle,
  },
  quaseLa: { 
    label: 'Quase lá', 
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.1) 100%)',
    shadowColor: 'rgba(59, 130, 246, 0.15)',
    tooltip: `Fundos próximos da meta conforme tempo até o baile:
• Até 6 meses: entre 96% e 99% do MAC
• Até 1 ano: entre 86% e 99% do MAC
• Até 1 ano e meio: entre 81% e 99% do MAC
• Até 2 anos: entre 71% e 99% do MAC
• Mais de 2 anos: entre 61% e 99% do MAC`,
    Icon: TrendingUp,
  },
  alcancada: { 
    label: 'Meta Alcançada', 
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.03) 100%)',
    borderGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.1) 100%)',
    shadowColor: 'rgba(34, 197, 94, 0.15)',
    tooltip: `Fundos que atingiram ou superaram 100% da meta de alunos do contrato (MAC), independente do tempo restante até o baile.`,
    Icon: CheckCircle,
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
      <div>
        <h2 className="section-title">Saúde dos Fundos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const config = SAUDE_CONFIG[card.key as keyof typeof SAUDE_CONFIG];
            return (
              <div 
                key={card.key}
                className="rounded-lg p-5 flex flex-col gap-2"
                style={{
                  background: config.gradient,
                  border: '1px solid transparent',
                  borderImage: config.borderGradient,
                  borderImageSlice: 1,
                }}
              >
                <SkeletonPulse className="h-4 w-1/2" />
                <SkeletonPulse className="h-9 w-3/4" />
                <SkeletonPulse className="h-4 w-full" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Título sem tooltip */}
      <h2 className="section-title">Saúde dos Fundos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => {
          const config = SAUDE_CONFIG[card.key as keyof typeof SAUDE_CONFIG];
          const percentual = totalFundos > 0 ? ((card.value / totalFundos) * 100).toFixed(1) : '0';
          const Icon = config.Icon;
          // Para o último card (index 3), posicionar tooltip à esquerda para não cortar
          const isLastCard = index === 3;
          
          return (
            <div 
              key={card.key}
              className="rounded-xl p-4 flex flex-col gap-2 relative"
              style={{
                background: config.gradient,
                boxShadow: `0 2px 10px ${config.shadowColor}`,
                border: `1px solid ${config.color}20`,
              }}
            >
              {/* Ícone e Título com Tooltip */}
              <div className="flex items-center gap-2">
                <Icon size={16} style={{ color: config.color }} />
                <span 
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: config.color, fontFamily: "'Poppins', sans-serif" }}
                >
                  {config.label}
                </span>
                {/* Tooltip de ajuda */}
                <div className="relative group ml-auto">
                  <HelpCircle 
                    size={14} 
                    style={{ color: `${config.color}80`, cursor: 'help' }} 
                  />
                  <div 
                    className={`absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${isLastCard ? 'right-0' : 'left-1/2 transform -translate-x-1/2'}`}
                    style={{ width: '280px', whiteSpace: 'pre-line', zIndex: 9999 }}
                  >
                    {config.tooltip}
                    <div className={`absolute top-full border-4 border-transparent border-t-gray-900 ${isLastCard ? 'right-2' : 'left-1/2 transform -translate-x-1/2'}`}></div>
                  </div>
                </div>
              </div>
              
              {/* Valor Principal */}
              <span 
                className="text-2xl font-bold"
                style={{ color: config.color, fontFamily: "'Poppins', sans-serif" }}
              >
                {formatNumber(card.value)}
              </span>

              {/* Percentual do total */}
              <span 
                className="text-xs"
                style={{ color: '#9ca3af', fontFamily: "'Poppins', sans-serif" }}
              >
                {percentual}% do total
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
