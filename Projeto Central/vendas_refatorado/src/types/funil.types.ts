/**
 * Tipos para dados do Funil de Vendas
 */

// Lead do funil
export interface LeadFunil {
  id: number;
  titulo: string;
  fase_perdido: string;
  curso: string;
  consultor: string;
  etiquetas: string;
  origem_lead: string;
  segmentacao_lead: string;
  criado_em: string;
  qualificacao_comissao: string;
  diagnostico_realizado: string;
  proposta_enviada: string;
  fechamento_comissao: string;
  concat_motivo_perda: string;
  concat_concorrente: string;
  nm_unidade: string;
  // Perdas por fase
  perda_11: string;
  perda_12: string;
  perda_13: string;
  perda_21: string;
  perda_22: string;
  perda_31: string;
  perda_32: string;
  perda_33: string;
  perda_41: string;
  perda_51: string;
}

// Indicadores do funil
export interface IndicadoresFunil {
  totalLeadsCriados: number;
  qualificacaoComissao: number;
  reuniaoRealizada: number;
  propostasEnviadas: number;
  contratosFechados: number;
  leadsPerdidos: number;
  leadsDescartados: number;
}

// Dados de captação agrupados
export interface CaptacaoAgrupada {
  origemLead: string;
  tipoCaptacao: string;
  total: number;
  percentual: number;
}

// Dados de perdas por fase
export interface PerdasPorFase {
  fase: string;
  quantidade: number;
}

// Dados de negociações por fase
export interface NegociacoesPorFase {
  fase: string;
  quantidade: number;
}

// Motivo de perda
export interface MotivoPerda {
  motivo: string;
  total: number;
  percentual: number;
}

// Motivo de descarte
export interface MotivoDescarte {
  motivo: string;
  total: number;
  percentual: number;
}

// Concorrente
export interface Concorrente {
  nome: string;
  total: number;
  percentual: number;
}
