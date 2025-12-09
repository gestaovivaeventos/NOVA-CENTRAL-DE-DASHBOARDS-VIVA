/**
 * Tabela de Captações do Funil
 * Mostra origem dos leads agrupada por tipo de captação
 */

import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';

interface CaptacaoData {
  origem: string;
  tipo: string;
  percentual: number;
  total: number;
}

interface CaptacoesTableProps {
  dados: CaptacaoData[];
  titulo?: string;
}

export const CaptacoesTable: React.FC<CaptacoesTableProps> = ({
  dados,
  titulo = 'Captações por Origem',
}) => {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof CaptacaoData; direcao: 'asc' | 'desc' }>({
    coluna: 'total',
    direcao: 'desc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Filtrar e ordenar dados
  const dadosFiltrados = useMemo(() => {
    let resultado = [...dados];

    // Filtrar por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(
        item =>
          item.origem.toLowerCase().includes(termoBusca) ||
          item.tipo.toLowerCase().includes(termoBusca)
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      const valorA = a[ordenacao.coluna];
      const valorB = b[ordenacao.coluna];

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenacao.direcao === 'asc'
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      }

      if (typeof valorA === 'number' && typeof valorB === 'number') {
        return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
      }

      return 0;
    });

    return resultado;
  }, [dados, busca, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const dadosPaginados = dadosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  // Totais
  const totais = useMemo(() => {
    return dadosFiltrados.reduce(
      (acc, item) => ({
        total: acc.total + item.total,
        percentual: 100,
      }),
      { total: 0, percentual: 0 }
    );
  }, [dadosFiltrados]);

  // Handler de ordenação
  const handleOrdenacao = (coluna: keyof CaptacaoData) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'desc' ? 'asc' : 'desc',
    }));
    setPaginaAtual(1);
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = ['Origem do Lead', 'Tipo de Captação', '%', 'Total'];
    const linhas = dadosFiltrados.map(item => [
      item.origem,
      item.tipo,
      `${item.percentual}%`,
      item.total.toString(),
    ]);

    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `captacoes_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar ícone de ordenação
  const renderIconeOrdenacao = (coluna: keyof CaptacaoData) => {
    if (ordenacao.coluna !== coluna) {
      return <span className="ml-1 text-gray-500">↕</span>;
    }
    return ordenacao.direcao === 'asc' ? (
      <span className="ml-1" style={{ color: '#FF6600' }}>↑</span>
    ) : (
      <span className="ml-1" style={{ color: '#FF6600' }}>↓</span>
    );
  };

  // Cor do tipo de captação (padrão: laranja, amarelo, cinza)
  const getCorTipo = (tipo: string): string => {
    if (tipo.includes('Passiva - Exclusiva')) return '#FFC107'; // amarelo
    if (tipo.includes('Passiva')) return '#6c757d'; // cinza
    return '#FF6600'; // laranja
  };

  return (
    <div className="space-y-4">
      {/* Título da tabela */}
      <h3 className="section-title" style={{ fontSize: '1rem' }}>
        DESEMPENHO POR CAPTAÇÃO (FUNIL)
      </h3>

      {/* Header com busca e exportação */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download className="w-4 h-4" />
          Exportar
        </button>

        <div className="flex items-center">
          <span className="text-[#adb5bd] text-sm mr-2">Pesquisar:</span>
          <input
            type="text"
            placeholder="Buscar origem..."
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            className="px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: '#212529',
              color: '#F8F9FA',
              border: '1px solid #495057',
              borderRadius: '6px',
              minWidth: '180px',
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div 
        style={{ 
          maxHeight: '500px', 
          overflowY: 'auto',
          borderRadius: '8px',
          border: '1px solid #444',
        }}
      >
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              <th
                onClick={() => handleOrdenacao('origem')}
                className="cursor-pointer"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Origem do Lead {renderIconeOrdenacao('origem')}
              </th>
              <th
                onClick={() => handleOrdenacao('tipo')}
                className="cursor-pointer"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Tipo de Captação {renderIconeOrdenacao('tipo')}
              </th>
              <th
                onClick={() => handleOrdenacao('percentual')}
                className="cursor-pointer"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % {renderIconeOrdenacao('percentual')}
              </th>
              <th
                onClick={() => handleOrdenacao('total')}
                className="cursor-pointer"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Total {renderIconeOrdenacao('total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {dadosPaginados.length > 0 ? (
              dadosPaginados.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                    borderBottom: '1px solid #444',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                >
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{item.origem}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: getCorTipo(item.tipo) }}>{item.tipo}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#adb5bd' }}>{item.percentual.toFixed(1)}%</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', fontWeight: 500 }}>{item.total.toLocaleString('pt-BR')}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td 
                  colSpan={4} 
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#adb5bd',
                  }}
                >
                  Nenhum dado encontrado
                </td>
              </tr>
            )}
          </tbody>
          {dadosPaginados.length > 0 && (
            <tfoot>
              <tr 
                style={{
                  backgroundColor: '#2a2f36',
                  borderTop: '2px solid #ff6600',
                }}
              >
                <td 
                  colSpan={2} 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                  }}
                >
                  TOTAL
                </td>
                <td 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                  }}
                >
                  100%
                </td>
                <td 
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                  }}
                >
                  {totais.total.toLocaleString('pt-BR')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
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
            Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a {Math.min(paginaAtual * itensPorPagina, dadosFiltrados.length)} de {dadosFiltrados.length} registros
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                paginaAtual === 1 
                  ? 'bg-dark-tertiary border border-gray-700 text-gray-600 cursor-not-allowed' 
                  : 'bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                paginaAtual === totalPaginas 
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

