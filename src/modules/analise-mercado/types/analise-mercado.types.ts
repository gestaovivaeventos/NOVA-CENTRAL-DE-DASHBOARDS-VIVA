// ============================================
// Tipos — Módulo Análise de Mercado (Reestruturado)
// ============================================

// ─── Filtros ──────────────────────────────────
export type TipoInstituicao = 'todos' | 'publica' | 'privada';
export type TipoModalidade = 'todos' | 'presencial' | 'ead';
export type VisaoAtiva = 'alunos' | 'turmas' | 'ens-medio';
export type MetricaAtiva = 'matriculas' | 'concluintes' | 'ingressantes';

export interface FiltrosAnaliseMercado {
  ano: number;
  tipoInstituicao: TipoInstituicao;
  modalidade: TipoModalidade;
  estado: string | null;
  municipio: string | null;
  instituicaoId: number | null;
  curso: string | null;
  franquiaId: string | null;
  areaConhecimento: string | null;
  metricasAtivas: MetricaAtiva[];
}

// ─── Franquia (sidebar) ──────────────────────
export interface Franquia {
  id: string;
  nome: string;
}

// ─── KPI Cards ───────────────────────────────
export interface IndicadorCard {
  id: string;
  titulo: string;
  valor: number;
  variacao: number | null;
  tendencia: 'up' | 'down' | 'stable';
  cor: string;
  subtitulo?: string;
  comparativoBrasil?: number;
}

// ─── Breakdown por métrica ──────────────────
export interface BreakdownMetrica {
  presencial: number;
  ead: number;
  publica: number;
  privada: number;
  feminino: number;
  masculino: number;
  publicaPresencial: number;
  publicaEad: number;
  privadaPresencial: number;
  privadaEad: number;
}

// ─── Evolução Histórica ─────────────────────
export interface DadosEvolucaoAnual {
  ano: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  ies?: number;
  cursos?: number;
  /** @deprecated Use porMetrica.matriculas instead */
  presencial: number;
  /** @deprecated Use porMetrica.matriculas instead */
  ead: number;
  /** @deprecated Use porMetrica.matriculas instead */
  publica: number;
  /** @deprecated Use porMetrica.matriculas instead */
  privada: number;
  /** @deprecated Use porMetrica.matriculas instead */
  genero: { feminino: number; masculino: number };
  porMetrica: Record<MetricaAtiva, BreakdownMetrica>;
}

// ─── Nº Cursos por Instituição ──────────────
export interface DadosInstituicao {
  codIes: number;
  nome: string;
  tipo: 'publica' | 'privada';
  modalidade: 'presencial' | 'ead' | 'ambas';
  cursos: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  turmas: number;
  uf: string;
}

// ─── Distribuição por Estado ────────────────
export interface DadosEstado {
  uf: string;
  nome: string;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  turmas: number;
  instituicoes: number;
  percentual: number;
}

// ─── Dados por Cidade (drill-down) ──────────
export interface DadosCidade {
  nome: string;
  uf: string;
  lat: number;
  lng: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  turmas: number;
  instituicoes: number;
}

// ─── Ranking de Cursos ──────────────────────
export interface DadosCurso {
  nome: string;
  area: string;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  turmas: number;
  mediaPorTurma: number;
  instituicoes: number;
  percentual: number;
  presencial: number;
  ead: number;
  publica: number;
  privada: number;
  publicaPresencial: number;
  publicaEad: number;
  privadaPresencial: number;
  privadaEad: number;
  publicaConc: number;
  privadaConc: number;
  publicaIng: number;
  privadaIng: number;
  publicaPresencialConc: number;
  publicaEadConc: number;
  privadaPresencialConc: number;
  privadaEadConc: number;
  publicaPresencialIng: number;
  publicaEadIng: number;
  privadaPresencialIng: number;
  privadaEadIng: number;
  genero: { feminino: number; masculino: number };
}

// ─── Turmas ─────────────────────────────────
export interface DadosTurma {
  ano: number;
  totalTurmas: number;
  mediaPorTurma: number;
  medianaPorTurma: number;
  turmasPublica: number;
  turmasPrivada: number;
}

// ─── Grupos Educacionais ────────────────────
export interface GrupoEducacional {
  nome: string;
  turmas: number;
  matriculas: number;
  percentual: number;
  tipo: 'privada' | 'publica';
}

// ─── Demografia ─────────────────────────────
export interface DadosDemografia {
  genero: { tipo: string; total: number; percentual: number }[];
}

// ─── Dados da Franquia (territorial) ────────
export interface DadosFranquia {
  franquia: Franquia;
  matriculasLocal: number;
  concluintesLocal: number;
  turmasLocal: number;
  participacaoTerritorio: number;
  gapOportunidade: number;
  carteiraAtual: number;
  comparativoBrasil: {
    matriculasBrasil: number;
    concluintesBrasil: number;
    turmasBrasil: number;
    percentualDoTotal: number;
  };
}

// ─── Dados Consolidados ─────────────────────
export interface DadosAnaliseMercado {
  indicadores: IndicadorCard[];
  evolucaoAlunos: DadosEvolucaoAnual[];
  distribuicaoEstados: DadosEstado[];
  cidadesPorEstado: Record<string, DadosCidade[]>;
  rankingCursos: DadosCurso[];
  instituicoes: DadosInstituicao[];
  demografia: DadosDemografia;
  evolucaoTurmas: DadosTurma[];
  gruposEducacionais: GrupoEducacional[];
  franquias: Franquia[];
  dadosFranquia?: DadosFranquia;
  ultimaAtualizacao: string;
  fonte: string;
}

