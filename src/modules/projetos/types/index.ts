/**
 * Tipos do módulo Painel Gerencial de Projetos
 */

// Status possíveis de um projeto
export type ProjetoStatus = 'Em Andamento' | 'Concluído' | 'Cancelado' | 'Inativo';

// Situação do projeto (semáforo)
export type ProjetoSituacao = 'verde' | 'amarelo' | 'vermelho';

// Tendência do indicador
export type Tendencia = 'Subir' | 'Descer';

// Interface principal do Projeto
export interface Projeto {
  id: string;
  projeto: string;
  objetivo: string;
  dataInicio: string;
  prazoFinal: string;
  responsavel: string;
  time: string;
  indicador: string;
  tendencia: Tendencia;
  resultadoEsperado: number;
  resultadoAtingido: number;
  percentualAtingimento: number;
  dataAfericao: string;        // Quando terá impacto
  custo: number;
  criadoPor: string;
  dataCriacao: string;
  alteradoPor: string;
  dataAlteracao: string;
  inativadoPor: string;
  dataInativacao: string;
  status: ProjetoStatus;
  // Campos calculados
  progresso: number;
  situacao: ProjetoSituacao;
  esforcoEstimado: string;
  impactoEsperado: string;
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
  custo: number;
}

// Formulário completo
export interface NovoProjetoForm extends NovoProjetoDados, NovoProjetoMetricas {}

// Estatísticas resumo (cards)
export interface ProjetosResumo {
  total: number;
  emAndamento: number;
  concluidos: number;
  cancelados: number;
  inativos: number;
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

// Usuários autorizados a acessar o Painel de Projetos (em validação)
export const PROJETOS_AUTHORIZED_USERNAMES = [
  'vitor',
  'cris',
  'gabriel.braz',
  'marcos.castro',
  'reis.igor',
  'theo.diniz'
];
