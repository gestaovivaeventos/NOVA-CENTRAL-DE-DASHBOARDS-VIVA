/**
 * FiltrosBar — Barra de filtros horizontal (Ano, Tipo Instituição, Área)
 */

import React from 'react';
import { Filter } from 'lucide-react';
import type { FiltrosAnaliseMercado, TipoInstituicao } from '../types';

interface FiltrosBarProps {
  filtros: FiltrosAnaliseMercado;
  onChange: (filtros: Partial<FiltrosAnaliseMercado>) => void;
  anosDisponiveis: number[];
  areasDisponiveis: string[];
}

export default function FiltrosBar({ filtros, onChange, anosDisponiveis, areasDisponiveis }: FiltrosBarProps) {
  const selectStyle: React.CSSProperties = {
    backgroundColor: '#2D3238',
    color: '#F8F9FA',
    border: '1px solid #495057',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: '0.78rem',
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer',
    outline: 'none',
    minWidth: 120,
  };

  const labelStyle: React.CSSProperties = {
    color: '#6C757D',
    fontSize: '0.65rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end',
      backgroundColor: '#2D3238', borderRadius: 10, padding: '12px 16px',
      border: '1px solid #3D4349', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
        <Filter size={16} color="#FF6600" />
        <span style={{ color: '#FF6600', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>
          Filtros
        </span>
      </div>

      {/* Ano */}
      <div>
        <label style={labelStyle}>Ano</label>
        <select
          style={selectStyle}
          value={filtros.ano}
          onChange={e => onChange({ ano: Number(e.target.value) })}
        >
          {anosDisponiveis.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Tipo Instituição */}
      <div>
        <label style={labelStyle}>Instituição</label>
        <select
          style={selectStyle}
          value={filtros.tipoInstituicao}
          onChange={e => onChange({ tipoInstituicao: e.target.value as TipoInstituicao })}
        >
          <option value="todos">Todas</option>
          <option value="publica">Pública</option>
          <option value="privada">Privada</option>
        </select>
      </div>

      {/* Área de Conhecimento */}
      <div>
        <label style={labelStyle}>Área</label>
        <select
          style={selectStyle}
          value={filtros.areaConhecimento || ''}
          onChange={e => onChange({ areaConhecimento: e.target.value || null })}
        >
          <option value="">Todas as áreas</option>
          {areasDisponiveis.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Estado (se selecionado no mapa) */}
      {filtros.estado && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(255,102,0,0.12)', border: '1px solid #FF6600',
          borderRadius: 6, padding: '6px 10px',
        }}>
          <span style={{ color: '#FF6600', fontSize: '0.78rem', fontWeight: 600 }}>
            Estado: {filtros.estado}
          </span>
          <button
            onClick={() => onChange({ estado: null })}
            style={{
              background: 'none', border: 'none', color: '#FF6600',
              cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Franquia selecionada */}
      {filtros.franquiaId && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid #3B82F6',
          borderRadius: 6, padding: '6px 10px',
        }}>
          <span style={{ color: '#3B82F6', fontSize: '0.78rem', fontWeight: 600 }}>
            Franquia ativa
          </span>
          <button
            onClick={() => onChange({ franquiaId: null })}
            style={{
              background: 'none', border: 'none', color: '#3B82F6',
              cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
