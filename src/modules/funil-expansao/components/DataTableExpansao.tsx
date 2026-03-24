/**
 * Tabela de dados genérica para o módulo Funil de Expansão
 * Usada para: Campanhas, Conjuntos, Anúncios, Candidatos por Cidade
 */

import React from 'react';
import { formatNumber, formatPercent } from '../utils/formatacao';

interface Column {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'percent' | 'text';
}

interface DataTableProps {
  titulo: string;
  colunas: Column[];
  dados: Record<string, any>[];
  maxRows?: number;
}

export default function DataTableExpansao({ titulo, colunas, dados, maxRows = 20 }: DataTableProps) {
  const visibleData = dados.slice(0, maxRows);

  const formatValue = (value: any, format?: string) => {
    if (value == null || value === '') return '-';
    if (format === 'number') return formatNumber(Number(value));
    if (format === 'percent') return formatPercent(Number(value));
    return String(value);
  };

  return (
    <div
      className="rounded-xl p-5 overflow-hidden"
      style={{
        backgroundColor: '#343A40',
        border: '1px solid #495057',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      <h3
        className="text-sm font-bold uppercase tracking-wider mb-4"
        style={{ color: '#F8F9FA', fontFamily: 'Poppins, sans-serif' }}
      >
        {titulo}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '2px solid #495057' }}>
              {colunas.map(col => (
                <th
                  key={col.key}
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                  style={{
                    color: '#adb5bd',
                    fontFamily: 'Poppins, sans-serif',
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.map((row, idx) => (
              <tr
                key={idx}
                className="transition-colors hover:bg-white/5"
                style={{ borderBottom: '1px solid #3a3d41' }}
              >
                {colunas.map(col => (
                  <td
                    key={col.key}
                    className="px-3 py-2.5 text-xs"
                    style={{
                      color: col.key === colunas[0].key ? '#F8F9FA' : '#adb5bd',
                      fontFamily: 'Poppins, sans-serif',
                      textAlign: col.align || 'left',
                      fontWeight: col.key === colunas[0].key ? 500 : 400,
                    }}
                  >
                    {formatValue(row[col.key], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dados.length > maxRows && (
        <p className="text-xs mt-3 text-center" style={{ color: '#6c757d' }}>
          Exibindo {maxRows} de {dados.length} registros
        </p>
      )}
    </div>
  );
}
