// Funções de processamento de dados

import { DashboardData, ProcessedOkrData, ProcessedKpiData, KpiData, TrimestralData, EquipeData, FcaData } from '../types';
import { getStatusByPercent } from './formatacao';

/**
 * Processa dados brutos da planilha de OKRs
 */
export function processarOkrs(rawData: any[][]): ProcessedOkrData[] {
  if (!rawData || rawData.length < 2) return [];
  
  // Pular cabeçalho
  return rawData.slice(1).map(row => {
    const metaAnual = parseFloat(row[1]) || 0;
    const realizado = parseFloat(row[2]) || 0;
    const percentual = metaAnual > 0 ? (realizado / metaAnual) * 100 : 0;
    
    return {
      titulo: row[0] || '',
      metaAnual,
      realizado,
      percentual,
      status: getStatusByPercent(percentual)
    };
  }).filter(okr => okr.titulo);
}

/**
 * Processa dados brutos da planilha de KPIs
 */
export function processarKpis(rawData: any[][]): ProcessedKpiData[] {
  if (!rawData || rawData.length < 2) return [];
  
  return rawData.slice(1).map(row => {
    const meta = parseFloat(row[1]) || 0;
    const realizado = parseFloat(row[2]) || 0;
    const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
    
    return {
      indicador: row[0] || '',
      meta,
      realizado,
      percentual,
      status: getStatusByPercent(percentual),
      responsavel: row[3] || '',
      planoAcao: row[4] || ''
    };
  }).filter(kpi => kpi.indicador);
}

/**
 * Processa dados trimestrais
 */
export function processarTrimestral(rawData: any[][]): TrimestralData[] {
  if (!rawData || rawData.length < 2) return [];
  
  return rawData.slice(1).map(row => {
    const meta = parseFloat(row[2]) || 0;
    const realizado = parseFloat(row[3]) || 0;
    const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
    const desvio = realizado - meta;
    
    return {
      trimestre: row[0] || '',
      mes: row[1] || '',
      meta,
      realizado,
      percentual,
      desvio
    };
  }).filter(item => item.trimestre);
}

/**
 * Processa dados da equipe
 */
export function processarEquipe(rawData: any[][]): EquipeData[] {
  if (!rawData || rawData.length < 2) return [];
  
  return rawData.slice(1).map(row => {
    const metaIndividual = parseFloat(row[2]) || 0;
    const realizado = parseFloat(row[3]) || 0;
    const percentual = metaIndividual > 0 ? (realizado / metaIndividual) * 100 : 0;
    
    return {
      membro: row[0] || '',
      cargo: row[1] || '',
      metaIndividual,
      realizado,
      percentual
    };
  }).filter(membro => membro.membro);
}

/**
 * Processa FCAs (Fato, Causa, Ação)
 */
export function processarFcas(rawData: any[][]): FcaData[] {
  if (!rawData || rawData.length < 2) return [];
  
  return rawData.slice(1).map(row => ({
    fato: row[0] || '',
    causa: row[1] || '',
    acao: row[2] || '',
    responsavel: row[3] || '',
    prazo: row[4] || '',
    status: row[5] || 'Pendente'
  })).filter(fca => fca.fato);
}

/**
 * Calcula o EBITDA a partir dos dados brutos
 */
export function calcularEbitda(rawData: any[][]): { meta: number; realizado: number; percentual: number; acumuladoAno: number } {
  if (!rawData || rawData.length < 2) {
    return { meta: 0, realizado: 0, percentual: 0, acumuladoAno: 0 };
  }
  
  // Assumindo que a primeira linha após o cabeçalho contém os dados do EBITDA
  const row = rawData[1];
  const meta = parseFloat(row[1]) || 0;
  const realizado = parseFloat(row[2]) || 0;
  const percentual = meta > 0 ? (realizado / meta) * 100 : 0;
  const acumuladoAno = parseFloat(row[3]) || realizado;
  
  return { meta, realizado, percentual, acumuladoAno };
}

/**
 * Filtra KPIs que precisam de atenção (abaixo de 90%)
 */
export function filtrarKpisAtencao(kpis: KpiData[]): KpiData[] {
  return kpis.filter(kpi => kpi.metasReal < 90);
}
