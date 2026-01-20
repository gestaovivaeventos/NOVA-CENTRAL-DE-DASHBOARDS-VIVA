/**
 * Tabela Resumo - Exibe todas as unidades com suas pontuções
 * Com funcionalidade de ordenação por coluna e exportação para Excel
 */

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

interface IndicadorPeso {
  indicador: string;
  quarter1: string;
  quarter2: string;
  quarter3: string;
  quarter4: string;
}

interface TabelaResumoProps {
  dados: any[];
  quarterSelecionado?: string;
  clusterSelecionado?: string;
  consultorSelecionado?: string;
  nomeColunaConsultor?: string;
  pesosIndicadores?: IndicadorPeso[];
}

// Mapeamento dos nomes de indicadores da planilha para as colunas dos dados
const MAPA_INDICADORES: Record<string, string> = {
  'VVR': 'vvr_12_meses',
  'VVR CARTEIRA': 'vvr_carteira',
  'ENDIVIDAMENTO': 'Indice_endividamento',
  'NPS': 'nps_geral',
  '% MC (ENTREGA)': 'indice_margem_entrega',
  'E-NPS': 'enps_rede',
  '% CONFORMIDADES OPERACIONAIS E FINANCEIRAS': 'conformidades',
  'RECLAME AQUI': 'reclame_aqui',
  '%COLABORADORES COM MAIS DE 1 ANO': 'colaboradores_mais_1_ano',
  'ESTRUTURA ORGANIZACIONAL': 'estrutura_organizacioanl',
  'CHURN': 'churn'
};

type OrdenacaoTipo = 'asc' | 'desc' | null;

