import { ClusterType } from '../types';

// ============================================
// Metas por Cluster
// ============================================

export const METAS_POR_CLUSTER: Record<ClusterType, Record<string, number>> = {
  CALOURO_INICIANTE: {
    vvr: 70,
    mac: 60,
    endividamento: 50,
    nps: 50,
    mc: 15,
    enps: 50,
    conformidades: 70,
  },
  CALOURO: {
    vvr: 75,
    mac: 65,
    endividamento: 45,
    nps: 60,
    mc: 18,
    enps: 55,
    conformidades: 75,
  },
  GRADUADO: {
    vvr: 80,
    mac: 70,
    endividamento: 40,
    nps: 70,
    mc: 20,
    enps: 60,
    conformidades: 80,
  },
  POS_GRADUADO: {
    vvr: 85,
    mac: 75,
    endividamento: 35,
    nps: 75,
    mc: 22,
    enps: 65,
    conformidades: 85,
  },
};

// ============================================
// Pesos padrão por indicador
// ============================================

export const PESOS_PADRAO: Record<string, number> = {
  vvr: 2,
  mac: 1.5,
  endividamento: 1,
  nps: 1.5,
  mc: 2,
  enps: 1,
  conformidades: 1,
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

  const indicadoresInversos = ['endividamento'];

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
