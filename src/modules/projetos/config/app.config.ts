/**
 * Configurações do módulo Painel Gerencial de Projetos
 */

// Cores do sistema (consistente com painel-gerencial)
export const COLORS = {
  primary: '#FF6600',
  primaryLight: '#FF8533',
  primaryDark: '#CC5200',
  success: '#22C55E',
  warning: '#EAB308',
  danger: '#EF4444',
  info: '#3B82F6',
  background: '#0F172A',
  backgroundLight: '#1E293B',
  surface: '#334155',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#475569',
};

// Cores de status do projeto
export const STATUS_COLORS = {
  verde: COLORS.success,
  amarelo: COLORS.warning,
  vermelho: COLORS.danger,
};

// Cores dos cards de resumo
export const CARD_COLORS = {
  total: { bg: 'rgba(59, 130, 246, 0.15)', border: '#3B82F6', icon: '📊' },
  emAndamento: { bg: 'rgba(255, 102, 0, 0.15)', border: '#FF6600', icon: '🔄' },
  concluidos: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22C55E', icon: '✅' },
  cancelados: { bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444', icon: '❌' },
  inativos: { bg: 'rgba(107, 114, 128, 0.15)', border: '#6B7280', icon: '🚫' },
};

// Opções de times
export const TIMES_OPTIONS = [
  'ATENDIMENTO',
  'CONSULTORIA',
  'EXPANSÃO',
  'FEAT | GROWTH',
  'FORNECEDORES',
  'GESTÃO',
  'GP',
  'INOVAÇÃO',
  'MARKETING',
  'MARKETING E GROWTH',
  'PÓS VENDA',
  'QUOKKA',
  'TI',
  'PERFORMANCE',
];

// Opções de indicadores
export const INDICADORES_OPTIONS = [
  'NPS',
  'EBITDA',
  'Churn',
  'Receita',
  'Satisfação',
  'Produtividade',
  'Qualidade',
  'Engajamento',
  'Conversão',
  'Retenção',
];

// Opções de tendência
export const TENDENCIA_OPTIONS = [
  { value: 'Subir', label: '📈 Subir' },
  { value: 'Descer', label: '📉 Descer' },
];

// Configurações de layout
export const LAYOUT_CONFIG = {
  SIDEBAR_WIDTH_EXPANDED: 300,
  SIDEBAR_WIDTH_COLLAPSED: 60,
};
