/**
 * Tipos do módulo Painel Gerencial de Projetos
 */

// Status possíveis de um projeto
export type ProjetoStatus = 'Em Andamento' | 'Passado' | 'Finalizado' | 'Cancelado' | 'Inativo';

// Situação do projeto (semáforo)
export type ProjetoSituacao = 'verde' | 'amarelo' | 'vermelho';

// Tendência do indicador
export type Tendencia = 'Subir' | 'Descer' | 'Manter';

// Interface principal do Projeto
export interface Projeto {
  id: string;
  criadoPor: string;
  time: string;
  responsavel: string;
  projeto: string;
  dataInicio: string;
  prazoFinal: string;
  indicador: string;
  objetivo: string;
  esforcoEstimado: string;
  dataAfericao: string;
  resultadoEsperado: number;
  resultadoAtingido: number;
  percentualAtingimento: number;
  progresso: number;
  situacao: ProjetoSituacao;
  status: ProjetoStatus;
  tendencia: Tendencia;
  impactoEsperado: string;
  custo: number;
}

// Formulário de novo projeto - Seção 1: Dados do Projeto
export interface NovoProjetoDados {
  projeto: string;
  objetivo: string;
  dataInicio: string;
  dataFim: string;
  time: string;
  responsavel: string;
}

// Formulário de novo projeto - Seção 2: Resultados e Métricas
export interface NovoProjetoMetricas {
  indicador: string;
  tendencia: Tendencia;
  resultadoEsperado: number;
  impactoEsperado: string;
  custo: number;
}

// Formulário completo
export interface NovoProjetoForm extends NovoProjetoDados, NovoProjetoMetricas {}

// Estatísticas resumo (cards)
export interface ProjetosResumo {
  total: number;
  emAndamento: number;
  passados: number;
  finalizados: number;
  cancelados: number;
}

// Dados do dashboard
export interface ProjetosDashboardData {
  projetos: Projeto[];
  resumo: ProjetosResumo;
  times: string[];
  responsaveis: string[];
  indicadores: string[];
  ultimaAtualizacao: string;
}

// Resposta da API
export interface ProjetosApiResponse {
  success: boolean;
  data: ProjetosDashboardData | null;
  error?: string;
  cached?: boolean;
  timestamp?: string;
}

// Props do Sidebar
export interface ProjetosSidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  children?: React.ReactNode;
}

// Estado dos filtros
export interface ProjetosFiltros {
  status: ProjetoStatus | 'Todos';
  time: string;
  responsavel: string;
  busca: string;
}
