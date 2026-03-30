/**
 * FiltroComBusca — Dropdown com campo de busca integrado
 * Suporta busca case-insensitive e aproximada (palavra parcial, sem acento)
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface FiltroComBuscaProps {
  label: string;
  value: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/* ── Helpers ── */

/** Remove acentos para comparação aproximada */
function removeAcentos(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Verifica se o texto "bate" com o termo de busca (case-insensitive, sem acento, parcial) */
function matchBusca(texto: string, termo: string): boolean {
  if (!termo) return true;
  const t = removeAcentos(texto.toLowerCase());
  const palavras = removeAcentos(termo.toLowerCase()).split(/\s+/).filter(Boolean);
  return palavras.every(p => t.includes(p));
}

export default function FiltroComBusca({
  label,
  value,
  placeholder = 'Todos',
  options,
  onChange,
}: FiltroComBuscaProps) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [destaque, setDestaque] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  // Filtra opções pela busca
  const opcoesFiltradas = useMemo(() => {
    if (!busca.trim()) return options;
    return options.filter(o => matchBusca(o.label, busca));
  }, [options, busca]);

  // Reset destaque ao filtrar
  useEffect(() => { setDestaque(-1); }, [opcoesFiltradas]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Foca input ao abrir
  useEffect(() => {
    if (aberto) {
      setBusca('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [aberto]);

  // Scroll no item destacado
  useEffect(() => {
    if (destaque >= 0 && listaRef.current) {
      const el = listaRef.current.children[destaque + 1] as HTMLElement; // +1 pelo item "Todos"
      if (el) el.scrollIntoView({ block: 'nearest' });
    }
  }, [destaque]);

  const selecionar = useCallback((val: string) => {
    onChange(val);
    setAberto(false);
    setBusca('');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const total = opcoesFiltradas.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDestaque(prev => (prev < total - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaque(prev => (prev > 0 ? prev - 1 : total - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (destaque >= 0 && destaque < total) {
        selecionar(opcoesFiltradas[destaque].value);
      }
    } else if (e.key === 'Escape') {
      setAberto(false);
    }
  }, [opcoesFiltradas, destaque, selecionar]);

  // Label exibida no botão
  const labelSelecionada = value
    ? options.find(o => o.value === value)?.label ?? value
    : placeholder;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label style={{
        color: '#6C757D',
        fontSize: '0.62rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: 3,
        display: 'block',
      }}>
        {label}
      </label>

      {/* Botão que abre dropdown */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%',
          backgroundColor: '#2D3238',
          color: value ? '#F8F9FA' : '#9CA3AF',
          border: aberto ? '1px solid #FF6600' : '1px solid #495057',
          borderRadius: 6,
          padding: '6px 28px 6px 10px',
          fontSize: '0.75rem',
          fontFamily: "'Poppins', sans-serif",
          cursor: 'pointer',
          outline: 'none',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          transition: 'border-color 0.15s',
        }}
      >
        {labelSelecionada}
        <span style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: `translateY(-50%) rotate(${aberto ? 180 : 0}deg)`,
          transition: 'transform 0.15s',
          fontSize: '0.6rem',
          color: '#9CA3AF',
          pointerEvents: 'none',
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      {aberto && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 9999,
          marginTop: 2,
          backgroundColor: '#2D3238',
          border: '1px solid #FF6600',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Campo de busca */}
          <div style={{ padding: '6px 8px', borderBottom: '1px solid #495057' }}>
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              style={{
                width: '100%',
                backgroundColor: '#1a1d21',
                color: '#F8F9FA',
                border: '1px solid #495057',
                borderRadius: 4,
                padding: '5px 8px',
                fontSize: '0.72rem',
                fontFamily: "'Poppins', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          {/* Lista de opções */}
          <div
            ref={listaRef}
            style={{
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {/* Opção "Todos" / placeholder */}
            <div
              onClick={() => selecionar('')}
              style={{
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontFamily: "'Poppins', sans-serif",
                color: !value ? '#FF6600' : '#9CA3AF',
                fontWeight: !value ? 600 : 400,
                cursor: 'pointer',
                backgroundColor: !value ? 'rgba(255,102,0,0.1)' : 'transparent',
                fontStyle: 'italic',
              }}
              onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = !value ? 'rgba(255,102,0,0.1)' : 'transparent'; }}
            >
              {placeholder}
            </div>

            {opcoesFiltradas.length === 0 ? (
              <div style={{
                padding: '12px 10px',
                fontSize: '0.7rem',
                color: '#6C757D',
                textAlign: 'center',
                fontStyle: 'italic',
              }}>
                Nenhum resultado encontrado
              </div>
            ) : (
              opcoesFiltradas.map((o, i) => (
                <div
                  key={o.value}
                  onClick={() => selecionar(o.value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.72rem',
                    fontFamily: "'Poppins', sans-serif",
                    color: o.value === value ? '#FF6600' : '#E5E7EB',
                    fontWeight: o.value === value ? 600 : 400,
                    cursor: 'pointer',
                    backgroundColor: i === destaque
                      ? 'rgba(255,102,0,0.2)'
                      : o.value === value
                        ? 'rgba(255,102,0,0.1)'
                        : 'transparent',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={e => {
                    setDestaque(i);
                    (e.target as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.backgroundColor =
                      o.value === value ? 'rgba(255,102,0,0.1)' : 'transparent';
                  }}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>

          {/* Contador */}
          {busca && (
            <div style={{
              padding: '4px 10px',
              borderTop: '1px solid #495057',
              fontSize: '0.6rem',
              color: '#6C757D',
              textAlign: 'right',
            }}>
              {opcoesFiltradas.length} de {options.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
