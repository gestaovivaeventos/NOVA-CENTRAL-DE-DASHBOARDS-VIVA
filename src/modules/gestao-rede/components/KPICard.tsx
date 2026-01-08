/**
 * KPICard - Card de KPI com valor destacado
 * Padrão Viva Eventos
 */

import React from 'react';

interface KPICardProps {
  titulo: string;
  valor: number;
  total?: number;
  porcentagem?: number;
  cor?: string;
  icone?: React.ReactNode;
  subtitulo?: string;
  onClick?: () => void;
  selecionado?: boolean;
}

export default function KPICard({ 
  titulo, 
  valor, 
  total, 
  porcentagem, 
  cor = '#FF6600',
  icone,
  subtitulo,
  onClick,
  selecionado = false
}: KPICardProps) {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: selecionado 
          ? `0 4px 20px ${cor}40` 
          : '0 2px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        border: selecionado ? `2px solid ${cor}` : '2px solid transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 6px 20px ${cor}30`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = selecionado 
            ? `0 4px 20px ${cor}40` 
            : '0 2px 8px rgba(0, 0, 0, 0.3)';
        }
      }}
    >
      {/* Barra de cor no topo */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: cor,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            color: '#adb5bd',
            fontSize: '0.85rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            fontFamily: 'Poppins, sans-serif'
          }}>
            {titulo}
          </p>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              color: cor,
              fontSize: '2.5rem',
              fontWeight: 700,
              fontFamily: "'Orbitron', 'Poppins', sans-serif",
              lineHeight: 1,
            }}>
              {valor}
            </span>
            
            {total !== undefined && (
              <span style={{
                color: '#6c757d',
                fontSize: '1rem',
                fontWeight: 400,
              }}>
                / {total}
              </span>
            )}
          </div>

          {porcentagem !== undefined && (
            <p style={{
              color: '#adb5bd',
              fontSize: '0.9rem',
              marginTop: '8px',
            }}>
              {porcentagem.toFixed(1)}% do total
            </p>
          )}

          {subtitulo && (
            <p style={{
              color: '#6c757d',
              fontSize: '0.8rem',
              marginTop: '4px',
            }}>
              {subtitulo}
            </p>
          )}
        </div>

        {icone && (
          <div style={{ 
            color: cor, 
            opacity: 0.6,
            marginTop: '4px'
          }}>
            {icone}
          </div>
        )}
      </div>
    </div>
  );
}
