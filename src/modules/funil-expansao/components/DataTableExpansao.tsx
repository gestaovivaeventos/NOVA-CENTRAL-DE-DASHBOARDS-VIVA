/**
 * Tabela de dados genérica para o módulo Funil de Expansão
 * Estilo alinhado com DadosDetalhadosTable do módulo de vendas
 */

import React, { useState, useMemo, useCallback } from 'react';
import { formatNumber, formatPercent } from '../utils/formatacao';
import { Download, Check } from 'lucide-react';

interface Column {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'percent' | 'text';
  sortable?: boolean;
  color?: string;
}

interface HeaderGroup {
  label: string;
  colSpan: number;
  color?: string;
}

interface DataTableProps {
  titulo: string;
  subtitulo?: string;
  colunas: Column[];
  dados: Record<string, any>[];
  pageSize?: number;
  highlightKey?: string;
  headerGroups?: HeaderGroup[];
  showSummary?: boolean;
  exportFilename?: string;
}

export default function DataTableExpansao({ titulo, subtitulo, colunas, dados, pageSize, highlightKey, headerGroups, showSummary, exportFilename }: DataTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [busca, setBusca] = useState('');

  // Filtrar por busca (primeira coluna)
  const filteredData = useMemo(() => {
    if (!busca) return dados;
    const termo = busca.toLowerCase();
    const firstKey = colunas[0]?.key;
    return dados.filter(row => String(row[firstKey] || '').toLowerCase().includes(termo));
  }, [dados, busca, colunas]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = colunas.find(c => c.key === sortKey);
    const isText = !col?.format || col.format === 'text';
    return [...filteredData].sort((a, b) => {
      if (isText) {
        const sa = String(a[sortKey] || '').toLowerCase();
        const sb = String(b[sortKey] || '').toLowerCase();
        const cmp = sa.localeCompare(sb, 'pt-BR');
        return sortDir === 'desc' ? -cmp : cmp;
      }
      const va = Number(a[sortKey]) || 0;
      const vb = Number(b[sortKey]) || 0;
      return sortDir === 'desc' ? vb - va : va - vb;
    });
  }, [filteredData, sortKey, sortDir, colunas]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const startIndex = page * (pageSize || sortedData.length);
  const endIndex = pageSize ? startIndex + pageSize : sortedData.length;
  const visibleData = pageSize ? sortedData.slice(startIndex, endIndex) : sortedData;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };

  const formatValue = (value: any, format?: string) => {
    if (value == null || value === '') return '-';
    if (format === 'number') return formatNumber(Number(value));
    if (format === 'percent') return formatPercent(Number(value));
    return String(value);
  };

  // Ícone de ordenação estilo vendas
  const renderSortIcon = (colKey: string) => {
    if (sortKey !== colKey) {
      return <span className="ml-1" style={{ color: '#6c757d' }}>↕</span>;
    }
    return sortDir === 'asc'
      ? <span className="ml-1" style={{ color: '#FF6600' }}>↑</span>
      : <span className="ml-1" style={{ color: '#FF6600' }}>↓</span>;
  };

  // Calcular resumo
  const summaryRow = useMemo(() => {
    if (!showSummary) return null;
    const row: Record<string, any> = {};
    colunas.forEach((col, i) => {
      if (i === 0) { row[col.key] = 'TOTAL'; return; }
      if (col.format === 'number') {
        row[col.key] = dados.reduce((s, d) => s + (Number(d[col.key]) || 0), 0);
      } else if (col.format === 'percent') {
        const total = dados.reduce((s, d) => s + (Number(d[col.key]) || 0), 0);
        row[col.key] = dados.length > 0 ? total / dados.length : 0;
      } else {
        row[col.key] = '';
      }
    });
    return row;
  }, [showSummary, dados, colunas]);

  const handleExport = useCallback(() => {
    if (!exportFilename) return;
    const sep = ';';
    const header = colunas.map(c => c.header).join(sep);
    const rows = dados.map(row =>
      colunas.map(col => {
        const v = row[col.key];
        if (v == null || v === '') return '';
        if (col.format === 'percent') return String(Number(v).toFixed(2)).replace('.', ',');
        if (col.format === 'number') return String(v);
        return String(v);
      }).join(sep)
    );
    const bom = '\uFEFF';
    const csv = bom + [header, ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportFilename, colunas, dados]);

  return (
    <div className="space-y-4">
      {/* Título */}
      <h3 className="section-title">{titulo}</h3>
      {subtitulo && (
        <p className="text-xs" style={{ color: '#6c757d', fontFamily: 'Poppins, sans-serif', marginTop: '-8px' }}>{subtitulo}</p>
      )}

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between gap-4">
        {exportFilename ? (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: '#495057',
              border: '1px solid #6c757d',
              color: '#adb5bd',
              fontFamily: 'Poppins, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.1)'; e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.color = '#FF6600'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#495057'; e.currentTarget.style.borderColor = '#6c757d'; e.currentTarget.style.color = '#adb5bd'; }}
          >
            <Download size={16} />
            Exportar
          </button>
        ) : <div />}

        <div className="flex items-center">
          <span className="text-sm mr-2" style={{ color: '#adb5bd' }}>Pesquisar:</span>
          <input
            type="text"
            value={busca}
            onChange={e => { setBusca(e.target.value); setPage(0); }}
            className="px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: '#212529',
              color: '#F8F9FA',
              border: '1px solid #495057',
              borderRadius: '6px',
              minWidth: '180px',
              fontFamily: 'Poppins, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed', minWidth: `${colunas.length * 110}px` }}>
            <colgroup>
              {colunas.map((col, i) => (
                <col key={col.key} style={{ width: i === 0 ? '220px' : undefined }} />
              ))}
            </colgroup>
            <thead>
              {headerGroups && (
                <tr style={{ backgroundColor: '#2a2f36' }}>
                  {headerGroups.map((group, idx) => (
                    <th
                      key={idx}
                      colSpan={group.colSpan}
                      style={{
                        padding: '8px 16px',
                        textAlign: 'center',
                        color: group.color || '#FF6600',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.05em',
                        fontFamily: 'Poppins, sans-serif',
                        borderBottom: '1px solid #495057',
                      }}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
              )}
              <tr style={{ backgroundColor: '#2a2f36' }}>
                {colunas.map(col => (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                    style={{
                      padding: '12px 16px',
                      textAlign: col.align || 'center',
                      borderBottom: '2px solid #FF6600',
                      color: col.color || '#adb5bd',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      fontFamily: 'Poppins, sans-serif',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: col.sortable ? 'none' : undefined,
                      transition: 'background-color 0.2s ease',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    onMouseEnter={col.sortable ? e => { e.currentTarget.style.backgroundColor = '#3d4349'; } : undefined}
                    onMouseLeave={col.sortable ? e => { e.currentTarget.style.backgroundColor = '#2a2f36'; } : undefined}
                  >
                    {col.header}
                    {col.sortable && renderSortIcon(col.key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleData.length === 0 ? (
                <tr>
                  <td colSpan={colunas.length} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                visibleData.map((row, idx) => {
                  const isHighlighted = highlightKey && row[highlightKey];
                  const bgBase = idx % 2 === 0 ? '#343A40' : '#2c3136';
                  return (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: bgBase,
                        borderBottom: '1px solid #444',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3d4349'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = bgBase; }}
                    >
                      {colunas.map((col, colIdx) => (
                        <td
                          key={col.key}
                          style={{
                            padding: '10px 16px',
                            textAlign: col.align || 'center',
                            color: col.key === colunas[0].key ? '#F8F9FA' : '#adb5bd',
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: col.key === colunas[0].key ? 500 : 400,
                            fontSize: '0.8rem',
                            overflow: col.key === colunas[0].key ? undefined : 'hidden',
                            textOverflow: col.key === colunas[0].key ? undefined : 'ellipsis',
                            whiteSpace: col.key === colunas[0].key ? 'normal' : 'nowrap',
                            wordBreak: col.key === colunas[0].key ? 'break-word' : undefined,
                          }}
                        >
                          {col.key === colunas[0].key && isHighlighted ? (
                            <span className="flex items-center gap-2">
                              {formatValue(row[col.key], col.format)}
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                                style={{
                                  backgroundColor: 'rgba(40, 167, 69, 0.2)',
                                  color: '#28a745',
                                  border: '1px solid rgba(40, 167, 69, 0.4)',
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}
                              >
                                <Check size={10} strokeWidth={3} /> MATCH
                              </span>
                            </span>
                          ) : (
                            formatValue(row[col.key], col.format)
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Linha resumo (TOTAL) */}
            {summaryRow && visibleData.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#2a2f36', borderTop: '2px solid #FF6600' }}>
                  {colunas.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 16px',
                        textAlign: col.align || 'center',
                        fontWeight: 700,
                        color: '#FF6600',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '0.8rem',
                      }}
                    >
                      {formatValue(summaryRow[col.key], col.format)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Paginação estilo vendas */}
      {pageSize && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontSize: '0.875rem',
          color: '#ADB5BD',
          fontFamily: 'Poppins, sans-serif',
        }}>
          <span>
            Mostrando {sortedData.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, sortedData.length)} de {sortedData.length} registros
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                page === 0
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed'
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                page >= totalPages - 1
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed'
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
