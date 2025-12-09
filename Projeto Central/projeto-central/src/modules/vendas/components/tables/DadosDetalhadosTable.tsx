/**
 * Componente DadosDetalhadosTable - Tabela de dados detalhados por unidade
 * Replica o estilo original do dashboard (sem medalhas e mini-gráficos)
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Download } from 'lucide-react';

interface DadosDetalhadosItem {
  posicao: number;
  nome: string;
  periodo?: string;
  valorRealizado: number;
  valorMeta: number;
  percentual: number;
}

type TipoVenda = 'total' | 'vendas' | 'posvendas';

interface DadosDetalhadosTableProps {
  data: DadosDetalhadosItem[];
  title: string;
  titleHighlight?: string;
  tipoSelecionado: TipoVenda;
  onTipoChange: (tipo: TipoVenda) => void;
  periodoLabel?: string;
}

export const DadosDetalhadosTable: React.FC<DadosDetalhadosTableProps> = ({
  data,
  title,
  titleHighlight,
  tipoSelecionado,
  onTipoChange,
  periodoLabel = '',
}) => {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({
    coluna: 'percentual',
    direcao: 'desc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Label do tipo selecionado
  const getTipoLabel = () => {
    switch (tipoSelecionado) {
      case 'vendas': return '(Vendas)';
      case 'posvendas': return '(Pós Venda)';
      default: return '(Total)';
    }
  };

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Formatar percentual
  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1).replace('.', ',') + '%';
  };

  // Calcular totais gerais
  const totais = useMemo(() => {
    const totalRealizado = data.reduce((sum, item) => sum + item.valorRealizado, 0);
    const totalMeta = data.reduce((sum, item) => sum + item.valorMeta, 0);
    const atingimentoTotal = totalMeta > 0 ? totalRealizado / totalMeta : 0;
    return { totalRealizado, totalMeta, atingimentoTotal };
  }, [data]);

  // Filtrar e ordenar dados
  const dadosFiltrados = useMemo(() => {
    let resultado = [...data];

    // Filtrar por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      resultado = resultado.filter(item =>
        item.nome.toLowerCase().includes(termoBusca)
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
    const tipoLabel = getTipoLabel();
    const headers = ['Unidade', 'Período', `VVR Realizado ${tipoLabel}`, `Meta VVR ${tipoLabel}`, `Atingimento VVR ${tipoLabel}`];
    const linhas = dadosFiltrados.map(item => [
      item.nome,
      item.periodo || periodoLabel,
      formatCurrency(item.valorRealizado),
      formatCurrency(item.valorMeta),
      formatPercent(item.percentual),
    ]);
    
    // Adicionar linha de total
    linhas.push([
      'TOTAL GERAL',
      periodoLabel,
      formatCurrency(totais.totalRealizado),
      formatCurrency(totais.totalMeta),
      formatPercent(totais.atingimentoTotal),
    ]);

    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_detalhados_${tipoSelecionado}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
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

  // Estilos dos botões de tipo (estilo da sidebar)
  const getBotaoClasses = (tipo: TipoVenda) => {
    const isActive = tipoSelecionado === tipo;
    return `
      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
      ${isActive
        ? 'bg-orange-500/10 border border-orange-500 text-orange-500'
        : 'text-gray-400 border border-transparent bg-dark-tertiary hover:bg-white/5'
      }
    `;
  };

  const tipoLabel = getTipoLabel();

  return (
    <div className="space-y-4">
      {/* Título */}
      <h2 className="section-title">
        {title}
        {titleHighlight && (
          <span className="section-title-highlight"> {titleHighlight}</span>
        )}
      </h2>

      {/* Botões de seleção de tipo */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['total', 'vendas', 'posvendas'] as TipoVenda[]).map((tipo) => (
          <button
            key={tipo}
            onClick={() => {
              onTipoChange(tipo);
              setPaginaAtual(1);
            }}
            className={getBotaoClasses(tipo)}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {tipo === 'total' ? 'Total' : tipo === 'vendas' ? 'Vendas' : 'Pós Venda'}
          </button>
        ))}
      </div>

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

      {/* Tabela com scroll apenas no corpo de dados */}
      <div 
        style={{ 
          borderRadius: '8px',
          border: '1px solid #444',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho fixo */}
        <table 
          style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              <th
                onClick={() => handleOrdenacao('nome')}
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
                  width: '20%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Unidade {renderIconeOrdenacao('nome')}
              </th>
              <th
                onClick={() => handleOrdenacao('periodo')}
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
                  width: '15%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Período {renderIconeOrdenacao('periodo')}
              </th>
              <th
                onClick={() => handleOrdenacao('valorRealizado')}
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
                  width: '22%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                VVR Realizado {tipoLabel} {renderIconeOrdenacao('valorRealizado')}
              </th>
              <th
                onClick={() => handleOrdenacao('valorMeta')}
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
                  width: '22%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Meta VVR {tipoLabel} {renderIconeOrdenacao('valorMeta')}
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
                  width: '21%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Atingimento VVR {tipoLabel} {renderIconeOrdenacao('percentual')}
              </th>
            </tr>
          </thead>
        </table>

        {/* Corpo da tabela com scroll */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              tableLayout: 'fixed',
            }}
          >
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
                    key={`${item.nome}-${index}`}
                    style={{
                      backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                      borderBottom: '1px solid #444',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                  >
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', width: '20%' }}>{item.nome}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', width: '15%' }}>{item.periodo || periodoLabel}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', width: '22%' }}>{formatCurrency(item.valorRealizado)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', width: '22%' }}>{formatCurrency(item.valorMeta)}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#F8F9FA', width: '21%' }}>{formatPercent(item.percentual)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Linha de Total Geral - sempre visível fora do scroll */}
        {dadosPaginados.length > 0 && (
          <table 
            style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              tableLayout: 'fixed',
            }}
          >
            <tfoot>
              <tr
                style={{
                  backgroundColor: '#2a2f36',
                  borderTop: '2px solid #ff6600',
                }}
              >
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                    width: '20%',
                  }}
                >
                  TOTAL GERAL
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                    width: '15%',
                  }}
                >
                  {periodoLabel}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                    width: '22%',
                  }}
                >
                  {formatCurrency(totais.totalRealizado)}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                    width: '22%',
                  }}
                >
                  {formatCurrency(totais.totalMeta)}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: '#ff6600',
                    width: '21%',
                  }}
                >
                  {formatPercent(totais.atingimentoTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
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

export default DadosDetalhadosTable;

