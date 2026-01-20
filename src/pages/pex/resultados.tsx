/**
 * Página de Resultados - Dashboard PEX
 * Usa PexLayout igual ao Ranking para manter consistência
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { useSheetsData, Card, PexLayout, IndicadorCardLegacy as IndicadorCard, TabelaResumo, GraficoEvolucao, useParametrosData } from '@/modules/pex';
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

export default function ResultadosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
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
  
  // Filtrar dados por permissão do usuário
  const dadosBrutos = useMemo(() => {
    if (!dadosBrutosOriginal || !user) return [];
    
    // Usuários nível 0 veem todos os dados normalmente (sem filtros)
    if (user.accessLevel === 0) {
      return dadosBrutosOriginal;
    }
    
    // Aplicar filtro de permissão: franqueadora (1) vê tudo
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
  const [nomeColunaConsultor, setNomeColunaConsultor] = useState<string>('consultor');
  const [dadosHistorico, setDadosHistorico] = useState<any[]>([]);

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

  const listaUnidades = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    let dados = dadosBrutos;
    
    if (filtroQuarter) dados = dados.filter(item => item.quarter === filtroQuarter);
    if (filtrosClusters.length > 0) dados = dados.filter(item => item.cluster && filtrosClusters.includes(item.cluster));
    if (filtrosConsultores.length > 0) dados = dados.filter(item => item[nomeColunaConsultor] && filtrosConsultores.includes(item[nomeColunaConsultor]));
    if (filtrosPerformanceComercial.length > 0) dados = dados.filter(item => item.performance_comercial && filtrosPerformanceComercial.includes(item.performance_comercial));
    
    return dados
      .map(item => item.nm_unidade)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos, filtroQuarter, filtrosClusters, filtrosConsultores, filtrosPerformanceComercial, nomeColunaConsultor]);

  // Inicializar filtros
  useEffect(() => {
    if (listaQuarters.length > 0 && !filtroQuarter) {
      setFiltroQuarter(listaQuarters[0]);
    }
  }, [listaQuarters, filtroQuarter]);

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

  // Item selecionado
  const itemSelecionado = useMemo(() => {
    if (!dadosBrutos || !filtroQuarter || !unidadeEfetiva) return null;
    return dadosBrutos.find(item => item.quarter === filtroQuarter && item.nm_unidade === unidadeEfetiva);
  }, [dadosBrutos, filtroQuarter, unidadeEfetiva]);

  // Pontuação total (média apenas de quarters ATIVOS)
  const pontuacaoTotal = useMemo(() => {
    if (!dadosBrutos || !unidadeEfetiva) return 0;
    
    // Filtrar apenas quarters ativos da unidade
    const dadosUnidadeAtivos = dadosBrutos.filter(item => 
      item.nm_unidade === unidadeEfetiva && 
      (item.quarter_ativo || '').toString().toLowerCase() === 'ativo'
    );
    
    const total = dadosUnidadeAtivos.reduce((sum, item) => {
      const pont = parseFloat((item['pontuacao_com_bonus'] || '0').toString().replace(',', '.'));
      return sum + (isNaN(pont) ? 0 : pont);
    }, 0);
    
    return dadosUnidadeAtivos.length > 0 ? total / dadosUnidadeAtivos.length : 0;
  }, [dadosBrutos, unidadeEfetiva]);

  // Posição na Rede e no Cluster (baseado na média total de quarters ATIVOS)
  const posicoes = useMemo(() => {
    if (!dadosBrutos || !unidadeEfetiva) return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0 };
    
    // Filtrar apenas dados de quarters ativos
    const dadosAtivos = dadosBrutos.filter(item => 
      (item.quarter_ativo || '').toString().toLowerCase() === 'ativo'
    );
    
    // Calcular média de cada unidade (apenas quarters ativos)
    const unidadesUnicas = Array.from(new Set(dadosAtivos.map(item => item.nm_unidade)));
    
    const mediasPorUnidade = unidadesUnicas.map(unidade => {
      const dadosUnidade = dadosAtivos.filter(item => item.nm_unidade === unidade);
      const total = dadosUnidade.reduce((sum, item) => {
        const pont = parseFloat((item['pontuacao_com_bonus'] || '0').toString().replace(',', '.'));
        return sum + (isNaN(pont) ? 0 : pont);
      }, 0);
      const media = dadosUnidade.length > 0 ? total / dadosUnidade.length : 0;
      const cluster = dadosUnidade[0]?.cluster || '';
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
  }, [dadosBrutos, unidadeEfetiva]);

  // Posição no Quarter selecionado (respeita quarter ativo)
  const posicoesQuarter = useMemo(() => {
    if (!dadosBrutos || !unidadeEfetiva || !filtroQuarter) return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0, ativo: false };
    
    const dadosQuarter = dadosBrutos.filter(item => item.quarter === filtroQuarter);
    
    // Verificar se o quarter selecionado está ativo para a unidade selecionada
    const itemUnidade = dadosQuarter.find(item => item.nm_unidade === unidadeEfetiva);
    const quarterAtivo = itemUnidade ? (itemUnidade.quarter_ativo || '').toString().toLowerCase() === 'ativo' : false;
    
    // Se quarter inativo, retornar zeros
    if (!quarterAtivo) {
      return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0, ativo: false };
    }
    
    // Filtrar apenas itens com quarter ativo para o ranking
    const dadosQuarterAtivo = dadosQuarter.filter(item => 
      (item.quarter_ativo || '').toString().toLowerCase() === 'ativo'
    );
    
    const rankingRede = dadosQuarterAtivo.map(item => ({
      unidade: item.nm_unidade,
      pontuacao: parseFloat((item['pontuacao_com_bonus'] || '0').toString().replace(',', '.')),
      cluster: item.cluster
    })).sort((a, b) => b.pontuacao - a.pontuacao);
    
    const posicaoRede = rankingRede.findIndex(item => item.unidade === unidadeEfetiva) + 1;
    const totalRede = rankingRede.length;
    
    const clusterUnidade = itemSelecionado?.cluster || '';
    const rankingCluster = rankingRede.filter(item => item.cluster === clusterUnidade);
    const posicaoCluster = rankingCluster.findIndex(item => item.unidade === unidadeEfetiva) + 1;
    const totalCluster = rankingCluster.length;
    
    return { posicaoRede, totalRede, posicaoCluster, totalCluster, ativo: true };
  }, [dadosBrutos, unidadeEfetiva, filtroQuarter, itemSelecionado]);

  // Pontuações por quarter (apenas quarters ativos)
  const pontuacoesPorQuarter = useMemo(() => {
    if (!dadosBrutos || !unidadeEfetiva) return [];
    
    return ['1', '2', '3', '4'].map(quarter => {
      const item = dadosBrutos.find(d => d.quarter === quarter && d.nm_unidade === unidadeEfetiva);
      if (!item) return { quarter, pontuacao: 0, ativo: false };
      
      // Verificar se o quarter está ativo
      const quarterAtivo = (item.quarter_ativo || '').toString().toLowerCase() === 'ativo';
      
      const pont = parseFloat((item['pontuacao_com_bonus'] || '0').toString().replace(',', '.'));
      return { quarter, pontuacao: isNaN(pont) ? 0 : pont, ativo: quarterAtivo };
    });
  }, [dadosBrutos, unidadeEfetiva]);

  // Indicadores
  const indicadores = useMemo(() => {
    if (!itemSelecionado || !dadosBrutos) return [];
    
    // Verificar se o quarter está ativo
    const quarterAtivo = (itemSelecionado.quarter_ativo || '').toString().toLowerCase() === 'ativo';
    
    const parseValor = (valor: any): number => {
      if (!valor) return 0;
      return parseFloat(valor.toString().replace(',', '.')) || 0;
    };

    const dadosFiltrados = dadosBrutos.filter(item => item.quarter === filtroQuarter);
    const cluster = itemSelecionado.cluster;
    const dadosCluster = dadosFiltrados.filter(item => item.cluster === cluster);

    // Função para obter peso dinâmico do contexto de parâmetros
    const obterPesoDinamico = (nomeIndicador: string): number => {
      if (!parametrosData?.pesos || parametrosData.pesos.length === 0) return 0;
      
      const indicadorPeso = parametrosData.pesos.find(p => 
        p.indicador.toUpperCase().trim() === nomeIndicador.toUpperCase().trim()
      );
      if (!indicadorPeso) return 0;
      
      // Selecionar o peso do quarter correto
      let pesoStr = '0';
      switch (filtroQuarter) {
        case '1': pesoStr = indicadorPeso.quarter1; break;
        case '2': pesoStr = indicadorPeso.quarter2; break;
        case '3': pesoStr = indicadorPeso.quarter3; break;
        case '4': pesoStr = indicadorPeso.quarter4; break;
        default: pesoStr = indicadorPeso.quarter1;
      }
      
      return parseFloat(pesoStr.replace(',', '.')) || 0;
    };

    // Lista de indicadores com mapeamento para a planilha
    const listaIndicadores = [
      { codigo: 'VVR_12_MESES', coluna: 'vvr_12_meses', titulo: 'VVR 12 MESES', notaGeral: 'VALOR DE VENDAS REALIZADAS 12 MESES', indicadorPlanilha: 'VVR' },
      { codigo: 'VVR_CARTEIRA', coluna: 'vvr_carteira', titulo: 'VVR CARTEIRA', notaGeral: 'VALOR DE VENDAS REALIZADAS CARTEIRA', indicadorPlanilha: 'VVR CARTEIRA' },
      { codigo: 'ENDIVIDAMENTO', coluna: 'Indice_endividamento', titulo: 'ENDIVIDAMENTO', notaGeral: 'ÍNDICE DE ENDIVIDAMENTO', indicadorPlanilha: 'ENDIVIDAMENTO' },
      { codigo: 'NPS', coluna: 'nps_geral', titulo: 'NPS GERAL', notaGeral: 'NET PROMOTER SCORE', indicadorPlanilha: 'NPS' },
      { codigo: 'MARGEM_ENTREGA', coluna: 'indice_margem_entrega', titulo: 'MARGEM ENTREGA', notaGeral: 'ÍNDICE DE MARGEM DE ENTREGA', indicadorPlanilha: '% MC (ENTREGA)' },
      { codigo: 'ENPS', coluna: 'enps_rede', titulo: 'eNPS REDE', notaGeral: 'EMPLOYEE NET PROMOTER SCORE', indicadorPlanilha: 'E-NPS' },
      { codigo: 'CONFORMIDADES', coluna: 'conformidades', titulo: 'CONFORMIDADES', notaGeral: 'AUDITORIA DE CONFORMIDADES', indicadorPlanilha: '% CONFORMIDADES OPERACIONAIS E FINANCEIRAS' },
      { codigo: 'RECLAME_AQUI', coluna: 'reclame_aqui', titulo: 'RECLAME AQUI', notaGeral: 'ÍNDICE RECLAME AQUI', indicadorPlanilha: 'RECLAME AQUI' },
      { codigo: 'COLABORADORES', coluna: 'colaboradores_mais_1_ano', titulo: 'COLAB. +1 ANO', notaGeral: 'COLABORADORES COM MAIS DE 1 ANO', indicadorPlanilha: '%COLABORADORES COM MAIS DE 1 ANO' },
      { codigo: 'ESTRUTURA', coluna: 'estrutura_organizacioanl', titulo: 'ESTRUTURA ORG.', notaGeral: 'ESTRUTURA ORGANIZACIONAL', indicadorPlanilha: 'ESTRUTURA ORGANIZACIONAL' },
      { codigo: 'CHURN', coluna: 'churn', titulo: 'CHURN', notaGeral: 'ÍNDICE DE CHURN', indicadorPlanilha: 'CHURN' },
      { codigo: 'BONUS', coluna: 'bonus', titulo: 'BÔNUS', notaGeral: 'PONTOS DE BÔNUS', indicadorPlanilha: '' }
    ];

    return listaIndicadores.map(ind => {
      // Obter peso dinâmico da planilha
      const peso = obterPesoDinamico(ind.indicadorPlanilha);
      
      // Se quarter inativo, todos os valores zerados
      const pontuacaoUnidade = quarterAtivo ? parseValor(itemSelecionado[ind.coluna]) : 0;
      
      // Calcular percentual de atingimento (pontuação / (peso * 100) * 100)
      const tetoMaximo = peso * 100;
      const percentualAtingimento = tetoMaximo > 0 ? (pontuacaoUnidade / tetoMaximo) * 100 : 0;
      
      const valoresRede = quarterAtivo 
        ? dadosFiltrados.map(item => parseValor(item[ind.coluna])) 
        : [];
      const melhorRede = valoresRede.length > 0 ? Math.max(...valoresRede) : 0;
      const itemMelhorRede = quarterAtivo 
        ? dadosFiltrados.find(item => parseValor(item[ind.coluna]) === melhorRede) 
        : null;
      
      const valoresCluster = quarterAtivo 
        ? dadosCluster.map(item => parseValor(item[ind.coluna])) 
        : [];
      const melhorCluster = valoresCluster.length > 0 ? Math.max(...valoresCluster) : 0;
      const itemMelhorCluster = quarterAtivo 
        ? dadosCluster.find(item => parseValor(item[ind.coluna]) === melhorCluster) 
        : null;

      return {
        ...ind,
        pontuacao: pontuacaoUnidade,
        percentualAtingimento,
        tetoMaximo,
        melhorPontuacaoRede: melhorRede,
        melhorPontuacaoCluster: melhorCluster,
        unidadeMelhorRede: itemMelhorRede?.nm_unidade || '-',
        unidadeMelhorCluster: itemMelhorCluster?.nm_unidade || '-'
      };
    });
  }, [itemSelecionado, dadosBrutos, filtroQuarter, parametrosData?.pesos]);

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
        showQuarter: true,
        showUnidade: true,
        showCluster: (user?.accessLevel ?? 0) >= 1,
        showConsultor: (user?.accessLevel ?? 0) >= 1,
        showPerformanceComercial: (user?.accessLevel ?? 0) >= 1,
        filtroQuarter,
        filtroUnidade,
        filtrosUnidades,
        filtrosClusters,
        filtrosConsultores,
        filtrosPerformanceComercial,
        onQuarterChange: setFiltroQuarter,
        onUnidadeChange: setFiltroUnidade,
        onUnidadesChange: setFiltrosUnidades,
        onClustersChange: setFiltrosClusters,
        onConsultoresChange: setFiltrosConsultores,
        onPerformanceComercialMultiChange: setFiltrosPerformanceComercial,
        listaQuarters,
        listaUnidades,
        listaClusters,
        listaConsultores,
        listaPerformanceComercial,
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
        {multiplaUnidadesSelecionadas ? (
          <>
            {/* Mensagem quando múltiplas unidades estão selecionadas */}
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#FF6600' }}>
                  Múltiplas Franquias Selecionadas
                </h3>
                <p style={{ color: '#adb5bd', marginBottom: '12px' }}>
                  Você selecionou <strong style={{ color: '#FF6600' }}>{filtrosUnidades.length} franquias</strong>.
                </p>
                <p style={{ color: '#adb5bd', marginBottom: '24px' }}>
                  Para visualizar os detalhes de pontuação, cards de indicadores e gráficos, selecione apenas uma franquia.
                </p>
                <p style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                  A <strong>Tabela Resumo</strong> abaixo exibe as franquias selecionadas.
                </p>
              </div>
            </Card>

            {/* Tabela Resumo - Sempre visível para franqueadora */}
            {isFranchiser && (
              <>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '2px solid #FF6600',
                  paddingBottom: '8px',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  marginTop: '30px',
                  marginBottom: '20px'
                }}>
                  Tabela Resumo <span style={{ color: '#FF6600' }}>({filtroQuarter}º Quarter)</span>
                </h2>
                <Card>
                  <TabelaResumo
                    dados={dadosBrutos || []}
                    quarterSelecionado={filtroQuarter}
                    clustersSelecionados={filtrosClusters}
                    consultoresSelecionados={filtrosConsultores}
                    nomeColunaConsultor={nomeColunaConsultor}
                    pesosIndicadores={parametrosData?.pesos || []}
                    unidadesSelecionadas={filtrosUnidades}
                  />
                </Card>
              </>
            )}
          </>
        ) : itemSelecionado ? (
          <>
            {/* Grid Principal - Gráfico e Detalhes */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
              gap: '24px', 
              marginBottom: '30px' 
            }}>
              {/* Card do Gráfico de Pontuação Total */}
              <Card>
                <h3 style={{
                  color: '#adb5bd',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #555',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  PONTUAÇÃO TOTAL <span style={{ color: '#FF6600' }}>({unidadeEfetiva})</span>
                </h3>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <defs>
                        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff7a33" stopOpacity={1} />
                          <stop offset="50%" stopColor="#ff6000" stopOpacity={1} />
                          <stop offset="100%" stopColor="#cc4d00" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={dadosGrafico}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="url(#orangeGradient)" stroke="none" />
                        <Cell fill="#3a3f47" stroke="none" />
                        <Label
                          value={pontuacaoTotal.toFixed(2)}
                          position="center"
                          style={{ fontSize: '2.4rem', fontWeight: '300', fill: '#F8F9FA' }}
                        />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '14px', color: '#adb5bd' }}>
                    Média de <strong style={{ color: '#F8F9FA' }}>{unidadeEfetiva}</strong> em <span style={{ color: '#FF6600' }}>todos os quarters</span>
                  </p>
                </div>
                
                {/* Posições - Rede e Cluster - Visual igual à imagem */}
                <div style={{ 
                  backgroundColor: '#2a2d31',
                  borderRadius: '6px',
                  marginTop: '16px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #3a3d41'
                  }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição na Rede:</span>
                    <span style={{ color: '#FF6600', fontWeight: 700, fontSize: '0.95rem' }}>
                      {posicoes.posicaoRede}º <span style={{ color: '#F8F9FA', fontWeight: 400 }}>de {posicoes.totalRede}</span>
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px'
                  }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição no Cluster:</span>
                    <span style={{ color: '#FF6600', fontWeight: 700, fontSize: '0.95rem' }}>
                      {posicoes.posicaoCluster}º <span style={{ color: '#F8F9FA', fontWeight: 400 }}>de {posicoes.totalCluster}</span>
                    </span>
                  </div>
                </div>
                  
                {/* Legenda */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#FF6600', borderRadius: '2px' }}></div>
                    <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Atingido: {pontuacaoTotal.toFixed(2)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#3a3f47', borderRadius: '2px' }}></div>
                    <span style={{ color: '#adb5bd', fontSize: '0.75rem' }}>Restante: {(100 - pontuacaoTotal).toFixed(2)}%</span>
                  </div>
                </div>
              </Card>

              {/* Card de Detalhes da Unidade */}
              <Card>
                <h3 style={{
                  color: '#adb5bd',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '16px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #555',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  DETALHES DA UNIDADE <span style={{ color: '#FF6600' }}>({filtroQuarter}º Quarter)</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Unidade:</span>
                    <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{unidadeEfetiva}</span>
                  </div>
                  {itemSelecionado.cluster && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Cluster:</span>
                      <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{itemSelecionado.cluster}</span>
                    </div>
                  )}
                  {itemSelecionado['performance_comercial'] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Performance Comercial:</span>
                      <span style={{ fontWeight: 600, color: '#F8F9FA' }}>
                        {itemSelecionado['performance_comercial']}
                      </span>
                    </div>
                  )}
                  {itemSelecionado[nomeColunaConsultor] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Consultor Responsável:</span>
                      <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{itemSelecionado[nomeColunaConsultor]}</span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Quarter:</span>
                    <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{filtroQuarter}º Quarter</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Pontuação no Quarter Selecionado:</span>
                    <span style={{ fontWeight: 600, fontSize: '1.1rem', color: posicoesQuarter.ativo ? '#FF6600' : '#888' }}>
                      {posicoesQuarter.ativo ? (itemSelecionado['pontuacao_com_bonus'] || '0') : '0'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição na Rede:</span>
                    <span style={{ fontWeight: 700, color: posicoesQuarter.ativo ? '#F8F9FA' : '#888' }}>
                      {posicoesQuarter.ativo ? `${posicoesQuarter.posicaoRede}º de ${posicoesQuarter.totalRede}` : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição no Cluster:</span>
                    <span style={{ fontWeight: 700, color: posicoesQuarter.ativo ? '#F8F9FA' : '#888' }}>
                      {posicoesQuarter.ativo ? `${posicoesQuarter.posicaoCluster}º de ${posicoesQuarter.totalCluster}` : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Pontuação por Quarter */}
            <h2 style={{
              color: '#adb5bd',
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '8px',
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              Pontuação por Quarter
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px', 
              marginBottom: '30px' 
            }}>
              {pontuacoesPorQuarter.map((quarterData) => {
                // Se inativo, mostrar pontuação zerada
                const pontuacaoExibir = quarterData.ativo ? quarterData.pontuacao : 0;
                const dados = [
                  { name: 'score', value: pontuacaoExibir },
                  { name: 'restante', value: Math.max(0, 100 - pontuacaoExibir) }
                ];

                return (
                  <Card key={quarterData.quarter} titulo={`${quarterData.quarter}º Quarter`}>
                    <div style={{ width: '100%', overflow: 'hidden', opacity: quarterData.ativo ? 1 : 0.5 }}>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <defs>
                            <radialGradient id={`orangeGradient${quarterData.quarter}`}>
                              <stop offset="0%" stopColor="#ff7a33" stopOpacity={1} />
                              <stop offset="100%" stopColor="#cc4400" stopOpacity={1} />
                            </radialGradient>
                          </defs>
                          <Pie
                            data={dados}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill={quarterData.ativo ? `url(#orangeGradient${quarterData.quarter})` : '#555'} stroke="none" />
                            <Cell fill="#3a3f47" stroke="none" />
                            <Label
                              value={pontuacaoExibir.toFixed(2)}
                              position="center"
                              style={{ fontSize: '1.8rem', fontWeight: '300', fill: quarterData.ativo ? '#F8F9FA' : '#888' }}
                            />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <p style={{ fontSize: '13px', color: quarterData.ativo ? '#adb5bd' : '#666' }}>Pontuação</p>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Performance por Indicador */}
            <h2 style={{
              color: '#adb5bd',
              fontFamily: 'Poppins, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '2px solid #FF6600',
              paddingBottom: '8px',
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              Performance por Indicador <span style={{ color: '#FF6600' }}>({filtroQuarter}º Quarter)</span>
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '16px', 
              marginBottom: '30px' 
            }}>
              {indicadores.map((indicador, index) => (
                <IndicadorCard key={index} {...indicador} />
              ))}
            </div>

            {/* Tabela Resumo - Apenas para Franqueadora */}
            {isFranchiser && (
              <>
                <h2 style={{
                  color: '#adb5bd',
                  fontFamily: 'Poppins, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  borderBottom: '2px solid #FF6600',
                  paddingBottom: '8px',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  marginBottom: '20px'
                }}>
                  Tabela Resumo <span style={{ color: '#FF6600' }}>({filtroQuarter}º Quarter)</span>
                </h2>
                <Card>
                  <TabelaResumo
                    dados={dadosBrutos || []}
                    quarterSelecionado={filtroQuarter}
                    clustersSelecionados={filtrosClusters}
                    consultoresSelecionados={filtrosConsultores}
                    nomeColunaConsultor={nomeColunaConsultor}
                    pesosIndicadores={parametrosData?.pesos || []}
                    unidadesSelecionadas={filtrosUnidades}
                  />
                </Card>
              </>
            )}

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
