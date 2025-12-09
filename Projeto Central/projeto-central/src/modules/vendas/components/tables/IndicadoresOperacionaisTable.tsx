/**
 * Componente IndicadoresOperacionaisTable - Tabela de atingimento de indicadores operacionais
 * Replica o estilo original do dashboard
 */

import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';

interface IndicadorItem {
  unidade: string;
  leadsPercent: number;
  reunioesPercent: number;
  contratosPercent: number;
  adesoesPercent: number;
}

interface IndicadoresOperacionaisTableProps {
  data: IndicadorItem[];
}

export const IndicadoresOperacionaisTable: React.FC<IndicadoresOperacionaisTableProps> = ({
  data,
}) => {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({
    coluna: 'unidade',
    direcao: 'asc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Formatar percentual
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1).replace('.', ',') + '%';
  };

  // Filtrar e ordenar dados
  const dadosFiltrados = useMemo(() => {
    let resultado = [...data];

    // Filtrar por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(item =>
        item.unidade.toLowerCase().includes(termoBusca)
      );
    }

    // Ordenar
    resultado.sort((a, b) => {
      const valorA = (a as any)[ordenacao.coluna];
      const valorB = (b as any)[ordenacao.coluna];

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
  }, [data, busca, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina) || 1;
  const startIndex = (paginaAtual - 1) * itensPorPagina;
  const endIndex = startIndex + itensPorPagina;
  const dadosPaginados = dadosFiltrados.slice(startIndex, endIndex);

  // Alterar ordenação
  const handleOrdenacao = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
    setPaginaAtual(1);
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = ['Unidade', 'Leads (%)', 'Reuniões (%)', 'Contratos (%)', 'Adesões (%)'];
    const linhas = dadosFiltrados.map(item => [
      item.unidade,
      formatPercent(item.leadsPercent),
      formatPercent(item.reunioesPercent),
      formatPercent(item.contratosPercent),
      formatPercent(item.adesoesPercent),
    ]);

    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `indicadores_operacionais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar ícone de ordenação
  const renderIconeOrdenacao = (coluna: string) => {
    if (ordenacao.coluna !== coluna) {
      return <span className="ml-1 text-gray-500">↕</span>;
    }
    return ordenacao.direcao === 'asc' ? (
      <span className="ml-1" style={{ color: '#FF6600' }}>↑</span>
    ) : (
      <span className="ml-1" style={{ color: '#FF6600' }}>↓</span>
    );
  };

  // Gerar números das páginas para exibição
  const getPaginasVisiveis = () => {
    const paginas: (number | string)[] = [];
    const maxPaginas = 5;
    
    if (totalPaginas <= maxPaginas) {
      for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
    } else {
      if (paginaAtual <= 3) {
        for (let i = 1; i <= maxPaginas; i++) paginas.push(i);
      } else if (paginaAtual >= totalPaginas - 2) {
        for (let i = totalPaginas - maxPaginas + 1; i <= totalPaginas; i++) paginas.push(i);
      } else {
        for (let i = paginaAtual - 2; i <= paginaAtual + 2; i++) paginas.push(i);
      }
    }
    
    return paginas;
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <h2 className="section-title">
        ATINGIMENTO INDICADORES OPERACIONAIS
      </h2>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download size={16} />
          Exportar
        </button>

        <div className="flex items-center">
          <span className="text-[#adb5bd] text-sm mr-2">Pesquisar:</span>
          <input
            type="text"
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            placeholder="Pesquisar..."
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
                onClick={() => handleOrdenacao('unidade')}
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
                Unidade {renderIconeOrdenacao('unidade')}
              </th>
              <th
                onClick={() => handleOrdenacao('leadsPercent')}
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
                Leads (%) {renderIconeOrdenacao('leadsPercent')}
              </th>
              <th
                onClick={() => handleOrdenacao('reunioesPercent')}
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
                Reuniões (%) {renderIconeOrdenacao('reunioesPercent')}
              </th>
              <th
                onClick={() => handleOrdenacao('contratosPercent')}
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
                Contratos (%) {renderIconeOrdenacao('contratosPercent')}
              </th>
              <th
                onClick={() => handleOrdenacao('adesoesPercent')}
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
                Adesões (%) {renderIconeOrdenacao('adesoesPercent')}
              </th>
            </tr>
          </thead>
          <tbody>
            {dadosPaginados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#adb5bd',
                  }}
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              dadosPaginados.map((item, index) => (
                <tr
                  key={`${item.unidade}-${index}`}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                    borderBottom: '1px solid #444',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                >
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{item.unidade}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{formatPercent(item.leadsPercent)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{formatPercent(item.reunioesPercent)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{formatPercent(item.contratosPercent)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA' }}>{formatPercent(item.adesoesPercent)}</td>
                </tr>
              ))
            )}
          </tbody>
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
            Mostrando {dadosFiltrados.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, dadosFiltrados.length)} de {dadosFiltrados.length} registros
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

export default IndicadoresOperacionaisTable;

