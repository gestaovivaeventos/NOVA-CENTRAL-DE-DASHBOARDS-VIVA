'use client';

import React from 'react';
import Card from './Card';
import { EbitdaYearData } from '../types';

interface EbitdaCardProps {
  ebitdaByYear: Record<number, EbitdaYearData>;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const EbitdaCard: React.FC<EbitdaCardProps> = ({ ebitdaByYear }) => {
  const currentYear = new Date().getFullYear();
  const years = Object.keys(ebitdaByYear)
    .map(Number)
    .filter(year => year <= currentYear)
    .sort((a, b) => a - b);

  const currentYearData = ebitdaByYear[currentYear];
  const atingimentoPercent = currentYearData?.metasReal ? currentYearData.metasReal * 100 : 0;

  // Definir cor baseada no atingimento (mesmas cores do VENDAS REFATORADO)
  const getStatusColor = (percent: number) => {
    if (percent >= 100) return '#28a745'; // Verde (success)
    if (percent >= 61) return '#FF6600';   // Laranja (primary)
    return '#dc3545';                       // Vermelho (danger)
  };

  const statusColor = getStatusColor(atingimentoPercent);
  
  // Definir cores do gradiente baseado no status (claro → escuro)
  let gradientColors = { start: '#F87171', end: '#DC2626' }; // Vermelho
  if (atingimentoPercent >= 100) {
    gradientColors = { start: '#4ADE80', end: '#16A34A' }; // Verde
  } else if (atingimentoPercent >= 61) {
    gradientColors = { start: '#FF8533', end: '#CC5200' }; // Laranja
  }

  return (
    <Card>
      <div className="text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <h3 className="card-title flex items-center justify-center gap-2">
          EBITDA
        </h3>
        
        {/* Barra de progresso do ano atual */}
        {currentYearData && (
          <div className="mb-6">
            <div className="progress-bar-bg h-4 mb-2">
              <div
                className="progress-bar-fg"
                style={{
                  width: `${Math.min(atingimentoPercent, 100)}%`,
                  background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
                }}
              />
            </div>
            <p className="text-2xl font-bold" style={{ color: statusColor }}>
              {atingimentoPercent.toFixed(1)}%
            </p>
            <p className="text-text-secondary text-sm">ATINGIMENTO {currentYear}</p>
          </div>
        )}

        {/* Dados por ano */}
        <div className="grid grid-cols-1 gap-3">
          {years.map(year => {
            const item = ebitdaByYear[year];
            const yearAtingimento = item.metasReal * 100;
            const yearColor = getStatusColor(yearAtingimento);
            
            return (
              <div key={year} className="kpi-card">
                <div className="flex items-center justify-between min-h-[60px]">
                  <span className="text-text-primary font-semibold text-lg">{year}</span>
                  <div className="grid grid-cols-2 gap-6 flex-1 mx-6">
                    <div className="text-center">
                      <p className="text-text-secondary text-sm mb-1">META</p>
                      <p className="text-text-primary font-medium">{formatCurrency(item.meta)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-text-secondary text-sm mb-1">RESULTADO</p>
                      <p className="text-text-primary font-medium">
                        {item.resultado > 0 ? formatCurrency(item.resultado) : '-'}
                      </p>
                    </div>
                  </div>
                  <span 
                    className="font-bold text-xl"
                    style={{ color: item.resultado > 0 ? yearColor : '#6c757d' }}
                  >
                    {item.resultado > 0 ? `${yearAtingimento.toFixed(1)}%` : '-'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default EbitdaCard;
