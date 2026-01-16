import { ClusterType } from '../types';

// ============================================
// Metas por Cluster
// ============================================

export const METAS_POR_CLUSTER: Record<ClusterType, Record<string, number>> = {
  CALOURO_INICIANTE: {
    vvr_12_meses: 70,
    vvr_carteira: 70,
    indice_endividamento: 50,
    nps_geral: 50,
    indice_margem_entrega: 15,
    enps_rede: 50,
    conformidades: 70,
    reclame_aqui: 70,
    colaboradores_mais_1_ano: 50,
    estrutura_organizacional: 70,
    churn: 10,
  },
  CALOURO: {
    vvr_12_meses: 75,
    vvr_carteira: 75,
    indice_endividamento: 45,
    nps_geral: 60,
    indice_margem_entrega: 18,
    enps_rede: 55,
    conformidades: 75,
    reclame_aqui: 75,
    colaboradores_mais_1_ano: 55,
    estrutura_organizacional: 75,
    churn: 8,
  },
  GRADUADO: {
    vvr_12_meses: 80,
    vvr_carteira: 80,
    indice_endividamento: 40,
    nps_geral: 70,
    indice_margem_entrega: 20,
    enps_rede: 60,
    conformidades: 80,
    reclame_aqui: 80,
    colaboradores_mais_1_ano: 60,
    estrutura_organizacional: 80,
    churn: 6,
  },
  POS_GRADUADO: {
    vvr_12_meses: 85,
    vvr_carteira: 85,
    indice_endividamento: 35,
    nps_geral: 75,
    indice_margem_entrega: 22,
    enps_rede: 65,
    conformidades: 85,
    reclame_aqui: 85,
    colaboradores_mais_1_ano: 65,
    estrutura_organizacional: 85,
    churn: 5,
  },
};

// ============================================
// Pesos padrão por indicador
// ============================================

export const PESOS_PADRAO: Record<string, number> = {
  vvr_12_meses: 2,
  vvr_carteira: 2,
  indice_endividamento: 1,
  nps_geral: 1.5,
  indice_margem_entrega: 2,
  enps_rede: 1,
  conformidades: 1,
  reclame_aqui: 1,
  colaboradores_mais_1_ano: 1,
  estrutura_organizacional: 1,
  churn: 1.5,
};

// ============================================
// Funções de Cálculo
// ============================================

/**
 * Calcula pontuação de um indicador
 * Fórmula: (valor / meta) * peso * 100
 * Máximo: peso * 100
 */
export function calcularPontuacaoIndicador(
  valor: number,
  meta: number,
  peso: number,
  inverso: boolean = false
): number {
  if (meta === 0) return 0;

  let percentualMeta: number;
  
  if (inverso) {
    // Para indicadores onde menor é melhor (ex: endividamento)
    // Se valor <= meta: 100% ou mais
    // Se valor > meta: proporcionalmente menor
    percentualMeta = meta / Math.max(valor, 0.01);
  } else {
    // Para indicadores normais (maior é melhor)
    percentualMeta = valor / meta;
  }

  // Calcula pontuação
  const pontuacao = percentualMeta * peso * 100;

  // Cap no máximo permitido
  const maximo = peso * 100;
  return Math.min(pontuacao, maximo);
}

/**
 * Calcula pontuação total de uma franquia
 */
export function calcularPontuacaoTotal(
  valores: Record<string, number>,
  cluster: ClusterType,
  pesos: Record<string, number> = PESOS_PADRAO
): { total: number; porIndicador: Record<string, number> } {
  const metas = METAS_POR_CLUSTER[cluster];
  const porIndicador: Record<string, number> = {};
  let total = 0;

  const indicadoresInversos = ['indice_endividamento', 'churn'];

  for (const [indicador, peso] of Object.entries(pesos)) {
    const valor = valores[indicador] || 0;
    const meta = metas[indicador] || 100;
    const inverso = indicadoresInversos.includes(indicador);

    const pontuacao = calcularPontuacaoIndicador(valor, meta, peso, inverso);
    porIndicador[indicador] = pontuacao;
    total += pontuacao;
  }

  return { total, porIndicador };
}

/**
 * Calcula bonus (0.5 ou 1 ponto por ação)
 */
export function calcularBonus(
  bonus1: boolean,
  bonus2: boolean,
  bonus3: boolean
): number {
  let total = 0;
  if (bonus1) total += 1;
  if (bonus2) total += 1;
  if (bonus3) total += 0.5;
  return total;
}

/**
 * Determina status da franquia baseado na pontuação
 */
export function determinarStatus(
  pontuacao: number,
  maxPontuacao: number = 1000
): 'verde' | 'amarelo' | 'vermelho' {
  const percentual = (pontuacao / maxPontuacao) * 100;

  if (percentual >= 80) return 'verde';
  if (percentual >= 60) return 'amarelo';
  return 'vermelho';
}

/**
 * Formata pontuação para exibição
 */
export function formatarPontuacao(valor: number): string {
  return valor.toFixed(1);
}

/**
 * Converte string de cluster para tipo
 */
export function parseCluster(cluster: string): ClusterType {
  const mapping: Record<string, ClusterType> = {
    'calouro_iniciante': 'CALOURO_INICIANTE',
    'calouro iniciante': 'CALOURO_INICIANTE',
    'iniciante': 'CALOURO_INICIANTE',
    'calouro': 'CALOURO',
    'graduado': 'GRADUADO',
    'pos_graduado': 'POS_GRADUADO',
    'pos-graduado': 'POS_GRADUADO',
    'pós-graduado': 'POS_GRADUADO',
    'pós graduado': 'POS_GRADUADO',
  };

  const normalized = cluster.toLowerCase().trim();
  return mapping[normalized] || 'CALOURO';
}
