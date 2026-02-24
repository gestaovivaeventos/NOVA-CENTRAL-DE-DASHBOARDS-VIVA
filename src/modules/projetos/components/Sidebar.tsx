/**
 * Componente Sidebar do Painel Gerencial de Projetos
 * Responsivo - com suporte a mobile (hamburger menu + overlay)
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Home, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LAYOUT_CONFIG } from '../config/app.config';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  children?: React.ReactNode;
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: (open: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  onCollapseChange,
  children,
  isMobile,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataAtual, setDataAtual] = useState<string>('');

  useEffect(() => {
    const hoje = new Date();
    setDataAtual(
      `${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    );
  }, []);

  // No mobile: sidebar sempre expandida (280px) e controlada por isMobileMenuOpen
  const sidebarWidth = isMobile ? 280 : (isCollapsed ? LAYOUT_CONFIG.SIDEBAR_WIDTH_COLLAPSED : LAYOUT_CONFIG.SIDEBAR_WIDTH_EXPANDED);
  const showExpanded = isMobile ? true : !isCollapsed;

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => onMobileMenuToggle(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Botão hamburger mobile */}
      {isMobile && (
        <button
          onClick={() => onMobileMenuToggle(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 60,
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#1a1d21',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FF6600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
        style={{
          width: `${sidebarWidth}px`,
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
          left: isMobile ? (isMobileMenuOpen ? '0' : `-${sidebarWidth}px`) : '0',
        }}
      >
        {/* Header com Perfil do Usuário */}
        <div
          style={{
            padding: showExpanded ? '16px 20px' : '16px 10px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {showExpanded && (
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
                  {user?.unitPrincipal || user?.unitNames?.[0] || 'Franquia'}
                </p>
                <p style={{ color: '#4a5568', fontSize: '0.6rem' }}>
                  Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Botão Toggle (só desktop) */}
          {!isMobile && (
            <button
              onClick={() => onCollapseChange(!isCollapsed)}
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

        {/* Conteúdo da Sidebar */}
        <div
          className={`${showExpanded ? 'p-5 pt-4' : 'px-2 pt-4'} flex flex-col`}
          style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* Filtros (children) */}
          {showExpanded && <div className="filters-content">{children}</div>}

          {/* Espaçador */}
          <div className="flex-grow" />

          {/* Área inferior */}
          <div className={`${showExpanded ? 'pb-6' : 'pb-4'}`}>
            <hr className="border-dark-tertiary mb-4" />

            {/* Link Central */}
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
                ${showExpanded ? 'gap-3 px-4 py-2.5 w-full' : 'justify-center p-2.5 w-full'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              title="Central de Dashboards"
            >
              <Home size={20} strokeWidth={2} />
              {showExpanded && <span>Central de Dashboards</span>}
            </a>

            {/* Botão Logout */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
                ${showExpanded ? 'gap-3 px-4 py-2.5 w-full mt-2' : 'justify-center p-2.5 w-full mt-2'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              title={!showExpanded ? 'Sair' : undefined}
            >
              <LogOut size={20} strokeWidth={2} />
              {showExpanded && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
