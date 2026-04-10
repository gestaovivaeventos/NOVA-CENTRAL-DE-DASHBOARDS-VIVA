/**
 * Página de Resultados - Dashboard PEX
 * Usa PexLayout igual ao Ranking para manter consistência
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { ChevronDown, ChevronRight, Building2, MapPin, Users, TrendingUp, Briefcase } from 'lucide-react';
import { useSheetsData, Card, PexLayout, IndicadorCardLegacy as IndicadorCard, TabelaResumo, TabelaResultadosOficiais, GraficoEvolucao, useParametrosData } from '@/modules/pex';
import { useAuth } from '@/context/AuthContext';
import { filterDataByPermission } from '@/utils/permissoes';

// Mapeamento dos nomes de indicadores da planilha para as colunas dos dados
const MAPA_INDICADORES: Record<string, string> = {
  'VVR': 'vvr_12_meses',
  'VVR CARTEIRA': 'vvr_carteira',
  'ENDIVIDAMENTO': 'Indice_endividamento',
  'NPS': 'nps_geral',
  '% MC (ENTREGA)': 'indice_margem_entrega',
  'E-NPS': 'enps_rede',
  '% CONFORMIDADES OPERACIONAIS E FINANCEIRAS': 'conformidades',
  'RECLAME AQUI': 'reclame_aqui',
  '%COLABORADORES COM MAIS DE 1 ANO': 'colaboradores_mais_1_ano',
  'ESTRUTURA ORGANIZACIONAL': 'estrutura_organizacioanl',
  'CHURN': 'churn'
};

// Componente de Item Expansível para detalhes da unidade
interface ExpandableItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}

function ExpandableItem({ icon, label, value, isExpanded, onToggle, children }: ExpandableItemProps) {
  const hasChildren = !!children;
  
  return (
    <div style={{ borderBottom: '1px solid #3a3d41' }}>
      <div 
        onClick={hasChildren ? onToggle : undefined}
        style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '12px',
          padding: '14px 16px',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          backgroundColor: isExpanded ? 'rgba(255, 102, 0, 0.1)' : 'transparent'
        }}
        onMouseEnter={(e) => hasChildren && (e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.05)')}
        onMouseLeave={(e) => hasChildren && (e.currentTarget.style.backgroundColor = isExpanded ? 'rgba(255, 102, 0, 0.1)' : 'transparent')}
      >
        {hasChildren && (
          <span style={{ color: '#FF6600', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </span>
        )}
        <span style={{ color: '#FF6600', display: 'flex', alignItems: 'center', marginTop: '2px', flexShrink: 0 }}>
          {icon}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', flex: 1, minWidth: 0 }}>
          <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>{label}</span>
          <span style={{ fontWeight: 600, color: '#F8F9FA', fontSize: '0.95rem', textAlign: 'left', wordBreak: 'break-word' }}>{value}</span>
        </div>
      </div>
      {isExpanded && children && (
        <div style={{ 
          paddingLeft: '48px', 
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          borderTop: '1px solid #3a3d41'
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Componente de Card de Quarter Compacto
interface QuarterCardProps {
  quarter: string;
  pontuacao: number;
  ativo: boolean;
  posicaoRede: number;
  totalRede: number;
  posicaoCluster: number;
  totalCluster: number;
}

function QuarterCard({ quarter, pontuacao, ativo, posicaoRede, totalRede, posicaoCluster, totalCluster }: QuarterCardProps) {
  const pontuacaoExibir = ativo ? pontuacao : 0;
  const dados = [
    { name: 'score', value: pontuacaoExibir },
    { name: 'restante', value: Math.max(0, 100 - pontuacaoExibir) }
  ];

  return (
    <div style={{
      backgroundColor: '#2a2d31',
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      opacity: ativo ? 1 : 0.5,
      border: '1px solid #3a3d41'
    }}>
      <span style={{ 
        color: ativo ? '#adb5bd' : '#666', 
        fontSize: '0.85rem', 
        fontWeight: 600, 
        marginBottom: '6px'
      }}>
        {quarter}º Quarter
      </span>
      
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <defs>
            <radialGradient id={`qGrad${quarter}`}>
              <stop offset="0%" stopColor="#ff7a33" stopOpacity={1} />
              <stop offset="100%" stopColor="#cc4400" stopOpacity={1} />
            </radialGradient>
          </defs>
          <Pie
            data={dados}
            cx="50%"
            cy="50%"
            innerRadius={38}
            outerRadius={52}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={ativo ? `url(#qGrad${quarter})` : '#555'} stroke="none" />
            <Cell fill="#3a3f47" stroke="none" />
            <Label
              value={pontuacaoExibir.toFixed(1)}
              position="center"
              style={{ fontSize: '1.1rem', fontWeight: '600', fill: ativo ? '#F8F9FA' : '#666' }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '4px', 
        marginTop: '8px',
        width: '100%',
        fontSize: '0.8rem'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: 'rgba(255, 102, 0, 0.1)',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#adb5bd' }}>Rede:</span>
          <span style={{ fontWeight: 600 }}>
            {ativo ? (
              <><span style={{ color: '#FF6600' }}>{posicaoRede}º</span> <span style={{ color: '#F8F9FA', fontWeight: 400 }}>/ {totalRede}</span></>
            ) : '-'}
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '6px 10px',
          backgroundColor: 'rgba(255, 102, 0, 0.1)',
          borderRadius: '4px'
        }}>
          <span style={{ color: '#adb5bd' }}>Cluster:</span>
          <span style={{ fontWeight: 600 }}>
            {ativo ? (
              <><span style={{ color: '#FF6600' }}>{posicaoCluster}º</span> <span style={{ color: '#F8F9FA', fontWeight: 400 }}>/ {totalCluster}</span></>
            ) : '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Estado para expansão dos detalhes da unidade (começa fechado)
  const [detalhesExpandidos, setDetalhesExpandidos] = useState(false);
  
  // Buscar parâmetros (pesos) do contexto
  const { data: parametrosData, fetchAll: fetchParametros, hasFetched: parametrosFetched } = useParametrosData();
  
  // Buscar parâmetros se ainda não foram carregados
  useEffect(() => {
    if (!parametrosFetched) {
      fetchParametros();
    }
  }, [parametrosFetched, fetchParametros]);
  
  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Verificar se é franqueador (accessLevel >= 1)
  const isFranchiser = (user?.accessLevel ?? 0) >= 1;
  
  // Buscar dados do Google Sheets
  const { dados: dadosBrutosOriginal, loading, error } = useSheetsData();
  
  // Dados completos da rede (para comparações de melhor da rede/cluster)
  // Franqueados precisam ver comparações reais, não apenas com suas unidades
  const dadosRedeCompleta = dadosBrutosOriginal || [];
  
  // Filtrar dados por permissão do usuário (para visualização/seleção)
  const dadosBrutos = useMemo(() => {
    if (!dadosBrutosOriginal || !user) return [];
    
    // Aplicar filtro de permissão baseado no nível de acesso
    // Nível 1 (franqueadora) vê tudo, nível 0 (franqueado) vê apenas suas unidades
    return filterDataByPermission(dadosBrutosOriginal, {
      accessLevel: user.accessLevel as 0 | 1,
      unitNames: user.unitNames || []
    });
  }, [dadosBrutosOriginal, user]);

  // Estados para os filtros
  const [filtroQuarter, setFiltroQuarter] = useState<string>('');
  const [filtroUnidade, setFiltroUnidade] = useState<string>('');
  const [filtrosUnidades, setFiltrosUnidades] = useState<string[]>([]);
  const [filtrosClusters, setFiltrosClusters] = useState<string[]>([]);
  const [filtrosConsultores, setFiltrosConsultores] = useState<string[]>([]);
  const [filtrosPerformanceComercial, setFiltrosPerformanceComercial] = useState<string[]>([]);
  const [filtrosMaturidades, setFiltrosMaturidades] = useState<string[]>([]);
  const [filtrosMercados, setFiltrosMercados] = useState<string[]>([]);
  const [nomeColunaConsultor, setNomeColunaConsultor] = useState<string>('consultor');
  const [dadosHistorico, setDadosHistorico] = useState<any[]>([]);
  const [dadosResultadosOficiais, setDadosResultadosOficiais] = useState<any[]>([]);
  // Filtro independente de mês/ano para os cards de indicador
  const [filtroMesIndicador, setFiltroMesIndicador] = useState<string>('');
  // Filtro independente de quarter para a tabela resumo
  const [filtroQuarterTabela, setFiltroQuarterTabela] = useState<string>('');

  // Helper para verificar se é franquia de incubação (baseado no cluster)
  const isIncubacao = (cluster: string | undefined) => {
    if (!cluster) return false;
    const clusterUpper = cluster.toUpperCase();
    return clusterUpper.includes('INCUBA');
  };

  // Helper para verificar se é INCUBAÇÃO 0 (franquia sem nota)
  const isIncubacao0 = (cluster: string | undefined) => {
    if (!cluster) return false;
    const clusterNorm = cluster.toUpperCase().trim();
    return clusterNorm === 'INCUBAÇÃO 0' || clusterNorm === 'INCUBACAO 0';
  };

  // Detectar nome da coluna do consultor
  useEffect(() => {
    if (dadosBrutos && dadosBrutos.length > 0) {
      const possiveisNomes = ['consultor', 'Consultor', 'CONSULTOR', 'CONSULTOR RESPONSAVEL'];
      const nomeColuna = possiveisNomes.find(nome => dadosBrutos[0].hasOwnProperty(nome));
      if (nomeColuna) setNomeColunaConsultor(nomeColuna);
    }
  }, [dadosBrutos]);

  // Carregar histórico
  useEffect(() => {
    fetch('/api/pex/historico')
      .then(res => res.ok ? res.json() : [])
      .then(setDadosHistorico)
      .catch(() => setDadosHistorico([]));
    // Carregar histórico de resultados oficiais
    fetch('/api/pex/historico-resultados')
      .then(res => res.ok ? res.json() : [])
      .then(setDadosResultadosOficiais)
      .catch(() => setDadosResultadosOficiais([]));
  }, []);

  // Listas para os filtros
  const listaQuarters = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    return dadosBrutos
      .map(item => item.quarter)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos]);

  const listaClusters = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    return dadosBrutos
      .map(item => item.cluster)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos]);

  const listaConsultores = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    return dadosBrutos
      .map(item => item[nomeColunaConsultor])
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos, nomeColunaConsultor]);

  const listaPerformanceComercial = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    return dadosBrutos
      .map(item => item.performance_comercial)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos]);

  const listaMercados = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    return dadosBrutos
      .map(item => item.mercado)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos]);

  const listaUnidades = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    let dados = dadosBrutos;
    
    if (filtroQuarter) dados = dados.filter(item => item.quarter === filtroQuarter);
    if (filtrosClusters.length > 0) dados = dados.filter(item => item.cluster && filtrosClusters.includes(item.cluster));
    if (filtrosConsultores.length > 0) dados = dados.filter(item => item[nomeColunaConsultor] && filtrosConsultores.includes(item[nomeColunaConsultor]));
    if (filtrosPerformanceComercial.length > 0) dados = dados.filter(item => item.performance_comercial && filtrosPerformanceComercial.includes(item.performance_comercial));
    
    // Aplicar filtro de maturidade (multi-select)
    if (filtrosMaturidades.length > 0) {
      dados = dados.filter(item => {
        const isFranquiaIncubacao = isIncubacao(item.cluster);
        if (filtrosMaturidades.includes('Maduras') && filtrosMaturidades.includes('Incubação')) {
          return true;
        }
        if (filtrosMaturidades.includes('Maduras')) {
          return !isFranquiaIncubacao;
        }
        if (filtrosMaturidades.includes('Incubação')) {
          return isFranquiaIncubacao;
        }
        return true;
      });
    }
    
    // Aplicar filtro de mercado (multi-select)
    if (filtrosMercados.length > 0) {
      dados = dados.filter(item => item.mercado && filtrosMercados.includes(item.mercado));
    }
    
    return dados
      .map(item => item.nm_unidade)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos, filtroQuarter, filtrosClusters, filtrosConsultores, filtrosPerformanceComercial, filtrosMaturidades, filtrosMercados, nomeColunaConsultor]);

  // ============================================
  // HELPERS PARA CÁLCULOS COM HISTÓRICO
  // ============================================

  // Mapeamento de meses para quarters (trimestre padrão)
  const MESES_POR_QUARTER: Record<string, number[]> = {
    '1': [1, 2, 3],   // Q1 = Jan, Fev, Mar
    '2': [4, 5, 6],   // Q2 = Abr, Mai, Jun
    '3': [7, 8, 9],   // Q3 = Jul, Ago, Set
    '4': [10, 11, 12], // Q4 = Out, Nov, Dez
  };

  const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Helper para parsear data do histórico (DD/MM/AAAA) e extrair mês e ano
  const parseDateHistorico = (data: string): { mes: number; ano: number } | null => {
    if (!data) return null;
    const partes = data.split('/');
    if (partes.length !== 3) return null;
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);
    if (isNaN(mes) || isNaN(ano)) return null;
    return { mes, ano };
  };

  // Helper para obter pontuacao_com_bonus de um item do histórico
  const parsePontuacaoHistorico = (item: any): number => {
    const val = item?.pontuacao_com_bonus;
    if (!val) return 0;
    const num = parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? 0 : num;
  };

  // Lista de meses disponíveis no histórico (para o filtro dos cards de indicador)
  const listaMesesHistorico = useMemo(() => {
    if (!dadosHistorico || dadosHistorico.length === 0) return [];
    const mesesUnicos = new Set<string>();
    dadosHistorico.forEach(item => {
      const parsed = parseDateHistorico(item.data);
      if (parsed) {
        const label = `${NOMES_MESES[parsed.mes - 1]}/${parsed.ano}`;
        mesesUnicos.add(label);
      }
    });
    // Ordenar cronologicamente (mais recente primeiro)
    return Array.from(mesesUnicos).sort((a, b) => {
      const [mesA, anoA] = a.split('/');
      const [mesB, anoB] = b.split('/');
      const idxA = NOMES_MESES.indexOf(mesA);
      const idxB = NOMES_MESES.indexOf(mesB);
      if (anoA !== anoB) return parseInt(anoB) - parseInt(anoA);
      return idxB - idxA;
    });
  }, [dadosHistorico]);

  // Inicializar filtro de mês/ano dos indicadores
  useEffect(() => {
    if (listaMesesHistorico.length > 0 && !filtroMesIndicador) {
      setFiltroMesIndicador(listaMesesHistorico[0]); // mais recente
    }
  }, [listaMesesHistorico, filtroMesIndicador]);

  // Parsear o filtro de mês selecionado para mes/ano numéricos
  const filtroMesAnoParsed = useMemo(() => {
    if (!filtroMesIndicador) return null;
    const [mesStr, anoStr] = filtroMesIndicador.split('/');
    const mes = NOMES_MESES.indexOf(mesStr) + 1;
    const ano = parseInt(anoStr, 10);
    if (mes === 0 || isNaN(ano)) return null;
    return { mes, ano };
  }, [filtroMesIndicador]);

  // Determinar o quarter correspondente ao mês selecionado (para obter pesos corretos)
  const quarterDoMesSelecionado = useMemo(() => {
    if (!filtroMesAnoParsed) return '1';
    const mes = filtroMesAnoParsed.mes;
    if (mes <= 3) return '1';
    if (mes <= 6) return '2';
    if (mes <= 9) return '3';
    return '4';
  }, [filtroMesAnoParsed]);

  // Inicializar filtros
  useEffect(() => {
    if (listaQuarters.length > 0 && !filtroQuarter) {
      setFiltroQuarter(listaQuarters[0]);
    }
  }, [listaQuarters, filtroQuarter]);

  // Inicializar filtro independente de quarter para tabela resumo
  useEffect(() => {
    if (listaQuarters.length > 0 && !filtroQuarterTabela) {
      setFiltroQuarterTabela(listaQuarters[0]);
    }
  }, [listaQuarters, filtroQuarterTabela]);

  useEffect(() => {
    if (listaUnidades.length > 0 && !filtroUnidade) {
      // Se o usuário é nível 0, seleciona sua unidade automaticamente
      if (user?.accessLevel === 0 && user?.unitNames && user.unitNames.length > 0) {
        const unidadeDoUsuario = listaUnidades.find(u => user.unitNames?.includes(u));
        setFiltroUnidade(unidadeDoUsuario || listaUnidades[0]);
      } else {
        setFiltroUnidade(listaUnidades[0]);
      }
    }
    // Limpar filtros de unidades múltiplas quando a lista muda
    setFiltrosUnidades(prev => prev.filter(u => listaUnidades.includes(u)));
  }, [listaUnidades, filtroUnidade, user?.accessLevel, user?.unitNames]);

  // Determinar a unidade efetiva para os cards de detalhes
  // Se houver exatamente 1 unidade no multi-select, usa ela
  // Se não houver seleção no multi-select, usa a unidade do select simples
  // Se houver mais de 1, mostra mensagem
  const unidadeEfetiva = useMemo(() => {
    if (filtrosUnidades.length === 1) return filtrosUnidades[0];
    if (filtrosUnidades.length === 0) return filtroUnidade;
    return null; // mais de uma unidade selecionada
  }, [filtrosUnidades, filtroUnidade]);
  
  const multiplaUnidadesSelecionadas = filtrosUnidades.length > 1;
  
  // Verifica se há filtros de agrupamento ativos (esses filtros agrupam múltiplas unidades)
  // Mesmo com 1 valor selecionado, eles trazem várias unidades, então não faz sentido mostrar cards individuais
  const temFiltroConsultor = filtrosConsultores.length > 0;
  const temFiltroCluster = filtrosClusters.length > 0;
  const temFiltroPerformance = filtrosPerformanceComercial.length > 0;
  const temFiltroMaturidade = filtrosMaturidades.length > 0;
  const temFiltroMercado = filtrosMercados.length > 0;
  
  // Se qualquer filtro de agrupamento estiver ativo OU múltiplas unidades, mostra apenas a Tabela Resumo
  const temFiltrosAgrupamento = multiplaUnidadesSelecionadas || 
    temFiltroConsultor || 
    temFiltroCluster || 
    temFiltroPerformance ||
    temFiltroMaturidade ||
    temFiltroMercado;
  
  // Gera descrição dos filtros de agrupamento ativos
  const descricaoFiltrosAgrupamento = useMemo(() => {
    const filtros: string[] = [];
    if (multiplaUnidadesSelecionadas) filtros.push(`${filtrosUnidades.length} franquias`);
    if (temFiltroConsultor) filtros.push(`${filtrosConsultores.length} consultor${filtrosConsultores.length > 1 ? 'es' : ''}`);
    if (temFiltroCluster) filtros.push(`${filtrosClusters.length} cluster${filtrosClusters.length > 1 ? 's' : ''}`);
    if (temFiltroPerformance) filtros.push(`${filtrosPerformanceComercial.length} performance${filtrosPerformanceComercial.length > 1 ? 's' : ''} comercial`);
    if (temFiltroMaturidade) filtros.push(`${filtrosMaturidades.length} maturidade${filtrosMaturidades.length > 1 ? 's' : ''}`);
    if (temFiltroMercado) filtros.push(`${filtrosMercados.length} mercado${filtrosMercados.length > 1 ? 's' : ''}`);
    return filtros.join(', ');
  }, [multiplaUnidadesSelecionadas, temFiltroConsultor, temFiltroCluster, temFiltroPerformance, temFiltroMaturidade, temFiltroMercado, filtrosUnidades.length, filtrosConsultores.length, filtrosClusters.length, filtrosPerformanceComercial.length, filtrosMaturidades.length, filtrosMercados.length]);

  // Item selecionado
  const itemSelecionado = useMemo(() => {
    if (!dadosBrutos || !filtroQuarter || !unidadeEfetiva) return null;
    return dadosBrutos.find(item => item.quarter === filtroQuarter && item.nm_unidade === unidadeEfetiva);
  }, [dadosBrutos, filtroQuarter, unidadeEfetiva]);

  // Pontuação total = média de TODOS os meses vigentes do histórico
  // Ciclo 2026 (primeiro ano): Jan a Set
  // Próximos ciclos: Set a Set
  const pontuacaoTotal = useMemo(() => {
    if (!dadosHistorico || dadosHistorico.length === 0 || !unidadeEfetiva) return 0;
    
    const anoAtual = new Date().getFullYear();
    
    // Filtrar registros da unidade no histórico
    const registrosUnidade = dadosHistorico.filter(item => {
      if (item.nm_unidade !== unidadeEfetiva) return false;
      // Excluir meses em que a franquia estava em INCUBAÇÃO 0 (sem nota)
      if (isIncubacao0(item.cluster)) return false;
      const parsed = parseDateHistorico(item.data);
      if (!parsed) return false;
      // Para 2026 (primeiro ano): meses 1-9 do ano 2026
      if (anoAtual === 2026) {
        return parsed.ano === 2026 && parsed.mes >= 1 && parsed.mes <= 9;
      }
      // Próximos anos: ciclo Set(anoAnterior) a Set(anoAtual) 
      // Set do ano anterior (mes 9, ano-1) até Ago do ano atual (mes 8, ano) + Set do ano atual (mes 9, ano)
      return (parsed.ano === anoAtual - 1 && parsed.mes >= 9) || 
             (parsed.ano === anoAtual && parsed.mes <= 9);
    });
    
    if (registrosUnidade.length === 0) return 0;
    
    const soma = registrosUnidade.reduce((sum, item) => sum + parsePontuacaoHistorico(item), 0);
    return soma / registrosUnidade.length;
  }, [dadosHistorico, unidadeEfetiva]);

  // Posição na Rede e no Cluster (baseado na média de TODOS os meses vigentes do histórico)
  const posicoes = useMemo(() => {
    if (!dadosHistorico || dadosHistorico.length === 0 || !unidadeEfetiva) return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0 };
    
    const anoAtual = new Date().getFullYear();
    
    // Filtrar registros vigentes do histórico (excluindo INCUBAÇÃO 0)
    const registrosVigentes = dadosHistorico.filter(item => {
      // Excluir meses em que a franquia estava em INCUBAÇÃO 0 (sem nota)
      if (isIncubacao0(item.cluster)) return false;
      const parsed = parseDateHistorico(item.data);
      if (!parsed) return false;
      if (anoAtual === 2026) {
        return parsed.ano === 2026 && parsed.mes >= 1 && parsed.mes <= 9;
      }
      return (parsed.ano === anoAtual - 1 && parsed.mes >= 9) || 
             (parsed.ano === anoAtual && parsed.mes <= 9);
    });
    
    // Calcular média de cada unidade
    const unidadesUnicas = Array.from(new Set(registrosVigentes.map(item => item.nm_unidade)));
    
    const mediasPorUnidade = unidadesUnicas.map(unidade => {
      const registros = registrosVigentes.filter(item => item.nm_unidade === unidade);
      const soma = registros.reduce((sum, item) => sum + parsePontuacaoHistorico(item), 0);
      const media = registros.length > 0 ? soma / registros.length : 0;
      const cluster = registros[registros.length - 1]?.cluster || registros[0]?.cluster || '';
      return { unidade, media, cluster };
    });
    
    // Ordenar por média (maior primeiro)
    const rankingRede = [...mediasPorUnidade].sort((a, b) => b.media - a.media);
    const posicaoRede = rankingRede.findIndex(item => item.unidade === unidadeEfetiva) + 1;
    const totalRede = rankingRede.length;
    
    // Cluster da unidade selecionada
    const clusterUnidade = mediasPorUnidade.find(item => item.unidade === unidadeEfetiva)?.cluster || '';
    const rankingCluster = rankingRede.filter(item => item.cluster === clusterUnidade);
    const posicaoCluster = rankingCluster.findIndex(item => item.unidade === unidadeEfetiva) + 1;
    const totalCluster = rankingCluster.length;
    
    return { posicaoRede, totalRede, posicaoCluster, totalCluster };
  }, [dadosHistorico, unidadeEfetiva]);

  // Pontuações por quarter = média dos meses do quarter (do HISTÓRICO) com posições
  const pontuacoesPorQuarter = useMemo(() => {
    if (!dadosHistorico || dadosHistorico.length === 0 || !unidadeEfetiva) {
      return ['1', '2', '3', '4'].map(quarter => ({
        quarter, pontuacao: 0, ativo: false, posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0
      }));
    }
    
    const anoAtual = new Date().getFullYear();
    
    return ['1', '2', '3', '4'].map(quarter => {
      const mesesDoQuarter = MESES_POR_QUARTER[quarter];
      
      // Verificar se o quarter está ativo nos dados brutos
      const itemBruto = dadosBrutos?.find(d => d.quarter === quarter && d.nm_unidade === unidadeEfetiva);
      const quarterAtivo = itemBruto ? (itemBruto.quarter_ativo || '').toString().toLowerCase() === 'ativo' : false;
      
      // Filtrar meses do histórico para este quarter e unidade (excluindo INCUBAÇÃO 0)
      const registrosMesesQuarter = dadosHistorico.filter(item => {
        if (item.nm_unidade !== unidadeEfetiva) return false;
        if (isIncubacao0(item.cluster)) return false;
        const parsed = parseDateHistorico(item.data);
        if (!parsed) return false;
        return parsed.ano === anoAtual && mesesDoQuarter.includes(parsed.mes);
      });
      
      // Média dos meses do quarter
      const somaQuarter = registrosMesesQuarter.reduce((sum, item) => sum + parsePontuacaoHistorico(item), 0);
      const mediaQuarter = registrosMesesQuarter.length > 0 ? somaQuarter / registrosMesesQuarter.length : 0;
      
      // Calcular posições para este quarter usando dados do histórico (todas as unidades)
      let posicaoRede = 0, totalRede = 0, posicaoCluster = 0, totalCluster = 0;
      
      if (quarterAtivo) {
        // Todas as unidades com dados neste quarter (excluindo INCUBAÇÃO 0)
        const todasUnidadesQuarter = Array.from(new Set(
          dadosHistorico
            .filter(item => {
              if (isIncubacao0(item.cluster)) return false;
              const parsed = parseDateHistorico(item.data);
              return parsed && parsed.ano === anoAtual && mesesDoQuarter.includes(parsed.mes);
            })
            .map(item => item.nm_unidade)
        ));
        
        const mediasQuarter = todasUnidadesQuarter.map(unidade => {
          const registros = dadosHistorico.filter(item => {
            if (item.nm_unidade !== unidade) return false;
            if (isIncubacao0(item.cluster)) return false;
            const parsed = parseDateHistorico(item.data);
            return parsed && parsed.ano === anoAtual && mesesDoQuarter.includes(parsed.mes);
          });
          const soma = registros.reduce((sum, item) => sum + parsePontuacaoHistorico(item), 0);
          const media = registros.length > 0 ? soma / registros.length : 0;
          const cluster = registros[registros.length - 1]?.cluster || registros[0]?.cluster || '';
          return { unidade, media, cluster };
        }).sort((a, b) => b.media - a.media);
        
        posicaoRede = mediasQuarter.findIndex(d => d.unidade === unidadeEfetiva) + 1;
        totalRede = mediasQuarter.length;
        
        const clusterUnidade = mediasQuarter.find(d => d.unidade === unidadeEfetiva)?.cluster || '';
        const rankingCluster = mediasQuarter.filter(d => d.cluster === clusterUnidade);
        posicaoCluster = rankingCluster.findIndex(d => d.unidade === unidadeEfetiva) + 1;
        totalCluster = rankingCluster.length;
      }
      
      return { 
        quarter, 
        pontuacao: mediaQuarter, 
        ativo: quarterAtivo,
        posicaoRede,
        totalRede,
        posicaoCluster,
        totalCluster
      };
    });
  }, [dadosHistorico, dadosBrutos, unidadeEfetiva]);

  // Indicadores - Agora usa dados do HISTÓRICO filtrados pelo mês/ano selecionado
  const indicadores = useMemo(() => {
    if (!unidadeEfetiva || !dadosHistorico || dadosHistorico.length === 0 || !filtroMesAnoParsed) return [];
    
    const parseValor = (valor: any): number => {
      if (!valor) return 0;
      return parseFloat(valor.toString().replace(',', '.')) || 0;
    };

    // Filtrar dados do histórico pelo mês/ano selecionado
    const dadosMesSelecionado = dadosHistorico.filter(item => {
      const parsed = parseDateHistorico(item.data);
      return parsed && parsed.mes === filtroMesAnoParsed.mes && parsed.ano === filtroMesAnoParsed.ano;
    });

    // Item da unidade selecionada nesse mês
    const itemHistoricoUnidade = dadosMesSelecionado.find(item => item.nm_unidade === unidadeEfetiva);
    if (!itemHistoricoUnidade) return [];

    // Dados completos da rede nesse mês
    const cluster = itemHistoricoUnidade.cluster;
    const dadosClusterMes = dadosMesSelecionado.filter(item => item.cluster === cluster);

    // Função para obter peso dinâmico - usa o quarter correspondente ao mês selecionado
    const obterPesoDinamico = (nomeIndicador: string): number => {
      if (!parametrosData?.pesos || parametrosData.pesos.length === 0) return 0;
      
      const indicadorPeso = parametrosData.pesos.find(p => 
        p.indicador.toUpperCase().trim() === nomeIndicador.toUpperCase().trim()
      );
      if (!indicadorPeso) return 0;
      
      let pesoStr = '0';
      switch (quarterDoMesSelecionado) {
        case '1': pesoStr = indicadorPeso.quarter1; break;
        case '2': pesoStr = indicadorPeso.quarter2; break;
        case '3': pesoStr = indicadorPeso.quarter3; break;
        case '4': pesoStr = indicadorPeso.quarter4; break;
        default: pesoStr = indicadorPeso.quarter1;
      }
      
      return parseFloat(pesoStr.replace(',', '.')) || 0;
    };

    // Lista de indicadores organizados por blocos com mapeamento para a planilha
    // BLOCO 1: Resultado Econômico (Verde)
    // BLOCO 2: Experiência do Cliente (Azul)
    // BLOCO 3: Gestão & Conformidade (Roxo)
    // BLOCO 4: Pessoas & Sustentabilidade (Laranja)
    const listaIndicadores = [
      // === BLOCO 1: RESULTADO ECONÔMICO ===
      { 
        codigo: 'VVR_12_MESES', 
        coluna: 'vvr_12_meses', 
        titulo: 'VVR (Novas Vendas)', 
        notaGeral: 'Capacidade comercial vs. Meta do segmento', 
        indicadorPlanilha: 'VVR',
        tooltip: 'Mede a capacidade comercial da franquia em relação à meta do segmento, considerando as vendas realizadas nos últimos 12 meses. Indica o potencial de geração de novas vendas.',
        bloco: 1
      },
      { 
        codigo: 'VVR_CARTEIRA', 
        coluna: 'vvr_carteira', 
        titulo: 'VVR Carteira (Lastro)', 
        notaGeral: 'Massa crítica de contratos ativos', 
        indicadorPlanilha: 'VVR CARTEIRA',
        tooltip: 'O principal indicador estruturante. Representa a massa crítica de contratos ativos que sustenta a operação.',
        bloco: 1
      },
      { 
        codigo: 'MARGEM_ENTREGA', 
        coluna: 'indice_margem_entrega', 
        titulo: 'Margem (% MC)', 
        notaGeral: 'Eficiência de negociação e execução', 
        indicadorPlanilha: '% MC (ENTREGA)',
        tooltip: 'Indica a eficiência de negociação e execução. Quanto maior, melhor a margem de contribuição nas entregas.',
        bloco: 1
      },
      { 
        codigo: 'ENDIVIDAMENTO', 
        coluna: 'Indice_endividamento', 
        titulo: 'Endividamento dos Fundos', 
        notaGeral: 'Risco financeiro e inadimplência', 
        indicadorPlanilha: 'ENDIVIDAMENTO',
        tooltip: 'Mede o risco financeiro e nível de inadimplência. Quanto menor o endividamento, mais saudável a operação.',
        bloco: 1
      },
      { 
        codigo: 'CHURN', 
        coluna: 'churn', 
        titulo: 'Churn', 
        notaGeral: 'Perda de receita', 
        indicadorPlanilha: 'CHURN',
        tooltip: 'Mede a perda de receita por cancelamentos. Quanto menor o churn, maior a retenção de clientes.',
        bloco: 1
      },
      
      // === BLOCO 2: EXPERIÊNCIA DO CLIENTE ===
      { 
        codigo: 'NPS', 
        coluna: 'nps_geral', 
        titulo: 'NPS (Net Promoter Score)', 
        notaGeral: 'Satisfação dos formandos na jornada e na entrega', 
        indicadorPlanilha: 'NPS',
        tooltip: 'Mede a satisfação dos formandos em toda a jornada e na entrega final. Indica a probabilidade de recomendação.',
        bloco: 2
      },
      { 
        codigo: 'RECLAME_AQUI', 
        coluna: 'reclame_aqui', 
        titulo: 'Reclame Aqui', 
        notaGeral: 'Risco reputacional e recorrência de problemas', 
        indicadorPlanilha: 'RECLAME AQUI',
        tooltip: 'Mede o risco reputacional e a recorrência de problemas reportados. Quanto melhor a nota, menor o risco à marca.',
        bloco: 2
      },
      
      // === BLOCO 3: GESTÃO & CONFORMIDADE ===
      { 
        codigo: 'CONFORMIDADES', 
        coluna: 'conformidades', 
        titulo: 'Conformidades Operacionais e Financeiras', 
        notaGeral: 'Aderência aos padrões e cumprimento das regras', 
        indicadorPlanilha: '% CONFORMIDADES OPERACIONAIS E FINANCEIRAS',
        tooltip: 'Mede a aderência aos padrões e disciplina no cumprimento das regras operacionais e financeiras da rede.',
        bloco: 3
      },
      { 
        codigo: 'ESTRUTURA', 
        coluna: 'estrutura_organizacioanl', 
        titulo: 'Conformidade Societária + Estrutural', 
        notaGeral: 'Estrutura mínima exigida e time de acordo com o porte', 
        indicadorPlanilha: 'ESTRUTURA ORGANIZACIONAL',
        tooltip: 'Avalia a estrutura mínima exigida (sócio/gestor vendas + sócio/gestor pós-vendas) e o time mínimo de acordo com o porte da franquia.',
        bloco: 3
      },
      
      // === BLOCO 4: PESSOAS & SUSTENTABILIDADE ===
      { 
        codigo: 'ENPS', 
        coluna: 'enps_rede', 
        titulo: 'e-NPS da Franquia', 
        notaGeral: 'Engajamento e satisfação do time local', 
        indicadorPlanilha: 'E-NPS',
        tooltip: 'Mede o engajamento e satisfação do time local. Colaboradores satisfeitos entregam melhores resultados.',
        bloco: 4
      },
      { 
        codigo: 'COLABORADORES', 
        coluna: 'colaboradores_mais_1_ano', 
        titulo: 'Retenção (> 1 ano)', 
        notaGeral: '% de colaboradores com mais de um ano de casa', 
        indicadorPlanilha: '%COLABORADORES COM MAIS DE 1 ANO',
        tooltip: 'Mede a estabilidade e retenção de conhecimento. Maior retenção significa menor rotatividade e mais eficiência operacional.',
        bloco: 4
      },
      
      // === BÔNUS ===
      { 
        codigo: 'BONUS', 
        coluna: 'bonus', 
        titulo: 'Bônus', 
        notaGeral: 'Pontos de Bônus', 
        indicadorPlanilha: '',
        tooltip: 'Pontos adicionais conquistados por ações especiais ou desempenho excepcional.',
        bloco: 5
      }
    ];

    return listaIndicadores.map(ind => {
      // Obter peso dinâmico da planilha
      const peso = obterPesoDinamico(ind.indicadorPlanilha);
      
      // Obter resumo e cálculo da planilha (se disponível)
      const indicadorInfo = parametrosData?.indicadoresInfo?.find(
        info => info.indicador.toUpperCase().trim() === ind.indicadorPlanilha.toUpperCase().trim()
      );
      
      // Valor do indicador da unidade no mês selecionado (do HISTÓRICO)
      const pontuacaoUnidade = parseValor(itemHistoricoUnidade[ind.coluna]);
      
      // Calcular percentual de atingimento (pontuação / (peso * 100) * 100)
      const tetoMaximo = peso * 100;
      const percentualAtingimento = tetoMaximo > 0 ? (pontuacaoUnidade / tetoMaximo) * 100 : 0;
      
      // Melhor da rede (todos os dados do mês selecionado)
      const valoresRede = dadosMesSelecionado.map(item => parseValor(item[ind.coluna]));
      const melhorRede = valoresRede.length > 0 ? Math.max(...valoresRede) : 0;
      const itemMelhorRede = dadosMesSelecionado.find(item => parseValor(item[ind.coluna]) === melhorRede);
      
      // Melhor do cluster (dados do cluster no mês selecionado)
      const valoresCluster = dadosClusterMes.map(item => parseValor(item[ind.coluna]));
      const melhorCluster = valoresCluster.length > 0 ? Math.max(...valoresCluster) : 0;
      const itemMelhorCluster = dadosClusterMes.find(item => parseValor(item[ind.coluna]) === melhorCluster);

      return {
        ...ind,
        pontuacao: pontuacaoUnidade,
        percentualAtingimento,
        tetoMaximo,
        melhorPontuacaoRede: melhorRede,
        melhorPontuacaoCluster: melhorCluster,
        unidadeMelhorRede: itemMelhorRede?.nm_unidade || '-',
        unidadeMelhorCluster: itemMelhorCluster?.nm_unidade || '-',
        resumo: indicadorInfo?.resumo || '',
        calculo: indicadorInfo?.calculo || ''
      };
    });
  }, [dadosHistorico, unidadeEfetiva, filtroMesAnoParsed, quarterDoMesSelecionado, parametrosData?.pesos, parametrosData?.indicadoresInfo]);

  // Loading
  if (loading) {
    return (
      <PexLayout currentPage="resultados">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          backgroundColor: '#212529',
        }}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
            <p className="mt-4" style={{ color: '#adb5bd' }}>Carregando dados...</p>
          </div>
        </div>
      </PexLayout>
    );
  }

  // Erro
  if (error) {
    return (
      <PexLayout currentPage="resultados">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#212529',
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ color: '#F8F9FA', fontSize: '1.2rem', marginBottom: '8px' }}>
              Erro ao carregar dados
            </h3>
            <p style={{ color: '#adb5bd', marginBottom: '20px' }}>{error}</p>
          </div>
        </div>
      </PexLayout>
    );
  }

  const dadosGrafico = [
    { name: 'score', value: pontuacaoTotal },
    { name: 'restante', value: Math.max(0, 100 - pontuacaoTotal) }
  ];

  return (
    <PexLayout 
      currentPage="resultados"
      filters={{
        showQuarter: false,
        showUnidade: true,
        showCluster: isFranchiser,
        showConsultor: isFranchiser,
        showPerformanceComercial: isFranchiser,
        filtroQuarter,
        filtroUnidade,
        filtrosUnidades,
        filtrosClusters,
        filtrosConsultores,
        filtrosPerformanceComercial,
        filtrosMaturidades,
        filtrosMercados,
        onQuarterChange: setFiltroQuarter,
        onUnidadeChange: setFiltroUnidade,
        onUnidadesChange: setFiltrosUnidades,
        onClustersChange: setFiltrosClusters,
        onConsultoresChange: setFiltrosConsultores,
        onPerformanceComercialMultiChange: setFiltrosPerformanceComercial,
        onMaturidadesChange: setFiltrosMaturidades,
        onMercadosChange: setFiltrosMercados,
        listaQuarters,
        listaUnidades,
        listaClusters,
        listaConsultores,
        listaPerformanceComercial,
        listaMaturidades: ['Maduras', 'Incubação'],
        listaMercados,
        showMaturidade: isFranchiser,
        showMercado: isFranchiser,
      }}
    >
      <Head>
        <title>Resultados PEX | Central de Dashboards</title>
        <meta name="description" content="Resultados de Performance - Programa de Excelência (PEX)" />
      </Head>
      
      <div style={{
        padding: '30px',
        backgroundColor: '#212529',
        minHeight: '100vh',
      }}>
        {/* Header com Logo Viva */}
        <div style={{
          backgroundColor: '#343A40',
          padding: '20px 30px',
          borderRadius: '8px',
          boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
          borderBottom: '3px solid #FF6600',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '180px', height: '60px' }}>
              <Image 
                src="/images/logo_viva.png" 
                alt="Viva Eventos" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            
            <div style={{ 
              borderLeft: '1px solid #666', 
              paddingLeft: '24px', 
              height: '60px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center' 
            }}>
              <h1 style={{ 
                fontSize: '1.75rem',
                fontWeight: 700,
                background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                letterSpacing: '0.05em',
                marginBottom: '0px',
                textTransform: 'uppercase'
              }}>
                PEX - Programa de Excelência Rede Viva
              </h1>
              <span style={{ color: '#adb5bd', fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif', marginTop: '-2px' }}>
                Ciclo {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {temFiltrosAgrupamento ? (
          <>
            {/* Mensagem quando filtros de agrupamento estão ativos */}
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#FF6600' }}>
                  Filtros de Agrupamento Ativos
                </h3>
                <p style={{ color: '#adb5bd', marginBottom: '12px' }}>
                  Filtros aplicados: <strong style={{ color: '#FF6600' }}>{descricaoFiltrosAgrupamento}</strong>
                </p>
                <p style={{ color: '#adb5bd', marginBottom: '24px' }}>
                  Para visualizar os detalhes de pontuação, cards de indicadores e gráficos de uma franquia específica, remova os filtros de agrupamento e selecione apenas uma franquia.
                </p>
                <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  A <strong>Tabela Resumo</strong> abaixo exibe todas as franquias que correspondem aos filtros selecionados.
                </p>
              </div>
            </Card>

            {/* Tabela Resumo - Visível para todos (dados filtrados por permissão) */}
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '2px solid #FF6600',
                paddingBottom: '12px',
                marginTop: '30px',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Tabela Resumo <span style={{ color: '#FF6600' }}>({filtroQuarterTabela}º Quarter)</span>
                </h2>
                
                {/* Seletor de Quarter independente */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    color: '#6c757d', 
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginRight: '4px'
                  }}>
                    Quarter:
                  </span>
                  <div style={{
                    display: 'flex',
                    backgroundColor: '#1a1d21',
                    borderRadius: '8px',
                    padding: '4px',
                    gap: '4px'
                  }}>
                    {listaQuarters.map((q) => (
                      <button
                        key={q}
                        onClick={() => setFiltroQuarterTabela(q)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: filtroQuarterTabela === q ? '#FF6600' : 'transparent',
                          color: filtroQuarterTabela === q ? '#fff' : '#adb5bd',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                          if (filtroQuarterTabela !== q) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
                            e.currentTarget.style.color = '#FF6600';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (filtroQuarterTabela !== q) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#adb5bd';
                          }
                        }}
                      >
                        {q}º
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Card>
                <TabelaResumo
                  dados={dadosBrutos || []}
                  quarterSelecionado={filtroQuarterTabela}
                  clustersSelecionados={filtrosClusters}
                  consultoresSelecionados={filtrosConsultores}
                  nomeColunaConsultor={nomeColunaConsultor}
                  pesosIndicadores={parametrosData?.pesos || []}
                  unidadesSelecionadas={filtrosUnidades}
                  filtrosMaturidades={filtrosMaturidades}
                  filtrosMercados={filtrosMercados}
                  filtrosPerformanceComercial={filtrosPerformanceComercial}
                  dadosHistorico={dadosHistorico}
                />
              </Card>
            </>

            {/* Tabela Resultados Oficiais - Meta x Realizado */}
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '2px solid #FF6600',
                paddingBottom: '12px',
                marginTop: '30px',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Resultados Oficiais <span style={{ color: '#FF6600' }}>Meta x Realizado</span>
                </h2>
              </div>
              <Card>
                <TabelaResultadosOficiais
                  dadosResultados={dadosResultadosOficiais}
                  metas={parametrosData?.metas || []}
                  quarterSelecionado={filtroQuarterTabela}
                  franquiasFiltradas={filtrosUnidades.length > 0 ? filtrosUnidades : listaUnidades}
                />
              </Card>
            </>
          </>
        ) : itemSelecionado ? (
          <>
            {/* ========================================= */}
            {/* LAYOUT UNIFICADO - Container Único */}
            {/* ========================================= */}
            <div style={{
              backgroundColor: '#343A40',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '30px',
              border: '1px solid #3a3d41',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              {/* Título do Container */}
              <div style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid #FF6600'
              }}>
                <h2 style={{
                  color: '#F8F9FA',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: 0
                }}>
                  Resumo de Performance <span style={{ color: '#FF6600' }}>({unidadeEfetiva})</span>
                </h2>
              </div>

              {/* Grid Principal: Pontuação Total + Quarters + Detalhes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '380px 1fr 360px',
                gap: '20px',
                alignItems: 'stretch'
              }}>
                {/* Coluna 1: Pontuação Total em Destaque */}
                <div style={{
                  backgroundColor: '#2a2d31',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #FF6600',
                  boxShadow: '0 0 20px rgba(255, 102, 0, 0.2)'
                }}>
                  <span style={{
                    color: '#adb5bd',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '12px'
                  }}>
                    Pontuação Total
                  </span>
                  
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <defs>
                        <linearGradient id="mainOrangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff7a33" stopOpacity={1} />
                          <stop offset="50%" stopColor="#ff6000" stopOpacity={1} />
                          <stop offset="100%" stopColor="#cc4d00" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={dadosGrafico}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="url(#mainOrangeGradient)" stroke="none" />
                        <Cell fill="#3a3f47" stroke="none" />
                        <Label
                          value={pontuacaoTotal.toFixed(2)}
                          position="center"
                          style={{ fontSize: '2.4rem', fontWeight: '700', fill: '#F8F9FA' }}
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Mensagem */}
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: '#adb5bd', 
                    textAlign: 'center', 
                    marginTop: '12px',
                    marginBottom: '16px'
                  }}>
                    Média de <strong style={{ color: '#F8F9FA' }}>{unidadeEfetiva}</strong> em <span style={{ color: '#FF6600' }}>todos os meses</span>
                  </p>
                  
                  {/* Posições */}
                  <div style={{ 
                    width: '100%',
                    marginTop: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 102, 0, 0.1)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>Posição Rede:</span>
                      <span style={{ color: '#FF6600', fontWeight: 700, fontSize: '1rem' }}>
                        {posicoes.posicaoRede}º <span style={{ color: '#888', fontWeight: 400 }}>/ {posicoes.totalRede}</span>
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255, 102, 0, 0.1)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>Posição Cluster:</span>
                      <span style={{ color: '#FF6600', fontWeight: 700, fontSize: '1rem' }}>
                        {posicoes.posicaoCluster}º <span style={{ color: '#888', fontWeight: 400 }}>/ {posicoes.totalCluster}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coluna 2: Cards de Quarters - 2x2 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: '12px',
                  alignContent: 'center'
                }}>
                  {pontuacoesPorQuarter.map((quarterData) => (
                    <QuarterCard
                      key={quarterData.quarter}
                      {...quarterData}
                    />
                  ))}
                </div>

                {/* Coluna 3: Detalhes da Unidade - Expansível */}
                <div style={{
                  backgroundColor: '#2a2d31',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: '1px solid #3a3d41'
                }}>
                  {/* Header clicável */}
                  <div 
                    onClick={() => setDetalhesExpandidos(!detalhesExpandidos)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      cursor: 'pointer',
                      backgroundColor: detalhesExpandidos ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={20} style={{ color: '#FF6600' }} />
                      <span style={{ 
                        color: '#F8F9FA', 
                        fontWeight: 600, 
                        fontSize: '1rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Detalhes da Unidade
                      </span>
                    </div>
                    <span style={{ color: '#FF6600' }}>
                      {detalhesExpandidos ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                    </span>
                  </div>
                  
                  {/* Conteúdo expansível */}
                  <div style={{
                    maxHeight: detalhesExpandidos ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}>
                    <ExpandableItem
                      icon={<Building2 size={16} />}
                      label="Unidade"
                      value={unidadeEfetiva || '-'}
                    />
                    <ExpandableItem
                      icon={<TrendingUp size={16} />}
                      label="Maturidade"
                      value={isIncubacao(itemSelecionado.cluster) ? 'Incubação' : 'Madura'}
                    />
                    {/* Mercado: para Maduras mostra Cluster, para Incubação mostra Mercado */}
                    {isIncubacao(itemSelecionado.cluster) ? (
                      itemSelecionado['mercado'] && (
                        <ExpandableItem
                          icon={<MapPin size={16} />}
                          label="Mercado"
                          value={itemSelecionado['mercado']}
                        />
                      )
                    ) : (
                      itemSelecionado.cluster && (
                        <ExpandableItem
                          icon={<MapPin size={16} />}
                          label="Mercado"
                          value={itemSelecionado.cluster}
                        />
                      )
                    )}
                    {itemSelecionado['performance_comercial'] && (
                      <ExpandableItem
                        icon={<TrendingUp size={16} />}
                        label="Performance Comercial"
                        value={itemSelecionado['performance_comercial']}
                      />
                    )}
                    {itemSelecionado[nomeColunaConsultor] && (
                      <ExpandableItem
                        icon={<Briefcase size={16} />}
                        label="Consultor"
                        value={itemSelecionado[nomeColunaConsultor]}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance por Indicador - Dividido em Blocos */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '12px',
              marginBottom: '20px'
            }}>
              <h2 style={{
                color: '#adb5bd',
                fontFamily: 'Poppins, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '1.4rem',
                fontWeight: 700,
                margin: 0
              }}>
                Performance por Indicador {filtroMesAnoParsed && (
                  <span style={{ color: '#FF6600' }}>
                    ({NOMES_MESES[filtroMesAnoParsed.mes - 1]}/{filtroMesAnoParsed.ano})
                  </span>
                )}
              </h2>
              
              {/* Seletor de Mês/Ano */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ 
                  color: '#6c757d', 
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  marginRight: '4px'
                }}>
                  Mês:
                </span>
                <select
                  value={filtroMesIndicador}
                  onChange={(e) => setFiltroMesIndicador(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #495057',
                    backgroundColor: '#1a1d21',
                    color: '#FF6600',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'Poppins, sans-serif',
                    outline: 'none',
                    minWidth: '160px'
                  }}
                >
                  {listaMesesHistorico.map((opcao) => (
                    <option key={opcao} value={opcao}>
                      {opcao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* BLOCO 1: RESULTADO ECONÔMICO */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                color: '#adb5bd',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '12px',
                paddingLeft: '12px',
                borderLeft: '4px solid #FF6600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Bloco 1 — Resultado Econômico
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '16px'
              }}>
                {indicadores.filter(ind => ind.bloco === 1).map((indicador, index) => (
                  <IndicadorCard key={index} {...indicador} />
                ))}
              </div>
            </div>

            {/* BLOCOS 2 e 3 lado a lado */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '24px',
              marginBottom: '24px',
              alignItems: 'stretch'
            }}>
              {/* BLOCO 2: EXPERIÊNCIA DO CLIENTE */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingLeft: '12px',
                  borderLeft: '4px solid #FF6600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bloco 2 — Experiência do Cliente
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px',
                  gridAutoRows: '1fr',
                  flex: 1
                }}>
                  {indicadores.filter(ind => ind.bloco === 2).map((indicador, index) => (
                    <IndicadorCard key={index} {...indicador} />
                  ))}
                </div>
              </div>

              {/* BLOCO 3: GESTÃO & CONFORMIDADE */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingLeft: '12px',
                  borderLeft: '4px solid #FF6600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bloco 3 — Gestão & Conformidade
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px',
                  gridAutoRows: '1fr',
                  flex: 1
                }}>
                  {indicadores.filter(ind => ind.bloco === 3).map((indicador, index) => (
                    <IndicadorCard key={index} {...indicador} />
                  ))}
                </div>
              </div>
            </div>

            {/* BLOCO 4 e BÔNUS lado a lado */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '24px',
              marginBottom: '30px',
              alignItems: 'start'
            }}>
              {/* BLOCO 4: PESSOAS & SUSTENTABILIDADE */}
              <div>
                <h3 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingLeft: '12px',
                  borderLeft: '4px solid #FF6600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bloco 4 — Pessoas & Sustentabilidade
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px'
                }}>
                  {indicadores.filter(ind => ind.bloco === 4).map((indicador, index) => (
                    <IndicadorCard key={index} {...indicador} />
                  ))}
                </div>
              </div>

              {/* BÔNUS */}
              <div>
                <h3 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingLeft: '12px',
                  borderLeft: '4px solid #FF6600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Bônus
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '16px'
                }}>
                  {indicadores.filter(ind => ind.bloco === 5).map((indicador, index) => (
                    <IndicadorCard key={index} {...indicador} />
                  ))}
                </div>
              </div>
            </div>

            {/* Tabela Resumo - Visível para todos (dados filtrados por permissão) */}
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '2px solid #FF6600',
                paddingBottom: '12px',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Tabela Resumo <span style={{ color: '#FF6600' }}>({filtroQuarterTabela}º Quarter)</span>
                </h2>
                
                {/* Seletor de Quarter independente */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ 
                    color: '#6c757d', 
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginRight: '4px'
                  }}>
                    Quarter:
                  </span>
                  <div style={{
                    display: 'flex',
                    backgroundColor: '#1a1d21',
                    borderRadius: '8px',
                    padding: '4px',
                    gap: '4px'
                  }}>
                    {listaQuarters.map((q) => (
                      <button
                        key={q}
                        onClick={() => setFiltroQuarterTabela(q)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: filtroQuarterTabela === q ? '#FF6600' : 'transparent',
                          color: filtroQuarterTabela === q ? '#fff' : '#adb5bd',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'Poppins, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                          if (filtroQuarterTabela !== q) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
                            e.currentTarget.style.color = '#FF6600';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (filtroQuarterTabela !== q) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#adb5bd';
                          }
                        }}
                      >
                        {q}º
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Card>
                <TabelaResumo
                  dados={dadosBrutos || []}
                  quarterSelecionado={filtroQuarterTabela}
                  clustersSelecionados={filtrosClusters}
                  consultoresSelecionados={filtrosConsultores}
                  nomeColunaConsultor={nomeColunaConsultor}
                  pesosIndicadores={parametrosData?.pesos || []}
                  unidadesSelecionadas={filtrosUnidades}
                  filtrosMaturidades={filtrosMaturidades}
                  filtrosMercados={filtrosMercados}
                  filtrosPerformanceComercial={filtrosPerformanceComercial}
                  dadosHistorico={dadosHistorico}
                />
              </Card>
            </>

            {/* Tabela Resultados Oficiais - Meta x Realizado */}
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '2px solid #FF6600',
                paddingBottom: '12px',
                marginTop: '30px',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  margin: 0
                }}>
                  Resultados Oficiais <span style={{ color: '#FF6600' }}>Meta x Realizado</span>
                </h2>
              </div>
              <Card>
                <TabelaResultadosOficiais
                  dadosResultados={dadosResultadosOficiais}
                  metas={parametrosData?.metas || []}
                  quarterSelecionado={filtroQuarterTabela}
                  franquiasFiltradas={filtrosUnidades.length > 0 ? filtrosUnidades : listaUnidades}
                />
              </Card>
            </>

            {/* Gráfico de Evolução Mensal */}
            <div style={{ marginTop: '30px' }}>
              <GraficoEvolucao
                dadosHistorico={dadosHistorico}
                unidadeSelecionada={unidadeEfetiva || ''}
                clusterSelecionado={filtrosClusters.length === 1 ? filtrosClusters[0] : ''}
                consultorSelecionado={filtrosConsultores.length === 1 ? filtrosConsultores[0] : ''}
                nomeColunaConsultor={nomeColunaConsultor}
              />
            </div>
          </>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', color: '#555' }}>📊</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#F8F9FA' }}>
                Selecione um Quarter e Franquia
              </h3>
              <p style={{ color: '#adb5bd' }}>Use os filtros na sidebar para visualizar os resultados</p>
            </div>
          </Card>
        )}
      </div>
    </PexLayout>
  );
}
