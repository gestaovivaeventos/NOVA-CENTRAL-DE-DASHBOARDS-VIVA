/**
 * Sidebar do módulo de Controle de Módulos
 * Mesmo padrão da Sidebar de Branches
 */

import React from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Home, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ControleModulosSidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function ControleModulosSidebar({
  isCollapsed,
  onCollapseChange,
}: ControleModulosSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
      style={{
        width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        backgroundColor: '#1a1d21',
        borderRight: '1px solid #333',
      }}
    >
      {/* Header com Perfil */}
      <div
        style={{
          padding: isCollapsed ? '16px 10px' : '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '12px',
        }}
      >
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
              }}
            >
              {user?.firstName || user?.username || 'Usuário'}
            </h2>
            <p style={{ color: '#6c757d', fontSize: '0.7rem' }}>
              Controle de Módulos
            </p>
          </div>
        )}

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
          }}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Conteúdo */}
      <div
        className={`${isCollapsed ? 'px-2 pt-4' : 'p-5 pt-4'} flex flex-col`}
        style={{ height: 'calc(100% - 90px)', overflowY: 'auto' }}
      >
        {/* Info / Legenda */}
        {!isCollapsed && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} color="#FF6600" />
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#F8F9FA',
                }}
              >
                Legenda
              </span>
            </div>

            {/* Legenda de Níveis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981', flexShrink: 0 }} />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                  Nível 0 = Rede (todos)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', flexShrink: 0 }} />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                  Nível 1 = Franqueadora
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6', flexShrink: 0 }} />
                <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                  Sem usuários = todos
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Espaçador */}
        <div className="flex-grow" />

        {/* Footer */}
        <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
          <hr className="border-dark-tertiary mb-4" />

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
              textDecoration: 'none',
            }}
            title="Central de Dashboards"
          >
            <Home size={20} strokeWidth={2} />
            {!isCollapsed && <span>Central de Dashboards</span>}
          </a>

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
  );
}
