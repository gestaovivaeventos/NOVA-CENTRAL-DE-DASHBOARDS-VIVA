/**
 * Market Share - Turmas
 * Duas abas: "Fundos Carteira x Mercado" + "Target Medicina"
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import {
  AnaliseMercadoLayout,
  SecaoMarketShareV2,
  PopupDadosInfo,
} from '@/modules/analise-mercado/components';
import { MOCK_MARKET_SHARE_V2 } from '@/modules/analise-mercado/utils/mock-market-share-v2';
import type { DadosMarketShareV2 } from '@/modules/analise-mercado/types';

export default function MarketShareTurmasPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    dados,
    loading,
    initialLoading,
    filtros,
    setFiltros,
  } = useAnaliseMercado();
  const [ready, setReady] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !ready) {
      if (!isAuthenticated) { router.replace('/login'); return; }
      if (user && user.accessLevel !== 1) { router.replace('/'); return; }
      setReady(true);
    }
  }, [isAuthenticated, authLoading, user, router, ready]);

  if (authLoading || initialLoading || !ready) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#212529',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48,
            border: '4px solid #FF6600', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{ marginTop: 16, color: '#adb5bd' }}>Carregando Market Share - Turmas...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user && user.accessLevel !== 1) return null;

  return (
    <>
      <Head><title>Market Share - Turmas | Viva Eventos</title></Head>

      <AnaliseMercadoLayout
        titulo="MARKET SHARE - TURMAS"
        franquias={dados.franquias}
        franquiaSelecionada={filtros.franquiaId}
        onFranquiaChange={(id) => setFiltros({ franquiaId: id })}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        anosDisponiveis={[]}
        areasDisponiveis={[]}
        cursosDisponiveis={[]}
        instituicoesDisponiveis={[]}
        estadosDisponiveis={[]}
        municipiosDisponiveis={[]}
        renderFiltros={() => {
          const sidebarSelectStyle: React.CSSProperties = {
            width: '100%',
            backgroundColor: '#2D3238',
            color: '#F8F9FA',
            border: '1px solid #495057',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer',
            outline: 'none',
          };
          const sidebarLabelStyle: React.CSSProperties = {
            color: '#6C757D',
            fontSize: '0.62rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: 3,
            display: 'block',
          };
          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Filter size={14} color="#FF6600" />
                <span style={{
                  color: '#FF6600', fontSize: '0.72rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontFamily: "'Poppins', sans-serif",
                }}>
                  Filtros
                </span>
              </div>
              <div>
                <label style={sidebarLabelStyle}>Franquia</label>
                <select
                  style={sidebarSelectStyle}
                  value={filtros.franquiaId ?? ''}
                  onChange={e => setFiltros({ franquiaId: e.target.value || null })}
                >
                  <option value="">Todas (Brasil)</option>
                  {dados.franquias.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
              {filtros.franquiaId && (
                <button
                  onClick={() => setFiltros({ franquiaId: null })}
                  style={{
                    width: '100%', padding: '6px 10px', marginTop: 10,
                    backgroundColor: 'rgba(255,102,0,0.1)',
                    border: '1px solid rgba(255,102,0,0.3)',
                    borderRadius: 6, color: '#FF6600',
                    fontSize: '0.7rem', fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'pointer', textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Limpar Filtro
                </button>
              )}
            </div>
          );
        }}
      >
        {/* Loading overlay sutil */}
        {loading && !initialLoading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            height: 3, backgroundColor: 'rgba(255,102,0,0.2)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: '40%', backgroundColor: '#FF6600',
              animation: 'loadbar 1s ease-in-out infinite',
            }} />
            <style jsx>{`@keyframes loadbar { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
          </div>
        )}

        {/* Banner dados mockados */}

        <PopupDadosInfo
          storageKey="market-share-turmas"
          dados={[
            { label: 'Aba Market Share Turma — Aguardando integração', tipo: 'desenvolvimento' },
            { label: 'Aba Market Share Medicina — Dados de demonstração', tipo: 'mockado' },
          ]}
        />

        <SecaoMarketShareV2 dados={{
          ...MOCK_MARKET_SHARE_V2,
          turmas: {
            totalTurmas: 0,
            totalTurmasCarteira: 0,
            participacao: 0,
            comparativoAnual: [],
            rankingFranquias: [],
            semDados: true,
          },
        } as DadosMarketShareV2} modo="turmas" />

        {/* Rodapé */}
        <div style={{
          marginTop: 32, padding: '12px 16px',
          backgroundColor: '#2D3238', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#6C757D', fontSize: '0.68rem' }}>
            Fonte: Dados mockados para validação
          </span>
          <span style={{ color: '#4a5568', fontSize: '0.65rem' }}>
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </span>
        </div>
      </AnaliseMercadoLayout>
    </>
  );
}
