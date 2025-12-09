import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  sortable?: boolean;
  highlight?: boolean; // Coluna destacada em laranja
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  title?: string;
  pageSize?: number;
  exportable?: boolean;
  searchable?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  pageSize = 10,
  exportable = true,
  searchable = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Filtrar dados
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Ordenar dados
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];
      
      // Tentar converter para número
      const numA = parseFloat(String(aVal).replace(',', '.'));
      const numB = parseFloat(String(bVal).replace(',', '.'));
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginar dados
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Exportar para Excel/CSV
  const handleExport = () => {
    const headers = columns.map(c => c.title).join('\t');
    const rows = sortedData.map(row =>
      columns.map(col => {
        const value = row[col.key];
        return col.format ? col.format(value) : String(value || '');
      }).join('\t')
    ).join('\n');
    
    const content = `${headers}\n${rows}`;
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'dados'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.tsv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (columnKey: string) => {
    const column = columns.find(c => c.key === columnKey);
    if (column?.sortable === false) return;
    
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

  // Ícone de ordenação no estilo PEX
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

  return (
    <div style={{ width: '100%' }}>
      {/* Header com Exportar e Pesquisar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {exportable && (
          <button 
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
            onClick={handleExport}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <Download size={16} />
            Exportar
          </button>
        )}
        
        {searchable && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ADB5BD', fontSize: '0.875rem' }}>Pesquisar:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: '#212529',
                border: '1px solid #495057',
                borderRadius: '6px',
                color: '#F8F9FA',
                fontSize: '0.875rem',
                minWidth: '180px',
                outline: 'none',
                fontFamily: 'Poppins, sans-serif',
              }}
            />
          </div>
        )}
      </div>

      {/* Container com scroll vertical */}
      <div style={{ 
        maxHeight: '600px', 
        overflowY: 'auto',
        overflowX: 'auto'
      }}>
        <table 
          style={{ 
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            fontSize: '0.875rem',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    color: '#adb5bd',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    borderBottom: '2px solid #FF6600',
                    whiteSpace: 'nowrap',
                    transition: 'background-color 0.2s',
                    backgroundColor: '#2a2f36',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#343a40'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
                >
                  {col.title}
                  {col.sortable !== false && renderSortIcon(col.key)}
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
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? '#343A40' : '#2c3136',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? '#343A40' : '#2c3136'}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: '12px 8px',
                        color: col.highlight ? '#FF6600' : '#F8F9FA',
                        fontWeight: col.highlight ? 600 : 400,
                        fontSize: '0.875rem',
                        borderBottom: '1px solid #444',
                        textAlign: 'center',
                        fontFamily: 'Poppins, sans-serif',
                      }}
                    >
                      {col.format ? col.format(row[col.key]) : row[col.key]}
                    </td>
                  ))}
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
        }}>
          <span>
            Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} registros
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 1 
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === totalPages 
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
};

