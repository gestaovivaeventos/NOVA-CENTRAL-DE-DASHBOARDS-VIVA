/**
 * Página Principal - Dashboard de Vendas
 * Replica exatamente a primeira página do dashboard original
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header, Sidebar, Loading, KPICard, IndicadoresOperacionais, Card, FunilHorizontal, Footer } from '@/modules/vendas/components';
import { FilterPanel } from '@/modules/vendas/components/filters';
import { 
  VVRVsMetaChart, 
  CumulativeYearChart, 
  PieChart, 
  ComparisonChart, 
  StackedBarChart, 
  TicketMedioChart,
  MultiYearLineChart,
  SimpleBarChart,
  MultiYearBarChart,
  FunnelBarChart,
  CaptacaoStackedBar,
  TaxaConversaoFunil,
  CORES_FASES_FUNIL,
  CORES_FASES_PERDAS,
  getCorFase,
} from '@/modules/vendas/components/charts';
import { DataTable, CaptacoesTable, DadosDetalhadosTable, IndicadoresOperacionaisTable } from '@/modules/vendas/components/tables';
import { MotivosPerdaDescarteTable } from '@/modules/vendas/components/MotivosPerdaDescarteTable';
import { DataTable as GenericDataTable } from '@/modules/vendas/components/DataTable';
import { useSalesData } from '@/modules/vendas/hooks/useSalesData';
import { useMetasData } from '@/modules/vendas/hooks/useMetasData';
import { useFundosData } from '@/modules/vendas/hooks/useFundosData';
import { useFunilData } from '@/modules/vendas/hooks/useFunilData';
import { extrairUnidades, filtrarDados, normalizarNomeUnidade } from '@/modules/vendas/utils/calculos';
import { getPeriodoDatas, identificarPeriodo } from '@/modules/vendas/utils/periodo';
import { META_CONFIG, PAGES } from '@/modules/vendas/config/app.config';
import type { FiltrosState, FiltrosOpcoes, PaginaAtiva } from '@/modules/vendas/types/filtros.types';
import { useAuth } from '@/context/AuthContext';
import { filterDataByPermission } from '@/utils/permissoes';

// Estado inicial dos filtros
const INITIAL_FILTERS: FiltrosState = {
  periodoSelecionado: 'estemes',
  dataInicio: '',
  dataFim: '',
  isMetaInterna: false,
  unidades: [],
  regionais: [],
  ufs: [],
  cidades: [],
  consultores: [],
  supervisores: [],
  formasPagamento: [],
  cursos: [],
  fundos: [],
  origemLead: [],
  segmentacaoLead: [],
  etiquetas: [],
  tipoAdesao: [],
  tipoServico: [],
  tipoCliente: [],
  consultorComercial: [],
  indicacaoAdesao: [],
  instituicao: [],
};

// Nomes dos meses abreviados
const MESES_NOMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);
  
  // Função para obter página da URL
  const getPaginaFromPath = (path: string): PaginaAtiva => {
    if (path.includes('/vendas/indicadores')) return 'indicadores';
    if (path.includes('/vendas/funil')) return 'funil';
    if (path.includes('/vendas/metas')) return 'metas';
    return 'metas';
  };
  
  // Estados - inicializa com base no router.asPath (funciona no SSR)
  const [paginaAtiva, setPaginaAtiva] = useState<PaginaAtiva>(() => getPaginaFromPath(router.asPath));
  
  // Estado da sidebar - inicializa com false para evitar erro de hidratação
  // O valor real do localStorage será carregado no useEffect
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [filtrosCarregados, setFiltrosCarregados] = useState(false);
  
  // Inicializar filtros com valores padrão (será carregado do localStorage após montagem)
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS);
  const [tipoGraficoVVR, setTipoGraficoVVR] = useState<'total' | 'vendas' | 'posvendas'>('total');
  const [tipoTabelaDados, setTipoTabelaDados] = useState<'total' | 'vendas' | 'posvendas'>('total');

  // Marcar que estamos no cliente e carregar estado da sidebar do localStorage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Carregar filtros do localStorage após montagem (evita erro de hidratação)
  useEffect(() => {
    // Carregar filtros
    try {
      const savedFilters = localStorage.getItem('dashboardFilters');
      if (savedFilters) {
        const parsed = JSON.parse(savedFilters);
        // Normalizar nomes de unidades salvos para corrigir inconsistências
        const unidadesNormalizadas = parsed.unidades 
          ? parsed.unidades.map((u: string) => normalizarNomeUnidade(u))
          : [];
        setFiltros(prev => ({
          ...prev,
          periodoSelecionado: parsed.periodoSelecionado || prev.periodoSelecionado,
          dataInicio: parsed.dataInicio || prev.dataInicio,
          dataFim: parsed.dataFim || prev.dataFim,
          isMetaInterna: parsed.isMetaInterna ?? prev.isMetaInterna,
          unidades: unidadesNormalizadas.length > 0 ? unidadesNormalizadas : prev.unidades,
        }));
      }
    } catch (e) {
      // Ignorar erros de parse
    }
    // Marcar que os filtros foram carregados
    setFiltrosCarregados(true);
  }, []);

  // Inicializar unidades do franqueado automaticamente (se não tiver filtro salvo)
  useEffect(() => {
    if (user && user.accessLevel === 0 && user.unitNames && user.unitNames.length > 0) {
      // Se é franqueado e não tem unidades selecionadas, selecionar suas unidades
      if (filtrosCarregados && filtros.unidades.length === 0) {
        setFiltros(prev => ({
          ...prev,
          unidades: user.unitNames || []
        }));
      }
    }
  }, [user, filtrosCarregados, filtros.unidades.length]);

  // Salvar filtros de período e unidades no localStorage quando mudarem
  // Só salvar APÓS o carregamento inicial para evitar sobrescrever com valores vazios
  useEffect(() => {
    if (typeof window !== 'undefined' && filtrosCarregados) {
      const filtersToSave = {
        periodoSelecionado: filtros.periodoSelecionado,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        isMetaInterna: filtros.isMetaInterna,
        unidades: filtros.unidades,
      };
      localStorage.setItem('dashboardFilters', JSON.stringify(filtersToSave));
    }
  }, [filtros.periodoSelecionado, filtros.dataInicio, filtros.dataFim, filtros.isMetaInterna, filtros.unidades, filtrosCarregados]);

  // Salvar estado da sidebar no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Sincronizar página com URL na montagem (para garantir após hidratação)
  useEffect(() => {
    const paginaCorreta = getPaginaFromPath(router.asPath);
    if (paginaAtiva !== paginaCorreta) {
      setPaginaAtiva(paginaCorreta);
    }
    if (router.asPath === '/vendas' || router.asPath === '/vendas/') {
      router.replace('/vendas/metas', undefined, { shallow: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler para mudança de página com atualização de URL
  const handlePaginaChange = useCallback((novaPagina: string) => {
    const pagina = novaPagina as PaginaAtiva;
    setPaginaAtiva(pagina);
    router.push(`/vendas/${pagina}`, undefined, { shallow: true });
  }, [router]);

  // Hooks de dados
  const { data: salesDataRaw, loading: loadingSales, error: errorSales } = useSalesData();
  const { data: metasDataRaw, loading: loadingMetas, error: errorMetas } = useMetasData();
  const { data: fundosDataRaw, loading: loadingFundos, error: errorFundos } = useFundosData();
  const { data: funilDataRaw, loading: loadingFunil, error: errorFunil } = useFunilData();

  // Filtrar dados por permissão do usuário
  // Franqueado (0): vê apenas dados da sua unidade
  // Franqueadora (1): vê todos os dados
  const salesData = useMemo(() => {
    if (!salesDataRaw || !user) return [];
    return filterDataByPermission(salesDataRaw, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [salesDataRaw, user]);

  const fundosData = useMemo(() => {
    if (!fundosDataRaw || !user) return [];
    return filterDataByPermission(fundosDataRaw, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [fundosDataRaw, user]);

  const funilData = useMemo(() => {
    if (!funilDataRaw || !user) return [];
    return filterDataByPermission(funilDataRaw, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [funilDataRaw, user]);

  // Filtrar metas por permissão (metas são um Map indexado por unidade-ano-mês)
  const metasData = useMemo(() => {
    if (!metasDataRaw || !user) return new Map();
    
    // Franqueadora vê tudo
    if (user.accessLevel === 1) {
      return metasDataRaw;
    }
    
    // Franqueado vê apenas metas de suas unidades
    if (user.accessLevel === 0 && user.unitNames && user.unitNames.length > 0) {
      const filteredMetas = new Map();
      const unitNamesLower = user.unitNames.map(u => u.toLowerCase().trim());
      
      metasDataRaw.forEach((value, key) => {
        // Chave está no formato: unidade-ano-mês
        const unidadeFromKey = key.split('-')[0]?.toLowerCase().trim();
        if (unitNamesLower.includes(unidadeFromKey)) {
          filteredMetas.set(key, value);
        }
      });
      
      return filteredMetas;
    }
    
    return new Map();
  }, [metasDataRaw, user]);

  // Loading global - mostra tela de carregamento enquanto dados principais não carregaram
  const hasAnySalesData = salesData.length > 0;
  const hasAnyMetasData = metasData.size > 0;
  const hasAnyFundosData = fundosData.length > 0;
  const hasAnyFunilData = funilData.length > 0;
  
  // Mostra loading global enquanto os dados de vendas estiverem carregando
  // (igual ao comportamento do PEX)
  const isLoading = (loadingSales && !hasAnySalesData) || authLoading;
  
  const hasError = errorSales || errorMetas || errorFundos;

  // Calcular período ANTES das opções de filtros (para usar na hierarquia)
  const periodo = useMemo(() => {
    if (filtros.periodoSelecionado === 'personalizado') {
      // Criar datas com horários corretos para comparação
      const start = filtros.dataInicio ? new Date(filtros.dataInicio) : new Date();
      const end = filtros.dataFim ? new Date(filtros.dataFim) : new Date();
      return {
        startDate: new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0),
        endDate: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999),
      };
    }
    return getPeriodoDatas(filtros.periodoSelecionado as any);
  }, [filtros.periodoSelecionado, filtros.dataInicio, filtros.dataFim]);

  // Função auxiliar para parsear datas do funil (formato DD/MM/YYYY)
  const parseFunilDateForFilter = useCallback((dateStr: string | undefined | null): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const str = dateStr.trim();
    const parts = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) {
      const [, day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  }, []);

  // Extrair opções de filtro dos dados
  // Hierarquia: Período + Unidade filtram as opções dos outros filtros
  const opcoesFiltros = useMemo<FiltrosOpcoes>(() => {
    if (!salesData || salesData.length === 0) {
      return {
        unidades: [],
        regionais: [],
        ufs: [],
        cidades: [],
        consultores: [],
        supervisores: [],
        formasPagamento: [],
        cursos: [],
        fundos: [],
        origensLead: [],
        segmentacoesLead: [],
        etiquetas: [],
        tiposAdesao: [],
        tiposServico: [],
        tiposCliente: [],
        consultoresComerciais: [],
        indicacoesAdesao: [],
        instituicoes: [],
      };
    }

    // Unidades sempre mostram todas as opções disponíveis (de vendas + funil)
    const unidadesVendas = extrairUnidades(salesData);
    
    // Extrair unidades do funil e incluir "Sem Unidade" se houver leads sem unidade
    // Aplicar normalização para corrigir nomes inconsistentes
    const unidadesFunil = funilData ? [...new Set(funilData.map(d => {
      const unidade = normalizarNomeUnidade(d.nm_unidade || '');
      return unidade === '' ? 'Sem Unidade' : unidade;
    }))].filter(Boolean) : [];
    
    // Combinar todas as unidades (vendas + funil) sem duplicatas
    const todasUnidades = [...new Set([...unidadesVendas, ...unidadesFunil])].sort((a, b) => {
      // "Sem Unidade" vai para o final da lista
      if (a === 'Sem Unidade') return 1;
      if (b === 'Sem Unidade') return -1;
      return a.localeCompare(b);
    });
    
    // Hierarquia de filtros: Período + Unidade
    const hasUnidadeFilter = filtros.unidades.length > 0;
    const startDate = periodo?.startDate;
    const endDate = periodo?.endDate;
    
    // Filtrar salesData por unidade e período
    const salesDataFiltrado = salesData.filter(d => {
      const unidadeMatch = !hasUnidadeFilter || filtros.unidades.includes(d.nm_unidade);
      const dataMatch = !startDate || !endDate || 
        (d.dt_cadastro_integrante instanceof Date && 
         d.dt_cadastro_integrante >= startDate && 
         d.dt_cadastro_integrante <= endDate);
      return unidadeMatch && dataMatch;
    });
    
    // Filtrar fundosData por unidade e período (usando dt_contrato)
    const fundosDataFiltrado = fundosData ? fundosData.filter(d => {
      const unidadeMatch = !hasUnidadeFilter || filtros.unidades.includes(d.nm_unidade);
      const dataMatch = !startDate || !endDate || 
        (d.dt_contrato instanceof Date && 
         d.dt_contrato >= startDate && 
         d.dt_contrato <= endDate);
      return unidadeMatch && dataMatch;
    }) : [];
    
    // Filtrar funilData por unidade e período (usando criado_em)
    const funilDataFiltrado = funilData ? funilData.filter(d => {
      const unidadeMatch = !hasUnidadeFilter || filtros.unidades.includes(d.nm_unidade);
      if (!unidadeMatch) return false;
      
      if (!startDate || !endDate) return true;
      
      const criadoDate = parseFunilDateForFilter(d.criado_em);
      if (!criadoDate) return true; // Se não conseguir parsear a data, inclui o item
      return criadoDate >= startDate && criadoDate <= endDate;
    }) : [];

    return {
      // Unidades sempre mostram todas (é o filtro principal junto com período)
      unidades: todasUnidades,
      regionais: [],
      ufs: [],
      cidades: [],
      // Consultores filtrados pela unidade e período
      consultores: [...new Set(funilDataFiltrado.map((d) => d.consultor).filter(Boolean))].sort(),
      supervisores: [],
      formasPagamento: [],
      // Cursos filtrados pela unidade e período
      cursos: [...new Set(salesDataFiltrado.map((d) => d.curso_fundo).filter(Boolean))].sort(),
      // Fundos filtrados pela unidade e período
      fundos: [...new Set(fundosDataFiltrado.map((d) => d.nm_fundo).filter(Boolean))].sort(),
      // Dados do Funil filtrados pela unidade e período
      origensLead: [...new Set(funilDataFiltrado.map((d) => d.origem_lead).filter(Boolean))].sort(),
      segmentacoesLead: [...new Set(funilDataFiltrado.map((d) => d.segmentacao_lead).filter(Boolean))].sort(),
      etiquetas: [...new Set(funilDataFiltrado.map((d) => d.etiquetas).filter(Boolean))].sort(),
      // Dados de Vendas/Adesões filtrados pela unidade e período
      tiposAdesao: [...new Set(salesDataFiltrado.map((d) => (d.venda_posvenda || '').trim().toUpperCase()).filter(Boolean))].sort(),
      tiposServico: [...new Set(salesDataFiltrado.map((d) => d.tp_servico).filter(Boolean))].sort(),
      tiposCliente: [...new Set(salesDataFiltrado.map((d) => d.tipo_cliente).filter(Boolean))].sort(),
      consultoresComerciais: [...new Set(salesDataFiltrado.map((d) => d.consultor_comercial).filter(Boolean))].sort(),
      indicacoesAdesao: [...new Set(salesDataFiltrado.map((d) => d.indicado_por).filter(Boolean))].sort(),
      instituicoes: [...new Set(salesDataFiltrado.map((d) => d.nm_instituicao).filter(Boolean))].sort(),
    };
  }, [salesData, fundosData, funilData, filtros.unidades, periodo, parseFunilDateForFilter]);

  // Limpar filtros secundários que não são mais válidos quando a unidade muda
  useEffect(() => {
    const filtrosParaLimpar: Partial<FiltrosState> = {};
    
    // Nota: NÃO validar unidades aqui porque elas devem ser persistidas mesmo que não apareçam temporariamente nas opções
    // As unidades são o filtro principal e devem ser mantidas entre páginas
    
    // Verificar cada filtro e limpar valores que não existem mais nas opções
    if (filtros.cursos.length > 0) {
      const cursosValidos = filtros.cursos.filter(c => opcoesFiltros.cursos.includes(c));
      if (cursosValidos.length !== filtros.cursos.length) {
        filtrosParaLimpar.cursos = cursosValidos;
      }
    }
    
    if (filtros.fundos.length > 0) {
      const fundosValidos = filtros.fundos.filter(f => opcoesFiltros.fundos.includes(f));
      if (fundosValidos.length !== filtros.fundos.length) {
        filtrosParaLimpar.fundos = fundosValidos;
      }
    }
    
    if (filtros.consultores.length > 0) {
      const consultoresValidos = filtros.consultores.filter(c => opcoesFiltros.consultores.includes(c));
      if (consultoresValidos.length !== filtros.consultores.length) {
        filtrosParaLimpar.consultores = consultoresValidos;
      }
    }
    
    if (filtros.tipoAdesao.length > 0) {
      const tiposValidos = filtros.tipoAdesao.filter(t => opcoesFiltros.tiposAdesao.includes(t));
      if (tiposValidos.length !== filtros.tipoAdesao.length) {
        filtrosParaLimpar.tipoAdesao = tiposValidos;
      }
    }
    
    if (filtros.tipoServico.length > 0) {
      const tiposValidos = filtros.tipoServico.filter(t => opcoesFiltros.tiposServico.includes(t));
      if (tiposValidos.length !== filtros.tipoServico.length) {
        filtrosParaLimpar.tipoServico = tiposValidos;
      }
    }
    
    if (filtros.tipoCliente.length > 0) {
      const tiposValidos = filtros.tipoCliente.filter(t => opcoesFiltros.tiposCliente.includes(t));
      if (tiposValidos.length !== filtros.tipoCliente.length) {
        filtrosParaLimpar.tipoCliente = tiposValidos;
      }
    }
    
    if (filtros.consultorComercial.length > 0) {
      const consultoresValidos = filtros.consultorComercial.filter(c => opcoesFiltros.consultoresComerciais.includes(c));
      if (consultoresValidos.length !== filtros.consultorComercial.length) {
        filtrosParaLimpar.consultorComercial = consultoresValidos;
      }
    }
    
    if (filtros.indicacaoAdesao.length > 0) {
      const indicacoesValidas = filtros.indicacaoAdesao.filter(i => opcoesFiltros.indicacoesAdesao.includes(i));
      if (indicacoesValidas.length !== filtros.indicacaoAdesao.length) {
        filtrosParaLimpar.indicacaoAdesao = indicacoesValidas;
      }
    }
    
    if (filtros.instituicao.length > 0) {
      const instituicoesValidas = filtros.instituicao.filter(i => opcoesFiltros.instituicoes.includes(i));
      if (instituicoesValidas.length !== filtros.instituicao.length) {
        filtrosParaLimpar.instituicao = instituicoesValidas;
      }
    }
    
    if (filtros.origemLead.length > 0) {
      const origensValidas = filtros.origemLead.filter(o => opcoesFiltros.origensLead.includes(o));
      if (origensValidas.length !== filtros.origemLead.length) {
        filtrosParaLimpar.origemLead = origensValidas;
      }
    }
    
    if (filtros.segmentacaoLead.length > 0) {
      const segmentacoesValidas = filtros.segmentacaoLead.filter(s => opcoesFiltros.segmentacoesLead.includes(s));
      if (segmentacoesValidas.length !== filtros.segmentacaoLead.length) {
        filtrosParaLimpar.segmentacaoLead = segmentacoesValidas;
      }
    }
    
    if (filtros.etiquetas.length > 0) {
      const etiquetasValidas = filtros.etiquetas.filter(e => opcoesFiltros.etiquetas.includes(e));
      if (etiquetasValidas.length !== filtros.etiquetas.length) {
        filtrosParaLimpar.etiquetas = etiquetasValidas;
      }
    }
    
    // Só atualiza se houver algo para limpar
    if (Object.keys(filtrosParaLimpar).length > 0) {
      setFiltros(prev => ({ ...prev, ...filtrosParaLimpar }));
    }
  }, [opcoesFiltros]); // Executa quando as opções de filtros mudam (que depende da unidade e período)

  // Ano vigente baseado no período
  const anoVigente = useMemo(() => {
    return periodo?.startDate?.getFullYear() || new Date().getFullYear();
  }, [periodo]);

  // Filtrar dados de vendas
  const dadosFiltrados = useMemo(() => {
    if (!salesData || salesData.length === 0 || !periodo?.startDate) return [];
    
    return filtrarDados(salesData, {
      // Filtros básicos
      dataInicio: periodo.startDate,
      dataFim: periodo.endDate,
      unidades: filtros.unidades,
      
      // Filtros da página de Metas
      cursos: filtros.cursos,
      
      // Filtros da página de Indicadores
      fundos: filtros.fundos,
      tipoAdesao: filtros.tipoAdesao,
      tipoServico: filtros.tipoServico,
      tipoCliente: filtros.tipoCliente,
      consultorComercial: filtros.consultorComercial,
      indicacaoAdesao: filtros.indicacaoAdesao,
      instituicao: filtros.instituicao,
    });
  }, [
    salesData, 
    periodo, 
    filtros.unidades, 
    filtros.cursos,
    filtros.fundos,
    filtros.tipoAdesao,
    filtros.tipoServico,
    filtros.tipoCliente,
    filtros.consultorComercial,
    filtros.indicacaoAdesao,
    filtros.instituicao,
  ]);

  // Calcular KPIs básicos
  const kpis = useMemo(() => {
    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    
    // Função para normalizar texto (mesma do original)
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Separar vendas e pós-vendas usando comparação exata como no original
    const vendas = dadosFiltrados.filter(d => normalizeText(d.venda_posvenda) === 'VENDA');
    const posVendas = dadosFiltrados.filter(d => normalizeText(d.venda_posvenda) === 'POS VENDA');
    
    // Calcular VVR (Valor Vendido Realizado)
    const vvrTotal = dadosFiltrados.reduce((sum, d) => sum + (d.vl_plano || 0), 0);
    const vvrVendas = vendas.reduce((sum, d) => sum + (d.vl_plano || 0), 0);
    const vvrPosVendas = posVendas.reduce((sum, d) => sum + (d.vl_plano || 0), 0);
    
    // Calcular QAV (Quantidade de Vendas)
    const qav = dadosFiltrados.length;
    
    // Calcular TK (Ticket Médio)
    const tk = qav > 0 ? vvrTotal / qav : 0;
    
    // Buscar metas - iterar por todos os meses do período selecionado
    let metaVVRTotal = 0;
    let metaVVRVendas = 0;
    let metaVVRPosVendas = 0;
    let metaQAV = 0;
    
    if (metasData && periodo?.startDate && periodo?.endDate) {
      // Se há filtro de unidades, usar as unidades selecionadas
      // Se não há filtro, considerar TODAS as unidades que têm meta (como no original)
      const hasUnidadeFilter = filtros.unidades.length > 0;
      const unidadesNorm = hasUnidadeFilter 
        ? filtros.unidades.map((u: string) => u.toString().toLowerCase().trim())
        : [];
      
      metasData.forEach((metaInfo, chave) => {
        const [unidadeMetaRaw, anoMeta, mesMeta] = chave.split('-');
        const unidadeMeta = unidadeMetaRaw?.toString().toLowerCase().trim() || '';
        
        if (!unidadeMeta) return;
        
        // Verificar unidade - só filtra se houver filtro de unidades ativo
        if (hasUnidadeFilter && !unidadesNorm.includes(unidadeMeta)) return;
        
        // Verificar se o mês/ano da meta está dentro do período (lógica igual ao original)
        if (anoMeta && mesMeta) {
          const metaDate = new Date(Number(anoMeta), Number(mesMeta) - 1, 1);
          const metaRangeStart = new Date(metaDate.getFullYear(), metaDate.getMonth(), 1, 0, 0, 0, 0);
          const metaRangeEnd = new Date(metaDate.getFullYear(), metaDate.getMonth() + 1, 0, 23, 59, 59, 999); // último dia do mês
          
          if (metaRangeStart <= periodo.endDate && metaRangeEnd >= periodo.startDate) {
            metaVVRVendas += metaInfo.meta_vvr_vendas || 0;
            metaVVRPosVendas += metaInfo.meta_vvr_posvendas || 0;
            metaQAV += metaInfo.meta_adesoes || 0;
          }
        }
      });
      
      // Meta total é a soma de vendas + pós-vendas (como no original)
      metaVVRTotal = metaVVRVendas + metaVVRPosVendas;
    }
    
    return {
      vvrTotal,
      vvrVendas,
      vvrPosVendas,
      qav,
      tk,
      metaVVRTotal: metaVVRTotal * multiplicador,
      metaVVRVendas: metaVVRVendas * multiplicador,
      metaVVRPosVendas: metaVVRPosVendas * multiplicador,
      metaQAV: metaQAV * multiplicador,
      metaTK: tk * 1.1 * multiplicador,
    };
  }, [dadosFiltrados, metasData, filtros.isMetaInterna, filtros.unidades, opcoesFiltros.unidades, periodo]);

  // KPIs do ano anterior (mesmo período)
  const kpisAnoAnterior = useMemo(() => {
    if (!salesData || salesData.length === 0 || !periodo?.startDate) {
      return { vvrTotal: 0, vvrVendas: 0, vvrPosVendas: 0, metaVVRTotal: 0, metaVVRVendas: 0, metaVVRPosVendas: 0 };
    }

    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    
    // Período do ano anterior - com horários corretos (igual ao original)
    const startDateAnoAnterior = new Date(
      periodo.startDate.getFullYear() - 1,
      periodo.startDate.getMonth(),
      periodo.startDate.getDate(),
      0, 0, 0, 0  // 00:00:00.000
    );
    const endDateAnoAnterior = new Date(
      periodo.endDate.getFullYear() - 1,
      periodo.endDate.getMonth(),
      periodo.endDate.getDate(),
      23, 59, 59, 999  // 23:59:59.999
    );

    // Filtrar dados do ano anterior
    const dadosAnoAnterior = filtrarDados(salesData, {
      dataInicio: startDateAnoAnterior,
      dataFim: endDateAnoAnterior,
      unidades: filtros.unidades,
      cursos: filtros.cursos,
      fundos: filtros.fundos,
      tipoAdesao: filtros.tipoAdesao,
      tipoServico: filtros.tipoServico,
      tipoCliente: filtros.tipoCliente,
      consultorComercial: filtros.consultorComercial,
      indicacaoAdesao: filtros.indicacaoAdesao,
      instituicao: filtros.instituicao,
    });

    // Função para normalizar texto (mesma do original)
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Separar vendas e pós-vendas usando comparação exata como no original
    const vendas = dadosAnoAnterior.filter(d => normalizeText(d.venda_posvenda) === 'VENDA');
    const posVendas = dadosAnoAnterior.filter(d => normalizeText(d.venda_posvenda) === 'POS VENDA');

    const vvrTotal = dadosAnoAnterior.reduce((sum, d) => sum + (d.vl_plano || 0), 0);
    const vvrVendas = vendas.reduce((sum, d) => sum + (d.vl_plano || 0), 0);
    const vvrPosVendas = posVendas.reduce((sum, d) => sum + (d.vl_plano || 0), 0);

    // Buscar metas do ano anterior - iterar por todos os meses do período
    let metaVVRTotal = 0;
    let metaVVRVendas = 0;
    let metaVVRPosVendas = 0;

    if (metasData) {
      // Se há filtro de unidades, usar as unidades selecionadas
      // Se não há filtro, considerar TODAS as unidades que têm meta (como no original)
      const hasUnidadeFilter = filtros.unidades.length > 0;
      const unidadesNorm = hasUnidadeFilter 
        ? filtros.unidades.map((u: string) => u.toString().toLowerCase().trim())
        : [];
      
      metasData.forEach((metaInfo, chave) => {
        const [unidadeMetaRaw, anoMeta, mesMeta] = chave.split('-');
        const unidadeMeta = unidadeMetaRaw?.toString().toLowerCase().trim() || '';
        
        if (!unidadeMeta) return;
        
        // Verificar unidade - só filtra se houver filtro de unidades ativo
        if (hasUnidadeFilter && !unidadesNorm.includes(unidadeMeta)) return;
        
        // Verificar se o mês/ano da meta está dentro do período do ano anterior (lógica igual ao original)
        if (anoMeta && mesMeta) {
          const metaDate = new Date(Number(anoMeta), Number(mesMeta) - 1, 1);
          const metaRangeStart = new Date(metaDate.getFullYear(), metaDate.getMonth(), 1, 0, 0, 0, 0);
          const metaRangeEnd = new Date(metaDate.getFullYear(), metaDate.getMonth() + 1, 0, 23, 59, 59, 999); // último dia do mês
          
          if (metaRangeStart <= endDateAnoAnterior && metaRangeEnd >= startDateAnoAnterior) {
            metaVVRVendas += metaInfo.meta_vvr_vendas || 0;
            metaVVRPosVendas += metaInfo.meta_vvr_posvendas || 0;
          }
        }
      });
      
      // Meta total é a soma de vendas + pós-vendas (como no original)
      metaVVRTotal = metaVVRVendas + metaVVRPosVendas;
    }

    return {
      vvrTotal,
      vvrVendas,
      vvrPosVendas,
      metaVVRTotal: metaVVRTotal * multiplicador,
      metaVVRVendas: metaVVRVendas * multiplicador,
      metaVVRPosVendas: metaVVRPosVendas * multiplicador,
    };
  }, [
    salesData, 
    periodo, 
    filtros.unidades, 
    filtros.cursos,
    filtros.fundos,
    filtros.tipoAdesao,
    filtros.tipoServico,
    filtros.tipoCliente,
    filtros.consultorComercial,
    filtros.indicacaoAdesao,
    filtros.instituicao,
    filtros.isMetaInterna, 
    metasData, 
    opcoesFiltros.unidades
  ]);

  // Função auxiliar para parsear datas do funil (formato DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS)
  const parseFunilDate = useCallback((dateStr: string | undefined | null): Date | null => {
    if (!dateStr) return null;
    
    const str = String(dateStr).trim();
    if (!str) return null;
    
    // Tentar formato brasileiro DD/MM/YYYY (com ou sem hora)
    const parts = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) {
      const [, day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Tentar formato ISO ou outro
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
      return dt;
    }
    
    return null;
  }, []);

  // Indicadores Operacionais (Leads, Reuniões, Contratos, Adesão)
  const indicadoresOperacionais = useMemo(() => {
    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    // Se nenhuma unidade selecionada, aceitar todos os registros
    const hasUnidadeFilter = filtros.unidades.length > 0;
    
    // === LEADS ===
    // Contar leads do funil no período, filtrado por unidade
    const leadsCount = (funilData || []).filter(item => {
      // Verificar unidade - se não há filtro, aceitar todos
      if (hasUnidadeFilter && !filtros.unidades.includes(item.nm_unidade)) {
        return false;
      }
      
      // Verificar se tem título
      if (!item.titulo || item.titulo.trim() === '') return false;
      
      // Parsear data de criação usando função robusta
      const criadoDate = parseFunilDate(item.criado_em);
      
      // Verificar período
      if (!criadoDate) return false;
      if (!periodo?.startDate || !periodo?.endDate) return false;
      
      return criadoDate >= periodo.startDate && criadoDate <= periodo.endDate;
    }).length;
    
    // === REUNIÕES ===
    // Usar diagnostico_realizado ou proposta_enviada do funil
    const reunioesCount = (funilData || []).reduce((acc, item) => {
      // Verificar unidade - se não há filtro, aceitar todos
      if (hasUnidadeFilter && !filtros.unidades.includes(item.nm_unidade)) {
        return acc;
      }
      
      // Usar diagnostico_realizado ou proposta_enviada
      const dateStr = (item.diagnostico_realizado && item.diagnostico_realizado.trim() !== '') 
        ? item.diagnostico_realizado 
        : (item.proposta_enviada && item.proposta_enviada.trim() !== '') 
          ? item.proposta_enviada 
          : null;
      
      if (!dateStr) return acc;
      
      // Parsear data usando função robusta
      const parsedDate = parseFunilDate(dateStr);
      
      if (!parsedDate) return acc;
      if (!periodo?.startDate || !periodo?.endDate) return acc;
      
      if (parsedDate >= periodo.startDate && parsedDate <= periodo.endDate) {
        return acc + 1;
      }
      return acc;
    }, 0);
    
    // === CONTRATOS (MV) ===
    // Contar id_fundo em fundosData dentro do período
    const contratosCount = (fundosData || []).filter(d => {
      // Verificar unidade - se não há filtro, aceitar todos
      if (hasUnidadeFilter && !filtros.unidades.includes(d.nm_unidade)) {
        return false;
      }
      
      // Verificar se tem id_fundo
      if (!d.id_fundo || d.id_fundo.toString().trim() === '') return false;
      
      // Verificar período pela dt_contrato
      if (!d.dt_contrato || !(d.dt_contrato instanceof Date)) return false;
      if (!periodo?.startDate || !periodo?.endDate) return false;
      
      return d.dt_contrato >= periodo.startDate && d.dt_contrato <= periodo.endDate;
    }).length;
    
    // === ADESÕES ===
    // Contar adesões com codigo_integrante válido
    const adesoesCount = dadosFiltrados.filter(d => 
      d.codigo_integrante && d.codigo_integrante.toString().trim() !== ''
    ).length;
    
    // === CALCULAR METAS ===
    let metaLeads = 0;
    let metaReunioes = 0;
    let metaContratos = 0;
    let metaAdesoes = 0;
    
    if (metasData && metasData.size > 0 && periodo?.startDate && periodo?.endDate) {
      // Se há filtro de unidades, normalizar para comparação
      const unidadesNorm = hasUnidadeFilter 
        ? filtros.unidades.map(u => u?.toString().toLowerCase().trim() || '')
        : [];
      
      metasData.forEach((metaInfo, chave) => {
        const [unidadeMetaRaw, anoMeta, mesMeta] = chave.split('-');
        const unidadeMeta = unidadeMetaRaw?.toString().toLowerCase().trim() || '';
        
        if (!unidadeMeta) return;
        
        // Verificar unidade - se não há filtro, aceitar todas
        if (hasUnidadeFilter && !unidadesNorm.includes(unidadeMeta)) return;
        
        // Verificar se o mês/ano da meta está dentro do período
        if (anoMeta && mesMeta) {
          const metaRangeStart = new Date(Number(anoMeta), Number(mesMeta) - 1, 1);
          const metaRangeEnd = new Date(Number(anoMeta), Number(mesMeta), 1);
          
          if (metaRangeStart <= periodo.endDate && metaRangeEnd > periodo.startDate) {
            metaLeads += metaInfo.meta_leads || 0;
            metaReunioes += metaInfo.meta_reunioes || 0;
            metaContratos += metaInfo.meta_contratos || 0;
            metaAdesoes += metaInfo.meta_adesoes || 0;
          }
        }
      });
    }

    return {
      leads: { valor: leadsCount, meta: metaLeads * multiplicador },
      reunioes: { valor: reunioesCount, meta: metaReunioes * multiplicador },
      contratos: { valor: contratosCount, meta: metaContratos * multiplicador },
      adesao: { valor: adesoesCount, meta: metaAdesoes * multiplicador },
    };
  }, [dadosFiltrados, funilData, fundosData, filtros.unidades, filtros.isMetaInterna, metasData, periodo, parseFunilDate]);

  // Dados para gráfico VVR vs Meta por Mês
  const dadosGraficoVVRMes = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    
    // Criar mapa para todos os 12 meses do ano vigente
    const chartDataMap = new Map<string, {
      realizado_vendas: number;
      realizado_posvendas: number;
      meta_vendas: number;
      meta_posvendas: number;
      meta_total: number;
    }>();

    // Inicializar todos os meses
    for (let i = 1; i <= 12; i++) {
      const periodo = `${anoVigente}-${String(i).padStart(2, '0')}`;
      chartDataMap.set(periodo, {
        realizado_vendas: 0,
        realizado_posvendas: 0,
        meta_vendas: 0,
        meta_posvendas: 0,
        meta_total: 0,
      });
    }

    // Filtrar dados do ano vigente
    const dadosAnoVigente = salesData.filter(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return false;
      return dt.getFullYear() === anoVigente;
    });

    // Preencher dados de realizado
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    
    dadosAnoVigente.forEach(d => {
      // Filtrar por unidades se necessário
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return;

      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const periodoKey = `${anoVigente}-${month}`;
      
      if (chartDataMap.has(periodoKey)) {
        const entry = chartDataMap.get(periodoKey)!;
        const venda = normalizeText(d.venda_posvenda);
        
        if (venda === 'VENDA') {
          entry.realizado_vendas += d.vl_plano || 0;
        } else if (venda === 'POS VENDA') {
          entry.realizado_posvendas += d.vl_plano || 0;
        }
      }
    });

    // Preencher metas
    if (metasData) {
      metasData.forEach((metaInfo, key) => {
        const [unidade, ano, mes] = key.split('-');
        const periodoKey = `${ano}-${mes}`;
        
        if (String(ano) === String(anoVigente) && chartDataMap.has(periodoKey)) {
          if (unidadesAtivas.length === 0 || unidadesAtivas.includes(unidade)) {
            const entry = chartDataMap.get(periodoKey)!;
            entry.meta_vendas += metaInfo.meta_vvr_vendas || 0;
            entry.meta_posvendas += metaInfo.meta_vvr_posvendas || 0;
            entry.meta_total += metaInfo.meta_vvr_total || 0;
          }
        }
      });
    }

    // Converter para array de dados
    const result: { mes: string; realizado: number; meta: number }[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const periodoKey = `${anoVigente}-${String(i).padStart(2, '0')}`;
      const data = chartDataMap.get(periodoKey)!;
      
      let realizado: number;
      let meta: number;
      
      if (tipoGraficoVVR === 'vendas') {
        realizado = data.realizado_vendas;
        meta = data.meta_vendas * multiplicador;
      } else if (tipoGraficoVVR === 'posvendas') {
        realizado = data.realizado_posvendas;
        meta = data.meta_posvendas * multiplicador;
      } else {
        realizado = data.realizado_vendas + data.realizado_posvendas;
        meta = data.meta_total * multiplicador;
      }
      
      result.push({
        mes: MESES_NOMES[i - 1],
        realizado,
        meta,
      });
    }
    
    return result;
  }, [salesData, metasData, anoVigente, tipoGraficoVVR, filtros.isMetaInterna, filtros.unidades, opcoesFiltros.unidades]);

  // Dados para gráfico VVR Acumulado Anual
  const dadosGraficoAcumulado = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    
    // Filtrar por unidades
    const dadosFiltradosUnidades = unidadesAtivas.length > 0
      ? salesData.filter(d => unidadesAtivas.includes(d.nm_unidade))
      : salesData;

    // Agrupar por ano e mês
    const salesByYearMonth: Record<number, number[]> = {};
    const uniqueYears = [...new Set(dadosFiltradosUnidades.map(d => {
      const dt = d.dt_cadastro_integrante;
      return dt instanceof Date ? dt.getFullYear() : null;
    }).filter(Boolean))] as number[];

    // Inicializar anos
    uniqueYears.forEach(year => {
      salesByYearMonth[year] = Array(12).fill(0);
    });

    // Preencher dados
    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = dt.getFullYear();
      const month = dt.getMonth();
      
      if (salesByYearMonth[year]) {
        salesByYearMonth[year][month] += d.vl_plano || 0;
      }
    });

    // Calcular valores acumulados
    const result: { ano: number; valores: number[] }[] = [];
    
    uniqueYears.sort((a, b) => a - b).forEach(year => {
      const valores = salesByYearMonth[year];
      const acumulado: number[] = [];
      let soma = 0;
      
      for (let i = 0; i < 12; i++) {
        soma += valores[i];
        acumulado.push(soma);
      }
      
      result.push({ ano: year, valores: acumulado });
    });

    return result;
  }, [salesData, filtros.unidades, opcoesFiltros.unidades]);

  // Label do período para a tabela
  const periodoLabelTabela = useMemo(() => {
    if (!periodo) return '';
    const formatMes = (date: Date) => {
      const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return `${meses[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;
    };
    return `${formatMes(periodo.startDate)} - ${formatMes(periodo.endDate)}`;
  }, [periodo]);

  // Dados para ranking de unidades (por tipo: total, vendas, posvendas)
  const rankingUnidades = useMemo(() => {
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const porUnidade: Record<string, { valorRealizado: number; valorMeta: number }> = {};
    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    
    // PRIMEIRO: Adicionar todas as unidades que têm meta no período
    if (metasData && periodo?.startDate && periodo?.endDate) {
      const startDate = periodo.startDate;
      const endDate = periodo.endDate;
      
      metasData.forEach((meta, key) => {
        const [unidade, anoStr, mesStr] = key.split('-');
        const metaDate = new Date(parseInt(anoStr), parseInt(mesStr) - 1, 1);
        
        // Verificar se a meta está no período selecionado
        if (metaDate >= startDate && metaDate <= endDate) {
          // Verificar filtro de unidades
          if (filtros.unidades.length > 0 && !filtros.unidades.includes(unidade)) {
            return;
          }
          
          if (!porUnidade[unidade]) {
            porUnidade[unidade] = { valorRealizado: 0, valorMeta: 0 };
          }
          
          // Usar meta específica por tipo
          let metaValor = 0;
          if (tipoTabelaDados === 'vendas') {
            metaValor = meta.meta_vvr_vendas || 0;
          } else if (tipoTabelaDados === 'posvendas') {
            metaValor = meta.meta_vvr_posvendas || 0;
          } else {
            metaValor = meta.meta_vvr_total || 0;
          }
          porUnidade[unidade].valorMeta += metaValor * multiplicador;
        }
      });
    }
    
    // SEGUNDO: Adicionar os valores realizados das vendas
    dadosFiltrados.forEach((item) => {
      const unidade = item.nm_unidade || 'Não informado';
      const tipoVenda = normalizeText(item.venda_posvenda);
      
      // Filtrar por tipo selecionado
      if (tipoTabelaDados === 'vendas' && tipoVenda !== 'VENDA') return;
      if (tipoTabelaDados === 'posvendas' && tipoVenda !== 'POS VENDA') return;
      
      if (!porUnidade[unidade]) {
        porUnidade[unidade] = { valorRealizado: 0, valorMeta: 0 };
      }
      porUnidade[unidade].valorRealizado += item.vl_plano || 0;
    });

    // Se não há dados, retornar vazio
    if (Object.keys(porUnidade).length === 0) return [];

    return Object.entries(porUnidade)
      .map(([nome, dados]) => ({
        nome,
        periodo: periodoLabelTabela,
        valorRealizado: dados.valorRealizado,
        valorMeta: dados.valorMeta,
        percentual: dados.valorMeta > 0 ? dados.valorRealizado / dados.valorMeta : 0,
      }))
      .sort((a, b) => b.percentual - a.percentual)
      .map((item, index) => ({ ...item, posicao: index + 1 }));
  }, [dadosFiltrados, metasData, filtros.isMetaInterna, filtros.unidades, periodo, tipoTabelaDados, periodoLabelTabela]);

  // Dados para tabela de Atingimento Indicadores Operacionais (por unidade)
  const indicadoresOperacionaisPorUnidade = useMemo(() => {
    if (!periodo) return [];

    const multiplicador = filtros.isMetaInterna ? META_CONFIG.META_INTERNA_MULTIPLICADOR : 1;
    const startDate = periodo.startDate;
    const endDate = periodo.endDate;

    // Obter lista de unidades dos dados filtrados, funil e fundos
    const unidadesSet = new Set<string>();
    dadosFiltrados.forEach(d => {
      if (d.nm_unidade) unidadesSet.add(d.nm_unidade);
    });
    
    if (funilData) {
      funilData.forEach(d => {
        if (d.nm_unidade) unidadesSet.add(d.nm_unidade);
      });
    }
    
    if (fundosData) {
      fundosData.forEach(d => {
        if (d.nm_unidade) unidadesSet.add(d.nm_unidade);
      });
    }

    const unidades = Array.from(unidadesSet).sort();

    return unidades.map(unidade => {
      // === LEADS ===
      // Contar do funil para essa unidade no período, com título válido
      const leadsResultado = (funilData || []).filter(d => {
        if (d.nm_unidade !== unidade) return false;
        if (!d.titulo || d.titulo.trim() === '') return false;
        
        const dateObj = parseFunilDate(d.criado_em);
        if (!dateObj) return false;
        return dateObj >= startDate && dateObj <= endDate;
      }).length;

      // Buscar meta de leads para essa unidade no período
      let leadsMeta = 0;
      if (metasData) {
        metasData.forEach((metaInfo, chave) => {
          const [u, ano, mes] = chave.split('-');
          if (u !== unidade) return;
          if (ano && mes) {
            const metaRangeStart = new Date(Number(ano), Number(mes) - 1, 1);
            const metaRangeEnd = new Date(Number(ano), Number(mes), 1);
            if (metaRangeStart <= endDate && metaRangeEnd > startDate) {
              leadsMeta += (metaInfo.meta_leads || 0) * multiplicador;
            }
          }
        });
      }

      // === REUNIÕES ===
      // Usar diagnostico_realizado ou proposta_enviada como data da reunião
      const reunioesResultado = (funilData || []).reduce((acc, d) => {
        if (d.nm_unidade !== unidade) return acc;
        
        // Usar diagnostico_realizado ou proposta_enviada
        const dateStr = (d.diagnostico_realizado && d.diagnostico_realizado.trim() !== '') 
          ? d.diagnostico_realizado 
          : (d.proposta_enviada && d.proposta_enviada.trim() !== '') 
            ? d.proposta_enviada 
            : null;
        
        if (!dateStr) return acc;
        
        const parsedDate = parseFunilDate(dateStr);
        if (!parsedDate) return acc;
        if (parsedDate >= startDate && parsedDate <= endDate) return acc + 1;
        return acc;
      }, 0);

      let reunioesMeta = 0;
      if (metasData) {
        metasData.forEach((metaInfo, chave) => {
          const [u, ano, mes] = chave.split('-');
          if (u !== unidade) return;
          if (ano && mes) {
            const metaRangeStart = new Date(Number(ano), Number(mes) - 1, 1);
            const metaRangeEnd = new Date(Number(ano), Number(mes), 1);
            if (metaRangeStart <= endDate && metaRangeEnd > startDate) {
              reunioesMeta += (metaInfo.meta_reunioes || 0) * multiplicador;
            }
          }
        });
      }

      // === CONTRATOS (MV) ===
      // Contar id_fundo em fundosData para essa unidade no período
      const contratosResultado = (fundosData || []).filter(d => {
        if (d.nm_unidade !== unidade) return false;
        if (!d.id_fundo || d.id_fundo.toString().trim() === '') return false;
        if (!d.dt_contrato || !(d.dt_contrato instanceof Date)) return false;
        return d.dt_contrato >= startDate && d.dt_contrato <= endDate;
      }).length;

      let contratosMeta = 0;
      if (metasData) {
        metasData.forEach((metaInfo, chave) => {
          const [u, ano, mes] = chave.split('-');
          if (u !== unidade) return;
          if (ano && mes) {
            const metaRangeStart = new Date(Number(ano), Number(mes) - 1, 1);
            const metaRangeEnd = new Date(Number(ano), Number(mes), 1);
            if (metaRangeStart <= endDate && metaRangeEnd > startDate) {
              contratosMeta += (metaInfo.meta_contratos || 0) * multiplicador;
            }
          }
        });
      }

      // === ADESÕES ===
      // Contar código de integrante único para essa unidade
      const adesoesResultado = dadosFiltrados.filter(d => 
        d.nm_unidade === unidade && 
        d.codigo_integrante && 
        String(d.codigo_integrante).trim() !== ''
      ).length;

      let adesoesMeta = 0;
      if (metasData) {
        metasData.forEach((metaInfo, chave) => {
          const [u, ano, mes] = chave.split('-');
          if (u !== unidade) return;
          if (ano && mes) {
            const metaRangeStart = new Date(Number(ano), Number(mes) - 1, 1);
            const metaRangeEnd = new Date(Number(ano), Number(mes), 1);
            if (metaRangeStart <= endDate && metaRangeEnd > startDate) {
              adesoesMeta += (metaInfo.meta_adesoes || 0) * multiplicador;
            }
          }
        });
      }

      return {
        unidade,
        leadsPercent: leadsMeta > 0 ? leadsResultado / leadsMeta : 0,
        reunioesPercent: reunioesMeta > 0 ? reunioesResultado / reunioesMeta : 0,
        contratosPercent: contratosMeta > 0 ? contratosResultado / contratosMeta : 0,
        adesoesPercent: adesoesMeta > 0 ? adesoesResultado / adesoesMeta : 0,
      };
    });
  }, [dadosFiltrados, funilData, fundosData, metasData, periodo, filtros.isMetaInterna, parseFunilDate]);

  // ========== DADOS PARA INDICADORES SECUNDÁRIOS ==========
  
  // Estado para ano selecionado nos gráficos
  const [anoSelecionadoVVR, setAnoSelecionadoVVR] = useState<number | null>(null);
  const [anoSelecionadoTicket, setAnoSelecionadoTicket] = useState<number | null>(null);

  // Dados para gráfico VVR Total Anual (barras empilhadas horizontais)
  const dadosVVRAnual = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    // Filtrar por unidades e cursos
    const dadosFiltradosUnidades = salesData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar por ano
    const salesByYear: Record<string, { vendas: number; posVendas: number }> = {};
    
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = String(dt.getFullYear());
      if (!salesByYear[year]) {
        salesByYear[year] = { vendas: 0, posVendas: 0 };
      }
      
      const tipo = normalizeText(d.venda_posvenda);
      if (tipo === 'VENDA') {
        salesByYear[year].vendas += d.vl_plano || 0;
      } else if (tipo === 'POS VENDA') {
        salesByYear[year].posVendas += d.vl_plano || 0;
      }
    });

    // Filtrar apenas anos a partir de 2019 e ordenar
    const years = Object.keys(salesByYear)
      .filter(year => Number(year) >= 2019)
      .sort((a, b) => Number(a) - Number(b));
    
    return years.map(year => ({
      label: year,
      vendas: salesByYear[year].vendas,
      posVendas: salesByYear[year].posVendas,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades]);

  // Dados para gráfico VVR Total Mensal (barras empilhadas verticais)
  const dadosVVRMensal = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    const anoParaExibir = anoSelecionadoVVR || anoVigente;
    
    // Filtrar por unidades, cursos e ano
    const dadosFiltradosUnidades = salesData.filter(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return false;
      if (dt.getFullYear() !== anoParaExibir) return false;
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Inicializar 12 meses
    const salesByMonth: { vendas: number; posVendas: number }[] = Array(12).fill(null).map(() => ({ vendas: 0, posVendas: 0 }));
    
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const month = dt.getMonth();
      const tipo = normalizeText(d.venda_posvenda);
      
      if (tipo === 'VENDA') {
        salesByMonth[month].vendas += d.vl_plano || 0;
      } else if (tipo === 'POS VENDA') {
        salesByMonth[month].posVendas += d.vl_plano || 0;
      }
    });

    return MESES_NOMES.map((mes, index) => ({
      label: mes,
      vendas: salesByMonth[index].vendas,
      posVendas: salesByMonth[index].posVendas,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anoSelecionadoVVR, anoVigente]);

  // Dados para gráfico Ticket Médio Anual (barras horizontais)
  const dadosTicketAnual = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    // Filtrar por unidades e cursos
    const dadosFiltradosUnidades = salesData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar por ano
    const ticketByYear: Record<string, { totalValor: number; totalAdesoes: number }> = {};

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = String(dt.getFullYear());
      if (!ticketByYear[year]) {
        ticketByYear[year] = { totalValor: 0, totalAdesoes: 0 };
      }
      
      ticketByYear[year].totalValor += d.vl_plano || 0;
      ticketByYear[year].totalAdesoes += 1;
    });

    const years = Object.keys(ticketByYear)
      .filter(year => Number(year) >= 2019)
      .sort((a, b) => Number(a) - Number(b));
    
    return years.map(year => ({
      label: year,
      ticketMedio: ticketByYear[year].totalAdesoes > 0 
        ? ticketByYear[year].totalValor / ticketByYear[year].totalAdesoes 
        : 0,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades]);

  // Dados para gráfico Ticket Médio Mensal (barras verticais)
  const dadosTicketMensal = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    const anoParaExibir = anoSelecionadoTicket || anoVigente;
    
    // Filtrar por unidades, cursos e ano
    const dadosFiltradosUnidades = salesData.filter(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return false;
      if (dt.getFullYear() !== anoParaExibir) return false;
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Inicializar 12 meses
    const ticketByMonth: { totalValor: number; totalAdesoes: number }[] = Array(12).fill(null).map(() => ({ totalValor: 0, totalAdesoes: 0 }));

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const month = dt.getMonth();
      ticketByMonth[month].totalValor += d.vl_plano || 0;
      ticketByMonth[month].totalAdesoes += 1;
    });

    return MESES_NOMES.map((mes, index) => ({
      label: mes,
      ticketMedio: ticketByMonth[index].totalAdesoes > 0 
        ? ticketByMonth[index].totalValor / ticketByMonth[index].totalAdesoes 
        : 0,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anoSelecionadoTicket, anoVigente]);

  // Estado para anos ativos nos gráficos de comparativo
  const [anosAtivosVVR, setAnosAtivosVVR] = useState<number[]>([]);
  const [anosAtivosAdesoes, setAnosAtivosAdesoes] = useState<number[]>([]);

  // Toggle de anos para gráficos de comparativo
  const toggleAnoVVR = useCallback((ano: number) => {
    setAnosAtivosVVR(prev => 
      prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano]
    );
  }, []);

  const toggleAnoAdesoes = useCallback((ano: number) => {
    setAnosAtivosAdesoes(prev => 
      prev.includes(ano) ? prev.filter(a => a !== ano) : [...prev, ano]
    );
  }, []);

  // Dados para gráfico Comparativo de VVR Mensal (linhas por ano)
  const dadosComparativoVVR = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    const dadosFiltradosUnidades = salesData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar por ano e mês
    const salesByYearMonth: Record<number, number[]> = {};

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = dt.getFullYear();
      const month = dt.getMonth();
      
      if (!salesByYearMonth[year]) {
        salesByYearMonth[year] = Array(12).fill(0);
      }
      salesByYearMonth[year][month] += d.vl_plano || 0;
    });

    const years = Object.keys(salesByYearMonth).map(Number).sort();
    
    // Inicializar anos ativos se vazio (últimos 2 anos)
    if (anosAtivosVVR.length === 0 && years.length > 0) {
      const ultimosAnos = years.slice(-2);
      setAnosAtivosVVR(ultimosAnos);
    }

    return years.map(year => ({
      year,
      monthlyData: salesByYearMonth[year],
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anosAtivosVVR.length]);

  // Anos ativos calculados
  const anosAtivosVVRComputed = useMemo(() => {
    if (anosAtivosVVR.length > 0) return anosAtivosVVR;
    const years = dadosComparativoVVR.map(d => d.year);
    return years.slice(-2);
  }, [anosAtivosVVR, dadosComparativoVVR]);

  // Dados para gráfico Contratos Realizados Anual (barras horizontais)
  const dadosContratosAnual = useMemo(() => {
    if (!fundosData || fundosData.length === 0) return { labels: [], values: [] };

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    const dadosFiltrados = fundosData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar contratos por ano
    const contractsByYear: Record<string, number> = {};

    dadosFiltrados.forEach(d => {
      const dt = d.dt_contrato;
      if (!(dt instanceof Date)) return;
      
      const year = String(dt.getFullYear());
      if (!contractsByYear[year]) {
        contractsByYear[year] = 0;
      }
      contractsByYear[year] += 1;
    });

    const years = Object.keys(contractsByYear).sort().filter(y => parseInt(y) >= 2019);
    
    return {
      labels: years,
      values: years.map(y => contractsByYear[y] || 0),
    };
  }, [fundosData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades]);

  // Estado para ano selecionado nos contratos
  const [anoSelecionadoContratos, setAnoSelecionadoContratos] = useState<number | null>(null);

  // Dados para gráfico Contratos Realizados Mensal (barras verticais)
  const dadosContratosMensal = useMemo(() => {
    if (!fundosData || fundosData.length === 0) return { labels: [], values: [] };

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    const anoParaExibir = anoSelecionadoContratos || anoVigente;
    
    const dadosFiltrados = fundosData.filter(d => {
      const dt = d.dt_contrato;
      if (!(dt instanceof Date)) return false;
      if (dt.getFullYear() !== anoParaExibir) return false;
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Contar contratos por mês
    const contractsByMonth = Array(12).fill(0);

    dadosFiltrados.forEach(d => {
      const dt = d.dt_contrato;
      if (!(dt instanceof Date)) return;
      const month = dt.getMonth();
      contractsByMonth[month] += 1;
    });

    return {
      labels: MESES_NOMES,
      values: contractsByMonth,
    };
  }, [fundosData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anoSelecionadoContratos, anoVigente]);

  // Dados para gráfico Comparativo Mensal de Adesões (barras agrupadas)
  const dadosComparativoAdesoes = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    const dadosFiltradosUnidades = salesData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar adesões por ano e mês
    const adesoesByYearMonth: Record<number, number[]> = {};

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = dt.getFullYear();
      const month = dt.getMonth();
      
      if (!adesoesByYearMonth[year]) {
        adesoesByYearMonth[year] = Array(12).fill(0);
      }
      adesoesByYearMonth[year][month] += 1;
    });

    const years = Object.keys(adesoesByYearMonth).map(Number).sort();
    
    // Inicializar anos ativos se vazio (últimos 2 anos)
    if (anosAtivosAdesoes.length === 0 && years.length > 0) {
      const ultimosAnos = years.slice(-2);
      setAnosAtivosAdesoes(ultimosAnos);
    }

    return years.map(year => ({
      year,
      monthlyData: adesoesByYearMonth[year],
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anosAtivosAdesoes.length]);

  // Anos ativos calculados para adesões
  const anosAtivosAdesoesComputed = useMemo(() => {
    if (anosAtivosAdesoes.length > 0) return anosAtivosAdesoes;
    const years = dadosComparativoAdesoes.map(d => d.year);
    return years.slice(-2);
  }, [anosAtivosAdesoes, dadosComparativoAdesoes]);

  // Dados para gráfico Adesões por Tipo Anual (barras empilhadas horizontais)
  const dadosAdesoesTipoAnual = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    
    const dadosFiltradosUnidades = salesData.filter(d => {
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Agrupar por ano e tipo (contagem)
    const adesoesByYear: Record<string, { vendas: number; posVendas: number }> = {};
    
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    dadosFiltradosUnidades.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const year = String(dt.getFullYear());
      const tipo = normalizeText(d.venda_posvenda);
      
      if (!adesoesByYear[year]) {
        adesoesByYear[year] = { vendas: 0, posVendas: 0 };
      }
      
      if (tipo === 'VENDA') {
        adesoesByYear[year].vendas += 1;
      } else if (tipo === 'POS VENDA') {
        adesoesByYear[year].posVendas += 1;
      }
    });

    const years = Object.keys(adesoesByYear).sort((a, b) => Number(a) - Number(b));
    
    return years.map(year => ({
      label: year,
      vendas: adesoesByYear[year].vendas,
      posVendas: adesoesByYear[year].posVendas,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades]);

  // Estado para ano selecionado nas adesões por tipo
  const [anoSelecionadoAdesoesTipo, setAnoSelecionadoAdesoesTipo] = useState<number | null>(null);

  // Dados para gráfico Adesões por Tipo Mensal (barras empilhadas verticais)
  const dadosAdesoesTipoMensal = useMemo(() => {
    if (!salesData || salesData.length === 0) return [];

    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;
    const cursosAtivos = filtros.cursos;
    const anoParaExibir = anoSelecionadoAdesoesTipo || anoVigente;
    
    const dadosFiltrados = salesData.filter(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return false;
      if (dt.getFullYear() !== anoParaExibir) return false;
      if (unidadesAtivas.length > 0 && !unidadesAtivas.includes(d.nm_unidade)) return false;
      if (cursosAtivos.length > 0 && !cursosAtivos.includes(d.curso_fundo)) return false;
      return true;
    });

    // Inicializar 12 meses
    const adesoesByMonth: { vendas: number; posVendas: number }[] = Array(12).fill(null).map(() => ({ vendas: 0, posVendas: 0 }));
    
    const normalizeText = (text: string | undefined | null) => 
      (text || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    dadosFiltrados.forEach(d => {
      const dt = d.dt_cadastro_integrante;
      if (!(dt instanceof Date)) return;
      
      const month = dt.getMonth();
      const tipo = normalizeText(d.venda_posvenda);
      
      if (tipo === 'VENDA') {
        adesoesByMonth[month].vendas += 1;
      } else if (tipo === 'POS VENDA') {
        adesoesByMonth[month].posVendas += 1;
      }
    });

    return MESES_NOMES.map((mes, index) => ({
      label: mes,
      vendas: adesoesByMonth[index].vendas,
      posVendas: adesoesByMonth[index].posVendas,
    }));
  }, [salesData, filtros.unidades, filtros.cursos, opcoesFiltros.unidades, anoSelecionadoAdesoesTipo, anoVigente]);

  // Dados para tabela de Desempenho por Consultor Comercial
  // Usa dadosFiltrados que já tem todos os filtros aplicados (período, unidade, tipo adesão, etc.)
  const dadosConsultorComercial = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return [];

    // Agrupar por chave única: unidade + consultor (indicado_por conforme código original)
    const performanceMap = new Map<string, { unidade: string; consultor: string; vvrTotal: number; totalAdesoes: number }>();

    dadosFiltrados.forEach(d => {
      // Usar indicado_por como consultor comercial (conforme lógica original)
      const consultor = d.indicado_por || 'N/A';
      const unidade = d.nm_unidade || 'N/A';
      const key = `${unidade}-${consultor}`;
      
      if (!performanceMap.has(key)) {
        performanceMap.set(key, { unidade, consultor, vvrTotal: 0, totalAdesoes: 0 });
      }
      
      const entry = performanceMap.get(key)!;
      entry.vvrTotal += d.vl_plano || 0;
      entry.totalAdesoes += 1;
    });

    return Array.from(performanceMap.values())
      .map(item => ({
        unidade: item.unidade,
        consultorComercial: item.consultor,
        vvrTotal: item.vvrTotal,
        totalAdesoes: item.totalAdesoes,
      }))
      .sort((a, b) => b.vvrTotal - a.vvrTotal);
  }, [dadosFiltrados]);

  // Dados para tabela de Adesões Detalhadas
  // Usa dadosFiltrados que já tem todos os filtros aplicados (período, unidade, tipo adesão, etc.)
  const dadosAdesoesDetalhadas = useMemo(() => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return [];

    return dadosFiltrados.map(d => ({
      unidade: d.nm_unidade || 'N/A',
      codIntegrante: d.codigo_integrante || '',
      integrante: d.nm_integrante || 'N/A',
      dataCadastro: d.dt_cadastro_integrante instanceof Date 
        ? d.dt_cadastro_integrante.toLocaleDateString('pt-BR') 
        : '',
      codFundo: d.id_fundo || '',
      tipo: d.venda_posvenda || '',
      consultor: d.indicado_por || 'N/A',
      vvr: d.vl_plano || 0,
    }));
  }, [dadosFiltrados]);

  // Dados para tabela de Fundos Detalhados
  // Usa fundosData com filtros de período e unidade aplicados
  const dadosFundosDetalhados = useMemo(() => {
    if (!fundosData || fundosData.length === 0 || !periodo?.startDate) return [];

    const startDate = periodo.startDate;
    const endDate = periodo.endDate;
    const unidadesAtivas = filtros.unidades.length > 0 ? filtros.unidades : opcoesFiltros.unidades;

    // Filtrar por unidade e período (dt_contrato)
    const dadosFiltrados = fundosData.filter(d => {
      const unidadeMatch = unidadesAtivas.length === 0 || unidadesAtivas.includes(d.nm_unidade);
      const dateMatch = d.dt_contrato instanceof Date && d.dt_contrato >= startDate && d.dt_contrato <= endDate;
      
      // Filtros adicionais da página de indicadores
      const cursoMatch = filtros.cursos.length === 0 || 
        (d.curso_fundo && filtros.cursos.includes(d.curso_fundo));
      const fundoMatch = filtros.fundos.length === 0 || 
        (d.nm_fundo && filtros.fundos.includes(d.nm_fundo));
      const tipoServicoMatch = filtros.tipoServico.length === 0 || 
        (d.tipo_servico && filtros.tipoServico.includes(d.tipo_servico.trim().toUpperCase()));
      const tipoClienteMatch = filtros.tipoCliente.length === 0 || 
        (d.tipo_cliente && filtros.tipoCliente.includes(d.tipo_cliente.trim().toUpperCase()));
      const instituicaoMatch = filtros.instituicao.length === 0 || 
        (d.instituicao && filtros.instituicao.includes(d.instituicao.trim().toUpperCase()));
      
      return unidadeMatch && dateMatch && cursoMatch && fundoMatch && tipoServicoMatch && tipoClienteMatch && instituicaoMatch;
    });

    return dadosFiltrados.map(d => ({
      unidade: d.nm_unidade || 'N/A',
      idFundo: d.id_fundo || '',
      fundo: d.nm_fundo || 'N/A',
      dtContrato: d.dt_contrato instanceof Date 
        ? d.dt_contrato.toLocaleDateString('pt-BR') 
        : '',
      dtCadastro: d.dt_cadastro instanceof Date 
        ? d.dt_cadastro.toLocaleDateString('pt-BR') 
        : '',
      tipoServico: d.tipo_servico || '',
      instituicao: d.instituicao || 'N/A',
      dtBaile: d.dt_baile instanceof Date 
        ? d.dt_baile.toLocaleDateString('pt-BR') 
        : '',
    }));
  }, [fundosData, periodo, filtros.unidades, filtros.cursos, filtros.fundos, filtros.tipoServico, filtros.tipoCliente, filtros.instituicao, opcoesFiltros.unidades]);

  // ========== DADOS DO FUNIL ==========
  
  // Função para converter data DD/MM/YYYY para objeto Date
  const parseDataFunil = useCallback((dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Tenta primeiro o formato DD/MM/YYYY
    const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (parts) {
      return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
    }
    
    // Fallback: tenta outros formatos
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }, []);

  // Filtrar dados do funil por unidade e período
  const dadosFunilFiltrados = useMemo(() => {
    if (!funilData || funilData.length === 0) return [];

    const temFiltroUnidade = filtros.unidades.length > 0;
    
    let dados = funilData;

    // Filtrar por unidade apenas se houver filtro específico selecionado
    // Se não houver filtro, traz TODOS os leads (incluindo "sem unidade")
    if (temFiltroUnidade) {
      dados = dados.filter(d => {
        const unidadeLead = (d.nm_unidade || '').trim();
        // Se o lead não tem unidade, verificar se "Sem Unidade" está selecionado
        if (!unidadeLead || unidadeLead === '' || unidadeLead.toLowerCase() === 'sem unidade') {
          return filtros.unidades.some(u => u.toLowerCase() === 'sem unidade' || u === '');
        }
        return filtros.unidades.includes(d.nm_unidade);
      });
    }
    // Se não há filtro de unidade, mantém todos os dados (incluindo sem unidade)

    // Filtrar por período de data (usando campo criado_em)
    if (periodo?.startDate && periodo?.endDate) {
      const startDate = periodo.startDate;
      // Adicionar 1 dia ao endDate para incluir o dia final completo
      const endDate = new Date(periodo.endDate);
      endDate.setDate(endDate.getDate() + 1);

      dados = dados.filter(item => {
        if (!item.criado_em) return false;
        
        const dataItem = parseDataFunil(item.criado_em);
        if (!dataItem) return false;
        
        return dataItem >= startDate && dataItem < endDate;
      });
    }

    // Filtrar por consultor
    if (filtros.consultores.length > 0) {
      dados = dados.filter(d => filtros.consultores.includes(d.consultor));
    }

    // Filtrar por origem do lead
    if (filtros.origemLead.length > 0) {
      dados = dados.filter(d => filtros.origemLead.includes(d.origem_lead));
    }

    // Filtrar por segmentação do lead
    if (filtros.segmentacaoLead.length > 0) {
      dados = dados.filter(d => filtros.segmentacaoLead.includes(d.segmentacao_lead));
    }

    // Filtrar por etiquetas
    if (filtros.etiquetas.length > 0) {
      dados = dados.filter(d => filtros.etiquetas.includes(d.etiquetas));
    }

    return dados;
  }, [funilData, filtros.unidades, filtros.consultores, filtros.origemLead, filtros.segmentacaoLead, filtros.etiquetas, periodo, parseDataFunil]);

  // Dados de negociações por fase (para gráfico do funil)
  const dadosNegociacoesPorFase = useMemo(() => {
    if (!dadosFunilFiltrados || dadosFunilFiltrados.length === 0) return [];

    // Contar quantidade por fase
    const faseContador: Record<string, number> = {};
    
    dadosFunilFiltrados.forEach(item => {
      if (item.titulo && item.titulo.trim() !== '') {
        const fase = item.fase_perdido || 'Não informado';
        faseContador[fase] = (faseContador[fase] || 0) + 1;
      }
    });

    // Mapear para formato do gráfico com cores
    return CORES_FASES_FUNIL.map(faseConfig => ({
      fase: faseConfig.nome,
      quantidade: faseContador[faseConfig.nome] || 0,
      cor: faseConfig.cor,
    })).filter(f => f.quantidade > 0 || CORES_FASES_FUNIL.some(c => c.nome === f.fase));
  }, [dadosFunilFiltrados]);

  // Dados de perdas por fase
  const dadosPerdasPorFase = useMemo(() => {
    if (!dadosFunilFiltrados || dadosFunilFiltrados.length === 0) return [];

    const perdasContador: Record<string, number> = {
      '1.1 Qualificação do Lead': 0,
      '1.2 Qualificação Comissão': 0,
      '1.3 Reunião Agendada': 0,
      '2.1 Diagnóstico Realizado': 0,
      '2.2 Apresentação Proposta': 0,
      '3.1 Proposta Enviada': 0,
      '3.2 Apresentação Turma': 0,
      '3.3 Gerar Contrato': 0,
      '4.1 Fechamento Comissão': 0,
      '5.1 Captação de Adesões': 0,
    };

    dadosFunilFiltrados.forEach(item => {
      if (item.titulo && item.titulo.trim() !== '') {
        if (item.perda_11?.toLowerCase() === 'sim') perdasContador['1.1 Qualificação do Lead']++;
        if (item.perda_12?.toLowerCase() === 'sim') perdasContador['1.2 Qualificação Comissão']++;
        if (item.perda_13?.toLowerCase() === 'sim') perdasContador['1.3 Reunião Agendada']++;
        if (item.perda_21?.toLowerCase() === 'sim') perdasContador['2.1 Diagnóstico Realizado']++;
        if (item.perda_22?.toLowerCase() === 'sim') perdasContador['2.2 Apresentação Proposta']++;
        if (item.perda_31?.toLowerCase() === 'sim') perdasContador['3.1 Proposta Enviada']++;
        if (item.perda_32?.toLowerCase() === 'sim') perdasContador['3.2 Apresentação Turma']++;
        if (item.perda_33?.toLowerCase() === 'sim') perdasContador['3.3 Gerar Contrato']++;
        if (item.perda_41?.toLowerCase() === 'sim') perdasContador['4.1 Fechamento Comissão']++;
        if (item.perda_51?.toLowerCase() === 'sim') perdasContador['5.1 Captação de Adesões']++;
      }
    });

    // Mapear para formato do gráfico com cores
    return CORES_FASES_PERDAS.map(faseConfig => ({
      fase: faseConfig.nome,
      quantidade: perdasContador[faseConfig.nome] || 0,
      cor: faseConfig.cor,
    }));
  }, [dadosFunilFiltrados]);

  // Função para classificar tipo de captação
  const getTipoCaptacao = useCallback((origemLead: string): string => {
    if (!origemLead || origemLead.trim() === '') return 'Captação Ativa';
    
    const origem = origemLead.trim();
    
    const captacoesPassivasExclusivasViva = [
      'Digital - Redes Sociais - VIVA Brasil',
      'Digital - Site VIVA Brasil',
      'Digital - Card Google',
    ];
    
    const captacoesPassivas = [
      'Presencial - Ligação/WPP Telefone Consultor (a)',
      'Digital - Redes Sociais - Instagram Local',
      'Indicação - Via Atlética/DA/CA',
      'Indicação - Via outra Franquia/Consultor VIVA',
      'Digital - Redes Sociais - Instagram Consultor (a)',
      'Presencial - Ligação Telefone Franquia',
      'Indicação - Via Integrante de Turma',
      'Presencial - Visita Sede Franquia',
      'Digital - Campanha paga - Instagram Local',
    ];

    if (captacoesPassivasExclusivasViva.includes(origem)) {
      return 'Captação Passiva - Exclusiva Viva BR';
    }
    
    if (captacoesPassivas.includes(origem)) {
      return 'Captação Passiva';
    }
    
    return 'Captação Ativa';
  }, []);

  // Dados de captações agrupados
  const dadosCaptacoes = useMemo(() => {
    if (!dadosFunilFiltrados || dadosFunilFiltrados.length === 0) return { porOrigem: [], porTipo: [] };

    // Filtrar apenas leads válidos
    const leadsValidos = dadosFunilFiltrados.filter(item => 
      item.titulo && item.titulo.trim() !== ''
    );

    const totalLeads = leadsValidos.length;
    if (totalLeads === 0) return { porOrigem: [], porTipo: [] };

    // Agrupar por origem
    const origemContador: Record<string, number> = {};
    const tipoContador: Record<string, number> = {};

    leadsValidos.forEach(item => {
      const origem = item.origem_lead || 'Não informado';
      const tipo = getTipoCaptacao(origem);

      origemContador[origem] = (origemContador[origem] || 0) + 1;
      tipoContador[tipo] = (tipoContador[tipo] || 0) + 1;
    });

    // Criar dados por origem
    const porOrigem = Object.entries(origemContador)
      .map(([origem, total]) => ({
        origem,
        tipo: getTipoCaptacao(origem),
        percentual: (total / totalLeads) * 100,
        total,
      }))
      .sort((a, b) => b.total - a.total);

    // Criar dados por tipo
    const porTipo = Object.entries(tipoContador)
      .map(([tipo, total]) => ({
        tipo,
        total,
        percentual: (total / totalLeads) * 100,
      }))
      .sort((a, b) => b.total - a.total);

    return { porOrigem, porTipo };
  }, [dadosFunilFiltrados, getTipoCaptacao]);

  // Indicadores operacionais do funil horizontal
  const indicadoresFunilHorizontal = useMemo(() => {
    if (!dadosFunilFiltrados || dadosFunilFiltrados.length === 0) {
      return {
        indicadores: [
          { titulo: 'TOTAL DE LEADS CRIADOS', valor: 0 },
          { titulo: 'LEADS ÚTEIS', valor: 0 },
          { titulo: 'QUALIFICAÇÃO COMISSÃO', valor: 0 },
          { titulo: 'REUNIÃO REALIZADA', valor: 0 },
          { titulo: 'PROPOSTAS ENVIADAS', valor: 0 },
          { titulo: 'CONTRATOS FECHADOS', valor: 0 },
        ],
        leadsPerdidos: 0,
        leadsDescartados: 0,
      };
    }

    // Contar leads válidos
    const leadsValidos = dadosFunilFiltrados.filter(item => 
      item.titulo && item.titulo.trim() !== ''
    );

    // Total de leads criados
    const totalLeads = leadsValidos.length;

    // Qualificação Comissão
    const qualificacaoComissao = leadsValidos.filter(item => 
      item.qualificacao_comissao && item.qualificacao_comissao.trim() !== ''
    ).length;

    // Reunião Realizada
    // Regra: Se "Diagnóstico Realizado" é vazio E "Proposta Enviada" é vazio = não conta
    // Se pelo menos UM deles tem valor = conta como 1
    const reuniaoRealizada = leadsValidos.filter(item => {
      const diagnosticoVazio = !item.diagnostico_realizado || item.diagnostico_realizado.trim() === '';
      const propostaVazia = !item.proposta_enviada || item.proposta_enviada.trim() === '';
      // Se NÃO for verdade que ambos estão vazios, então conta
      return !(diagnosticoVazio && propostaVazia);
    }).length;

    // Propostas Enviadas
    const propostasEnviadas = leadsValidos.filter(item => 
      item.proposta_enviada && item.proposta_enviada.trim() !== ''
    ).length;

    // Contratos Fechados
    const contratosFechados = leadsValidos.filter(item => 
      item.fechamento_comissao && item.fechamento_comissao.trim() !== ''
    ).length;

    // Leads Perdidos (fase contém "7.2" ou "perdido", tem motivo de perda, e NÃO é descarte)
    const leadsPerdidos = leadsValidos.filter(item => {
      const estaNaFasePerdido = item.fase_perdido && 
        item.fase_perdido.trim() !== '' && 
        (item.fase_perdido.includes("7.2") || 
         item.fase_perdido.toLowerCase().includes("perdido"));

      if (!estaNaFasePerdido) return false;

      if (!item.concat_motivo_perda || item.concat_motivo_perda.trim() === '') return false;

      // Usar getCampoAuxiliar para mapear o motivo corretamente
      const campoAuxiliar = getCampoAuxiliarLocal(item.concat_motivo_perda);
      return !campoAuxiliar.startsWith('Descarte');
    }).length;

    // Leads Descartados (fase contém "7.2" ou "perdido", tem motivo de perda, e COMEÇA com "Descarte")
    const leadsDescartados = leadsValidos.filter(item => {
      const estaNaFasePerdido = item.fase_perdido && 
        item.fase_perdido.trim() !== '' && 
        (item.fase_perdido.includes("7.2") || 
         item.fase_perdido.toLowerCase().includes("perdido"));

      if (!estaNaFasePerdido) return false;

      if (!item.concat_motivo_perda || item.concat_motivo_perda.trim() === '') return false;

      // Usar getCampoAuxiliar para mapear o motivo corretamente
      const campoAuxiliar = getCampoAuxiliarLocal(item.concat_motivo_perda);
      return campoAuxiliar.startsWith('Descarte');
    }).length;

    // Função auxiliar local para processar motivo de perda
    function getCampoAuxiliarLocal(concatMotivoPerda: string): string {
      if (!concatMotivoPerda || concatMotivoPerda.trim() === '') return '';
      
      const motivo = concatMotivoPerda.trim();
      
      switch (motivo) {
        case "Outro Motivo (especifique no campo de texto)":
          return "Outro Motivo (especifique no campo de texto)";
        case "Fechou com o Concorrente":
          return "Fechou com o Concorrente";
        case "Desistiu de Fazer o Fundo de Formatura":
          return "Desistiu de Fazer o Fundo de Formatura";
        case "Lead Duplicado (já existe outra pessoa da turma negociando - especifique o nome)":
          return "Descarte - Lead Duplicado";
        case "Falta de Contato no Grupo (durante negociação)":
          return "Falta de Contato no Grupo (durante negociação)";
        case "Falta de Contato Inicial (não responde)":
          return "Falta de Contato Inicial (não responde)";
        case "Território Inviável (não atendido por franquia VIVA)":
          return "Descarte - Território Inviável (não atendido por franquia VIVA)";
        case "Falta de Contato Inicial (telefone errado)":
          return "Descarte - Falta de Contato Inicial (telefone errado)";
        case "Pediu para retomar contato no próximo semestre":
          return "Descarte - Pediu para retomar contato no próximo semestre";
        case "Tipo de Ensino/Curso não atendido":
          return "Descarte - Tipo de Ensino/Curso não atendido";
        case "Adesão individual":
          return "Descarte - Adesão Individual";
        case "Adesão individual:":
          return "Descarte - Adesão Individual";
        case "Tipo de Ensino/Curso não atendido:":
          return "Descarte - Tipo de Ensino/Curso não atendido";
        default:
          return motivo;
      }
    }

    // Leads Úteis = Total de Leads - Leads Descartados
    const leadsUteis = totalLeads - leadsDescartados;

    return {
      indicadores: [
        { titulo: 'TOTAL DE LEADS CRIADOS', valor: totalLeads },
        { titulo: 'LEADS ÚTEIS', valor: leadsUteis },
        { titulo: 'QUALIFICAÇÃO COMISSÃO', valor: qualificacaoComissao },
        { titulo: 'REUNIÃO REALIZADA', valor: reuniaoRealizada },
        { titulo: 'PROPOSTAS ENVIADAS', valor: propostasEnviadas },
        { titulo: 'CONTRATOS FECHADOS', valor: contratosFechados },
      ],
      leadsPerdidos,
      leadsDescartados,
    };
  }, [dadosFunilFiltrados]);

  // Função auxiliar para processar motivo de perda (mesma lógica do original)
  const getCampoAuxiliar = (concatMotivoPerda: string): string => {
    if (!concatMotivoPerda || concatMotivoPerda.trim() === '') return '';
    
    const motivo = concatMotivoPerda.trim();
    
    switch (motivo) {
      case "Outro Motivo (especifique no campo de texto)":
        return "Outro Motivo (especifique no campo de texto)";
      case "Fechou com o Concorrente":
        return "Fechou com o Concorrente";
      case "Desistiu de Fazer o Fundo de Formatura":
        return "Desistiu de Fazer o Fundo de Formatura";
      case "Lead Duplicado (já existe outra pessoa da turma negociando - especifique o nome)":
        return "Descarte - Lead Duplicado (já existe outra pessoa da turma negociando - especifique o nome)";
      case "Falta de Contato no Grupo (durante negociação)":
        return "Falta de Contato no Grupo (durante negociação)";
      case "Falta de Contato Inicial (não responde)":
        return "Falta de Contato Inicial (não responde)";
      case "Território Inviável (não atendido por franquia VIVA)":
        return "Descarte - Território Inviável (não atendido por franquia VIVA)";
      case "Falta de Contato Inicial (telefone errado)":
        return "Descarte - Falta de Contato Inicial (telefone errado)";
      case "Pediu para retomar contato no próximo semestre":
        return "Descarte - Pediu para retomar contato no próximo semestre";
      case "Tipo de Ensino/Curso não atendido":
        return "Descarte - Tipo de Ensino/Curso não atendido";
      case "Adesão individual":
        return "Descarte - Adesão Individual";
      case "Adesão individual:":
        return "Descarte - Adesão Individual";
      case "Tipo de Ensino/Curso não atendido:":
        return "Descarte - Tipo de Ensino/Curso não atendido";
      default:
        return motivo;
    }
  };

  // Calcular motivos de perda e descarte
  const motivosPerdaDescarte = useMemo(() => {
    if (!dadosFunilFiltrados || dadosFunilFiltrados.length === 0) {
      return { motivosPerda: [], motivosDescarte: [] };
    }

    // Leads válidos com título
    const leadsValidos = dadosFunilFiltrados.filter(item => 
      item.titulo && item.titulo.trim() !== ''
    );

    // Leads perdidos (excluindo descartes)
    const leadsComFasePerdido = leadsValidos.filter(item => {
      // 1. Verificar se está na fase 7.2 Perdido
      const estaNaFasePerdido = item.fase_perdido && 
        item.fase_perdido.trim() !== '' && 
        (item.fase_perdido.includes("7.2") || 
         item.fase_perdido.toLowerCase().includes("perdido"));

      if (!estaNaFasePerdido) return false;

      // 2. Deve ter motivo de perda preenchido
      if (!item.concat_motivo_perda || item.concat_motivo_perda.trim() === '') return false;

      // 3. Verificar se NÃO começa com "Descarte"
      const campoAuxiliar = getCampoAuxiliar(item.concat_motivo_perda);
      return !campoAuxiliar.startsWith("Descarte");
    });

    // Leads descartados
    const leadsComDescarte = leadsValidos.filter(item => {
      const estaNaFasePerdido = item.fase_perdido && 
        item.fase_perdido.trim() !== '' && 
        (item.fase_perdido.includes("7.2") || 
         item.fase_perdido.toLowerCase().includes("perdido"));

      if (!estaNaFasePerdido) return false;

      if (!item.concat_motivo_perda || item.concat_motivo_perda.trim() === '') return false;

      const campoAuxiliar = getCampoAuxiliar(item.concat_motivo_perda);
      return campoAuxiliar.startsWith("Descarte");
    });

    // Contar motivos de perda
    const motivoPerdaContador: Record<string, number> = {};
    let totalPerdidos = 0;
    leadsComFasePerdido.forEach(item => {
      const campoAuxiliar = getCampoAuxiliar(item.concat_motivo_perda);
      const motivoFinal = campoAuxiliar || item.concat_motivo_perda.trim();
      if (motivoFinal) {
        motivoPerdaContador[motivoFinal] = (motivoPerdaContador[motivoFinal] || 0) + 1;
        totalPerdidos++;
      }
    });

    // Contar motivos de descarte
    const motivoDescarteContador: Record<string, number> = {};
    let totalDescartados = 0;
    leadsComDescarte.forEach(item => {
      const campoAuxiliar = getCampoAuxiliar(item.concat_motivo_perda);
      const motivoFinal = campoAuxiliar || item.concat_motivo_perda.trim();
      if (motivoFinal) {
        motivoDescarteContador[motivoFinal] = (motivoDescarteContador[motivoFinal] || 0) + 1;
        totalDescartados++;
      }
    });

    // Converter para arrays ordenados
    const motivosPerda = Object.entries(motivoPerdaContador)
      .map(([motivo, total]) => ({
        motivo,
        total,
        percentual: totalPerdidos > 0 ? (total / totalPerdidos) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const motivosDescarte = Object.entries(motivoDescarteContador)
      .map(([motivo, total]) => ({
        motivo,
        total,
        percentual: totalDescartados > 0 ? (total / totalDescartados) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    // Calcular concorrentes (leads perdidos que fecharam com concorrente)
    const leadsPerdidosComConcorrente = leadsValidos.filter(item => {
      const titulo = (item.titulo || '').trim();
      if (!titulo) return false;
      
      const fase = (item.fase_perdido || '').toLowerCase();
      const estaPerdido = fase.includes('7.2') || fase.includes('perdido');
      if (!estaPerdido) return false;
      
      const motivo = (item.concat_motivo_perda || '').toLowerCase();
      if (!motivo) return false;
      
      // Aceitar variações que mencionem concorrente
      return motivo.includes('concorrente') || 
             motivo.includes('concorr') || 
             motivo.includes('fechou com o concorrente') || 
             motivo.includes('fechou com concorrente');
    });

    // Agregar por nome do concorrente
    const concorrenteContador: Record<string, number> = {};
    let totalConcorrentes = 0;
    leadsPerdidosComConcorrente.forEach(item => {
      let conc = (item.concat_concorrente || '').trim();
      if (!conc) conc = 'Concorrente não informado';
      concorrenteContador[conc] = (concorrenteContador[conc] || 0) + 1;
      totalConcorrentes++;
    });

    const concorrentes = Object.entries(concorrenteContador)
      .map(([concorrente, total]) => ({
        concorrente,
        total,
        percentual: totalConcorrentes > 0 ? (total / totalConcorrentes) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    return { motivosPerda, motivosDescarte, concorrentes };
  }, [dadosFunilFiltrados]);

  // Handler para atualizar filtros
  const handleFiltrosChange = useCallback((novosFiltros: Partial<FiltrosState>) => {
    setFiltros((prev) => ({ ...prev, ...novosFiltros }));
  }, []);

  // Renderizar conteúdo baseado na página ativa
  const renderContent = () => {
    // Mostra loading global enquanto os dados de vendas estão carregando
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loading mensagem="Carregando..." />
        </div>
      );
    }

    // Se houve erro e não temos dados, mostra erro
    if (hasError && !hasAnySalesData) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger text-lg mb-2">Erro ao carregar dados</p>
            <p className="text-text-muted">{errorSales || errorMetas || errorFundos}</p>
          </div>
        </div>
      );
    }

    // Renderiza a página quando os dados estão prontos
    switch (paginaAtiva) {
      case 'metas':
        return renderMetasPage();
      case 'indicadores':
        return renderIndicadoresPage();
      case 'funil':
        return renderFunilPage();
      default:
        return renderMetasPage();
    }
  };

  // Página de Metas e Resultados (Primeira página original)
  const renderMetasPage = () => {
    // Só exibe indicador quando for Meta Interna
    const indicadorMeta = filtros.isMetaInterna ? '(META INTERNA)' : '';
    
    return (
      <div className="space-y-6">
        {/* Seção 1: VVR NO PERÍODO SELECIONADO */}
        <div className="bg-dark-secondary rounded-xl p-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="section-title">
              VVR NO PERÍODO SELECIONADO{' '}
              <span className="section-title-highlight">{indicadorMeta}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <KPICard
              titulo="REALIZADO TOTAL"
              valorRealizado={kpis.vvrTotal}
              valorMeta={kpis.metaVVRTotal}
              formatarComoMoeda={true}
              labelMeta="META TOTAL"
            />
            <KPICard
              titulo="REALIZADO VENDAS"
              valorRealizado={kpis.vvrVendas}
              valorMeta={kpis.metaVVRVendas}
              formatarComoMoeda={true}
              labelMeta="META VENDAS"
            />
            <KPICard
              titulo="REALIZADO PÓS VENDAS"
              valorRealizado={kpis.vvrPosVendas}
              valorMeta={kpis.metaVVRPosVendas}
              formatarComoMoeda={true}
              labelMeta="META PÓS VENDAS"
            />
          </div>
        </div>

        {/* Seção 2: VVR NO MESMO PERÍODO DO ANO ANTERIOR */}
        <div className="bg-dark-secondary rounded-xl p-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="section-title">
              VVR NO MESMO PERÍODO SELECIONADO NO ANO ANTERIOR{' '}
              <span className="section-title-highlight">{indicadorMeta}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <KPICard
              titulo="REALIZADO TOTAL"
              valorRealizado={kpisAnoAnterior.vvrTotal}
              valorMeta={kpisAnoAnterior.metaVVRTotal}
              formatarComoMoeda={true}
              labelMeta="META TOTAL"
            />
            <KPICard
              titulo="REALIZADO VENDAS"
              valorRealizado={kpisAnoAnterior.vvrVendas}
              valorMeta={kpisAnoAnterior.metaVVRVendas}
              formatarComoMoeda={true}
              labelMeta="META VENDAS"
            />
            <KPICard
              titulo="REALIZADO PÓS VENDAS"
              valorRealizado={kpisAnoAnterior.vvrPosVendas}
              valorMeta={kpisAnoAnterior.metaVVRPosVendas}
              formatarComoMoeda={true}
              labelMeta="META PÓS VENDAS"
            />
          </div>
        </div>

        {/* Seção 3: Indicadores Operacionais */}
        <IndicadoresOperacionais
          leads={indicadoresOperacionais.leads}
          reunioes={indicadoresOperacionais.reunioes}
          contratos={indicadoresOperacionais.contratos}
          adesao={indicadoresOperacionais.adesao}
        />

        {/* Seção 4: Gráfico VVR Realizado vs Meta por Mês */}
        <VVRVsMetaChart
          data={dadosGraficoVVRMes}
          titulo="VVR REALIZADO VS. META POR MÊS"
          tipoSelecionado={tipoGraficoVVR}
          onTipoChange={setTipoGraficoVVR}
          anoVigente={anoVigente}
          indicadorMeta={indicadorMeta}
        />

        {/* Seção 5: Gráfico VVR Acumulado Anual */}
        <CumulativeYearChart
          data={dadosGraficoAcumulado}
          titulo="VVR Acumulado Anual (Comparativo)"
        />

        {/* Seção 6: Tabela de Dados Detalhados */}
        <Card>
          <DadosDetalhadosTable 
            data={rankingUnidades}
            title="DADOS DETALHADOS POR MÊS/UNIDADE (PERÍODO SELECIONADO)"
            titleHighlight={indicadorMeta || undefined}
            tipoSelecionado={tipoTabelaDados}
            onTipoChange={setTipoTabelaDados}
            periodoLabel={periodoLabelTabela}
          />
        </Card>

        {/* Seção 7: Tabela de Atingimento Indicadores Operacionais */}
        <Card>
          <IndicadoresOperacionaisTable 
            data={indicadoresOperacionaisPorUnidade}
          />
        </Card>
      </div>
    );
  };

  // Página de Indicadores Secundários
  const renderIndicadoresPage = () => {
    const formatCurrency = (value: number) => {
      if (Math.abs(value) >= 1000000) {
        return (value / 1000000).toFixed(1).replace('.0', '') + ' mi';
      }
      if (Math.abs(value) >= 1000) {
        return (value / 1000).toFixed(1).replace('.0', '') + 'k';
      }
      return value.toLocaleString('pt-BR');
    };

    const formatCurrencyFull = (value: number) => {
      return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
      <div className="space-y-6">
        {/* Comparativo de VVR Mensal */}
        <Card titulo="COMPARATIVO DE VVR MENSAL">
          <div style={{ height: '400px' }}>
            <MultiYearLineChart
              data={dadosComparativoVVR}
              activeYears={anosAtivosVVRComputed}
              onYearToggle={toggleAnoVVR}
              formatValue={formatCurrency}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico VVR Anual - Barras Horizontais Empilhadas */}
          <Card titulo="VENDA REALIZADA TOTAL ANUAL">
            <div className="h-80">
              <StackedBarChart
                data={dadosVVRAnual}
                horizontal={true}
                onBarClick={(label) => {
                  const ano = parseInt(label);
                  if (!isNaN(ano)) setAnoSelecionadoVVR(ano);
                }}
              />
            </div>
          </Card>

          {/* Gráfico VVR Mensal - Barras Verticais Empilhadas */}
          <Card titulo={`VENDA REALIZADA TOTAL MENSAL (${anoSelecionadoVVR || anoVigente})`} className="lg:col-span-2">
            <div className="h-80">
              <StackedBarChart
                data={dadosVVRMensal}
                horizontal={false}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Ticket Médio Anual */}
          <Card titulo="TICKET MÉDIO ANUAL">
            <div className="h-80">
              <TicketMedioChart
                data={dadosTicketAnual}
                onBarClick={(label) => {
                  const ano = parseInt(label);
                  if (!isNaN(ano)) setAnoSelecionadoTicket(ano);
                }}
              />
            </div>
          </Card>

          {/* Gráfico Ticket Médio Mensal */}
          <Card titulo={`TICKET MÉDIO MENSAL (${anoSelecionadoTicket || anoVigente})`} className="lg:col-span-2">
            <div className="h-80">
              <TicketMedioChart
                data={dadosTicketMensal}
                horizontal={false}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contratos Realizados Anual */}
          <Card titulo="CONTRATOS REALIZADOS TOTAL ANUAL">
            <div className="h-80">
              <SimpleBarChart
                data={dadosContratosAnual}
                horizontal={true}
                datasetLabel="Contratos"
                onBarClick={(label) => {
                  const ano = parseInt(label);
                  if (!isNaN(ano)) setAnoSelecionadoContratos(ano);
                }}
              />
            </div>
          </Card>

          {/* Contratos Realizados Mensal */}
          <Card titulo={`CONTRATOS REALIZADOS TOTAL MENSAL (${anoSelecionadoContratos || anoVigente})`} className="lg:col-span-2">
            <div className="h-80">
              <SimpleBarChart
                data={dadosContratosMensal}
                horizontal={false}
                datasetLabel="Contratos"
              />
            </div>
          </Card>
        </div>

        {/* Comparativo Mensal de Adesões */}
        <Card titulo="COMPARATIVO MENSAL DE ADESÕES">
          <div style={{ height: '400px' }}>
            <MultiYearBarChart
              data={dadosComparativoAdesoes}
              activeYears={anosAtivosAdesoesComputed}
              onYearToggle={toggleAnoAdesoes}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Adesões por Tipo Anual */}
          <Card titulo="ADESÕES POR TIPO ANUAL">
            <div className="h-80">
              <StackedBarChart
                data={dadosAdesoesTipoAnual}
                horizontal={true}
                isCountChart={true}
                onBarClick={(label) => {
                  const ano = parseInt(label);
                  if (!isNaN(ano)) setAnoSelecionadoAdesoesTipo(ano);
                }}
              />
            </div>
          </Card>

          {/* Adesões por Tipo Mensal */}
          <Card titulo={`ADESÕES POR TIPO MENSAL (${anoSelecionadoAdesoesTipo || anoVigente})`} className="lg:col-span-2">
            <div className="h-80">
              <StackedBarChart
                data={dadosAdesoesTipoMensal}
                horizontal={false}
                isCountChart={true}
              />
            </div>
          </Card>
        </div>

        {/* Tabela Desempenho por Consultor Comercial */}
        <Card titulo="DESEMPENHO POR CONSULTOR COMERCIAL">
          <GenericDataTable
            columns={[
              { key: 'unidade', title: 'Unidade', sortable: true },
              { key: 'consultorComercial', title: 'Consultor Comercial', sortable: true },
              { key: 'vvrTotal', title: 'VVR Total', align: 'right', sortable: true, format: formatCurrencyFull },
              { key: 'totalAdesoes', title: 'Total de Adesões', align: 'right', sortable: true },
            ]}
            data={dadosConsultorComercial}
            pageSize={10}
          />
        </Card>

        {/* Tabela Adesões Detalhadas */}
        <Card titulo="ADESÕES DETALHADAS NO PERÍODO">
          <GenericDataTable
            columns={[
              { key: 'unidade', title: 'Unidade', sortable: true },
              { key: 'codIntegrante', title: 'Cód. Integrante', sortable: true },
              { key: 'integrante', title: 'Integrante', sortable: true },
              { key: 'dataCadastro', title: 'Data Cadastro', sortable: true },
              { key: 'codFundo', title: 'Cód. Fundo', sortable: true },
              { key: 'tipo', title: 'Tipo', sortable: true },
              { key: 'consultor', title: 'Consultor', sortable: true },
              { key: 'vvr', title: 'VVR', align: 'right', sortable: true, format: formatCurrencyFull },
            ]}
            data={dadosAdesoesDetalhadas}
            pageSize={10}
          />
        </Card>

        {/* Tabela Fundos Detalhados */}
        <Card titulo="FUNDOS DETALHADOS NO PERÍODO">
          <GenericDataTable
            columns={[
              { key: 'unidade', title: 'Unidade', sortable: true },
              { key: 'idFundo', title: 'ID Fundo', sortable: true },
              { key: 'fundo', title: 'Fundo', sortable: true },
              { key: 'dtContrato', title: 'DT Contrato', sortable: true },
              { key: 'dtCadastro', title: 'DT Cadastro', sortable: true },
              { key: 'tipoServico', title: 'Tipo de Serviço', sortable: true },
              { key: 'instituicao', title: 'Instituição', sortable: true },
              { key: 'dtBaile', title: 'DT Baile', sortable: true },
            ]}
            data={dadosFundosDetalhados}
            pageSize={10}
          />
        </Card>
      </div>
    );
  };

  // Página de Funil de Vendas
  const renderFunilPage = () => {
    // Só mostra loading se ainda não temos dados do funil
    const hasFunilData = funilData.length > 0;
    const showFunilLoading = loadingFunil && !hasFunilData;
    
    return (
      <div className="space-y-6">
        {showFunilLoading ? (
          <Loading mensagem="Carregando..." />
        ) : (
          <>
            {/* Seção 1: Funil Horizontal com Indicadores Operacionais */}
            <div className="bg-dark-secondary rounded-xl p-5">
              <FunilHorizontal
                indicadores={indicadoresFunilHorizontal.indicadores}
                leadsPerdidos={indicadoresFunilHorizontal.leadsPerdidos}
                leadsDescartados={indicadoresFunilHorizontal.leadsDescartados}
              />
            </div>

          {/* Seção 2: Captações */}
          <div className="bg-dark-secondary rounded-xl p-5">
            <h2 className="section-title">
              CAPTAÇÕES
            </h2>
            
            {/* Tabela de captações */}
            <div className="mb-6">
              {dadosCaptacoes.porOrigem.length > 0 ? (
                <CaptacoesTable dados={dadosCaptacoes.porOrigem} />
              ) : (
                <div className="text-center text-text-muted py-10">
                  Sem dados de captação disponíveis
                </div>
              )}
            </div>

            {/* Barra de tipos de captação */}
            <div className="mt-4">
              <h3 className="text-text-primary text-sm font-medium mb-3">
                TIPOS DE CAPTAÇÃO TOTAL
              </h3>
              {dadosCaptacoes.porTipo.length > 0 ? (
                <CaptacaoStackedBar
                  dados={dadosCaptacoes.porTipo}
                  height={60}
                />
              ) : (
                <div className="text-center text-text-muted py-4">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </div>

          {/* Seção 3: Negociações e Perdas por Fase */}
          <div className="bg-dark-secondary rounded-xl p-5">
            <h2 className="section-title">
              NEGOCIAÇÕES E PERDAS POR FASE
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
              {/* Gráfico de Negociações */}
              <div 
                className="rounded-lg p-5 flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #343a40 0%, #495057 100%)',
                  border: '1px solid #495057',
                  minHeight: '500px',
                }}
              >
                <h3 
                  style={{
                    color: '#adb5bd',
                    fontSize: '1rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #FF6600',
                    paddingBottom: '8px',
                    marginBottom: '16px',
                    textAlign: 'left',
                  }}
                >
                  QUANTIDADE DE TURMAS NEGOCIADAS POR FASE DO CRM
                </h3>
                <div className="flex-1">
                  {dadosNegociacoesPorFase.length > 0 ? (
                    <FunnelBarChart
                      dados={dadosNegociacoesPorFase}
                      height={400}
                    />
                  ) : (
                    <div className="text-center text-text-muted py-10">
                      {funilData && funilData.length > 0 
                        ? 'Nenhuma negociação encontrada'
                        : 'Sem dados disponíveis'
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* Gráfico de Perdas */}
              <div 
                className="rounded-lg p-5 flex flex-col"
                style={{
                  background: 'linear-gradient(135deg, #343a40 0%, #495057 100%)',
                  border: '1px solid #495057',
                  minHeight: '500px',
                }}
              >
                <h3 
                  style={{
                    color: '#adb5bd',
                    fontSize: '1rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #FF6600',
                    paddingBottom: '8px',
                    marginBottom: '16px',
                    textAlign: 'left',
                  }}
                >
                  QUANTIDADE DE PERDAS POR FASE
                </h3>
                <div className="flex-1">
                  {dadosPerdasPorFase.some(d => d.quantidade > 0) ? (
                    <FunnelBarChart
                      dados={dadosPerdasPorFase}
                      height={400}
                    />
                  ) : (
                    <div className="text-center text-text-muted py-10">
                      Nenhuma perda registrada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Leads Perdidos, Descartes e Concorrentes */}
          <div className="bg-dark-secondary rounded-xl p-5">
            <h2 className="section-title">
              LEADS PERDIDOS, DESCARTES E CONCORRENTES
            </h2>
            
            <MotivosPerdaDescarteTable
              motivosPerda={motivosPerdaDescarte.motivosPerda}
              motivosDescarte={motivosPerdaDescarte.motivosDescarte}
              concorrentes={motivosPerdaDescarte.concorrentes || []}
            />
          </div>
        </>
      )}
    </div>
    );
  };

  return (
    <>
      <Head>
        <title>Dashboard de Vendas | VIVA Eventos</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-dark-primary">
        {/* Header */}
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Layout principal */}
        <div className="flex">
          {/* Sidebar */}
          <Sidebar
            paginaAtiva={paginaAtiva}
            onPaginaChange={handlePaginaChange}
            isCollapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
          >
            <FilterPanel
              filtros={filtros}
              opcoes={opcoesFiltros}
              onFiltrosChange={handleFiltrosChange}
              paginaAtiva={paginaAtiva}
              showMetaToggle={paginaAtiva !== 'funil'}
              showUnidades={true}
              showRegionais={false}
              showUFs={false}
              showCidades={false}
              showConsultores={false}
              showSupervisores={false}
            />
          </Sidebar>

          {/* Conteúdo principal */}
          <main 
            className="flex-1 pt-6 px-6 pb-12 transition-all duration-300 overflow-x-hidden"
            style={{ 
              marginLeft: sidebarCollapsed ? '60px' : '300px',
              width: sidebarCollapsed ? 'calc(100vw - 60px)' : 'calc(100vw - 300px)',
            }}
          >
            {/* Conteúdo */}
            {renderContent()}
            
            {/* Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </>
  );
}
