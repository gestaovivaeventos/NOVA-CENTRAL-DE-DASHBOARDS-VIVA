/**
 * GestaoRedeLayout - Layout wrapper para o módulo
 * Inclui sidebar de navegação e estrutura principal
 * Segue o padrão do módulo de Vendas
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  LogOut, 
  Menu, 
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { FiltrosGestaoRede } from '../types';
import { FilterPanel } from './filters';

interface GestaoRedeLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard';
  filtros?: FiltrosGestaoRede;
  onFiltrosChange?: (filtros: FiltrosGestaoRede) => void;
  consultoresDisponiveis?: string[];
}

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function GestaoRedeLayout({ 
  children, 
  currentPage, 
  filtros, 
  onFiltrosChange, 
  consultoresDisponiveis = [] 
}: GestaoRedeLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gestao_rede_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      localStorage.setItem('gestao_rede_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed, isMobile]);

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

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/gestao-rede',
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleFiltrosChange = (novosFiltros: Partial<FiltrosGestaoRede>) => {
    if (onFiltrosChange && filtros) {
      onFiltrosChange({ ...filtros, ...novosFiltros });
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
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Botão de menu mobile */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
            backgroundColor: '#343A40',
            border: '1px solid #FF6600',
            borderRadius: '8px',
            padding: '8px',
            color: '#FF6600',
            cursor: 'pointer',
          }}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: isMobile ? (isMobileMenuOpen ? 0 : '-100%') : 0,
          height: '100vh',
          width: isMobile ? SIDEBAR_WIDTH_EXPANDED : (isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED),
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          zIndex: 45,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Header da Sidebar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #333',
          minHeight: '64px',
        }}>
          {(!isCollapsed || isMobile) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #FF6600 0%, #FF8533 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <LayoutDashboard size={20} color="#fff" />
              </div>
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#F8F9FA',
                fontFamily: 'Poppins, sans-serif',
              }}>
                Gestão Rede
              </span>
            </div>
          )}
          
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
                flexShrink: 0,
              }}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Menu Items */}
        <nav style={{ padding: '16px 8px' }}>
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && setIsMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  backgroundColor: isActive ? '#FF660020' : 'transparent',
                  color: isActive ? '#FF6600' : '#adb5bd',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={20} />
                {(!isCollapsed || isMobile) && (
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'Poppins, sans-serif',
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Seção de Filtros - Igual ao Vendas */}
        {(!isCollapsed || isMobile) && onFiltrosChange && filtros && (
          <>
            <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '0 16px' }} />
            <div style={{ padding: '0 16px', flex: 1 }}>
              <FilterPanel
                filtros={filtros}
                onFiltrosChange={handleFiltrosChange}
                consultoresDisponiveis={consultoresDisponiveis}
              />
            </div>
          </>
        )}

        {/* Espaçador flexível */}
        <div style={{ flex: 1 }} />

        {/* Footer da Sidebar */}
        <div style={{
          padding: '16px 8px',
          borderTop: '1px solid #333',
        }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              color: '#adb5bd',
              textDecoration: 'none',
              transition: 'all 0.2s',
            }}
          >
            <Home size={20} />
            {(!isCollapsed || isMobile) && (
              <span style={{ fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                Central
              </span>
            )}
          </Link>
          
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '8px',
              color: '#dc3545',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <LogOut size={20} />
            {(!isCollapsed || isMobile) && (
              <span style={{ fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif' }}>
                Sair
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main style={{
        flex: 1,
        marginLeft: isMobile ? 0 : (isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED),
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        backgroundColor: '#212529',
      }}>
        {children}
      </main>
    </div>
  );
}
