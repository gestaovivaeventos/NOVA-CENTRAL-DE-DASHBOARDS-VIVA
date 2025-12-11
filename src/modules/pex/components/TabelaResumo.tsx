/**
 * Tabela Resumo - Exibe todas as unidades com suas pontuções
 * Com funcionalidade de ordenação por coluna e exportação para Excel
 */

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

interface TabelaResumoProps {
  dados: any[];
  quarterSelecionado?: string;
  clusterSelecionado?: string;
  consultorSelecionado?: string;
  nomeColunaConsultor?: string;
}

type OrdenacaoTipo = 'asc' | 'desc' | null;

export default function TabelaResumo({ 
  dados, 
  quarterSelecionado, 
  clusterSelecionado, 
  consultorSelecionado,
  nomeColunaConsultor = 'Consultor'
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
      resultado = resultado.filter(item => item.QUARTER === quarterSelecionado);
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
    { key: 'saude_franquia', label: 'Saúde Franquia' },
    { key: 'Bonus', label: 'Bônus' },
    { key: 'Pontuação com bonus', label: 'Pont. c/ Bônus' },
    { key: 'Pontuação sem bonus', label: 'Pont. s/ Bônus' },
    { key: 'VVR', label: 'VVR' },
    { key: 'MAC', label: 'MAC' },
    { key: 'Endividamento', label: 'Endiv.' },
    { key: 'NPS', label: 'NPS' },
    { key: 'MC %\n(entrega)', label: 'MC %' },
    { key: 'Satisfação do colaborador - e-NPS', label: 'Satisf. Colab.' },
    { key: '*Conformidades', label: 'Conform.' },
    { key: 'RECLAME AQUI', label: 'Reclame Aqui' },
    { key: 'Consultor', label: 'Consultor' }
  ];

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
                    color: item['saude_franquia']?.toString().toLowerCase() === 'uti' ? '#FF4444' :
                           item['saude_franquia']?.toString().toLowerCase().includes('atenc') || item['saude_franquia']?.toString().toLowerCase().includes('atenç') ? '#FFC107' :
                           item['saude_franquia']?.toString().toLowerCase().includes('saudav') || item['saude_franquia']?.toString().toLowerCase().includes('saudáv') ? '#00C853' :
                           '#F8F9FA'
                  }}>
                    {item['saude_franquia'] || '-'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.Bonus}
                </td>
                <td style={{ padding: '12px 8px', color: '#FF6600', fontSize: '0.875rem', fontWeight: 600, borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['Pontuação com bonus'] || item['Pontuação com Bonus']}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['Pontuação sem bonus']}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.VVR}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.MAC}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.Endividamento}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.NPS}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['MC %\n(entrega)']}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['Satisfação do colaborador - e-NPS']}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item['*Conformidades']}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  fontSize: '0.875rem', 
                  borderBottom: '1px solid #444', 
                  textAlign: 'center'
                }}>
                  {item['RECLAME AQUI'] ? (
                    <span style={getStatusBadgeStyle(item['RECLAME AQUI'])}>
                      {item['RECLAME AQUI']}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px 8px', color: '#F8F9FA', fontSize: '0.875rem', borderBottom: '1px solid #444', textAlign: 'center' }}>
                  {item.Consultor}
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
