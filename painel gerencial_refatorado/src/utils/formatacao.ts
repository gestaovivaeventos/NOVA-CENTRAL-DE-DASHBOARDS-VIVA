// Funções de formatação

/**
 * Formata um número como moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formata um número como moeda abreviada (K, M, B)
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}

/**
 * Formata um número como porcentagem
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formata um número grande com separadores de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formata uma data para o formato brasileiro
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

/**
 * Retorna a cor baseada no status
 */
export function getStatusColor(status: 'verde' | 'amarelo' | 'vermelho'): string {
  const colors = {
    verde: '#22C55E',
    amarelo: '#EAB308',
    vermelho: '#EF4444'
  };
  return colors[status] || colors.vermelho;
}

/**
 * Determina o status baseado no percentual de atingimento
 */
export function getStatusByPercent(percent: number): 'verde' | 'amarelo' | 'vermelho' {
  if (percent >= 100) return 'verde';
  if (percent >= 80) return 'amarelo';
  return 'vermelho';
}