export default function TabelaResumo({ 
  dados, 
  quarterSelecionado, 
  clusterSelecionado, 
  consultorSelecionado,
  nomeColunaConsultor = 'consultor',
  pesosIndicadores = []
}: TabelaResumoProps) {
  const [colunaOrdenada, setColunaOrdenada] = useState<string | null>(null);
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoTipo>(null);

  // Função para exportar para Excel
  const exportarParaExcel = () => {
    const dadosParaExportar = dadosOrdenados.map(item => {
      const linha: any = {};
      colunas.forEach(col => {
        linha[col.label] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '';
      });
      return linha;
    });
    
    const worksheet = XLSX.utils.json_to_sheet(dadosParaExportar);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumo PEX');
    
    const nomeArquivo = `PEX_Tabela_Resumo${quarterSelecionado ? '_QUARTER_' + quarterSelecionado : ''}.xlsx`;
    XLSX.writeFile(workbook, nomeArquivo);
  };

  // Filtrar dados pela QUARTER selecionada
  const dadosFiltrados = useMemo(() => {
    let resultado = dados;
    
    if (quarterSelecionado) {
      resultado = resultado.filter(item => item.quarter === quarterSelecionado);
    }
    
    if (clusterSelecionado) {
      resultado = resultado.filter(item => item.cluster === clusterSelecionado);
    }
    
    if (consultorSelecionado && nomeColunaConsultor) {
      resultado = resultado.filter(item => item[nomeColunaConsultor] === consultorSelecionado);
    }
    
    return resultado;
  }, [dados, quarterSelecionado, clusterSelecionado, consultorSelecionado, nomeColunaConsultor]);

  // Ordenar dados
  const dadosOrdenados = useMemo(() => {
    if (!colunaOrdenada || !direcaoOrdenacao) return dadosFiltrados;

    return [...dadosFiltrados].sort((a, b) => {
      let valorA = a[colunaOrdenada];
      let valorB = b[colunaOrdenada];

      const numA = parseFloat(valorA?.toString().replace(',', '.'));
      const numB = parseFloat(valorB?.toString().replace(',', '.'));

      if (!isNaN(numA) && !isNaN(numB)) {
        return direcaoOrdenacao === 'asc' ? numA - numB : numB - numA;
      }

      const strA = valorA?.toString().toLowerCase() || '';
      const strB = valorB?.toString().toLowerCase() || '';
      
      if (direcaoOrdenacao === 'asc') {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });
  }, [dadosFiltrados, colunaOrdenada, direcaoOrdenacao]);

  // Função para ordenar
  const handleOrdenar = (coluna: string) => {
    if (colunaOrdenada === coluna) {
      if (direcaoOrdenacao === 'asc') {
        setDirecaoOrdenacao('desc');
      } else if (direcaoOrdenacao === 'desc') {
        setDirecaoOrdenacao(null);
        setColunaOrdenada(null);
      }
    } else {
      setColunaOrdenada(coluna);
      setDirecaoOrdenacao('asc');
    }
  };

  // Ícone de ordenação
  const IconeOrdenacao = ({ coluna }: { coluna: string }) => {
    if (colunaOrdenada !== coluna) {
      return <span style={{ color: '#6c757d', marginLeft: '4px' }}>⇅</span>;
    }
    if (direcaoOrdenacao === 'asc') {
      return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↑</span>;
    }
    if (direcaoOrdenacao === 'desc') {
      return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↓</span>;
    }
    return null;
  };

  // Definir colunas
  const colunas = [
    { key: 'nm_unidade', label: 'Unidade' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'posicao_grupo', label: 'Posição Grupo' },
    { key: 'bonus', label: 'Bônus' },
    { key: 'pontuacao_com_bonus', label: 'Pont. c/ Bônus' },
    { key: 'pontuacao_sem_bonus', label: 'Pont. s/ Bônus' },
    { key: 'vvr_12_meses', label: 'VVR 12M' },
    { key: 'vvr_carteira', label: 'VVR Carteira' },
    { key: 'Indice_endividamento', label: 'Endiv.' },
    { key: 'nps_geral', label: 'NPS' },
    { key: 'indice_margem_entrega', label: 'Margem Entrega' },
    { key: 'enps_rede', label: 'eNPS' },
    { key: 'conformidades', label: 'Conform.' },
    { key: 'reclame_aqui', label: 'Reclame Aqui' },
    { key: 'colaboradores_mais_1_ano', label: 'Colab. +1 Ano' },
    { key: 'estrutura_organizacioanl', label: 'Estrutura Org.' },
    { key: 'churn', label: 'Churn' },
    { key: 'consultor', label: 'Consultor' },
    { key: 'quarter', label: 'Quarter' }
  ];

  // Função para obter o peso de um indicador baseado no quarter selecionado
  const obterPesoIndicador = (coluna: string): number => {
    // Encontrar o nome do indicador correspondente à coluna
    const nomeIndicador = Object.entries(MAPA_INDICADORES).find(([_, col]) => col === coluna)?.[0];
    if (!nomeIndicador) return 0;
    
    // Buscar o indicador nos pesos
    const indicadorPeso = pesosIndicadores.find(p => 
      p.indicador.toUpperCase().trim() === nomeIndicador.toUpperCase().trim()
    );
    if (!indicadorPeso) return 0;
    
    // Selecionar o peso do quarter correto
    let pesoStr = '0';
    switch (quarterSelecionado) {
      case '1': pesoStr = indicadorPeso.quarter1; break;
      case '2': pesoStr = indicadorPeso.quarter2; break;
      case '3': pesoStr = indicadorPeso.quarter3; break;
      case '4': pesoStr = indicadorPeso.quarter4; break;
      default: pesoStr = indicadorPeso.quarter1;
    }
    
    return parseFloat(pesoStr.replace(',', '.')) || 0;
  };

  // Função para calcular percentual de atingimento
  const calcularPercentual = (valor: any, key: string): { percentual: number; cor: string } | null => {
    const peso = obterPesoIndicador(key);
    if (!peso) return null;
    
    const valorNum = parseFloat(valor?.toString().replace(',', '.') || '0');
    const tetoMaximo = peso * 100;
    const percentual = (valorNum / tetoMaximo) * 100;
    
    const cor = percentual >= 80 ? '#00C853' : 
                percentual >= 50 ? '#FFC107' : '#FF4444';
    
    return { percentual, cor };
  };

  // Função para obter estilos de badge baseado no status
  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    if (!status) return {};
    const statusLower = status.toString().toLowerCase().trim();
    
    const baseStyle: React.CSSProperties = {
      padding: '4px 10px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      display: 'inline-block',
      letterSpacing: '0.5px',
    };
    
    if (statusLower === 'uti') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        color: '#FF4444',
        border: '1px solid #FF4444',
      };
    }
    if (statusLower.includes('atenc') || statusLower.includes('atenç')) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(255, 193, 7, 0.2)',
        color: '#FFC107',
        border: '1px solid #FFC107',
      };
    }
    if (statusLower.includes('saudav') || statusLower.includes('saudáv')) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 200, 83, 0.2)',
        color: '#00C853',
        border: '1px solid #00C853',
      };
    }
    return {};
  };

  return (
    <div>
      {/* Botão de Exportar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={exportarParaExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download size={16} />
          Exportar
        </button>
      </div>

      {/* Container com scroll vertical */}
      <div style={{ 
        maxHeight: '600px', 
        overflowY: 'auto',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              {colunas.map((coluna) => (
                <th
                  key={coluna.key}
                  onClick={() => handleOrdenar(coluna.key)}
                  style={{
                    color: '#adb5bd',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid #FF6600',
                    whiteSpace: 'nowrap',
                    lineHeight: '1.2',
                    transition: 'background-color 0.2s',
                    backgroundColor: '#2a2f36'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#343a40'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
                >
                  {coluna.label}
                  <IconeOrdenacao coluna={coluna.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosOrdenados.map((item, index) => (
              <tr
                key={index}
                style={{
                  backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
              >
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.nm_unidade}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.cluster}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontSize: '0.875rem', 
                  borderBottom: '1px solid #444', 
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  <span style={{
                    color: item['posicao_grupo']?.toString().toLowerCase() === 'uti' ? '#FF4444' :
                           item['posicao_grupo']?.toString().toLowerCase().includes('atenc') || item['posicao_grupo']?.toString().toLowerCase().includes('atenç') ? '#FFC107' :
                           item['posicao_grupo']?.toString().toLowerCase().includes('saudav') || item['posicao_grupo']?.toString().toLowerCase().includes('saudáv') ? '#00C853' :
                           '#F8F9FA'
                  }}>
                    {item['posicao_grupo'] || '-'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.bonus}
                </td>
                <td style={{ padding: '12px 8px', color: '#FF6600', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['pontuacao_com_bonus']}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['pontuacao_sem_bonus']}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.vvr_12_meses, 'vvr_12_meses');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.vvr_carteira, 'vvr_carteira');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.Indice_endividamento, 'Indice_endividamento');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.nps_geral, 'nps_geral');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.indice_margem_entrega, 'indice_margem_entrega');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.enps_rede, 'enps_rede');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.conformidades, 'conformidades');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontSize: '0.875rem', 
                  borderBottom: '1px solid #444', 
                  textAlign: 'center'
                }}>
                  {(() => {
                    const result = calcularPercentual(item.reclame_aqui, 'reclame_aqui');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.colaboradores_mais_1_ano, 'colaboradores_mais_1_ano');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.estrutura_organizacioanl, 'estrutura_organizacioanl');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {(() => {
                    const result = calcularPercentual(item.churn, 'churn');
                    return result ? <span style={{ color: result.cor, fontWeight: 600 }}>{result.percentual.toFixed(1)}%</span> : '-';
                  })()}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.consultor}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.quarter}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {dadosOrdenados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#adb5bd' }}>Nenhum dado disponível</p>
        </div>
      )}
    </div>
  );
}
