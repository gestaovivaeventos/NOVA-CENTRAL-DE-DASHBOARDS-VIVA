/**
 * Componente SingleSelect - Seleção única de opção
 * Estilo baseado no MultiSelect do Vendas Refatorado
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#adb5bd',
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'Poppins, sans-serif',
};

const triggerStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: '#2a2f36',
  color: '#F8F9FA',
  border: '1px solid #444',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: 500,
  fontFamily: 'Poppins, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

interface SingleSelectProps {
  label: string;
  options: string[];
  selectedValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export default function SingleSelect({
  label,
  options,
  selectedValue,
  onChange,
  placeholder = 'Selecione...',
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0, openUpward: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const dropdownHeight = 300;

      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownPosition({
        top: shouldOpenUpward ? triggerRect.top - dropdownHeight - 4 : triggerRect.bottom + 4,
        left: triggerRect.left,
        width: triggerRect.width,
        openUpward: shouldOpenUpward,
      });

      setTimeout(() => setIsPositioned(true), 10);
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
  };

  const displayText = selectedValue || placeholder;

  return (
    <div ref={containerRef} style={{ marginBottom: '20px', position: 'relative' }}>
      <label style={labelStyle}>{label}</label>
      
      <div
        ref={triggerRef}
        style={{
          ...triggerStyle,
          borderColor: isOpen ? '#FF6600' : '#444',
          boxShadow: isOpen ? '0 0 0 2px rgba(255, 102, 0, 0.1)' : 'none',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ 
          color: selectedValue ? '#F8F9FA' : '#6c757d',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {displayText}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6c757d"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            marginLeft: '8px',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: '#2a2f36',
            border: '1px solid #FF6600',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 9999,
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            opacity: isPositioned ? 1 : 0,
            transform: isPositioned ? 'scale(1)' : 'scale(0.95)',
            transition: 'opacity 0.15s ease, transform 0.15s ease',
          }}
        >
          {/* Lista de opções */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}>
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#FF6600' : 'transparent',
                      color: isSelected ? 'white' : '#F8F9FA',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.875rem',
                      fontFamily: 'Poppins, sans-serif',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = '#343a40';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? 'white' : '#6c757d'}`,
                      backgroundColor: isSelected ? 'white' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FF6600"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                );
              })
            ) : (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '0.85rem',
                fontFamily: 'Poppins, sans-serif',
              }}>
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
