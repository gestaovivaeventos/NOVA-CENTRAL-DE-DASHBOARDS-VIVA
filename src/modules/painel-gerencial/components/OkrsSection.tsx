'use client';

import React from 'react';
import { ProcessedOkrData } from '../types';
import { COLORS, STATUS_COLORS } from '../config/app.config';

interface OkrsSectionProps {
  okrs: ProcessedOkrData[];
  titulo?: string;
}

const getStatusColor = (percentual: number): string => {
  if (percentual >= 100) return STATUS_COLORS.verde;
  if (percentual >= 80) return STATUS_COLORS.amarelo;
  return STATUS_COLORS.vermelho;
};

export const OkrsSection: React.FC<OkrsSectionProps> = ({ okrs, titulo = 'OKRs do Período' }) => {
  if (!okrs || okrs.length === 0) {
    return (
      <div
        style={{
          backgroundColor: COLORS.backgroundLight,
          borderRadius: '16px',
          padding: '24px',
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <h3
          style={{
            color: COLORS.primary,
            fontSize: '1.1rem',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          {titulo}
        </h3>
        <p style={{ color: COLORS.textSecondary, fontSize: '0.9rem' }}>
          Nenhum OKR encontrado para o período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: COLORS.backgroundLight,
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <h3
        style={{
          color: COLORS.primary,
          fontSize: '1.1rem',
          fontWeight: '600',
          marginBottom: '20px',
        }}
      >
        {titulo}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {okrs.map((okr, index) => (
          <div
            key={index}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    backgroundColor: COLORS.primary,
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    display: 'inline-block',
                  }}
                >
                  {okr.equipe}
                </span>
                <h4
                  style={{
                    color: COLORS.text,
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    marginTop: '8px',
                  }}
                >
                  {okr.objetivo}
                </h4>
              </div>
              <div
                style={{
                  backgroundColor: getStatusColor(okr.percentual),
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  marginLeft: '16px',
                }}
              >
                {okr.percentual.toFixed(0)}%
              </div>
            </div>

            {/* Key Result */}
            <div style={{ marginBottom: '8px' }}>
              <p
                style={{
                  color: COLORS.textSecondary,
                  fontSize: '0.85rem',
                  marginBottom: '4px',
                }}
              >
                KR: {okr.keyResult}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.min(okr.percentual, 100)}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(okr.percentual),
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OkrsSection;
