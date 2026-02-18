/**
 * Header do módulo de Branches
 */

import React from 'react';
import Image from 'next/image';

export default function BranchesHeader() {
  return (
    <header
      style={{
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div className="px-4 py-4">
        <div
          className="p-5 rounded-lg flex justify-between items-center"
          style={{
            backgroundColor: '#343A40',
            boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
            borderBottom: '3px solid #FF6600',
          }}
        >
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="relative w-44 h-14">
              <Image
                src="/images/logo_viva.png"
                alt="Viva Eventos"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            {/* Título */}
            <div className="border-l border-gray-600 pl-6 h-14 flex items-center">
              <h1
                className="text-2xl md:text-3xl font-bold uppercase tracking-wider"
                style={{
                  fontFamily: "'Orbitron', 'Poppins', sans-serif",
                  background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                Gerenciamento de Branches
              </h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
