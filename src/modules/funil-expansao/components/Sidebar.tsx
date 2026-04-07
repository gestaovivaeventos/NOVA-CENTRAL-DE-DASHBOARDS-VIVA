/**
 * Componente Sidebar do Dashboard Funil de Expansão
 * Estilo padronizado com base no módulo de Vendas
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import { ChevronRight, ChevronLeft, BarChart3, PieChart, Map, Megaphone, Home, LogOut } from 'lucide-react';
import { PAGES } from '@/modules/funil-expansao/config/app.config';
import { useAuth } from '@/context/AuthContext';
import DateRangePicker from './DateRangePicker';
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

const FUNIL_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Funis' },
  { value: 'TRATAMENTO', label: 'Tratamento' },
  { value: 'INVESTIDOR', label: 'Investidor' },
  { value: 'OPERADOR', label: 'Operador' },
];

function FunilMultiSelect({ selectedValues, onChange }: { selectedValues: string[]; onChange: (vals: string[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const update = () => {
      if (isOpen && isPositioned && triggerRef.current && dropdownRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const actualH = dropdownRef.current.offsetHeight;
        const below = window.innerHeight - rect.bottom;
        const openUp = below < actualH && rect.top > actualH;
        setDropdownPos({ top: openUp ? rect.top - actualH - 4 : rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    if (isOpen) {
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, isPositioned]);

  useEffect(() => {
    if (isOpen && !isPositioned && dropdownRef.current && triggerRef.current) {
      requestAnimationFrame(() => {
        if (dropdownRef.current && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const actualH = dropdownRef.current.offsetHeight;
          const below = window.innerHeight - rect.bottom;
          const openUp = below < actualH && rect.top > actualH;
          setDropdownPos({ top: openUp ? rect.top - actualH - 4 : rect.bottom + 4, left: rect.left, width: rect.width });
          setIsPositioned(true);
        }
      });
    }
  }, [isOpen, isPositioned]);

  useEffect(() => { if (!isOpen) setIsPositioned(false); }, [isOpen]);

  const handleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: -9999, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const handleToggle = (val: string) => {
    if (val === 'TODOS') {
      onChange(['TODOS']);
      return;
    }
    let next = selectedValues.filter(v => v !== 'TODOS');
    if (next.includes(val)) {
      next = next.filter(v => v !== val);
    } else {
      next = [...next, val];
    }
    if (next.length === 0 || next.length === 3) {
      onChange(['TODOS']);
    } else {
      onChange(next);
    }
  };

  const handleSelectOnly = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (val === 'TODOS') {
      onChange(['TODOS']);
    } else {
      onChange([val]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0 || selectedValues.includes('TODOS')) return 'Todos os Funis';
    if (selectedValues.length === 1) return FUNIL_OPTIONS.find(o => o.value === selectedValues[0])?.label || selectedValues[0];
    return `${selectedValues.length} funis selecionados`;
  };

  const isSelected = (val: string) => {
    if (val === 'TODOS') return selectedValues.includes('TODOS') || selectedValues.length === 0;
    return selectedValues.includes(val);
  };

  const renderDropdown = () => {
    if (!isOpen || typeof document === 'undefined') return null;
    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
          backgroundColor: '#2a2f36', border: '1px solid #444', borderRadius: '8px',
          zIndex: 9999, maxHeight: 300, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
        }}
      >
        {FUNIL_OPTIONS.map(opt => {
          const sel = isSelected(opt.value);
          return (
            <div
              key={opt.value}
              style={{
                padding: '10px 12px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif',
                color: sel ? '#FF6600' : '#ccc', fontWeight: sel ? 600 : 400,
                backgroundColor: sel ? '#1f2329' : 'transparent', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1f2329'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                onClick={() => handleToggle(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '3px',
                  border: sel ? '2px solid #FF6600' : '2px solid #555',
                  backgroundColor: sel ? '#FF6600' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {sel && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span>{opt.label}</span>
              </div>
              {opt.value !== 'TODOS' && (
                <button
                  onClick={(e) => handleSelectOnly(opt.value, e)}
                  style={{
                    padding: '2px 5px', background: 'transparent', color: '#6c757d',
                    border: '1px solid #444', borderRadius: '50%', fontSize: '0.7rem',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', flexShrink: 0, opacity: 0.6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, lineHeight: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,102,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6c757d'; e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
                  title={`Selecionar somente "${opt.label}"`}
                >✓</button>
              )}
            </div>
          );
        })}
      </div>,
      document.body,
    );
  };

  return (
    <div style={{ marginBottom: 0, position: 'relative' }} ref={containerRef}>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
        Funil
      </label>
      <div ref={triggerRef}>
        <div
          onClick={handleOpen}
          style={{
            width: '100%', padding: '12px 16px', backgroundColor: '#2a2f36', color: '#F8F9FA',
            border: `1px solid ${isOpen ? '#FF6600' : '#444'}`, borderRadius: '8px',
            fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.backgroundColor = '#343A40'; }}
          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.backgroundColor = '#2a2f36'; }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{getDisplayText()}</span>
          <span style={{ fontSize: '0.6rem', marginLeft: 8, color: '#adb5bd', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>
      {renderDropdown()}
    </div>
  );
}

function OrigemMultiSelect({ selectedValues, onChange, origens }: { selectedValues: string[]; onChange: (vals: string[]) => void; origens: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allOptions = [{ value: 'Todas', label: 'Todos os Canais' }, ...origens.map(o => ({ value: o, label: o }))];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const update = () => {
      if (isOpen && isPositioned && triggerRef.current && dropdownRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const actualH = dropdownRef.current.offsetHeight;
        const below = window.innerHeight - rect.bottom;
        const openUp = below < actualH && rect.top > actualH;
        setDropdownPos({ top: openUp ? rect.top - actualH - 4 : rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    if (isOpen) {
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, isPositioned]);

  useEffect(() => {
    if (isOpen && !isPositioned && dropdownRef.current && triggerRef.current) {
      requestAnimationFrame(() => {
        if (dropdownRef.current && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const actualH = dropdownRef.current.offsetHeight;
          const below = window.innerHeight - rect.bottom;
          const openUp = below < actualH && rect.top > actualH;
          setDropdownPos({ top: openUp ? rect.top - actualH - 4 : rect.bottom + 4, left: rect.left, width: rect.width });
          setIsPositioned(true);
        }
      });
    }
  }, [isOpen, isPositioned]);

  useEffect(() => { if (!isOpen) setIsPositioned(false); }, [isOpen]);

  const handleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: -9999, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const handleToggle = (val: string) => {
    if (val === 'Todas') {
      onChange(['Todas']);
      return;
    }
    let next = selectedValues.filter(v => v !== 'Todas');
    if (next.includes(val)) {
      next = next.filter(v => v !== val);
    } else {
      next = [...next, val];
    }
    if (next.length === 0 || next.length === origens.length) {
      onChange(['Todas']);
    } else {
      onChange(next);
    }
  };

  const handleSelectOnly = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (val === 'Todas') {
      onChange(['Todas']);
    } else {
      onChange([val]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0 || selectedValues.includes('Todas')) return 'Todos os Canais';
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} canais selecionados`;
  };

  const isSelected = (val: string) => {
    if (val === 'Todas') return selectedValues.includes('Todas') || selectedValues.length === 0;
    return selectedValues.includes(val);
  };

  const renderDropdown = () => {
    if (!isOpen || typeof document === 'undefined') return null;
    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
          backgroundColor: '#2a2f36', border: '1px solid #444', borderRadius: '8px',
          zIndex: 9999, maxHeight: 300, overflow: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
        }}
      >
        {allOptions.map(opt => {
          const sel = isSelected(opt.value);
          return (
            <div
              key={opt.value}
              style={{
                padding: '10px 12px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif',
                color: sel ? '#FF6600' : '#ccc', fontWeight: sel ? 600 : 400,
                backgroundColor: sel ? '#1f2329' : 'transparent', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1f2329'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                onClick={() => handleToggle(opt.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, cursor: 'pointer' }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '3px',
                  border: sel ? '2px solid #FF6600' : '2px solid #555',
                  backgroundColor: sel ? '#FF6600' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {sel && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                </div>
                <span>{opt.label}</span>
              </div>
              {opt.value !== 'Todas' && (
                <button
                  onClick={(e) => handleSelectOnly(opt.value, e)}
                  style={{
                    padding: '2px 5px', background: 'transparent', color: '#6c757d',
                    border: '1px solid #444', borderRadius: '50%', fontSize: '0.7rem',
                    fontFamily: 'Poppins, sans-serif', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s', flexShrink: 0, opacity: 0.6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 20, height: 20, lineHeight: 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,102,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6c757d'; e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.background = 'transparent'; }}
                  title={`Selecionar somente "${opt.label}"`}
                >✓</button>
              )}
            </div>
          );
        })}
      </div>,
      document.body,
    );
  };

  return (
    <div style={{ marginBottom: 0, position: 'relative' }} ref={containerRef}>
      <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
        Canal
      </label>
      <div ref={triggerRef}>
        <div
          onClick={handleOpen}
          style={{
            width: '100%', padding: '12px 16px', backgroundColor: '#2a2f36', color: '#F8F9FA',
            border: `1px solid ${isOpen ? '#FF6600' : '#444'}`, borderRadius: '8px',
            fontSize: '0.875rem', fontWeight: 500, fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.backgroundColor = '#343A40'; }}
          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.backgroundColor = '#2a2f36'; }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{getDisplayText()}</span>
          <span style={{ fontSize: '0.6rem', marginLeft: 8, color: '#adb5bd', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </div>
      </div>
      {renderDropdown()}
    </div>
  );
}

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
              {/* Filtro Período */}
              <DateRangePicker
                periodoSelecionado={filtros.periodoSelecionado || 'todos'}
                dataInicio={filtros.periodoInicio}
                dataFim={filtros.periodoFim}
                onPeriodoChange={(p) => onFiltrosChange({ ...filtros, periodoSelecionado: p })}
                onDataInicioChange={(d) => onFiltrosChange({ ...filtros, periodoInicio: d })}
                onDataFimChange={(d) => onFiltrosChange({ ...filtros, periodoFim: d })}
                onRangeChange={(p, inicio, fim) => onFiltrosChange({ ...filtros, periodoSelecionado: p, periodoInicio: inicio, periodoFim: fim })}
              />

              {/* Filtro Funil - Multi-select */}
              <FunilMultiSelect
                selectedValues={filtros.tipoFunil}
                onChange={(vals) => onFiltrosChange({ ...filtros, tipoFunil: vals })}
              />

              {/* Filtro Origem - Multi-select */}
              <OrigemMultiSelect
                selectedValues={filtros.origem}
                onChange={(vals) => onFiltrosChange({ ...filtros, origem: vals })}
                origens={origens}
              />
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
