/**
 * Configuração central da aplicação
 * IDs de planilhas, chaves de API e constantes globais
 * 
 * ⚠️ VALORES SENSÍVEIS: Configurados via variáveis de ambiente (.env.local)
 */

// ========== IDs DAS PLANILHAS GOOGLE ==========
export const SPREADSHEET_IDS = {
  // Planilha de Vendas/Adesões
  SALES: process.env.NEXT_PUBLIC_SPREADSHEET_SALES || '',
  
  // Planilha de Metas
  METAS: process.env.NEXT_PUBLIC_SPREADSHEET_METAS || '',
  
  // Planilha do Funil
  FUNIL: process.env.NEXT_PUBLIC_SPREADSHEET_FUNIL || '',
};

// ========== NOMES DAS ABAS ==========
export const SHEET_NAMES = {
  ADESOES: process.env.NEXT_PUBLIC_SHEET_ADESOES || 'ADESOES',
  FUNDOS: process.env.NEXT_PUBLIC_SHEET_FUNDOS || 'FUNDOS',
  METAS: process.env.NEXT_PUBLIC_SHEET_METAS || 'metas',
  FUNIL: process.env.NEXT_PUBLIC_SHEET_FUNIL || 'base',
};

// ========== CHAVE DE API DO GOOGLE ==========
export const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

// ========== CONFIGURAÇÕES DE DISPLAY ==========
export const DISPLAY_CONFIG = {
  // Número máximo de itens em dropdowns
  MAX_DROPDOWN_ITEMS: 100,
  
  // Altura máxima do gráfico
  CHART_HEIGHT: '45vh',
  
  // Formato de moeda
  CURRENCY_LOCALE: 'pt-BR',
  CURRENCY_CODE: 'BRL',
  
  // Formato de data
  DATE_LOCALE: 'pt-BR',
};

// ========== CORES DO DASHBOARD ==========
export const COLORS = {
  // Cores principais
  PRIMARY: '#FF6600',
  PRIMARY_LIGHT: '#ff8a33',
  PRIMARY_DARK: '#e55a00',
  
  // Background
  BG_PRIMARY: '#212529',
  BG_SECONDARY: '#343A40',
  BG_TERTIARY: '#495057',
  
  // Aliases para backgrounds (compatibilidade)
  DARK_PRIMARY: '#212529',
  DARK_SECONDARY: '#343A40',
  DARK_TERTIARY: '#495057',
  
  // Texto
  TEXT_PRIMARY: '#F8F9FA',
  TEXT_SECONDARY: '#ADB5BD',
  TEXT_MUTED: '#6c757d',
  TEXT: '#F8F9FA', // Alias
  CHART_AXIS: '#F8F9FA', // Cor dos eixos dos gráficos (branco)
  
  // Status
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',
  
  // Gradientes para gráficos
  CHART_GRADIENT: {
    SUCCESS: 'linear-gradient(90deg, #51c46a 0%, #28a745 100%)',
    WARNING: 'linear-gradient(90deg, #ff8a33 0%, #FF6600 50%, #e55a00 100%)',
    DANGER: 'linear-gradient(90deg, #ff6b6b 0%, #dc3545 100%)',
  },
};

// ========== CONFIGURAÇÃO DE METAS ==========
export const META_CONFIG = {
  // Multiplicador para Meta Interna (85%)
  META_INTERNA_MULTIPLICADOR: 0.85,
  
  // Labels
  LABELS: {
    SUPER_META: 'Super Meta (100%)',
    META_INTERNA: 'Meta Interna (85%)',
  },
};

// ========== OPÇÕES DE PERÍODO PRÉ-DEFINIDO ==========
export const PERIODO_OPTIONS = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: 'ultimos7dias', label: 'Últimos 7 dias' },
  { value: 'ultimos30dias', label: 'Últimos 30 dias' },
  { value: 'estemes', label: 'Este mês' },
  { value: 'mespassado', label: 'Mês passado' },
  { value: 'esteano', label: 'Este ano' },
  { value: 'esteanoateagora', label: 'Este ano até agora' },
  { value: 'anopassado', label: 'Ano passado' },
];

// ========== PÁGINAS DO DASHBOARD ==========
export const PAGES = [
  { id: 'metas', label: 'Metas e Resultados', icon: '📊' },
  { id: 'indicadores', label: 'Indicadores Secundários', icon: '📈' },
  { id: 'funil', label: 'Funil de Vendas', icon: '🎯' },
] as const;

// ========== FASES DO FUNIL ==========
export const FASES_FUNIL = [
  { id: '1.1', label: 'Lead Novo' },
  { id: '1.2', label: 'Qualificação Comissão' },
  { id: '1.3', label: 'Reunião Agendada' },
  { id: '2.1', label: 'Diagnóstico Realizado' },
  { id: '2.2', label: 'Proposta em Elaboração' },
  { id: '3.1', label: 'Proposta Enviada' },
  { id: '3.2', label: 'Negociação' },
  { id: '3.3', label: 'Fechamento Pendente' },
  { id: '4.1', label: 'Fechamento Comissão' },
  { id: '5.1', label: 'Contrato Fechado' },
];

