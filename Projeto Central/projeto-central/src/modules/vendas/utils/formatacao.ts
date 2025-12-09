/**
 * Utilitários de formatação
 */

import { DISPLAY_CONFIG } from '@/modules/vendas/config/app.config';

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(DISPLAY_CONFIG.CURRENCY_LOCALE, {
    style: 'currency',
    currency: DISPLAY_CONFIG.CURRENCY_CODE,
  }).format(value || 0);
}

/**
 * Formata valor como percentual
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat(DISPLAY_CONFIG.CURRENCY_LOCALE, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
}

/**
 * Formata número com separador de milhar
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat(DISPLAY_CONFIG.CURRENCY_LOCALE).format(value || 0);
}

/**
 * Formata data no padrão brasileiro
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return dateObj.toLocaleDateString(DISPLAY_CONFIG.DATE_LOCALE, {
    timeZone: 'UTC',
  });
}

/**
 * Formata data com dia, mês e ano por extenso
 */
export function formatDateLong(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'N/A';
  
  return dateObj.toLocaleDateString(DISPLAY_CONFIG.DATE_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata período como "DD/MM/YYYY até DD/MM/YYYY"
 */
export function formatPeriodo(startDate: Date, endDate: Date): string {
  return `${formatDate(startDate)} até ${formatDate(endDate)}`;
}

/**
 * Retorna o nome do mês por extenso
 */
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month] || '';
}

/**
 * Retorna abreviação do mês
 */
export function getMonthAbbr(month: number): string {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 
    'Mai', 'Jun', 'Jul', 'Ago',
    'Set', 'Out', 'Nov', 'Dez'
  ];
  return months[month] || '';
}

/**
 * Normaliza texto (remove acentos, uppercase)
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Trunca texto com ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

