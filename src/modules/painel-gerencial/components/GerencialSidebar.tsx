'use client';

import React from 'react';
import Link from 'next/link';

interface GerencialSidebarProps {
  equipeSelecionada: string;
  onEquipeChange: (equipe: string) => void;
  equipes: string[];
}

export const GerencialSidebar: React.FC<GerencialSidebarProps> = ({
  equipeSelecionada,
  onEquipeChange,
  equipes,
}) => {
  return (
    <aside
      style={{
        width: '220px',
        minHeight: '100vh',
        backgroundColor: '#1e293b',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        borderRight: '1px solid #334155',
      }}
    >
      {/* Navegação */}
      <div>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: '0.9rem',
            marginBottom: '16px',
          }}
        >
          <span>←</span>
          <span>Voltar à Central</span>
        </Link>
      </div>

      {/* Filtro de Equipes */}
      <div>
        <h3
          style={{
            color: '#FF6600',
            fontSize: '0.8rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '12px',
          }}
        >
          Equipe
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => onEquipeChange('Todas')}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.9rem',
              backgroundColor: equipeSelecionada === 'Todas' ? '#FF6600' : 'transparent',
              color: equipeSelecionada === 'Todas' ? '#fff' : '#cbd5e1',
              transition: 'all 0.2s ease',
            }}
          >
            Todas as Equipes
          </button>
          {equipes.map((equipe) => (
            <button
              key={equipe}
              onClick={() => onEquipeChange(equipe)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.9rem',
                backgroundColor: equipeSelecionada === equipe ? '#FF6600' : 'transparent',
                color: equipeSelecionada === equipe ? '#fff' : '#cbd5e1',
                transition: 'all 0.2s ease',
              }}
            >
              {equipe}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default GerencialSidebar;
