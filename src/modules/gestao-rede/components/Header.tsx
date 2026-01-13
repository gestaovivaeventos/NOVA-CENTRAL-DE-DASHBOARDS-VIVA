/**
 * Header - Gestão Rede
 * Barra de navegação principal - Padrão Viva Eventos
 */

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  titulo?: string;
}

export default function Header({ titulo = 'Gestão Rede' }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <div style={{ backgroundColor: '#212529' }}>
      <div className="container mx-auto px-4 py-6">
        <div 
          style={{
            backgroundColor: '#343A40',
            padding: '20px 30px',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
            borderBottom: '3px solid #FF6600',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Logo Viva Eventos */}
            <div style={{ position: 'relative', width: '180px', height: '60px' }}>
              <Image 
                src="/images/logo_viva.png" 
                alt="Viva Eventos" 
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            
            {/* Divisor com gradiente igual ao da Central */}
            <div style={{
              width: '2px',
              height: '40px',
              background: 'linear-gradient(to bottom, transparent, #FF6600, transparent)',
            }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h1 style={{ 
                fontSize: '1.75rem',
                fontWeight: 700,
                background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                letterSpacing: '0.05em',
                marginBottom: '4px',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                textTransform: 'uppercase'
              }}>
                {titulo}
              </h1>
              <span className="text-xs" style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
                Visão Geral da Rede de Franquias
              </span>
            </div>
          </div>

          {/* Seção de Usuário e Logout */}
          {user?.firstName && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p style={{ color: '#adb5bd', fontSize: '0.875rem', marginBottom: '4px' }}>
                  Bem-vindo(a),
                </p>
                <p style={{ color: '#F8F9FA', fontSize: '1rem', fontWeight: 600 }}>
                  {user.firstName}
                </p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #FF8A33 0%, #FF6600 50%, #D35400 100%)',
                  color: '#000',
                  border: '2px solid #FF6600',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontFamily: 'Poppins, sans-serif',
                  boxShadow: '0 8px 16px rgba(255, 102, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                  letterSpacing: '0.3px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(255, 102, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 102, 0, 0.35)';
                }}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
