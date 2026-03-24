/**
 * Formatações brasileiras para o módulo Funil de Expansão
 */

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
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
