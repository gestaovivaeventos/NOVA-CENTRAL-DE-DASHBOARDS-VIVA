'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Função para pré-carregar dados de vendas em background
const prefetchVendasData = () => {
  const endpoints = [
    '/api/vendas/sales',
    '/api/vendas/metas',
    '/api/vendas/fundos',
    '/api/vendas/funil',
  ];
  
  endpoints.forEach(endpoint => {
    fetch(endpoint).catch(() => {});
  });
};

// Definição dos dashboards para favoritos (mesmos IDs da Sidebar)
interface Dashboard {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
}

const allDashboards: Dashboard[] = [
  { id: 'kpi', name: 'Dashboard KPIs', description: 'Indicadores de Performance', path: '/kpi', icon: 'chart' },
  { id: 'okr', name: 'Dashboard OKRs', description: 'Objetivos e Resultados-Chave', path: '/okr', icon: 'target' },
  { id: 'gerencial', name: 'Painel Gerencial', description: 'Visão consolidada de KPIs e OKRs', path: '/gerencial', icon: 'trophy' },
  { id: 'vendas', name: 'Dashboard Vendas', description: 'Visão geral de vendas', path: '/vendas', icon: 'money' },
  { id: 'pex', name: 'Dashboard PEX', description: 'Visão geral do PEX', path: '/pex', icon: 'dashboard' },
  { id: 'carteira', name: 'Dashboard Carteira', description: 'Análise de fundos e franquias', path: '/carteira', icon: 'wallet' },
];

// Ícones SVG inline (mesmos da Sidebar)
const dashboardIcons: Record<string, JSX.Element> = {
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  money: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  target: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
};

// Ícone de estrela (favorito)
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg 
    className={`w-4 h-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} 
    fill={filled ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// Card de dashboard favorito
const FavoriteCard = ({ 
  dashboard, 
  onRemove 
}: { 
  dashboard: Dashboard; 
  onRemove: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={dashboard.path}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px 12px',
        borderRadius: '8px',
        backgroundColor: isHovered ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
        border: '1px solid rgba(255, 102, 0, 0.3)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
        minHeight: '90px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ color: isHovered ? '#FF6600' : '#9ca3af', opacity: 0.9 }}>
        {dashboardIcons[dashboard.icon] || dashboardIcons.chart}
      </span>
      <div style={{ 
        color: isHovered ? '#FF6600' : '#9ca3af', 
        fontWeight: 500, 
        fontSize: '0.95rem',
        fontFamily: "'Poppins', sans-serif",
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {dashboard.name}
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        style={{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Remover dos favoritos"
      >
        <StarIcon filled={true} />
      </button>
    </Link>
  );
};

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const savedFavorites = localStorage.getItem('dashboard-favorites');
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch {
          setFavorites([]);
        }
      }
    };

    loadFavorites();

    // Escutar evento de atualização de favoritos da Sidebar
    const handleFavoritesUpdated = (event: CustomEvent<string[]>) => {
      setFavorites(event.detail);
    };

    window.addEventListener('favorites-updated', handleFavoritesUpdated as EventListener);
    
    return () => {
      window.removeEventListener('favorites-updated', handleFavoritesUpdated as EventListener);
    };
  }, []);

  // Remover favorito
  const removeFavorite = (id: string) => {
    const newFavorites = favorites.filter(f => f !== id);
    setFavorites(newFavorites);
    localStorage.setItem('dashboard-favorites', JSON.stringify(newFavorites));
    // Disparar evento para sincronizar com Sidebar
    window.dispatchEvent(new CustomEvent('favorites-updated', { detail: newFavorites }));
  };

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Pré-carregar dados de vendas
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const timer = setTimeout(() => {
        prefetchVendasData();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  // Dashboards favoritos
  const favoriteDashboards = useMemo(() => {
    return allDashboards.filter(d => favorites.includes(d.id));
  }, [favorites]);

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

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
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
            Marque seus favoritos clicando na ⭐ para acesso rápido.
          </p>
        </div>

        {/* Favoritos */}
        {favoriteDashboards.length > 0 && (
          <div style={{
            background: 'rgba(33, 37, 41, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{
              color: '#fbbf24',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <StarIcon filled={true} /> Meus Favoritos
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
            }}>
              {favoriteDashboards.map((dashboard) => (
                <FavoriteCard
                  key={dashboard.id}
                  dashboard={dashboard}
                  onRemove={() => removeFavorite(dashboard.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há favoritos */}
        {favoriteDashboards.length === 0 && (
          <div style={{
            background: 'rgba(33, 37, 41, 0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '30px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: '8px' }}>
              Você ainda não tem dashboards favoritos.
            </p>
            <p style={{ color: '#4b5563', fontSize: '0.9rem' }}>
              Use a ⭐ no menu lateral para adicionar favoritos.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