// ─── Legado (compatibilidade) ───────────────
export type NivelEnsino = 'superior' | 'medio' | 'medicina';

// ─── Market Share & Clientes ────────────────

/** Resumo geral de participação de mercado */
export interface MarketShareResumo {
  mercadoTotalAlunos: number;
  alunosClientes: number;
  participacaoAlunos: number;
  mercadoTotalTurmas: number;
  turmasClientes: number;
  participacaoTurmas: number;
  totalInstituicoes: number;
  instituicoesClientes: number;
  receitaPotencial: number;
  receitaAtual: number;
  gapReceita: number;
  ticketMedio: number;
}

/** Evolução anual do market share */
export interface MarketShareEvolucao {
  ano: number;
  mercadoTotal: number;
  clientesAlunos: number;
  participacao: number;
}

/** Market share por curso/área */
export interface MarketShareCurso {
  nome: string;
  area: string;
  mercadoTotal: number;
  clientesViva: number;
  participacao: number;
  oportunidade: number;
}

/** Market share por município */
export interface MarketShareMunicipio {
  nome: string;
  uf: string;
  mercadoTotal: number;
  clientesViva: number;
  participacao: number;
  oportunidade: number;
  instituicoes: number;
}

/** Market share por instituição */
export interface MarketShareInstituicao {
  nome: string;
  tipo: 'publica' | 'privada';
  municipio: string;
  uf: string;
  totalAlunos: number;
  alunosClientes: number;
  participacao: number;
  cursos: number;
}

/** Comparativo do território vs média nacional */
export interface ComparativoNacional {
  metrica: string;
  valorTerritorio: number;
  valorNacional: number;
  razao: number;
}

/** Dados consolidados da página Market Share */
export interface DadosMarketShare {
  resumo: MarketShareResumo;
  evolucao: MarketShareEvolucao[];
  porCurso: MarketShareCurso[];
  porMunicipio: MarketShareMunicipio[];
  porInstituicao: MarketShareInstituicao[];
  comparativoNacional: ComparativoNacional[];
  topOportunidades: MarketShareCurso[];
}

// ─── Market Share Reestruturado (3 Blocos) ──

/** Comparativo anual: matriculados x mercado total */
export interface ComparativoAnual {
  ano: number;
  matriculados: number;
  mercadoTotal: number;
}

/** Ranking de franquia por market share */
export interface RankingFranquia {
  franquia: string;
  matriculados: number;
  marketShare: number;
}

/** Bloco 1 — Matriculados (carteira ativa) */
export interface BlocoMatriculados {
  totalMatriculados: number;
  totalCarteiraAtiva: number;
  participacao: number;
  comparativoAnual: ComparativoAnual[];
  rankingFranquias: RankingFranquia[];
}

/** Bloco 2 — Turmas (mesma estrutura, sem dados por enquanto) */
export interface BlocoTurmas {
  totalTurmas: number | null;
  totalTurmasCarteira: number | null;
  participacao: number | null;
  comparativoAnual: ComparativoAnual[];
  rankingFranquias: RankingFranquia[];
  semDados: boolean;
}

/** Ranking de instituição no bloco Target */
export interface RankingInstituicaoTarget {
  instituicao: string;
  matriculados: number;
  alunosViva: number;
  participacao: number;
}

/** Ranking franquia no bloco Target */
export interface RankingFranquiaTarget {
  franquia: string;
  alunosTarget: number;
  alunosViva: number;
  participacao: number;
  matriculadosInep?: number;
}

/** Dados de uma visão (aluno ou turma) dentro do bloco Target */
export interface TargetVisao {
  totalMercado: number;
  totalTarget: number;
  totalViva: number;
  participacaoDoTotal: number;
  participacaoDoTarget: number;
  rankingFranquias: RankingFranquiaTarget[];
  rankingInstituicoes: RankingInstituicaoTarget[];
  semDados?: boolean;
}

/** Bloco 3 — Target (somente Medicina) */
export interface BlocoTarget {
  curso: string;
  /** @deprecated Use alunos.totalMercado */
  totalAlunos: number;
  /** @deprecated Use alunos.totalTarget */
  totalAlunosTarget: number;
  /** @deprecated Use alunos.totalViva */
  totalAlunosViva: number;
  /** @deprecated Use alunos.participacaoDoTotal */
  participacaoDoTotal: number;
  /** @deprecated Use alunos.participacaoDoTarget */
  participacaoDoTarget: number;
  /** @deprecated Use alunos.rankingFranquias */
  rankingFranquias: RankingFranquiaTarget[];
  /** @deprecated Use alunos.rankingInstituicoes */
  rankingInstituicoes: RankingInstituicaoTarget[];
  /** Visão por alunos */
  alunos: TargetVisao;
  /** Visão por turmas */
  turmas: TargetVisao;
}

/** Dados consolidados da página Market Share reestruturada */
export interface DadosMarketShareV2 {
  matriculados: BlocoMatriculados;
  turmas: BlocoTurmas;
  target: BlocoTarget;
}
