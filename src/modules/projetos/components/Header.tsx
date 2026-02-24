/**
 * Componente Header do Painel Gerencial de Projetos
 * Responsivo - adapta-se a mobile e desktop
 */

import React from 'react';
import Image from 'next/image';

interface HeaderProps {
  sidebarCollapsed?: boolean;
  isMobile?: boolean;
}

export default function Header({ sidebarCollapsed = false, isMobile = false }: HeaderProps) {
  return (
    <header className="bg-dark-primary transition-all duration-300">
      <div className={`${isMobile ? 'px-3 py-3 pt-16' : 'px-5 py-4'}`}>
        <div
          className={`bg-dark-secondary rounded-lg flex ${isMobile ? 'flex-col items-start gap-3 p-4' : 'justify-between items-center p-5'}`}
          style={{
            boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
            borderBottom: '3px solid #FF6600',
          }}
        >
          <div className={`flex items-center ${isMobile ? 'gap-3' : 'gap-6'}`}>
            {/* Logo */}
            <div className={`relative ${isMobile ? 'w-28 h-10' : 'w-44 h-14'}`}>
              <Image
                src="/images/logo_viva.png"
                alt="Viva Eventos"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Título */}
            <div className={`border-l border-gray-600 ${isMobile ? 'pl-3 h-10' : 'pl-6 h-14'} flex items-center`}>
              <h1
                className={`${isMobile ? 'text-lg' : 'text-3xl'} font-bold uppercase tracking-wider`}
                style={{
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                PAINEL DE PROJETOS
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Header };
