/**
 * Componente Sidebar do Fluxo Projetado
 * Padronizado com o módulo de Painel Gerencial
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, Home, LogOut, Settings, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TabelaParametros from './TabelaParametros';
import FiltroFranquia from './FiltroFranquia';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  franquiaSelecionada: string;
  onFranquiaChange: (franquia: string) => void;
  onParametrosSaved?: () => void;
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function Sidebar({
  isCollapsed,
  onCollapseChange,
  franquiaSelecionada,
  onFranquiaChange,
  onParametrosSaved,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataAtual, setDataAtual] = useState<string>('');
  const [showConfig, setShowConfig] = useState(false);
  
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(`${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  const handleParametrosSaved = () => {
    if (onParametrosSaved) {
      onParametrosSaved();
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
          {/* Filtros - só mostra quando expandido */}
          {!isCollapsed && (
            <div className="filters-content space-y-4">
              {/* Seção de Filtros */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={14} className="text-orange-500" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtros</span>
                </div>

                {/* Filtro de Franquia */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-500 mb-1.5">Franquia</label>
                  <FiltroFranquia
                    franquiaSelecionada={franquiaSelecionada}
                    onFranquiaChange={onFranquiaChange}
                    fullWidth
                  />
                </div>
              </div>

              {/* Divisor */}
              <hr className="border-gray-700/50" />

              {/* Botão de Parâmetros */}
              <div>
                <button 
                  onClick={() => setShowConfig(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 bg-[#252830] border border-gray-700 hover:border-orange-500/50 hover:bg-[#2a2e38] text-gray-300 hover:text-white rounded-lg transition-all text-sm"
                >
                  <Settings className="w-4 h-4 text-orange-400" />
                  <span>Parâmetros</span>
                </button>
              </div>
            </div>
          )}

          {/* Ícones quando recolhido */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-3">
              {/* Botão Parâmetros (ícone) */}
              <button
                onClick={() => setShowConfig(true)}
                className="p-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-all"
                title="Parâmetros"
              >
                <Settings size={20} />
              </button>
            </div>
          )}

          {/* Espaçador flexível para empurrar os botões para baixo */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-gray-700/50 mb-4" />
            
            {/* Link para Central de Dashboards */}
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-orange-500/50 hover:bg-[#2a2e38] hover:text-white
                ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-3 py-2.5 w-full'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title="Central de Dashboards"
            >
              <Home size={18} strokeWidth={2} className="text-orange-400" />
              {!isCollapsed && <span>Central de Dashboards</span>}
            </a>

            {/* Botão de Logout */}
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400
                ${isCollapsed ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-3 py-2.5 w-full mt-2'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={18} strokeWidth={2} />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Modal de Parâmetros - Tabela com todas as franquias */}
      <TabelaParametros
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleParametrosSaved}
      />
    </>
  );
}

export { Sidebar };
