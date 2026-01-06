/**
 * Utilitários de cálculos para o dashboard
 */

import { Adesao, Meta, MetasMap, KPIs, Periodo, TipoVVR } from '@/modules/vendas/types/vendas.types';
import { LeadFunil, IndicadoresFunil } from '@/modules/vendas/types/funil.types';
import { normalizeText } from './formatacao';
import { COLORS, META_CONFIG } from '@/modules/vendas/config/app.config';

/**
 * Mapeamento para correção de nomes de unidades inconsistentes
 * Mapeia nomes incorretos/incompletos para os nomes corretos
 */
const UNIDADE_CORRECOES: Record<string, string> = {
  'Volta Redonda': 'Volta Redonda - VivaMixx',
  // Adicione outras correções aqui se necessário
};

/**
 * Normaliza o nome da unidade, corrigindo inconsistências conhecidas
 */
export function normalizarNomeUnidade(unidade: string): string {
  if (!unidade) return '';
  const trimmed = unidade.trim();
  return UNIDADE_CORRECOES[trimmed] || trimmed;
}

/**
 * Retorna cor baseada no percentual de atingimento
 */
export function getColorForPercentage(percent: number): string {
  if (percent >= 1) return COLORS.CHART_GRADIENT.SUCCESS;
  if (percent >= 0.5) return COLORS.CHART_GRADIENT.WARNING;
  return COLORS.CHART_GRADIENT.DANGER;
}

/**
 * Retorna cor sólida baseada no percentual
 */
export function getSolidColorForPercentage(percent: number): string {
  if (percent >= 1) return COLORS.SUCCESS;
  if (percent >= 0.5) return COLORS.PRIMARY;
  return COLORS.DANGER;
}

/**
 * Aplica multiplicador de meta interna
 */
export function aplicarMultiplicadorMeta(valorMeta: number, isMetaInterna: boolean): number {
  return isMetaInterna ? valorMeta * META_CONFIG.META_INTERNA_MULTIPLICADOR : valorMeta;
}

/**
 * Filtra dados de adesão por período
 */
export function filtrarAdesoesPorPeriodo(
  dados: Adesao[],
  startDate: Date,
  endDate: Date
): Adesao[] {
  return dados.filter(d => 
    d.dt_cadastro_integrante >= startDate && 
    d.dt_cadastro_integrante <= endDate
  );
}

/**
 * Filtra dados por unidades
 */
export function filtrarPorUnidades<T extends { nm_unidade: string }>(
  dados: T[],
  unidades: string[]
): T[] {
  if (unidades.length === 0) return dados;
  return dados.filter(d => unidades.includes(d.nm_unidade));
}

/**
 * Calcula KPIs principais
 */
export function calcularKPIs(
  dados: Adesao[],
  metas: MetasMap,
  unidadesSelecionadas: string[],
  periodo: Periodo,
  isMetaInterna: boolean = false
): KPIs {
  // Calcular realizados
  const realizadoVendas = dados
    .filter(d => normalizeText(d.venda_posvenda) === 'VENDA')
    .reduce((sum, d) => sum + d.vl_plano, 0);
  
  const realizadoPosVendas = dados
    .filter(d => normalizeText(d.venda_posvenda) === 'POS VENDA')
    .reduce((sum, d) => sum + d.vl_plano, 0);
  
  const realizadoTotal = realizadoVendas + realizadoPosVendas;

  // Calcular metas
  let metaVendas = 0;
  let metaPosVendas = 0;

  const unidadesNorm = unidadesSelecionadas.map(u => u?.toLowerCase().trim());

  metas.forEach((metaInfo, chave) => {
    const [unidadeMetaRaw, anoMeta, mesMeta] = chave.split('-');
    const unidadeMeta = unidadeMetaRaw?.toLowerCase().trim();

    if (!unidadeMeta) return;
    
    // Filtrar por unidades selecionadas
    if (unidadesNorm.length > 0 && !unidadesNorm.includes(unidadeMeta)) return;

    // Verificar se está no período
    if (anoMeta && mesMeta) {
      const metaDate = new Date(Number(anoMeta), Number(mesMeta) - 1, 1);
      const metaRangeStart = new Date(metaDate.getFullYear(), metaDate.getMonth(), 1);
      const metaRangeEnd = new Date(metaDate.getFullYear(), metaDate.getMonth() + 1, 0, 23, 59, 59);

      if (metaRangeStart <= periodo.endDate && metaRangeEnd >= periodo.startDate) {
        metaVendas += metaInfo.meta_vvr_vendas || 0;
        metaPosVendas += metaInfo.meta_vvr_posvendas || 0;
      }
    }
  });

  // Aplicar multiplicador se meta interna
  metaVendas = aplicarMultiplicadorMeta(metaVendas, isMetaInterna);
  metaPosVendas = aplicarMultiplicadorMeta(metaPosVendas, isMetaInterna);

  const metaTotal = metaVendas + metaPosVendas;
  
  return {
    realizadoTotal,
    realizadoVendas,
    realizadoPosVendas,
    metaTotal,
    metaVendas,
    metaPosVendas,
    percentTotal: metaTotal > 0 ? realizadoTotal / metaTotal : 0,
    percentVendas: metaVendas > 0 ? realizadoVendas / metaVendas : 0,
    percentPosVendas: metaPosVendas > 0 ? realizadoPosVendas / metaPosVendas : 0,
  };
}

