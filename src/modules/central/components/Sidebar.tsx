'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { NavItem } from '@/types/modules.types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Itens de navegação
const getNavItems = (accessLevel: number): NavItem[] => {
  const items: NavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: 'home',
      path: '/',
    },
    {
      id: 'pex',
      label: 'Dashboard PEX',
      icon: 'chart',
      path: '/pex',
      children: [
        { id: 'pex-dashboard', label: 'Visão Geral', icon: 'dashboard', path: '/pex/dashboard' },
        { id: 'pex-ranking', label: 'Ranking', icon: 'trophy', path: '/pex/ranking' },
        { id: 'pex-resultados', label: 'Resultados', icon: 'results', path: '/pex/resultados' },
      ],
    },
    {
      id: 'vendas',
      label: 'Dashboard Vendas',
      icon: 'money',
      path: '/vendas',
    },
  ];

  // Adiciona itens admin se nível >= 1
  if (accessLevel >= 1) {
    items.push({
      id: 'admin',
      label: 'Administração',
      icon: 'settings',
      path: '/admin',
      children: [
        { id: 'admin-users', label: 'Usuários', icon: 'users', path: '/admin/users' },
        { id: 'admin-config', label: 'Configurações', icon: 'config', path: '/admin/config' },
      ],
    });
  }

  return items;
};

// Ícones SVG inline
const icons: Record<string, JSX.Element> = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  trophy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  results: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  config: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const router = useRouter();

  const navItems = getNavItems(user?.accessLevel || 0);

  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
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
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-4rem)] lg:h-[calc(100vh-0rem)]">
          {navItems.map((item) => (
            <div key={item.id}>
              {/* Main item */}
              <Link
                href={item.path}
                onClick={() => onClose()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: isActive(item.path) ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                  border: isActive(item.path) ? '1px solid #FF6600' : '1px solid transparent',
                  color: isActive(item.path) ? '#FF6600' : '#9ca3af',
                  textDecoration: 'none',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.95rem',
                  fontWeight: isActive(item.path) ? 600 : 500,
                  transition: 'all 0.2s',
                }}
              >
                {icons[item.icon] || icons.home}
                <span>{item.label}</span>
              </Link>

              {/* Subitems */}
              {item.children && isActive(item.path) && (
                <div style={{ marginTop: '4px', marginLeft: '16px', paddingLeft: '16px', borderLeft: '1px solid #333' }} className="space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.id}
                      href={child.path}
                      onClick={() => onClose()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: router.pathname === child.path ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                        border: router.pathname === child.path ? '1px solid #FF6600' : '1px solid transparent',
                        color: router.pathname === child.path ? '#FF6600' : '#9ca3af',
                        textDecoration: 'none',
                        fontFamily: "'Poppins', sans-serif",
                        fontSize: '0.85rem',
                        fontWeight: router.pathname === child.path ? 600 : 500,
                        transition: 'all 0.2s',
                      }}
                    >
                      {icons[child.icon] || null}
                      <span>{child.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div 
          style={{ 
            backgroundColor: '#1a1d21',
            borderTop: '1px solid #333',
          }}
          className="absolute bottom-0 left-0 right-0 p-4"
        >
          <div className="text-center">
            <p className="text-dark-text-muted text-xs">
              Central de Dashboards v1.0.0
            </p>
            <p className="text-dark-text-muted text-xs mt-1">
              © 2024 Viva Eventos
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
