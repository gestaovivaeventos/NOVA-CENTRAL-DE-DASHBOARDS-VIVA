/**
 * Gestão Rede - Dashboard Principal
 * Visualização da estrutura hierárquica das franquias
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  Building2, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  GestaoRedeLayout,
  KPICard,
  HierarquiaTree,
  GraficoDonut,
  GraficoBarras,
  TabelaFranquias,
  TabelaClassificacaoPEX,
  TabelaSegmentoMercado,
  TabelaFlags,
  Footer,
  FiltrosGestaoRede,
} from '@/modules/gestao-rede';
import { useGestaoRede } from '@/modules/gestao-rede/hooks';
import { 
  calcularResumoRede, 
  montarArvoreHierarquica,
  CORES 
} from '@/modules/gestao-rede/utils';

export default function GestaoRedeDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Hook para buscar dados reais da API
  const { franquias, isLoading, error, refetch } = useGestaoRede();
  
  // Verificar autenticação e nível de acesso
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    // Franqueados (accessLevel = 0) só podem acessar o PEX
    if (!authLoading && user && user.accessLevel === 0) {
      router.push('/pex');
    }
  }, [isAuthenticated, authLoading, router, user]);

  // Calcular resumo e árvore hierárquica baseado nos dados
  const resumo = useMemo(() => calcularResumoRede(franquias), [franquias]);
  const arvoreHierarquica = useMemo(() => montarArvoreHierarquica(franquias), [franquias]);

  // Estado para filtro de tabela (legado)
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
  
  // Estado para filtros avançados
  const [filtros, setFiltros] = useState<FiltrosGestaoRede>({
    maturidade: [],
    classificacao: [],
    flags: [],
  });
  
  // Franquias filtradas (para cards KPI)
  const franquiasFiltradas = useMemo(() => {
    if (filtroStatus === 'TODOS') return franquias;
    return franquias.filter(f => f.status === filtroStatus);
  }, [franquias, filtroStatus]);

  // Dados para gráficos
  const dadosStatusGeral = [
    { nome: 'Ativas', valor: resumo.ativas, cor: '#FF6600' },
    { nome: 'Inativas', valor: resumo.inativas, cor: '#c0392b' },
  ];

  const dadosMaturidade = [
    { nome: '1º Ano Op.', valor: resumo.incubacao1, cor: '#FF6600' },
    { nome: '2º Ano Op.', valor: resumo.incubacao2, cor: '#cc5200' },
    { nome: '3º Ano Op.', valor: resumo.incubacao3, cor: '#994d00' },
    { nome: 'Maduras', valor: resumo.maduras, cor: '#663300' },
  ];

  const dadosBarrasStatus = [
    { nome: 'Maduras', valor: resumo.maduras, cor: CORES.maduras },
    { nome: 'Em Implantação', valor: resumo.emImplantacao, cor: CORES.implantacao },
    { nome: '1º/2º/3º Ano Op.', valor: resumo.emIncubacao, cor: CORES.incubacao },
    { nome: 'Inativas', valor: resumo.inativas, cor: CORES.inativas },
  ];

  // Dados para gráfico de classificação PEX - Paleta profissional
  const franquiasEmOperacao = franquias.filter(
    f => f.status === 'ATIVA' && f.maturidade !== 'IMPLANTACAO'
  );
  
  const dadosClassificacaoPEX = [
    { nome: 'TOP Performance', valor: franquiasEmOperacao.filter(f => f.saude === 'TOP_PERFORMANCE').length, cor: '#2980b9' },
    { nome: 'Performando', valor: franquiasEmOperacao.filter(f => f.saude === 'PERFORMANDO').length, cor: '#27ae60' },
    { nome: 'Em Consolidação', valor: franquiasEmOperacao.filter(f => f.saude === 'EM_CONSOLIDACAO').length, cor: '#e67e22' },
    { nome: 'Atenção', valor: franquiasEmOperacao.filter(f => f.saude === 'ATENCAO').length, cor: '#f1c40f' },
    { nome: 'UTI', valor: franquiasEmOperacao.filter(f => f.saude === 'UTI').length, cor: '#c0392b' },
    { nome: 'UTI Recuperação', valor: franquiasEmOperacao.filter(f => f.saude === 'UTI_RECUPERACAO').length, cor: '#943126' },
    { nome: 'UTI Repasse', valor: franquiasEmOperacao.filter(f => f.saude === 'UTI_REPASSE').length, cor: '#6c2134' },
    { nome: 'Sem Avaliação', valor: franquiasEmOperacao.filter(f => f.saude === 'SEM_AVALIACAO').length, cor: '#6c757d' },
  ].filter(d => d.valor > 0);

  if (authLoading || isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#adb5bd',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FF6600',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Carregando...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão Rede - Viva Eventos</title>
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>

      <GestaoRedeLayout 
        currentPage="dashboard"
        filtros={filtros}
        onFiltrosChange={setFiltros}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#212529' }}>
          <div style={{ padding: '24px 24px 24px 24px' }}>
            <div 
              style={{
                backgroundColor: '#343A40',
                padding: '20px 30px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
                borderBottom: '3px solid #FF6600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div className="flex items-center space-x-6">
                <div style={{ position: 'relative', width: '140px', height: '50px' }}>
                  <Image 
                    src="/images/logo_viva.png" 
                    alt="Viva Eventos" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
                
                <div className="border-l border-gray-600 pl-6 h-14 flex flex-col justify-center">
                  <h1 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Gestão Rede
                  </h1>
                  <span style={{ 
                    color: '#adb5bd', 
                    fontSize: '0.75rem',
                    fontFamily: 'Poppins, sans-serif' 
                  }}>
                    Visão Geral da Rede de Franquias
                  </span>
                </div>
              </div>

              {/* Mensagem de erro, se houver */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {error && (
                  <div style={{
                    backgroundColor: '#c0392b20',
                    border: '1px solid #c0392b',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <AlertCircle size={18} style={{ color: '#c0392b' }} />
                    <span style={{ color: '#c0392b', fontSize: '0.85rem' }}>
                      Erro ao carregar dados
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div style={{ padding: '0 24px 24px 24px' }}>
          {/* KPIs Principais - Linha única */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <KPICard
              titulo="Franquias Ativas"
              valor={resumo.ativas}
              cor={CORES.primaria}
              icone={<Building2 size={32} />}
              subtitulo="Rede ativa atual"
            />
            <KPICard
              titulo="Franquias Inativas"
              valor={resumo.inativas}
              cor={CORES.inativas}
              icone={<XCircle size={32} />}
              onClick={() => setFiltroStatus(filtroStatus === 'INATIVA' ? 'TODOS' : 'INATIVA')}
              selecionado={filtroStatus === 'INATIVA'}
              subtitulo="Encerradas"
            />
            <KPICard
              titulo="Em Implantação"
              valor={resumo.emImplantacao}
              total={resumo.ativas}
              porcentagem={(resumo.emImplantacao / resumo.ativas) * 100}
              cor={CORES.implantacao}
              icone={<Clock size={32} />}
              subtitulo="das ativas"
            />
            <KPICard
              titulo="Em Operação"
              valor={resumo.emOperacao}
              total={resumo.ativas}
              porcentagem={resumo.ativas > 0 ? (resumo.emOperacao / resumo.ativas) * 100 : 0}
              cor={CORES.operacao}
              icone={<TrendingUp size={32} />}
              subtitulo="das ativas"
            />
            <KPICard
              titulo="Franquias Maduras"
              valor={resumo.maduras}
              total={resumo.emOperacao}
              porcentagem={resumo.emOperacao > 0 ? (resumo.maduras / resumo.emOperacao) * 100 : 0}
              cor={CORES.maduras}
              icone={<Zap size={32} />}
              subtitulo="em operação"
            />
          </div>

          {/* Grid Principal - Hierarquia à esquerda, Gráficos Donut à direita */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Hierarquia em Árvore */}
            <HierarquiaTree 
              data={arvoreHierarquica}
              expandirApenasAtivas={true}
            />

            {/* Gráficos Donut empilhados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Gráfico Donut - Status Geral */}
              <GraficoDonut
                dados={dadosStatusGeral}
                titulo="Distribuição por Status"
                valorCentral={resumo.totalFranquias}
                labelCentral="Total"
                tamanho={180}
              />

              {/* Gráfico Donut - Maturidade */}
              <GraficoDonut
                dados={dadosMaturidade}
                titulo="Distribuição por Maturidade"
                valorCentral={resumo.emOperacao}
                labelCentral="Em Operação"
                tamanho={180}
              />
            </div>
          </div>

          {/* Tabela Kanban - Classificação PEX */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaClassificacaoPEX franquias={franquias} onRefresh={refetch} />
          </div>

          {/* Tabela - Segmento de Mercado */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaSegmentoMercado franquias={franquias} />
          </div>

          {/* Tabela - Flags Estruturais */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaFlags franquias={franquias} />
          </div>

          {/* Tabela de Franquias */}
          <TabelaFranquias 
            franquias={franquiasFiltradas}
            filtros={filtros}
            titulo={
              filtroStatus === 'TODOS' 
                ? 'Todas as Franquias' 
                : filtroStatus === 'ATIVA' 
                  ? 'Franquias Ativas' 
                  : 'Franquias Inativas'
            }
          />

          {/* Footer */}
          <Footer />
        </div>
      </GestaoRedeLayout>
    </>
  );
}
