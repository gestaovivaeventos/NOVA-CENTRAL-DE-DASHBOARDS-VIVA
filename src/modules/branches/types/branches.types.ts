/**
 * Tipos do módulo de Gerenciamento de Branches
 */

// ============ Status Kanban ============
export type KanbanStatus = 'em-desenvolvimento' | 'em-revisao' | 'aprovada' | 'concluida' | 'descartada';

export interface KanbanColumn {
  id: KanbanStatus;
  label: string;
  color: string;
}

export const KANBAN_COLUMNS_RELEASE: KanbanColumn[] = [
  { id: 'em-desenvolvimento', label: 'Em Desenvolvimento', color: '#3b82f6' },
  { id: 'em-revisao', label: 'Em Revisão', color: '#f59e0b' },
  { id: 'aprovada', label: 'Aprovada', color: '#8b5cf6' },
  { id: 'concluida', label: 'Entregue em produção', color: '#10b981' },
  { id: 'descartada', label: 'Descartada', color: '#ef4444' },
];

export const KANBAN_COLUMNS_BRANCH: KanbanColumn[] = [
  { id: 'em-desenvolvimento', label: 'Em Desenvolvimento', color: '#3b82f6' },
  { id: 'em-revisao', label: 'Em Revisão', color: '#f59e0b' },
  { id: 'aprovada', label: 'Aprovada', color: '#8b5cf6' },
  { id: 'concluida', label: 'Entregue release', color: '#10b981' },
  { id: 'descartada', label: 'Descartada', color: '#ef4444' },
];

// Compat: usado onde não importa o contexto (release vs branch)
export const KANBAN_COLUMNS = KANBAN_COLUMNS_RELEASE;

// ============ Release ============
export interface Release {
  id: string;
  tipo: 'release';
  versao: number;
  nomeCompleto: string;
  criadoPor: string;
  criadoPorNome: string;
  dataCriacao: string;
  status: KanbanStatus;
  linkVercel: string;
  descricao: string;
  ramificacoes: string[];
  aprovadoPor: string;
  aprovadoPorNome: string;
  dataAprovacao: string;
  entreguePor: string;
  entreguePorNome: string;
  dataEntrega: string;
}

// ============ Branch (Ramificação) ============
export interface Branch {
  id: string;
  tipo: 'branch';
  releaseId: string; // ID da release pai
  releaseVersao: number; // de qual release veio
  nomeCompleto: string; // gabriel.braz_release_v1/vendas/18.02.2026
  criadoPor: string; // login do usuário
  criadoPorNome: string;
  modulo: string; // módulo trabalhado
  dataCriacao: string;
  status: KanbanStatus;
  linkBranch: string;
  descricao: string;
  aprovadoPor: string;
  aprovadoPorNome: string;
  dataAprovacao: string;
  entreguePor: string;
  entreguePorNome: string;
  dataEntrega: string;
}

// ============ Row da planilha (unificado) ============
export interface BranchSheetRow {
  id: string;
  tipo: 'release' | 'branch';
  versao: string;
  nomeCompleto: string;
  criadoPor: string;
  criadoPorNome: string;
  modulo: string;
  dataCriacao: string;
  status: KanbanStatus;
  linkVercelOuBranch: string;
  descricao: string;
  releaseId: string; // vazio se for release
  aprovadoPor: string;
  aprovadoPorNome: string;
  dataAprovacao: string;
  entreguePor: string;
  entreguePorNome: string;
  dataEntrega: string;
}

// ============ Módulos disponíveis ============
export const MODULOS_CENTRAL = [
  'carteira',
  'central',
  'fluxo-projetado',
  'gestao-rede',
  'kpi',
  'okr',
  'painel-gerencial',
  'pex',
  'vendas',
  'branches',
] as const;

export type ModuloCentral = typeof MODULOS_CENTRAL[number];

// ============ Usuários autorizados (por username) ============
export const AUTHORIZED_USERNAMES = ['cris', 'gabriel.braz', 'marcos.castro', 'theo.diniz'];

export const AUTHORIZED_USERS = [
  { id: '38793', nome: 'Cristiane Braga', username: 'cris' },
  { id: '96998', nome: 'Gabriel Braz', username: 'gabriel.braz' },
  { id: '118535', nome: 'Marcos Antônio de Castro', username: 'marcos.castro' },
  { id: '253151', nome: 'Theo de Paula Diniz', username: 'theo.diniz' },
];