/**
 * Calcula indicadores operacionais
 */
export function calcularIndicadoresOperacionais(
  metas: MetasMap,
  fundosCount: number,
  adesoesCount: number,
  leadsCount: number,
  reunioesCount: number,
  unidadesSelecionadas: string[],
  periodo: Periodo
): {
  leads: { total: number; meta: number; percent: number };
  reunioes: { total: number; meta: number; percent: number };
  contratos: { total: number; meta: number; percent: number };
  adesoes: { total: number; meta: number; percent: number };
} {
  let metaLeads = 0;
  let metaReunioes = 0;
  let metaContratos = 0;
  let metaAdesoes = 0;

  const unidadesNorm = unidadesSelecionadas.map(u => u?.toLowerCase().trim());

  metas.forEach((metaInfo, chave) => {
    const [unidadeMetaRaw, anoMeta, mesMeta] = chave.split('-');
    const unidadeMeta = unidadeMetaRaw?.toLowerCase().trim();

    if (!unidadeMeta) return;
    if (unidadesNorm.length > 0 && !unidadesNorm.includes(unidadeMeta)) return;

    if (anoMeta && mesMeta) {
      const metaDate = new Date(Number(anoMeta), Number(mesMeta) - 1, 1);
      const metaRangeStart = new Date(metaDate.getFullYear(), metaDate.getMonth(), 1);
      const metaRangeEnd = new Date(metaDate.getFullYear(), metaDate.getMonth() + 1, 0);

      if (metaRangeStart <= periodo.endDate && metaRangeEnd >= periodo.startDate) {
        metaLeads += metaInfo.meta_leads || 0;
        metaReunioes += metaInfo.meta_reunioes || 0;
        metaContratos += metaInfo.meta_contratos || 0;
        metaAdesoes += metaInfo.meta_adesoes || 0;
      }
    }
  });

  return {
    leads: {
      total: leadsCount,
      meta: metaLeads,
      percent: metaLeads > 0 ? leadsCount / metaLeads : 0,
    },
    reunioes: {
      total: reunioesCount,
      meta: metaReunioes,
      percent: metaReunioes > 0 ? reunioesCount / metaReunioes : 0,
    },
    contratos: {
      total: fundosCount,
      meta: metaContratos,
      percent: metaContratos > 0 ? fundosCount / metaContratos : 0,
    },
    adesoes: {
      total: adesoesCount,
      meta: metaAdesoes,
      percent: metaAdesoes > 0 ? adesoesCount / metaAdesoes : 0,
    },
  };
}

/**
 * Calcula indicadores do funil
 */
export function calcularIndicadoresFunil(leads: LeadFunil[]): IndicadoresFunil {
  return {
    totalLeadsCriados: leads.length,
    qualificacaoComissao: leads.filter(l => l.qualificacao_comissao).length,
    reuniaoRealizada: leads.filter(l => l.diagnostico_realizado).length,
    propostasEnviadas: leads.filter(l => l.proposta_enviada).length,
    contratosFechados: leads.filter(l => l.fechamento_comissao).length,
    leadsPerdidos: leads.filter(l => l.concat_motivo_perda).length,
    leadsDescartados: leads.filter(l => l.fase_perdido === 'DESCARTADO').length,
  };
}

/**
 * Agrupa dados por mês/ano
 */
export function agruparPorMes<T extends { dt_cadastro_integrante?: Date; dt_contrato?: Date }>(
  dados: T[],
  campoData: 'dt_cadastro_integrante' | 'dt_contrato' = 'dt_cadastro_integrante'
): Map<string, T[]> {
  const grupos = new Map<string, T[]>();

  dados.forEach(item => {
    const date = item[campoData] as Date | undefined;
    if (!date) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(item);
  });

  return grupos;
}

