/**
 * Mercado Potencial - Turma
 * Duas abas: "Visão do Ano" (análise do ano selecionado) + "Comparativo Anual" (evolução histórica)
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import { AnaliseMercadoLayout, CardIndicador, SecaoTurmasMock, PopupDadosInfo } from '@/modules/analise-mercado/components';
import FiltroComBusca from '@/modules/analise-mercado/components/FiltroComBusca';
import SecaoComparativaTurmas from '@/modules/analise-mercado/components/SecaoComparativaTurmas';
import { Filter, BarChart3, TrendingUp } from 'lucide-react';
import { CORES } from '@/modules/analise-mercado/utils/formatters';

type AbaAtiva = 'visao-ano' | 'comparativo-anual';

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
            {progressMessage || 'Carregando Mercado Potencial - Turma...'}
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
      <Head><title>Mercado Potencial - Turma | Viva Eventos</title></Head>

      <AnaliseMercadoLayout
        titulo="MERCADO POTENCIAL - TURMA"
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

        {/* Alerta mock */}
        <PopupDadosInfo
          storageKey="mercado-potencial-turma"
          dados={[
            { label: 'Visão do Ano — Dados de demonstração', tipo: 'mockado' },
            { label: 'Comparativo Anual — Dados de demonstração', tipo: 'mockado' },
          ]}
        />

        {/* KPI Cards — apenas Visão do Ano */}
        {abaAtiva === 'visao-ano' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            marginBottom: 20,
          }}>
            {[
              { id: 'turmas-total', titulo: 'Total de Turmas', valor: 799680, variacao: 3.2, tendencia: 'up' as const, cor: '#FF6600', subtitulo: 'Graduação + Tecnólogo' },
              { id: 'turmas-pres', titulo: 'Turmas Presencial', valor: 312450, variacao: -1.4, tendencia: 'down' as const, cor: '#10B981', subtitulo: 'Turmas presenciais ativas' },
              { id: 'turmas-ead', titulo: 'Turmas EAD', valor: 487230, variacao: 6.8, tendencia: 'up' as const, cor: '#8B5CF6', subtitulo: 'Turmas a distância' },
              ...(dados.indicadores.filter(i => i.id === 'ies' || i.id === 'cursos')),
            ].map(ind => (
              <CardIndicador
                key={ind.id}
                indicador={ind}
                compacto
                ano={filtros.ano}
              />
            ))}
          </div>
        )}

        {/* Conteúdo por aba */}
        {abaAtiva === 'visao-ano' ? (
          <SecaoTurmasMock
            filtros={filtros}
            onEstadoClick={(uf: string) => setFiltros({ estado: filtros.estado === uf ? null : (uf || null) })}
          />
        ) : (
          <SecaoComparativaTurmas
            ano={filtros.ano}
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
