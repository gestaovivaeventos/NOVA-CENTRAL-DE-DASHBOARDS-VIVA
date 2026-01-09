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
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  Users
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
import { 
  FRANQUIAS_MOCK, 
  calcularResumoRede, 
  montarArvoreHierarquica,
  CORES 
} from '@/modules/gestao-rede/utils';

export default function GestaoRedeDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Dados mockados
  const franquias = FRANQUIAS_MOCK;
  const resumo = useMemo(() => calcularResumoRede(franquias), [franquias]);
  const arvoreHierarquica = useMemo(() => montarArvoreHierarquica(franquias), [franquias]);

  // Estado para filtro de tabela (legado)
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
  
  // Estado para filtros avançados
  const [filtros, setFiltros] = useState<FiltrosGestaoRede>({
    maturidade: [],
    classificacao: [],
    consultor: [],
    flags: [],
  });

  // Lista de consultores disponíveis
  const consultoresDisponiveis = useMemo(() => {
    const consultores = [...new Set(franquias.map(f => f.responsavel))];
    return consultores.sort();
  }, [franquias]);
  
  // Franquias filtradas (para cards KPI)
  const franquiasFiltradas = useMemo(() => {
    if (filtroStatus === 'TODOS') return franquias;
    return franquias.filter(f => f.status === filtroStatus);
  }, [franquias, filtroStatus]);

  // Dados para gráficos
  const dadosStatusGeral = [
    { nome: 'Ativas', valor: resumo.ativas, cor: CORES.ativas },
    { nome: 'Inativas', valor: resumo.inativas, cor: CORES.inativas },
  ];

  const dadosOperacao = [
    { nome: 'Em Implantação', valor: resumo.emImplantacao, cor: CORES.implantacao },
    { nome: 'Em Operação', valor: resumo.emOperacao, cor: CORES.operacao },
  ];

  const dadosMaturidade = [
    { nome: '1º Ano Op.', valor: resumo.incubacao1, cor: CORES.incubacao1 },
    { nome: '2º Ano Op.', valor: resumo.incubacao2, cor: CORES.incubacao2 },
    { nome: '3º Ano Op.', valor: resumo.incubacao3, cor: CORES.incubacao3 },
    { nome: 'Maduras', valor: resumo.maduras, cor: CORES.maduras },
  ];

  const dadosBarrasStatus = [
    { nome: 'Maduras', valor: resumo.maduras, cor: CORES.maduras },
    { nome: 'Em Implantação', valor: resumo.emImplantacao, cor: CORES.implantacao },
    { nome: '1º/2º/3º Ano Op.', valor: resumo.emIncubacao, cor: CORES.incubacao },
    { nome: 'Inativas', valor: resumo.inativas, cor: CORES.inativas },
  ];

  // Dados para gráfico de classificação PEX
  const franquiasEmOperacao = franquias.filter(
    f => f.status === 'ATIVA' && f.statusOperacao === 'OPERACAO'
  );
  
  const dadosClassificacaoPEX = [
    { nome: 'TOP Performance', valor: franquiasEmOperacao.filter(f => f.classificacaoPEX === 'TOP_PERFORMANCE').length, cor: '#28a745' },
    { nome: 'Performando', valor: franquiasEmOperacao.filter(f => f.classificacaoPEX === 'PERFORMANDO').length, cor: '#20c997' },
    { nome: 'Atenção', valor: franquiasEmOperacao.filter(f => f.classificacaoPEX === 'ATENCAO').length, cor: '#ffc107' },
    { nome: 'UTI Recuperação', valor: franquiasEmOperacao.filter(f => f.classificacaoPEX === 'UTI_RECUPERACAO').length, cor: '#dc3545' },
    { nome: 'UTI Repasse', valor: franquiasEmOperacao.filter(f => f.classificacaoPEX === 'UTI_REPASSE').length, cor: '#c0392b' },
  ];

  if (authLoading) {
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
        consultoresDisponiveis={consultoresDisponiveis}
      >
        {/* Header */}
        <div style={{ backgroundColor: '#212529' }}>
          <div className="container mx-auto px-4 py-6">
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

              {/* Info badge */}
              <div style={{
                backgroundColor: '#FF660020',
                border: '1px solid #FF6600',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Building2 size={18} style={{ color: '#FF6600' }} />
                <span style={{ color: '#FF6600', fontWeight: 600, fontSize: '0.9rem' }}>
                  Dados Mockados para Validação
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="container mx-auto px-4 py-6">
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

          {/* Grid de 2 colunas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Hierarquia em Árvore */}
            <HierarquiaTree 
              data={arvoreHierarquica}
              expandirApenasAtivas={true}
            />

            {/* Gráficos lado a lado */}
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

          {/* Gráfico de Barras - Visão Geral */}
          <div style={{ marginBottom: '24px' }}>
            <GraficoBarras
              dados={dadosBarrasStatus}
              titulo="Visão Comparativa por Categoria"
              mostrarValores={true}
              mostrarPorcentagem={true}
            />
          </div>

          {/* Seção Classificação PEX */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr', 
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Gráfico Donut - Classificação PEX */}
            <GraficoDonut
              dados={dadosClassificacaoPEX}
              titulo="Distribuição por Classificação PEX"
              valorCentral={franquiasEmOperacao.length}
              labelCentral="Em Operação"
              tamanho={200}
            />

            {/* Gráfico de Barras - Classificação PEX */}
            <GraficoBarras
              dados={dadosClassificacaoPEX}
              titulo="Quantidade de Franquias por Classificação PEX"
              mostrarValores={true}
              mostrarPorcentagem={true}
            />
          </div>

          {/* Tabela Kanban - Classificação PEX */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaClassificacaoPEX franquias={franquias} />
          </div>

          {/* Tabela - Segmento de Mercado */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaSegmentoMercado franquias={franquias} />
          </div>

          {/* Tabela - Flags Estruturais */}
          <div style={{ marginBottom: '24px' }}>
            <TabelaFlags franquias={franquias} />
          </div>

          {/* Cards de Anos de Operação */}
          <div style={{
            backgroundColor: '#343A40',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{
              color: '#adb5bd',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #555',
              fontFamily: 'Poppins, sans-serif',
            }}>
              Franquias em Operação - Por Tempo de Atividade
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px'
            }}>
              {[
                { fase: 1, valor: resumo.incubacao1, cor: CORES.incubacao1, titulo: '1º Ano de Operação', descricao: '0 a 12 meses' },
                { fase: 2, valor: resumo.incubacao2, cor: CORES.incubacao2, titulo: '2º Ano de Operação', descricao: '12 a 24 meses' },
                { fase: 3, valor: resumo.incubacao3, cor: CORES.incubacao3, titulo: '3º Ano de Operação', descricao: '24 a 36 meses' },
                { fase: 4, valor: resumo.maduras, cor: CORES.maduras, titulo: 'Maduras', descricao: '+36 meses' },
              ].map((item) => (
                <div 
                  key={item.fase}
                  style={{
                    backgroundColor: '#212529',
                    borderRadius: '10px',
                    padding: '16px',
                    borderLeft: `4px solid ${item.cor}`,
                    transition: 'transform 0.2s',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      color: '#adb5bd',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}>
                      {item.titulo}
                    </span>
                    <span style={{
                      backgroundColor: item.cor,
                      color: '#000',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    }}>
                      {item.valor}
                    </span>
                  </div>
                  <p style={{
                    color: '#6c757d',
                    fontSize: '0.75rem',
                    margin: 0,
                  }}>
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>
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
