/**
 * Utilitários compartilhados de Ranking PEX.
 *
 * Regras unificadas (fonte da verdade para Ranking + Resultados):
 * - Métrica: média mensal de `pontuacao_com_bonus` dos registros vigentes do histórico.
 * - Ciclo vigente:
 *    - Ano 2026 (primeiro ciclo): meses 1..9 de 2026.
 *    - Demais anos: Set/(ano-1) .. Set/(ano) — ou seja,
 *      (ano-1, mes>=9) OU (ano, mes<=9).
 * - Sempre excluir franquias em INCUBAÇÃO 0.
 * - Separação por maturidade:
 *    - "Maduras": qualquer cluster que NÃO contenha "INCUBA" no nome.
 *    - "Iniciantes": clusters INCUBAÇÃO 1/2/3 (qualquer cluster que contenha "INCUBA" e NÃO seja INCUBAÇÃO 0).
 * - Cluster de referência da unidade = cluster do registro MAIS RECENTE
 *   dentro dos registros vigentes utilizados no cálculo.
 * - Posição Rede = posição da unidade no ranking do SEU grupo de maturidade.
 * - Posição Cluster = posição da unidade entre as franquias do mesmo cluster
 *   dentro do seu grupo de maturidade.
 */

export interface RegistroHistorico {
  data?: string;
  nm_unidade?: string;
  cluster?: string;
  pontuacao_com_bonus?: string | number;
  [key: string]: any;
}

export interface MediaUnidade {
  unidade: string;
  media: number;
  cluster: string;
  consultor?: string;
  posicao: number;
}

export interface PosicoesUnidade {
  posicaoRede: number;
  totalRede: number;
  posicaoCluster: number;
  totalCluster: number;
}

/** Parse DD/MM/AAAA. Retorna null em caso de falha. */
export function parseDataHistorico(data?: string): { dia: number; mes: number; ano: number } | null {
  if (!data) return null;
  const partes = data.split('/');
  if (partes.length !== 3) return null;
  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const ano = parseInt(partes[2], 10);
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) return null;
  return { dia, mes, ano };
}

/** Parse numérico robusto de `pontuacao_com_bonus` (aceita "91,76" e "91.76"). */
export function parsePontuacaoHistorico(item: RegistroHistorico | undefined | null): number {
  const val = item?.pontuacao_com_bonus;
  if (val === undefined || val === null || val === '') return 0;
  const num = parseFloat(String(val).replace(',', '.'));
  return isNaN(num) ? 0 : num;
}

/** `true` se o cluster indica INCUBAÇÃO 0 (qualquer variação). */
export function isIncubacao0(cluster: string | undefined | null): boolean {
  if (!cluster) return false;
  const c = cluster.toString().toUpperCase().trim();
  return c === 'INCUBAÇÃO 0' || c === 'INCUBACAO 0';
}

/** `true` se o cluster é qualquer INCUBAÇÃO (0, 1, 2, 3, ...). */
export function isIncubacao(cluster: string | undefined | null): boolean {
  if (!cluster) return false;
  return cluster.toString().toUpperCase().includes('INCUBA');
}

/** `true` se a franquia é "iniciante" (INCUBAÇÃO 1, 2, 3... — exclui INCUBAÇÃO 0). */
export function isIniciante(cluster: string | undefined | null): boolean {
  return isIncubacao(cluster) && !isIncubacao0(cluster);
}

/** `true` se a franquia é "madura" (não contém INCUBA). */
export function isMadura(cluster: string | undefined | null): boolean {
  return !!cluster && !isIncubacao(cluster);
}

/**
 * Predicado padrão de registros vigentes do histórico para o ciclo PEX.
 * Também exclui registros com cluster INCUBAÇÃO 0.
 */
export function isRegistroVigente(
  item: RegistroHistorico,
  anoAtual: number = new Date().getFullYear()
): boolean {
  if (isIncubacao0(item.cluster)) return false;
  const parsed = parseDataHistorico(item.data);
  if (!parsed) return false;
  if (anoAtual === 2026) {
    return parsed.ano === 2026 && parsed.mes >= 1 && parsed.mes <= 9;
  }
  return (
    (parsed.ano === anoAtual - 1 && parsed.mes >= 9) ||
    (parsed.ano === anoAtual && parsed.mes <= 9)
  );
}

/**
 * Dado um conjunto de registros de histórico JÁ FILTRADOS por período,
 * calcula a média de pontuação por unidade. O cluster retornado é o do
 * registro mais recente dentro do conjunto recebido.
 */
