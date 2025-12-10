/**
 * Tipos para filtros do dashboard
 */

// Estado dos filtros
export interface FiltrosState {
  // Período
  periodoSelecionado: string;
  dataInicio: string;
  dataFim: string;
  
  // Meta
  isMetaInterna: boolean;
  
  // Filtros de seleção
  unidades: string[];
  regionais: string[];
  ufs: string[];
  cidades: string[];
  consultores: string[];
  supervisores: string[];
  formasPagamento: string[];
  
  // Filtros adicionais (do funil e vendas)
  cursos: string[];
  fundos: string[];
  origemLead: string[];
  segmentacaoLead: string[];
  etiquetas: string[];
  tipoAdesao: string[];
  tipoServico: string[];
  tipoCliente: string[];
  consultorComercial: string[];
  indicacaoAdesao: string[];
  instituicao: string[];
}

// Opções disponíveis para cada filtro
export interface FiltrosOpcoes {
  unidades: string[];
  regionais: string[];
  ufs: string[];
  cidades: string[];
  consultores: string[];
  supervisores: string[];
  formasPagamento: string[];
  
  // Opções adicionais
  cursos: string[];
  fundos: string[];
  origensLead: string[];
  segmentacoesLead: string[];
  etiquetas: string[];
  tiposAdesao: string[];
  tiposServico: string[];
  tiposCliente: string[];
  consultoresComerciais: string[];
  indicacoesAdesao: string[];
  instituicoes: string[];
}

// Página ativa
export type PaginaAtiva = 'metas' | 'indicadores' | 'funil';

// Props do componente de filtros
export interface FiltrosProps {
  opcoes: FiltrosOpcoes;
  valores: FiltrosState;
  onChange: (novosFiltros: Partial<FiltrosState>) => void;
  paginaAtiva: PaginaAtiva;
}
