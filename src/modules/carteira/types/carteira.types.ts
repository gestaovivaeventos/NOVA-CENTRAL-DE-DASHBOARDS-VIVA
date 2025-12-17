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
  
  // Alunos
  alunosAtivos: number;
  alunosAderidos: number;
  alunosEventoPrincipal: number;
  
  // Inadimplência
  integrantesInadimplentes: number;
  valorInadimplencia: number;
  
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
}

// Dados agrupados por fundo
export interface DadosPorFundo {
  fundo: string;
  idFundo: string;
  franquia: string;
  instituicao: string;
  curso: string;
  macRealizado: number;
  macMeta: number;
  atingimento: number;
  alunosAtivos: number;
  alunosAderidos: number;
  inadimplentes: number;
  status: string;
}

// Dados agrupados por franquia
export interface DadosPorFranquia {
  franquia: string;
  totalFundos: number;
  macRealizado: number;
  macMeta: number;
  atingimento: number;
  alunosAtivos: number;
  inadimplentes: number;
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
  fundos: string[];
  consultorRelacionamento: string[];
  consultorAtendimento: string[];
  consultorProducao: string[];
}

// Opções disponíveis para filtros
export interface FiltrosCarteiraOpcoes {
  unidades: string[];
  fundos: string[];
  consultoresRelacionamento: string[];
  consultoresAtendimento: string[];
  consultoresProducao: string[];
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
