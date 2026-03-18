/**
 * Análise de Mercado — Dashboard Reestruturado
 * Visão Brasil (Overview) com filtro de franquias na sidebar
 * Dois pilares: Análise de Alunos + Análise de Turmas
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import {
  AnaliseMercadoLayout,
  CardIndicador,
  SecaoAlunos,
  SecaoTurmas,
} from '@/modules/analise-mercado/components';
import type { VisaoAtiva } from '@/modules/analise-mercado/types';



export default function AnaliseMercadoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    dados,
    loading,
    initialLoading,
    filtros,
    setFiltros,
    visaoAtiva,
    setVisaoAtiva,
    anosDisponiveis,
    areasDisponiveis,
    cursosDisponiveis,
    instituicoesDisponiveis,
    estadosDisponiveis,
    municipiosDisponiveis,
    forceRefresh,
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
          <p style={{ marginTop: 16, color: '#adb5bd' }}>Carregando Análise de Mercado...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user && user.accessLevel !== 1) return null;

  const handleEstadoClick = (uf: string) => {
    setFiltros({ estado: filtros.estado === uf ? null : (uf || null) });
  };

  const tabs: { id: VisaoAtiva; label: string; cor: string }[] = [
    { id: 'alunos', label: 'Análise de Alunos', cor: '#3B82F6' },
    { id: 'turmas', label: 'Análise de Turmas (TAM)', cor: '#FF6600' },
    { id: 'ens-medio', label: 'Ens. Médio', cor: '#F59E0B' },
  ];

  return (
    <>
      <Head><title>Análise de Mercado | Viva Eventos</title></Head>

      <AnaliseMercadoLayout
        titulo="ANÁLISE DE MERCADO"
        franquias={dados.franquias}
        franquiaSelecionada={filtros.franquiaId}
        onFranquiaChange={(id) => setFiltros({ franquiaId: id })}
        filtros={filtros}
        onFiltrosChange={setFiltros}
        anosDisponiveis={anosDisponiveis}
        areasDisponiveis={areasDisponiveis}
        cursosDisponiveis={cursosDisponiveis}
        instituicoesDisponiveis={instituicoesDisponiveis}
        estadosDisponiveis={estadosDisponiveis}
        municipiosDisponiveis={municipiosDisponiveis}
      >
        {/* Indicador de refetch (loading sutil) */}
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

        {/* Fonte de dados */}
        <div style={{
          backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 6, padding: '8px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>📊</span>
          <p style={{ color: '#10B981', fontSize: '0.75rem', margin: 0, flex: 1 }}>
            <strong>Dados INEP</strong> — Censo da Educação Superior via Google Sheets
            {dados.ultimaAtualizacao && (
              <span style={{ color: '#6B7280', marginLeft: 8 }}>
                (cache: {new Date(dados.ultimaAtualizacao).toLocaleString('pt-BR')})
              </span>
            )}
          </p>
          <button
            onClick={forceRefresh}
            title="Atualizar dados (limpar cache)"
            style={{
              background: 'none', border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
              color: '#10B981', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Cards Indicadores Principais */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}>
          {dados.indicadores.map(ind => (
            <CardIndicador
              key={ind.id}
              indicador={ind}
              compacto={dados.indicadores.length > 4}
              ano={filtros.ano}
            />
          ))}
        </div>

        {/* Tabs: Alunos / Turmas */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20,
          borderBottom: '2px solid #495057',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setVisaoAtiva(tab.id)}
              style={{
                padding: '10px 24px',
                backgroundColor: visaoAtiva === tab.id ? '#343A40' : 'transparent',
                border: 'none',
                borderBottom: visaoAtiva === tab.id ? `3px solid ${tab.cor}` : '3px solid transparent',
                color: visaoAtiva === tab.id ? tab.cor : '#6C757D',
                fontSize: '0.85rem',
                fontWeight: visaoAtiva === tab.id ? 700 : 500,
                fontFamily: "'Poppins', sans-serif",
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8,
                marginBottom: -2,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Visão Ativa */}
        {visaoAtiva === 'alunos' && (
          <SecaoAlunos
            dados={dados}
            filtros={filtros}
            onEstadoClick={handleEstadoClick}
            onMetricaChange={(key) => setFiltros({ metricasAtivas: [key] })}
          />
        )}
        {visaoAtiva === 'turmas' && (
          <SecaoTurmas
            dados={dados}
            filtros={filtros}
            onEstadoClick={handleEstadoClick}
          />
        )}
        {visaoAtiva === 'ens-medio' && (
          <div style={{
            backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057',
            padding: '60px 40px', textAlign: 'center', marginTop: 8,
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8, padding: '12px 24px', marginBottom: 16,
            }}>
              <span style={{ fontSize: '1.3rem' }}>🚧</span>
              <span style={{
                color: '#F59E0B', fontSize: '0.85rem', fontWeight: 700,
                fontFamily: "'Poppins', sans-serif", letterSpacing: '0.08em',
              }}>
                EM VALIDAÇÃO
              </span>
            </div>
            <p style={{
              color: '#6C757D', fontSize: '0.82rem', margin: '12px 0 0',
              fontFamily: "'Poppins', sans-serif",
            }}>
              A análise de Ensino Médio está sendo validada e estará disponível em breve.
            </p>
          </div>
        )}

        {/* Rodapé */}
        <div style={{
          marginTop: 32, padding: '12px 16px',
          backgroundColor: '#2D3238', borderRadius: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: '#6C757D', fontSize: '0.68rem' }}>
            Fonte: {dados.fonte}
          </span>
          <span style={{ color: '#4a5568', fontSize: '0.65rem' }}>
            Última atualização: {new Date(dados.ultimaAtualizacao).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </AnaliseMercadoLayout>
    </>
  );
}
