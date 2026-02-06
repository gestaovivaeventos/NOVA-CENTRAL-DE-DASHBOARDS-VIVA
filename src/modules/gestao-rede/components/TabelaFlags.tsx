/**
 * TabelaFlags - Kanban de Flags Estruturais
 * Exibe franquias em colunas por flag (formato kanban igual ao bloco de classificação PEX)
 * Com funcionalidade de edição de flags e batch save
 */

import React, { useState, useMemo } from 'react';
import { Users, Shield, AlertTriangle, DollarSign, Flag, Save, Loader2, X, AlertCircle } from 'lucide-react';
import { Franquia, SaudeFranquia, FlagsEstruturais } from '../types';
import ModalEditarFlags from './ModalEditarFlags';

// Tipo para alterações pendentes
interface AlteracaoFlagPendente {
  chaveData: string;
  nomeFranquia: string;
  novoValor: FlagsEstruturais;
  descricao: string;
}

interface TabelaFlagsProps {
  franquias: Franquia[];
  titulo?: string;
  onRefresh?: () => void;
}

// Cores para saúde (classificação PEX)
const SAUDE_CORES: Record<SaudeFranquia, string> = {
  'TOP_PERFORMANCE': '#2980b9',
  'PERFORMANDO': '#27ae60',
  'EM_CONSOLIDACAO': '#e67e22',
  'ATENCAO': '#f1c40f',
  'UTI': '#c0392b',
  'UTI_RECUPERACAO': '#943126',
  'UTI_REPASSE': '#6c2134',
  'SEM_AVALIACAO': '#6c757d',
};

const SAUDE_LABELS: Record<SaudeFranquia, string> = {
  'TOP_PERFORMANCE': 'TOP',
  'PERFORMANDO': 'Perform.',
  'EM_CONSOLIDACAO': 'Consolid.',
  'ATENCAO': 'Atenção',
  'UTI': 'UTI',
  'UTI_RECUPERACAO': 'UTI Recup.',
  'UTI_REPASSE': 'UTI Rep.',
  'SEM_AVALIACAO': 'S/ Aval.',
};

// Configuração das flags para kanban
const FLAGS_CONFIG: {
  key: keyof Franquia['flags'];
  label: string;
  cor: string;
  bg: string;
  borderColor: string;
  icon: React.ReactNode;
  descricao: string;
}[] = [
  {
    key: 'governanca',
    label: 'Governança',
    cor: '#FFFFFF',
    bg: '#3d3545',
    borderColor: '#7b6b8b',
    icon: <Shield size={16} />,
    descricao: 'Problemas de governança',
  },
  {
    key: 'necessidadeCapitalGiro',
    label: 'Capital de Giro',
    cor: '#FFFFFF',
    bg: '#3d4a5a',
    borderColor: '#6b8fa8',
    icon: <DollarSign size={16} />,
    descricao: 'Necessidade de capital de giro',
  },
  {
    key: 'timeCritico',
    label: 'Time Crítico',
    cor: '#FFFFFF',
    bg: '#4a4538',
    borderColor: '#a8956b',
    icon: <AlertTriangle size={16} />,
    descricao: 'Time em situação crítica',
  },
  {
    key: 'socioOperador',
    label: 'Sócio Operador',
    cor: '#FFFFFF',
    bg: '#4a3838',
    borderColor: '#8b6b6b',
    icon: <Users size={16} />,
    descricao: 'Alerta de sócio operador',
  },
];

