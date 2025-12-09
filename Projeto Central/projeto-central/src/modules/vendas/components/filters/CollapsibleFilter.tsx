/**
 * Componente CollapsibleFilter - Filtro com opção de expandir/colapsar
 * Permite ocultar/mostrar o conteúdo do filtro clicando no header
 */

import React, { useState, useEffect } from 'react';

interface CollapsibleFilterProps {
  label: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  storageKey?: string; // Para persistir estado no localStorage
  badge?: number | string; // Mostrar badge com contagem de selecionados
}

export default function CollapsibleFilter({
  label,
  children,
  defaultExpanded = true,
  storageKey,
  badge,
}: CollapsibleFilterProps) {
  // Estado para controlar se está expandido ou colapsado
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [mounted, setMounted] = useState(false);

  // Carregar estado do localStorage após montagem
  useEffect(() => {
    setMounted(true);
    if (storageKey) {
      const saved = localStorage.getItem(`filter_${storageKey}`);
      if (saved !== null) {
        setIsExpanded(saved === 'true');
      }
    }
  }, [storageKey, defaultExpanded]);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (mounted && storageKey) {
      localStorage.setItem(`filter_${storageKey}`, String(isExpanded));
    }
  }, [isExpanded, storageKey, mounted]);

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Header clicável */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 0',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#adb5bd',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{label}</span>
          {badge !== undefined && badge !== 0 && badge !== '' && (
            <span
              style={{
                backgroundColor: '#FF6600',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {badge}
            </span>
          )}
        </div>
        
        {/* Ícone de seta */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Conteúdo do filtro (com animação) */}
      <div
        style={{
          overflow: 'hidden',
          maxHeight: isExpanded ? '500px' : '0',
          opacity: isExpanded ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div style={{ paddingTop: '4px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

