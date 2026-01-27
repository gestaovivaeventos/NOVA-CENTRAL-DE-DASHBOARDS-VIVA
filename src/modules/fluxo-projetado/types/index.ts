/**
 * Tipos do Módulo Fluxo Projetado
 * Define as interfaces para projeção de receita de franqueados
 */

// ============================================
// Tipos de Fundo
// ============================================

export interface Fundo {
  id: string;
  nome: string;
  unidade: string;
  dataInicio: string;
  dataFormatura: string;
  valorArrecadacaoPrevisao: number;
  percentualFee: number;
  convitesExtrasVendidos: number;
  margemConviteExtra: number;
  margemFechamento: number;
  status: 'ativo' | 'fechado' | 'cancelado';
  parcelasFeeRecebidas: number; // 0 a 6 (parcelas de 10%)
  feeRecebidoFechamento: boolean; // 40% final
}

// ============================================
// Tipos de Projeção
// ============================================

export interface ProjecaoReceita {
  ano: number;
  mes: number;
  receitaFee: number;
  receitaConviteExtra: number;
  receitaMargemFechamento: number;
  totalProjetado: number;
}

export interface ResumoProjecao {
  // Visão Geral
  receitaTotalProjetada: number;
  receitaProjetadaFee: number;
  receitaProjetadaFeeAntecipacao: number;
  receitaProjetadaFeeFechamento: number;
  receitaProjetadaConviteExtra: number;
  receitaProjetadaMargemFechamento: number;
  
  // Acompanhamento Financeiro
  feeJaRecebido: number;
  feeAReceber: number;
  convitesExtrasVendidos: number;
  margemMediaAplicada: number;
  
  // Operacionais
  fundosAtivos: number;
  fundosFechamentoAnoAtual: number;
}

// ============================================
// Tipos de Filtro
// ============================================

export interface FiltrosFluxoProjetado {
  unidade: string;
  ano: number;
  status: 'todos' | 'ativo' | 'fechado';
}

// ============================================
// Tipos de Cards
// ============================================

export interface KPICardData {
  id: string;
  titulo: string;
  valor: number | string;
  formato: 'moeda' | 'percentual' | 'numero';
  variacao?: number;
  icone?: string;
  cor?: 'verde' | 'laranja' | 'azul' | 'vermelho' | 'roxo';
  descricao?: string;
}

export interface CardGroupData {
  titulo: string;
  cards: KPICardData[];
}

// ============================================
// Tipos de Gráfico
// ============================================

export interface DadosGraficoProjecao {
  mes: string;
  fee: number;
  conviteExtra: number;
  margemFechamento: number;
  total: number;
}
