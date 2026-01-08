/**
 * Componente MultiSelect - Seleção múltipla de opções
 * Estilo baseado no módulo de Vendas - dropdown com pesquisa integrada
 * Usa position: fixed para evitar corte pelo overflow da sidebar
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Estilos inline no padrão do dashboard
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

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: '#1f2329',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '6px',
  fontSize: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
  outline: 'none',
};

interface MultiSelectProps {
  label: string;
  options: Array<{ key: string; label: string; cor?: string }>;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export default function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecione...',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, width: 0, openUpward: false });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
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

  // Recalcular posição quando a janela é redimensionada ou rolada
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && isPositioned && triggerRef.current && dropdownRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const actualHeight = dropdownRef.current.offsetHeight;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < actualHeight && rect.top > actualHeight;
        
        setDropdownPosition({
          top: openUpward ? rect.top - actualHeight - 4 : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          openUpward,
        });
      }
    };

    if (isOpen) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, isPositioned]);

  // Calcular posição real após o dropdown renderizar (invisível)
  useEffect(() => {
    if (isOpen && !isPositioned && dropdownRef.current && triggerRef.current) {
      requestAnimationFrame(() => {
        if (dropdownRef.current && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const actualHeight = dropdownRef.current.offsetHeight;
          const spaceBelow = window.innerHeight - rect.bottom;
          const openUpward = spaceBelow < actualHeight && rect.top > actualHeight;
          
          setDropdownPosition({
            top: openUpward ? rect.top - actualHeight - 4 : rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            openUpward,
          });
          setIsPositioned(true);
        }
      });
    }
  }, [isOpen, isPositioned]);

  // Reset isPositioned quando fecha
  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (!isOpen) {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: -9999,
          left: rect.left,
          width: rect.width,
          openUpward: false,
        });
      }
    }
    setIsOpen(!isOpen);
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (optionKey: string) => {
    if (selectedValues.includes(optionKey)) {
      onChange(selectedValues.filter((v) => v !== optionKey));
    } else {
      onChange([...selectedValues, optionKey]);
    }
  };

  const handleSelectOnly = (optionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([optionKey]);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.key));
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return 'Todos selecionados';
    if (selectedValues.length === 1) {
      const option = options.find(o => o.key === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          backgroundColor: '#2a2f36',
          border: '1px solid #444',
          borderRadius: '8px',
          zIndex: 9999,
          maxHeight: '300px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          opacity: isPositioned ? 1 : 0,
          pointerEvents: isPositioned ? 'auto' : 'none',
        }}
      >
        {/* Caixa de pesquisa dentro do dropdown */}
        <div style={{ padding: '8px', borderBottom: '1px solid #3a3f46' }}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={searchInputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#555'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#444'; }}
            autoFocus
          />
        </div>

        {/* Ações - Selecionar Todos / Limpar */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          padding: '6px 8px', 
          borderBottom: '1px solid #3a3f46' 
        }}>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              background: 'transparent',
              color: '#adb5bd',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#adb5bd'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {selectedValues.length === options.length ? '✗ Desmarcar' : '✓ Todos'}
          </button>
          <span style={{ color: '#3a3f46', fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}>|</span>
          <button
            type="button"
            onClick={handleClearAll}
            style={{
              flex: 1,
              padding: '4px 6px',
              background: 'transparent',
              color: '#adb5bd',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF6600'; e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#adb5bd'; e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            ⟲ Limpar
          </button>
        </div>

        {/* Lista de opções */}
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredOptions.length === 0 ? (
            <div style={{
              padding: '16px 12px',
              textAlign: 'center',
              color: '#aaa',
              fontSize: '0.85rem',
              fontStyle: 'italic',
            }}>
              Nenhum resultado encontrado
            </div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option.key);
              return (
                <div
                  key={option.key}
                  style={{
                    padding: '10px 12px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif',
                    color: isSelected ? '#FF6600' : '#ccc',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isSelected ? '#1f2329' : 'transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1f2329';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {/* Área clicável para toggle */}
                  <div 
                    onClick={() => handleToggle(option.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flex: 1,
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent) parent.style.color = '#FF6600';
                    }}
                    onMouseLeave={(e) => {
                      const parent = e.currentTarget.parentElement;
                      if (parent && !isSelected) parent.style.color = '#ccc';
                    }}
                  >
                    {/* Checkbox visual */}
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      border: isSelected ? '2px solid #FF6600' : '2px solid #555',
                      backgroundColor: isSelected ? '#FF6600' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && (
                        <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    {/* Indicador de cor (se houver) */}
                    {option.cor && (
                      <span style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: option.cor,
                        flexShrink: 0,
                      }} />
                    )}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {option.label}
                    </span>
                  </div>
                  
                  {/* Botão "Somente" */}
                  <button
                    onClick={(e) => handleSelectOnly(option.key, e)}
                    style={{
                      padding: '2px 5px',
                      background: 'transparent',
                      color: '#6c757d',
                      border: '1px solid #444',
                      borderRadius: '50%',
                      fontSize: '0.7rem',
                      fontFamily: 'Poppins, sans-serif',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      opacity: 0.6,
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.borderColor = '#FF6600';
                      e.currentTarget.style.color = '#FF6600';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.borderColor = '#444';
                      e.currentTarget.style.color = '#6c757d';
                      e.currentTarget.style.opacity = '0.6';
                    }}
                    title={`Selecionar apenas ${option.label}`}
                  >
                    ●
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );

    // Usar portal para renderizar fora da hierarquia do DOM
    if (typeof document !== 'undefined') {
      return createPortal(dropdownContent, document.body);
    }
    return null;
  };

  return (
    <div ref={containerRef} style={{ marginBottom: '12px' }}>
      <label style={labelStyle}>{label}</label>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          ...triggerStyle,
          borderColor: isOpen ? '#FF6600' : '#444',
        }}
        onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.borderColor = '#555'; }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.borderColor = '#444'; }}
      >
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: selectedValues.length === 0 ? '#6c757d' : '#F8F9FA',
        }}>
          {getDisplayText()}
        </span>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          color: '#adb5bd',
        }}>
          ▼
        </span>
      </div>
      {renderDropdown()}
    </div>
  );
}
