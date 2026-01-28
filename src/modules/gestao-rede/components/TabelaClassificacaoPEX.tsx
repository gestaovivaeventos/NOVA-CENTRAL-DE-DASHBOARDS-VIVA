/**
 * TabelaClassificacaoPEX - Tabela de franquias por classificação PEX
 * Exibe franquias em colunas por classificação com flags e scores
 * Atualizado para novos tipos - Saúde ao invés de ClassificacaoPEX
 * Inclui funcionalidade de alterar UTI para UTI Recuperação ou UTI Repasse
 */

import React, { useState, useMemo } from 'react';
import { AlertTriangle, Users, Shield, Award, TrendingUp, AlertCircle, HeartPulse, Edit3, Flag, DollarSign, Save, Loader2, X } from 'lucide-react';
import { Franquia, SaudeFranquia, FlagsEstruturais } from '../types';
import ModalAlterarSaude from './ModalAlterarSaude';
import ModalEditarFlags from './ModalEditarFlags';

// Tipo para alterações pendentes
interface AlteracaoPendente {
  chaveData: string;
  nomeFranquia: string;
  tipo: 'saude' | 'flags';
  novoValor: 'UTI_RECUPERACAO' | 'UTI_REPASSE' | FlagsEstruturais;
  descricao: string;
}

interface TabelaClassificacaoPEXProps {
  franquias: Franquia[];
  onRefresh?: () => void;
}

// Configuração das classificações (usando saude)
// Fórmula: >= 95: TOP PERFORMANCE, >= 85: PERFORMANDO, >= 75: EM EVOLUÇÃO, >= 60: ATENÇÃO, < 60: UTI
const CLASSIFICACOES: { 
  key: SaudeFranquia; 
  label: string; 
  cor: string; 
  bg: string;
  icon: React.ReactNode;
  faixa?: string;
}[] = [
  { key: 'TOP_PERFORMANCE', label: 'TOP Performance', cor: '#000', bg: '#28a745', icon: <Award size={16} />, faixa: '≥ 95%' },
  { key: 'PERFORMANDO', label: 'Performando', cor: '#000', bg: '#20c997', icon: <TrendingUp size={16} />, faixa: '≥ 85%' },
  { key: 'EM_EVOLUCAO', label: 'Em Evolução', cor: '#000', bg: '#17a2b8', icon: <TrendingUp size={16} />, faixa: '≥ 75%' },
  { key: 'ATENCAO', label: 'Atenção', cor: '#000', bg: '#ffc107', icon: <AlertCircle size={16} />, faixa: '≥ 60%' },
  { key: 'UTI', label: 'UTI', cor: '#fff', bg: '#dc3545', icon: <HeartPulse size={16} />, faixa: '< 60%' },
  { key: 'UTI_RECUPERACAO', label: 'UTI Recuperação', cor: '#fff', bg: '#e67e22', icon: <HeartPulse size={16} /> },
  { key: 'UTI_REPASSE', label: 'UTI Repasse', cor: '#fff', bg: '#8e44ad', icon: <HeartPulse size={16} /> },
];

