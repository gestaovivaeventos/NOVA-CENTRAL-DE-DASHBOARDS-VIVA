/**
 * PexLayout - Layout wrapper para páginas do módulo PEX
 * Inclui sidebar de navegação e filtros
 * Responsivo para mobile e desktop
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Trophy, BarChart3, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Home, LogOut, Filter, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface FilterConfig {
  showQuarter?: boolean;
  showCluster?: boolean;
  showUnidade?: boolean;
  showConsultor?: boolean;
  
  filtroQuarter?: string;
  filtroCluster?: string;
  filtroUnidade?: string;
  filtroConsultor?: string;
  
  onQuarterChange?: (value: string) => void;
  onClusterChange?: (value: string) => void;
  onUnidadeChange?: (value: string) => void;
  onConsultorChange?: (value: string) => void;
  
  listaQuarters?: string[];
  listaClusters?: string[];
  listaUnidades?: string[];
  listaConsultores?: string[];
}

interface PexLayoutProps {
  children: React.ReactNode;
  currentPage: 'ranking' | 'resultados' | 'parametros' | 'dashboard';
  filters?: FilterConfig;
}

export default function PexLayout({ children, currentPage, filters }: PexLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Inicializar com o valor salvo no localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pex_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistir estado da sidebar no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('pex_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verificar se é franqueador (accessLevel >= 1)
  const isFranchiser = typeof window !== 'undefined' 
    ? Number(localStorage.getItem('accessLevel') || '0') >= 1
    : false;

  const menuItems = [
    {
      id: 'ranking',
      label: 'Ranking',
      icon: Trophy,
      href: '/pex/ranking',
    },
    {
      id: 'resultados',
      label: 'Resultados',
      icon: BarChart3,
      href: '/pex/resultados',
    },
  ];

  // Adiciona Parâmetros apenas para franqueadores
  if (isFranchiser) {
    menuItems.push({
      id: 'parametros',
      label: 'Parâmetros',
      icon: Settings,
      href: '/pex/parametros',
    });
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const hasFilters = filters && (
    filters.showQuarter || 
    filters.showCluster || 
    filters.showUnidade || 
    filters.showConsultor
  );

  // Fechar sidebar ao clicar em um link (mobile fecha menu, desktop colapsa)
  const handleNavClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    } else {
      setIsCollapsed(true);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: '#212529',
      position: 'relative',
    }}>
      {/* Overlay para mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Botão Menu Mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '12px',
            left: '12px',
            zIndex: 60,
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: '#1a1d21',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FF6600',
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? '280px' : (isCollapsed ? '70px' : '280px'),
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          position: 'fixed',
          top: 0,
          left: isMobile ? (isMobileMenuOpen ? '0' : '-280px') : 0,
          bottom: 0,
          zIndex: 50,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header da Sidebar - Perfil do Usuário */}
        <div style={{
          padding: (isCollapsed && !isMobile) ? '16px 10px' : '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
        }}>
          {(!isCollapsed || isMobile) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              {/* Info do Usuário - sem círculo com letra */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  color: '#F8F9FA',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '2px',
                  lineHeight: '1.2',
                }}>
                  {user?.firstName || user?.username || 'Usuário'}
                </h2>
                <p style={{
                  color: '#6c757d',
                  fontSize: '0.7rem',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.2',
                }}>
                  {user?.unitNames?.[0] || 'Franquia'}
                </p>
                <p style={{
                  color: '#4a5568',
                  fontSize: '0.6rem',
                }}>
                  Atualizado: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* Botão Toggle - estilo igual ao Vendas */}
          {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
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
          )}
        </div>

        {/* Menu de Navegação */}
        <nav style={{ 
          padding: (isCollapsed && !isMobile) ? '20px 10px' : '20px',
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id} style={{ marginBottom: '8px' }}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: (isCollapsed && !isMobile) ? '0' : '12px',
                      padding: (isCollapsed && !isMobile) ? '12px' : '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'rgba(255, 102, 0, 0.1)' : 'transparent',
                      border: isActive ? '1px solid #FF6600' : '1px solid rgba(75, 85, 99, 0.5)',
                      color: isActive ? '#FF6600' : '#9ca3af',
                      textDecoration: 'none',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.2s',
                      justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
                      boxShadow: !isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                      height: '42px',
                    }}
                    title={(isCollapsed && !isMobile) ? item.label : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Seção de Filtros */}
        {hasFilters && (!isCollapsed || isMobile) && (
          <div style={{
            padding: '0 20px 20px 20px',
            borderTop: '1px solid #333',
            marginTop: '10px',
          }}>
            {/* Header dos Filtros */}
            <button
              onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '16px 0',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#F8F9FA',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} color="#FF6600" />
                <span style={{
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Filtros
                </span>
              </div>
              {isFiltersExpanded ? (
                <ChevronUp size={18} color="#adb5bd" />
              ) : (
                <ChevronDown size={18} color="#adb5bd" />
              )}
            </button>

            {/* Conteúdo dos Filtros */}
            <div style={{
              maxHeight: isFiltersExpanded ? '500px' : '0',
              opacity: isFiltersExpanded ? 1 : 0,
              overflow: isFiltersExpanded ? 'visible' : 'hidden',
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Filtro Quarter */}
                {filters.showQuarter && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#adb5bd',
                      fontSize: '0.8rem',
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      Quarter
                    </label>
                    <select
                      value={filters.filtroQuarter || ''}
                      onChange={(e) => filters.onQuarterChange?.(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#2a2f36',
                        border: '1px solid #444',
                        color: '#F8F9FA',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        appearance: 'auto',
                        WebkitAppearance: 'menulist',
                        position: 'relative',
                        zIndex: 100,
                      }}
                    >
                      {filters.listaQuarters?.map((q) => (
                        <option key={q} value={q}>{q}º Quarter</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro Cluster */}
                {filters.showCluster && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#adb5bd',
                      fontSize: '0.8rem',
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      Cluster
                    </label>
                    <select
                      value={filters.filtroCluster || ''}
                      onChange={(e) => filters.onClusterChange?.(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#2a2f36',
                        border: '1px solid #444',
                        color: '#F8F9FA',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        appearance: 'auto',
                        WebkitAppearance: 'menulist',
                        position: 'relative',
                        zIndex: 100,
                      }}
                    >
                      <option value="">Todos os Clusters</option>
                      {filters.listaClusters?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro Unidade */}
                {filters.showUnidade && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#adb5bd',
                      fontSize: '0.8rem',
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      Franquia
                    </label>
                    <select
                      value={filters.filtroUnidade || ''}
                      onChange={(e) => filters.onUnidadeChange?.(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#2a2f36',
                        border: '1px solid #444',
                        color: '#F8F9FA',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        appearance: 'auto',
                        WebkitAppearance: 'menulist',
                        position: 'relative',
                        zIndex: 100,
                      }}
                    >
                      {filters.listaUnidades?.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Filtro Consultor */}
                {filters.showConsultor && (
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#adb5bd',
                      fontSize: '0.8rem',
                      marginBottom: '6px',
                      fontWeight: 500,
                    }}>
                      Consultor
                    </label>
                    <select
                      value={filters.filtroConsultor || ''}
                      onChange={(e) => filters.onConsultorChange?.(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: '#2a2f36',
                        border: '1px solid #444',
                        color: '#F8F9FA',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        appearance: 'auto',
                        WebkitAppearance: 'menulist',
                        position: 'relative',
                        zIndex: 100,
                      }}
                    >
                      <option value="">Todos os Consultores</option>
                      {filters.listaConsultores?.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Botão de Filtros quando sidebar colapsada - REMOVIDO para padronizar com Vendas */}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer da Sidebar - Igual ao Vendas */}
        <div style={{
          padding: (isCollapsed && !isMobile) ? '15px 10px' : '15px 20px',
          borderTop: '1px solid #333',
        }}>
          {/* Voltar para Central */}
          <Link
            href="/"
            onClick={handleNavClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: (isCollapsed && !isMobile) ? '0' : '12px',
              padding: (isCollapsed && !isMobile) ? '10px' : '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              color: '#9ca3af',
              textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all 0.2s',
              justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
              marginBottom: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              width: '100%',
            }}
            title={(isCollapsed && !isMobile) ? 'Central de Dashboards' : undefined}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Home size={20} strokeWidth={2} />
            {(!isCollapsed || isMobile) && <span>Central de Dashboards</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={() => { handleNavClick(); handleLogout(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: (isCollapsed && !isMobile) ? '0' : '12px',
              padding: (isCollapsed && !isMobile) ? '10px' : '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              color: '#9ca3af',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              justifyContent: (isCollapsed && !isMobile) ? 'center' : 'flex-start',
              width: '100%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            title={(isCollapsed && !isMobile) ? 'Sair' : undefined}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
            }}
          >
            <LogOut size={20} strokeWidth={2} />
            {(!isCollapsed || isMobile) && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? '0' : (isCollapsed ? '70px' : '280px'),
          paddingTop: isMobile ? '60px' : '0',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  );
}
