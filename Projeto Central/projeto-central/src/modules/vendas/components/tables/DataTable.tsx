/**
 * Componente DataTable - Tabela de dados genérica
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  pageSize = 10,
  emptyMessage = 'Nenhum dado encontrado',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key as keyof T];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, columns]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal), 'pt-BR');
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginação
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className="w-full">
      {/* Header com título e busca */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        {title && <h3 className="section-title">{title}</h3>}
        
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="filter-input pl-9 w-64"
            />
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-dark-border">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-tertiary">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`
                    px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary
                    ${col.sortable !== false ? 'cursor-pointer hover:bg-white/5' : ''}
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable !== false && sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-8 text-center text-text-muted"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className="border-t border-dark-border hover:bg-white/5 transition-colors"
                >
                  {columns.map((col) => {
                    const value = row[col.key as keyof T];
                    return (
                      <td
                        key={String(col.key)}
                        className={`
                          px-4 py-3 text-sm text-text-primary
                          ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {col.render ? col.render(value, row) : String(value ?? '-')}
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
        <div className="flex justify-between items-center mt-4 text-sm text-text-secondary">
          <span>
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
          </span>
          
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-1 disabled:opacity-50"
            >
              Anterior
            </button>
            
            <span className="px-3 py-1">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-1 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

