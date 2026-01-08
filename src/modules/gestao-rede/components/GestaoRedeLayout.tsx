/**
 * GestaoRedeLayout - Layout wrapper para o módulo
 * Inclui sidebar de navegação e estrutura principal
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Building2, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface GestaoRedeLayoutProps {
  children: React.ReactNode;
  currentPage: 'dashboard';
}

export default function GestaoRedeLayout({ children, currentPage }: GestaoRedeLayoutProps) {
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
        {/* Header da Sidebar */}
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
                  {user?.unitNames?.[0] || 'Franqueadora'}
                </p>
              </div>
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
        <nav style={{ flex: 1, padding: '16px 8px' }}>
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
        marginLeft: isMobile ? 0 : (isCollapsed ? '70px' : '280px'),
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh',
        backgroundColor: '#212529',
      }}>
        {children}
      </main>
    </div>
  );
}
