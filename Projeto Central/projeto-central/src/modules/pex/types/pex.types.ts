// ============================================
// Tipos PEX - Migrado do Novo Pex
// ============================================

/**
 * Tipos de Cluster para categorização de franquias
 */
export type ClusterType = 
  | 'CALOURO_INICIANTE' 
  | 'CALOURO' 
  | 'GRADUADO' 
  | 'POS_GRADUADO';

/**
 * Configuração de um indicador PEX
 */
export interface Indicador {
  id: string;
  nome: string;
  descricao: string;
  peso: number; // 0-5
  meta: number;
  unidade: string; // '%', 'R$', 'pontos'
  inverso?: boolean; // true se menor é melhor (ex: endividamento)
}

/**
 * Dados brutos de uma franquia (como vem do Google Sheets)
 */
export interface FranquiaRaw {
  id: string;
  nome: string;
  cluster: string;
  consultor?: string;
  regiao?: string;
  // Indicadores atuais
  vvr?: number;
  mac?: number;
  endividamento?: number;
  nps?: number;
  mc?: number;
  enps?: number;
  conformidades?: number;
  // Históricos (últimos 12 meses)
  vvrUltimos12Meses?: number[];
  macUltimos12Meses?: number[];
  // Bonus
  bonus1?: boolean;
  bonus2?: boolean;
  bonus3?: boolean;
}

/**
 * Franquia processada com pontuação calculada
 */
export interface Franquia extends FranquiaRaw {
  pontuacaoTotal: number;
  pontuacaoPorIndicador: Record<string, number>;
  rankingGeral: number;
  rankingCluster: number;
  status: 'verde' | 'amarelo' | 'vermelho';
}

/**
 * Configuração de uma onda/quarter
 */
export interface Quarter {
  id: string;
  nome: string; // 'Q1 2024', 'Q2 2024', etc.
  dataInicio: string;
  dataFim: string;
  indicadores: Indicador[];
  ativo: boolean;
}

/**
 * Resultado de um quarter para uma franquia
 */
export interface ResultadoQuarter {
  franquiaId: string;
  quarterId: string;
  pontuacaoTotal: number;
  pontuacaoPorIndicador: Record<string, number>;
  bonusAplicados: number;
  ranking: number;
}

/**
 * Metas por cluster
 */
export interface MetasCluster {
  cluster: ClusterType;
  metas: Record<string, number>; // indicadorId -> meta
}

/**
 * Pesos dos indicadores por onda
 */
export interface PesosOnda {
  ondaId: string;
  pesos: Record<string, number>; // indicadorId -> peso (0-5)
}

/**
 * Conformidade de uma franquia
 */
export interface ConformidadeFranquia {
  franquiaId: string;
  itens: ConformidadeItem[];
  pontuacaoTotal: number;
}

export interface ConformidadeItem {
  id: string;
  nome: string;
  conforme: boolean;
  observacao?: string;
}
