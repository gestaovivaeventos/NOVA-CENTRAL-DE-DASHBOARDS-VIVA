/**
 * TabelaFranquias - Tabela com lista de franquias
 * Padrão Viva Eventos - Com paginação e tags PEX
 * Atualizado para novos tipos da planilha BASE GESTAO REDE
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, AlertTriangle, Users, Shield, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Franquia, SaudeFranquia } from '../types';

interface TabelaFranquiasProps {
  franquias: Franquia[];
  titulo?: string;
  filtros?: {
    maturidade?: string[];
    classificacao?: string[];
    flags?: string[];
  };
}

type CampoOrdenacao = 'nome' | 'status' | 'dataInauguracao' | 'maturidade' | 'pontuacaoPex' | 'saude' | 'mesesNaSaudeAtual';

// Cores e labels para saúde (classificação PEX) - Paleta de cores definida pelo usuário
const SAUDE_CONFIG: Record<SaudeFranquia, { label: string; cor: string; bg: string; borderColor: string }> = {
  'TOP_PERFORMANCE': { label: 'TOP Performance', cor: '#FFFFFF', bg: '#1a4b6e', borderColor: '#2980b9' },
  'PERFORMANDO': { label: 'Performando', cor: '#FFFFFF', bg: '#1e5631', borderColor: '#27ae60' },
  'EM_CONSOLIDACAO': { label: 'Em Consolidação', cor: '#FFFFFF', bg: '#7a4a0a', borderColor: '#e67e22' },
  'ATENCAO': { label: 'Atenção', cor: '#1a1a1a', bg: '#9a8a1a', borderColor: '#f1c40f' },
  'UTI': { label: 'UTI', cor: '#FFFFFF', bg: '#7a1a1a', borderColor: '#c0392b' },
  'UTI_RECUPERACAO': { label: 'UTI Recuperação', cor: '#FFFFFF', bg: '#5a2a2a', borderColor: '#943126' },
  'UTI_REPASSE': { label: 'UTI Repasse', cor: '#FFFFFF', bg: '#4a1a2a', borderColor: '#6c2134' },
  'SEM_AVALIACAO': { label: 'Sem Avaliação', cor: '#F8F9FA', bg: '#3a3d41', borderColor: '#6c757d' },
};

// Função para calcular tempo ativo (formato DD/MM/YYYY)
const calcularTempoAtivo = (dataInauguracao: string): string => {
  if (!dataInauguracao || dataInauguracao === 'NULL') return '-';
  
  // Converter de DD/MM/YYYY para Date
  const partes = dataInauguracao.split('/');
  if (partes.length !== 3) return '-';
  
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1; // Mês começa em 0
  const ano = parseInt(partes[2], 10);
  
  const inicio = new Date(ano, mes, dia);
  if (isNaN(inicio.getTime())) return '-';
  
  const hoje = new Date();
  
  // Se a data de inauguração é futura, retornar '-'
  if (inicio > hoje) return '-';
  
  let anos = hoje.getFullYear() - inicio.getFullYear();
  let meses = hoje.getMonth() - inicio.getMonth();
  
  if (meses < 0) {
    anos--;
    meses += 12;
  }
  
  if (anos > 0 && meses > 0) {
    return `${anos}a ${meses}m`;
  } else if (anos > 0) {
    return `${anos}a`;
  } else {
    return `${meses} meses`;
  }
};

export default function TabelaFranquias({ franquias, titulo, filtros }: TabelaFranquiasProps) {
  const [busca, setBusca] = useState('');
  const [mostrarAtivas, setMostrarAtivas] = useState(true);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc'
  });

  const getStatusLabel = (franquia: Franquia): string => {
    return franquia.maturidade;
  };

  const getStatusCor = (franquia: Franquia): string => {
    if (franquia.status === 'INATIVA') return '#8b6b6b';
    if (franquia.maturidade === 'IMPLANTACAO') return '#6b8fa8';
    if (franquia.maturidade === 'MADURA') return '#5a9a7c';
    return '#a8956b'; // Anos de operação (1º, 2º, 3º)
  };

  const franquiasFiltradas = useMemo(() => {
    return franquias
      .filter(f => {
        // Filtro de status (ativa/inativa)
        if (mostrarAtivas && f.status !== 'ATIVA') return false;
        if (!mostrarAtivas && f.status !== 'INATIVA') return false;

        // Filtro de busca
        const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase());
        
        if (!matchBusca) return false;
        
        // Filtro de maturidade
        if (filtros?.maturidade && filtros.maturidade.length > 0) {
          if (!filtros.maturidade.includes(f.maturidade)) return false;
        }
        
        // Filtro de classificação (saúde)
        if (filtros?.classificacao && filtros.classificacao.length > 0) {
          if (f.maturidade === 'IMPLANTACAO' || f.status === 'INATIVA') return false;
          if (!filtros.classificacao.includes(f.saude)) return false;
        }
        
        // Filtro de flags
        if (filtros?.flags && filtros.flags.length > 0) {
          const temFlag = filtros.flags.some(flag => {
            if (flag === 'socioOperador') return f.flags.socioOperador;
            if (flag === 'timeCritico') return f.flags.timeCritico;
            if (flag === 'governanca') return f.flags.governanca;
            if (flag === 'semFlags') return !f.flags.socioOperador && !f.flags.timeCritico && !f.flags.governanca;
            return false;
          });
          if (!temFlag) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        let valorA: string | number = '';
        let valorB: string | number = '';

        switch (ordenacao.campo) {
          case 'nome':
            valorA = a.nome;
            valorB = b.nome;
            break;
          case 'status':
            valorA = a.status;
            valorB = b.status;
            break;
          case 'dataInauguracao':
            valorA = a.dataInauguracao;
            valorB = b.dataInauguracao;
            break;
          case 'maturidade':
            valorA = a.maturidade;
            valorB = b.maturidade;
            break;
          case 'pontuacaoPex':
            valorA = a.pontuacaoPex;
            valorB = b.pontuacaoPex;
            break;
          case 'saude':
            valorA = a.saude;
            valorB = b.saude;
            break;
          case 'mesesNaSaudeAtual':
            valorA = a.mesesNaSaudeAtual || 0;
            valorB = b.mesesNaSaudeAtual || 0;
            break;
        }

        if (ordenacao.direcao === 'asc') {
          return valorA > valorB ? 1 : -1;
        }
        return valorA < valorB ? 1 : -1;
      });
  }, [franquias, busca, ordenacao, filtros, mostrarAtivas]);

  const handleOrdenacao = (campo: CampoOrdenacao) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const IconeOrdenacao = ({ campo }: { campo: CampoOrdenacao }) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' 
      ? <ChevronUp size={14} style={{ marginLeft: '4px' }} />
      : <ChevronDown size={14} style={{ marginLeft: '4px' }} />;
  };

  const renderFlags = (franquia: Franquia) => {
    const flags = [];
    if (franquia.flags.socioOperador) {
      flags.push(
        <span key="socio" title="Flag: Sócio Operador" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '4px',
          backgroundColor: '#4a3838',
          border: '1px solid #8b6b6b',
          color: '#adb5bd',
          marginRight: '4px',
        }}>
          <Users size={12} />
        </span>
      );
    }
    if (franquia.flags.timeCritico) {
      flags.push(
        <span key="time" title="Flag: Time Crítico" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '4px',
          backgroundColor: '#4a4538',
          border: '1px solid #a8956b',
          color: '#adb5bd',
          marginRight: '4px',
        }}>
          <AlertTriangle size={12} />
        </span>
      );
    }
    if (franquia.flags.governanca) {
      flags.push(
        <span key="gov" title="Flag: Governança" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '4px',
          backgroundColor: '#3d3545',
          border: '1px solid #7b6b8b',
          color: '#adb5bd',
          marginRight: '4px',
        }}>
          <Shield size={12} />
        </span>
      );
    }
    if (franquia.flags.necessidadeCapitalGiro) {
      flags.push(
        <span key="capital" title="Flag: Necessidade Capital de Giro" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '4px',
          backgroundColor: '#3d4a5a',
          border: '1px solid #6b8fa8',
          color: '#adb5bd',
          marginRight: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
        }}>
          $
        </span>
      );
    }
    return flags.length > 0 ? flags : <span style={{ color: '#6c757d' }}>-</span>;
  };

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Cabeçalho com título e busca */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #FF6600',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h3 style={{
            color: '#adb5bd',
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'Poppins, sans-serif',
            margin: 0,
          }}>
            {titulo || 'Lista de Franquias'} ({franquiasFiltradas.length})
          </h3>

          {/* Toggle Ativas / Inativas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              color: !mostrarAtivas ? '#FF6600' : '#6c757d',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'color 0.3s',
            }}>
              Inativas
            </span>
            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mostrarAtivas}
                onChange={() => setMostrarAtivas(prev => !prev)}
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
              />
              <div style={{
                width: '44px',
                height: '22px',
                borderRadius: '11px',
                background: mostrarAtivas
                  ? 'linear-gradient(180deg, #ff8a33 0%, #FF6600 50%, #e65500 100%)'
                  : '#4B5563',
                transition: 'background 0.3s',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#FFF',
                  transition: 'transform 0.3s',
                  transform: mostrarAtivas ? 'translateX(22px)' : 'translateX(0)',
                }} />
              </div>
            </label>
            <span style={{
              color: mostrarAtivas ? '#FF6600' : '#6c757d',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'color 0.3s',
            }}>
              Ativas
            </span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6c757d'
            }} 
          />
          <input
            type="text"
            placeholder="Buscar franquia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              backgroundColor: '#212529',
              border: '1px solid #555',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#F8F9FA',
              fontSize: '0.9rem',
              width: '220px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '520px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { campo: 'nome' as CampoOrdenacao, label: 'Franquia', width: '180px' },
                { campo: 'status' as CampoOrdenacao, label: 'Status', width: '80px' },
                { campo: 'dataInauguracao' as CampoOrdenacao, label: 'Inauguração', width: '110px' },
                { campo: 'maturidade' as CampoOrdenacao, label: 'Maturidade', width: '100px' },
                { campo: 'pontuacaoPex' as CampoOrdenacao, label: 'PEX', width: '80px' },
                { campo: 'saude' as CampoOrdenacao, label: 'Classificação Atual', width: '120px' },
                { campo: 'saude' as CampoOrdenacao, label: 'Classificação Anterior', width: '130px' },
                { campo: 'mesesNaSaudeAtual' as CampoOrdenacao, label: 'Tempo na Classificação', width: '120px' },
              ].map((col, colIdx) => (
                <th 
                  key={`col-${colIdx}`}
                  onClick={() => handleOrdenacao(col.campo)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    color: '#adb5bd',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #555',
                    cursor: 'pointer',
                    whiteSpace: 'normal',
                    width: col.width,
                    position: 'sticky' as const,
                    top: 0,
                    backgroundColor: '#343A40',
                    zIndex: 10,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    <IconeOrdenacao campo={col.campo} />
                  </span>
                </th>
              ))}
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                width: '80px',
                position: 'sticky' as const,
                top: 0,
                backgroundColor: '#343A40',
                zIndex: 10,
              }}>
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {franquiasFiltradas.map((franquia, index) => {
              const saudeConfig = SAUDE_CONFIG[franquia.saude] || SAUDE_CONFIG['SEM_AVALIACAO'];
              const isImplantacao = franquia.maturidade === 'IMPLANTACAO';
              const isInativa = franquia.status === 'INATIVA';
              const isEven = index % 2 === 0;
              
              return (
                <tr 
                  key={franquia.id}
                  style={{
                    backgroundColor: isEven ? '#2d3035' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3d4248';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isEven ? '#2d3035' : 'transparent';
                  }}
                >
                  <td style={{ 
                    padding: '10px 8px', 
                    color: '#F8F9FA',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #444',
                    fontWeight: 500,
                  }}>
                    {franquia.nome}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    <span style={{
                      color: franquia.status === 'ATIVA' ? '#27ae60' : '#c0392b',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}>
                      {franquia.status === 'ATIVA' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{
                        color: '#F8F9FA',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}>
                        {franquia.dataInauguracao || '-'}
                      </span>
                      <span style={{
                        color: '#FF6600',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {calcularTempoAtivo(franquia.dataInauguracao)}
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    <span style={{
                      color: '#adb5bd',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}>
                      {getStatusLabel(franquia)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'left',
                  }}>
                    {isImplantacao || isInativa ? (
                      <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>-</span>
                    ) : (
                      <span style={{
                        color: '#FF6600',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        fontFamily: "'Orbitron', sans-serif",
                      }}>
                        {franquia.pontuacaoPex.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    {isImplantacao || isInativa ? (
                      <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>N/A</span>
                    ) : (
                      <span style={{
                        backgroundColor: saudeConfig.bg,
                        color: saudeConfig.cor,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {saudeConfig.label}
                      </span>
                    )}
                  </td>
                  {/* Saúde Anterior */}
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    {isImplantacao || isInativa || !franquia.saudeAnterior ? (
                      <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>-</span>
                    ) : (() => {
                      const saudeAntConfig = SAUDE_CONFIG[franquia.saudeAnterior!] || SAUDE_CONFIG['SEM_AVALIACAO'];
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            backgroundColor: saudeAntConfig.bg,
                            color: saudeAntConfig.cor,
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}>
                            {saudeAntConfig.label}
                          </span>
                          {/* Indicador de evolução */}
                          {franquia.saude !== franquia.saudeAnterior && (() => {
                            const ordemSaude: SaudeFranquia[] = ['UTI_REPASSE', 'UTI_RECUPERACAO', 'UTI', 'ATENCAO', 'EM_CONSOLIDACAO', 'PERFORMANDO', 'TOP_PERFORMANCE'];
                            const idxAtual = ordemSaude.indexOf(franquia.saude);
                            const idxAnterior = ordemSaude.indexOf(franquia.saudeAnterior!);
                            const melhorou = idxAtual > idxAnterior;
                            return melhorou ? (
                              <TrendingUp size={14} color="#27ae60" title="Evoluiu" />
                            ) : (
                              <TrendingDown size={14} color="#c0392b" title="Regrediu" />
                            );
                          })()}
                        </div>
                      );
                    })()}
                  </td>
                  {/* Meses na Saúde Atual */}
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'left',
                  }}>
                    {isImplantacao || isInativa || !franquia.mesesNaSaudeAtual ? (
                      <span style={{ color: '#6c757d', fontSize: '0.75rem' }}>-</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{
                          color: franquia.mesesNaSaudeAtual >= 3 ? '#e67e22' : '#adb5bd',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          fontFamily: "'Orbitron', sans-serif",
                        }}>
                          {franquia.mesesNaSaudeAtual}
                        </span>
                        <span style={{
                          color: '#6c757d',
                          fontSize: '0.65rem',
                        }}>
                          {franquia.mesesNaSaudeAtual === 1 ? 'mês' : 'meses'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'left',
                  }}>
                    {isImplantacao || isInativa ? (
                      <span style={{ color: '#6c757d' }}>-</span>
                    ) : (
                      renderFlags(franquia)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {franquiasFiltradas.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
          }}>
            Nenhuma franquia encontrada
          </div>
        )}
      </div>

      {/* Legenda de flags */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #444',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#6c757d', fontSize: '0.75rem', fontWeight: 600 }}>LEGENDA FLAGS:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            backgroundColor: '#4a3838',
            border: '1px solid #8b6b6b',
            color: '#adb5bd',
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
            borderRadius: '4px',
            backgroundColor: '#4a4538',
            border: '1px solid #a8956b',
            color: '#adb5bd',
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
            borderRadius: '4px',
            backgroundColor: '#3d3545',
            border: '1px solid #7b6b8b',
            color: '#adb5bd',
          }}>
            <Shield size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Governança</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            backgroundColor: '#3d4a5a',
            border: '1px solid #6b8fa8',
            color: '#adb5bd',
          }}>
            <DollarSign size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Capital de Giro</span>
        </div>
      </div>
    </div>
  );
}
