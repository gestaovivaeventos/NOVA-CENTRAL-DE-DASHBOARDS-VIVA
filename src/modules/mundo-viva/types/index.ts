// ============================================
// Módulo Mundo Viva (TEMPORÁRIO) - Tipos
// ============================================

export interface Ferramenta {
  time: string;
  nome: string;
  finalidade: string;
  link: string;
  frequencia: string;
  acesso: string;
  obs: string;
  categoria: string;
  destino: string;
}

export interface MenuCategory {
  id: string;
  label: string;
  icon: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  label: string;
  items: Ferramenta[];
}

export type TimeKey = 
  | 'VENDAS'
  | 'RELACIONAMENTO'
  | 'ATENDIMENTO'
  | 'PRODUÇÃO'
  | 'PERFORMANCE'
  | 'GP'
  | 'ADMINISTRATIVO';

export type CategoriaKey =
  | 'DASHBOARDS'
  | 'FERRAMENTAS (GESTÃO PROCESSO)'
  | 'FERRAMENTAS (OPERACIONAL)'
  | 'FERRAMENTAS (SISTEMA)'
  | 'FERRAMENTAS (ABRIR CHAMADO)'
  | 'FERRAMENTAS (ATENDIMENTO ALUNO)'
  | 'DOCUMENTOS PADRÕES'
  | 'INSTRUÇÕES DE TRABALHO (TREINAMENTO)'
  | 'INSTRUÇÕES DE TRABALHO (MATERIAIS DE APOIO)';

export type DestinoKey =
  | 'PIPEFY'
  | 'GOOGLE DRIVE'
  | 'CENTRAL DE DASHBOARDS'
  | 'MUNDO VIVA / WEB APP'
  | 'SULTS'
  | 'HUGGY'
  | 'VIVA ACADEMY'
  | 'AVALIAR MANUALMENTE';
