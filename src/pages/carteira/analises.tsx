/**
 * Página de Análises - Dashboard Carteira
 * Exibe KPIs, Tabela por Fundo e Tabela por Franquia
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useCarteiraData } from '@/modules/carteira/hooks';
import { useFiltrosCarteira } from '@/modules/carteira/context/FiltrosCarteiraContext';
import { 
  Sidebar, 
  Header, 
  Loading, 
  Footer, 
  KPICards,
  SaudeCards,
  TabelaFundos, 
  TabelaFranquias 
} from '@/modules/carteira/components';
import { PaginaCarteiraAtiva, FiltrosCarteira } from '@/modules/carteira/types';

export default function AnalisesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Usar filtros do Context (compartilhado entre páginas)
  const { filtros, updateFiltros } = useFiltrosCarteira();
  
  // Estados locais
  const [paginaAtiva, setPaginaAtiva] = useState<PaginaCarteiraAtiva>('analises');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hook de dados com filtros
  const { 
    kpis, 
    dadosPorFundo, 
    dadosPorFranquia, 
    filtrosOpcoes,
    loading, 
    error
  } = useCarteiraData(filtros);

  // Handler para atualização de filtros
  const handleFiltrosChange = (novosFiltros: Partial<FiltrosCarteira>) => {
    updateFiltros(novosFiltros);
  };

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Marcar cliente e carregar estado da sidebar
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('carteiraSidebarCollapsed');
    if (saved === 'true') {
      setSidebarCollapsed(true);
    }
  }, []);

  // Salvar estado da sidebar
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('carteiraSidebarCollapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isClient]);

  // Navegação entre páginas
  const handlePaginaChange = (pagina: PaginaCarteiraAtiva) => {
    setPaginaAtiva(pagina);
    if (pagina === 'historico') {
      router.push('/carteira/historico');
    }
  };

  // Loading de autenticação
  if (authLoading || !isAuthenticated) {
    return <Loading mensagem="Verificando autenticação..." />;
  }

  // Loading inicial de dados
  if (loading && !isClient) {
    return <Loading mensagem="Carregando dados da carteira..." />;
  }

  return (
    <>
      <Head>
        <title>Análises | Dashboard Carteira</title>
      </Head>

      <div 
        className="min-h-screen"
        style={{ backgroundColor: '#212529' }}
      >
        {/* Sidebar */}
        <Sidebar
          paginaAtiva={paginaAtiva}
          onPaginaChange={handlePaginaChange}
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          filtros={filtros}
          filtrosOpcoes={filtrosOpcoes}
          onFiltrosChange={handleFiltrosChange}
        />

        {/* Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Conteúdo Principal */}
        <main
          style={{
            marginLeft: sidebarCollapsed ? '60px' : '300px',
            padding: '24px',
            transition: 'margin-left 0.3s',
            paddingBottom: '48px',
          }}
        >
          {/* Erro */}
          {error && (
            <div 
              className="mb-6 p-4 rounded-lg"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}
            >
              <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
            </div>
          )}

          {/* KPIs */}
          <section className="mb-8">
            <h2 className="section-title">
              Indicadores Principais
            </h2>
            <KPICards kpis={kpis} loading={loading} />
          </section>

          {/* Fundos por Saúde */}
          <section className="mb-8">
            <SaudeCards fundosPorSaude={kpis.fundosPorSaude} loading={loading} />
          </section>

          {/* Tabelas */}
          <div className="grid grid-cols-1 gap-8">
            {/* Tabela por Fundo */}
            <section>
              <TabelaFundos dados={dadosPorFundo} loading={loading} />
            </section>

            {/* Tabela por Franquia */}
            <section>
              <TabelaFranquias dados={dadosPorFranquia} loading={loading} />
            </section>
          </div>
        </main>

        {/* Footer */}
        <Footer sidebarCollapsed={sidebarCollapsed} />
      </div>
    </>
  );
}
