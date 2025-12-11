'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface HeaderProps {
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header style={{
      backgroundColor: '#1a1d21',
      borderBottom: '3px solid #FF6600',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Left side - Menu toggle + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          style={{
            display: 'none',
            padding: '8px',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#F8F9FA',
          }}
          className="lg-hidden"
          aria-label="Toggle menu"
        >
          <svg
            style={{ width: '24px', height: '24px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Logo Viva */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none' }}>
          <Image
            src="/images/logo_viva.png"
            alt="Viva Eventos"
            width={90}
            height={35}
            style={{ objectFit: 'contain' }}
            priority
          />
          
          {/* Divisor */}
          <div style={{
            width: '2px',
            height: '40px',
            background: 'linear-gradient(to bottom, transparent, #FF6600, transparent)',
          }} />

          {/* Title */}
          <div>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Orbitron', 'Poppins', sans-serif",
              letterSpacing: '0.05em',
              marginBottom: '0px',
              textTransform: 'uppercase',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Central de Dashboards
            </h1>
            <p style={{
              color: '#FF6600',
              fontSize: '0.75em',
              fontWeight: 500,
              margin: 0,
              letterSpacing: '1px',
              fontFamily: "'Poppins', sans-serif",
            }}>
              Gestão Integrada
            </p>
          </div>
        </Link>
      </div>

      {/* Right side - User info + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* User info */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* User details */}
            <div style={{ textAlign: 'right' }}>
              <p style={{
                color: '#F8F9FA',
                fontSize: '0.95em',
                fontWeight: 600,
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {user.firstName}
              </p>
              <p style={{
                color: '#adb5bd',
                fontSize: '0.75em',
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {user.unitNames?.[0] || 'Unidade'}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 102, 0, 0.1)',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            cursor: 'pointer',
            color: '#FF6600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: '0.85em',
          }}
          title="Sair"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.2)';
            e.currentTarget.style.borderColor = '#FF6600';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 102, 0, 0.3)';
          }}
        >
          <svg
            style={{ width: '18px', height: '18px' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden-mobile">Sair</span>
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .lg-hidden {
            display: flex !important;
          }
          .hidden-mobile {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;
