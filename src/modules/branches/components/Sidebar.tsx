/**
 * Sidebar do módulo de Branches
 * Filtro de usuários idêntico ao MultiSelect do módulo de vendas
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/router';
import {
  ChevronRight, ChevronLeft, Home, LogOut, Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AUTHORIZED_USERS } from '../types';

interface BranchesSidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  filterUsers: string[];
  onFilterUsersChange: (users: string[]) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

// Estilos compartilhados (padrão vendas MultiSelect)
const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#adb5bd',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Poppins, sans-serif',
};

const triggerStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#2a2f36',
  color: '#F8F9FA',
  border: '1px solid #444',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 500,
  fontFamily: 'Poppins, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: '#1f2329',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
};

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export default function BranchesSidebar({
  isCollapsed,
  onCollapseChange,
  filterUsers,
  onFilterUsersChange,
}: BranchesSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Recalcular posição ao scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && isPositioned && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };
    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, isPositioned]);

  // Posicionar dropdown após renderizar
  useEffect(() => {
    if (isOpen && !isPositioned && triggerRef.current) {
      requestAnimationFrame(() => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
          setIsPositioned(true);
        }
      });
    }
  }, [isOpen, isPositioned]);

  // Reset posição quando fecha
  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      setSearchTerm('');
    }
  }, [isOpen]);

  const allUsernames = AUTHORIZED_USERS.map(u => u.username);

  const toggleUser = (username: string) => {
    if (filterUsers.includes(username)) {
      onFilterUsersChange(filterUsers.filter(u => u !== username));
    } else {
      onFilterUsersChange([...filterUsers, username]);
    }
  };

  const handleSelectAll = () => {
    if (filterUsers.length === allUsernames.length) {
      onFilterUsersChange([]);
    } else {
      onFilterUsersChange([...allUsernames]);
    }
  };

  const handleClearAll = () => {
    onFilterUsersChange([]);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({ top: -9999, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const getDisplayText = () => {
    if (filterUsers.length === 0) return 'Selecione usuários...';
    if (filterUsers.length === allUsernames.length) return 'Todos selecionados';
    if (filterUsers.length === 1) {
      const found = AUTHORIZED_USERS.find(u => u.username === filterUsers[0]);
      return found ? found.nome.split(' ')[0] : filterUsers[0];
    }
    return `${filterUsers.length} selecionados`;
  };

  const filteredUsers = AUTHORIZED_USERS.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Dropdown via portal (idêntico ao vendas MultiSelect)
  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          backgroundColor: '#2a2f36',
          border: '1px solid #444',
          borderRadius: '8px',
          zIndex: 9999,
          maxHeight: '300px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' as const : 'none' as const,
        }}
      >
        {/* Campo de pesquisa */}
        <div style={{ padding: '8px', borderBottom: '1px solid #3a3f46' }}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={searchInputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#555'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#444'; }}
            autoFocus
          />
        </div>

        {/* Ações: Todos / Limpar */}
        <div style={{
          display: 'flex',
          gap: '4px',
          padding: '6px 8px',
          borderBottom: '1px solid #3a3f46',
        }}>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              background: 'transparent',
              color: '#adb5bd',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#adb5bd'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {filterUsers.length === allUsernames.length ? '✗ Desmarcar' : '✓ Todos'}
          </button>
          <span style={{ color: '#3a3f46', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>|</span>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              background: 'transparent',
              color: '#adb5bd',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#adb5bd'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            ⟲ Limpar
          </button>
        </div>

        {/* Lista de usuários */}
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              padding: '16px 12px',
              textAlign: 'center',
              color: '#aaa',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}>
              Nenhum resultado encontrado
            </div>
          ) : (
            filteredUsers.map(u => {
              const isSelected = filterUsers.includes(u.username);
              const firstName = u.nome.split(' ')[0];
              return (
                <div
                  key={u.username}
                  style={{
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif',
                    color: isSelected ? '#FF6600' : '#ccc',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? '#1f2329' : 'transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f2329'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Área clicável para toggle */}
                  <div
                    onClick={() => toggleUser(u.username)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Checkbox visual */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: isSelected ? '2px solid #FF6600' : '2px solid #555',
                      backgroundColor: isSelected ? '#FF6600' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && (
                        <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={u.nome}>
                      {firstName}
                    </span>
                  </div>

                  {/* Botão "Somente" */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onFilterUsersChange([u.username]); }}
                    style={{
                      padding: '2px 5px',
                      background: 'transparent',
                      color: '#6c757d',
                      border: '1px solid #444',
                      borderRadius: '50%',
                      fontSize: '0.7rem',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      opacity: 0.6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#FF6600';
                      e.currentTarget.style.borderColor = '#FF6600';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(255, 102, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6c757d';
                      e.currentTarget.style.borderColor = '#444';
                      e.currentTarget.style.opacity = '0.6';
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title={`Selecionar somente "${firstName}"`}
                  >
                    ✓
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );

    if (typeof document !== 'undefined') {
      return createPortal(dropdownContent, document.body);
    }
    return null;
  };

  return (
    <>
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
                Gerenciamento de Branches
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
          {/* Filtro de Usuários */}
          {!isCollapsed ? (
            <div className="mb-6">
              {/* Header Filtros */}
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} color="#FF6600" />
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
                  Filtros
                </span>
              </div>

              {/* MultiSelect de Usuários (estilo vendas) */}
              <div style={{ marginBottom: '25px', position: 'relative' }} ref={containerRef}>
                <label style={labelStyle}>Usuário</label>
                <div ref={triggerRef}>
                  <div
                    onClick={handleOpen}
                    style={{
                      ...triggerStyle,
                      borderColor: isOpen ? '#FF6600' : '#444',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FF6600';
                      e.currentTarget.style.backgroundColor = '#343A40';
                    }}
                    onMouseLeave={(e) => {
                      if (!isOpen) e.currentTarget.style.borderColor = '#444';
                      e.currentTarget.style.backgroundColor = '#2a2f36';
                    }}
                  >
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {getDisplayText()}
                    </span>
                    <span style={{
                      fontSize: '0.6rem',
                      marginLeft: '8px',
                      color: '#adb5bd',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>▼</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Ícone de filtro quando colapsado */
            <div className="mb-6">
              <button
                className="w-full flex justify-center p-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: filterUsers.length > 0 ? 'rgba(255,102,0,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${filterUsers.length > 0 ? '#FF6600' : '#4b5563'}`,
                  color: filterUsers.length > 0 ? '#FF6600' : '#6c757d',
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => onCollapseChange(false)}
                title={`Filtro: ${filterUsers.length > 0 ? `${filterUsers.length} selecionado(s)` : 'Todos'}`}
              >
                <Filter size={20} />
                {filterUsers.length > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: '#FF6600',
                      color: '#fff',
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {filterUsers.length}
                  </span>
                )}
              </button>
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

      {/* Dropdown via Portal (fora da sidebar) */}
      {renderDropdown()}
    </>
  );
}
