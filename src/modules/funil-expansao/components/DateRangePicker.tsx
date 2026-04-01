/**
 * DateRangePicker - Seletor de intervalo de datas para Funil de Expansão
 * Dropdown com filtros rápidos + período personalizado (padrão vendas)
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const QUICK_PERIODS = [
  { value: 'todos', label: 'Todo o período' },
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'ultimos7dias', label: 'Últimos 7 dias' },
  { value: 'ultimos30dias', label: 'Últimos 30 dias' },
  { value: 'estemes', label: 'Este mês' },
  { value: 'mespassado', label: 'Mês passado' },
  { value: 'esteanoateagora', label: 'Este ano até agora' },
  { value: 'esteano', label: 'Este ano' },
  { value: 'anopassado', label: 'Ano passado' },
];

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

interface DateRangePickerProps {
  periodoSelecionado: string;
  dataInicio: string;
  dataFim: string;
  onPeriodoChange: (periodo: string) => void;
  onDataInicioChange: (data: string) => void;
  onDataFimChange: (data: string) => void;
  /** Callback único para atualizar período + datas de uma vez (evita race condition com closures) */
  onRangeChange?: (periodo: string, dataInicio: string, dataFim: string) => void;
}

function getPredefinedPeriod(period: string): { start: Date; end: Date } | null {
  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = hoje.getMonth();
  const day = hoje.getDate();

  switch (period) {
    case 'hoje':
      return { start: new Date(year, month, day), end: new Date(year, month, day) };
    case 'ontem': {
      const d = new Date(hoje); d.setDate(day - 1);
      return { start: d, end: new Date(d) };
    }
    case 'ultimos7dias': {
      const d = new Date(hoje); d.setDate(day - 6);
      return { start: d, end: hoje };
    }
    case 'ultimos30dias': {
      const d = new Date(hoje); d.setDate(day - 29);
      return { start: d, end: hoje };
    }
    case 'estemes':
      return { start: new Date(year, month, 1), end: new Date(year, month + 1, 0) };
    case 'mespassado':
      return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) };
    case 'esteanoateagora':
      return { start: new Date(year, 0, 1), end: hoje };
    case 'esteano':
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
    case 'anopassado':
      return { start: new Date(year - 1, 0, 1), end: new Date(year - 1, 11, 31) };
    default:
      return null;
  }
}

function formatDateForInput(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export default function DateRangePicker({
  periodoSelecionado, dataInicio, dataFim,
  onPeriodoChange, onDataInicioChange, onDataFimChange, onRangeChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const update = () => { if (isOpen && triggerRef.current) calcPos(); };
    if (isOpen) {
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropH = 400;
    const below = window.innerHeight - rect.bottom;
    const openUp = below < dropH && rect.top > dropH;
    setDropdownPos({
      top: openUp ? rect.top - dropH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  const handleOpen = () => { if (!isOpen) calcPos(); setIsOpen(!isOpen); };

  const handleQuickPeriod = (period: string) => {
    if (period === 'todos') {
      if (onRangeChange) {
        onRangeChange('todos', '', '');
      } else {
        onPeriodoChange('todos');
        onDataInicioChange('');
        onDataFimChange('');
      }
      setIsOpen(false);
      return;
    }
    const dates = getPredefinedPeriod(period);
    if (dates) {
      const inicio = formatDateForInput(dates.start);
      const fim = formatDateForInput(dates.end);
      if (onRangeChange) {
        onRangeChange(period, inicio, fim);
      } else {
        onPeriodoChange(period);
        onDataInicioChange(inicio);
        onDataFimChange(fim);
      }
    }
    setIsOpen(false);
  };

  const fmtDisplay = (s: string) => {
    if (!s) return '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const displayText = periodoSelecionado === 'todos'
    ? 'Todo o período'
    : dataInicio && dataFim
      ? `${fmtDisplay(dataInicio)} - ${fmtDisplay(dataFim)}`
      : 'Selecione o período';

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: '8px 10px', backgroundColor: '#1f2329', color: 'white',
    border: '1px solid #3a3f46', borderRadius: '6px', fontSize: '0.8rem',
    fontFamily: 'Poppins, sans-serif', outline: 'none', cursor: 'pointer',
  };

  const renderDropdown = () => {
    if (!isOpen || typeof document === 'undefined') return null;
    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width,
          backgroundColor: '#2a2f36', border: '2px solid #FF6600', borderRadius: '8px',
          zIndex: 9999, maxHeight: 400, overflow: 'hidden', boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
        }}
      >
        {/* Período Personalizado */}
        <div style={{ padding: 12, borderBottom: '1px solid #3a3f46' }}>
          <div style={{ color: '#adb5bd', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontFamily: 'Poppins, sans-serif' }}>
            Período Personalizado
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888', fontSize: '0.7rem', width: 30 }}>De:</span>
              <input type="date" value={dataInicio} style={inputStyle}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const newInicio = e.target.value;
                  if (onRangeChange) {
                    onRangeChange('personalizado', newInicio, dataFim);
                  } else {
                    onDataInicioChange(newInicio);
                    onPeriodoChange('personalizado');
                  }
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF6600'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#3a3f46'; }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#888', fontSize: '0.7rem', width: 30 }}>Até:</span>
              <input type="date" value={dataFim} style={inputStyle}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  const newFim = e.target.value;
                  if (onRangeChange) {
                    onRangeChange('personalizado', dataInicio, newFim);
                  } else {
                    onDataFimChange(newFim);
                    onPeriodoChange('personalizado');
                  }
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF6600'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#3a3f46'; }}
              />
            </div>
          </div>
        </div>

        {/* Atalhos Rápidos */}
        <div style={{ padding: '8px 12px 4px' }}>
          <div style={{ color: '#adb5bd', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontFamily: 'Poppins, sans-serif' }}>
            Atalhos Rápidos
          </div>
        </div>
        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
          {QUICK_PERIODS.map(opt => {
            const sel = periodoSelecionado === opt.value;
            return (
              <div key={opt.value} onClick={() => handleQuickPeriod(opt.value)}
                style={{
                  padding: '10px 12px', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Poppins, sans-serif',
                  color: sel ? '#FF6600' : '#ccc', fontWeight: sel ? 600 : 400,
                  backgroundColor: sel ? '#1f2329' : 'transparent', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1f2329'; e.currentTarget.style.color = '#FF6600'; }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = sel ? '#1f2329' : 'transparent';
                  e.currentTarget.style.color = sel ? '#FF6600' : '#ccc';
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: sel ? '2px solid #FF6600' : '2px solid #555',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF6600' }} />}
                </div>
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div style={{ marginBottom: 25, position: 'relative' }} ref={containerRef}>
      <label style={labelStyle}>Período</label>
      <div ref={triggerRef}>
        <div onClick={handleOpen}
          style={{ ...triggerStyle, borderColor: isOpen ? '#FF6600' : '#444' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6600'; e.currentTarget.style.backgroundColor = '#343A40'; }}
          onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.backgroundColor = '#2a2f36'; }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {displayText}
          </span>
          <span style={{
            fontSize: '0.6rem', marginLeft: 8, color: '#adb5bd',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s',
          }}>▼</span>
        </div>
      </div>
      {renderDropdown()}
    </div>
  );
}
