'use client';

import React from 'react';

interface GerencialLoaderProps {
  message?: string;
}

export const GerencialLoader: React.FC<GerencialLoaderProps> = ({ message = 'Carregando dados do painel...' }) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: '16px',
      }}
    >
      <div 
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255, 102, 0, 0.2)',
          borderTop: '4px solid #FF6600',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: '#9ca3af', fontSize: '0.95rem' }}>{message}</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GerencialLoader;
