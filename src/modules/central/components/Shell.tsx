'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Fechar sidebar ao mudar de rota (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

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

  // Página inicial com fundo especial
  const isHomePage = router.pathname === '/';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#212529',
        backgroundImage: isHomePage ? 'url(/images/capa_site.png)' : 'none',
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
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0">
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