export function calcularMediasPorUnidade(
  registros: RegistroHistorico[]
): Array<{ unidade: string; media: number; cluster: string }> {
  if (!registros || registros.length === 0) return [];

  const porUnidade = new Map<string, RegistroHistorico[]>();
  for (const item of registros) {
    const unidade = (item.nm_unidade || '').toString();
    if (!unidade) continue;
    const lista = porUnidade.get(unidade) || [];
    lista.push(item);
    porUnidade.set(unidade, lista);
  }

  const resultado: Array<{ unidade: string; media: number; cluster: string }> = [];
  porUnidade.forEach((lista, unidade) => {
    if (lista.length === 0) return;
    const soma = lista.reduce((s, item) => s + parsePontuacaoHistorico(item), 0);
    const media = soma / lista.length;

    // Cluster = o do registro mais recente (maior data)
    let maisRecente: RegistroHistorico | null = null;
    let maisRecenteKey = -Infinity;
    for (const item of lista) {
      const parsed = parseDataHistorico(item.data);
      if (!parsed) continue;
      const key = parsed.ano * 100 + parsed.mes;
      if (key > maisRecenteKey) {
        maisRecenteKey = key;
        maisRecente = item;
      }
    }
    const cluster = (maisRecente?.cluster || lista[lista.length - 1]?.cluster || '').toString();

    resultado.push({ unidade, media, cluster });
  });

  return resultado;
}

/**
 * Calcula os rankings MADURAS e INICIANTES para um conjunto de registros
 * do histórico. Exclui INCUBAÇÃO 0 automaticamente via `isRegistroVigente`
 * quando `filtrar` está habilitado.
 */
export function calcularRankings(
  dadosHistorico: RegistroHistorico[],
  opts: { anoAtual?: number; aplicarFiltroVigente?: boolean } = {}
): { rankingMaduras: MediaUnidade[]; rankingIniciantes: MediaUnidade[] } {
  const ano = opts.anoAtual ?? new Date().getFullYear();
  const aplicar = opts.aplicarFiltroVigente ?? true;

  if (!dadosHistorico || dadosHistorico.length === 0) {
    return { rankingMaduras: [], rankingIniciantes: [] };
  }

  const registros = aplicar
    ? dadosHistorico.filter(item => isRegistroVigente(item, ano))
    : dadosHistorico.filter(item => !isIncubacao0(item.cluster));

  const medias = calcularMediasPorUnidade(registros);

  const maduras = medias
    .filter(m => isMadura(m.cluster))
    .sort((a, b) => b.media - a.media)
    .map((m, idx) => ({ ...m, posicao: idx + 1 }));

  const iniciantes = medias
    .filter(m => isIniciante(m.cluster))
    .sort((a, b) => b.media - a.media)
    .map((m, idx) => ({ ...m, posicao: idx + 1 }));

  return { rankingMaduras: maduras, rankingIniciantes: iniciantes };
}

/**
 * Retorna posições de Rede e Cluster para uma unidade específica,
 * respeitando o grupo de maturidade (maduras OU iniciantes).
 * Unidades em INCUBAÇÃO 0 retornam zero.
 */
export function obterPosicoesUnidade(
  dadosHistorico: RegistroHistorico[],
  unidade: string,
  opts: { anoAtual?: number; aplicarFiltroVigente?: boolean } = {}
): PosicoesUnidade {
  const zero: PosicoesUnidade = { posicaoRede: 0, totalRede: 0, posicaoCluster: 0, totalCluster: 0 };
  if (!unidade || !dadosHistorico || dadosHistorico.length === 0) return zero;

  const { rankingMaduras, rankingIniciantes } = calcularRankings(dadosHistorico, opts);

  // Localizar a unidade em um dos rankings
  const emMaduras = rankingMaduras.find(m => m.unidade === unidade);
  const ranking = emMaduras ? rankingMaduras : rankingIniciantes;
  const item = emMaduras || rankingIniciantes.find(m => m.unidade === unidade);
  if (!item) return zero;

  const posicaoRede = item.posicao;
  const totalRede = ranking.length;

  const cluster = item.cluster;
  const rankingCluster = ranking
    .filter(m => (m.cluster || '').toString().toUpperCase().trim() === (cluster || '').toString().toUpperCase().trim())
    .sort((a, b) => a.posicao - b.posicao);
  const posicaoCluster = rankingCluster.findIndex(m => m.unidade === unidade) + 1;
  const totalCluster = rankingCluster.length;

  return { posicaoRede, totalRede, posicaoCluster, totalCluster };
}
