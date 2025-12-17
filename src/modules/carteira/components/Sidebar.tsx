/**
 * Componente Sidebar do Dashboard de Carteira
 * Baseado no padrão do módulo de Vendas - Com Filtros
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ChevronRight, 
  ChevronLeft, 
  History, 
  Home, 
  LogOut,
  Wallet,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PaginaCarteiraAtiva, FiltrosCarteira, FiltrosCarteiraOpcoes } from '@/modules/carteira/types';
import { FilterPanel } from '@/modules/carteira/components/filters';

interface SidebarProps {
  paginaAtiva: PaginaCarteiraAtiva;
  onPaginaChange: (pagina: PaginaCarteiraAtiva) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  // Props de filtros
  filtros: FiltrosCarteira;
  filtrosOpcoes: FiltrosCarteiraOpcoes;
  onFiltrosChange: (filtros: Partial<FiltrosCarteira>) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

// Páginas do módulo
const PAGES = [
  { id: 'analises' as const, label: 'Análises', icon: PieChart },
  { id: 'historico' as const, label: 'Dados Históricos', icon: History },
];

export default function Sidebar({
  paginaAtiva,
  onPaginaChange,
  isCollapsed,
  onCollapseChange,
  filtros,
  filtrosOpcoes,
  onFiltrosChange,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataAtual, setDataAtual] = useState<string>('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(`${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
        style={{
          width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
        }}
      >
        {/* Header com Perfil do Usuário */}
        <div
          style={{
            padding: isCollapsed ? '16px 10px' : '16px 20px',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {!isCollapsed && (
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
                  {user?.unitNames?.[0] || 'Franquia'}
                </p>
                <p
                  style={{
                    color: '#4a5568',
                    fontSize: '0.6rem',
                  }}
                >
                  Atualizado: {dataAtual}
                </p>
              </div>
            )}
          </div>

          {/* Botão Toggle */}
          <button
            onClick={() => onCollapseChange(!isCollapsed)}
            className="hover:bg-orange-500/20"
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF6600',
              transition: 'background-color 0.2s',
            }}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav style={{ padding: '12px 8px' }}>
          {PAGES.map((page) => {
            const isActive = paginaAtiva === page.id;
            const isHovered = hoveredItem === page.id;
            const Icon = page.icon;

            return (
              <button
                key={page.id}
                onClick={() => onPaginaChange(page.id)}
                onMouseEnter={() => setHoveredItem(page.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: isCollapsed ? '12px' : '12px 16px',
                  marginBottom: '4px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive 
                    ? 'rgba(255, 102, 0, 0.15)' 
                    : isHovered 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                }}
              >
                <Icon 
                  size={20} 
                  color={isActive ? '#FF6600' : '#9ca3af'} 
                />
                {!isCollapsed && (
                  <span
                    style={{
                      color: isActive ? '#FF6600' : '#9ca3af',
                      fontSize: '0.9rem',
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: "'Poppins', sans-serif",
                    }}
                  >
                    {page.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Separador */}
        <div style={{ padding: '0 20px', margin: '8px 0' }}>
          <div style={{ height: '1px', background: '#333' }} />
        </div>

        {/* Painel de Filtros - apenas quando expandida */}
        {!isCollapsed && (
          <div style={{ padding: '0 16px' }}>
            <FilterPanel
              filtros={filtros}
              opcoes={filtrosOpcoes}
              onFiltrosChange={onFiltrosChange}
            />
          </div>
        )}

        {/* Separador */}
        <div style={{ padding: '0 20px', margin: '8px 0' }}>
          <div style={{ height: '1px', background: '#333' }} />
        </div>

        {/* Links de Ação */}
        <div style={{ padding: '8px' }}>
          {/* Voltar à Central */}
          <Link
            href="/"
            onMouseEnter={() => setHoveredItem('central')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isCollapsed ? '12px' : '12px 16px',
              marginBottom: '4px',
              borderRadius: '8px',
              textDecoration: 'none',
              background: hoveredItem === 'central' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              transition: 'all 0.2s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <Home size={20} color="#9ca3af" />
            {!isCollapsed && (
              <span
                style={{
                  color: '#9ca3af',
                  fontSize: '0.9rem',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Central de Dashboards
              </span>
            )}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            onMouseEnter={() => setHoveredItem('logout')}
            onMouseLeave={() => setHoveredItem(null)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isCollapsed ? '12px' : '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: hoveredItem === 'logout' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
            }}
          >
            <LogOut size={20} color="#9ca3af" />
            {!isCollapsed && (
              <span
                style={{
                  color: '#9ca3af',
                  fontSize: '0.9rem',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Sair
              </span>
            )}
          </button>
        </div>

        {/* Footer informativo - não fixo, parte do scroll */}
        {!isCollapsed && (
          <div 
            style={{
              padding: '16px',
              borderTop: '1px solid #333',
              textAlign: 'center',
              marginTop: '8px',
            }}
          >
            <p style={{ color: '#4a5568', fontSize: '0.65rem' }}>
              📊 Gestão de Dados - VIVA Eventos 2025
            </p>
          </div>
        )}
      </aside>

      {/* Spacer para compensar sidebar fixa */}
      <div 
        style={{ 
          width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          flexShrink: 0,
          transition: 'width 0.3s',
        }} 
      />
    </>
  );
}
