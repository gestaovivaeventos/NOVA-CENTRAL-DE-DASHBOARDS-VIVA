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
  regiao: string;
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
  faseQuePerdeu: string;
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
  // Breakdowns por tipo de funil
  candidatosAprovadosInv: number;
  candidatosAprovadosOp: number;
  aguardandoComposicaoInv: number;
  aguardandoComposicaoOp: number;
  emRecuperacaoTrat: number;
  emRecuperacaoInv: number;
  emRecuperacaoOp: number;
  perdidosTrat: number;
  perdidosInv: number;
  perdidosOp: number;
  // Ativos (leads atualmente na fase)
  mqlAtivos: number;
  sqlAtivos: number;
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
  tratamento: number;
  investidores: number;
  operadores: number;
  recupPerdidos: number;
}

/** Dados de candidatos por cidade (composição) - quebra por perfil */
export interface CandidatoCidade {
  cidade: string;
  investidorTotal: number;
  investidorParcial: number;
  opVendaParcial: number;
  opVendaSem: number;
  opPosVendaParcial: number;
  total: number;
  percentual: number;
  temOportunidade: boolean; // tem ao menos 1 investidor E 1 operador
}

/** Dados de tempo em composição por cidade (buckets de tempo) */
export interface TempoComposicaoCidade {
  cidade: string;
  invAte1m: number;
  inv1a3m: number;
  inv3a6m: number;
  invMais6m: number;
  opAte1m: number;
  op1a3m: number;
  op3a6m: number;
  opMais6m: number;
  total: number;
}

/** Estado dos filtros do funil de expansão */
export interface FiltrosExpansao {
  tipoFunil: TipoFunil | 'TODOS';
  origem: string;
  periodoInicio: string;
  periodoFim: string;
  periodoSelecionado: string;
}

/** Página ativa do módulo */
export type PaginaAtivaExpansao = 'indicadores' | 'operacionais' | 'composicao' | 'campanhas';
