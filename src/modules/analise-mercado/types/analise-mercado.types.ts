// ============================================
// Tipos Análise de Mercado
// ============================================

/**
 * Dados de evolução do mercado educacional
 */
export interface DadosEvolucaoMercado {
  ano: number;
  matriculados_total: number;
  concluintes_total: number;
  matriculados_presencial: number;
  matriculados_ead: number;
  concluintes_presencial: number;
  concluintes_ead: number;
  matriculados_medicina: number;
  concluintes_medicina: number;
  matriculados_ensino_medio: number;
  concluintes_ensino_medio: number;
}

/**
 * Dados de participação de mercado Viva
 */
export interface ParticipacaoMercado {
  ano: number;
  mercado_total: number;
  viva_total: number;
  participacao_total: number; // %
  mercado_presencial: number;
  viva_presencial: number;
  participacao_presencial: number; // %
  mercado_medicina: number;
  viva_medicina: number;
  participacao_medicina: number; // %
}

/**
 * Segmento estratégico
 */
export interface SegmentoEstrategico {
  id: string;
  nome: string;
  tipo: 'premium' | 'volume' | 'crescimento' | 'estavel';
  ticket_medio: number;
  volume_anual: number;
  previsibilidade: 'alta' | 'media' | 'baixa';
  tendencia: 'crescimento' | 'estavel' | 'declinio';
  margem_percentual: number;
  destaque?: string;
}

/**
 * Tendência de mercado
 */
export interface TendenciaMercado {
  id: string;
  titulo: string;
  descricao: string;
  impacto: 'positivo' | 'negativo' | 'neutro';
  probabilidade: 'alta' | 'media' | 'baixa';
  horizonte: '1-2 anos' | '3-5 anos' | '5+ anos';
  categoria: 'tecnologia' | 'regulatorio' | 'demografico' | 'economico' | 'comportamental';
}

/**
 * Risco regulatório
 */
export interface RiscoRegulatorio {
  id: string;
  titulo: string;
  descricao: string;
  severidade: 'alta' | 'media' | 'baixa';
  probabilidade: 'alta' | 'media' | 'baixa';
  status: 'monitorando' | 'em_andamento' | 'aprovado' | 'arquivado';
  orgao_regulador: string;
  data_limite?: string;
  acoes_mitigacao?: string[];
}

/**
 * KPI do mercado
 */
export interface KPIMercado {
  id: string;
  titulo: string;
  valor: number;
  unidade: string;
  variacao: number; // % em relação ao período anterior
  tendencia: 'up' | 'down' | 'stable';
  cor?: string;
}

/**
 * Filtros disponíveis
 */
export interface FiltrosAnaliseMercado {
  ano?: number;
  segmento?: string;
  regiao?: string;
  modalidade?: 'presencial' | 'ead' | 'todos';
}

/**
 * Dados consolidados do dashboard
 */
export interface DadosAnaliseMercado {
  evolucao: DadosEvolucaoMercado[];
  participacao: ParticipacaoMercado[];
  segmentos: SegmentoEstrategico[];
  tendencias: TendenciaMercado[];
  riscos: RiscoRegulatorio[];
  kpis: KPIMercado[];
  ultima_atualizacao: string;
}
