/**
 * Componente Sidebar do Painel Gerencial
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, BarChart3, Home, LogOut, Clock, Target } from 'lucide-react';

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
  // Gerar data apenas no cliente para evitar erro de hidratação
  const [dataAtual, setDataAtual] = useState<string>('');
  
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(`${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className="fixed left-0 top-0 bottom-0 bg-dark-secondary overflow-y-auto transition-all duration-300 z-50"
        style={{
          width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          borderRight: '2px solid #343A40',
          overflow: 'visible',
        }}
      >
        {/* Toggle Button - Na beirada direita da sidebar */}
        <button
          onClick={() => onCollapseChange(!isCollapsed)}
          className="absolute w-8 h-8 flex items-center justify-center rounded-md bg-dark-secondary border border-orange-500 hover:bg-orange-500/20 cursor-pointer transition-all duration-200 shadow-lg"
          style={{
            top: '24px',
            right: '-16px',
            zIndex: 60,
          }}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="text-orange-500" />
          ) : (
            <ChevronLeft size={18} className="text-orange-500" />
          )}
        </button>

        {/* Conteúdo da Sidebar - com scroll */}
        <div 
          className={`${isCollapsed ? 'px-2 pt-16' : 'p-5 pt-16'} flex flex-col`}
          style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* Navegação de Páginas */}
          <nav className="flex flex-col gap-1.5 mb-6">
            <button
              className={`
                group flex items-center rounded-lg transition-all duration-200
                ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4'}
                bg-orange-500/10 border border-orange-500 text-orange-500
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '42px',
                whiteSpace: 'nowrap',
              }}
              title={isCollapsed ? 'Painel Gerencial' : undefined}
            >
              <Target size={20} strokeWidth={2.5} />
              {!isCollapsed && <span>Painel Gerencial</span>}
            </button>
          </nav>

          {/* Filtros (children) - só mostra quando expandido */}
          {!isCollapsed && (
            <div className="filters-content">
              {children}
            </div>
          )}

          {/* Espaçador flexível para empurrar os botões para baixo */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-dark-tertiary mb-4" />
            
            {/* Link para Central de Dashboards */}
            <a
              href="https://central-dashs-viva-html.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
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
                // TODO: Implementar função de logout
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
