/**
 * ModalDetalheFlag - Mostra o detalhamento que gerou a flag no card.
 *
 * - Flag "Sócio Operador": lista os sócios da franquia (BASE SOCIETARIA MV)
 *   separando em Franqueado Vendas / Franqueado Operações. Uma franquia recebe
 *   essa flag quando não possui ao menos 1 de cada.
 *
 * - Flag "Time Crítico": compara Estrutura Ideal x Estrutura Atual (aba
 *   ESTRUTURA ATUAL), ignorando LIDER COMERCIAL e LIDER DE OPERAÇÕES (que já
 *   são contabilizados na societária). A flag aparece quando a % de estrutura
 *   do time (sem sócios) está abaixo de 70%.
 */

import React, { useEffect, useState } from 'react';
import { X, Users, AlertTriangle, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Franquia, FlagKey } from '../types';

interface SocioItem {
  nome: string;
  cargo: string;
  funcaoEstrategica: string;
  tipo: 'vendas' | 'operacoes' | 'outro';
}

interface CargoEstrutura {
  cargo: string;
  ideal: number;
  atual: number;
  gap: number;
}

interface EstruturaAtualDetalhe {
  tamanho: string;
  percentualSemSocios: number | null;
  cargos: CargoEstrutura[];
  totalIdeal: number;
  totalAtual: number;
}

interface EstruturaDetalheResponse {
  success: boolean;
  franquia?: string;
  socios?: {
    vendas: SocioItem[];
    operacoes: SocioItem[];
    outros: SocioItem[];
    temVendas: boolean;
    temOperacoes: boolean;
  };
  estruturaAtual?: EstruturaAtualDetalhe | null;
  error?: string;
}

interface ModalDetalheFlagProps {
  franquia: Franquia;
  flagKey: FlagKey;
  isOpen: boolean;
  onClose: () => void;
}

const TITULOS: Record<FlagKey, string> = {
  socioOperador: 'Detalhe da Flag — Sócio Operador',
  timeCritico: 'Detalhe da Flag — Time Crítico',
  governanca: 'Detalhe da Flag — Governança',
  necessidadeCapitalGiro: 'Detalhe da Flag — Capital de Giro',
};

const LIMIAR_TIME = 0.7;     // < 70% = Time Crítico
const LIMIAR_SOCIO = 1.0;    // < 100% composição = Sócio Operador

