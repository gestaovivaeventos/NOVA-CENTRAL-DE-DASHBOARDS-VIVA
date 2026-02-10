/**
 * Tabela Consolidada por Unidade/Franquia
 * Com funcionalidade de expandir linhas para ver saúde dos fundos
 */

import React, { useState, useMemo } from 'react';
import { DadosPorFranquia } from '@/modules/carteira/types';
import { formatPercent, formatNumber } from '@/modules/carteira/utils/formatacao';
import { Download, ChevronDown, ChevronRight, AlertTriangle, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

// Cores para atingimento baseado no percentual
const getAtingimentoColor = (atingimento: number): { bg: string; text: string; bar: string } => {
  if (atingimento >= 1) return { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', bar: '#22c55e' };
  if (atingimento >= 0.8) return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', bar: '#3b82f6' };
  if (atingimento >= 0.6) return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', bar: '#f59e0b' };
  return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', bar: '#ef4444' };
};

// Cores dos cards de saúde
const SAUDE_CARDS = {
  critico: { 
    bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)', 
    border: '#ef4444', 
    text: '#ef4444',
    icon: AlertTriangle,
    label: 'CRÍTICO'
  },
  atencao: { 
    bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(180, 83, 9, 0.1) 100%)', 
    border: '#f59e0b', 
    text: '#f59e0b',
    icon: AlertCircle,
    label: 'ATENÇÃO'
  },
  quaseLa: { 
    bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(29, 78, 216, 0.1) 100%)', 
    border: '#3b82f6', 
    text: '#3b82f6',
    icon: TrendingUp,
    label: 'QUASE LÁ'
  },
  alcancada: { 
    bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(21, 128, 61, 0.1) 100%)', 
    border: '#22c55e', 
    text: '#22c55e',
    icon: CheckCircle,
    label: 'META ALCANÇADA'
  },
};

interface TabelaFranquiasProps {
  dados: DadosPorFranquia[];
  loading?: boolean;
}

const PAGE_SIZE = 10;

