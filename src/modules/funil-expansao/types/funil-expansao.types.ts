/**
 * Tipos do módulo Funil de Expansão
 * Baseado na estrutura da planilha BASE
 */

/** Tipo de funil: Tratamento, Investidor ou Operador */
export type TipoFunil = 'TRATAMENTO' | 'INVESTIDOR' | 'OPERADOR';

/** Status do lead no funil */
export type StatusFunil =
  | 'NOVO LEAD'
  | 'EM QUALIFICAÇÃO'
  | 'DIAGNÓSTICO AGENDADO'
  | 'DIAGNÓSTICO REALIZADO'
  | 'MOD. NEGÓCIO AGENDADO'
  | 'MOD. NEGÓCIO REALIZADO'
  | 'FIT FRANQUEADO'
  | 'COF E VALIDAÇÕES'
  | 'AGUARD. COMPOSIÇÃO'
  | 'CANDIDATO APROVADO'
  | 'VENDA GANHA'
  | 'VENDA PERDIDA'
  | 'EM RECUPERAÇÃO';

/** Registro individual de lead do funil de expansão */
export interface LeadExpansao {
  id: string;
  nome: string;
  dataEntrada: string;
  dataUltimaAtualizacao: string;
  tipoFunil: TipoFunil;
  status: string;
  origem: string;
  cidade: string;
  uf: string;
  persona: string;
  perfil: string;
  motivoPerda: string;
  motivoQualificacao: string;
  campanha: string;
  conjunto: string;
  anuncio: string;
  assertividadeTerritorio: string;
  assertividadePersona: string;
  tempoComposicao: string;
}

/** KPIs consolidados do funil */
export interface KPIsExpansao {
  totalLeads: number;
  mqls: number;
  sqls: number;
  candidatosAprovados: number;
  franquias: number;
  taxaMql: number;
  taxaSql: number;
  taxaAprovacao: number;
  aguardandoComposicao: number;
  emRecuperacao: number;
  perdidos: number;
  assertividadeTerritorio: number;
  assertividadePersona: number;
}

/** Dados do funil para exibição de conversão (etapas) */
export interface EtapaFunil {
  nome: string;
  quantidade: number;
  taxaConversao: number;
}

/** Funil completo com etapas de tratamento, investidor e operador */
export interface FunilCompleto {
  tratamento: EtapaFunil[];
  investidor: EtapaFunil[];
  operador: EtapaFunil[];
}

/** Dados agrupados por origem */
export interface DadosPorOrigem {
  origem: string;
  geral: number;
  mql: number;
  sql: number;
}

/** Dados de assertividade */
export interface DadosAssertividade {
  categoria: string;
  quantidade: number;
  percentual: number;
}

/** Dados agrupados por persona */
export interface DadosPorPersona {
  persona: string;
  geral: number;
  mql: number;
  sql: number;
}

/** Dados agrupados por perfil */
export interface DadosPorPerfil {
  perfil: string;
  geral: number;
  mql: number;
  sql: number;
}

/** Dados de motivos de perda */
export interface MotivoPerda {
  motivo: string;
  geral: number;
  mql: number;
  sql: number;
}

/** Dados de campanha */
export interface DadosCampanha {
  nome: string;
  leads: number;
  mqls: number;
  sqls: number;
  conversoes: number;
}

/** Dados de candidatos por cidade (composição) */
export interface CandidatoCidade {
  cidade: string;
  investidor: number;
  operador: number;
  total: number;
  percentual: number;
}

/** Estado dos filtros do funil de expansão */
export interface FiltrosExpansao {
  tipoFunil: TipoFunil | 'TODOS';
  origem: string;
  periodoInicio: string;
  periodoFim: string;
}

/** Página ativa do módulo */
export type PaginaAtivaExpansao = 'indicadores' | 'operacionais' | 'composicao' | 'campanhas';
