// Tipos para OKRs
export interface OkrData {
  data: Date | null;
  time: string;
  idOkr: string;
  objetivo: string;
  idKr: string;
  indicador: string;
  meta: number | null;
  realizado: number | null;
  atingimento: number | null;
  atingMetaMes: string;
  quarter: string;
  tendencia: string;
  medida: string;
  formaDeMedir: string;
  responsavel: string;
  rowIndex: number;
}

// Tipo de resposta da API de OKR
export interface OkrApiResponse {
  success: boolean;
  data: OkrData[];
  error?: string;
  cached?: boolean;
  timestamp?: string;
}

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

// Help text para modal
export interface HelpText {
  title: string;
  body: string;
}

export interface HelpTexts {
  [key: string]: HelpText;
}

// Contexto de autenticação
export interface UserAccess {
  access: 'ALL_UNITS' | string[] | 'NO_ACCESS';
  level: number | null;
}

// Props de componentes
export interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
  teams: string[];
  activePage: 'okrs' | 'kpis';
  onPageChange: (page: 'okrs' | 'kpis') => void;
}

export interface FilterButtonsProps {
  items: string[];
  activeItem: string;
  onSelect: (item: string) => void;
  className?: string;
}

export interface QuarterFilterProps {
  quarters: string[];
  activeQuarter: string;
  onSelect: (quarter: string) => void;
}

export interface ObjetivoFilterProps {
  objetivos: Map<string, string>;
  activeObjetivo: string;
  onSelect: (objetivo: string) => void;
}
