/**
 * Tabela Analítica por Fundo
 */

import React, { useState } from 'react';
import { DadosPorFundo } from '@/modules/carteira/types';
import { formatCurrency, formatPercent, formatNumber, getColorForPercentage } from '@/modules/carteira/utils/formatacao';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TabelaFundosProps {
  dados: DadosPorFundo[];
  loading?: boolean;
}

type SortField = 'fundo' | 'franquia' | 'macRealizado' | 'macMeta' | 'atingimento' | 'alunosAtivos' | 'inadimplentes';
type SortDirection = 'asc' | 'desc';

export default function TabelaFundos({ dados, loading = false }: TabelaFundosProps) {
  const [sortField, setSortField] = useState<SortField>('atingimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedDados = [...dados].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'fundo':
        comparison = a.fundo.localeCompare(b.fundo);
        break;
      case 'franquia':
        comparison = a.franquia.localeCompare(b.franquia);
        break;
      case 'macRealizado':
        comparison = a.macRealizado - b.macRealizado;
        break;
      case 'macMeta':
        comparison = a.macMeta - b.macMeta;
        break;
      case 'atingimento':
        comparison = a.atingimento - b.atingimento;
        break;
      case 'alunosAtivos':
        comparison = a.alunosAtivos - b.alunosAtivos;
        break;
      case 'inadimplentes':
        comparison = a.inadimplentes - b.inadimplentes;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none',
    borderBottom: '1px solid #333',
  };

  const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#e5e7eb',
    borderBottom: '1px solid #2d3748',
  };

  if (loading) {
    return (
      <div 
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
      >
        <div className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg overflow-hidden"
      style={{ backgroundColor: '#1a1d21', border: '1px solid #333' }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: '#333' }}>
        <h3 
          className="text-lg font-semibold"
          style={{ color: '#FF6600', fontFamily: "'Poppins', sans-serif" }}
        >
          📊 Análise por Fundo de Formatura
        </h3>
        <p className="text-sm" style={{ color: '#6c757d' }}>
          {dados.length} fundos encontrados
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#212529' }}>
              <th style={headerStyle} onClick={() => handleSort('fundo')}>
                <div className="flex items-center gap-1">Fundo <SortIcon field="fundo" /></div>
              </th>
              <th style={headerStyle} onClick={() => handleSort('franquia')}>
                <div className="flex items-center gap-1">Franquia <SortIcon field="franquia" /></div>
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('macRealizado')}>
                <div className="flex items-center justify-end gap-1">Realizado <SortIcon field="macRealizado" /></div>
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('macMeta')}>
                <div className="flex items-center justify-end gap-1">Meta <SortIcon field="macMeta" /></div>
              </th>
              <th style={{ ...headerStyle, textAlign: 'center' }} onClick={() => handleSort('atingimento')}>
                <div className="flex items-center justify-center gap-1">Atingimento <SortIcon field="atingimento" /></div>
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('alunosAtivos')}>
                <div className="flex items-center justify-end gap-1">Alunos <SortIcon field="alunosAtivos" /></div>
              </th>
              <th style={{ ...headerStyle, textAlign: 'right' }} onClick={() => handleSort('inadimplentes')}>
                <div className="flex items-center justify-end gap-1">Inadimp. <SortIcon field="inadimplentes" /></div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDados.map((row, index) => (
              <tr 
                key={row.idFundo || index}
                className="hover:bg-gray-800/50 transition-colors"
              >
                <td style={cellStyle}>
                  <div className="font-medium">{row.fundo}</div>
                  {row.instituicao && (
                    <div className="text-xs" style={{ color: '#6c757d' }}>{row.instituicao}</div>
                  )}
                </td>
                <td style={cellStyle}>{row.franquia}</td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {formatCurrency(row.macRealizado)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right', color: '#6c757d' }}>
                  {formatCurrency(row.macMeta)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>
                  <span 
                    className="px-2 py-1 rounded text-sm font-semibold"
                    style={{ 
                      color: getColorForPercentage(row.atingimento),
                      backgroundColor: `${getColorForPercentage(row.atingimento)}15`,
                    }}
                  >
                    {formatPercent(row.atingimento)}
                  </span>
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  {formatNumber(row.alunosAtivos)}
                </td>
                <td style={{ ...cellStyle, textAlign: 'right' }}>
                  <span style={{ color: row.inadimplentes > 0 ? '#ef4444' : '#6c757d' }}>
                    {formatNumber(row.inadimplentes)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dados.length === 0 && (
        <div className="p-8 text-center" style={{ color: '#6c757d' }}>
          Nenhum fundo encontrado com os filtros atuais.
        </div>
      )}
    </div>
  );
}
