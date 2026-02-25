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
  PainelFranquia,
} from '@/modules/analise-mercado/components';
import type { VisaoAtiva } from '@/modules/analise-mercado/types';

export default function AnaliseMercadoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    dados,
    loading,
    filtros,
    setFiltros,
    visaoAtiva,
    setVisaoAtiva,
    anosDisponiveis,
    areasDisponiveis,
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

  if (authLoading || loading || !ready) {
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
      >
        {/* Aviso mockado */}
        <div style={{
          backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 6, padding: '8px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>⚠️</span>
          <p style={{ color: '#F59E0B', fontSize: '0.75rem', margin: 0 }}>
            <strong>Validação de Layout</strong> — Dados fictícios baseados em tendências do Censo INEP
          </p>
        </div>

        {/* Painel de Franquia (se selecionada) */}
        {dados.dadosFranquia && (
          <PainelFranquia dados={dados.dadosFranquia} />
        )}

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
            />
          ))}
        </div>

        {/* Tabs: Alunos / Turmas */}
        <div style={{
          display: 'flex', gap: 0, marginBottom: 20,
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
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo da Visão Ativa */}
        {visaoAtiva === 'alunos' ? (
          <SecaoAlunos
            dados={dados}
            filtros={filtros}
            onEstadoClick={handleEstadoClick}
          />
        ) : (
          <SecaoTurmas
            dados={dados}
            filtros={filtros}
            onEstadoClick={handleEstadoClick}
          />
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
