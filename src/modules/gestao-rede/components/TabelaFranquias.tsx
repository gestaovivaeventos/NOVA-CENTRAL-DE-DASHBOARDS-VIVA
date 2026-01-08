/**
 * TabelaFranquias - Tabela com lista de franquias
 * Padrão Viva Eventos - Com paginação e tags PEX
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, AlertTriangle, Users, Shield } from 'lucide-react';
import { Franquia, ClassificacaoPEX } from '../types';

interface TabelaFranquiasProps {
  franquias: Franquia[];
  titulo?: string;
  itensPorPagina?: number;
  filtros?: {
    maturidade?: string[];
    classificacao?: string[];
    consultor?: string[];
    flags?: string[];
  };
}

type CampoOrdenacao = 'nome' | 'cidade' | 'dataAbertura' | 'status' | 'scorePEX' | 'classificacao' | 'consultor' | 'postoAvancado';

// Cores e labels para classificação PEX
const CLASSIFICACAO_CONFIG: Record<ClassificacaoPEX, { label: string; cor: string; bg: string }> = {
  'TOP_PERFORMANCE': { label: 'TOP Performance', cor: '#000', bg: '#28a745' },
  'PERFORMANDO': { label: 'Performando', cor: '#000', bg: '#20c997' },
  'ATENCAO': { label: 'Atenção', cor: '#000', bg: '#ffc107' },
  'UTI_RECUPERACAO': { label: 'UTI Recuperação', cor: '#fff', bg: '#dc3545' },
  'UTI_REPASSE': { label: 'UTI Repasse', cor: '#fff', bg: '#c0392b' },
};

// Função para calcular tempo ativo
const calcularTempoAtivo = (dataAbertura: string): string => {
  const inicio = new Date(dataAbertura);
  const hoje = new Date();
  
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

// Mapeamento de postos avançados
const POSTOS_AVANCADOS: Record<string, string> = {
  'Viva Volta Redonda': 'Vassouras',
  'Viva Lavras': 'Varginha',
};

const getPostoAvancado = (nomeFranquia: string): string | null => {
  return POSTOS_AVANCADOS[nomeFranquia] || null;
};

export default function TabelaFranquias({ franquias, titulo, itensPorPagina = 15, filtros }: TabelaFranquiasProps) {
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc'
  });

  const getStatusLabel = (franquia: Franquia) => {
    if (franquia.status === 'INATIVA') {
      return franquia.motivoEncerramento === 'ENCERRADA_OPERACAO' 
        ? 'Encerrada (Op.)' 
        : 'Encerrada (Impl.)';
    }
    if (franquia.statusOperacao === 'IMPLANTACAO') return 'Implantação';
    if (franquia.maturidade === 'INCUBACAO') return `${franquia.faseIncubacao}º Ano`;
    return 'Madura';
  };

  const getMaturidadeKey = (franquia: Franquia): string => {
    if (franquia.status === 'INATIVA') return 'INATIVA';
    if (franquia.statusOperacao === 'IMPLANTACAO') return 'IMPLANTACAO';
    if (franquia.maturidade === 'INCUBACAO') return `INCUBACAO_${franquia.faseIncubacao}`;
    return 'MADURA';
  };

  const getStatusCor = (franquia: Franquia) => {
    if (franquia.status === 'INATIVA') return '#dc3545';
    if (franquia.statusOperacao === 'IMPLANTACAO') return '#17a2b8';
    if (franquia.maturidade === 'INCUBACAO') return '#ffc107';
    return '#28a745';
  };

  const franquiasFiltradas = useMemo(() => {
    return franquias
      .filter(f => {
        // Filtro de busca
        const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) ||
          f.cidade.toLowerCase().includes(busca.toLowerCase()) ||
          f.estado.toLowerCase().includes(busca.toLowerCase()) ||
          f.responsavel.toLowerCase().includes(busca.toLowerCase());
        
        if (!matchBusca) return false;
        
        // Filtro de maturidade
        if (filtros?.maturidade && filtros.maturidade.length > 0) {
          const maturidadeKey = getMaturidadeKey(f);
          if (!filtros.maturidade.includes(maturidadeKey)) return false;
        }
        
        // Filtro de classificação
        if (filtros?.classificacao && filtros.classificacao.length > 0) {
          if (f.statusOperacao === 'IMPLANTACAO' || f.status === 'INATIVA') return false;
          if (!filtros.classificacao.includes(f.classificacaoPEX)) return false;
        }
        
        // Filtro de consultor
        if (filtros?.consultor && filtros.consultor.length > 0) {
          if (!filtros.consultor.includes(f.responsavel)) return false;
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
          case 'cidade':
            valorA = `${a.cidade}/${a.estado}`;
            valorB = `${b.cidade}/${b.estado}`;
            break;
          case 'dataAbertura':
            valorA = a.dataAbertura;
            valorB = b.dataAbertura;
            break;
          case 'status':
            valorA = getStatusLabel(a);
            valorB = getStatusLabel(b);
            break;
          case 'scorePEX':
            valorA = a.scorePEX;
            valorB = b.scorePEX;
            break;
          case 'classificacao':
            valorA = a.classificacaoPEX;
            valorB = b.classificacaoPEX;
            break;
          case 'consultor':
            valorA = a.responsavel;
            valorB = b.responsavel;
            break;
          case 'postoAvancado':
            valorA = getPostoAvancado(a.nome) || '';
            valorB = getPostoAvancado(b.nome) || '';
            break;
        }

        if (ordenacao.direcao === 'asc') {
          return valorA > valorB ? 1 : -1;
        }
        return valorA < valorB ? 1 : -1;
      });
  }, [franquias, busca, ordenacao, filtros]);

  // Paginação
  const totalPaginas = Math.ceil(franquiasFiltradas.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const franquiasPaginadas = franquiasFiltradas.slice(indiceInicio, indiceInicio + itensPorPagina);

  // Reset página quando filtro muda
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [busca, filtros]);

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
          backgroundColor: '#e74c3c',
          color: '#fff',
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
          backgroundColor: '#f39c12',
          color: '#fff',
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
          backgroundColor: '#9b59b6',
          color: '#fff',
          marginRight: '4px',
        }}>
          <Shield size={12} />
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
        borderBottom: '1px solid #555',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
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
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { campo: 'nome' as CampoOrdenacao, label: 'Franquia', width: '150px' },
                { campo: 'cidade' as CampoOrdenacao, label: 'Cidade/UF', width: '130px' },
                { campo: 'dataAbertura' as CampoOrdenacao, label: 'Inauguração', width: '100px' },
                { campo: 'status' as CampoOrdenacao, label: 'Maturidade', width: '95px' },
                { campo: 'scorePEX' as CampoOrdenacao, label: 'Score PEX', width: '80px' },
                { campo: 'classificacao' as CampoOrdenacao, label: 'Classificação', width: '110px' },
                { campo: 'consultor' as CampoOrdenacao, label: 'Consultor', width: '100px' },
                { campo: 'postoAvancado' as CampoOrdenacao, label: 'Posto Avançado', width: '95px' },
              ].map(col => (
                <th 
                  key={col.campo}
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
                    whiteSpace: 'nowrap',
                    width: col.width,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    <IconeOrdenacao campo={col.campo} />
                  </span>
                </th>
              ))}
              <th style={{
                textAlign: 'center',
                padding: '12px 8px',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
                width: '70px',
              }}>
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {franquiasPaginadas.map((franquia) => {
              const classificacao = CLASSIFICACAO_CONFIG[franquia.classificacaoPEX];
              const isImplantacao = franquia.statusOperacao === 'IMPLANTACAO';
              const isInativa = franquia.status === 'INATIVA';
              const postoAvancado = getPostoAvancado(franquia.nome);
              
              return (
                <tr 
                  key={franquia.id}
                  style={{
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3d4248';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
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
                    color: '#adb5bd',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #444',
                  }}>
                    {franquia.cidade}/{franquia.estado}
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
                        {new Date(franquia.dataAbertura).toLocaleDateString('pt-BR')}
                      </span>
                      <span style={{
                        color: '#FF6600',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}>
                        {calcularTempoAtivo(franquia.dataAbertura)}
                      </span>
                    </div>
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    <span style={{
                      backgroundColor: getStatusCor(franquia),
                      color: franquia.maturidade === 'INCUBACAO' ? '#000' : '#fff',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {getStatusLabel(franquia)}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'center',
                  }}>
                    {isImplantacao || isInativa ? (
                      <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>-</span>
                    ) : (
                      <span style={{
                        color: franquia.scorePEX > 70 ? '#28a745' : franquia.scorePEX >= 50 ? '#ffc107' : '#dc3545',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        fontFamily: "'Orbitron', sans-serif",
                      }}>
                        {franquia.scorePEX}
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
                        backgroundColor: classificacao.bg,
                        color: classificacao.cor,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}>
                        {classificacao.label}
                      </span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    color: '#adb5bd',
                    fontSize: '0.8rem',
                    borderBottom: '1px solid #444',
                  }}>
                    {franquia.responsavel}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                  }}>
                    {postoAvancado ? (
                      <span style={{
                        backgroundColor: '#6f42c1',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}>
                        {postoAvancado}
                      </span>
                    ) : (
                      <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>-</span>
                    )}
                  </td>
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'center',
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

        {franquiasPaginadas.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
          }}>
            Nenhuma franquia encontrada
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #555',
        }}>
          <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + itensPorPagina, franquiasFiltradas.length)} de {franquiasFiltradas.length}
          </span>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #555',
                backgroundColor: paginaAtual === 1 ? '#2d3238' : '#343A40',
                color: paginaAtual === 1 ? '#6c757d' : '#F8F9FA',
                cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            
            <span style={{
              padding: '6px 12px',
              backgroundColor: '#FF6600',
              color: '#000',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}>
              {paginaAtual} / {totalPaginas}
            </span>
            
            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #555',
                backgroundColor: paginaAtual === totalPaginas ? '#2d3238' : '#343A40',
                color: paginaAtual === totalPaginas ? '#6c757d' : '#F8F9FA',
                cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

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
            borderRadius: '4px',
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
            borderRadius: '4px',
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
