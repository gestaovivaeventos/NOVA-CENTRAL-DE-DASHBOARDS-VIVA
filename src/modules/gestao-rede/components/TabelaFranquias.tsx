/**
 * TabelaFranquias - Tabela com lista de franquias
 * Padrão Viva Eventos - Com paginação e tags PEX
 * Atualizado para novos tipos da planilha BASE GESTAO REDE
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, AlertTriangle, Users, Shield, DollarSign } from 'lucide-react';
import { Franquia, SaudeFranquia } from '../types';

interface TabelaFranquiasProps {
  franquias: Franquia[];
  titulo?: string;
  itensPorPagina?: number;
  filtros?: {
    maturidade?: string[];
    classificacao?: string[];
    flags?: string[];
  };
}

type CampoOrdenacao = 'nome' | 'dataInauguracao' | 'maturidade' | 'pontuacaoPex' | 'saude' | 'postoAvancado';

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

export default function TabelaFranquias({ franquias, titulo, itensPorPagina = 15, filtros }: TabelaFranquiasProps) {
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc'
  });

  const getStatusLabel = (franquia: Franquia): string => {
    if (franquia.status === 'INATIVA') {
      return franquia.statusInativacao === 'ENCERRADA_OPERACAO' 
        ? 'Encerrada (Op.)' 
        : 'Encerrada (Impl.)';
    }
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
          case 'postoAvancado':
            valorA = a.postosAvancados.length;
            valorB = b.postosAvancados.length;
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
                { campo: 'nome' as CampoOrdenacao, label: 'Franquia', width: '180px' },
                { campo: 'dataInauguracao' as CampoOrdenacao, label: 'Inauguração', width: '120px' },
                { campo: 'maturidade' as CampoOrdenacao, label: 'Maturidade', width: '120px' },
                { campo: 'pontuacaoPex' as CampoOrdenacao, label: 'Pontuação PEX', width: '100px' },
                { campo: 'saude' as CampoOrdenacao, label: 'Saúde', width: '130px' },
                { campo: 'postoAvancado' as CampoOrdenacao, label: 'Posto Avançado', width: '130px' },
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
                width: '80px',
              }}>
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {franquiasPaginadas.map((franquia, index) => {
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
                    textAlign: 'center',
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
                  <td style={{ 
                    padding: '10px 8px',
                    borderBottom: '1px solid #444',
                    textAlign: 'left',
                  }}>
                    {franquia.postosAvancados.length > 0 ? (
                      <span style={{
                        color: '#adb5bd',
                        fontSize: '0.8rem',
                      }}>
                        {franquia.postosAvancados.join(', ')}
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
