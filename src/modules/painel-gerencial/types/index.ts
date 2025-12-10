/**
 * Tipos do módulo Painel Gerencial
 */

// Dados de KPI para o painel gerencial
export interface GerencialKpiData {
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
  // Aliases para compatibilidade com componentes
  nome?: string;
  equipe?: string;
  realizado?: number;
  percentual?: number;
  unidade?: string;
}

// Dados de OKR para o painel gerencial
export interface GerencialOkrData {
  objective: string;
  indicator: string;
  meta: string;
  realizado: string;
  atingimento: number;
  data: string;
}

// Dados de OKR processados para exibição
export interface ProcessedOkrData {
  equipe: string;
  objetivo: string;
  keyResult: string;
  meta: number;
  realizado: number;
  percentual: number;
  trimestre: string;
}

// Performance por time
export interface TeamPerformance {
  time: string;
  mediaKpis: number | null;
  mediaOkrs: number | null;
  mediaGeral: number;
  totalIndicadores: number;
  // Aliases para compatibilidade com componentes
  equipe?: string;
  totalKpis?: number;
  kpisNaMeta?: number;
  kpisAbaixoMeta?: number;
  mediaPercentual?: number;
}

// Dados de EBITDA por ano
export interface EbitdaYearData {
  year: number;
  meta: number;
  resultado: number;
  metasReal: number;
}

// KPIs que precisam de atenção
export interface KpiAtencao {
  indicador: string;
  time: string;
  meta: number;
  realizado: number;
  percentual: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  responsavel?: string;
  planoAcao?: string;
}

// Dados do dashboard
export interface DashboardData {
  okrs: GerencialOkrData[];
  kpisAtencao: KpiAtencao[];
  teamPerformance: TeamPerformance[];
  ebitdaByYear: EbitdaYearData[];
  competencias: string[];
  ultimaAtualizacao: string;
}

// Resposta da API
export interface GerencialApiResponse {
  success: boolean;
  data: DashboardData | null;
  error?: string;
  cached?: boolean;
  timestamp?: string;
}
