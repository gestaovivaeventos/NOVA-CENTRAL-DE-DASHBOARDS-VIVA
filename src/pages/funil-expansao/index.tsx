/**
 * Página Principal - Dashboard Funil de Expansão
 * 4 abas: Indicadores Principais, Operacionais, Composição, Campanhas
 * Acesso restrito: Franqueadora + usuários cris/gabriel
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Header,
  Sidebar,
  Loading,
  Footer,
  KPICard,
  FunilVisual,
  HorizontalBarTable,
  GroupedBarChart,
  AssertividadeCard,
  DataTableExpansao,
} from '@/modules/funil-expansao/components';
import type { SeriesKey } from '@/modules/funil-expansao/components';
import { useFunilExpansaoData } from '@/modules/funil-expansao/hooks';
import {
  filtrarLeads,
  calcularKPIs,
  calcularFunil,
  calcularFunilAtivos,
  calcularRegiaoMaiorAcerto,
  calcularAssertividadePersonaExtremos,
  agruparPorOrigem,
  calcularAssertividadeTerritorio,
  calcularAssertividadePersona,
  agruparPorPersona,
  agruparPorPerfil,
  agruparMotivosPerda,
  agruparMotivosQualificacao,
  agruparFasesPerda,
  agruparCampanhas,
  agruparConjuntos,
  agruparAnuncios,
  agruparPorCidade,
  agruparTempoComposicaoPorCidade,
  extrairOrigens,
  listarCidadesFranquias,
  listarCidadesAguardandoComposicao,
  listarLeadsPorRegiao,
} from '@/modules/funil-expansao/utils/calculos';
import { formatNumber, formatPercent } from '@/modules/funil-expansao/utils/formatacao';
import { PAGES, COLORS } from '@/modules/funil-expansao/config/app.config';
import type { FiltrosExpansao, PaginaAtivaExpansao } from '@/modules/funil-expansao/types';
import { useAuth } from '@/context/AuthContext';
import { Users, TrendingUp, Target, Award, MapPin, RefreshCw, AlertTriangle } from 'lucide-react';

const INITIAL_FILTROS: FiltrosExpansao = {
  tipoFunil: ['TODOS'],
  origem: ['Todas'],
  periodoInicio: `${new Date().getFullYear()}-01-01`,
  periodoFim: new Date().toISOString().split('T')[0],
  periodoSelecionado: 'esteanoateagora',
};

const FILTROS_STORAGE_KEY = 'funilExpansaoFiltros';

function loadFiltrosFromStorage(): FiltrosExpansao {
  if (typeof window === 'undefined') return INITIAL_FILTROS;
  try {
    const saved = localStorage.getItem(FILTROS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validar que tem as propriedades esperadas
      if (parsed.periodoInicio !== undefined && parsed.periodoFim !== undefined) {
        return { ...INITIAL_FILTROS, ...parsed };
      }
    }
  } catch {}
  return INITIAL_FILTROS;
}

export default function FunilExpansaoDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Página ativa
  const getPaginaFromPath = (path: string): PaginaAtivaExpansao => {
    if (path.includes('/funil-expansao/operacionais')) return 'operacionais';
    if (path.includes('/funil-expansao/composicao')) return 'composicao';
    if (path.includes('/funil-expansao/campanhas')) return 'campanhas';
    return 'indicadores';
  };

  const [paginaAtiva, setPaginaAtiva] = useState<PaginaAtivaExpansao>(() => getPaginaFromPath(router.asPath));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosExpansao>(loadFiltrosFromStorage);
  const [sharedActiveSeries, setSharedActiveSeries] = useState<Set<SeriesKey>>(new Set(['geral', 'mql', 'sql']));

  // Persistir filtros no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify(filtros));
    }
  }, [filtros]);

  // Client-side init
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('funilExpansaoSidebarCollapsed');
    if (saved === 'true') setSidebarCollapsed(true);
  }, []);

  // Sync sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('funilExpansaoSidebarCollapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Sync URL
  useEffect(() => {
    const paginaCorreta = getPaginaFromPath(router.asPath);
    if (paginaAtiva !== paginaCorreta) setPaginaAtiva(paginaCorreta);
    if (router.asPath === '/funil-expansao' || router.asPath === '/funil-expansao/') {
      router.replace('/funil-expansao/indicadores', undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaginaChange = useCallback((novaPagina: string) => {
    const pagina = novaPagina as PaginaAtivaExpansao;
    setPaginaAtiva(pagina);
    router.push(`/funil-expansao/${pagina}`, undefined, { shallow: true });
  }, [router]);

  // Dados
  const { data: rawData, loading, error, lastUpdate } = useFunilExpansaoData();

  // Filtrar dados
  const dadosFiltrados = useMemo(() => filtrarLeads(rawData, filtros), [rawData, filtros]);

  // Dados sem fase 0 (POTENCIAIS) — usados em todos os gráficos exceto Conversão e Ativos
  const dadosSemPotenciais = useMemo(
    () => dadosFiltrados.filter(l => l.status.toUpperCase() !== 'POTENCIAIS'),
    [dadosFiltrados]
  );

  // Origens para o filtro
  const origens = useMemo(() => extrairOrigens(rawData), [rawData]);

  // KPIs (sem POTENCIAIS)
  const kpis = useMemo(() => calcularKPIs(dadosSemPotenciais), [dadosSemPotenciais]);

  // Dados para cards expandíveis (sem POTENCIAIS)
  const cidadesFranquias = useMemo(() => listarCidadesFranquias(dadosSemPotenciais), [dadosSemPotenciais]);
  const cidadesAguardando = useMemo(() => listarCidadesAguardandoComposicao(dadosSemPotenciais), [dadosSemPotenciais]);
  const leadsPorRegiao = useMemo(() => listarLeadsPorRegiao(dadosSemPotenciais), [dadosSemPotenciais]);

  // Funil completo — Conversão (com POTENCIAIS)
  const funil = useMemo(() => calcularFunil(dadosFiltrados), [dadosFiltrados]);

  // Dados operacionais (sem POTENCIAIS)
  const dadosOrigem = useMemo(() => agruparPorOrigem(dadosSemPotenciais), [dadosSemPotenciais]);
  const assertTerritorio = useMemo(() => calcularAssertividadeTerritorio(dadosSemPotenciais), [dadosSemPotenciais]);
  const assertPersona = useMemo(() => calcularAssertividadePersona(dadosSemPotenciais), [dadosSemPotenciais]);
  const dadosPersona = useMemo(() => agruparPorPersona(dadosSemPotenciais), [dadosSemPotenciais]);
  const dadosPerfil = useMemo(() => agruparPorPerfil(dadosSemPotenciais), [dadosSemPotenciais]);
  const motivosQualificacao = useMemo(() => agruparMotivosQualificacao(dadosSemPotenciais), [dadosSemPotenciais]);
  const motivosPerda = useMemo(() => agruparMotivosPerda(dadosSemPotenciais), [dadosSemPotenciais]);
  const fasesPerda = useMemo(() => agruparFasesPerda(dadosSemPotenciais), [dadosSemPotenciais]);

  // Dados de campanhas (sem POTENCIAIS, somente Tráfego)
  const leadsTrafego = useMemo(() => dadosSemPotenciais.filter(l => l.origem.toUpperCase().includes('TRÁFEGO') || l.origem.toUpperCase().includes('TRAFEGO')), [dadosSemPotenciais]);
  const campanhas = useMemo(() => agruparCampanhas(leadsTrafego), [leadsTrafego]);
  const conjuntos = useMemo(() => agruparConjuntos(leadsTrafego), [leadsTrafego]);
  const anuncios = useMemo(() => agruparAnuncios(leadsTrafego), [leadsTrafego]);

  // Dados de composição (sem POTENCIAIS)
  const cidadesData = useMemo(() => agruparPorCidade(dadosSemPotenciais), [dadosSemPotenciais]);

  // Funil de ativos — Ativos (com POTENCIAIS)
  const funilAtivos = useMemo(() => calcularFunilAtivos(dadosFiltrados), [dadosFiltrados]);

  // Região com maior acerto (sem POTENCIAIS)
  const regiaoAcerto = useMemo(() => calcularRegiaoMaiorAcerto(dadosSemPotenciais), [dadosSemPotenciais]);

  // Persona assertividade extremos (sem POTENCIAIS)
  const personaExtremos = useMemo(() => calcularAssertividadePersonaExtremos(dadosSemPotenciais), [dadosSemPotenciais]);

  // Tempo composição por cidade (sem POTENCIAIS)
  const tempoComposicao = useMemo(() => agruparTempoComposicaoPorCidade(dadosSemPotenciais), [dadosSemPotenciais]);

  // Auth check
  if (authLoading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <Loading mensagem="Carregando..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  // Contagem por funil (sem POTENCIAIS)
  const totalTratamento = dadosSemPotenciais.filter(l => l.tipoFunil === 'TRATAMENTO').length;
  const totalInvestidor = dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR').length;
  const totalOperador = dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR').length;

  // Contagem de ativos por funil para o painel (ativo = motivoPerda vazio, sem POTENCIAIS)
  const ativosInvestidor = dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR' && !l.motivoPerda).length;
  const ativosOperador = dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR' && !l.motivoPerda).length;

  // Vendas por tipo de funil (sem POTENCIAIS)
  const vendasInvestidor = {
    ganhas: dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR' && l.status.includes('CANDIDATO APROVADO')).length,
    perdidas: dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR' && l.motivoPerda !== '').length,
    recuperacao: dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR' && l.status.includes('RECUPERA')).length,
    franquias: dadosSemPotenciais.filter(l => l.tipoFunil === 'INVESTIDOR' && l.status.includes('CANDIDATO APROVADO')).length,
  };

  const vendasOperador = {
    ganhas: dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR' && l.status.includes('CANDIDATO APROVADO')).length,
    perdidas: dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR' && l.motivoPerda !== '').length,
    recuperacao: dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR' && l.status.includes('RECUPERA')).length,
    franquias: dadosSemPotenciais.filter(l => l.tipoFunil === 'OPERADOR' && l.status.includes('CANDIDATO APROVADO')).length,
  };

  const vendasTratamento = {
    ganhas: 0,
    perdidas: dadosSemPotenciais.filter(l => l.motivoPerda !== '' && l.tipoFunil === 'TRATAMENTO').length,
    recuperacao: dadosSemPotenciais.filter(l => l.status.includes('RECUPERA') && l.tipoFunil === 'TRATAMENTO').length,
  };

  // Split por funil (todos os leads)
  const totalSplit = totalTratamento + totalInvestidor + totalOperador;
  const splitTratamento = totalSplit > 0 ? (totalTratamento / totalSplit) * 100 : 0;
  const splitInvestidor = totalSplit > 0 ? (totalInvestidor / totalSplit) * 100 : 0;
  const splitOperador = totalSplit > 0 ? (totalOperador / totalSplit) * 100 : 0;

  return (
    <>
      <Head>
        <title>Vendas Expansão | VIVA Eventos</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen" style={{ backgroundColor: '#212529' }}>
        <Sidebar
          paginaAtiva={paginaAtiva}
          onPaginaChange={handlePaginaChange}
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          filtros={filtros}
          onFiltrosChange={setFiltros}
          origens={origens}
        />

        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Conteúdo principal */}
        <main
          className="transition-all duration-300 px-4 pb-8"
          style={{ marginLeft: sidebarCollapsed ? '60px' : '300px' }}
        >
          {/* Espaçamento */}
          <div className="py-4" />

          {/* Loading / Error */}
          {loading && <Loading mensagem="Carregando dados do funil..." />}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: '#dc354520', border: '1px solid #dc3545' }}>
              <AlertTriangle size={20} color="#dc3545" />
              <p className="text-sm" style={{ color: '#dc3545' }}>Erro: {error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ===================== INDICADORES PRINCIPAIS ===================== */}
              {paginaAtiva === 'indicadores' && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <KPICard
                      titulo="Total de Leads"
                      valor={kpis.totalLeads}
                      icone={<Users size={20} />}
                      corDestaque="#FF6600"
                      expandivel={
                        leadsPorRegiao.length > 0 ? (
                          <div>
                            <p className="text-[10px] uppercase font-semibold mb-2" style={{ color: '#adb5bd' }}>Leads por Região</p>
                            <ul className="space-y-1">
                              {leadsPorRegiao.map(r => (
                                <li key={r.regiao} className="text-xs flex items-center justify-between" style={{ color: '#F8F9FA' }}>
                                  <span className="flex items-center gap-1.5">
                                    <span style={{ color: '#FF6600' }}>●</span> {r.regiao}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="text-[10px]" style={{ color: '#adb5bd' }}>{kpis.totalLeads > 0 ? formatPercent((r.quantidade / kpis.totalLeads) * 100, 1) : '0%'}</span>
                                    <span className="text-[10px] font-bold" style={{ color: '#FF6600' }}>{r.quantidade}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#6c757d' }}>Nenhum lead encontrado</p>
                        )
                      }
                    />
                    <KPICard
                      titulo="MQL (Qualificado)"
                      valor={kpis.mqls}
                      icone={<TrendingUp size={20} />}
                      corDestaque="#60a5fa"
                      subtitulo={`Taxa conversão: ${formatPercent(kpis.taxaMql, 1)} do total`}
                      detalhes={`Hoje: ${formatNumber(kpis.mqlAtivos)} ativos`}
                    />
                    <KPICard
                      titulo="SQL (Avançado)"
                      valor={kpis.sqls}
                      icone={<Target size={20} />}
                      corDestaque="#a78bfa"
                      subtitulo={`Taxa conversão: ${formatPercent(kpis.taxaSql, 1)} do total`}
                      detalhes={`Hoje: ${formatNumber(kpis.sqlAtivos)} ativos`}
                    />
                    <KPICard
                      titulo="Candidatos Aprovados"
                      valor={kpis.candidatosAprovados}
                      icone={<Award size={20} />}
                      corDestaque="#28a745"
                      subtitulo={`Taxa geral ${formatPercent(kpis.taxaAprovacao, 2)}`}
                      detalhes={`${formatNumber(kpis.candidatosAprovadosInv)} inv. · ${formatNumber(kpis.candidatosAprovadosOp)} op.`}
                    />
                    <KPICard
                      titulo="Franquias"
                      valor={kpis.franquias}
                      icone={<MapPin size={20} />}
                      corDestaque="#ffc107"
                      expandivel={
                        cidadesFranquias.length > 0 ? (
                          <div>
                            <p className="text-[10px] uppercase font-semibold mb-2" style={{ color: '#adb5bd' }}>Cidades vendidas</p>
                            <ul className="space-y-1">
                              {cidadesFranquias.map(c => (
                                <li key={c} className="text-xs flex items-center gap-1.5" style={{ color: '#F8F9FA' }}>
                                  <span style={{ color: '#ffc107' }}>●</span> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#6c757d' }}>Nenhuma franquia vendida</p>
                        )
                      }
                    />
                  </div>

                  {/* KPIs secundários */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <KPICard
                      titulo="Assert. Território"
                      valor={kpis.assertividadeTerritorio}
                      formato="percentual"
                      corDestaque="#17a2b8"
                    />
                    <KPICard
                      titulo="Assert. Persona"
                      valor={kpis.assertividadePersona}
                      formato="percentual"
                      corDestaque="#17a2b8"
                    />
                    <KPICard
                      titulo="Aguard. Composição"
                      valor={kpis.aguardandoComposicao}
                      corDestaque="#ffc107"
                      detalhes={`${formatNumber(kpis.aguardandoComposicaoInv)} inv. · ${formatNumber(kpis.aguardandoComposicaoOp)} op.`}
                      expandivel={
                        cidadesAguardando.length > 0 ? (
                          <div>
                            <p className="text-[10px] uppercase font-semibold mb-2" style={{ color: '#adb5bd' }}>Cidades aguardando</p>
                            <ul className="space-y-1">
                              {cidadesAguardando.map(c => (
                                <li key={c.cidade} className="text-xs flex items-center justify-between" style={{ color: '#F8F9FA' }}>
                                  <span className="flex items-center gap-1.5">
                                    <span style={{ color: '#ffc107' }}>●</span> {c.cidade}
                                  </span>
                                  <span className="text-[10px]" style={{ color: '#adb5bd' }}>{c.inv} inv. · {c.op} op.</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#6c757d' }}>Nenhuma cidade aguardando</p>
                        )
                      }
                    />
                    <KPICard
                      titulo="Em Recuperação"
                      valor={kpis.emRecuperacao}
                      icone={<RefreshCw size={20} />}
                      corDestaque="#ffc107"
                      detalhes={`${formatNumber(kpis.emRecuperacaoTrat)} trat. · ${formatNumber(kpis.emRecuperacaoInv)} inv. · ${formatNumber(kpis.emRecuperacaoOp)} op.`}
                    />
                    <KPICard
                      titulo="Perdidos"
                      valor={kpis.perdidos}
                      corDestaque="#dc3545"
                      detalhes={`${formatNumber(kpis.perdidosTrat)} trat. · ${formatNumber(kpis.perdidosInv)} inv. · ${formatNumber(kpis.perdidosOp)} op.`}
                    />
                  </div>

                  {/* Split Tratamento / Investidor / Operador */}
                  {totalSplit > 0 && (
                    <div
                      className="rounded-xl p-4"
                      style={{ backgroundColor: '#343A40', border: '1px solid #495057' }}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                        Split por Funil (Tratamento / Investidor / Operador)
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 relative group cursor-default">
                          <div className="w-full rounded-full flex" style={{ height: '28px' }}>
                            {splitTratamento > 0 && (
                              <div
                                style={{ width: `${splitTratamento}%`, backgroundColor: COLORS.FUNIL_TRATAMENTO, borderRadius: splitInvestidor === 0 && splitOperador === 0 ? '9999px' : '9999px 0 0 9999px' }}
                                className="flex items-center justify-center"
                              >
                                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{formatPercent(splitTratamento, 1)}</span>
                              </div>
                            )}
                            {splitInvestidor > 0 && (
                              <div
                                style={{ width: `${splitInvestidor}%`, backgroundColor: COLORS.FUNIL_INVESTIDOR, borderRadius: splitTratamento === 0 && splitOperador === 0 ? '9999px' : splitTratamento === 0 ? '9999px 0 0 9999px' : splitOperador === 0 ? '0 9999px 9999px 0' : '0' }}
                                className="flex items-center justify-center"
                              >
                                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{formatPercent(splitInvestidor, 1)}</span>
                              </div>
                            )}
                            {splitOperador > 0 && (
                              <div
                                style={{ width: `${splitOperador}%`, backgroundColor: COLORS.FUNIL_OPERADOR, borderRadius: splitTratamento === 0 && splitInvestidor === 0 ? '9999px' : '0 9999px 9999px 0' }}
                                className="flex items-center justify-center"
                              >
                                <span className="text-xs font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{formatPercent(splitOperador, 1)}</span>
                              </div>
                            )}
                          </div>
                          {/* Tooltip único para toda a barra */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg"
                            style={{ backgroundColor: '#1a1d21', border: '1px solid #495057' }}>
                            <div className="space-y-1.5" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_TRATAMENTO }} />
                                <span className="text-sm" style={{ color: '#F8F9FA' }}>Tratamento: <strong>{totalTratamento}</strong> ({formatPercent(splitTratamento, 1)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_INVESTIDOR }} />
                                <span className="text-sm" style={{ color: '#F8F9FA' }}>Investidor: <strong>{totalInvestidor}</strong> ({formatPercent(splitInvestidor, 1)})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_OPERADOR }} />
                                <span className="text-sm" style={{ color: '#F8F9FA' }}>Operador: <strong>{totalOperador}</strong> ({formatPercent(splitOperador, 1)})</span>
                              </div>
                              <div className="border-t pt-1.5 mt-1" style={{ borderColor: '#495057' }}>
                                <span className="text-sm font-semibold" style={{ color: '#FF6600' }}>Total: {totalSplit} leads</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_TRATAMENTO }} />
                            <span className="text-xs font-medium" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>Tratamento</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_INVESTIDOR }} />
                            <span className="text-xs font-medium" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>Investidor</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.FUNIL_OPERADOR }} />
                            <span className="text-xs font-medium" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>Operador</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Funil de Conversão */}
                  <div>
                    <h2 className="section-title">
                      Funil Expansão - <span className="section-title-highlight">Conversão</span>
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <FunilVisual
                        titulo="Funil Tratamento"
                        etapas={funil.tratamento}
                        cor={COLORS.FUNIL_TRATAMENTO}
                        vendas={vendasTratamento}
                        hideGanhas
                      />
                      <FunilVisual
                        titulo="Funil Investidor"
                        etapas={funil.investidor}
                        cor={COLORS.FUNIL_INVESTIDOR}
                        vendas={vendasInvestidor}
                      />
                      <FunilVisual
                        titulo="Funil Operador"
                        etapas={funil.operador}
                        cor={COLORS.FUNIL_OPERADOR}
                        vendas={vendasOperador}
                      />
                    </div>
                  </div>

                  {/* Funil de Ativos */}
                  <div>
                    <h2 className="section-title">
                      Funil Expansão - <span className="section-title-highlight">Ativos</span>
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <FunilVisual
                        titulo="Funil Tratamento"
                        etapas={funilAtivos.tratamento}
                        cor={COLORS.FUNIL_TRATAMENTO}
                      />
                      <FunilVisual
                        titulo="Funil Investidor"
                        etapas={funilAtivos.investidor}
                        cor={COLORS.FUNIL_INVESTIDOR}
                      />
                      <FunilVisual
                        titulo="Funil Operador"
                        etapas={funilAtivos.operador}
                        cor={COLORS.FUNIL_OPERADOR}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== INDICADORES OPERACIONAIS ===================== */}
              {paginaAtiva === 'operacionais' && (
                <div className="space-y-6">
                  {/* Leads por Origem */}
                  <GroupedBarChart
                    titulo="Leads por Origem (Canais)"
                    dados={dadosOrigem.map(d => ({ label: d.origem, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    activeSeries={sharedActiveSeries}
                    onActiveSeriesChange={setSharedActiveSeries}
                  />

                  {/* Assertividade */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AssertividadeCard
                      titulo="Assertividade Território"
                      dados={assertTerritorio}
                      regiaoInfo={regiaoAcerto.focoRegiao ? { regiao: regiaoAcerto.focoRegiao, qtd: regiaoAcerto.focoQtd, label: 'Região com maior Foco' } : undefined}
                      menorInfo={regiaoAcerto.menorRegiao ? { nome: regiaoAcerto.menorRegiao, qtd: regiaoAcerto.menorQtd, label: 'Região com menor Assertividade' } : undefined}
                    />
                    <AssertividadeCard
                      titulo="Assertividade Persona"
                      dados={assertPersona}
                      regiaoInfo={personaExtremos.maiorPersona ? { regiao: personaExtremos.maiorPersona, qtd: personaExtremos.maiorQtd, label: 'Persona com maior Foco' } : undefined}
                      menorInfo={personaExtremos.menorPersona ? { nome: personaExtremos.menorPersona, qtd: personaExtremos.menorQtd, label: 'Persona com menor Assertividade' } : undefined}
                    />
                  </div>

                  {/* Distribuição por Persona */}
                  <GroupedBarChart
                    titulo="Distribuição por Persona"
                    dados={dadosPersona.map(d => ({ label: d.persona, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    activeSeries={sharedActiveSeries}
                    onActiveSeriesChange={setSharedActiveSeries}
                  />

                  {/* Distribuição por Perfil */}
                  <GroupedBarChart
                    titulo="Distribuição por Perfil"
                    dados={dadosPerfil.map(d => ({ label: d.perfil, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    activeSeries={sharedActiveSeries}
                    onActiveSeriesChange={setSharedActiveSeries}
                  />

                  {/* Motivos de Qualificação */}
                  <GroupedBarChart
                    titulo="Motivos de Qualificação"
                    dados={motivosQualificacao.map(d => ({ label: d.motivo, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    activeSeries={sharedActiveSeries}
                    onActiveSeriesChange={setSharedActiveSeries}
                  />

                  {/* Motivos de Perda */}
                  <GroupedBarChart
                    titulo="Motivos de Perda"
                    dados={motivosPerda.map(d => ({ label: d.motivo, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    activeSeries={sharedActiveSeries}
                    onActiveSeriesChange={setSharedActiveSeries}
                  />

                  {/* Fases de Perda */}
                  <GroupedBarChart
                    titulo="Fases de Perda"
                    dados={fasesPerda.map(d => ({ label: d.motivo, geral: d.geral, mql: d.mql, sql: d.sql }))}
                    hideToggles
                  />
                </div>
              )}

              {/* ===================== INDICADORES COMPOSIÇÃO ===================== */}
              {paginaAtiva === 'composicao' && (
                <div className="space-y-6">
                  {/* Candidatos por Cidade */}
                  <DataTableExpansao
                    titulo={`Candidatos por Cidade — Aguardando Composição (${formatNumber(cidadesData.reduce((s, c) => s + c.total, 0))})`}
                    colunas={[
                      { key: 'cidade', header: 'Cidade', align: 'left', sortable: true },
                      { key: 'investidorTotal', header: 'Inv. Total', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_INVESTIDOR },
                      { key: 'investidorParcial', header: 'Inv. Parcial', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_INVESTIDOR },
                      { key: 'opVendaParcial', header: 'Op. Venda Parc.', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_OPERADOR },
                      { key: 'opVendaSem', header: 'Op. Venda S/', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_OPERADOR },
                      { key: 'opPosVendaParcial', header: 'Op. Vendas c/ Inv. Parc.', align: 'center', format: 'number', sortable: true, color: '#059669' },
                      { key: 'total', header: 'Total', align: 'center', format: 'number', sortable: true },
                      { key: 'percentual', header: '%', align: 'center', format: 'percent', sortable: true },
                    ]}
                    dados={cidadesData}
                    pageSize={10}
                    showSummary
                    highlightKey="temOportunidade"
                    exportFilename="candidatos-por-cidade"
                  />

                  {/* Tempo em Composição por Cidade */}
                  <DataTableExpansao
                    titulo="Tempo em Composição por Cidade (Aguardando Composição)"
                    headerGroups={[
                      { label: '', colSpan: 1 },
                      { label: 'INVESTIDORES', colSpan: 4, color: COLORS.FUNIL_INVESTIDOR },
                      { label: 'OPERADORES', colSpan: 4, color: COLORS.FUNIL_OPERADOR },
                      { label: '', colSpan: 1 },
                    ]}
                    colunas={[
                      { key: 'cidade', header: 'Cidade', align: 'left', sortable: true },
                      { key: 'invAte1m', header: '≤1M', align: 'center', format: 'number', sortable: true },
                      { key: 'inv1a3m', header: '1-3M', align: 'center', format: 'number', sortable: true },
                      { key: 'inv3a6m', header: '3-6M', align: 'center', format: 'number', sortable: true },
                      { key: 'invMais6m', header: '+6M', align: 'center', format: 'number', sortable: true },
                      { key: 'opAte1m', header: '≤1M', align: 'center', format: 'number', sortable: true },
                      { key: 'op1a3m', header: '1-3M', align: 'center', format: 'number', sortable: true },
                      { key: 'op3a6m', header: '3-6M', align: 'center', format: 'number', sortable: true },
                      { key: 'opMais6m', header: '+6M', align: 'center', format: 'number', sortable: true },
                      { key: 'total', header: 'Total', align: 'center', format: 'number', sortable: true },
                    ]}
                    dados={tempoComposicao}
                    pageSize={10}
                    showSummary
                    exportFilename="tempo-composicao-por-cidade"
                  />
                </div>
              )}

              {/* ===================== INDICADORES DE CAMPANHAS ===================== */}
              {paginaAtiva === 'campanhas' && (
                <div className="space-y-6">
                  {/* Campanhas */}
                  <DataTableExpansao
                    titulo="Campanhas"
                    colunas={[
                      { key: 'nome', header: 'Nome', align: 'left' },
                      { key: 'tratamento', header: 'Tratamento', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_TRATAMENTO },
                      { key: 'investidores', header: 'Investidores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_INVESTIDOR },
                      { key: 'operadores', header: 'Operadores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_OPERADOR },
                      { key: 'recupPerdidos', header: 'Recup. + Perdidos', align: 'center', format: 'number', sortable: true },
                    ]}
                    dados={anuncios}
                    pageSize={10}
                  />

                  {/* Conjuntos */}
                  <DataTableExpansao
                    titulo="Conjuntos"
                    colunas={[
                      { key: 'nome', header: 'Nome', align: 'left' },
                      { key: 'tratamento', header: 'Tratamento', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_TRATAMENTO },
                      { key: 'investidores', header: 'Investidores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_INVESTIDOR },
                      { key: 'operadores', header: 'Operadores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_OPERADOR },
                      { key: 'recupPerdidos', header: 'Recup. + Perdidos', align: 'center', format: 'number', sortable: true },
                    ]}
                    dados={conjuntos}
                    pageSize={10}
                  />

                  {/* Anúncios */}
                  <DataTableExpansao
                    titulo="Anúncios"
                    colunas={[
                      { key: 'nome', header: 'Nome', align: 'left' },
                      { key: 'tratamento', header: 'Tratamento', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_TRATAMENTO },
                      { key: 'investidores', header: 'Investidores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_INVESTIDOR },
                      { key: 'operadores', header: 'Operadores', align: 'center', format: 'number', sortable: true, color: COLORS.FUNIL_OPERADOR },
                      { key: 'recupPerdidos', header: 'Recup. + Perdidos', align: 'center', format: 'number', sortable: true },
                    ]}
                    dados={campanhas}
                    pageSize={10}
                  />
                </div>
              )}
            </>
          )}

          <Footer />
        </main>
      </div>
    </>
  );
}
