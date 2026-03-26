/**
 * Formatações brasileiras para o módulo Funil de Expansão
 */

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Mapeamento de nomes de estados brasileiros para siglas */
const ESTADO_SIGLA: Record<string, string> = {
  'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amapa': 'AP', 'amazonas': 'AM',
  'bahia': 'BA', 'ceará': 'CE', 'ceara': 'CE', 'distrito federal': 'DF',
  'espírito santo': 'ES', 'espirito santo': 'ES', 'goiás': 'GO', 'goias': 'GO',
  'maranhão': 'MA', 'maranhao': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
  'minas gerais': 'MG', 'pará': 'PA', 'para': 'PA', 'paraíba': 'PB', 'paraiba': 'PB',
  'paraná': 'PR', 'parana': 'PR', 'pernambuco': 'PE', 'piauí': 'PI', 'piaui': 'PI',
  'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
  'rondônia': 'RO', 'rondonia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
  'são paulo': 'SP', 'sao paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO',
};

/** Converte nome de estado para sigla (ex: "São Paulo" → "SP"). Se já for sigla, retorna como está. */
export function siglaEstado(uf: string): string {
  if (!uf) return '';
  const trimmed = uf.trim();
  // Já é sigla (2 caracteres)
  if (trimmed.length <= 2) return trimmed.toUpperCase();
  const key = trimmed.toLowerCase();
  return ESTADO_SIGLA[key] || trimmed;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  // Tenta converter DD/MM/YYYY
  if (dateStr.includes('/')) return dateStr;
  // YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}
