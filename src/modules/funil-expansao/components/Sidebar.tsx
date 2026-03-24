/**
 * Componente Sidebar do Dashboard Funil de Expansão
 * Estilo padronizado com base no módulo de Vendas
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, BarChart3, PieChart, Map, Megaphone, Home, LogOut } from 'lucide-react';
import { PAGES } from '@/modules/funil-expansao/config/app.config';
import { useAuth } from '@/context/AuthContext';
import type { FiltrosExpansao } from '../types';

interface SidebarProps {
  paginaAtiva: string;
  onPaginaChange: (pagina: string) => void;
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  filtros: FiltrosExpansao;
  onFiltrosChange: (filtros: FiltrosExpansao) => void;
  origens: string[];
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function Sidebar({
  paginaAtiva,
  onPaginaChange,
  isCollapsed,
  onCollapseChange,
  filtros,
  onFiltrosChange,
  origens,
}: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dataAtual, setDataAtual] = useState<string>('');

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR'));
  }, []);

  const getIcon = (pageId: string) => {
    switch (pageId) {
      case 'indicadores': return <BarChart3 size={20} />;
      case 'operacionais': return <PieChart size={20} />;
      case 'composicao': return <Map size={20} />;
      case 'campanhas': return <Megaphone size={20} />;
      default: return <BarChart3 size={20} />;
    }
  };

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
                Expansão VIVA
              </p>
              <p style={{ color: '#4a5568', fontSize: '0.6rem' }}>
                Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
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
              {getIcon(page.id)}
              {!isCollapsed && <span>{page.label}</span>}
            </button>
          ))}
        </nav>

        {/* Filtros - só quando expandido */}
        {!isCollapsed && (
          <>
            <hr className="border-dark-tertiary my-4" />
            <div className="space-y-4">
              {/* Filtro Funil */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                  Funil
                </label>
                <select
                  value={filtros.tipoFunil}
                  onChange={e => onFiltrosChange({ ...filtros, tipoFunil: e.target.value as any })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#343A40',
                    color: '#F8F9FA',
                    border: '1px solid #495057',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <option value="TODOS">Todos os Funis</option>
                  <option value="TRATAMENTO">Tratamento</option>
                  <option value="INVESTIDOR">Investidor</option>
                  <option value="OPERADOR">Operador</option>
                </select>
              </div>

              {/* Filtro Origem */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                  Origem
                </label>
                <select
                  value={filtros.origem}
                  onChange={e => onFiltrosChange({ ...filtros, origem: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{
                    backgroundColor: '#343A40',
                    color: '#F8F9FA',
                    border: '1px solid #495057',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <option value="Todas">Todas</option>
                  {origens.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Período */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                  Período
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filtros.periodoInicio}
                    onChange={e => onFiltrosChange({ ...filtros, periodoInicio: e.target.value })}
                    className="flex-1 rounded-lg px-2 py-2 text-xs"
                    style={{
                      backgroundColor: '#343A40',
                      color: '#F8F9FA',
                      border: '1px solid #495057',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  />
                  <input
                    type="date"
                    value={filtros.periodoFim}
                    onChange={e => onFiltrosChange({ ...filtros, periodoFim: e.target.value })}
                    className="flex-1 rounded-lg px-2 py-2 text-xs"
                    style={{
                      backgroundColor: '#343A40',
                      color: '#F8F9FA',
                      border: '1px solid #495057',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Espaçador */}
        <div className="flex-grow" />

        {/* Área inferior */}
        <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
          <hr className="border-dark-tertiary mb-4" />

          <a
            href="/"
            className={`
              flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
              ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-4 py-2.5 w-full'}
            `}
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', fontWeight: 500, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
            title="Central de Dashboards"
          >
            <Home size={20} strokeWidth={2} />
            {!isCollapsed && <span>Central de Dashboards</span>}
          </a>

          <button
            onClick={() => { logout(); router.push('/login'); }}
            className={`
              flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
              ${isCollapsed ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-4 py-2.5 w-full mt-2'}
            `}
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', fontWeight: 500, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
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
