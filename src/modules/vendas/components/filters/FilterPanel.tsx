/**
 * Componente FilterPanel - Painel completo de filtros
 * Estilo igual ao PexLayout (seção de filtros na sidebar)
 * 
 * Filtros por página:
 * - Página 1 (Metas): Período, Meta, Unidades, Cursos
 * - Página 2 (Indicadores): Período, Meta, Unidades, Fundos, Tipo Adesão, Tipo Serviço, Tipo Cliente, Consultor Comercial, Indicação Adesão, Instituição
 * - Página 3 (Funil): Período, Unidades, Consultor, Origem Lead, Segmentação Lead, Etiquetas
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Filter } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import MultiSelect from './MultiSelect';
import type { FiltrosState, FiltrosOpcoes, PaginaAtiva } from '@/modules/vendas/types/filtros.types';

interface FilterPanelProps {
  filtros: FiltrosState;
  opcoes: FiltrosOpcoes;
  onFiltrosChange: (filtros: Partial<FiltrosState>) => void;
  paginaAtiva?: PaginaAtiva;
  showMetaToggle?: boolean;
  showUnidades?: boolean;
  showRegionais?: boolean;
  showUFs?: boolean;
  showCidades?: boolean;
  showConsultores?: boolean;
  showSupervisores?: boolean;
  showFormasPagamento?: boolean;
  // Filtros da página 1 (Metas)
  showCursos?: boolean;
  // Filtros da página 2 (Indicadores)
  showFundos?: boolean;
  showTipoAdesao?: boolean;
  showTipoServico?: boolean;
  showTipoCliente?: boolean;
  showConsultorComercial?: boolean;
  showIndicacaoAdesao?: boolean;
  showInstituicao?: boolean;
  // Filtros da página 3 (Funil)
  showOrigemLead?: boolean;
  showSegmentacaoLead?: boolean;
  showEtiquetas?: boolean;
}

export default function FilterPanel({
  filtros,
  opcoes,
  onFiltrosChange,
  paginaAtiva = 'metas',
  showMetaToggle = true,
  showUnidades = true,
  showRegionais = true,
  showUFs = true,
  showCidades = true,
  showConsultores = false,
  showSupervisores = false,
  showFormasPagamento = false,
  // Filtros página 1 - Metas
  showCursos,
  // Filtros página 2 - defaults baseados na página
  showFundos,
  showTipoAdesao,
  showTipoServico,
  showTipoCliente,
  showConsultorComercial,
  showIndicacaoAdesao,
  showInstituicao,
  // Filtros página 3
  showOrigemLead,
  showSegmentacaoLead,
  showEtiquetas,
}: FilterPanelProps) {
  // Determinar quais filtros mostrar baseado na página ativa
  const isMetasPage = paginaAtiva === 'metas';
  const isIndicadoresPage = paginaAtiva === 'indicadores';
  const isFunilPage = paginaAtiva === 'funil';
  
  // Filtros específicos da página 1 (Metas) e página 2 (Indicadores)
  const shouldShowCursos = showCursos ?? (isMetasPage || isIndicadoresPage);
  
  // Filtros específicos da página 2 (Indicadores)
  const shouldShowFundos = showFundos ?? isIndicadoresPage;
  const shouldShowTipoAdesao = showTipoAdesao ?? isIndicadoresPage;
  const shouldShowTipoServico = showTipoServico ?? isIndicadoresPage;
  const shouldShowTipoCliente = showTipoCliente ?? isIndicadoresPage;
  const shouldShowConsultorComercial = showConsultorComercial ?? isIndicadoresPage;
  const shouldShowIndicacaoAdesao = showIndicacaoAdesao ?? isIndicadoresPage;
  const shouldShowInstituicao = showInstituicao ?? isIndicadoresPage;
  
  // Filtros específicos da página 3 (Funil)
  const shouldShowOrigemLead = showOrigemLead ?? isFunilPage;
  const shouldShowSegmentacaoLead = showSegmentacaoLead ?? isFunilPage;
  const shouldShowEtiquetas = showEtiquetas ?? isFunilPage;
  const shouldShowConsultoresFunil = showConsultores || isFunilPage;
  
  // Na página do funil e indicadores, não mostra toggle de meta (só aparece na página de metas)
  const shouldShowMetaToggle = showMetaToggle && isMetasPage;

  // Estado para controlar se os filtros estão expandidos
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);

  return (
    <div>
      {/* Header dos Filtros - Igual ao PexLayout */}
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
        {/* Toggle de Tipo de Meta */}
        {shouldShowMetaToggle && (
          <div style={{ marginBottom: '8px' }}>
            <label
              style={{
                display: 'block',
                color: '#adb5bd',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Tipo de Meta
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#2a2f36',
                borderRadius: '8px',
                border: '1px solid #444',
              }}
            >
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: filtros.isMetaInterna ? 400 : 600,
                  color: filtros.isMetaInterna ? '#6c757d' : '#FF6600',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Super Meta
              </span>
              <button
                onClick={() => onFiltrosChange({ isMetaInterna: !filtros.isMetaInterna })}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '24px',
                  backgroundColor: filtros.isMetaInterna ? '#FF6600' : '#444',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '2px',
                    left: filtros.isMetaInterna ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: filtros.isMetaInterna ? 600 : 400,
                  color: filtros.isMetaInterna ? '#FF6600' : '#6c757d',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                Meta Interna
              </span>
            </div>
          </div>
        )}

        {/* Filtro de Período */}
        <DateRangePicker
          periodoSelecionado={filtros.periodoSelecionado}
          dataInicio={filtros.dataInicio}
          dataFim={filtros.dataFim}
          onPeriodoChange={(periodoSelecionado) => onFiltrosChange({ periodoSelecionado })}
          onDataInicioChange={(dataInicio) => onFiltrosChange({ dataInicio })}
          onDataFimChange={(dataFim) => onFiltrosChange({ dataFim })}
        />

        {/* Filtro de Unidades */}
        {showUnidades && opcoes.unidades.length > 0 && (
          <MultiSelect
            label="Unidades"
            options={opcoes.unidades}
            selectedValues={filtros.unidades}
            onChange={(unidades) => onFiltrosChange({ unidades })}
            placeholder="Todas as unidades"
          />
        )}

        {/* Filtro de Regionais */}
        {showRegionais && opcoes.regionais.length > 0 && (
          <MultiSelect
            label="Regionais"
            options={opcoes.regionais}
            selectedValues={filtros.regionais}
            onChange={(regionais) => onFiltrosChange({ regionais })}
            placeholder="Todas as regionais"
          />
        )}

        {/* Filtro de UFs */}
        {showUFs && opcoes.ufs.length > 0 && (
          <MultiSelect
            label="UFs"
            options={opcoes.ufs}
            selectedValues={filtros.ufs}
            onChange={(ufs) => onFiltrosChange({ ufs })}
            placeholder="Todos os estados"
          />
        )}

        {/* Filtro de Cidades */}
        {showCidades && opcoes.cidades.length > 0 && (
          <MultiSelect
            label="Cidades"
            options={opcoes.cidades}
            selectedValues={filtros.cidades}
            onChange={(cidades) => onFiltrosChange({ cidades })}
            placeholder="Todas as cidades"
          />
        )}

        {/* Filtro de Cursos - Página Metas (mantido aqui para compatibilidade) */}
        {shouldShowCursos && !isIndicadoresPage && opcoes.cursos && opcoes.cursos.length > 0 && (
          <MultiSelect
            label="Cursos"
            options={opcoes.cursos}
            selectedValues={filtros.cursos}
            onChange={(cursos) => onFiltrosChange({ cursos })}
            placeholder="Todos os cursos"
          />
        )}

        {/* Filtro de Consultores */}
        {showConsultores && opcoes.consultores.length > 0 && (
          <MultiSelect
            label="Consultores"
            options={opcoes.consultores}
            selectedValues={filtros.consultores}
            onChange={(consultores) => onFiltrosChange({ consultores })}
            placeholder="Todos os consultores"
          />
        )}

        {/* Filtro de Supervisores */}
        {showSupervisores && opcoes.supervisores.length > 0 && (
          <MultiSelect
            label="Supervisores"
            options={opcoes.supervisores}
            selectedValues={filtros.supervisores}
            onChange={(supervisores) => onFiltrosChange({ supervisores })}
            placeholder="Todos os supervisores"
          />
        )}

        {/* Filtro de Formas de Pagamento */}
        {showFormasPagamento && opcoes.formasPagamento.length > 0 && (
          <MultiSelect
            label="Formas de Pagamento"
            options={opcoes.formasPagamento}
            selectedValues={filtros.formasPagamento}
            onChange={(formasPagamento) => onFiltrosChange({ formasPagamento })}
            placeholder="Todas as formas"
          />
        )}

        {/* ============================================= */}
        {/* FILTROS ESPECÍFICOS DA PÁGINA 2 (INDICADORES) */}
        {/* ============================================= */}

        {/* Filtro de Cursos - Página Indicadores (entre Unidades e Fundos) */}
        {shouldShowCursos && isIndicadoresPage && opcoes.cursos && opcoes.cursos.length > 0 && (
          <MultiSelect
            label="Cursos"
            options={opcoes.cursos}
            selectedValues={filtros.cursos}
            onChange={(cursos) => onFiltrosChange({ cursos })}
            placeholder="Todos os cursos"
          />
        )}

        {/* Filtro de Fundos - Apenas página Indicadores */}
        {shouldShowFundos && opcoes.fundos && opcoes.fundos.length > 0 && (
          <MultiSelect
            label="Fundos"
            options={opcoes.fundos}
            selectedValues={filtros.fundos}
            onChange={(fundos) => onFiltrosChange({ fundos })}
            placeholder="Todos os fundos"
          />
        )}

        {/* Filtro de Tipo de Adesão - Apenas página Indicadores */}
        {shouldShowTipoAdesao && opcoes.tiposAdesao && opcoes.tiposAdesao.length > 0 && (
          <MultiSelect
            label="Tipo de Adesão"
            options={opcoes.tiposAdesao}
            selectedValues={filtros.tipoAdesao}
            onChange={(tipoAdesao) => onFiltrosChange({ tipoAdesao })}
            placeholder="Todos os tipos"
          />
        )}

        {/* Filtro de Tipo de Serviço - Apenas página Indicadores */}
        {shouldShowTipoServico && opcoes.tiposServico && opcoes.tiposServico.length > 0 && (
          <MultiSelect
            label="Tipo de Serviço"
            options={opcoes.tiposServico}
            selectedValues={filtros.tipoServico}
            onChange={(tipoServico) => onFiltrosChange({ tipoServico })}
            placeholder="Todos os tipos"
          />
        )}

        {/* Filtro de Tipo de Cliente - Apenas página Indicadores */}
        {shouldShowTipoCliente && opcoes.tiposCliente && opcoes.tiposCliente.length > 0 && (
          <MultiSelect
            label="Tipo de Cliente"
            options={opcoes.tiposCliente}
            selectedValues={filtros.tipoCliente}
            onChange={(tipoCliente) => onFiltrosChange({ tipoCliente })}
            placeholder="Todos os tipos"
          />
        )}

        {/* Filtro de Consultor Comercial - Apenas página Indicadores */}
        {shouldShowConsultorComercial && opcoes.consultoresComerciais && opcoes.consultoresComerciais.length > 0 && (
          <MultiSelect
            label="Consultor Comercial"
            options={opcoes.consultoresComerciais}
            selectedValues={filtros.consultorComercial}
            onChange={(consultorComercial) => onFiltrosChange({ consultorComercial })}
            placeholder="Todos os consultores"
          />
        )}

        {/* Filtro de Indicação Adesão - Apenas página Indicadores */}
        {shouldShowIndicacaoAdesao && opcoes.indicacoesAdesao && opcoes.indicacoesAdesao.length > 0 && (
          <MultiSelect
            label="Indicação de Adesão"
            options={opcoes.indicacoesAdesao}
            selectedValues={filtros.indicacaoAdesao}
            onChange={(indicacaoAdesao) => onFiltrosChange({ indicacaoAdesao })}
            placeholder="Todas as indicações"
          />
        )}

        {/* Filtro de Instituição - Apenas página Indicadores */}
        {shouldShowInstituicao && opcoes.instituicoes && opcoes.instituicoes.length > 0 && (
          <MultiSelect
            label="Instituição"
            options={opcoes.instituicoes}
            selectedValues={filtros.instituicao}
            onChange={(instituicao) => onFiltrosChange({ instituicao })}
            placeholder="Todas as instituições"
          />
        )}

        {/* ============================================= */}
        {/* FILTROS ESPECÍFICOS DA PÁGINA 3 (FUNIL)      */}
        {/* ============================================= */}

        {/* Filtro de Consultores (Funil) - Apenas página Funil */}
        {shouldShowConsultoresFunil && opcoes.consultores && opcoes.consultores.length > 0 && (
          <MultiSelect
            label="Consultor"
            options={opcoes.consultores}
            selectedValues={filtros.consultores}
            onChange={(consultores) => onFiltrosChange({ consultores })}
            placeholder="Todos os consultores"
          />
        )}

        {/* Filtro de Origem do Lead - Apenas página Funil */}
        {shouldShowOrigemLead && opcoes.origensLead && opcoes.origensLead.length > 0 && (
          <MultiSelect
            label="Origem do Lead"
            options={opcoes.origensLead}
            selectedValues={filtros.origemLead}
            onChange={(origemLead) => onFiltrosChange({ origemLead })}
            placeholder="Todas as origens"
          />
        )}

        {/* Filtro de Segmentação do Lead - Apenas página Funil */}
        {shouldShowSegmentacaoLead && opcoes.segmentacoesLead && opcoes.segmentacoesLead.length > 0 && (
          <MultiSelect
            label="Segmentação do Lead"
            options={opcoes.segmentacoesLead}
            selectedValues={filtros.segmentacaoLead}
            onChange={(segmentacaoLead) => onFiltrosChange({ segmentacaoLead })}
            placeholder="Todas as segmentações"
          />
        )}

        {/* Filtro de Etiquetas - Apenas página Funil */}
        {shouldShowEtiquetas && opcoes.etiquetas && opcoes.etiquetas.length > 0 && (
          <MultiSelect
            label="Etiquetas"
            options={opcoes.etiquetas}
            selectedValues={filtros.etiquetas}
            onChange={(etiquetas) => onFiltrosChange({ etiquetas })}
            placeholder="Todas as etiquetas"
          />
        )}
        </div>
      </div>
    </div>
  );
}

