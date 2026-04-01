/**
 * Análise de Mercado — Análise Comparativa
 * Tendências e Tempo: Evolução histórica, detalhamento anual, taxas de crescimento
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import { AnaliseMercadoLayout } from '@/modules/analise-mercado/components';
import FiltroComBusca from '@/modules/analise-mercado/components/FiltroComBusca';
import SecaoComparativa from '@/modules/analise-mercado/components/SecaoComparativa';
import { Filter } from 'lucide-react';

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

  const optionsMunicipios = municipiosDisponiveis.map(m => ({ value: m, label: m }));
  const optionsInstituicoes = instituicoesDisponiveis.map(i => ({ value: String(i.codIes), label: i.nome }));
  const optionsCursos = cursosDisponiveis.map(c => ({ value: c, label: c }));

  const renderFiltros = () => (
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Franquia */}
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

        {/* Estado (UF) */}
        <div>
          <label style={sidebarLabelStyle}>Estado (UF)</label>
          <select
            style={sidebarSelectStyle}
            value={filtros.estado ?? ''}
            onChange={e => setFiltros({ estado: e.target.value || null })}
          >
            <option value="">Todos</option>
            {estadosDisponiveis.map(e => (
              <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
            ))}
          </select>
        </div>

        {/* Município */}
        <FiltroComBusca
          label="Município"
          value={filtros.municipio ?? ''}
          placeholder="Todos"
          options={optionsMunicipios}
          onChange={v => setFiltros({ municipio: v || null })}
        />

        {/* Rede */}
        <div>
          <label style={sidebarLabelStyle}>Rede</label>
          <select
            style={sidebarSelectStyle}
            value={filtros.tipoInstituicao}
            onChange={e => setFiltros({ tipoInstituicao: e.target.value as 'todos' | 'publica' | 'privada' })}
          >
            <option value="todos">Todas</option>
            <option value="publica">Pública</option>
            <option value="privada">Privada</option>
          </select>
        </div>

        {/* Modalidade */}
        <div>
          <label style={sidebarLabelStyle}>Modalidade</label>
          <select
            style={sidebarSelectStyle}
            value={filtros.modalidade}
            onChange={e => setFiltros({ modalidade: e.target.value as 'todos' | 'presencial' | 'ead' })}
          >
            <option value="todos">Todas</option>
            <option value="presencial">Presencial</option>
            <option value="ead">EAD</option>
          </select>
        </div>

        {/* Instituição */}
        <FiltroComBusca
          label="Instituição"
          value={filtros.instituicaoId ? String(filtros.instituicaoId) : ''}
          placeholder="Todas"
          options={optionsInstituicoes}
          onChange={v => setFiltros({ instituicaoId: v ? Number(v) : null })}
        />

        {/* Curso */}
        <FiltroComBusca
          label="Curso"
          value={filtros.curso ?? ''}
          placeholder="Todos"
          options={optionsCursos}
          onChange={v => setFiltros({ curso: v || null })}
        />

        {/* Limpar filtros */}
        {(filtros.franquiaId || filtros.tipoInstituicao !== 'todos' || filtros.modalidade !== 'todos' || filtros.estado || filtros.municipio || filtros.instituicaoId || filtros.curso) && (
          <button
            onClick={() => {
              setFiltros({
                franquiaId: null,
                tipoInstituicao: 'todos',
                modalidade: 'todos',
                estado: null,
                municipio: null,
                instituicaoId: null,
                curso: null,
              });
            }}
            style={{
              width: '100%', padding: '6px 10px',
              backgroundColor: 'rgba(255,102,0,0.1)',
              border: '1px solid rgba(255,102,0,0.3)',
              borderRadius: 6, color: '#FF6600',
              fontSize: '0.7rem', fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              cursor: 'pointer', textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );

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
        renderFiltros={renderFiltros}
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
