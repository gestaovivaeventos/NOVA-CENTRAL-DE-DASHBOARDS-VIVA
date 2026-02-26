/**
 * GestaoRedeLayout - Layout wrapper para o módulo
 * Inclui sidebar de navegação e estrutura principal
 * Segue o padrão do módulo de Vendas (Sidebar.tsx)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  LogOut, 
  Menu, 
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FiltrosGestaoRede } from '../types';
import { FilterPanel } from './filters';

interface GestaoRedeLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard';
  filtros?: FiltrosGestaoRede;
  onFiltrosChange?: (filtros: FiltrosGestaoRede) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function GestaoRedeLayout({ 
  children, 
  currentPage, 
  filtros, 
  onFiltrosChange
}: GestaoRedeLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gestao_rede_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('gestao_rede_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleFiltrosChange = (novosFiltros: Partial<FiltrosGestaoRede>) => {
    if (onFiltrosChange && filtros) {
      onFiltrosChange({ ...filtros, ...novosFiltros });
    }
  };

  const sidebarWidth = isMobile ? SIDEBAR_WIDTH_EXPANDED : (isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED);

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#212529',
      position: 'relative',
    }}>
      {/* Overlay para mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Botão de menu mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
            backgroundColor: '#343A40',
            border: '1px solid #FF6600',
            borderRadius: '8px',
            padding: '8px',
            color: '#FF6600',
            cursor: 'pointer',
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
        style={{
          width: isMobile ? (isMobileMenuOpen ? `${SIDEBAR_WIDTH_EXPANDED}px` : '0px') : `${sidebarWidth}px`,
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
          left: isMobile ? (isMobileMenuOpen ? 0 : '-100%') : 0,
        }}
      >
        {/* Header com Perfil do Usuário */}
        <div
          style={{
            padding: isCollapsed && !isMobile ? '16px 10px' : '16px 20px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: (isCollapsed && !isMobile) ? 'center' : 'space-between',
            gap: '12px',
          }}
        >
          {(!isCollapsed || isMobile) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    color: '#F8F9FA',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '2px',
                    lineHeight: '1.2',
                  }}
                >
                  {user?.firstName || user?.username || 'Usuário'}
                </h2>
                <p
                  style={{
                    color: '#6c757d',
                    fontSize: '0.7rem',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: '1.2',
                  }}
                >
                  {user?.unitPrincipal || user?.unitNames?.[0] || 'Gestão Rede'}
                </p>
              </div>
            </div>
          )}

          {/* Botão Toggle */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:bg-orange-500/20"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#1a1d21',
                border: '1px solid #FF6600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FF6600',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
              title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Conteúdo da Sidebar - com scroll */}
        <div 
          className={`${(isCollapsed && !isMobile) ? 'px-2 pt-4' : 'p-5 pt-4'} flex flex-col`}
          style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* Filtros - só mostra quando expandido */}
          {(!isCollapsed || isMobile) && onFiltrosChange && filtros && (
            <>
              <hr className="border-dark-tertiary my-4" />
              <div className="filters-content">
                <FilterPanel
                  filtros={filtros}
                  onFiltrosChange={handleFiltrosChange}
                />
              </div>
            </>
          )}

          {/* Espaçador flexível para empurrar os botões para baixo */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${(isCollapsed && !isMobile) ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-dark-tertiary mb-4" />
            
            {/* Link para Central de Dashboards */}
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
                ${(isCollapsed && !isMobile) ? 'justify-center p-2.5 w-full' : 'gap-3 px-4 py-2.5 w-full'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                textDecoration: 'none',
              }}
              title="Central de Dashboards"
            >
              <Home size={20} strokeWidth={2} />
              {(!isCollapsed || isMobile) && <span>Central de Dashboards</span>}
            </a>

            {/* Botão de Logout */}
            <button
              onClick={handleLogout}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
                ${(isCollapsed && !isMobile) ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-4 py-2.5 w-full mt-2'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                backgroundColor: 'transparent',
              }}
              title={(isCollapsed && !isMobile) ? 'Sair' : undefined}
            >
              <LogOut size={20} strokeWidth={2} />
              {(!isCollapsed || isMobile) && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : sidebarWidth,
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin-left 0.3s ease, width 0.3s ease',
        minHeight: '100vh',
        backgroundColor: '#212529',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  );
}
