/**
 * Tipos do módulo Painel Gerencial
 * Exatamente igual ao original painel gerencial_refatorado
 */

export interface OkrData {
  objective: string;
  indicator: string;
  meta: string;
  realizado: string;
  atingimento: number;
  data: string;
}

// Tipo simplificado para processamento de OKRs
export interface ProcessedOkrData {
  titulo: any;
  metaAnual: number;
  realizado: number;
  percentual: number;
  status: 'verde' | 'amarelo' | 'vermelho';
}

// Tipo simplificado para processamento de KPIs
export interface ProcessedKpiData {
  indicador: string;
  meta: number;
  realizado: number;
  percentual: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  responsavel: string;
  planoAcao: string;
}

export interface KpiData {
  competencia: string;
  organizacao: string;
  time: string;
  kpi: string;
  meta: number;
  resultado: number;
  metasReal: number | null;
  status: string;
  grandeza: string;
  year: number | null;
  fato?: string;
  causa?: string;
  efeito?: string;
  acao?: string;
  responsavel?: string;
  criadoEm?: string;
  terminoPrevisto?: string;
  fcaRealizado?: string;
}

export interface NovoOkrData {
  data: string;
  time: string;
  indicador: string;
  meta: number;
  realizado: number;
  atingReal: number;
}

export interface EbitdaYearData {
  year: number;
  meta: number;
  resultado: number;
  metasReal: number;
}

export interface TeamPerformance {
  time: string;
  mediaKpis: number | null;
  mediaOkrs: number | null;
  mediaGeral: number;
  totalIndicadores: number;
}

export interface TrimestralData {
  trimestre: string;
  mes: string;
  meta: number;
  realizado: number;
  percentual: number;
  desvio: number;
}

export interface EquipeData {
  membro: string;
  cargo: string;
  metaIndividual: number;
  realizado: number;
  percentual: number;
}

export interface FcaData {
  fato: string;
  causa: string;
  acao: string;
  responsavel: string;
  prazo: string;
  status: string;
}

export interface DashboardData {
  ebitdaByYear: Record<number, EbitdaYearData>;
  okrs: OkrData[];
  kpis: KpiData[];
  novoOkrs: NovoOkrData[];
  competencias: string[];
  selectedCompetencia: string;
  teamPerformance: TeamPerformance[];
  kpisAtencao: KpiData[];
  ultimaAtualizacao: string;
}

export interface FilterState {
  ano: number;
  trimestre: string;
  competencia: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// Resposta da API
export interface GerencialApiResponse {
  success: boolean;
  data: DashboardData | null;
  error?: string;
  cached?: boolean;
  timestamp?: string;
}
