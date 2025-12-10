'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';

// Função para pré-carregar dados de vendas em background
const prefetchVendasData = () => {
  // Faz as requisições em paralelo para popular o cache do servidor
  const endpoints = [
    '/api/vendas/sales',
    '/api/vendas/metas',
    '/api/vendas/fundos',
    '/api/vendas/funil',
  ];
  
  endpoints.forEach(endpoint => {
    fetch(endpoint).catch(() => {
      // Ignora erros - é apenas prefetch
    });
  });
};

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Pré-carregar dados de vendas quando usuário está autenticado
  // Isso popula o cache do servidor para quando o usuário acessar o dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Pequeno delay para não competir com recursos da página atual
      const timer = setTimeout(() => {
        prefetchVendasData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loading enquanto verifica auth
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto" style={{ borderColor: '#FF6600' }}></div>
          <p className="mt-4 text-lg" style={{ color: '#adb5bd' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Início | Central de Dashboards</title>
      </Head>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Welcome Card */}
        <div style={{
          background: 'rgba(33, 37, 41, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}>
          <h1 style={{ 
            fontFamily: "'Poppins', sans-serif",
            fontSize: '2.2em', 
            fontWeight: 700,
            background: 'linear-gradient(180deg, #ffffff, #e9e9e9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Olá, {user?.firstName || 'Usuário'}!
          </h1>
          <h2 style={{ 
            color: '#FF6600', 
            fontSize: '1.5em', 
            fontWeight: 600, 
            marginBottom: '20px',
            fontFamily: "'Poppins', sans-serif",
          }}>
            Bem-vindo(a) à Central de Dashboards Viva Eventos!
          </h2>
          
          <p style={{ 
            color: '#ced4da', 
            fontSize: '1.05em', 
            lineHeight: '1.7',
            maxWidth: '700px',
          }}>
            Use o menu à esquerda para explorar os dashboards disponíveis.
          </p>
        </div>
      </div>
    </>
  );
}
