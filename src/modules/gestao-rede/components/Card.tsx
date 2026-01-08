/**
 * Card - Componente reutilizável
 * Padrão Viva Eventos
 */

import React from 'react';

interface CardProps {
  titulo?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ titulo, children, className = '' }: CardProps) {
  return (
    <div 
      className={`card ${className}`}
      style={{
        backgroundColor: '#343A40',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease'
      }}
    >
      {titulo && (
        <h3 
          className="card-title" 
          style={{
            color: '#adb5bd',
            fontSize: '1.2rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '16px',
            paddingBottom: '8px',
            borderBottom: '1px solid #555',
            fontFamily: 'Poppins, sans-serif'
          }}
        >
          {titulo}
        </h3>
      )}
      <div style={{ color: '#F8F9FA' }}>
        {children}
      </div>
    </div>
  );
}