export default function ModalDetalheFlag({
  franquia,
  flagKey,
  isOpen,
  onClose,
}: ModalDetalheFlagProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EstruturaDetalheResponse | null>(null);

  useEffect(() => {
    if (!isOpen || !franquia?.nome) return;

    let ativo = true;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/gestao-rede/estrutura-detalhe?franquia=${encodeURIComponent(franquia.nome)}`)
      .then((r) => r.json())
      .then((json: EstruturaDetalheResponse) => {
        if (!ativo) return;
        if (!json.success) throw new Error(json.error || 'Erro ao buscar detalhamento');
        setData(json);
      })
      .catch((e) => {
        if (!ativo) return;
        setError(e instanceof Error ? e.message : 'Erro ao buscar detalhamento');
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [isOpen, franquia?.nome]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#343A40',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '2px solid #FF6600',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {flagKey === 'timeCritico' ? (
              <AlertTriangle size={22} color="#FF6600" />
            ) : (
              <Users size={22} color="#FF6600" />
            )}
            <h3
              style={{
                color: '#F8F9FA',
                fontSize: '1.05rem',
                fontWeight: 600,
                margin: 0,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {TITULOS[flagKey]}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Franquia Info */}
        <div
          style={{
            backgroundColor: '#212529',
            borderRadius: '8px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ color: '#6c757d', fontSize: '0.72rem', marginBottom: '4px' }}>
            Franquia
          </div>
          <div
            style={{
              color: '#F8F9FA',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {franquia.nome}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '32px',
              color: '#adb5bd',
            }}
          >
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Carregando detalhamento...</span>
          </div>
        )}

        {/* Erro */}
        {error && !loading && (
          <div
            style={{
              backgroundColor: 'rgba(139, 107, 107, 0.2)',
              border: '1px solid #8b6b6b',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#adb5bd',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        {/* Conteúdo por tipo de flag */}
        {!loading && !error && data && (
          <>
            {flagKey === 'socioOperador' && (
              <SocioOperadorSection socios={data.socios} />
            )}
            {flagKey === 'timeCritico' && (
              <TimeCriticoSection estrutura={data.estruturaAtual || null} />
            )}
            {(flagKey === 'governanca' || flagKey === 'necessidadeCapitalGiro') && (
              <div
                style={{
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  backgroundColor: '#212529',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                Sem detalhamento automatizado para esta flag.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Seção: Sócio Operador
// ============================================================

function SocioOperadorSection({ socios }: { socios: EstruturaDetalheResponse['socios'] }) {
  if (!socios) return null;

  const { vendas, operacoes, outros, temVendas, temOperacoes } = socios;

  // 50% por função obrigatória presente (vendas + operações = 100%)
  const percentualSocios = (temVendas ? 0.5 : 0) + (temOperacoes ? 0.5 : 0);
  const abaixoLimiar = percentualSocios < LIMIAR_SOCIO;
  const faltantes: string[] = [];
  if (!temVendas) faltantes.push('Franqueado Vendas');
  if (!temOperacoes) faltantes.push('Franqueado Operações');

  return (
    <>
      <ExplicacaoFlag
        texto={`A franquia recebe a flag "Sócio Operador" quando a estrutura societária está abaixo de ${(LIMIAR_SOCIO * 100).toFixed(0)}% — ou seja, falta pelo menos um sócio com foco em Vendas ou em Operações (pós-vendas). Cada função obrigatória representa 50% da composição.`}
      />

      {/* Resumo: % societária + destaque dos ausentes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: faltantes.length > 0 ? '1fr 1fr' : '1fr',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <InfoBox
          label="% Composição Societária"
          valor={`${(percentualSocios * 100).toFixed(0)}%`}
          destaque={abaixoLimiar ? '#c0392b' : '#27ae60'}
          icone={
            abaixoLimiar ? (
              <TrendingDown size={14} color="#fff" />
            ) : (
              <TrendingUp size={14} color="#fff" />
            )
          }
        />
        {faltantes.length > 0 && (
          <div
            style={{
              backgroundColor: 'rgba(192, 57, 43, 0.12)',
              border: '1px solid #c0392b',
              borderRadius: '8px',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                color: '#c0392b',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '4px',
                fontWeight: 700,
              }}
            >
              Função(ões) Ausente(s)
            </div>
            <div
              style={{
                color: '#ff7a6b',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {faltantes.join(' · ')}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <ListaSocios
          titulo="Franqueado Vendas"
          cor="#6b8fa8"
          socios={vendas}
          atendido={temVendas}
        />
        <ListaSocios
          titulo="Franqueado Operações"
          cor="#a8956b"
          socios={operacoes}
          atendido={temOperacoes}
        />
      </div>

      {outros.length > 0 && (
        <div
          style={{
            backgroundColor: '#212529',
            borderRadius: '8px',
            padding: '12px 14px',
            marginTop: '4px',
          }}
        >
          <div
            style={{
              color: '#6c757d',
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '8px',
            }}
          >
            Outros Sócios ({outros.length})
          </div>
          {outros.map((s, idx) => (
            <SocioLinha key={`o-${idx}`} socio={s} />
          ))}
        </div>
      )}
    </>
  );
}

function ListaSocios({
  titulo,
  cor,
  socios,
  atendido,
}: {
  titulo: string;
  cor: string;
  socios: SocioItem[];
  atendido: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: atendido ? '#212529' : 'rgba(192, 57, 43, 0.1)',
        borderRadius: '8px',
        padding: '12px 14px',
        border: `1px solid ${atendido ? cor : '#c0392b'}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            color: atendido ? '#F8F9FA' : '#ff7a6b',
            fontSize: '0.8rem',
            fontWeight: 600,
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {titulo}
        </div>
        <span
          style={{
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: atendido ? cor : '#c0392b',
            color: '#fff',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {atendido ? 'OK' : 'Ausente'}
        </span>
      </div>

      {socios.length === 0 ? (
        <div style={{ color: atendido ? '#6c757d' : '#ff7a6b', fontSize: '0.8rem', fontStyle: 'italic' }}>
          Nenhum sócio identificado nesta função.
        </div>
      ) : (
        socios.map((s, idx) => <SocioLinha key={idx} socio={s} />)
      )}
    </div>
  );
}

function SocioLinha({ socio }: { socio: SocioItem }) {
  return (
    <div
      style={{
        padding: '6px 0',
        borderBottom: '1px solid #2c3136',
      }}
    >
      <div style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 500 }}>
        {socio.nome}
      </div>
      <div style={{ color: '#6c757d', fontSize: '0.7rem', marginTop: '2px' }}>
        {socio.cargo}
        {socio.funcaoEstrategica ? ` · ${socio.funcaoEstrategica}` : ''}
      </div>
    </div>
  );
}

// ============================================================
// Seção: Time Crítico
// ============================================================

function TimeCriticoSection({ estrutura }: { estrutura: EstruturaAtualDetalhe | null }) {
  if (!estrutura) {
    return (
      <div
        style={{
          color: '#adb5bd',
          fontSize: '0.85rem',
          backgroundColor: '#212529',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        Nenhum detalhamento estrutural encontrado para esta franquia.
      </div>
    );
  }

  // Ignora colaboradores "extras" (acima do ideal) no total atual
  const totalIdealComputado = estrutura.cargos.reduce((acc, c) => acc + c.ideal, 0);
  const totalAtualComputado = estrutura.cargos.reduce(
    (acc, c) => acc + Math.min(c.atual, c.ideal),
    0
  );
  // Recalcula % somente com cargos que pertencem à estrutura ideal
  const pctRecalculado =
    totalIdealComputado > 0 ? totalAtualComputado / totalIdealComputado : null;
  const pct = pctRecalculado !== null ? pctRecalculado : estrutura.percentualSemSocios;
  const pctLabel = pct !== null ? `${(pct * 100).toFixed(1)}%` : '—';
  const abaixoLimiar = pct !== null && pct < LIMIAR_TIME;

  return (
    <>
      <ExplicacaoFlag
        texto={`A flag "Time Crítico" é ativada quando o time (excluindo sócios) possui menos de ${(LIMIAR_TIME * 100).toFixed(0)}% da estrutura ideal. Os cargos LÍDER COMERCIAL e LÍDER DE OPERAÇÕES não entram no cálculo pois já estão contabilizados na societária.`}
      />

      {/* Cabeçalho com porte e % */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px',
          marginBottom: '14px',
        }}
      >
        <InfoBox label="Porte" valor={estrutura.tamanho || '—'} />
        <InfoBox
          label="Ideal / Atual"
          valor={`${totalIdealComputado} / ${totalAtualComputado}`}
        />
        <InfoBox
          label="% Estrutura (sem sócios)"
          valor={pctLabel}
          destaque={abaixoLimiar ? '#c0392b' : '#27ae60'}
          icone={
            abaixoLimiar ? (
              <TrendingDown size={14} color="#fff" />
            ) : (
              <TrendingUp size={14} color="#fff" />
            )
          }
        />
      </div>

      {/* Tabela de cargos */}
      <div
        style={{
          backgroundColor: '#212529',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px 80px',
            padding: '10px 14px',
            backgroundColor: '#2c3136',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: '#adb5bd',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <div>Cargo</div>
          <div style={{ textAlign: 'center' }}>Ideal</div>
          <div style={{ textAlign: 'center' }}>Atual</div>
          <div style={{ textAlign: 'center' }}>Gap</div>
        </div>
        {estrutura.cargos.map((c, idx) => {
          const falta = c.gap > 0;
          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 80px 80px 80px',
                padding: '8px 14px',
                fontSize: '0.8rem',
                borderTop: '1px solid #2c3136',
                color: '#F8F9FA',
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: 'Poppins, sans-serif' }}>{c.cargo}</div>
              <div style={{ textAlign: 'center', color: '#adb5bd' }}>{c.ideal}</div>
              <div style={{ textAlign: 'center', color: '#adb5bd' }}>{c.atual}</div>
              <div
                style={{
                  textAlign: 'center',
                  color: falta ? '#c0392b' : c.gap < 0 ? '#27ae60' : '#6c757d',
                  fontWeight: 600,
                }}
              >
                {c.gap > 0 ? `-${c.gap}` : c.gap < 0 ? `+${Math.abs(c.gap)}` : '0'}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// Componentes auxiliares
// ============================================================

function ExplicacaoFlag({ texto }: { texto: string }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 102, 0, 0.08)',
        border: '1px solid rgba(255, 102, 0, 0.3)',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#dbe0e5',
        fontSize: '0.78rem',
        lineHeight: 1.5,
        marginBottom: '14px',
      }}
    >
      {texto}
    </div>
  );
}

function InfoBox({
  label,
  valor,
  destaque,
  icone,
}: {
  label: string;
  valor: string;
  destaque?: string;
  icone?: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: '#212529',
        borderRadius: '8px',
        padding: '10px 12px',
        borderLeft: destaque ? `3px solid ${destaque}` : '3px solid #495057',
      }}
    >
      <div
        style={{
          color: '#6c757d',
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: destaque || '#F8F9FA',
          fontSize: '0.95rem',
          fontWeight: 700,
          fontFamily: "'Orbitron', sans-serif",
        }}
      >
        {icone && (
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: destaque || '#495057',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icone}
          </span>
        )}
        {valor}
      </div>
    </div>
  );
}
