/**
 * TabelaClassificacaoPEX - Tabela de franquias por classificação PEX
 * Exibe franquias em colunas por classificação com flags e scores
 */

import React from 'react';
import { AlertTriangle, Users, Shield, Award, TrendingUp, AlertCircle, HeartPulse } from 'lucide-react';
import { Franquia, ClassificacaoPEX } from '../types';

interface TabelaClassificacaoPEXProps {
  franquias: Franquia[];
}

// Configuração das classificações
const CLASSIFICACOES: { 
  key: ClassificacaoPEX; 
  label: string; 
  cor: string; 
  bg: string;
  icon: React.ReactNode;
}[] = [
  { key: 'TOP_PERFORMANCE', label: 'TOP Performance', cor: '#000', bg: '#28a745', icon: <Award size={16} /> },
  { key: 'PERFORMANDO', label: 'Performando', cor: '#000', bg: '#20c997', icon: <TrendingUp size={16} /> },
  { key: 'ATENCAO', label: 'Atenção', cor: '#000', bg: '#ffc107', icon: <AlertCircle size={16} /> },
  { key: 'UTI_RECUPERACAO', label: 'UTI Recuperação', cor: '#fff', bg: '#dc3545', icon: <HeartPulse size={16} /> },
  { key: 'UTI_REPASSE', label: 'UTI Repasse', cor: '#fff', bg: '#c0392b', icon: <HeartPulse size={16} /> },
];

export default function TabelaClassificacaoPEX({ franquias }: TabelaClassificacaoPEXProps) {
  // Filtrar apenas franquias em operação (que têm classificação PEX válida)
  const franquiasEmOperacao = franquias.filter(
    f => f.status === 'ATIVA' && f.statusOperacao === 'OPERACAO'
  );

  // Agrupar por classificação
  const franquiasPorClassificacao = CLASSIFICACOES.reduce((acc, classificacao) => {
    acc[classificacao.key] = franquiasEmOperacao.filter(f => f.classificacaoPEX === classificacao.key);
    return acc;
  }, {} as Record<ClassificacaoPEX, Franquia[]>);

  // Encontrar o maior número de franquias em uma coluna
  const maxLinhas = Math.max(...Object.values(franquiasPorClassificacao).map(arr => arr.length), 1);

  const renderFlags = (franquia: Franquia) => {
    const flags = [];
    if (franquia.flags.socioOperador) {
      flags.push(
        <span key="socio" title="Sócio Operador" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '3px',
          backgroundColor: '#e74c3c',
          color: '#fff',
          marginRight: '3px',
        }}>
          <Users size={10} />
        </span>
      );
    }
    if (franquia.flags.timeCritico) {
      flags.push(
        <span key="time" title="Time Crítico" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '3px',
          backgroundColor: '#f39c12',
          color: '#fff',
          marginRight: '3px',
        }}>
          <AlertTriangle size={10} />
        </span>
      );
    }
    if (franquia.flags.governanca) {
      flags.push(
        <span key="gov" title="Governança" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '3px',
          backgroundColor: '#9b59b6',
          color: '#fff',
          marginRight: '3px',
        }}>
          <Shield size={10} />
        </span>
      );
    }
    return flags.length > 0 ? <div style={{ display: 'flex' }}>{flags}</div> : null;
  };

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      <h3 style={{
        color: '#adb5bd',
        fontSize: '1rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontFamily: 'Poppins, sans-serif',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #555',
      }}>
        Franquias por Classificação PEX
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${CLASSIFICACOES.length}, minmax(180px, 1fr))`,
          gap: '12px',
        }}>
          {/* Cabeçalhos das colunas */}
          {CLASSIFICACOES.map((classificacao) => (
            <div 
              key={classificacao.key}
              style={{
                backgroundColor: classificacao.bg,
                color: classificacao.cor,
                padding: '12px',
                borderRadius: '8px 8px 0 0',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {classificacao.icon}
              <span>{classificacao.label}</span>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
              }}>
                {franquiasPorClassificacao[classificacao.key].length}
              </span>
            </div>
          ))}

          {/* Colunas de franquias */}
          {CLASSIFICACOES.map((classificacao) => (
            <div 
              key={`col-${classificacao.key}`}
              style={{
                backgroundColor: '#212529',
                borderRadius: '0 0 8px 8px',
                padding: '8px',
                minHeight: '200px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {franquiasPorClassificacao[classificacao.key].length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '20px',
                  fontSize: '0.8rem',
                }}>
                  Nenhuma franquia
                </div>
              ) : (
                franquiasPorClassificacao[classificacao.key].map((franquia) => (
                  <div
                    key={franquia.id}
                    style={{
                      backgroundColor: '#343A40',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${classificacao.bg}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        color: '#F8F9FA',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        flex: 1,
                      }}>
                        {franquia.nome}
                      </span>
                      <span style={{
                        color: classificacao.bg,
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        fontFamily: "'Orbitron', sans-serif",
                        marginLeft: '8px',
                      }}>
                        {franquia.scorePEX}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        color: '#6c757d',
                        fontSize: '0.7rem',
                      }}>
                        {franquia.cidade}/{franquia.estado}
                      </span>
                      {renderFlags(franquia)}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda de flags */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #444',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: '#6c757d', fontSize: '0.75rem', fontWeight: 600 }}>FLAGS:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#e74c3c',
            color: '#fff',
          }}>
            <Users size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Sócio Operador</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#f39c12',
            color: '#fff',
          }}>
            <AlertTriangle size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Time Crítico</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#9b59b6',
            color: '#fff',
          }}>
            <Shield size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Governança</span>
        </div>
      </div>
    </div>
  );
}
