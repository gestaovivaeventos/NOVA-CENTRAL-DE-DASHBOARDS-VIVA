/**
 * Tabela de Usuários - Layout baseado no DataTable do módulo de vendas
 * Somente leitura com busca, ordenação e paginação
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Download, Copy, Check, CheckCircle } from 'lucide-react';
import type { UsuarioRow } from '../types';

interface Column {
  key: keyof UsuarioRow;
  title: string;
  highlight?: boolean;
}

interface UsuariosTableProps {
  data: UsuarioRow[];
  columns: Column[];
  pageSize?: number;
}

export default function UsuariosTable({
  data,
  columns,
  pageSize = 20,
}: UsuariosTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = String((a as any)[sortColumn] || '').toLowerCase();
      const bVal = String((b as any)[sortColumn] || '').toLowerCase();
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Handlers
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleCopy = useCallback(async (text: string, cellId: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCell(cellId);
      setTimeout(() => setCopiedCell(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedCell(cellId);
      setTimeout(() => setCopiedCell(null), 2000);
    }
  }, []);

  const handleExportExcel = () => {
    // Gerar HTML table para Excel
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    html += '<head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Usuarios</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    html += '<body><table border="1">';
    html += '<tr>' + columns.map(c => `<th style="background-color:#FF6600;color:#fff;font-weight:bold;">${c.title}</th>`).join('') + '</tr>';
    sortedData.forEach(row => {
      html += '<tr>' + columns.map(col => {
        const val = row[col.key] || '';
        if (col.key === 'senhaHash') {
          return `<td>${val ? 'Senha Criada' : '—'}</td>`;
        }
        return `<td>${String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
      }).join('') + '</tr>';
    });
    html += '</table></body></html>';

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `controle_usuarios_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <span style={{ color: '#6c757d', marginLeft: '4px' }}>⇅</span>;
    }
    if (sortDirection === 'asc') {
      return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↑</span>;
    }
    if (sortDirection === 'desc') {
      return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↓</span>;
    }
    return null;
  };

  // Detectar se coluna é copiável (login, tokens)
  const isCopyableColumn = (key: string) =>
    ['username', 'tokenResetAdmin', 'tokenPrimeiraSenha'].includes(key);

  // Formatar valor de exibição (truncar tokens longos)
  const formatCellValue = (key: string, value: string) => {
    if (!value) return '—';
    if (key === 'enabled') return value;
    if (isCopyableColumn(key) && value.length > 20) {
      return value.substring(0, 18) + '...';
    }
    return value;
  };

  // Estilo especial para status
  const getStatusStyle = (value: string): React.CSSProperties => {
    if (value === 'Ativo') {
      return {
        color: '#28a745',
        fontWeight: 600,
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        padding: '4px 10px',
        borderRadius: '12px',
        display: 'inline-block',
        fontSize: '0.8rem',
      };
    }
    return {
      color: '#dc3545',
      fontWeight: 600,
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      padding: '4px 10px',
      borderRadius: '12px',
      display: 'inline-block',
      fontSize: '0.8rem',
    };
  };

  // Colunas que devem ter text wrap (unidades)
  const isWrapColumn = (key: string) =>
    ['unidade', 'unidadePrincipal', 'nome', 'nmGrupo'].includes(key);

  // Gerar páginas para navegação
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header com Pesquisar e Exportar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ADB5BD', fontSize: '0.875rem' }}>Pesquisar:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nome, username, unidade..."
            style={{
              padding: '8px 12px',
              backgroundColor: '#212529',
              border: '1px solid #495057',
              borderRadius: '6px',
              color: '#F8F9FA',
              fontSize: '0.875rem',
              minWidth: '250px',
              outline: 'none',
              fontFamily: 'Poppins, sans-serif',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#FF6600'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#495057'; }}
          />
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          onClick={handleExportExcel}
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download size={16} />
          Exportar Excel
        </button>
      </div>

      {/* Container com scroll */}
      <div style={{
        maxHeight: '600px',
        overflowY: 'auto',
        overflowX: 'auto',
        borderRadius: '8px',
        border: '1px solid #333',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontSize: '0.875rem',
        }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    color: '#adb5bd',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #FF6600',
                    whiteSpace: 'normal',
                    minWidth: isWrapColumn(col.key) ? '120px' : undefined,
                    transition: 'background-color 0.2s',
                    backgroundColor: '#2a2f36',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#343a40'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
                >
                  {col.title}
                  {renderSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: '48px 16px',
                    textAlign: 'center',
                    color: '#adb5bd',
                    fontSize: '0.875rem',
                  }}
                >
                  Nenhum dado disponível
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr
                  key={`${row.username}-${row.unidade}-${rowIndex}`}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? '#343A40' : '#2c3136',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? '#343A40' : '#2c3136'}
                >
                  {columns.map(col => {
                    const value = row[col.key];
                    const cellId = `${rowIndex}-${col.key}`;
                    const copyable = isCopyableColumn(col.key) && !!value;

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: '10px 8px',
                          color: col.highlight ? '#FF6600' : '#F8F9FA',
                          fontWeight: col.highlight ? 600 : 400,
                          fontSize: '0.825rem',
                          borderBottom: '1px solid #444',
                          textAlign: 'center',
                          fontFamily: 'Poppins, sans-serif',
                          whiteSpace: isWrapColumn(col.key) ? 'normal' : 'nowrap',
                          maxWidth: isWrapColumn(col.key) ? '180px' : undefined,
                          wordBreak: isWrapColumn(col.key) ? 'break-word' : undefined,
                        }}
                      >
                        {col.key === 'enabled' ? (
                          <span style={getStatusStyle(value)}>
                            {value}
                          </span>
                        ) : col.key === 'senhaHash' ? (
                          // Senha hash: mostra tag "Senha Criada" ou "—"
                          value ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#28a745',
                              fontWeight: 600,
                              backgroundColor: 'rgba(40, 167, 69, 0.1)',
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                            }}>
                              <CheckCircle size={14} />
                              Senha Criada
                            </span>
                          ) : (
                            <span style={{ color: '#6c757d' }}>—</span>
                          )
                        ) : copyable ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span title={value} style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {formatCellValue(col.key, value)}
                            </span>
                            <button
                              onClick={() => handleCopy(value, cellId)}
                              style={{
                                padding: '3px',
                                borderRadius: '4px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: copiedCell === cellId ? '#28a745' : '#6c757d',
                                transition: 'color 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Copiar"
                              onMouseEnter={(e) => { if (copiedCell !== cellId) e.currentTarget.style.color = '#FF6600'; }}
                              onMouseLeave={(e) => { if (copiedCell !== cellId) e.currentTarget.style.color = '#6c757d'; }}
                            >
                              {copiedCell === cellId ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                          </div>
                        ) : (
                          formatCellValue(col.key, value)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontSize: '0.875rem',
          color: '#ADB5BD',
          fontFamily: 'Poppins, sans-serif',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <span>
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} registros
          </span>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: currentPage === 1 ? '#2a2f36' : '#343A40',
                border: '1px solid #444',
                color: currentPage === 1 ? '#555' : '#ADB5BD',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              ‹
            </button>

            {getPageNumbers().map((page, idx) =>
              typeof page === 'string' ? (
                <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#6c757d' }}>...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: currentPage === page ? '#FF6600' : '#343A40',
                    border: currentPage === page ? '1px solid #FF6600' : '1px solid #444',
                    color: currentPage === page ? '#fff' : '#ADB5BD',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: currentPage === page ? 600 : 400,
                    fontFamily: 'Poppins, sans-serif',
                    transition: 'all 0.2s',
                  }}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: currentPage === totalPages ? '#2a2f36' : '#343A40',
                border: '1px solid #444',
                color: currentPage === totalPages ? '#555' : '#ADB5BD',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
