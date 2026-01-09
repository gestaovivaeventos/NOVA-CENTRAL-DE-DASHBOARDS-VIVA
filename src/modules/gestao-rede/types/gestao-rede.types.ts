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
 * Fase de incubação (1, 2 ou 3) - Anos de operação
 */
export type FaseIncubacao = 1 | 2 | 3;

/**
 * Motivo de encerramento para franquias inativas
 */
export type MotivoEncerramento = 'ENCERRADA_OPERACAO' | 'ENCERRADA_IMPLANTACAO';

/**
 * Classificação PEX baseada no score
 */
export type ClassificacaoPEX = 'TOP_PERFORMANCE' | 'PERFORMANDO' | 'ATENCAO' | 'UTI_RECUPERACAO' | 'UTI_REPASSE';

/**
 * Segmento de mercado da franquia
 */
export type SegmentoMercado = 'PADRAO' | 'MASTER' | 'MEGA' | 'GIGA';

/**
 * Flags estruturais - alertas críticos
 */
export interface FlagsEstruturais {
  socioOperador: boolean;
  timeCritico: boolean;
  governanca: boolean;
}

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
  motivoEncerramento?: MotivoEncerramento;
  dataAbertura: string;
  dataInicioOperacao?: string;
  dataEncerramento?: string;
  responsavel: string;
  email: string;
  telefone: string;
  consultor?: string;
  segmentoMercado: SegmentoMercado;
  // Dados PEX
  scorePEX: number;
  classificacaoPEX: ClassificacaoPEX;
  classificacaoPEXAnterior: ClassificacaoPEX;
  flags: FlagsEstruturais;
}

/**
 * Resumo estatístico da rede
 */
export interface ResumoRede {
  totalFranquias: number;
  ativas: number;
  inativas: number;
  encerradasOperacao: number;
  encerradasImplantacao: number;
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
 * Filtros avançados da página (multi-seleção)
 */
export interface FiltrosGestaoRede {
  maturidade: string[];
  classificacao: string[];
  consultor: string[];
  flags: string[];
}
