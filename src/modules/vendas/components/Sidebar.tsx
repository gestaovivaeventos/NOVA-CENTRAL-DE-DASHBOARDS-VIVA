/**
 * Componente Sidebar do Dashboard de Vendas
 * Estilo padronizado com base no módulo PEX
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { BarChart3, Crosshair, Home, LogOut, ChevronLeft, ChevronRight, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { PAGES } from '@/modules/vendas/config/app.config';
import { useAuth } from '@/context/AuthContext';

// Ícone de Funil customizado
const FunnelIcon = ({ size = 20, strokeWidth = 2 }: { size?: number; strokeWidth?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
  </svg>
);

interface SidebarProps {
  paginaAtiva: string;
  onPaginaChange: (pagina: string) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  children?: React.ReactNode;
}

export default function Sidebar({
  paginaAtiva,
  onPaginaChange,
  isCollapsed,
  onCollapseChange,
  children,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  const getIcon = (pageId: string, isActive: boolean) => {
    const strokeWidth = isActive ? 2.5 : 2;
    switch (pageId) {
      case 'metas':
        return <Crosshair size={20} strokeWidth={strokeWidth} />;
      case 'indicadores':
        return <BarChart3 size={20} strokeWidth={strokeWidth} />;
      case 'funil':
        return <FunnelIcon size={20} strokeWidth={strokeWidth} />;
      default:
        return <BarChart3 size={20} strokeWidth={strokeWidth} />;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside
      style={{
        width: isCollapsed ? '70px' : '280px',
        backgroundColor: '#1a1d21',
        borderRight: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header da Sidebar - Perfil do Usuário */}
      <div style={{
        padding: isCollapsed ? '16px 10px' : '16px 20px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            {/* Ícone com letra inicial */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#FF6600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{
                color: '#FFF',
                fontSize: '1.2rem',
                fontWeight: 700,
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
              }}>
                {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                color: '#F8F9FA',
                fontSize: '0.95rem',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginBottom: '0px',
                lineHeight: '1.2',
              }}>
                {user?.firstName || user?.username || 'Usuário'}
              </h2>
              <p style={{
                color: '#6c757d',
                fontSize: '0.7rem',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2',
              }}>
                {user?.unitNames?.[0] || 'Unidade'}
              </p>
              <p style={{
                color: '#4a5568',
                fontSize: '0.6rem',
              }}>
                Atualizado: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>
        ) : null}

        {/* Botão Toggle */}
        <button
          onClick={() => onCollapseChange(!isCollapsed)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#FF6600',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFF',
            transition: 'all 0.2s',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ff7a1a';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FF6600';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Menu de Navegação */}
      <nav style={{ 
        padding: isCollapsed ? '20px 10px' : '20px',
      }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PAGES.map((page) => {
            const isActive = paginaAtiva === page.id;
            
            return (
              <li key={page.id} style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => onPaginaChange(page.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isCollapsed ? '0' : '12px',
                    padding: isCollapsed ? '12px' : '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                    border: isActive ? '1px solid #FF6600' : '1px solid transparent',
                    color: isActive ? '#FF6600' : '#9ca3af',
                    fontFamily: "'Poppins', sans-serif",
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 500,
                    transition: 'all 0.2s',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    width: '100%',
                    cursor: 'pointer',
                  }}
                  title={isCollapsed ? page.label : undefined}
                >
                  {getIcon(page.id, isActive)}
                  {!isCollapsed && <span>{page.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Seção de Filtros */}
      {!isCollapsed && children && (
        <div style={{
          padding: '0 20px 20px 20px',
          borderTop: '1px solid #333',
          marginTop: '10px',
        }}>
          {/* Header dos Filtros */}
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 0',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#F8F9FA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Filter size={18} color="#FF6600" />
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: "'Poppins', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Filtros
              </span>
            </div>
            {isFiltersExpanded ? (
              <ChevronUp size={18} color="#adb5bd" />
            ) : (
              <ChevronDown size={18} color="#adb5bd" />
            )}
          </button>

          {/* Conteúdo dos Filtros */}
          <div style={{
            maxHeight: isFiltersExpanded ? '2000px' : '0',
            opacity: isFiltersExpanded ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}>
            {children}
          </div>
        </div>
      )}

      {/* Botão de Filtros quando sidebar colapsada */}
      {isCollapsed && children && (
        <div style={{
          padding: '10px',
          borderTop: '1px solid #333',
        }}>
          <button
            onClick={() => onCollapseChange(false)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FF6600',
              transition: 'all 0.2s',
            }}
            title="Ver Filtros"
          >
            <Filter size={20} />
          </button>
        </div>
      )}

      {/* Footer da Sidebar */}
      <div style={{
        padding: isCollapsed ? '15px 10px' : '15px 20px',
        borderTop: '1px solid #333',
        marginTop: 'auto',
      }}>
        {/* Botão Voltar para Central */}
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '12px',
            padding: isCollapsed ? '12px' : '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            color: '#6c757d',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
            cursor: 'pointer',
            marginBottom: '8px',
          }}
          title={isCollapsed ? 'Voltar para Central' : undefined}
        >
          <Home size={18} />
          {!isCollapsed && <span>Voltar para Central</span>}
        </button>

        {/* Botão Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isCollapsed ? '0' : '12px',
            padding: isCollapsed ? '12px' : '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
            color: '#dc3545',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'all 0.2s',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            width: '100%',
            cursor: 'pointer',
          }}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

