/**
 * TabelaSegmentoMercado - Análise por Segmento de Mercado
 * Mostra distribuição de desempenho por segmento (Padrão, Master, Mega, Giga)
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Franquia, SaudeFranquia } from '../types';

interface TabelaSegmentoMercadoProps {
  franquias: Franquia[];
  titulo?: string;
}

// Segmentos de mercado - Paleta profissional
const SEGMENTOS = [
  { key: 'Padrão', cor: '#6c757d', label: 'Padrão' },
  { key: 'Master', cor: '#6b8fa8', label: 'Master' },
  { key: 'Mega', cor: '#a8956b', label: 'Mega' },
  { key: 'Giga', cor: '#a87b5a', label: 'Giga' },
];

// Classificações de saúde para as colunas - Cores definidas pelo usuário
const CLASSIFICACOES: { key: SaudeFranquia; label: string; cor: string }[] = [
  { key: 'TOP_PERFORMANCE', label: 'TOP', cor: '#2980b9' },
  { key: 'PERFORMANDO', label: 'Performando', cor: '#27ae60' },
  { key: 'EM_CONSOLIDACAO', label: 'Consolidação', cor: '#e67e22' },
  { key: 'ATENCAO', label: 'Atenção', cor: '#f1c40f' },
  { key: 'UTI', label: 'UTI', cor: '#c0392b' },
];

export default function TabelaSegmentoMercado({ franquias, titulo = 'Análise por Segmento de Mercado' }: TabelaSegmentoMercadoProps) {
  const [expandedSegmentos, setExpandedSegmentos] = useState<Set<string>>(new Set());

  // Filtrar apenas franquias em operação (não implantação, não inativas)
  const franquiasEmOperacao = useMemo(() => {
    return franquias.filter(
      f => f.status === 'ATIVA' && f.maturidade !== 'IMPLANTACAO'
    );
  }, [franquias]);

  // Agrupar por segmento
  const dadosPorSegmento = useMemo(() => {
    return SEGMENTOS.map(segmento => {
      const franquiasDoSegmento = franquiasEmOperacao.filter(
        f => f.mercado?.toUpperCase() === segmento.key.toUpperCase()
      );
      
      const total = franquiasDoSegmento.length;
      
      // Contar por classificação
      const porClassificacao = CLASSIFICACOES.map(classif => {
        // Agrupa UTI, UTI_RECUPERACAO, UTI_REPASSE na coluna UTI
        let count = 0;
        if (classif.key === 'UTI') {
          count = franquiasDoSegmento.filter(
            f => f.saude === 'UTI' || f.saude === 'UTI_RECUPERACAO' || f.saude === 'UTI_REPASSE'
          ).length;
        } else {
          count = franquiasDoSegmento.filter(f => f.saude === classif.key).length;
        }
        
        return {
          ...classif,
          count,
          percentual: total > 0 ? (count / total) * 100 : 0,
        };
      });
      
      return {
        ...segmento,
        total,
        porClassificacao,
        franquias: franquiasDoSegmento,
      };
    }).filter(s => s.total > 0); // Mostrar apenas segmentos com franquias
  }, [franquiasEmOperacao]);

  const toggleSegmento = (key: string) => {
    const newExpanded = new Set(expandedSegmentos);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSegmentos(newExpanded);
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
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #FF6600',
      }}>
        <h2 style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#F8F9FA',
          margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          {titulo}
        </h2>
        <p style={{
          color: '#6c757d',
          fontSize: '0.85rem',
          margin: '4px 0 0 0',
        }}>
          Distribuição de desempenho por segmento de mercado (apenas franquias em operação)
        </p>
      </div>

      {/* Tabela */}
      {dadosPorSegmento.length > 0 ? (
        <div style={{ overflowX: 'auto', marginTop: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #3a3f46' }}>
                <th style={{
                  textAlign: 'left',
                  padding: '12px 16px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#adb5bd',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  width: '200px',
                }}>
                  Segmento
                </th>
                {CLASSIFICACOES.map(classif => (
                  <th key={classif.key} style={{
                    textAlign: 'center',
                    padding: '12px 16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: classif.cor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {classif.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dadosPorSegmento.map((segmento, index) => {
                const isEven = index % 2 === 0;
                return (
                <React.Fragment key={segmento.key}>
                  <tr
                    onClick={() => toggleSegmento(segmento.key)}
                    style={{
                      backgroundColor: isEven ? '#2d3035' : 'transparent',
                      borderBottom: '1px solid #3a3f46',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#3d4248';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isEven ? '#2d3035' : 'transparent';
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {expandedSegmentos.has(segmento.key) ? (
                          <ChevronDown size={16} color="#adb5bd" />
                        ) : (
                          <ChevronRight size={16} color="#adb5bd" />
                        )}
                        <span
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: segmento.cor,
                          }}
                        />
                        <div>
                          <span style={{
                            color: '#F8F9FA',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                          }}>
                            {segmento.label}
                          </span>
                          <span style={{
                            color: '#6c757d',
                            fontSize: '0.8rem',
                            marginLeft: '8px',
                          }}>
                            {segmento.total} franquias
                          </span>
                        </div>
                      </div>
                    </td>
                    {segmento.porClassificacao.map(classif => (
                      <td key={classif.key} style={{
                        textAlign: 'center',
                        padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span style={{
                            color: classif.count > 0 ? classif.cor : '#6c757d',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            fontFamily: "'Orbitron', 'Poppins', sans-serif",
                          }}>
                            {classif.count}
                          </span>
                          <span style={{
                            color: '#6c757d',
                            fontSize: '0.7rem',
                          }}>
                            {classif.percentual.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  {/* Linhas expandidas com franquias */}
                  {expandedSegmentos.has(segmento.key) && segmento.franquias.map((f, idx) => (
                    <tr key={f.id} style={{
                      backgroundColor: idx % 2 === 0 ? '#252830' : '#2a2e33',
                      borderBottom: '1px solid #3a3f46',
                    }}>
                      <td style={{ padding: '8px 16px 8px 48px' }}>
                        <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>
                          {f.nome}
                        </span>
                      </td>
                      {CLASSIFICACOES.map(classif => {
                        const isMatch = classif.key === 'UTI'
                          ? (f.saude === 'UTI' || f.saude === 'UTI_RECUPERACAO' || f.saude === 'UTI_REPASSE')
                          : f.saude === classif.key;
                        return (
                          <td key={classif.key} style={{
                            textAlign: 'center',
                            padding: '8px 16px',
                          }}>
                            {isMatch && (
                              <span style={{
                                backgroundColor: classif.cor,
                                color: classif.key === 'ATENCAO' ? '#000' : '#fff',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                              }}>
                                {f.pontuacaoPex > 0 ? f.pontuacaoPex.toFixed(2) : '-'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#212529',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          border: '1px dashed #555',
          marginTop: '16px',
        }}>
          <p style={{
            color: '#6c757d',
            fontSize: '0.9rem',
            margin: 0,
          }}>
            Nenhuma franquia em operação com segmento de mercado definido.
          </p>
        </div>
      )}
    </div>
  );
}
