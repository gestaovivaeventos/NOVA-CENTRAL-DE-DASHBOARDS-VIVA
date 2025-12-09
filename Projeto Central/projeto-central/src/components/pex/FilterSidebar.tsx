/**
 * FilterSidebar - Sidebar de Filtros Recolhível para PEX
 * Componente reutilizável para filtros de Quarter, Cluster, Unidade e Consultor
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface FilterSidebarProps {
  // Filtros disponíveis
  showQuarter?: boolean;
  showCluster?: boolean;
  showUnidade?: boolean;
  showConsultor?: boolean;

  // Valores dos filtros
  filtroQuarter?: string;
  filtroCluster?: string;
  filtroUnidade?: string;
  filtroConsultor?: string;

  // Callbacks para mudança de filtros
  onQuarterChange?: (value: string) => void;
  onClusterChange?: (value: string) => void;
  onUnidadeChange?: (value: string) => void;
  onConsultorChange?: (value: string) => void;

  // Opções para os selects
  listaQuarters?: string[];
  listaClusters?: string[];
  listaUnidades?: string[];
  listaConsultores?: string[];

  // Labels customizados
  labelQuarter?: string;
  labelCluster?: string;
  labelUnidade?: string;
  labelConsultor?: string;
}

export default function FilterSidebar({
  showQuarter = true,
  showCluster = true,
  showUnidade = false,
  showConsultor = false,
  
  filtroQuarter = '',
  filtroCluster = '',
  filtroUnidade = '',
  filtroConsultor = '',
  
  onQuarterChange,
  onClusterChange,
  onUnidadeChange,
  onConsultorChange,
  
  listaQuarters = [],
  listaClusters = [],
  listaUnidades = [],
  listaConsultores = [],
  
  labelQuarter = 'Quarter',
  labelCluster = 'Cluster',
  labelUnidade = 'Franquia',
  labelConsultor = 'Consultor',
}: FilterSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      style={{
        position: 'relative',
        backgroundColor: '#343A40',
        borderRadius: '12px',
        border: '1px solid #444',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        marginBottom: '30px',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header com botão de expandir/recolher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#2a2f36',
          borderBottom: isExpanded ? '1px solid #444' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={20} color="#FF6600" />
          <h3
            style={{
              color: '#F8F9FA',
              fontSize: '1.1rem',
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Orbitron', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Filtros
          </h3>
        </div>
        
        <button
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#adb5bd',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#FF6600')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#adb5bd')}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>

      {/* Conteúdo dos filtros */}
      <div
        style={{
          maxHeight: isExpanded ? '1000px' : '0',
          opacity: isExpanded ? 1 : 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Filtro Quarter */}
          {showQuarter && (
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                {labelQuarter}
              </label>
              <select
                value={filtroQuarter}
                onChange={(e) => onQuarterChange?.(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#2a2f36',
                  border: '1px solid #555',
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {listaQuarters.map((q) => (
                  <option key={q} value={q}>
                    {q}º Quarter
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Cluster */}
          {showCluster && (
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                {labelCluster}
              </label>
              <select
                value={filtroCluster}
                onChange={(e) => onClusterChange?.(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#2a2f36',
                  border: '1px solid #555',
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">Todos os Clusters</option>
                {listaClusters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Unidade/Franquia */}
          {showUnidade && (
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                {labelUnidade}
              </label>
              <select
                value={filtroUnidade}
                onChange={(e) => onUnidadeChange?.(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#2a2f36',
                  border: '1px solid #555',
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {listaUnidades.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro Consultor */}
          {showConsultor && (
            <div>
              <label
                style={{
                  display: 'block',
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                {labelConsultor}
              </label>
              <select
                value={filtroConsultor}
                onChange={(e) => onConsultorChange?.(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  backgroundColor: '#2a2f36',
                  border: '1px solid #555',
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">Todos os Consultores</option>
                {listaConsultores.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
