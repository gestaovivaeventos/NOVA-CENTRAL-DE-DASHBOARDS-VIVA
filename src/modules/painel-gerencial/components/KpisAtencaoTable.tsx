'use client';

import React from 'react';
import { GerencialKpiData } from '../types';
import { COLORS, STATUS_COLORS } from '../config/app.config';

interface KpisAtencaoTableProps {
  kpis: GerencialKpiData[];
  titulo?: string;
}

const getStatusColor = (percentual: number): string => {
  if (percentual >= 100) return STATUS_COLORS.verde;
  if (percentual >= 80) return STATUS_COLORS.amarelo;
  return STATUS_COLORS.vermelho;
};

const formatValue = (value: number, unidade?: string): string => {
  if (!value && value !== 0) return '-';
  
  if (unidade === '%') {
    return `${value.toFixed(1)}%`;
  }
  if (unidade === 'R$') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  return value.toLocaleString('pt-BR');
};

export const KpisAtencaoTable: React.FC<KpisAtencaoTableProps> = ({ kpis, titulo = 'KPIs que Precisam de Atenção' }) => {
  // Filtrar apenas KPIs abaixo de 80%
  const kpisAtencao = kpis.filter(kpi => (kpi.percentual ?? 0) < 80);

  if (kpisAtencao.length === 0) {
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
        <p style={{ color: COLORS.success, fontSize: '0.9rem' }}>
          🎉 Todos os KPIs estão dentro da meta ou próximos dela!
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>⚠️</span>
        {titulo}
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                KPI
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                Equipe
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 16px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                Realizado
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '12px 16px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                Meta
              </th>
              <th
                style={{
                  textAlign: 'center',
                  padding: '12px 16px',
                  color: COLORS.textSecondary,
                  fontWeight: '500',
                  borderBottom: `1px solid ${COLORS.border}`,
                }}
              >
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {kpisAtencao.map((kpi, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: '12px 16px',
                    color: COLORS.text,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {kpi.nome}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    color: COLORS.textSecondary,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {kpi.equipe}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    color: COLORS.text,
                    textAlign: 'right',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {formatValue(kpi.realizado ?? 0, kpi.unidade)}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    color: COLORS.textSecondary,
                    textAlign: 'right',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  {formatValue(kpi.meta, kpi.unidade)}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <span
                    style={{
                      backgroundColor: getStatusColor(kpi.percentual ?? 0),
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                    }}
                  >
                    {(kpi.percentual ?? 0).toFixed(0)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KpisAtencaoTable;
