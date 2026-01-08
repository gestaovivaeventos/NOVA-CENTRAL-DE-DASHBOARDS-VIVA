'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Search, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Definição de dashboard
interface Dashboard {
  id: string;
  label: string;
  path: string;
  icon: string;
}

// Definição de grupo
interface DashboardGroup {
  id: string;
  name: string;
  dashboards: Dashboard[];
}

// Grupos de dashboards
const getDashboardGroups = (accessLevel: number): DashboardGroup[] => {
  const groups: DashboardGroup[] = [
    {
      id: 'gestao-resultados',
      name: 'Gestão por Resultados',
      dashboards: [
        { id: 'kpi', label: 'Dashboard KPIs', path: '/kpi', icon: 'chart' },
        { id: 'okr', label: 'Dashboard OKRs', path: '/okr', icon: 'target' },
        { id: 'gerencial', label: 'Painel Gerencial', path: '/gerencial', icon: 'trophy' },
        { id: 'gestao-rede', label: 'Gestão Rede', path: '/gestao-rede', icon: 'network' },
      ],
    },
    {
      id: 'dashboards-gerais',
      name: 'Dashboards Gerais',
      dashboards: [
        { id: 'vendas', label: 'Dashboard Vendas', path: '/vendas', icon: 'money' },
        { id: 'pex', label: 'Dashboard PEX', path: '/pex', icon: 'dashboard' },
        { id: 'carteira', label: 'Dashboard Carteira', path: '/carteira', icon: 'wallet' },
      ],
    },
  ];

  return groups;
};

// Ícones SVG inline
const icons: Record<string, JSX.Element> = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  money: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  funnel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  wallet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  network: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  results: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  config: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  starFilled: (
    <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

// Componente de Grupo colapsável
const CollapsibleGroup = ({ 
  group, 
  searchTerm,
  favorites,
  onToggleFavorite,
  onClose,
  router,
}: { 
  group: DashboardGroup; 
  searchTerm: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  // Filtrar dashboards baseado na pesquisa
  const filteredDashboards = useMemo(() => {
    if (!searchTerm) return group.dashboards;
    const search = searchTerm.toLowerCase();
    return group.dashboards.filter(d => 
      d.label.toLowerCase().includes(search)
    );
  }, [group.dashboards, searchTerm]);

  // Expandir automaticamente quando há busca com resultados
  useEffect(() => {
    if (searchTerm && filteredDashboards.length > 0) {
      setIsOpen(true);
    }
  }, [searchTerm, filteredDashboards.length]);

  // Não renderizar se não houver dashboards após filtro
  if (filteredDashboards.length === 0) return null;

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Header do grupo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '10px 12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        <span style={{ 
          color: '#9ca3af', 
          fontWeight: 600, 
          fontSize: '0.8rem',
          fontFamily: "'Poppins', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {group.name}
        </span>
        <span style={{ 
          color: '#6b7280',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          {icons.chevron}
        </span>
      </button>

      {/* Lista de dashboards */}
      {isOpen && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px',
          marginTop: '4px',
        }}>
          {filteredDashboards.map((dashboard) => {
            const active = isActive(dashboard.path);
            const isFavorite = favorites.includes(dashboard.id);
            
            return (
              <div
                key={dashboard.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  backgroundColor: active ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                  border: active ? '1px solid #FF6600' : '1px solid rgba(75, 85, 99, 0.5)',
                  boxShadow: !active ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                  transition: 'all 0.2s',
                  height: '42px',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Link
                  href={dashboard.path}
                  onClick={() => onClose()}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    color: active ? '#FF6600' : '#9ca3af',
                    textDecoration: 'none',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.85rem',
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.7 }}>
                    {icons[dashboard.icon] || icons.dashboard}
                  </span>
                  <span>{dashboard.label}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite(dashboard.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isFavorite ? '#fbbf24' : '#4b5563',
                    transition: 'color 0.2s',
                  }}
                  title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  {isFavorite ? icons.starFilled : icons.star}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const dashboardGroups = getDashboardGroups(user?.accessLevel || 0);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('dashboard-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Salvar favoritos no localStorage e disparar evento para atualizar outras páginas
  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('dashboard-favorites', JSON.stringify(newFavorites));
    
    // Disparar evento customizado para notificar outras páginas
    window.dispatchEvent(new CustomEvent('favorites-updated', { detail: newFavorites }));
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
        }}
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header mobile */}
        <div 
          style={{ borderBottom: '1px solid #333' }}
          className="h-16 flex items-center justify-between px-4 lg:hidden"
        >
          <span className="text-dark-text font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-dark-bg text-dark-text-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-80px)]">
          {/* Barra de Pesquisa */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FF6600',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Buscar dashboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                borderRadius: '10px',
                border: '2px solid #404854',
                background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.05) 0%, rgba(255, 102, 0, 0.02) 100%)',
                color: '#e5e7eb',
                fontSize: '0.9rem',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FF6600';
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 102, 0, 0.12) 0%, rgba(255, 102, 0, 0.06) 100%)';
                e.target.style.boxShadow = '0 0 20px rgba(255, 102, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#404854';
                e.target.style.background = 'linear-gradient(135deg, rgba(255, 102, 0, 0.05) 0%, rgba(255, 102, 0, 0.02) 100%)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255, 102, 0, 0.1)',
                  border: 'none',
                  color: '#FF6600',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 102, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 102, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
                title="Limpar pesquisa"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Grupos de Dashboards */}
          {dashboardGroups.map((group) => (
            <CollapsibleGroup
              key={group.id}
              group={group}
              searchTerm={searchTerm}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              onClose={onClose}
              router={router}
            />
          ))}

          {/* Mensagem quando nenhum resultado */}
          {searchTerm && dashboardGroups.every(g => 
            g.dashboards.every(d => !d.label.toLowerCase().includes(searchTerm.toLowerCase()))
          ) && (
            <div style={{
              textAlign: 'center',
              padding: '20px 10px',
              color: '#6b7280',
              fontSize: '0.85rem',
            }}>
              Nenhum dashboard encontrado
            </div>
          )}
        </nav>

        {/* Footer */}
        <div 
          style={{ 
            backgroundColor: '#1a1d21',
            borderTop: '1px solid #333',
          }}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <p style={{
            fontSize: '0.75rem',
            color: '#6c757d',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '0.3px',
            opacity: 0.8
          }}>
            📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