export default function TabelaFlags({ franquias, titulo = 'Análise de Flags Estruturais', onRefresh }: TabelaFlagsProps) {
  const [modalFlagsOpen, setModalFlagsOpen] = useState(false);
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<Franquia | null>(null);
  
  // Estado para alterações pendentes (batch save)
  const [alteracoesPendentes, setAlteracoesPendentes] = useState<AlteracaoFlagPendente[]>([]);
  const [salvandoTudo, setSalvandoTudo] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Criar uma versão local das franquias com as alterações pendentes aplicadas
  const franquiasComAlteracoes = useMemo(() => {
    return franquias.map(f => {
      const alteracao = alteracoesPendentes.find(a => a.chaveData === f.chaveData);
      if (alteracao) {
        return { ...f, flags: alteracao.novoValor };
      }
      return f;
    });
  }, [franquias, alteracoesPendentes]);

  // Filtrar apenas franquias ativas em operação
  const franquiasAtivas = useMemo(() => 
    franquiasComAlteracoes.filter(f => f.status === 'ATIVA' && f.maturidade !== 'IMPLANTACAO'),
    [franquiasComAlteracoes]
  );

  // Agrupar por flag
  const franquiasPorFlag = useMemo(() => {
    const resultado: Record<string, Franquia[]> = {};
    FLAGS_CONFIG.forEach(flag => {
      resultado[flag.key] = franquiasAtivas
        .filter(f => f.flags[flag.key])
        .sort((a, b) => a.pontuacaoPex - b.pontuacaoPex);
    });
    return resultado;
  }, [franquiasAtivas]);

  const handleEditarFlags = (franquia: Franquia) => {
    setFranquiaSelecionada(franquia);
    setModalFlagsOpen(true);
  };

  // Adicionar alteração de flags às pendentes
  const handleAddFlagsPendente = async (franquia: Franquia, novasFlags: FlagsEstruturais) => {
    const flagsAtivas: string[] = [];
    if (novasFlags.governanca) flagsAtivas.push('Governança');
    if (novasFlags.necessidadeCapitalGiro) flagsAtivas.push('Capital de Giro');
    if (novasFlags.timeCritico) flagsAtivas.push('Time Crítico');
    if (novasFlags.socioOperador) flagsAtivas.push('Sócio Operador');
    
    const descricao = flagsAtivas.length > 0 
      ? `Flags: ${flagsAtivas.join(', ')}`
      : 'Flags removidas';

    setAlteracoesPendentes(prev => {
      const semAnterior = prev.filter(a => a.chaveData !== franquia.chaveData);
      return [...semAnterior, {
        chaveData: franquia.chaveData,
        nomeFranquia: franquia.nome,
        novoValor: novasFlags,
        descricao,
      }];
    });
  };

  const handleLimparPendentes = () => {
    setAlteracoesPendentes([]);
    setErroSalvar(null);
  };

  const handleSalvarTudo = async () => {
    if (alteracoesPendentes.length === 0) return;

    setSalvandoTudo(true);
    setErroSalvar(null);

    try {
      for (const alteracao of alteracoesPendentes) {
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

      setAlteracoesPendentes([]);
      if (onRefresh) onRefresh();
    } catch (error) {
      setErroSalvar(error instanceof Error ? error.message : 'Erro ao salvar alterações');
    } finally {
      setSalvandoTudo(false);
    }
  };

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
      {/* Header com barra de alterações pendentes */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #FF6600',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div>
          <h3 style={{
            color: '#adb5bd',
            fontSize: '1rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: 'Poppins, sans-serif',
            margin: 0,
          }}>
            {titulo}
          </h3>
          <span style={{
            color: '#6c757d',
            fontSize: '0.75rem',
            fontFamily: 'Poppins, sans-serif',
          }}>
            {franquiasAtivas.length} franquias em operação
          </span>
        </div>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <span style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 500 }}>
                alteração(ões) pendente(s)
              </span>
            </div>

            <button
              onClick={handleLimparPendentes}
              disabled={salvandoTudo}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '6px',
                border: '1px solid #6c757d', backgroundColor: 'transparent',
                color: '#adb5bd', fontSize: '0.8rem', cursor: 'pointer',
              }}
            >
              <X size={14} /> Cancelar
            </button>

            <button
              onClick={handleSalvarTudo}
              disabled={salvandoTudo}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '6px',
                border: 'none', backgroundColor: '#FF6600',
                color: '#fff', fontSize: '0.85rem', fontWeight: 600,
                cursor: salvandoTudo ? 'wait' : 'pointer',
                opacity: salvandoTudo ? 0.7 : 1,
              }}
            >
              {salvandoTudo ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : (
                <><Save size={16} /> Salvar Todas</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Erro ao salvar */}
      {erroSalvar && (
        <div style={{
          backgroundColor: 'rgba(139, 107, 107, 0.2)',
          border: '1px solid #8b6b6b',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={18} color="#adb5bd" />
          <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>{erroSalvar}</span>
          <button
            onClick={() => setErroSalvar(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Kanban Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${FLAGS_CONFIG.length}, 1fr)`,
          gap: '12px',
          minWidth: `${FLAGS_CONFIG.length * 220}px`,
        }}>
          {/* Cabeçalhos */}
          {FLAGS_CONFIG.map((flag) => (
            <div
              key={flag.key}
              style={{
                backgroundColor: flag.bg,
                color: flag.cor,
                padding: '10px 8px',
                borderRadius: '8px 8px 0 0',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                borderTop: `3px solid ${flag.borderColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {flag.icon}
                <span>{flag.label}</span>
              </div>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                {flag.descricao}
              </span>
              <span style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {franquiasPorFlag[flag.key]?.length || 0}
              </span>
            </div>
          ))}

          {/* Colunas de franquias */}
          {FLAGS_CONFIG.map((flag) => (
            <div
              key={`col-${flag.key}`}
              style={{
                backgroundColor: '#212529',
                borderRadius: '0 0 8px 8px',
                padding: '8px',
                minHeight: '200px',
                maxHeight: '400px',
                overflowY: 'auto',
              }}
            >
              {(franquiasPorFlag[flag.key]?.length || 0) === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  padding: '20px',
                  fontSize: '0.8rem',
                }}>
                  Nenhuma franquia
                </div>
              ) : (
                franquiasPorFlag[flag.key]?.map((franquia) => (
                  <div
                    key={franquia.id}
                    style={{
                      backgroundColor: temAlteracaoPendente(franquia.chaveData) ? '#3d4a3d' : '#343A40',
                      borderRadius: '6px',
                      padding: '10px',
                      marginBottom: '8px',
                      borderLeft: `3px solid ${SAUDE_CORES[franquia.saude]}`,
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
                    {/* Nome + Score */}
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
                        color: SAUDE_CORES[franquia.saude],
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        fontFamily: "'Orbitron', sans-serif",
                        marginLeft: '8px',
                      }}>
                        {franquia.pontuacaoPex.toFixed(2)}
                      </span>
                    </div>
                    {/* Maturidade + Badge Saúde + Botão editar */}
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
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: SAUDE_CORES[franquia.saude],
                          color: franquia.saude === 'ATENCAO' ? '#000' : '#fff',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          fontFamily: "'Poppins', sans-serif",
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {SAUDE_LABELS[franquia.saude]}
                        </span>
                        {/* Botão editar flags */}
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
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div style={{
        marginTop: '16px',
        paddingTop: '12px',
        borderTop: '1px solid #444',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ color: '#6c757d', fontSize: '0.75rem', fontWeight: 600 }}>AÇÕES:</span>
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
          <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Clique para editar flags da franquia</span>
        </div>
      </div>
    </div>

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
