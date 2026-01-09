/**
 * TabelaSegmentoMercado - Tabela com análise por segmento de mercado
 * Mostra distribuição de franquias TOP, PERFORMANDO, ATENÇÃO e UTI por segmento
 * Com funcionalidade de expansão para ver detalhes das franquias
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Franquia, SegmentoMercado } from '../types';

interface TabelaSegmentoMercadoProps {
  franquias: Franquia[];
  titulo?: string;
}

// Labels para segmentos
const SEGMENTO_LABELS: Record<SegmentoMercado, string> = {
  'PADRAO': 'Padrão',
  'MASTER': 'Master',
  'MEGA': 'Mega',
  'GIGA': 'Giga',
};

// Cores para cada segmento
const SEGMENTO_CORES: Record<SegmentoMercado, string> = {
  'PADRAO': '#6c757d',
  'MASTER': '#17a2b8',
  'MEGA': '#ffc107',
  'GIGA': '#FF6600',
};

// Cores para classificação PEX
const CLASSIFICACAO_CORES: Record<string, string> = {
  'TOP_PERFORMANCE': '#28a745',
  'PERFORMANDO': '#20c997',
  'ATENCAO': '#ffc107',
  'UTI_RECUPERACAO': '#dc3545',
  'UTI_REPASSE': '#c0392b',
};

const CLASSIFICACAO_LABELS: Record<string, string> = {
  'TOP_PERFORMANCE': 'TOP',
  'PERFORMANDO': 'Performando',
  'ATENCAO': 'Atenção',
  'UTI_RECUPERACAO': 'UTI Recup.',
  'UTI_REPASSE': 'UTI Repasse',
};

// Ordem hierárquica de classificação para comparação
const ORDEM_CLASSIFICACAO: Record<string, number> = {
  'TOP_PERFORMANCE': 4,
  'PERFORMANDO': 3,
  'ATENCAO': 2,
  'UTI_RECUPERACAO': 1,
  'UTI_REPASSE': 0,
};

// Helper para indicar melhora ou piora na classificação
const getIndicadorMudanca = (atual: string, anterior: string) => {
  const ordemAtual = ORDEM_CLASSIFICACAO[atual] || 0;
  const ordemAnterior = ORDEM_CLASSIFICACAO[anterior] || 0;
  
  if (ordemAtual > ordemAnterior) {
    return { simbolo: '▲', cor: '#28a745' }; // Melhorou
  } else {
    return { simbolo: '▼', cor: '#dc3545' }; // Piorou
  }
};

export default function TabelaSegmentoMercado({ franquias, titulo = 'Análise por Segmento de Mercado' }: TabelaSegmentoMercadoProps) {
  const [expandedSegmentos, setExpandedSegmentos] = useState<Set<SegmentoMercado>>(new Set());
  const dadosSegmentos = useMemo(() => {
    // Considerar apenas franquias ativas em operação
    const franquiasOperacao = franquias.filter(f => f.status === 'ATIVA' && f.statusOperacao === 'OPERACAO');

    const segmentos: SegmentoMercado[] = ['PADRAO', 'MASTER', 'MEGA', 'GIGA'];
    
    return segmentos.map(segmento => {
      const franquiasSegmento = franquiasOperacao.filter(f => f.segmentoMercado === segmento);
      const total = franquiasSegmento.length;

      if (total === 0) {
        return {
          segmento,
          label: SEGMENTO_LABELS[segmento],
          cor: SEGMENTO_CORES[segmento],
          total: 0,
          franquias: [],
          topPerformance: { qtd: 0, perc: 0 },
          performando: { qtd: 0, perc: 0 },
          atencao: { qtd: 0, perc: 0 },
          uti: { qtd: 0, perc: 0 },
        };
      }

      const topPerformance = franquiasSegmento.filter(f => f.classificacaoPEX === 'TOP_PERFORMANCE').length;
      const performando = franquiasSegmento.filter(f => f.classificacaoPEX === 'PERFORMANDO').length;
      const atencao = franquiasSegmento.filter(f => f.classificacaoPEX === 'ATENCAO').length;
      const uti = franquiasSegmento.filter(f => f.classificacaoPEX === 'UTI_RECUPERACAO' || f.classificacaoPEX === 'UTI_REPASSE').length;

      return {
        segmento,
        label: SEGMENTO_LABELS[segmento],
        cor: SEGMENTO_CORES[segmento],
        total,
        franquias: franquiasSegmento.sort((a, b) => b.scorePEX - a.scorePEX), // Ordenar por score descendente
        topPerformance: { qtd: topPerformance, perc: ((topPerformance / total) * 100) },
        performando: { qtd: performando, perc: ((performando / total) * 100) },
        atencao: { qtd: atencao, perc: ((atencao / total) * 100) },
        uti: { qtd: uti, perc: ((uti / total) * 100) },
      };
    }).filter(item => item.total > 0); // Mostrar apenas segmentos com franquias
  }, [franquias]);

  const toggleSegmento = (segmento: SegmentoMercado) => {
    setExpandedSegmentos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmento)) {
        newSet.delete(segmento);
      } else {
        newSet.add(segmento);
      }
      return newSet;
    });
  };

  if (dadosSegmentos.length === 0) {
    return (
      <div style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        color: '#adb5bd',
      }}>
        <p style={{ fontSize: '1rem' }}>Nenhuma franquia em operação para análise</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      {/* Título */}
      <div style={{
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #555',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '1.3rem',
          fontWeight: 600,
          color: '#F8F9FA',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {titulo}
        </h3>
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '0.85rem',
          color: '#adb5bd',
          fontFamily: "'Poppins', sans-serif",
        }}>
          Distribuição de desempenho por segmento de mercado (apenas franquias em operação)
        </p>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left',
                padding: '14px 16px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Segmento
              </th>
              <th style={{
                textAlign: 'center',
                padding: '14px 16px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                fontFamily: "'Poppins', sans-serif",
              }}>
                TOP
              </th>
              <th style={{
                textAlign: 'center',
                padding: '14px 16px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Performando
              </th>
              <th style={{
                textAlign: 'center',
                padding: '14px 16px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Atenção
              </th>
              <th style={{
                textAlign: 'center',
                padding: '14px 16px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                fontFamily: "'Poppins', sans-serif",
              }}>
                UTI
              </th>
            </tr>
          </thead>
          <tbody>
            {dadosSegmentos.map((item) => {
              const isExpanded = expandedSegmentos.has(item.segmento);
              
              return (
                <React.Fragment key={item.segmento}>
                  <tr 
                    onClick={() => toggleSegmento(item.segmento)}
                    style={{
                      transition: 'background-color 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2f36';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Segmento */}
                    <td style={{
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Ícone de expansão */}
                        <div style={{ display: 'flex', alignItems: 'center', color: '#adb5bd' }}>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '3px',
                          backgroundColor: item.cor,
                        }} />
                        <div>
                          <div style={{
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            color: '#F8F9FA',
                            fontFamily: "'Poppins', sans-serif",
                          }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#adb5bd',
                            fontFamily: "'Poppins', sans-serif",
                          }}>
                            {item.total} {item.total === 1 ? 'franquia' : 'franquias'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* TOP Performance */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#28a745',
                        fontFamily: "'Orbitron', 'Poppins', sans-serif",
                        marginBottom: '4px',
                      }}>
                        {item.topPerformance.qtd}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#adb5bd',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {item.topPerformance.perc.toFixed(1)}%
                      </div>
                    </td>

                    {/* Performando */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#20c997',
                        fontFamily: "'Orbitron', 'Poppins', sans-serif",
                        marginBottom: '4px',
                      }}>
                        {item.performando.qtd}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#adb5bd',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {item.performando.perc.toFixed(1)}%
                      </div>
                    </td>

                    {/* Atenção */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#ffc107',
                        fontFamily: "'Orbitron', 'Poppins', sans-serif",
                        marginBottom: '4px',
                      }}>
                        {item.atencao.qtd}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#adb5bd',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {item.atencao.perc.toFixed(1)}%
                      </div>
                    </td>

                    {/* UTI */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#dc3545',
                        fontFamily: "'Orbitron', 'Poppins', sans-serif",
                        marginBottom: '4px',
                      }}>
                        {item.uti.qtd}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#adb5bd',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {item.uti.perc.toFixed(1)}%
                      </div>
                    </td>
                  </tr>

                  {/* Linhas expandidas com as franquias */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} style={{
                        padding: 0,
                        backgroundColor: '#1f2329',
                        borderBottom: '1px solid #3a3f46',
                      }}>
                        <div style={{
                          padding: '16px 24px',
                          maxHeight: '400px',
                          overflowY: 'auto',
                        }}>
                          {/* Header das franquias */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr',
                            gap: '12px',
                            padding: '8px 12px',
                            marginBottom: '8px',
                            borderBottom: '1px solid #3a3f46',
                          }}>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6c757d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: "'Poppins', sans-serif",
                            }}>
                              Franquia
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6c757d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: "'Poppins', sans-serif",
                              textAlign: 'center',
                            }}>
                              Score PEX
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6c757d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: "'Poppins', sans-serif",
                              textAlign: 'center',
                            }}>
                              Classificação Atual
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6c757d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: "'Poppins', sans-serif",
                              textAlign: 'center',
                            }}>
                              Classif. Mês Anterior
                            </div>
                          </div>

                          {/* Lista de franquias */}
                          {item.franquias.map((franquia) => (
                            <div
                              key={franquia.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                gap: '12px',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                marginBottom: '4px',
                                transition: 'background-color 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#2a2f36';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {/* Nome da Franquia */}
                              <div style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: '#F8F9FA',
                                fontFamily: "'Poppins', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                              }}>
                                {franquia.nome}
                              </div>

                              {/* Score PEX */}
                              <div style={{
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '16px',
                                  backgroundColor: CLASSIFICACAO_CORES[franquia.classificacaoPEX] + '20',
                                  border: `1px solid ${CLASSIFICACAO_CORES[franquia.classificacaoPEX]}`,
                                }}>
                                  <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: CLASSIFICACAO_CORES[franquia.classificacaoPEX],
                                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                                  }}>
                                    {franquia.scorePEX.toFixed(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Classificação Atual */}
                              <div style={{
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  backgroundColor: CLASSIFICACAO_CORES[franquia.classificacaoPEX],
                                  color: franquia.classificacaoPEX === 'ATENCAO' ? '#000' : '#fff',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  fontFamily: "'Poppins', sans-serif",
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {CLASSIFICACAO_LABELS[franquia.classificacaoPEX]}
                                </span>
                                {/* Indicador de mudança */}
                                {franquia.classificacaoPEX !== franquia.classificacaoPEXAnterior && (
                                  <div style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    backgroundColor: getIndicadorMudanca(franquia.classificacaoPEX, franquia.classificacaoPEXAnterior).cor,
                                    color: '#fff',
                                  }}>
                                    {getIndicadorMudanca(franquia.classificacaoPEX, franquia.classificacaoPEXAnterior).simbolo}
                                  </div>
                                )}
                              </div>

                              {/* Classificação Mês Anterior */}
                              <div style={{
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '4px',
                                  backgroundColor: CLASSIFICACAO_CORES[franquia.classificacaoPEXAnterior],
                                  color: franquia.classificacaoPEXAnterior === 'ATENCAO' ? '#000' : '#fff',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  fontFamily: "'Poppins', sans-serif",
                                  textTransform: 'uppercase',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {CLASSIFICACAO_LABELS[franquia.classificacaoPEXAnterior]}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
