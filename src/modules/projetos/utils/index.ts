/**
 * Utilitários do módulo Painel Gerencial de Projetos
 */

import { ProjetoStatus, ProjetoSituacao, ProjetosResumo, Projeto } from '../types';
import { STATUS_COLORS } from '../config/app.config';

/**
 * Determinar situação (semáforo) baseado no percentual de atingimento
 */
export const getSituacao = (percentual: number): ProjetoSituacao => {
  if (percentual >= 80) return 'verde';
  if (percentual >= 50) return 'amarelo';
  return 'vermelho';
};

/**
 * Obter cor do status
 */
export const getStatusColor = (situacao: ProjetoSituacao): string => {
  return STATUS_COLORS[situacao];
};

/**
 * Obter cor e estilo do status do projeto
 */
export const getProjetoStatusStyle = (status: ProjetoStatus) => {
  const styles: Record<ProjetoStatus, { bg: string; text: string; border: string }> = {
    'Em Andamento': { bg: 'rgba(255,102,0,0.15)', text: '#FF8533', border: '#FF6600' },
    'Passado': { bg: 'rgba(234,179,8,0.15)', text: '#EAB308', border: '#EAB308' },
    'Finalizado': { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: '#22C55E' },
    'Cancelado': { bg: 'rgba(239,68,68,0.15)', text: '#EF4444', border: '#EF4444' },
    'Inativo': { bg: 'rgba(107,114,128,0.15)', text: '#6B7280', border: '#6B7280' },
  };
  return styles[status] || styles['Em Andamento'];
};

/**
 * Calcular resumo dos projetos para os cards KPI
 */
export const calcularResumo = (projetos: Projeto[]): ProjetosResumo => {
  return {
    total: projetos.length,
    emAndamento: projetos.filter(p => p.status === 'Em Andamento').length,
    passados: projetos.filter(p => p.status === 'Passado').length,
    finalizados: projetos.filter(p => p.status === 'Finalizado').length,
    cancelados: projetos.filter(p => p.status === 'Cancelado').length,
  };
};

/**
 * Formatar percentual
 */
export const formatarPercentual = (valor: number): string => {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
};

/**
 * Formatar valor monetário
 */
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

/**
 * Formatar data para exibição (DD/MM/YYYY)
 */
export const formatarData = (data: string): string => {
  if (!data) return '-';
  // Se já está no formato DD/MM/YYYY retorna como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
  // Se está no formato YYYY-MM-DD converte
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  return data;
};

/**
 * Gerar ID único para projeto
 */
export const gerarProjetoId = (): string => {
  return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calcular percentual de atingimento
 */
export const calcularAtingimento = (esperado: number, atingido: number): number => {
  if (esperado === 0) return 0;
  return Math.round((atingido / esperado) * 100 * 10) / 10;
};

/**
 * Verificar se projeto está atrasado
 */
export const isProjetoAtrasado = (prazoFinal: string): boolean => {
  if (!prazoFinal) return false;
  const [dia, mes, ano] = prazoFinal.split('/').map(Number);
  const prazo = new Date(ano, mes - 1, dia);
  return prazo < new Date();
};
