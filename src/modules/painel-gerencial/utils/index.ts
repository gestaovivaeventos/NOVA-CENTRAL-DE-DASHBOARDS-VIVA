/**
 * Utilitários do módulo Painel Gerencial
 */

import { STATUS_COLORS } from '../config/app.config';

/**
 * Determinar status baseado no percentual de atingimento
 */
export const getStatus = (percentual: number): 'verde' | 'amarelo' | 'vermelho' => {
  if (percentual >= 100) return 'verde';
  if (percentual >= 70) return 'amarelo';
  return 'vermelho';
};

/**
 * Obter cor do status
 */
export const getStatusColor = (status: 'verde' | 'amarelo' | 'vermelho'): string => {
  return STATUS_COLORS[status];
};

/**
 * Formatar percentual
 */
export const formatarPercentual = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { 
    minimumFractionDigits: 1, 
    maximumFractionDigits: 1 
  }) + '%';
};

/**
 * Formatar valor monetário
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(valor);
};

/**
 * Formatar número
 */
export const formatarNumero = (valor: number): string => {
  return valor.toLocaleString('pt-BR');
};

/**
 * Obter competência atual no formato MM/YYYY
 */
export const getCompetenciaAtual = (): string => {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const ano = now.getFullYear();
  return `${mes}/${ano}`;
};

/**
 * Obter trimestre atual
 */
export const getTrimestreAtual = (): string => {
  const now = new Date();
  const trimestre = Math.ceil((now.getMonth() + 1) / 3);
  return `T${trimestre}`;
};
