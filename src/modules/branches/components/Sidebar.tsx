/**
 * Sidebar do módulo de Branches
 * Com filtro de usuários estilo vendas (dropdown)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronRight, ChevronLeft, Home, LogOut, ChevronDown, Filter
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

export default function BranchesSidebar({
  isCollapsed,
  onCollapseChange,
  filterUsers,
  onFilterUsersChange,
}: BranchesSidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const toggleUser = (username: string) => {
    if (filterUsers.includes(username)) {
      onFilterUsersChange(filterUsers.filter(u => u !== username));
    } else {
      onFilterUsersChange([...filterUsers, username]);
    }
  };

  const getDisplayText = () => {
    if (filterUsers.length === 0) return 'Todos os usuários';
    if (filterUsers.length === AUTHORIZED_USERS.length) return 'Todos selecionados';
    const names = filterUsers.map(u => {
      const found = AUTHORIZED_USERS.find(au => au.username === u);
      return found ? found.nome.split(' ')[0] : u;
    });
    return names.join(', ');
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

            {/* Label */}
            <label
              style={{
                display: 'block',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Usuário
            </label>

            {/* Trigger Button (estilo vendas) */}
            <div style={{ position: 'relative' }}>
              <button
                ref={triggerRef}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#2a2f36',
                  color: '#F8F9FA',
                  border: `1px solid ${dropdownOpen ? '#FF6600' : '#444'}`,
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: 'Poppins, sans-serif',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!dropdownOpen) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF6600';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#343A40';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dropdownOpen) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#444';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2a2f36';
                  }
                }}
              >
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    color: filterUsers.length > 0 ? '#FF6600' : '#F8F9FA',
                  }}
                >
                  {getDisplayText()}
                </span>
                <ChevronDown
                  size={16}
                  style={{
                    flexShrink: 0,
                    color: '#6c757d',
                    transition: 'transform 0.2s',
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                />
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#2a2f36',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    zIndex: 9999,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Opção "Todos" */}
                  <button
                    onClick={() => { onFilterUsersChange([]); setDropdownOpen(false); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif',
                      color: filterUsers.length === 0 ? '#FF6600' : '#ccc',
                      fontWeight: filterUsers.length === 0 ? 600 : 400,
                      backgroundColor: filterUsers.length === 0 ? '#1f2329' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #333',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1f2329'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = filterUsers.length === 0 ? '#1f2329' : 'transparent'; }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: `2px solid ${filterUsers.length === 0 ? '#FF6600' : '#555'}`,
                        backgroundColor: filterUsers.length === 0 ? '#FF6600' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {filterUsers.length === 0 && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    Todos os usuários
                  </button>

                  {/* Lista de usuários */}
                  {AUTHORIZED_USERS.map(u => {
                    const isSelected = filterUsers.includes(u.username);
                    const firstName = u.nome.split(' ')[0];
                    return (
                      <button
                        key={u.username}
                        onClick={() => toggleUser(u.username)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '0.9rem',
                          fontFamily: 'Poppins, sans-serif',
                          color: isSelected ? '#FF6600' : '#ccc',
                          fontWeight: isSelected ? 600 : 400,
                          backgroundColor: isSelected ? '#1f2329' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1f2329'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected ? '#1f2329' : 'transparent'; }}
                      >
                        {/* Checkbox visual */}
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '3px',
                            border: `2px solid ${isSelected ? '#FF6600' : '#555'}`,
                            backgroundColor: isSelected ? '#FF6600' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                        >
                          {isSelected && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <span style={{ display: 'block' }}>{firstName}</span>
                          <span style={{ fontSize: '0.7rem', color: '#6c757d' }}>@{u.username}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
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
  );
}
