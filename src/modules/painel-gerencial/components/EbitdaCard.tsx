'use client';

import React from 'react';
import { COLORS, STATUS_COLORS } from '../config/app.config';

interface EbitdaCardProps {
  valor: number;
  meta: number;
  percentual: number;
}

const getStatusColor = (percentual: number): string => {
  if (percentual >= 100) return STATUS_COLORS.verde;
  if (percentual >= 80) return STATUS_COLORS.amarelo;
  return STATUS_COLORS.vermelho;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const EbitdaCard: React.FC<EbitdaCardProps> = ({ valor, meta, percentual }) => {
  // Garantir valores válidos
  const valorSafe = valor ?? 0;
  const metaSafe = meta ?? 0;
  const percentualSafe = percentual ?? 0;
  const statusColor = getStatusColor(percentualSafe);

  return (
    <div
      style={{
        backgroundColor: COLORS.backgroundLight,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${COLORS.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3
            style={{
              color: COLORS.text,
              fontSize: '0.9rem',
              fontWeight: '500',
              marginBottom: '8px',
            }}
          >
            EBITDA Acumulado
          </h3>
          <p
            style={{
              color: '#fff',
              fontSize: '2rem',
              fontWeight: '700',
            }}
          >
            {formatCurrency(valorSafe)}
          </p>
        </div>
        <div
          style={{
            backgroundColor: statusColor,
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '24px',
            fontSize: '1.1rem',
            fontWeight: '600',
          }}
        >
          {percentualSafe.toFixed(1)}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '0.85rem',
            color: COLORS.text,
          }}
        >
          <span>Meta: {formatCurrency(metaSafe)}</span>
          <span>{percentualSafe >= 100 ? 'Meta atingida!' : `Faltam ${formatCurrency(metaSafe - valorSafe)}`}</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(percentualSafe, 100)}%`,
              height: '100%',
              backgroundColor: statusColor,
              borderRadius: '6px',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EbitdaCard;
