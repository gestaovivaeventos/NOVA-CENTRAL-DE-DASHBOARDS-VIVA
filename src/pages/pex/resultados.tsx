/**
 * Página de Resultados - Dashboard PEX
 * Usa PexLayout igual ao Ranking para manter consistência
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { useSheetsData, Card, PexLayout, IndicadorCardLegacy as IndicadorCard, TabelaResumo, GraficoEvolucao } from '@/modules/pex';
import { useAuth } from '@/context/AuthContext';
import { filterDataByPermission } from '@/utils/permissoes';

export default function ResultadosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
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
  const [filtroCluster, setFiltroCluster] = useState<string>('');
  const [filtroConsultor, setFiltroConsultor] = useState<string>('');
  const [nomeColunaConsultor, setNomeColunaConsultor] = useState<string>('Consultor');
  const [dadosHistorico, setDadosHistorico] = useState<any[]>([]);

  // Detectar nome da coluna do consultor
  useEffect(() => {
    if (dadosBrutos && dadosBrutos.length > 0) {
      const possiveisNomes = ['Consultor', 'CONSULTOR', 'consultor', 'CONSULTOR RESPONSAVEL'];
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
      .map(item => item.QUARTER)
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

  const listaUnidades = useMemo(() => {
    if (!dadosBrutos || dadosBrutos.length === 0) return [];
    let dados = dadosBrutos;
    
    if (filtroQuarter) dados = dados.filter(item => item.QUARTER === filtroQuarter);
    if (filtroCluster) dados = dados.filter(item => item.cluster === filtroCluster);
    if (filtroConsultor) dados = dados.filter(item => item[nomeColunaConsultor] === filtroConsultor);
    
    return dados
      .map(item => item.nm_unidade)
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
  }, [dadosBrutos, filtroQuarter, filtroCluster, filtroConsultor, nomeColunaConsultor]);

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
  }, [listaUnidades, filtroUnidade, user?.accessLevel, user?.unitNames]);

  // Item selecionado
  const itemSelecionado = useMemo(() => {
    if (!dadosBrutos || !filtroQuarter || !filtroUnidade) return null;
    return dadosBrutos.find(item => item.QUARTER === filtroQuarter && item.nm_unidade === filtroUnidade);
  }, [dadosBrutos, filtroQuarter, filtroUnidade]);

  // Pontuação total (média de todos os quarters)
  const pontuacaoTotal = useMemo(() => {
    if (!dadosBrutos || !filtroUnidade) return 0;
    const dadosUnidade = dadosBrutos.filter(item => item.nm_unidade === filtroUnidade);
    
    const total = dadosUnidade.reduce((sum, item) => {
      const pont = parseFloat((item['Pontuação com bonus'] || item['Pontuação com Bonus'] || '0').toString().replace(',', '.'));
      return sum + (isNaN(pont) ? 0 : pont);
    }, 0);
    
    return dadosUnidade.length > 0 ? total / dadosUnidade.length : 0;
  }, [dadosBrutos, filtroUnidade]);

  // Posição na Rede e no Cluster (baseado na média total)
  const posicoes = useMemo(() => {
    if (!dadosBrutos || !filtroUnidade) return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0 };
    
    // Calcular média de cada unidade
    const unidadesUnicas = Array.from(new Set(dadosBrutos.map(item => item.nm_unidade)));
    
    const mediasPorUnidade = unidadesUnicas.map(unidade => {
      const dadosUnidade = dadosBrutos.filter(item => item.nm_unidade === unidade);
      const total = dadosUnidade.reduce((sum, item) => {
        const pont = parseFloat((item['Pontuação com bonus'] || item['Pontuação com Bonus'] || '0').toString().replace(',', '.'));
        return sum + (isNaN(pont) ? 0 : pont);
      }, 0);
      const media = dadosUnidade.length > 0 ? total / dadosUnidade.length : 0;
      const cluster = dadosUnidade[0]?.cluster || '';
      return { unidade, media, cluster };
    });
    
    // Ordenar por média (maior primeiro)
    const rankingRede = [...mediasPorUnidade].sort((a, b) => b.media - a.media);
    const posicaoRede = rankingRede.findIndex(item => item.unidade === filtroUnidade) + 1;
    const totalRede = rankingRede.length;
    
    // Cluster da unidade selecionada
    const clusterUnidade = mediasPorUnidade.find(item => item.unidade === filtroUnidade)?.cluster || '';
    const rankingCluster = rankingRede.filter(item => item.cluster === clusterUnidade);
    const posicaoCluster = rankingCluster.findIndex(item => item.unidade === filtroUnidade) + 1;
    const totalCluster = rankingCluster.length;
    
    return { posicaoRede, totalRede, posicaoCluster, totalCluster };
  }, [dadosBrutos, filtroUnidade]);

  // Posição no Quarter selecionado
  const posicoesQuarter = useMemo(() => {
    if (!dadosBrutos || !filtroUnidade || !filtroQuarter) return { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0 };
    
    const dadosQuarter = dadosBrutos.filter(item => item.QUARTER === filtroQuarter);
    
    const rankingRede = dadosQuarter.map(item => ({
      unidade: item.nm_unidade,
      pontuacao: parseFloat((item['Pontuação com bonus'] || item['Pontuação com Bonus'] || '0').toString().replace(',', '.')),
      cluster: item.cluster
    })).sort((a, b) => b.pontuacao - a.pontuacao);
    
    const posicaoRede = rankingRede.findIndex(item => item.unidade === filtroUnidade) + 1;
    const totalRede = rankingRede.length;
    
    const clusterUnidade = itemSelecionado?.cluster || '';
    const rankingCluster = rankingRede.filter(item => item.cluster === clusterUnidade);
    const posicaoCluster = rankingCluster.findIndex(item => item.unidade === filtroUnidade) + 1;
    const totalCluster = rankingCluster.length;
    
    return { posicaoRede, totalRede, posicaoCluster, totalCluster };
  }, [dadosBrutos, filtroUnidade, filtroQuarter, itemSelecionado]);

  // Pontuações por quarter
  const pontuacoesPorQuarter = useMemo(() => {
    if (!dadosBrutos || !filtroUnidade) return [];
    
    return ['1', '2', '3', '4'].map(quarter => {
      const item = dadosBrutos.find(d => d.QUARTER === quarter && d.nm_unidade === filtroUnidade);
      if (!item) return { quarter, pontuacao: 0 };
      
      const pont = parseFloat((item['Pontuação com bonus'] || item['Pontuação com Bonus'] || '0').toString().replace(',', '.'));
      return { quarter, pontuacao: isNaN(pont) ? 0 : pont };
    });
  }, [dadosBrutos, filtroUnidade]);

  // Indicadores
  const indicadores = useMemo(() => {
    if (!itemSelecionado || !dadosBrutos) return [];
    
    const parseValor = (valor: any): number => {
      if (!valor) return 0;
      return parseFloat(valor.toString().replace(',', '.')) || 0;
    };

    const dadosFiltrados = dadosBrutos.filter(item => item.QUARTER === filtroQuarter);
    const cluster = itemSelecionado.cluster;
    const dadosCluster = dadosFiltrados.filter(item => item.cluster === cluster);

    const listaIndicadores = [
      { codigo: 'VVR', coluna: 'VVR', titulo: 'VVR', notaGeral: 'VALOR DE VENDAS REALIZADAS' },
      { codigo: 'MAC', coluna: 'MAC', titulo: 'MAC', notaGeral: 'META DE ATINGIMENTO DE CONTRATO' },
      { codigo: 'Endividamento', coluna: 'Endividamento', titulo: 'ENDIVIDAMENTO', notaGeral: 'PERCENTUAL DE ENDIVIDAMENTO' },
      { codigo: 'NPS', coluna: 'NPS', titulo: 'NPS SEMESTRAL', notaGeral: 'NET PROMOTER SCORE' },
      { codigo: 'MC_PERCENTUAL', coluna: 'MC %\n(entrega)', titulo: 'MC % (ENTREGA)', notaGeral: 'MARGEM DE CONTRIBUIÇÃO' },
      { codigo: 'E_NPS', coluna: 'Satisfação do colaborador - e-NPS', titulo: 'SATISFAÇÃO DO COLABORADOR', notaGeral: 'E-NPS' },
      { codigo: 'CONFORMIDADES', coluna: '*Conformidades', titulo: 'CONFORMIDADES', notaGeral: 'AUDITORIA DE CONFORMIDADES' },
      { codigo: 'RECLAME_AQUI', coluna: 'RECLAME AQUI', titulo: 'RECLAME AQUI', notaGeral: 'ÍNDICE RECLAME AQUI' },
      { codigo: 'BONUS', coluna: 'Bonus', titulo: 'BÔNUS', notaGeral: 'PONTOS DE BÔNUS' }
    ];

    return listaIndicadores.map(ind => {
      const pontuacaoUnidade = parseValor(itemSelecionado[ind.coluna]);
      
      const valoresRede = dadosFiltrados.map(item => parseValor(item[ind.coluna]));
      const melhorRede = valoresRede.length > 0 ? Math.max(...valoresRede) : 0;
      const itemMelhorRede = dadosFiltrados.find(item => parseValor(item[ind.coluna]) === melhorRede);
      
      const valoresCluster = dadosCluster.map(item => parseValor(item[ind.coluna]));
      const melhorCluster = valoresCluster.length > 0 ? Math.max(...valoresCluster) : 0;
      const itemMelhorCluster = dadosCluster.find(item => parseValor(item[ind.coluna]) === melhorCluster);

      return {
        ...ind,
        pontuacao: pontuacaoUnidade,
        melhorPontuacaoRede: melhorRede,
        melhorPontuacaoCluster: melhorCluster,
        unidadeMelhorRede: itemMelhorRede?.nm_unidade,
        unidadeMelhorCluster: itemMelhorCluster?.nm_unidade
      };
    });
  }, [itemSelecionado, dadosBrutos, filtroQuarter]);

  // Loading
  if (loading) {
    return (
      <PexLayout currentPage="resultados">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#212529',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #FF6600',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto',
            }} />
            <p style={{ marginTop: '16px', color: '#adb5bd' }}>Carregando...</p>
          </div>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
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
        filtroQuarter,
        filtroUnidade,
        filtroCluster,
        filtroConsultor,
        onQuarterChange: setFiltroQuarter,
        onUnidadeChange: setFiltroUnidade,
        onClusterChange: setFiltroCluster,
        onConsultorChange: setFiltroConsultor,
        listaQuarters,
        listaUnidades,
        listaClusters,
        listaConsultores,
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
        {itemSelecionado ? (
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
                  PONTUAÇÃO TOTAL <span style={{ color: '#FF6600' }}>({filtroUnidade})</span>
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
                    Média de <strong style={{ color: '#F8F9FA' }}>{filtroUnidade}</strong> em <span style={{ color: '#FF6600' }}>todos os quarters</span>
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
                    <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{filtroUnidade}</span>
                  </div>
                  {itemSelecionado.cluster && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Cluster:</span>
                      <span style={{ fontWeight: 600, color: '#F8F9FA' }}>{itemSelecionado.cluster}</span>
                    </div>
                  )}
                  {itemSelecionado['saude_franquia'] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Saúde da Franquia:</span>
                      <span style={{ 
                        fontWeight: 600,
                        ...((itemSelecionado['saude_franquia'].toString().toUpperCase() === 'UTI')
                          ? { color: '#FF4444' }
                          : (itemSelecionado['saude_franquia'].toString().toUpperCase().includes('ATENC'))
                            ? { color: '#FFC107' }
                            : (itemSelecionado['saude_franquia'].toString().toUpperCase().includes('SAUD'))
                              ? { color: '#00C853' }
                              : { color: '#F8F9FA' }
                        )
                      }}>
                        {itemSelecionado['saude_franquia']}
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
                    <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#FF6600' }}>
                      {itemSelecionado['Pontuação com bonus'] || itemSelecionado['Pontuação com Bonus'] || '0'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição na Rede:</span>
                    <span style={{ fontWeight: 700, color: '#F8F9FA' }}>
                      {posicoesQuarter.posicaoRede}º de {posicoesQuarter.totalRede}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Posição no Cluster:</span>
                    <span style={{ fontWeight: 700, color: '#F8F9FA' }}>
                      {posicoesQuarter.posicaoCluster}º de {posicoesQuarter.totalCluster}
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
                const dados = [
                  { name: 'score', value: quarterData.pontuacao },
                  { name: 'restante', value: Math.max(0, 100 - quarterData.pontuacao) }
                ];

                return (
                  <Card key={quarterData.quarter} titulo={`${quarterData.quarter}º Quarter`}>
                    <div style={{ width: '100%', overflow: 'hidden' }}>
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
                            <Cell fill={`url(#orangeGradient${quarterData.quarter})`} stroke="none" />
                            <Cell fill="#3a3f47" stroke="none" />
                            <Label
                              value={quarterData.pontuacao.toFixed(2)}
                              position="center"
                              style={{ fontSize: '1.8rem', fontWeight: '300', fill: '#F8F9FA' }}
                            />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px' }}>
                      <p style={{ fontSize: '13px', color: '#adb5bd' }}>Pontuação</p>
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
                    clusterSelecionado={filtroCluster}
                    consultorSelecionado={filtroConsultor}
                    nomeColunaConsultor={nomeColunaConsultor}
                  />
                </Card>
              </>
            )}

            {/* Gráfico de Evolução Mensal */}
            <div style={{ marginTop: '30px' }}>
              <GraficoEvolucao
                dadosHistorico={dadosHistorico}
                unidadeSelecionada={filtroUnidade}
                clusterSelecionado={filtroCluster}
                consultorSelecionado={filtroConsultor}
                nomeColunaConsultor={nomeColunaConsultor}
              />
            </div>
          </>
        ) : (
          <Card>
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', color: '#555' }}>📊</div>
              <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#F8F9FA' }}>
                Selecione um Quarter e Unidade
              </h3>
              <p style={{ color: '#adb5bd' }}>Use os filtros na sidebar para visualizar os resultados</p>
            </div>
          </Card>
        )}
      </div>
    </PexLayout>
  );
}
