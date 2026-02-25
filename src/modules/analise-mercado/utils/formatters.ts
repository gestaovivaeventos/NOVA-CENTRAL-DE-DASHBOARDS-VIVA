// ============================================
// Formatadores — Análise de Mercado
// ============================================

/** Formata número grande (1.2M, 35.4K, 950) */
export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}

/** Formata número com separador de milhares completo */
export function fmtInteiro(n: number): string {
  return n.toLocaleString('pt-BR');
}

/** Formata percentual */
export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/** Formata variação com sinal + */
export function fmtVariacao(n: number): string {
  const sinal = n >= 0 ? '+' : '';
  return `${sinal}${n.toFixed(1)}%`;
}

/** Cor da variação */
export function corVariacao(n: number): string {
  if (n > 0) return '#10B981';
  if (n < 0) return '#EF4444';
  return '#6B7280';
}

/** Abreviação de UF → Nome do estado */
export const ESTADOS_NOME: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

/** Cores do tema */
export const CORES = {
  laranja: '#FF6600',
  azul: '#3B82F6',
  verde: '#10B981',
  roxo: '#8B5CF6',
  amarelo: '#F59E0B',
  vermelho: '#EF4444',
  rosa: '#EC4899',
  cinza: '#6B7280',
  branco: '#F8F9FA',
  textoSecundario: '#ADB5BD',
  textoMuted: '#6C757D',
  bgCard: '#343A40',
  bgPrimary: '#212529',
  border: '#495057',
};
