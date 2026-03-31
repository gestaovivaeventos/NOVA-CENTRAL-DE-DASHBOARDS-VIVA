/**
 * Análise de Mercado — Análise Comparativa
 * Tendências e Tempo: Evolução histórica, detalhamento anual, taxas de crescimento
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import { AnaliseMercadoLayout } from '@/modules/analise-mercado/components';
import SecaoComparativa from '@/modules/analise-mercado/components/SecaoComparativa';

export default function ComparativaPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    dados,
    loading,
    loadingEvolucao,
    initialLoading,
    filtros,
    setFiltros,
    anosDisponiveis,
    areasDisponiveis,
    cursosDisponiveis,
    instituicoesDisponiveis,
    estadosDisponiveis,
    municipiosDisponiveis,
    progressMessage,
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
          <p style={{ marginTop: 16, color: '#adb5bd' }}>
            {progressMessage || 'Carregando Análise Comparativa...'}
          </p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user && user.accessLevel !== 1) return null;

  return (
    <>
      <Head><title>Análise Comparativa | Viva Eventos</title></Head>

      <AnaliseMercadoLayout
        titulo="ANÁLISE COMPARATIVA"
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
        hideFiltros
      >
        {/* Loading overlay sutil */}
        {loading && !initialLoading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          }}>
            <div style={{ height: 3, backgroundColor: 'rgba(255,102,0,0.2)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: '40%', backgroundColor: '#FF6600',
                animation: 'loadbar 1s ease-in-out infinite',
              }} />
            </div>
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
            <strong>Dados INEP</strong> — Evolução histórica do Censo da Educação Superior
          </p>
        </div>

        <SecaoComparativa
          evolucaoAlunos={dados.evolucaoAlunos}
          ano={filtros.ano}
          loadingEvolucao={loadingEvolucao}
        />

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