/**
 * Extrai lista única de unidades dos dados
 * Aplica normalização para corrigir nomes inconsistentes
 */
export function extrairUnidades(dados: { nm_unidade: string }[]): string[] {
  return [...new Set(
    dados
      .map(d => normalizarNomeUnidade(d.nm_unidade))
      .filter(Boolean)
  )].sort();
}

/**
 * Extrai valores únicos de um campo
 */
export function extrairValoresUnicos<T>(dados: T[], campo: keyof T): string[] {
  return [...new Set(
    dados
      .map(d => String(d[campo] || '').trim())
      .filter(v => v && v !== 'N/A')
  )].sort();
}

/**
 * Interface para filtros de dados de vendas/adesões
 */
export interface FiltrosDados {
  // Filtros básicos
  dataInicio?: Date;
  dataFim?: Date;
  unidades?: string[];
  
  // Filtros da página de Metas
  cursos?: string[];
  
  // Filtros da página de Indicadores
  fundos?: string[];
  tipoAdesao?: string[];
  tipoServico?: string[];
  tipoCliente?: string[];
  consultorComercial?: string[];
  indicacaoAdesao?: string[];
  instituicao?: string[];
  
  // Filtros legados
  consultores?: string[];
  tipoVenda?: string;
}

/**
 * Filtra dados de adesão por múltiplos critérios
 */
export function filtrarDados(
  dados: Adesao[],
  filtros: FiltrosDados
): Adesao[] {
  return dados.filter(item => {
    // Filtro por data
    if (filtros.dataInicio && item.dt_cadastro_integrante < filtros.dataInicio) {
      return false;
    }
    if (filtros.dataFim && item.dt_cadastro_integrante > filtros.dataFim) {
      return false;
    }
    
    // Filtro por unidade
    if (filtros.unidades && filtros.unidades.length > 0) {
      if (!filtros.unidades.includes(item.nm_unidade)) {
        return false;
      }
    }
    
    // Filtro por curso
    if (filtros.cursos && filtros.cursos.length > 0) {
      if (!filtros.cursos.includes(item.curso_fundo)) {
        return false;
      }
    }
    
    // Filtro por fundo
    if (filtros.fundos && filtros.fundos.length > 0) {
      if (!filtros.fundos.includes(item.nm_fundo)) {
        return false;
      }
    }
    
    // Filtro por tipo de adesão (VENDA / POS VENDA)
    if (filtros.tipoAdesao && filtros.tipoAdesao.length > 0) {
      const tipoNormalizado = (item.venda_posvenda || '').trim().toUpperCase();
      if (!filtros.tipoAdesao.includes(tipoNormalizado)) {
        return false;
      }
    }
    
    // Filtro por tipo de serviço
    if (filtros.tipoServico && filtros.tipoServico.length > 0) {
      if (!filtros.tipoServico.includes(item.tp_servico)) {
        return false;
      }
    }
    
    // Filtro por tipo de cliente
    if (filtros.tipoCliente && filtros.tipoCliente.length > 0) {
      if (!filtros.tipoCliente.includes(item.tipo_cliente)) {
        return false;
      }
    }
    
    // Filtro por consultor comercial
    if (filtros.consultorComercial && filtros.consultorComercial.length > 0) {
      if (!filtros.consultorComercial.includes(item.consultor_comercial)) {
        return false;
      }
    }
    
    // Filtro por indicação de adesão
    if (filtros.indicacaoAdesao && filtros.indicacaoAdesao.length > 0) {
      if (!filtros.indicacaoAdesao.includes(item.indicado_por)) {
        return false;
      }
    }
    
    // Filtro por instituição
    if (filtros.instituicao && filtros.instituicao.length > 0) {
      if (!filtros.instituicao.includes(item.nm_instituicao)) {
        return false;
      }
    }
    
    // Filtro por consultor (legado - usado no funil)
    if (filtros.consultores && filtros.consultores.length > 0) {
      if (!filtros.consultores.includes(item.consultor_comercial)) {
        return false;
      }
    }
    
    // Filtro por tipo de venda (legado)
    if (filtros.tipoVenda && filtros.tipoVenda !== 'todos') {
      if (normalizeText(item.venda_posvenda) !== normalizeText(filtros.tipoVenda)) {
        return false;
      }
    }
    
    return true;
  });
}

