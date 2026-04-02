/**
 * Mercado Potencial - Aluno
 * Duas abas: "Visão do Ano" (análise do ano selecionado) + "Comparativo Anual" (evolução histórica)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import {
  AnaliseMercadoLayout,
  CardIndicador,
  SecaoAlunos,
} from '@/modules/analise-mercado/components';
import SecaoComparativa from '@/modules/analise-mercado/components/SecaoComparativa';
import { CORES } from '@/modules/analise-mercado/utils/formatters';

type AbaAtiva = 'visao-ano' | 'comparativo-anual';

export default function AnaliseMercadoPage() {
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
    forceRefresh,
    progressMessage,
  } = useAnaliseMercado();
  const [ready, setReady] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('visao-ano');

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
            {progressMessage || 'Carregando Mercado Potencial - Aluno...'}
          </p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user && user.accessLevel !== 1) return null;

  const handleEstadoClick = (uf: string) => {
    setFiltros({ estado: filtros.estado === uf ? null : (uf || null) });
  };

  return (
    <>
      <Head><title>Mercado Potencial - Aluno | Viva Eventos</title></Head>

      <AnaliseMercadoLayout
        titulo="MERCADO POTENCIAL - ALUNO"
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
        hideAnoFilter={abaAtiva === 'comparativo-anual'}
      >
        {/* Indicador de refetch (loading sutil) */}
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
            {progressMessage && (
              <div style={{
                textAlign: 'center', padding: '4px 8px',
                backgroundColor: 'rgba(33,37,41,0.9)', color: '#adb5bd',
                fontSize: 12, borderBottom: '1px solid #343a40',
              }}>
                {progressMessage}
              </div>
            )}
            <style jsx>{`@keyframes loadbar { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
          </div>
        )}

        {/* Tab Switcher: Visão do Ano / Comparativo Anual (pill/segment style) */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 24,
          backgroundColor: '#2D3238', borderRadius: 12,
          padding: 6, border: '1px solid #495057',
        }}>
          {[
            { key: 'visao-ano' as AbaAtiva, label: 'Visão do Ano', icone: <BarChart3 size={14} />, cor: CORES.azul },
            { key: 'comparativo-anual' as AbaAtiva, label: 'Comparativo Anual', icone: <TrendingUp size={14} />, cor: CORES.verde },
          ].map(tab => {
            const isActive = abaAtiva === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setAbaAtiva(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '14px 24px',
                  backgroundColor: isActive ? `${tab.cor}20` : 'transparent',
                  border: isActive ? `1.5px solid ${tab.cor}` : '1.5px solid transparent',
                  borderRadius: 8,
                  color: isActive ? '#F8F9FA' : '#6C757D',
                  fontSize: '0.82rem', fontWeight: 700,
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isActive ? `0 0 16px ${tab.cor}30, inset 0 1px 0 ${tab.cor}30` : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#ADB5BD';
                    e.currentTarget.style.backgroundColor = `${tab.cor}10`;
                    e.currentTarget.style.borderColor = `${tab.cor}40`;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#6C757D';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: isActive ? tab.cor : `${tab.cor}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? '#fff' : tab.cor,
                  flexShrink: 0, transition: 'all 0.25s ease',
                }}>
                  {tab.icone}
                </span>
                {tab.label}
                {isActive && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: tab.cor,
                    boxShadow: `0 0 8px ${tab.cor}`,
                    flexShrink: 0, marginLeft: 2,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Cards Indicadores Principais — apenas Visão do Ano */}
        {abaAtiva === 'visao-ano' && (
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
        )}

        {/* Conteúdo por aba */}
        {abaAtiva === 'visao-ano' ? (
          <SecaoAlunos
            dados={dados}
            filtros={filtros}
            onEstadoClick={handleEstadoClick}
            onMetricaChange={(key) => setFiltros({ metricasAtivas: [key] })}
            loadingEvolucao={loadingEvolucao}
          />
        ) : (
          <SecaoComparativa
            evolucaoAlunos={dados.evolucaoAlunos}
            ano={filtros.ano}
            loadingEvolucao={loadingEvolucao}
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
