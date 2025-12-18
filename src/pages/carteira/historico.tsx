/**
 * Página de Histórico - Dashboard Carteira
 * Exibe gráficos de evolução mensal
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
  GraficosHistoricos 
} from '@/modules/carteira/components';
import { PaginaCarteiraAtiva, FiltrosCarteira } from '@/modules/carteira/types';

export default function HistoricoPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Usar filtros do Context (compartilhado entre páginas)
  const { filtros, updateFiltros } = useFiltrosCarteira();
  
  // Estados locais
  const [paginaAtiva, setPaginaAtiva] = useState<PaginaCarteiraAtiva>('historico');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Hook de dados com filtros
  const { 
    historico, 
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
    if (pagina === 'analises') {
      router.push('/carteira/analises');
    }
  };

  // Loading de autenticação
  if (authLoading || !isAuthenticated) {
    return <Loading mensagem="Verificando autenticação..." />;
  }

  // Loading inicial de dados
  if (loading && !isClient) {
    return <Loading mensagem="Carregando dados históricos..." />;
  }

  return (
    <>
      <Head>
        <title>Histórico | Dashboard Carteira</title>
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

          {/* Gráficos */}
          <section>
            <GraficosHistoricos dados={historico} loading={loading} />
          </section>
        </main>

        {/* Footer */}
        <Footer sidebarCollapsed={sidebarCollapsed} />
      </div>
    </>
  );
}
