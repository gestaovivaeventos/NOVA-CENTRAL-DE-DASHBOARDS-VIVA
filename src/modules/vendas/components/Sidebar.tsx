/**
 * Componente Sidebar do Dashboard de Vendas
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, BarChart3, TrendingUp, Target, Home, LogOut, Clock, Crosshair } from 'lucide-react';
import { PAGES } from '@/modules/vendas/config/app.config';
import { useAuth } from '@/context/AuthContext';

// Ícone de Funil customizado (similar à imagem de referência)
const FunnelIcon = ({ size = 20 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Funil */}
    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
    {/* Círculo com $ no topo */}
    <circle cx="12" cy="3" r="2.5" fill="currentColor" stroke="none" />
    <text x="12" y="4.5" textAnchor="middle" fontSize="4" fill="#212529" fontWeight="bold">$</text>
  </svg>
);

interface SidebarProps {
  paginaAtiva: string;
  onPaginaChange: (pagina: string) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  children?: React.ReactNode;
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function Sidebar({
  paginaAtiva,
  onPaginaChange,
  isCollapsed,
  onCollapseChange,
  children,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  // Gerar data apenas no cliente para evitar erro de hidratação
  const [dataAtual, setDataAtual] = useState<string>('');
  
  // Debug: Log de unitNames
  React.useEffect(() => {
    if (user) {
      console.log('User unitNames:', user.unitNames);
      console.log('User data:', user);
    }
  }, [user]);
  
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(`${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  const getIcon = (pageId: string) => {
    switch (pageId) {
      case 'metas':
        return <Crosshair size={20} />;
      case 'indicadores':
        return <BarChart3 size={20} />;
      case 'funil':
        return <FunnelIcon size={20} />;
      default:
        return <BarChart3 size={20} />;
    }
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
            {/* Info do Usuário */}
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
                  Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Botão Toggle */}
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
        </div>

        {/* Conteúdo da Sidebar - com scroll */}
        <div 
          className={`${isCollapsed ? 'px-2 pt-4' : 'p-5 pt-4'} flex flex-col`}
          style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
        >

          {/* Navegação de Páginas */}
          <nav className="flex flex-col gap-1.5 mb-6">
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => onPaginaChange(page.id)}
                className={`
                  group flex items-center rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4'}
                  ${paginaAtiva === page.id
                    ? 'bg-orange-500/10 border border-orange-500 text-orange-500'
                    : 'text-gray-400 border border-gray-600/50 hover:bg-white/5'
                  }
                `}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: paginaAtiva === page.id ? 600 : 500,
                  boxShadow: paginaAtiva !== page.id ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                  height: '42px',
                  whiteSpace: 'nowrap',
                }}
                title={isCollapsed ? page.label : undefined}
              >
                {React.cloneElement(getIcon(page.id), {
                  strokeWidth: paginaAtiva === page.id ? 2.5 : 2
                })}
                {!isCollapsed && <span>{page.label}</span>}
              </button>
            ))}
          </nav>

          {/* Filtros (children) - só mostra quando expandido */}
          {!isCollapsed && (
            <>
              <hr className="border-dark-tertiary my-4" />
              <div className="filters-content">
                {children}
              </div>
            </>
          )}

          {/* Espaçador flexível para empurrar os botões para baixo */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-dark-tertiary mb-4" />
            
            {/* Link para Central de Dashboards */}
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
                ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-4 py-2.5 w-full'}
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
              {!isCollapsed && <span>Central de Dashboards</span>}
            </a>

            {/* Botão de Logout */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
                ${isCollapsed ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-4 py-2.5 w-full mt-2'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={20} strokeWidth={2} />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

