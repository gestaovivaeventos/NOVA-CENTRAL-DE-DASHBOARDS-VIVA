/**
 * Utilitários para processamento de dados da carteira
 */

/**
 * Parseia uma string de data em formato brasileiro ou ISO
 */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Tentar formato DD/MM/YYYY
  const brMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Tentar formato YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Tentar parse genérico
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formata um valor como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formata um número como percentual
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Formata um número com separador de milhares
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Retorna cor baseada no percentual de atingimento
 */
export function getColorForPercentage(percent: number): string {
  if (percent >= 1) return '#22c55e'; // Verde
  if (percent >= 0.7) return '#eab308'; // Amarelo
  return '#ef4444'; // Vermelho
}

/**
 * Retorna gradiente para barra de progresso
 */
export function getProgressGradient(percent: number): string {
  if (percent >= 1) return 'linear-gradient(90deg, #22c55e, #16a34a)';
  if (percent >= 0.7) return 'linear-gradient(90deg, #eab308, #ca8a04)';
  return 'linear-gradient(90deg, #ef4444, #dc2626)';
}

/**
 * Parseia um valor numérico de string (aceita vírgula como decimal)
 */
export function parseNumericValue(value: string | number): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // Remove espaços e caracteres de moeda
  const cleaned = String(value)
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '') // Remove pontos de milhar
    .replace(',', '.'); // Substitui vírgula por ponto
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Gera o período YYYY-MM a partir de uma data
 */
export function getMesAno(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Nomes dos meses em português
 */
export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Converte YYYY-MM para nome do mês
 */
export function getMesNome(mesAno: string): string {
  const [year, month] = mesAno.split('-');
  const monthIndex = parseInt(month) - 1;
  return `${MESES_NOMES[monthIndex]} ${year}`;
}
