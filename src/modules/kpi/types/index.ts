/**
 * Tipos do módulo KPI - Exatamente igual ao kpi_refatorado
 */

// Tipos para KPIs
export interface KpiData {
  competencia: string;
  time: string;
  kpi: string;
  meta: number;
  resultado: number | null;
  percentual: number;
  grandeza: string;
  tendencia: string;
  tipo: string;
}

// Tipos para Team
export interface TeamLogo {
  [key: string]: string;
}

// Tipos para filtros
export interface FilterState {
  team: string;
  quarter: string;
  objetivo: string;
}

// Tipo para gráficos KPI
export interface KpiChartData {
  labels: string[];
  metas: number[];
  resultados: (number | null)[];
  percentuais: number[];
  grandezas: string[];
  tendencias: string[];
  tipos: string[];
}

// Tipo para métricas calculadas
export interface KpiMetrics {
  ultimoResultado: number | null;
  melhorValor: number | null;
  melhorMes: string;
  mediaAtingimento: number;
  resultadoAno: number;
}

// Resposta da API
export interface KpiApiResponse {
  success: boolean;
  data: KpiData[];
  error?: string;
  cached?: boolean;
  timestamp?: string;
}

// Props de componentes
export interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
  selectedYear: string;
  onYearSelect: (year: string) => void;
  teams: string[];
  years: string[];
}
