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
                  {user?.unitPrincipal || user?.unitNames?.[0] || 'Franquia'}
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

        {/* Menu de Navegação */}
        <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {PAGES.map((page) => {
            const isActive = paginaAtiva === page.id;
            const Icon = page.icon;

            return (
              <button
                key={page.id}
                onClick={() => onPaginaChange(page.id)}
                className={`
                  group flex items-center rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4'}
                  ${isActive
                    ? 'bg-orange-500/10 border border-orange-500 text-orange-500'
                    : 'text-gray-400 border border-gray-600/50 hover:bg-gray-700/50'
                  }
                `}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: !isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                  height: '42px',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
                title={isCollapsed ? page.label : undefined}
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!isCollapsed && <span>{page.label}</span>}
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
        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Voltar à Central */}
          <Link
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
              textDecoration: 'none',
              height: '42px',
            }}
            title="Central de Dashboards"
          >
            <Home size={20} strokeWidth={2} />
            {!isCollapsed && <span>Central de Dashboards</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`
              flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
              ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-4 py-2.5 w-full'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.95rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              height: '42px',
              cursor: 'pointer',
            }}
            title={isCollapsed ? 'Sair' : undefined}
          >
            <LogOut size={20} strokeWidth={2} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
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
