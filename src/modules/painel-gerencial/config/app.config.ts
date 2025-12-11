/**
 * Configurações do módulo Painel Gerencial
 */

export const API_CONFIG = {
  SPREADSHEET_ID: '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs',
  API_KEY: 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs',
  SHEETS: {
    KPIS: 'KPIS!A:AD', // Inclui colunas FCA até REALIZADO
    OKRS: 'OKRS VC',
    PAINEL_OKR: 'NOVO PAINEL OKR'
  }
};

export const gerencialConfig = {
  // ID da planilha
  spreadsheetId: '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs',
  
  // Abas da planilha
  sheets: {
    KPIS: 'KPIS',
    OKRS: 'OKRS VC',
    PAINEL_OKR: 'NOVO PAINEL OKR',
  },

  // Cache TTL em segundos
  cacheTTL: 600, // 10 minutos
};

// Cores do sistema
export const COLORS = {
  primary: '#FF6600',
  primaryLight: '#FF8533',
  primaryDark: '#CC5200',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  background: '#0F172A',
  backgroundLight: '#1E293B',
  surface: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#475569',
};

// Cores de status
export const STATUS_COLORS = {
  verde: COLORS.success,
  amarelo: COLORS.warning,
  vermelho: COLORS.danger,
};

// Trimestres
export const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];

// Meses
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril',
  'Maio', 'Junho', 'Julho', 'Agosto',
  'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Meses por trimestre
export const MESES_POR_TRIMESTRE: Record<string, string[]> = {
  T1: ['Janeiro', 'Fevereiro', 'Março'],
  T2: ['Abril', 'Maio', 'Junho'],
  T3: ['Julho', 'Agosto', 'Setembro'],
  T4: ['Outubro', 'Novembro', 'Dezembro'],
};
