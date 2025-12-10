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
  color?: string;
}

const allDashboards: Dashboard[] = [
  { id: 'vendas', name: 'Dashboard Vendas', description: 'Visão geral de vendas', path: '/vendas', icon: '💰', color: '#FF6600' },
  { id: 'pex', name: 'Dashboard PEX', description: 'Visão geral do PEX', path: '/pex', icon: '🏆', color: '#22c55e' },
];

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
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '10px',
        backgroundColor: isHovered ? 'rgba(255, 102, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
        border: dashboard.color ? `1px solid ${dashboard.color}` : '1px solid rgba(255, 255, 255, 0.1)',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span style={{ fontSize: '1.5rem' }}>{dashboard.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ 
          color: dashboard.color || '#e5e7eb', 
          fontWeight: 600, 
          fontSize: '1rem',
          fontFamily: "'Poppins', sans-serif",
        }}>
          {dashboard.name}
        </div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '2px' }}>
          {dashboard.description}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
