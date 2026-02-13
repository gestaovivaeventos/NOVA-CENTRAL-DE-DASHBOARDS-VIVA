/**
 * Painel de Filtros da Sidebar
 * Filtros de Status, Time, Responsável e Busca
 */

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { ProjetosFiltros, ProjetoStatus } from '../types';
import { TIMES_OPTIONS } from '../config/app.config';

interface FilterPanelProps {
  filtros: ProjetosFiltros;
  onFiltrosChange: (filtros: ProjetosFiltros) => void;
  responsaveis: string[];
  onRefresh: () => void;
}

const selectStyle: React.CSSProperties = {
  backgroundColor: '#1a1d21',
  border: '1px solid #333',
  color: '#F8FAFC',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '0.8rem',
  fontFamily: "'Poppins', sans-serif",
  width: '100%',
  outline: 'none',
  cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  color: '#ADB5BD',
  fontSize: '0.7rem',
  fontWeight: 600,
  fontFamily: "'Poppins', sans-serif",
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px',
  display: 'block',
};

const statusOptions: Array<{ value: ProjetoStatus | 'Todos'; label: string }> = [
  { value: 'Todos', label: '📋 Todos' },
  { value: 'Em Andamento', label: '🔄 Em Andamento' },
  { value: 'Passado', label: '⏳ Passados' },
  { value: 'Finalizado', label: '✅ Finalizados' },
  { value: 'Cancelado', label: '❌ Cancelados' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filtros,
  onFiltrosChange,
  responsaveis,
  onRefresh,
}) => {
  const handleChange = (field: keyof ProjetosFiltros, value: string) => {
    onFiltrosChange({ ...filtros, [field]: value });
  };

  const handleClear = () => {
    onFiltrosChange({
      status: 'Todos',
      time: '',
      responsavel: '',
      busca: '',
    });
  };

  return (
    <div className="space-y-5">
      {/* Título dos filtros */}
      <div className="flex items-center justify-between">
        <h3
          style={{
            color: '#ADB5BD',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          🔍 Filtros
        </h3>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md transition-all duration-200 hover:bg-orange-500/20"
          style={{ color: '#FF6600' }}
          title="Atualizar dados"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Busca */}
      <div>
        <label style={labelStyle}>Buscar Projeto</label>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: '#6c757d' }}
          />
          <input
            type="text"
            value={filtros.busca}
            onChange={(e) => handleChange('busca', e.target.value)}
            placeholder="Nome, objetivo, responsável..."
            style={{
              ...selectStyle,
              paddingLeft: '32px',
              cursor: 'text',
            }}
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label style={labelStyle}>Status</label>
        <select
          value={filtros.status}
          onChange={(e) => handleChange('status', e.target.value)}
          style={selectStyle}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Time */}
      <div>
        <label style={labelStyle}>Time</label>
        <select
          value={filtros.time}
          onChange={(e) => handleChange('time', e.target.value)}
          style={selectStyle}
        >
          <option value="">Todos os times</option>
          {TIMES_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Responsável */}
      <div>
        <label style={labelStyle}>Responsável</label>
        <select
          value={filtros.responsavel}
          onChange={(e) => handleChange('responsavel', e.target.value)}
          style={selectStyle}
        >
          <option value="">Todos</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Botão limpar filtros */}
      <button
        onClick={handleClear}
        className="w-full py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-white/5"
        style={{
          color: '#6c757d',
          border: '1px solid #333',
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        Limpar Filtros
      </button>
    </div>
  );
};

export default FilterPanel;
