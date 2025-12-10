'use client';

import React from 'react';
import { TeamPerformance } from '../types';
import { COLORS, STATUS_COLORS } from '../config/app.config';

interface TeamPerformanceTableProps {
  teams: TeamPerformance[];
  titulo?: string;
}

const getStatusColor = (percentual: number): string => {
  if (percentual >= 100) return STATUS_COLORS.verde;
  if (percentual >= 80) return STATUS_COLORS.amarelo;
  return STATUS_COLORS.vermelho;
};

export const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ 
  teams, 
  titulo = 'Desempenho por Equipe' 
}) => {
  if (!teams || teams.length === 0) {
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
          Nenhum dado de equipe disponível.
        </p>
      </div>
    );
  }

  // Ordenar equipes por média percentual (decrescente)
  const sortedTeams = [...teams].sort((a, b) => (b.mediaPercentual ?? b.mediaGeral) - (a.mediaPercentual ?? a.mediaGeral));

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
        {sortedTeams.map((team, index) => {
          const percentual = team.mediaPercentual ?? team.mediaGeral;
          const nomeEquipe = team.equipe ?? team.time;
          const totalKpis = team.totalKpis ?? team.totalIndicadores;
          const kpisNaMeta = team.kpisNaMeta ?? 0;
          const kpisAbaixoMeta = team.kpisAbaixoMeta ?? 0;
          
          return (
          <div
            key={nomeEquipe}
            style={{
              backgroundColor: COLORS.surface,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Ranking */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: index < 3 ? COLORS.primary : COLORS.surface,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: '600',
                border: index < 3 ? 'none' : `1px solid ${COLORS.border}`,
              }}
            >
              {index + 1}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h4
                style={{
                  color: COLORS.text,
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  marginBottom: '4px',
                }}
              >
                {nomeEquipe}
              </h4>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  color: COLORS.textSecondary,
                  fontSize: '0.8rem',
                }}
              >
                <span>KPIs: {totalKpis}</span>
                <span style={{ color: STATUS_COLORS.verde }}>✓ {kpisNaMeta}</span>
                <span style={{ color: STATUS_COLORS.vermelho }}>✗ {kpisAbaixoMeta}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ flex: 1, maxWidth: '200px' }}>
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
                    width: `${Math.min(percentual, 100)}%`,
                    height: '100%',
                    backgroundColor: getStatusColor(percentual),
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Percentual */}
            <div
              style={{
                backgroundColor: getStatusColor(percentual),
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: '600',
                minWidth: '60px',
                textAlign: 'center',
              }}
            >
              {percentual.toFixed(0)}%
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamPerformanceTable;
