// ============================================
// Tipos Gestão Rede - Módulo de Gestão da Rede de Franquias
// Atualizado para dados reais da planilha BASE GESTAO REDE
// Colunas: chave_data, data, nm_unidade, status, status_inativacao, dt_inauguracao, maturidade, pontuacao_pex, saude, flags, posto_avancado
// ============================================

/**
 * Status principal da franquia
 */
export type StatusFranquia = 'ATIVA' | 'INATIVA';

/**
 * Status de inativação (para franquias inativas)
 */
export type StatusInativacao = 'ENCERRADA_OPERACAO' | 'ENCERRADA_IMPLANTACAO' | null;

/**
 * Maturidade da franquia
 * Valores reais: IMPLANTACAO, 1º ANO OP., 2º ANO OP., 3º ANO OP., MADURA
 */
export type MaturidadeFranquia = 'IMPLANTACAO' | '1º ANO OP.' | '2º ANO OP.' | '3º ANO OP.' | 'MADURA';

/**
 * Classificação de Saúde baseada no PEX
 * Fórmula: >= 95: TOP PERFORMANCE, >= 85: PERFORMANDO, >= 75: EM EVOLUÇÃO, >= 60: ATENÇÃO, < 60: UTI
 * UTI pode ser alterado manualmente para UTI_RECUPERACAO ou UTI_REPASSE
 */
export type SaudeFranquia = 
  | 'TOP_PERFORMANCE'   // >= 95%
  | 'PERFORMANDO'       // >= 85%
  | 'EM_EVOLUCAO'       // >= 75%
  | 'ATENCAO'           // >= 60%
  | 'UTI'               // < 60%
  | 'UTI_RECUPERACAO'   // UTI com plano de recuperação
  | 'UTI_REPASSE'       // UTI em processo de repasse
  | 'SEM_AVALIACAO';    // Sem dados

/**
 * Flags estruturais da planilha (formato: "flag1, flag2, ...")
 * Flags disponíveis: GOVERNANÇA, NECESSIDADE CAPITAL DE GIRO, TIME CRÍTICO, SÓCIO OPERADOR
 */
export interface FlagsEstruturais {
  socioOperador: boolean;
  timeCritico: boolean;
  governanca: boolean;
  necessidadeCapitalGiro: boolean;
}

/**
 * Tipo para as chaves de flags (útil para iteração)
 */
export type FlagKey = keyof FlagsEstruturais;

/**
 * Interface para dados brutos da planilha (raw data)
 * Colunas: chave_data, data, nm_unidade, status, status_inativacao, dt_inauguracao, 
 *          maturidade, pontuacao_pex, saude, flags, posto_avancado, cidade, estado, latitude, longitude
 */
export interface FranquiaRaw {
  chave_data: string;
  data: string;
  nm_unidade: string;
  status: string;
  status_inativacao: string;
  dt_inauguracao: string;
  maturidade: string;
  pontuacao_pex: string;
  saude: string;
  flags: string;
  posto_avancado: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;
}

/**
 * Interface para dados processados de uma franquia
 */
export interface Franquia {
  id: string;
  chaveData: string;
  dataReferencia: string;
  nome: string;
  status: StatusFranquia;
  statusInativacao: StatusInativacao;
  dataInauguracao: string;
  maturidade: MaturidadeFranquia;
  pontuacaoPex: number;
  saude: SaudeFranquia;
  flags: FlagsEstruturais;
  postoAvancado: boolean;
  // Novos campos de localização
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
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
  postosAvancados: number;
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
  flags: string[];
}

/**
 * Resposta da API de dados
 */
export interface GestaoRedeApiResponse {
  success: boolean;
  data?: Franquia[];
  dataReferencia?: string;
  message?: string;
}