export default function TabelaFranquias({ dados, loading = false }: TabelaFranquiasProps) {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({
    coluna: 'atingimento',
    direcao: 'desc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasExpandidas, setLinhasExpandidas] = useState<Set<string>>(new Set());

  // Calcular totais gerais
  const totais = useMemo(() => {
    const totalFundos = dados.reduce((sum, item) => sum + item.totalFundos, 0);
    const totalAlunosAtivos = dados.reduce((sum, item) => sum + item.alunosAtivos, 0);
    const totalEventoPrincipal = dados.reduce((sum, item) => sum + item.alunosEventoPrincipal, 0);
    const totalInadimplentes = dados.reduce((sum, item) => sum + item.inadimplentes, 0);
    const totalNuncaPagaram = dados.reduce((sum, item) => sum + item.nuncaPagaram, 0);
    const percInadimplentes = totalAlunosAtivos > 0 ? totalInadimplentes / totalAlunosAtivos : 0;
    const percNuncaPagaram = totalAlunosAtivos > 0 ? totalNuncaPagaram / totalAlunosAtivos : 0;
    // Totais de saúde
    const totalSaude = {
      critico: dados.reduce((sum, item) => sum + (item.saudeFundos?.critico || 0), 0),
      atencao: dados.reduce((sum, item) => sum + (item.saudeFundos?.atencao || 0), 0),
      quaseLa: dados.reduce((sum, item) => sum + (item.saudeFundos?.quaseLa || 0), 0),
      alcancada: dados.reduce((sum, item) => sum + (item.saudeFundos?.alcancada || 0), 0),
    };
    
    return {
      totalFundos,
      totalAlunosAtivos,
      totalEventoPrincipal,
      totalInadimplentes,
      totalNuncaPagaram,
      percInadimplentes,
      percNuncaPagaram,
      totalSaude,
    };
  }, [dados]);

  // Filtrar por busca
  const dadosFiltrados = useMemo(() => {
    if (!busca) return dados;
    const termoBusca = busca.toLowerCase();
    return dados.filter(item => item.franquia.toLowerCase().includes(termoBusca));
  }, [dados, busca]);

  // Ordenar dados
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (ordenacao.coluna) {
        case 'franquia':
          valorA = a.franquia;
          valorB = b.franquia;
          break;
        case 'totalFundos':
          valorA = a.totalFundos;
          valorB = b.totalFundos;
          break;
        case 'alunosEventoPrincipal':
          valorA = a.alunosEventoPrincipal;
          valorB = b.alunosEventoPrincipal;
          break;
        case 'inadimplentes':
          valorA = a.inadimplentes;
          valorB = b.inadimplentes;
          break;
        case 'percInadimplentes':
          valorA = a.alunosAtivos > 0 ? a.inadimplentes / a.alunosAtivos : 0;
          valorB = b.alunosAtivos > 0 ? b.inadimplentes / b.alunosAtivos : 0;
          break;
        case 'nuncaPagaram':
          valorA = a.nuncaPagaram;
          valorB = b.nuncaPagaram;
          break;
        case 'percNuncaPagaram':
          valorA = a.alunosAtivos > 0 ? a.nuncaPagaram / a.alunosAtivos : 0;
          valorB = b.alunosAtivos > 0 ? b.nuncaPagaram / b.alunosAtivos : 0;
          break;
        default:
          return 0;
      }

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenacao.direcao === 'asc' 
          ? valorA.localeCompare(valorB) 
          : valorB.localeCompare(valorA);
      }

      return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
    });
  }, [dadosFiltrados, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(dadosOrdenados.length / PAGE_SIZE) || 1;
  const startIndex = (paginaAtual - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const dadosPaginados = dadosOrdenados.slice(startIndex, endIndex);

  // Alterar ordenação
  const handleOrdenacao = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
    setPaginaAtual(1);
  };

  // Toggle linha expandida
  const toggleLinha = (franquia: string) => {
    setLinhasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(franquia)) {
        novo.delete(franquia);
      } else {
        novo.add(franquia);
      }
      return novo;
    });
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

  // Renderizar card de saúde
  const renderSaudeCard = (tipo: keyof typeof SAUDE_CARDS, quantidade: number, total: number) => {
    const config = SAUDE_CARDS[tipo];
    const Icon = config.icon;
    const percentual = total > 0 ? ((quantidade / total) * 100).toFixed(1) : '0.0';
    
    return (
      <div
        style={{
          background: config.bg,
          border: `1px solid ${config.border}40`,
          borderRadius: '8px',
          padding: '12px 16px',
          flex: 1,
          minWidth: '140px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon size={14} style={{ color: config.text }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: config.text, textTransform: 'uppercase' }}>
              {config.label}
            </span>
          </div>
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F8F9FA' }}>
          {quantidade}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
          {percentual}% do total
        </div>
      </div>
    );
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = [
      'Unidade', 'Fundos Ativos', 'Evento Principal', 'Inadimplentes', '% Inadimplentes',
      'Nunca Pagaram', '% Nunca Pagaram', 'Crítico', 'Atenção', 'Quase Lá', 'Meta Alcançada'
    ];
    const linhas = dadosFiltrados.map(item => {
      const percInad = item.alunosAtivos > 0 ? (item.inadimplentes / item.alunosAtivos * 100).toFixed(1) + '%' : '0.0%';
      const percNunca = item.alunosAtivos > 0 ? (item.nuncaPagaram / item.alunosAtivos * 100).toFixed(1) + '%' : '0.0%';
      return [
        item.franquia,
        item.totalFundos,
        formatNumber(item.alunosEventoPrincipal),
        formatNumber(item.inadimplentes),
        percInad,
        formatNumber(item.nuncaPagaram),
        percNunca,
        item.saudeFundos?.critico || 0,
        item.saudeFundos?.atencao || 0,
        item.saudeFundos?.quaseLa || 0,
        item.saudeFundos?.alcancada || 0,
      ];
    });
    
    // Adicionar linha de total
    linhas.push([
      'TOTAL GERAL',
      totais.totalFundos,
      formatNumber(totais.totalEventoPrincipal),
      formatNumber(totais.totalInadimplentes),
      (totais.percInadimplentes * 100).toFixed(1) + '%',
      formatNumber(totais.totalNuncaPagaram),
      (totais.percNuncaPagaram * 100).toFixed(1) + '%',
      totais.totalSaude.critico,
      totais.totalSaude.atencao,
      totais.totalSaude.quaseLa,
      totais.totalSaude.alcancada,
    ]);

    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `carteira_unidades_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
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

  // Estilo do cabeçalho
  const headerStyle: React.CSSProperties = {
    padding: '12px 8px',
    textAlign: 'center',
    borderBottom: '2px solid #FF6600',
    color: '#adb5bd',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <h2 className="section-title">
        Consolidado por Unidade
      </h2>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#2a2f36' }}
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

      {/* Tabela */}
      <div style={{ borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
        {/* Cabeçalho */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              <th style={{ ...headerStyle, width: '4%', cursor: 'default' }}></th>
              <th
                onClick={() => handleOrdenacao('franquia')}
                style={{ ...headerStyle, width: '16%', textAlign: 'left', paddingLeft: '12px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Unidade {renderIconeOrdenacao('franquia')}
              </th>
              <th
                onClick={() => handleOrdenacao('totalFundos')}
                style={{ ...headerStyle, width: '8%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Fundos {renderIconeOrdenacao('totalFundos')}
              </th>
              <th
                onClick={() => handleOrdenacao('alunosEventoPrincipal')}
                style={{ ...headerStyle, width: '12%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Evento Princ. {renderIconeOrdenacao('alunosEventoPrincipal')}
              </th>
              <th
                onClick={() => handleOrdenacao('inadimplentes')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Inadimp. {renderIconeOrdenacao('inadimplentes')}
              </th>
              <th
                onClick={() => handleOrdenacao('percInadimplentes')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % Inadimp. {renderIconeOrdenacao('percInadimplentes')}
              </th>
              <th
                onClick={() => handleOrdenacao('nuncaPagaram')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Nunca Pag. {renderIconeOrdenacao('nuncaPagaram')}
              </th>
              <th
                onClick={() => handleOrdenacao('percNuncaPagaram')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % N. Pag. {renderIconeOrdenacao('percNuncaPagaram')}
              </th>
              <th style={{ ...headerStyle, width: '20%', cursor: 'default' }}>
                Saúde
              </th>
            </tr>
          </thead>
        </table>

        {/* Corpo da tabela com scroll */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <tbody>
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                dadosPaginados.map((item, index) => {
                  const isExpanded = linhasExpandidas.has(item.franquia);
                  const totalSaudeUnidade = (item.saudeFundos?.critico || 0) + (item.saudeFundos?.atencao || 0) + 
                                           (item.saudeFundos?.quaseLa || 0) + (item.saudeFundos?.alcancada || 0);
                  const percInad = item.alunosAtivos > 0 ? item.inadimplentes / item.alunosAtivos : 0;
                  const percNunca = item.alunosAtivos > 0 ? item.nuncaPagaram / item.alunosAtivos : 0;
                  
                  return (
                    <React.Fragment key={`${item.franquia}-${index}`}>
                      {/* Linha principal */}
                      <tr
                        onClick={() => toggleLinha(item.franquia)}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                          borderBottom: isExpanded ? 'none' : '1px solid #444',
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                      >
                        {/* Ícone de expansão */}
                        <td style={{ padding: '10px 8px', textAlign: 'center', width: '4%' }}>
                          {isExpanded ? (
                            <ChevronDown size={16} style={{ color: '#FF6600' }} />
                          ) : (
                            <ChevronRight size={16} style={{ color: '#6b7280' }} />
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'left', color: '#F8F9FA', width: '16%', fontWeight: 500 }}>
                          {item.franquia}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', width: '8%' }}>
                          {item.totalFundos}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: '#F8F9FA', width: '12%' }}>
                          {formatNumber(item.alunosEventoPrincipal)}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: item.inadimplentes > 0 ? '#ef4444' : '#F8F9FA', width: '10%' }}>
                          {formatNumber(item.inadimplentes)}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: percInad > 0.15 ? '#ef4444' : '#FF6600', width: '10%', fontWeight: 300 }}>
                          {(percInad * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: item.nuncaPagaram > 0 ? '#ef4444' : '#F8F9FA', width: '10%' }}>
                          {formatNumber(item.nuncaPagaram)}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', color: percNunca > 0.05 ? '#ef4444' : '#FF6600', width: '10%', fontWeight: 300 }}>
                          {(percNunca * 100).toFixed(1)}%
                        </td>
                        {/* Mini indicadores de saúde */}
                        <td style={{ padding: '10px 8px', width: '20%' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            {(item.saudeFundos?.critico || 0) > 0 && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                backgroundColor: 'rgba(239, 68, 68, 0.2)', 
                                color: '#ef4444' 
                              }}>
                                {item.saudeFundos?.critico}
                              </span>
                            )}
                            {(item.saudeFundos?.atencao || 0) > 0 && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                backgroundColor: 'rgba(245, 158, 11, 0.2)', 
                                color: '#f59e0b' 
                              }}>
                                {item.saudeFundos?.atencao}
                              </span>
                            )}
                            {(item.saudeFundos?.quaseLa || 0) > 0 && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                                color: '#3b82f6' 
                              }}>
                                {item.saudeFundos?.quaseLa}
                              </span>
                            )}
                            {(item.saudeFundos?.alcancada || 0) > 0 && (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '0.7rem', 
                                fontWeight: 600,
                                backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                                color: '#22c55e' 
                              }}>
                                {item.saudeFundos?.alcancada}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Linha expandida com cards de saúde */}
                      {isExpanded && (
                        <tr>
                          <td 
                            colSpan={9} 
                            style={{ 
                              padding: '0',
                              backgroundColor: index % 2 === 0 ? '#2d3238' : '#262a2f',
                              borderBottom: '1px solid #444',
                            }}
                          >
                            <div style={{ 
                              padding: '16px 24px',
                              display: 'flex',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#9ca3af', 
                                width: '100%',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}>
                                <span style={{ fontWeight: 600, color: '#F8F9FA' }}>Saúde dos Fundos - {item.franquia}</span>
                                <span style={{ color: '#6b7280' }}>|</span>
                                <span>{totalSaudeUnidade} fundos no total</span>
                              </div>
                              {renderSaudeCard('critico', item.saudeFundos?.critico || 0, totalSaudeUnidade)}
                              {renderSaudeCard('atencao', item.saudeFundos?.atencao || 0, totalSaudeUnidade)}
                              {renderSaudeCard('quaseLa', item.saudeFundos?.quaseLa || 0, totalSaudeUnidade)}
                              {renderSaudeCard('alcancada', item.saudeFundos?.alcancada || 0, totalSaudeUnidade)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Linha de Total Geral */}
        {dadosPaginados.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <tfoot>
              <tr style={{ backgroundColor: '#2a2f36', borderTop: '2px solid #ff6600' }}>
                <td style={{ padding: '12px 8px', width: '4%' }}></td>
                <td style={{ padding: '12px 12px', textAlign: 'left', fontWeight: 700, color: '#ff6600', width: '16%' }}>TOTAL GERAL</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '8%' }}>{totais.totalFundos}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '12%' }}>{formatNumber(totais.totalEventoPrincipal)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '10%' }}>{formatNumber(totais.totalInadimplentes)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '10%' }}>{totais.percInadimplentes.toFixed(1)}%</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '10%' }}>{formatNumber(totais.totalNuncaPagaram)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '10%' }}>{totais.percNuncaPagaram.toFixed(1)}%</td>
                <td style={{ padding: '12px 8px', width: '20%' }}>
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                      {totais.totalSaude.critico}
                    </span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                      {totais.totalSaude.atencao}
                    </span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                      {totais.totalSaude.quaseLa}
                    </span>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                      {totais.totalSaude.alcancada}
                    </span>
                  </div>
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
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                backgroundColor: paginaAtual === 1 ? '#333' : '#495057',
                color: paginaAtual === 1 ? '#6c757d' : '#F8F9FA',
                border: 'none',
                cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                opacity: paginaAtual === 1 ? 0.5 : 1,
              }}
            >
              Anterior
            </button>
            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                backgroundColor: paginaAtual === totalPaginas ? '#333' : '#495057',
                color: paginaAtual === totalPaginas ? '#6c757d' : '#F8F9FA',
                border: 'none',
                cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                opacity: paginaAtual === totalPaginas ? 0.5 : 1,
              }}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
