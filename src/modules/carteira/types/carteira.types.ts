/**
 * Tipos para dados do módulo Carteira
 * Baseado na aba HISTORICO da planilha de carteira (ver CARTEIRA_SHEET_ID no .env.local)
 */

// Dados de uma linha do histórico de carteira
export interface CarteiraRow {
  data: Date;
  mesAno: string; // YYYY-MM
  fundo: string;
  idFundo: string;
  franquia: string;
  instituicao: string;
  curso: string;
  tipoServico: string;
  
  // Métricas MAC (Meta de Arrecadação Conjunta)
  macRealizado: number;
  macMeta: number;
  macAtingimento: number;
  tatAtual: number; // TAT atual (coluna AD)
  
  // Integrantes
  alunosAtivos: number; // integrantes_ativos
  alunosAderidos: number;
  alunosEventoPrincipal: number; // aderidos_principal (coluna Y)
  
  // Inadimplência
  integrantesInadimplentes: number; // total_inadimplentes (coluna U)
  nuncaPagaram: number; // nunca_pagaram (coluna V)
  valorInadimplencia: number;
  
  // Baile
  baileARealizar: string; // baile_a_realizar (coluna W) - "REALIZAR" ou outro
  dataBaile: Date | null; // data do baile para cálculo de saúde
  
  // Status
  status: string;
  situacao: string;
}

// KPIs principais da carteira
export interface KPIsCarteira {
  atingimentoMAC: {
    realizado: number;
    meta: number;
    percentual: number;
  };
  fundosAtivos: number;
  alunosAtivos: number;
  alunosEventoPrincipal: number;
  integrantesInadimplentes: number;
  nuncaPagaram: number;
  tatAtual: number; // TAT total
  // Fundos por saúde
  fundosPorSaude: {
    critico: number;
    atencao: number;
    quaseLa: number;
    alcancada: number;
  };
}

// Status de saúde do fundo
export type SaudeFundo = 'Crítico' | 'Atenção' | 'Quase lá' | 'Alcançada';

// Dados agrupados por fundo
export interface DadosPorFundo {
  fundo: string;
  idFundo: string;
  franquia: string;
  instituicao: string;
  curso: string;
  tipoServico: string;
  macRealizado: number;
  macMeta: number;
  tatAtual: number;
  atingimento: number;
  alunosAtivos: number;
  alunosAderidos: number;
  alunosEventoPrincipal: number;
  inadimplentes: number;
  nuncaPagaram: number;
  status: string;
  dataBaile: Date | null;
  baileARealizar: string;
  saude: SaudeFundo;
  // Consultores
  consultorRelacionamento: string;
  consultorAtendimento: string;
  consultorProducao: string;
}

// Dados agrupados por franquia
export interface DadosPorFranquia {
  franquia: string;
  totalFundos: number;
  macRealizado: number;
  macMeta: number;
  tatAtual: number;
  atingimento: number;
  alunosAtivos: number;
  alunosEventoPrincipal: number;
  inadimplentes: number;
  nuncaPagaram: number;
}

// Dados para gráfico de evolução histórica
export interface DadosHistorico {
  periodo: string; // YYYY-MM ou nome do mês
  macRealizado: number;
  macMeta: number;
  atingimento: number;
  alunosAtivos: number;
  fundosAtivos: number;
}

// Estado dos filtros da carteira
export interface FiltrosCarteira {
  periodoSelecionado: string;
  dataInicio: string;
  dataFim: string;
  unidades: string[];
  consultorRelacionamento: string[];
  consultorAtendimento: string[];
  consultorProducao: string[];
  cursos: string[];
  fundos: string[];
  saude: SaudeFundo[];
}

// Opções disponíveis para filtros
export interface FiltrosCarteiraOpcoes {
  unidades: string[];
  consultoresRelacionamento: string[];
  consultoresAtendimento: string[];
  consultoresProducao: string[];
  cursos: string[];
  fundos: string[];
  saudeOpcoes: SaudeFundo[];
}

// Resposta da API de carteira
export interface CarteiraApiResponse {
  kpis: KPIsCarteira;
  dadosPorFundo: DadosPorFundo[];
  dadosPorFranquia: DadosPorFranquia[];
  historico: DadosHistorico[];
  filtrosOpcoes: FiltrosCarteiraOpcoes;
  lastUpdate: string;
}

// Página ativa na navegação
export type PaginaCarteiraAtiva = 'analises' | 'historico';
