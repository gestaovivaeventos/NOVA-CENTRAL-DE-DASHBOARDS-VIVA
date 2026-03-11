'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';
import {
  Header,
  Sidebar,
  Footer,
  Loading,
  KPICards,
  TabelaProjetos,
  NovoProjetoFormulario,
  FilterPanel,
  SectionTitle,
} from '../../modules/projetos/components';
import { useProjetosData } from '../../modules/projetos/hooks';

const MOBILE_BREAKPOINT = 768;

export default function ProjetosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { allowedIds, loading: permissionsLoading } = useModuloPermissions(user?.username, user?.accessLevel);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar autenticação e permissão do módulo pela planilha
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && user && !permissionsLoading && !allowedIds.has('projetos')) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router, user, permissionsLoading, allowedIds]);

  const {
    data,
    loading,
    error,
    filtros,
    setFiltros,
    adicionarProjeto,
    atualizarProjeto,
    editarProjetoCompleto,
    inativarProjeto,
    refetch,
  } = useProjetosData();

  const handleMobileMenuToggle = useCallback((open: boolean) => {
    setIsMobileMenuOpen(open);
  }, []);

  // Loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>Painel de Projetos | Carregando...</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex items-center justify-center">
          <Loading mensagem="Carregando projetos..." />
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Head>
          <title>Painel de Projetos | Erro</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex flex-col items-center justify-center">
          <div className="text-red-400 text-center">
            <p className="text-4xl mb-4">❌</p>
            <p className="text-xl font-semibold mb-2">Erro ao carregar dados</p>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={refetch}
              className="btn-primary"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>Painel de Projetos | Sem dados</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex items-center justify-center">
          <p className="text-text-secondary">Nenhum dado disponível</p>
        </div>
      </>
    );
  }

  const handleNovoProjeto = (form: any) => {
    const criadoPor = user?.firstName || user?.username || 'Usuário';
    adicionarProjeto(form, criadoPor);
  };

  // No mobile, sidebar é overlay — sem marginLeft
  const contentMargin = isMobile ? '0px' : sidebarCollapsed ? '60px' : '300px';

  return (
    <>
      <Head>
        <title>Painel de Projetos | Viva Eventos</title>
        <meta name="description" content="Painel Gerencial de Projetos - Acompanhamento de portfólio" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          isMobile={isMobile}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={handleMobileMenuToggle}
        >
          <FilterPanel
            filtros={filtros}
            onFiltrosChange={setFiltros}
            responsaveis={data.responsaveis}
            onRefresh={refetch}
          />
        </Sidebar>

        {/* Main Content */}
        <div
          className="flex-1 min-h-screen bg-dark-primary transition-all duration-300 overflow-x-hidden"
          style={{ marginLeft: contentMargin }}
        >
          <Header sidebarCollapsed={sidebarCollapsed} isMobile={isMobile} />

          <main className={isMobile ? 'px-3 py-3 pb-10' : 'px-5 py-5 pb-12'}>
            {/* Cards Indicadores (Visão Executiva) */}
            <SectionTitle
              title="Visão Executiva"
              subtitle="Resumo geral do portfólio de projetos"
              icon="📊"
            />
            <KPICards resumo={data.resumo} />

            {/* Botão Novo Projeto + Modal */}
            <NovoProjetoFormulario
              onSubmit={handleNovoProjeto}
              responsaveis={data.responsaveis}
            />

            {/* Tabela de Acompanhamento */}
            <SectionTitle
              title="Acompanhamento de Projetos"
              subtitle={`${data.projetos.length} projeto(s) encontrado(s)`}
              icon="📋"
            />
            <TabelaProjetos 
              projetos={data.projetos} 
              onEdit={atualizarProjeto}
              onEditFull={editarProjetoCompleto}
              onInativar={inativarProjeto}
              responsaveis={data.responsaveis}
              currentUserName={user?.firstName || user?.username || 'Usuário'}
            />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}
