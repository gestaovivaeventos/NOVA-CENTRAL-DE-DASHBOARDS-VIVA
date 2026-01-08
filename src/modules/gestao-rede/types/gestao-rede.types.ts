// ============================================
// Tipos Gestão Rede - Módulo de Gestão da Rede de Franquias
// ============================================

/**
 * Status principal da franquia
 */
export type StatusFranquia = 'ATIVA' | 'INATIVA';

/**
 * Status de operação para franquias ativas
 */
export type StatusOperacao = 'IMPLANTACAO' | 'OPERACAO';

/**
 * Maturidade da franquia em operação
 */
export type MaturidadeFranquia = 'INCUBACAO' | 'MADURA';

/**
 * Fase de incubação (1, 2 ou 3)
 */
export type FaseIncubacao = 1 | 2 | 3;

/**
 * Interface para dados de uma franquia
 */
export interface Franquia {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  regiao: string;
  status: StatusFranquia;
  statusOperacao?: StatusOperacao;
  maturidade?: MaturidadeFranquia;
  faseIncubacao?: FaseIncubacao;
  dataAbertura: string;
  dataInicioOperacao?: string;
  responsavel: string;
  email: string;
  telefone: string;
  consultor?: string;
}

/**
 * Resumo estatístico da rede
 */
export interface ResumoRede {
  totalFranquias: number;
  ativas: number;
  inativas: number;
  emImplantacao: number;
  emOperacao: number;
  emIncubacao: number;
  maduras: number;
  incubacao1: number;
  incubacao2: number;
  incubacao3: number;
}

/**
 * Nó da árvore hierárquica
 */
export interface TreeNode {
  id: string;
  nome: string;
  valor: number;
  porcentagem: number;
  cor: string;
  children?: TreeNode[];
  franquias?: Franquia[];
}

/**
 * Props para os cards de KPI
 */
export interface KPICardProps {
  titulo: string;
  valor: number;
  total?: number;
  porcentagem?: number;
  cor?: string;
  icone?: React.ReactNode;
  subtitulo?: string;
}

/**
 * Filtros da página
 */
export interface FiltrosGestaoRede {
  status: StatusFranquia | 'TODOS';
  statusOperacao: StatusOperacao | 'TODOS';
  maturidade: MaturidadeFranquia | 'TODOS';
  regiao: string;
  estado: string;
}
