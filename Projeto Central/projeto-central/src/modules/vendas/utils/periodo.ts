/**
 * Utilitários de período/datas
 */

import { PeriodoPreDefinido, Periodo } from '@/modules/vendas/types/vendas.types';

/**
 * Parser de data no formato DD/MM/YYYY ou outros formatos comuns
 * Função utilitária centralizada para evitar duplicação (DRY)
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const trimmed = dateString.trim();
  if (!trimmed) return null;

  // Formato DD/MM/YYYY
  const brFormat = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brFormat) {
    const [, day, month, year] = brFormat;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Formato YYYY-MM-DD
  const isoFormat = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFormat) {
    const [, year, month, day] = isoFormat;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Tentar parse direto como fallback
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calcula datas de um período pré-definido
 */
export function getPeriodoDatas(periodo: PeriodoPreDefinido): Periodo {
  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = hoje.getMonth();
  const day = hoje.getDate();

  switch (periodo) {
    case 'hoje':
      return {
        startDate: new Date(year, month, day, 0, 0, 0),
        endDate: new Date(year, month, day, 23, 59, 59),
      };

    case 'ontem':
      const ontem = new Date(hoje);
      ontem.setDate(day - 1);
      return {
        startDate: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 0, 0, 0),
        endDate: new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 23, 59, 59),
      };

    case 'ultimos7dias':
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(day - 6);
      return {
        startDate: new Date(seteDiasAtras.getFullYear(), seteDiasAtras.getMonth(), seteDiasAtras.getDate(), 0, 0, 0),
        endDate: new Date(year, month, day, 23, 59, 59),
      };

    case 'ultimos30dias':
      const trintaDiasAtras = new Date(hoje);
      trintaDiasAtras.setDate(day - 29);
      return {
        startDate: new Date(trintaDiasAtras.getFullYear(), trintaDiasAtras.getMonth(), trintaDiasAtras.getDate(), 0, 0, 0),
        endDate: new Date(year, month, day, 23, 59, 59),
      };

    case 'estemes':
      return {
        startDate: new Date(year, month, 1, 0, 0, 0),
        endDate: new Date(year, month + 1, 0, 23, 59, 59),
      };

    case 'mespassado':
      return {
        startDate: new Date(year, month - 1, 1, 0, 0, 0),
        endDate: new Date(year, month, 0, 23, 59, 59),
      };

    case 'esteano':
      return {
        startDate: new Date(year, 0, 1, 0, 0, 0),
        endDate: new Date(year, 11, 31, 23, 59, 59),
      };

    case 'esteanoateagora':
      return {
        startDate: new Date(year, 0, 1, 0, 0, 0),
        endDate: new Date(year, month, day, 23, 59, 59),
      };

    case 'anopassado':
      return {
        startDate: new Date(year - 1, 0, 1, 0, 0, 0),
        endDate: new Date(year - 1, 11, 31, 23, 59, 59),
      };

    default:
      // Padrão: mês atual
      return {
        startDate: new Date(year, month, 1, 0, 0, 0),
        endDate: new Date(year, month + 1, 0, 23, 59, 59),
      };
  }
}

/**
 * Retorna o label do período selecionado
 */
export function identificarPeriodo(periodo: PeriodoPreDefinido | string): string {
  const labels: Record<string, string> = {
    'hoje': 'Hoje',
    'ontem': 'Ontem',
    'ultimos7dias': 'Últimos 7 dias',
    'ultimos30dias': 'Últimos 30 dias',
    'estemes': 'Este mês',
    'mespassado': 'Mês passado',
    'esteano': 'Este ano',
    'esteanoateagora': 'Este ano até agora',
    'anopassado': 'Ano passado',
    'personalizado': 'Personalizado',
  };

  return labels[periodo] || 'Este mês';
}

/**
 * Retorna período do ano anterior com as mesmas datas relativas
 */
export function getPeriodoAnoAnterior(periodo: Periodo): Periodo {
  return {
    startDate: new Date(
      periodo.startDate.getFullYear() - 1,
      periodo.startDate.getMonth(),
      periodo.startDate.getDate(),
      0, 0, 0
    ),
    endDate: new Date(
      periodo.endDate.getFullYear() - 1,
      periodo.endDate.getMonth(),
      periodo.endDate.getDate(),
      23, 59, 59
    ),
  };
}

/**
 * Cria objeto Date no início do dia
 */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * Cria objeto Date no fim do dia
 */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

/**
 * Cria objeto Date no primeiro dia do mês
 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Cria objeto Date no último dia do mês
 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

