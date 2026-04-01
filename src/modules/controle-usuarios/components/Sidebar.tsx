/**
 * Sidebar do módulo Controle de Usuários e Senhas
 * Layout idêntico ao módulo de vendas - usa children para filtros
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Home, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  children?: React.ReactNode;
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function Sidebar({
  isCollapsed,
  onCollapseChange,
  children,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataAtual, setDataAtual] = useState<string>('');

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR') + ' às ' +
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  }, []);

  return (
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
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '12px',
        }}
      >
        {!isCollapsed && (
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
                {user?.unitPrincipal || user?.unitNames?.[0] || 'Franquia'}
              </p>
              <p style={{ color: '#4a5568', fontSize: '0.6rem' }}>
                Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

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

      {/* Conteúdo da Sidebar */}
      <div
        className={`${isCollapsed ? 'px-2 pt-4' : 'p-5 pt-4'} flex flex-col`}
        style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
      >
        {/* Ícone quando colapsado */}
        {isCollapsed && (
          <div className="mb-6">
            <button
              className="w-full flex justify-center p-2.5 rounded-lg transition-all"
              style={{
                backgroundColor: 'rgba(255,102,0,0.15)',
                border: '1px solid #FF6600',
                color: '#FF6600',
                cursor: 'default',
              }}
              title="Controle de Usuários"
            >
              <Shield size={20} />
            </button>
          </div>
        )}

        {/* Filtros (children) - só mostra quando expandido */}
        {!isCollapsed && children && (
          <>
            <div className="filters-content">
              {children}
            </div>
          </>
        )}

        {/* Espaçador flexível */}
        <div className="flex-grow" />

        {/* Área inferior: Central + Sair */}
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