export default function TabelaClassificacaoPEX({ franquias, onRefresh }: TabelaClassificacaoPEXProps) {
  const [modalSaudeOpen, setModalSaudeOpen] = useState(false);
  const [modalFlagsOpen, setModalFlagsOpen] = useState(false);
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<Franquia | null>(null);
  
  // Estado para alterações pendentes (batch save)
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<AlteracaoPendente[]>([]);
  const [salvandoTudo, setSalvandoTudo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Criar uma versão local das franquias com as alterações pendentes aplicadas
  const franquiasComAlteracoes = useMemo(() => {
    return franquias.map(f => {
      const alteracaoSaude = alteracoesPendentes.find(
        a => a.chaveData === f.chaveData && a.tipo === 'saude'
      );
      const alteracaoFlags = alteracoesPendentes.find(
        a => a.chaveData === f.chaveData && a.tipo === 'flags'
      );

      const franquiaModificada = { ...f };
      
      if (alteracaoSaude && typeof alteracaoSaude.novoValor === 'string') {
        franquiaModificada.saude = alteracaoSaude.novoValor as SaudeFranquia;
      }
      
      if (alteracaoFlags && typeof alteracaoFlags.novoValor === 'object') {
        franquiaModificada.flags = alteracaoFlags.novoValor as FlagsEstruturais;
      }
      
      return franquiaModificada;
    });
  }, [franquias, alteracoesPendentes]);

  // Filtrar apenas franquias em operação (que têm classificação válida)
  const franquiasEmOperacao = franquiasComAlteracoes.filter(
    f => f.status === 'ATIVA' && f.maturidade !== 'IMPLANTACAO'
  );

  // Agrupar por saúde (classificação PEX)
  const franquiasPorClassificacao = CLASSIFICACOES.reduce((acc, classificacao) => {
    acc[classificacao.key] = franquiasEmOperacao.filter(f => f.saude === classificacao.key);
    return acc;
  }, {} as Record<SaudeFranquia, Franquia[]>);

  // Filtrar classificações para mostrar apenas as que têm franquias
  // UTI só aparece se tiver franquias, outras sempre aparecem
  const classificacoesVisiveis = CLASSIFICACOES.filter(classificacao => {
    // UTI só aparece se tiver franquias
    if (classificacao.key === 'UTI') {
      return (franquiasPorClassificacao[classificacao.key]?.length || 0) > 0;
    }
    // Outras classificações sempre aparecem
    return true;
  });

  const handleAlterarSaude = (franquia: Franquia) => {
    // Usar a franquia original (sem alterações pendentes) para o modal
    const franquiaOriginal = franquias.find(f => f.chaveData === franquia.chaveData) || franquia;
    setFranquiaSelecionada(franquiaOriginal);
    setModalSaudeOpen(true);
  };

  const handleEditarFlags = (franquia: Franquia) => {
    // Usar a versão com alterações pendentes para mostrar o estado atual
    setFranquiaSelecionada(franquia);
    setModalFlagsOpen(true);
  };

  // Adicionar alteração de flags às pendentes (sem salvar)
  const handleAddFlagsPendente = async (franquia: Franquia, novasFlags: FlagsEstruturais) => {
    // Gerar descrição das flags
    const flagsAtivas: string[] = [];
    if (novasFlags.governanca) flagsAtivas.push('Governança');
    if (novasFlags.necessidadeCapitalGiro) flagsAtivas.push('Capital de Giro');
    if (novasFlags.timeCritico) flagsAtivas.push('Time Crítico');
    if (novasFlags.socioOperador) flagsAtivas.push('Sócio Operador');
    
    const descricao = flagsAtivas.length > 0 
      ? `Flags: ${flagsAtivas.join(', ')}`
      : 'Flags removidas';

    // Remover alteração anterior de flags para esta franquia (se existir)
    setAlteracoesPendentes(prev => {
      const semFlagsAntiga = prev.filter(
        a => !(a.chaveData === franquia.chaveData && a.tipo === 'flags')
      );
      return [
        ...semFlagsAntiga,
        {
          chaveData: franquia.chaveData,
          nomeFranquia: franquia.nome,
          tipo: 'flags',
          novoValor: novasFlags,
          descricao,
        },
      ];
    });
  };

  // Adicionar alteração de saúde às pendentes (sem salvar)
  const handleAddSaudePendente = async (franquia: Franquia, novoStatus: 'UTI_RECUPERACAO' | 'UTI_REPASSE') => {
    const descricao = novoStatus === 'UTI_RECUPERACAO' 
      ? 'UTI → UTI Recuperação' 
      : 'UTI → UTI Repasse';

    // Remover alteração anterior de saúde para esta franquia (se existir)
    setAlteracoesPendentes(prev => {
      const semSaudeAntiga = prev.filter(
        a => !(a.chaveData === franquia.chaveData && a.tipo === 'saude')
      );
      return [
        ...semSaudeAntiga,
        {
          chaveData: franquia.chaveData,
          nomeFranquia: franquia.nome,
          tipo: 'saude',
          novoValor: novoStatus,
          descricao,
        },
      ];
    });
  };

  // Remover uma alteração pendente (para uso futuro)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemoverPendente = (chaveData: string, tipo: 'saude' | 'flags') => {
    setAlteracoesPendentes(prev => 
      prev.filter(a => !(a.chaveData === chaveData && a.tipo === tipo))
    );
  };

  // Limpar todas as alterações pendentes
  const handleLimparPendentes = () => {
    setAlteracoesPendentes([]);
    setErroSalvar(null);
  };

  // Salvar todas as alterações pendentes
  const handleSalvarTudo = async () => {
    if (alteracoesPendentes.length === 0) return;

    setSalvandoTudo(true);
    setErroSalvar(null);

    try {
      // Processar cada alteração
      for (const alteracao of alteracoesPendentes) {
        if (alteracao.tipo === 'saude') {
          const response = await fetch('/api/gestao-rede/update-saude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chaveData: alteracao.chaveData,
              novoStatus: alteracao.novoValor,
            }),
          });
          const result = await response.json();
          if (!result.success) {
            throw new Error(`Erro ao salvar ${alteracao.nomeFranquia}: ${result.error}`);
          }
        } else if (alteracao.tipo === 'flags') {
          const response = await fetch('/api/gestao-rede/update-flags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chaveData: alteracao.chaveData,
              flags: alteracao.novoValor,
            }),
          });
          const result = await response.json();
          if (!result.success) {
            throw new Error(`Erro ao salvar flags de ${alteracao.nomeFranquia}: ${result.error}`);
          }
        }
      }

      // Limpar pendentes e recarregar
      setAlteracoesPendentes([]);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      setErroSalvar(error instanceof Error ? error.message : 'Erro ao salvar alterações');
    } finally {
      setSalvandoTudo(false);
    }
  };

  const isUtiStatus = (status: SaudeFranquia) => {
    return status === 'UTI' || status === 'UTI_RECUPERACAO' || status === 'UTI_REPASSE';
  };

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
    if (franquia.flags.necessidadeCapitalGiro) {
      flags.push(
        <span key="capital" title="Necessidade Capital de Giro" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '18px',
          height: '18px',
          borderRadius: '3px',
          backgroundColor: '#3498db',
          color: '#fff',
          marginRight: '3px',
        }}>
          <DollarSign size={10} />
        </span>
      );
    }
    return flags.length > 0 ? <div style={{ display: 'flex' }}>{flags}</div> : null;
  };

  // Verificar se uma franquia tem alteração pendente
  const temAlteracaoPendente = (chaveData: string) => {
    return alteracoesPendentes.some(a => a.chaveData === chaveData);
  };

  return (
    <>
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Header com título e barra de alterações pendentes */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #555',
        flexWrap: 'wrap',
        gap: '12px',
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
          Franquias por Classificação PEX
        </h3>

        {/* Barra de alterações pendentes */}
        {alteracoesPendentes.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#495057',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #FF6600',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                backgroundColor: '#FF6600',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {alteracoesPendentes.length}
              </span>
              <span style={{ 
                color: '#F8F9FA', 
                fontSize: '0.85rem',
                fontWeight: 500,
              }}>
                alteração(ões) pendente(s)
              </span>
            </div>

            <button
              onClick={handleLimparPendentes}
              disabled={salvandoTudo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #6c757d',
                backgroundColor: 'transparent',
                color: '#adb5bd',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
              Cancelar
            </button>

            <button
              onClick={handleSalvarTudo}
              disabled={salvandoTudo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#28a745',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: salvandoTudo ? 'wait' : 'pointer',
                opacity: salvandoTudo ? 0.7 : 1,
              }}
            >
              {salvandoTudo ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Todas
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Erro ao salvar */}
      {erroSalvar && (
        <div style={{
          backgroundColor: 'rgba(220, 53, 69, 0.2)',
          border: '1px solid #dc3545',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={18} color="#dc3545" />
          <span style={{ color: '#dc3545', fontSize: '0.85rem' }}>{erroSalvar}</span>
          <button
            onClick={() => setErroSalvar(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${classificacoesVisiveis.length}, 1fr)`,
          gap: '12px',
          minWidth: `${classificacoesVisiveis.length * 180}px`,
        }}>
          {/* Cabeçalhos das colunas */}
          {classificacoesVisiveis.map((classificacao) => (
            <div 
              key={classificacao.key}
              style={{
                backgroundColor: classificacao.bg,
                color: classificacao.cor,
                padding: '10px 8px',
                borderRadius: '8px 8px 0 0',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {classificacao.icon}
                <span>{classificacao.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {classificacao.faixa && (
                  <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                    ({classificacao.faixa})
                  </span>
                )}
                <span style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {franquiasPorClassificacao[classificacao.key]?.length || 0}
                </span>
              </div>
            </div>
          ))}

          {/* Colunas de franquias */}
          {classificacoesVisiveis.map((classificacao) => (
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
              {(franquiasPorClassificacao[classificacao.key]?.length || 0) === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '20px',
                  fontSize: '0.8rem',
                }}>
                  Nenhuma franquia
                </div>
              ) : (
                franquiasPorClassificacao[classificacao.key]?.map((franquia) => (
                  <div
                    key={franquia.id}
                    style={{
                      backgroundColor: temAlteracaoPendente(franquia.chaveData) ? '#3d4a3d' : '#343A40',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${temAlteracaoPendente(franquia.chaveData) ? '#FF6600' : classificacao.bg}`,
                      position: 'relative',
                    }}
                  >
                    {/* Indicador de alteração pendente */}
                    {temAlteracaoPendente(franquia.chaveData) && (
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#FF6600',
                      }} title="Alteração pendente" />
                    )}
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
                        {franquia.pontuacaoPex.toFixed(2)}
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
                        {franquia.maturidade}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {renderFlags(franquia)}
                        {/* Botão de editar flags */}
                        <button
                          onClick={() => handleEditarFlags(franquia)}
                          title="Editar flags"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '20px',
                            height: '20px',
                            borderRadius: '3px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Flag size={10} />
                        </button>
                        {/* Botão de editar para franquias em UTI */}
                        {isUtiStatus(franquia.saude) && (
                          <button
                            onClick={() => handleAlterarSaude(franquia)}
                            title="Alterar status UTI"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '20px',
                              height: '20px',
                              borderRadius: '3px',
                              backgroundColor: '#495057',
                              color: '#fff',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit3 size={10} />
                          </button>
                        )}
                      </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#27ae60',
            color: '#fff',
          }}>
            <DollarSign size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Capital de Giro</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#6c757d',
            color: '#fff',
          }}>
            <Flag size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Editar Flags</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            borderRadius: '3px',
            backgroundColor: '#495057',
            color: '#fff',
          }}>
            <Edit3 size={10} />
          </span>
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Clique para alterar UTI</span>
        </div>
      </div>
    </div>

    {/* Modal de alteração de saúde */}
    {franquiaSelecionada && (
      <ModalAlterarSaude
        franquia={franquiaSelecionada}
        isOpen={modalSaudeOpen}
        onClose={() => {
          setModalSaudeOpen(false);
          setFranquiaSelecionada(null);
        }}
        onSave={handleAddSaudePendente}
      />
    )}

    {/* Modal de edição de flags */}
    {franquiaSelecionada && (
      <ModalEditarFlags
        franquia={franquiaSelecionada}
        isOpen={modalFlagsOpen}
        onClose={() => {
          setModalFlagsOpen(false);
          setFranquiaSelecionada(null);
        }}
        onSave={handleAddFlagsPendente}
      />
    )}
    </>
  );
}
