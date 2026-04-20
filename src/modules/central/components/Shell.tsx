'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
}

/** Extrai o moduleId a partir do pathname (ex: /vendas/metas → vendas) */
function getModuleId(pathname: string): string | null {
  const moduleRoutes = [
    'pex', 'vendas', 'kpi', 'okr', 'gerencial', 'carteira',
    'gestao-rede', 'fluxo-projetado', 'projetos', 'branches', 'controle-modulos', 'funil-expansao',
    'analise-mercado', 'controle-usuarios',
  ];
  for (const mod of moduleRoutes) {
    if (pathname === `/${mod}` || pathname.startsWith(`/${mod}/`)) {
      return mod;
    }
  }
  return null;
}

export function Shell({ children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { allowedIds, loading: permissionsLoading } = useModuloPermissions(user?.username, user?.accessLevel);

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  // Identificar módulo da rota atual
  const moduleId = useMemo(() => getModuleId(router.pathname), [router.pathname]);

  // Verificar se o módulo é permitido
  const moduleAllowed = useMemo(() => {
    if (!moduleId) return true; // Não é rota de módulo (home, login, etc.)
    return allowedIds.has(moduleId);
  }, [moduleId, allowedIds]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-viva-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-dark-text-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redireciona se não autenticado (exceto página de login e reset-password)
  if (!isAuthenticated && router.pathname !== '/login' && router.pathname !== '/reset-password') {
    // Redireciona client-side
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  // Página de login e reset-password não usam Shell
  if (router.pathname === '/login' || router.pathname === '/reset-password') {
    return <>{children}</>;
  }

  // Guard de permissão por módulo: bloqueia renderização até verificar planilha
  if (moduleId) {
    // Ainda carregando permissões — mostra spinner
    if (permissionsLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: '#FF6600', borderTopColor: 'transparent' }} />
            <p className="mt-4" style={{ color: '#adb5bd' }}>Verificando permissões...</p>
          </div>
        </div>
      );
    }
    // Sem acesso — redireciona para home
    if (!moduleAllowed) {
      if (typeof window !== 'undefined') {
        router.replace('/');
      }
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
          <div className="text-center">
            <p className="text-lg" style={{ color: '#FF6600' }}>Acesso não permitido</p>
            <p className="mt-2" style={{ color: '#adb5bd' }}>Redirecionando...</p>
          </div>
        </div>
      );
    }
  }

  // Páginas do PEX são independentes (layout próprio)
  if (router.pathname.startsWith('/pex')) {
    return <>{children}</>;
  }

  // Páginas de Vendas são independentes (layout próprio)
  if (router.pathname.startsWith('/vendas')) {
    return <>{children}</>;
  }

  // Páginas de KPI são independentes (layout próprio)
  if (router.pathname.startsWith('/kpi')) {
    return <>{children}</>;
  }

  // Páginas de OKR são independentes (layout próprio)
  if (router.pathname.startsWith('/okr')) {
    return <>{children}</>;
  }

  // Páginas do Painel Gerencial são independentes (layout próprio)
  if (router.pathname.startsWith('/gerencial')) {
    return <>{children}</>;
  }

  // Páginas de Carteira são independentes (layout próprio)
  if (router.pathname.startsWith('/carteira')) {
    return <>{children}</>;
  }

  // Páginas de Gestão Rede são independentes (layout próprio)
  if (router.pathname.startsWith('/gestao-rede')) {
    return <>{children}</>;
  }

  // Páginas de Fluxo Projetado são independentes (layout próprio)
  if (router.pathname.startsWith('/fluxo-projetado')) {
    return <>{children}</>;
  }

  // Páginas de Projetos são independentes (layout próprio)
  if (router.pathname.startsWith('/projetos')) {
    return <>{children}</>;
  }

  // Páginas de Branches são independentes (layout próprio)
  if (router.pathname.startsWith('/branches')) {
    return <>{children}</>;
  }

  // Páginas de Controle de Módulos são independentes (layout próprio)
  if (router.pathname.startsWith('/controle-modulos')) {
    return <>{children}</>;
  }

  // Páginas de Funil de Expansão são independentes (layout próprio)
  if (router.pathname.startsWith('/funil-expansao')) {
    return <>{children}</>;
  }

  // Páginas de Análise de Mercado são independentes (layout próprio)
  if (router.pathname.startsWith('/analise-mercado')) {
    return <>{children}</>;
  }

  // Páginas de Controle de Usuários são independentes (layout próprio)
  if (router.pathname.startsWith('/controle-usuarios')) {
    return <>{children}</>;
  }

  // Página inicial com fundo especial
  const isHomePage = router.pathname === '/';

  return (
    <div 
      className="h-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#212529',
        backgroundImage: isHomePage ? 'url(/images/capa_site_nova_hd.png)' : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header no topo */}
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        isSidebarOpen={sidebarOpen}
      />

      {/* Container com Sidebar + Content */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Page content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Shell;
