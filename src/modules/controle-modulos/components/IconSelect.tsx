/**
 * Seletor de ícone com preview, busca e categorias.
 * Reutilizado em EditModuloModal, EditGrupoModal, EditSubgrupoModal,
 * GerenciarGruposModal, GerenciarSubgruposModal e AddExternalLinkModal.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { ICONES, ICON_CATEGORIES, IconPreview } from '../config/icones';

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  /** Compacto: para uso inline (GerenciarGrupos/Subgrupos) */
  compact?: boolean;
}

export default function IconSelect({ value, onChange, style, compact = false }: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setSearch('');
      setActiveCategory(null);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    let list = ICONES;
    if (activeCategory) {
      list = list.filter(i => i.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, activeCategory]);

  const currentIcon = ICONES.find(i => i.value === value);
  const displayLabel = currentIcon ? currentIcon.label : value || 'Selecionar';

  if (compact) {
    return (
      <div ref={containerRef} style={{ position: 'relative', ...style }}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            backgroundColor: '#1a1d21',
            color: '#F8F9FA',
            border: '1px solid #444',
            borderRadius: 6,
            fontSize: '0.7rem',
            fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer',
            minWidth: 80,
          }}
        >
          <IconPreview value={value} size={14} color="#FF6600" />
          <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayLabel}
          </span>
          <ChevronDown size={12} style={{ color: '#6c757d', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: 280,
              maxHeight: 300,
              backgroundColor: '#1a1d21',
              border: '1px solid #444',
              borderRadius: 8,
              zIndex: 50,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <DropdownContent
              search={search}
              setSearch={setSearch}
              searchInputRef={searchInputRef}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              filtered={filtered}
              value={value}
              onChange={(v) => { onChange(v); setIsOpen(false); }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '10px 14px',
          backgroundColor: '#1a1d21',
          color: '#F8F9FA',
          border: '1px solid #444',
          borderRadius: 8,
          fontSize: '0.85rem',
          fontFamily: 'Poppins, sans-serif',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <IconPreview value={value} size={18} color="#FF6600" />
        <span style={{ flex: 1 }}>{displayLabel}</span>
        <span style={{ color: '#6c757d', fontSize: '0.7rem' }}>{value}</span>
        <ChevronDown size={16} style={{ color: '#6c757d', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 360,
            backgroundColor: '#1a1d21',
            border: '1px solid #444',
            borderRadius: '0 0 8px 8px',
            zIndex: 50,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <DropdownContent
            search={search}
            setSearch={setSearch}
            searchInputRef={searchInputRef}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            filtered={filtered}
            value={value}
            onChange={(v) => { onChange(v); setIsOpen(false); }}
          />
        </div>
      )}
    </div>
  );
}

// ── Conteúdo interno do dropdown (reutilizado por compact e normal) ──

function DropdownContent({
  search,
  setSearch,
  searchInputRef,
  activeCategory,
  setActiveCategory,
  filtered,
  value,
  onChange,
}: {
  search: string;
  setSearch: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  activeCategory: string | null;
  setActiveCategory: (v: string | null) => void;
  filtered: typeof ICONES;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      {/* Search */}
      <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid #333' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#6c757d', pointerEvents: 'none' }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ícone..."
            style={{
              width: '100%',
              padding: '6px 8px 6px 28px',
              backgroundColor: '#2d3239',
              color: '#F8F9FA',
              border: '1px solid #555',
              borderRadius: 6,
              fontSize: '0.78rem',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, paddingBottom: 4 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              border: 'none',
              fontSize: '0.65rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              backgroundColor: !activeCategory ? 'rgba(255,102,0,0.2)' : 'rgba(255,255,255,0.06)',
              color: !activeCategory ? '#FF6600' : '#adb5bd',
              fontWeight: !activeCategory ? 600 : 400,
            }}
          >
            Todos
          </button>
          {ICON_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                border: 'none',
                fontSize: '0.65rem',
                fontFamily: 'Poppins, sans-serif',
                cursor: 'pointer',
                backgroundColor: activeCategory === cat ? 'rgba(255,102,0,0.2)' : 'rgba(255,255,255,0.06)',
                color: activeCategory === cat ? '#FF6600' : '#adb5bd',
                fontWeight: activeCategory === cat ? 600 : 400,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Icon grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '12px', color: '#6c757d', fontSize: '0.78rem', textAlign: 'center' }}>
            Nenhum ícone encontrado
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 3 }}>
            {filtered.map(icon => {
              const selected = icon.value === value;
              return (
                <button
                  key={icon.value}
                  onClick={() => onChange(icon.value)}
                  title={`${icon.label} (${icon.value})`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 8px',
                    backgroundColor: selected ? 'rgba(255,102,0,0.12)' : 'transparent',
                    border: selected ? '1px solid rgba(255,102,0,0.4)' : '1px solid transparent',
                    borderRadius: 6,
                    color: selected ? '#FF6600' : '#F8F9FA',
                    fontSize: '0.73rem',
                    fontFamily: 'Poppins, sans-serif',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <IconPreview value={icon.value} size={16} color={selected ? '#FF6600' : '#adb5bd'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {icon.label}
                  </span>
                  {selected && <Check size={12} color="#FF6600" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 8px', borderTop: '1px solid #333', color: '#6c757d', fontSize: '0.65rem', textAlign: 'right' }}>
        {filtered.length} ícones
      </div>
    </>
  );
}
