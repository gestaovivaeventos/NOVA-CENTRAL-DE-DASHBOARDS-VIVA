// ============================================
// Tipos — Módulo Análise de Mercado (Reestruturado)
// ============================================

// ─── Filtros ──────────────────────────────────
export type TipoInstituicao = 'todos' | 'publica' | 'privada';
export type VisaoAtiva = 'alunos' | 'turmas';

export interface FiltrosAnaliseMercado {
  ano: number;
  tipoInstituicao: TipoInstituicao;
  franquiaId: string | null;
  estado: string | null;
  areaConhecimento: string | null;
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
  variacao: number;
  tendencia: 'up' | 'down' | 'stable';
  cor: string;
  subtitulo?: string;
  comparativoBrasil?: number;
}

// ─── Evolução Histórica ─────────────────────
export interface DadosEvolucaoAnual {
  ano: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  presencial: number;
  ead: number;
  publica: number;
  privada: number;
}

// ─── Distribuição por Estado ────────────────
export interface DadosEstado {
  uf: string;
  nome: string;
  matriculas: number;
  concluintes: number;
  turmas: number;
  instituicoes: number;
  percentual: number;
}

// ─── Ranking de Cursos ──────────────────────
export interface DadosCurso {
  nome: string;
  area: string;
  matriculas: number;
  concluintes: number;
  turmas: number;
  percentual: number;
}

// ─── Turmas ─────────────────────────────────
export interface DadosTurma {
  ano: number;
  totalTurmas: number;
  mediaPorTurma: number;
  medianaPorTurma: number;
  turmasPresencial: number;
  turmasEad: number;
  turmasPublica: number;
  turmasPrivada: number;
}

export interface TurmaPorSemestre {
  periodo: string;
  total: number;
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
  faixaEtaria: { faixa: string; total: number; percentual: number }[];
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
  rankingCursos: DadosCurso[];
  demografia: DadosDemografia;
  evolucaoTurmas: DadosTurma[];
  turmasPorSemestre: TurmaPorSemestre[];
  gruposEducacionais: GrupoEducacional[];
  franquias: Franquia[];
  dadosFranquia?: DadosFranquia;
  ultimaAtualizacao: string;
  fonte: string;
}

// ─── Legado (compatibilidade) ───────────────
export type NivelEnsino = 'superior' | 'medio' | 'medicina';
