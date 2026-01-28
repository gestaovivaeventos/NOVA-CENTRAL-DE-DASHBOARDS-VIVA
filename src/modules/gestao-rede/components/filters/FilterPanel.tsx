/**
 * Componente FilterPanel - Painel completo de filtros para Gestão Rede
 * Estilo igual ao módulo de Vendas
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import MultiSelect from './MultiSelect';
import { FiltrosGestaoRede } from '../../types';

// Opções de filtro de maturidade (atualizadas para novos valores da planilha)
const OPCOES_MATURIDADE = [
  { key: 'MADURA', label: 'Madura', cor: '#28a745' },
  { key: '3º ANO OP.', label: '3º Ano Op.', cor: '#ffc107' },
  { key: '2º ANO OP.', label: '2º Ano Op.', cor: '#ffc107' },
  { key: '1º ANO OP.', label: '1º Ano Op.', cor: '#ffc107' },
  { key: 'IMPLANTACAO', label: 'Implantação', cor: '#17a2b8' },
];

// Opções de filtro de classificação PEX (saúde)
const OPCOES_CLASSIFICACAO = [
  { key: 'TOP_PERFORMANCE', label: 'TOP Performance', cor: '#28a745' },
  { key: 'PERFORMANDO', label: 'Performando', cor: '#20c997' },
  { key: 'ATENCAO', label: 'Atenção', cor: '#ffc107' },
  { key: 'UTI_RECUPERACAO', label: 'UTI Recuperação', cor: '#dc3545' },
  { key: 'UTI_REPASSE', label: 'UTI Repasse', cor: '#c0392b' },
  { key: 'SEM_AVALIACAO', label: 'Sem Avaliação', cor: '#6c757d' },
];

// Opções de filtro de flags
const OPCOES_FLAGS = [
  { key: 'socioOperador', label: 'Sócio Operador', cor: '#e74c3c' },
  { key: 'timeCritico', label: 'Time Crítico', cor: '#f39c12' },
  { key: 'governanca', label: 'Governança', cor: '#9b59b6' },
  { key: 'semFlags', label: 'Sem Flags', cor: '#6c757d' },
];

interface FilterPanelProps {
  filtros: FiltrosGestaoRede;
  onFiltrosChange: (filtros: Partial<FiltrosGestaoRede>) => void;
}

export default function FilterPanel({
  filtros,
  onFiltrosChange,
}: FilterPanelProps) {
  // Estado para controlar se os filtros estão expandidos
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  return (
    <div>
      {/* Header dos Filtros */}
      <button
        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 0',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#F8F9FA',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={18} color="#FF6600" />
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Filtros
          </span>
        </div>
        {isFiltersExpanded ? (
          <ChevronUp size={18} color="#adb5bd" />
        ) : (
          <ChevronDown size={18} color="#adb5bd" />
        )}
      </button>

      {/* Conteúdo dos Filtros */}
      <div style={{
        maxHeight: isFiltersExpanded ? '2000px' : '0',
        opacity: isFiltersExpanded ? 1 : 0,
        overflow: isFiltersExpanded ? 'visible' : 'hidden',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '-1px' }}>
          {/* Filtro de Maturidade */}
          <MultiSelect
            label="Maturidade"
            options={OPCOES_MATURIDADE}
            selectedValues={filtros.maturidade}
            onChange={(maturidade) => onFiltrosChange({ maturidade })}
            placeholder="Todas as maturidades"
          />

          {/* Filtro de Classificação PEX (Saúde) */}
          <MultiSelect
            label="Classificação PEX"
            options={OPCOES_CLASSIFICACAO}
            selectedValues={filtros.classificacao}
            onChange={(classificacao) => onFiltrosChange({ classificacao })}
            placeholder="Todas as classificações"
          />

          {/* Filtro de Flags */}
          <MultiSelect
            label="Flags"
            options={OPCOES_FLAGS}
            selectedValues={filtros.flags}
            onChange={(flags) => onFiltrosChange({ flags })}
            placeholder="Todas as flags"
          />
        </div>
      </div>
    </div>
  );
}
