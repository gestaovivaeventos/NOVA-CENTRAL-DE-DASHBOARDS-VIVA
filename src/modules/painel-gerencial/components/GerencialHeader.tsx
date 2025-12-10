'use client';

import React from 'react';
import Image from 'next/image';

interface GerencialHeaderProps {
  competencia?: string;
}

export const GerencialHeader: React.FC<GerencialHeaderProps> = ({ competencia }) => {
  return (
    <header className="bg-dark-primary transition-all duration-300 mb-6">
      <div 
        className="bg-dark-secondary p-5 rounded-lg flex justify-between items-center"
        style={{
          boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
          borderBottom: '3px solid #FF6600',
        }}
      >
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="relative w-20 h-14">
            <Image 
              src="/images/logo_viva.png" 
              alt="Logo Viva"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
          
          {/* Título */}
          <div className="border-l border-gray-600 pl-6 h-14 flex flex-col justify-center">
            <h1 
              className="text-2xl font-bold uppercase tracking-wider"
              style={{ 
                fontFamily: "'Orbitron', 'Poppins', sans-serif",
                background: `linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              }}
            >
              Painel Gerencial
            </h1>
            <p 
              className="text-sm uppercase tracking-wider"
              style={{ color: '#ADB5BD' }}
            >
              Visão Consolidada {competencia && `| ${competencia}`}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GerencialHeader;
