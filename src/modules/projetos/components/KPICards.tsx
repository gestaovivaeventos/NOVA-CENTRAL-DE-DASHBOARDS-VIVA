/**
 * Cards de resumo executivo (KPI Cards)
 * Total | Em Andamento | Passados | Finalizados | Cancelados
 */

import React from 'react';
import { ProjetosResumo } from '../types';
import { CARD_COLORS } from '../config/app.config';

interface KPICardsProps {
  resumo: ProjetosResumo;
}

interface CardItemProps {
  label: string;
  value: number;
  icon: string;
  bgColor: string;
  borderColor: string;
}

const CardItem: React.FC<CardItemProps> = ({ label, value, icon, bgColor, borderColor }) => (
  <div
    className="rounded-xl p-5 transition-all duration-300 hover:scale-[1.02]"
    style={{
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}33`,
      boxShadow: `0 4px 15px ${borderColor}15`,
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span
        className="text-3xl font-bold"
        style={{
          color: borderColor,
          fontFamily: "'Orbitron', 'Poppins', sans-serif",
        }}
      >
        {value}
      </span>
    </div>
    <p
      className="text-sm font-medium uppercase tracking-wide"
      style={{
        color: '#ADB5BD',
        fontFamily: "'Poppins', sans-serif",
        letterSpacing: '0.05em',
      }}
    >
      {label}
    </p>
  </div>
);

export const KPICards: React.FC<KPICardsProps> = ({ resumo }) => {
  const cards: CardItemProps[] = [
    {
      label: 'Total de Projetos',
      value: resumo.total,
      icon: CARD_COLORS.total.icon,
      bgColor: CARD_COLORS.total.bg,
      borderColor: CARD_COLORS.total.border,
    },
    {
      label: 'Em Andamento',
      value: resumo.emAndamento,
      icon: CARD_COLORS.emAndamento.icon,
      bgColor: CARD_COLORS.emAndamento.bg,
      borderColor: CARD_COLORS.emAndamento.border,
    },
    {
      label: 'Passados',
      value: resumo.passados,
      icon: CARD_COLORS.passados.icon,
      bgColor: CARD_COLORS.passados.bg,
      borderColor: CARD_COLORS.passados.border,
    },
    {
      label: 'Finalizados',
      value: resumo.finalizados,
      icon: CARD_COLORS.finalizados.icon,
      bgColor: CARD_COLORS.finalizados.bg,
      borderColor: CARD_COLORS.finalizados.border,
    },
    {
      label: 'Cancelados',
      value: resumo.cancelados,
      icon: CARD_COLORS.cancelados.icon,
      bgColor: CARD_COLORS.cancelados.bg,
      borderColor: CARD_COLORS.cancelados.border,
    },
  ];

  return (
    <div
      className="flex gap-4 mb-6 projetos-scroll pb-2"
      style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {cards.map((card) => (
        <div key={card.label} className="min-w-[200px] flex-1">
          <CardItem {...card} />
        </div>
      ))}
    </div>
  );
};

export default KPICards;
