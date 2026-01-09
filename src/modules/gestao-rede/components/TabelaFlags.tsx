/**
 * TabelaFlags - Tabela com análise de flags estruturais
 * Mostra total de franquias com cada flag ativa
 * Com funcionalidade de expansão para ver detalhes das franquias
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Franquia, ClassificacaoPEX } from '../types';

interface TabelaFlagsProps {
  franquias: Franquia[];
  titulo?: string;
}

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

// Informações das flags
const FLAGS_INFO = {
  socioOperador: {
    label: 'Sócio Operador',
    cor: '#dc3545',
    descricao: 'Franquias com alerta de sócio operador',
  },
  timeCritico: {
    label: 'Time Crítico',
    cor: '#ffc107',
    descricao: 'Franquias com time em situação crítica',
  },
  governanca: {
    label: 'Governança',
    cor: '#fd7e14',
    descricao: 'Franquias com problemas de governança',
  },
};

type FlagKey = keyof typeof FLAGS_INFO;

export default function TabelaFlags({ franquias, titulo = 'Análise de Flags Estruturais' }: TabelaFlagsProps) {
  const [expandedFlags, setExpandedFlags] = useState<Set<FlagKey>>(new Set());

  // Agrupa franquias por flag
  const dadosFlags = useMemo(() => {
    const resultado: Array<{
      flag: FlagKey;
      label: string;
      cor: string;
      descricao: string;
      total: number;
      percentual: number;
      franquias: Franquia[];
    }> = [];

    // Filtra apenas franquias ativas em operação
    const franquiasAtivas = franquias.filter(
      f => f.status === 'ATIVA' && f.statusOperacao === 'OPERACAO'
    );

    const totalFranquias = franquiasAtivas.length;

    // Para cada flag, agrupa as franquias
    Object.entries(FLAGS_INFO).forEach(([key, info]) => {
      const flagKey = key as FlagKey;
      const franquiasComFlag = franquiasAtivas.filter(f => f.flags[flagKey]);

      resultado.push({
        flag: flagKey,
        label: info.label,
        cor: info.cor,
        descricao: info.descricao,
        total: franquiasComFlag.length,
        percentual: totalFranquias > 0 ? (franquiasComFlag.length / totalFranquias) * 100 : 0,
        franquias: franquiasComFlag.sort((a, b) => b.scorePEX - a.scorePEX), // Ordena por score decrescente
      });
    });

    return resultado;
  }, [franquias]);

  const toggleFlag = (flag: FlagKey) => {
    const newExpanded = new Set(expandedFlags);
    if (newExpanded.has(flag)) {
      newExpanded.delete(flag);
    } else {
      newExpanded.add(flag);
    }
    setExpandedFlags(newExpanded);
  };

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Título */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <AlertTriangle size={24} color="#ffc107" />
        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#F8F9FA',
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          {titulo}
        </h2>
      </div>

      {/* Tabela */}
      <div style={{
        overflowX: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}>
          {/* Header */}
          <thead>
            <tr style={{
              borderBottom: '2px solid #3a3f46',
            }}>
              <th style={{
                textAlign: 'left',
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Flag
              </th>
              <th style={{
                textAlign: 'center',
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Poppins', sans-serif",
              }}>
                Total Franquias
              </th>
              <th style={{
                textAlign: 'center',
                padding: '12px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#6c757d',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: "'Poppins', sans-serif",
              }}>
                % do Total
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {dadosFlags.map((item) => {
              const isExpanded = expandedFlags.has(item.flag);
              
              return (
                <React.Fragment key={item.flag}>
                  <tr 
                    onClick={() => item.total > 0 && toggleFlag(item.flag)}
                    style={{
                      transition: 'background-color 0.2s',
                      cursor: item.total > 0 ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => {
                      if (item.total > 0) {
                        e.currentTarget.style.backgroundColor = '#2a2f36';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Flag */}
                    <td style={{
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Ícone de expansão */}
                        {item.total > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', color: '#adb5bd' }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        )}
                        
                        {/* Indicador de cor */}
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
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
                            fontSize: '0.7rem',
                            color: '#adb5bd',
                            fontFamily: "'Poppins', sans-serif",
                          }}>
                            {item.descricao}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: item.total > 0 ? item.cor : '#6c757d',
                        fontFamily: "'Orbitron', 'Poppins', sans-serif",
                      }}>
                        {item.total}
                      </div>
                    </td>

                    {/* Percentual */}
                    <td style={{
                      textAlign: 'center',
                      padding: '16px',
                      borderBottom: isExpanded ? 'none' : '1px solid #3a3f46',
                    }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: item.total > 0 ? '#F8F9FA' : '#6c757d',
                        fontFamily: "'Poppins', sans-serif",
                      }}>
                        {item.percentual.toFixed(1)}%
                      </div>
                    </td>
                  </tr>

                  {/* Linhas expandidas com as franquias */}
                  {isExpanded && item.total > 0 && (
                    <tr>
                      <td colSpan={3} style={{
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
                              Classificação
                            </div>
                            <div style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: '#6c757d',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              fontFamily: "'Poppins', sans-serif",
                            }}>
                              Cidade/UF
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

                              {/* Classificação */}
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
                              </div>

                              {/* Cidade/UF */}
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#adb5bd',
                                fontFamily: "'Poppins', sans-serif",
                                display: 'flex',
                                alignItems: 'center',
                              }}>
                                {franquia.cidade}/{franquia.estado}
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
