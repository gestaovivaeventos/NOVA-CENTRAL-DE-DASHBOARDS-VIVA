/**
 * Componente FilterPanel - Painel de filtros do módulo Carteira
 * Filtros hierárquicos: Período > Unidade > Consultores > Curso > Fundo > Saúde
 * Quando uma unidade é selecionada, os filtros abaixo mostram apenas dados correspondentes
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import MultiSelect from './MultiSelect';
import type { FiltrosCarteira, FiltrosCarteiraOpcoes } from '@/modules/carteira/types';

interface FilterPanelProps {
  filtros: FiltrosCarteira;
  opcoes: FiltrosCarteiraOpcoes;
  onFiltrosChange: (filtros: Partial<FiltrosCarteira>) => void;
}

export default function FilterPanel({
  filtros,
  opcoes,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {/* Filtro de Período */}
          <DateRangePicker
            periodoSelecionado={filtros.periodoSelecionado}
            dataInicio={filtros.dataInicio}
            dataFim={filtros.dataFim}
            onPeriodoChange={(periodoSelecionado) => onFiltrosChange({ periodoSelecionado })}
            onDataInicioChange={(dataInicio) => onFiltrosChange({ dataInicio })}
            onDataFimChange={(dataFim) => onFiltrosChange({ dataFim })}
          />

          {/* Filtro de Unidades (Filtro Principal - controla a hierarquia) */}
          {opcoes.unidades.length > 0 && (
            <MultiSelect
              label="Unidade"
              options={opcoes.unidades}
              selectedValues={filtros.unidades}
              onChange={(unidades) => {
                // Ao mudar unidade, limpar os filtros hierárquicos abaixo
                onFiltrosChange({ 
                  unidades,
                  consultorRelacionamento: [],
                  consultorAtendimento: [],
                  consultorProducao: [],
                  cursos: [],
                  fundos: [],
                });
              }}
              placeholder="Todas as unidades"
            />
          )}

          {/* Filtro de Consultor Relacionamento */}
          {opcoes.consultoresRelacionamento.length > 0 && (
            <MultiSelect
              label="Consultor Relacionamento"
              options={opcoes.consultoresRelacionamento}
              selectedValues={filtros.consultorRelacionamento}
              onChange={(consultorRelacionamento) => onFiltrosChange({ consultorRelacionamento })}
              placeholder="Todos os consultores"
            />
          )}

          {/* Filtro de Consultor Atendimento */}
          {opcoes.consultoresAtendimento.length > 0 && (
            <MultiSelect
              label="Consultor Atendimento"
              options={opcoes.consultoresAtendimento}
              selectedValues={filtros.consultorAtendimento}
              onChange={(consultorAtendimento) => onFiltrosChange({ consultorAtendimento })}
              placeholder="Todos os consultores"
            />
          )}

          {/* Filtro de Consultor Produção */}
          {opcoes.consultoresProducao.length > 0 && (
            <MultiSelect
              label="Consultor Produção"
              options={opcoes.consultoresProducao}
              selectedValues={filtros.consultorProducao}
              onChange={(consultorProducao) => onFiltrosChange({ consultorProducao })}
              placeholder="Todos os consultores"
            />
          )}

          {/* Filtro de Curso */}
          {opcoes.cursos && opcoes.cursos.length > 0 && (
            <MultiSelect
              label="Curso"
              options={opcoes.cursos}
              selectedValues={filtros.cursos || []}
              onChange={(cursos) => onFiltrosChange({ cursos })}
              placeholder="Todos os cursos"
            />
          )}

          {/* Filtro de Fundos */}
          {opcoes.fundos.length > 0 && (
            <MultiSelect
              label="Fundo"
              options={opcoes.fundos}
              selectedValues={filtros.fundos}
              onChange={(fundos) => onFiltrosChange({ fundos })}
              placeholder="Todos os fundos"
            />
          )}

          {/* Filtro de Saúde */}
          {opcoes.saudeOpcoes && opcoes.saudeOpcoes.length > 0 && (
            <MultiSelect
              label="Saúde do Fundo"
              options={opcoes.saudeOpcoes}
              selectedValues={filtros.saude || []}
              onChange={(saude) => onFiltrosChange({ saude: saude as any })}
              placeholder="Todos os status"
            />
          )}
        </div>
      </div>
    </div>
  );
}
