/**
 * Tipos para dados de Vendas/Adesões
 */

// Dados de uma adesão individual
export interface Adesao {
  nm_unidade: string;
  dt_cadastro_integrante: Date;
  vl_plano: number;
  venda_posvenda: 'VENDA' | 'POS VENDA' | string;
  indicado_por: string;
  consultor_comercial: string;
  codigo_integrante: string;
  nm_integrante: string;
  id_fundo: string;
  nm_fundo: string;
  curso_fundo: string;
  tp_servico: string;
  nm_instituicao: string;
  tipo_cliente: string;
}

// Dados de um fundo/contrato
export interface Fundo {
  nm_unidade: string;
  id_fundo: string;
  nm_fundo: string;
  dt_contrato: Date;
  dt_cadastro: Date | null;
  tipo_servico: string;
  instituicao: string;
  dt_baile: Date | null;
  curso_fundo: string;
  tipo_cliente: string;
}

// Dados de meta
export interface Meta {
  meta_vvr_vendas: number;
  meta_vvr_posvendas: number;
  meta_vvr_total: number;
  meta_adesoes: number;
  meta_leads: number;
  meta_contratos: number;
  meta_reunioes: number;
}

// Chave para metas: "Unidade-AAAA-MM"
export type MetaKey = string;

// Mapa de metas
export type MetasMap = Map<MetaKey, Meta>;

// Dados agregados por período/unidade
export interface DadosAgregados {
  unidade: string;
  periodo: string; // AAAA-MM
  realizado_vvr: number;
  realizado_adesoes: number;
  meta_vvr_vendas: number;
  meta_vvr_posvendas: number;
  meta_vvr_total: number;
  meta_adesoes: number;
}

// KPIs principais
export interface KPIs {
  realizadoTotal: number;
  realizadoVendas: number;
  realizadoPosVendas: number;
  metaTotal: number;
  metaVendas: number;
  metaPosVendas: number;
  percentTotal: number;
  percentVendas: number;
  percentPosVendas: number;
}

// Indicadores operacionais
export interface IndicadoresOperacionais {
  leads: {
    total: number;
    meta: number;
    percent: number;
  };
  reunioes: {
    total: number;
    meta: number;
    percent: number;
  };
  contratos: {
    total: number;
    meta: number;
    percent: number;
  };
  adesoes: {
    total: number;
    meta: number;
    percent: number;
  };
}

// Tipo para tipo de VVR no gráfico
export type TipoVVR = 'total' | 'vendas' | 'posvendas';

// Período selecionado
export interface Periodo {
  startDate: Date;
  endDate: Date;
}

// Opções de período pré-definido
export type PeriodoPreDefinido = 
  | 'hoje'
  | 'ontem'
  | 'ultimos7dias'
  | 'ultimos30dias'
  | 'estemes'
  | 'mespassado'
  | 'esteano'
  | 'esteanoateagora'
  | 'anopassado';
