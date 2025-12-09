/**
 * Componente Sidebar do Dashboard de Vendas
 */

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, BarChart3, TrendingUp, Target, Home, LogOut, Clock, Crosshair } from 'lucide-react';
import { PAGES } from '@/config/app.config';

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
  // Gerar data apenas no cliente para evitar erro de hidratação
  const [dataAtual, setDataAtual] = useState<string>('');
  
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
          {/* Última Atualização - altura fixa para evitar deslocamento */}
          {!isCollapsed && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
                minHeight: '20px',
              }}
            >
              <Clock size={14} style={{ color: '#FF6600' }} />
              <div>
                <span
                  style={{
                    color: '#6c757d',
                    fontSize: '0.7rem',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  Última atualização:{' '}
                </span>
                <span
                  style={{
                    color: '#adb5bd',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {dataAtual || '...'}
                </span>
              </div>
            </div>
          )}
          
          <hr className="border-dark-tertiary mb-4" />

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
