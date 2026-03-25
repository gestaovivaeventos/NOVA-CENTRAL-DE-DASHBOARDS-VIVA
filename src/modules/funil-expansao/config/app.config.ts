/**
 * Configuração central do módulo Funil de Expansão
 * ⚠️ VALORES SENSÍVEIS: Configurados via variáveis de ambiente (.env.local)
 */

// ========== CORES DO DASHBOARD ==========
export const COLORS = {
  PRIMARY: '#FF6600',
  PRIMARY_LIGHT: '#ff8a33',
  PRIMARY_DARK: '#e55a00',

  BG_PRIMARY: '#212529',
  BG_SECONDARY: '#343A40',
  BG_TERTIARY: '#495057',

  TEXT_PRIMARY: '#F8F9FA',
  TEXT_SECONDARY: '#ADB5BD',
  TEXT_MUTED: '#6c757d',

  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',

  // Cores para os funis
  FUNIL_TRATAMENTO: '#60a5fa',
  FUNIL_INVESTIDOR: '#a78bfa',
  FUNIL_OPERADOR: '#34d399',

  // Gradientes para gráficos de barras
  CHART: [
    '#FF6600', '#ff8a33', '#ffc107', '#28a745', '#17a2b8',
    '#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#facc15',
  ],
};

// ========== PÁGINAS DO DASHBOARD ==========
export const PAGES = [
  { id: 'indicadores', label: 'Indicadores Principais', icon: '📊' },
  { id: 'operacionais', label: 'Indicadores Operacionais', icon: '📈' },
  { id: 'composicao', label: 'Indicadores Composição', icon: '🗺️' },
  { id: 'campanhas', label: 'Indicadores de Campanhas', icon: '📣' },
] as const;

// ========== ETAPAS DO FUNIL ==========
// Etapas extraídas da planilha "Etapa do lead" (sem prefixo número e sufixo [tag])
// Ex: "3 | DIAGNÓSTICO AGENDADO [LEAD]" → "DIAGNÓSTICO AGENDADO"
// Ex: "9 | AGUARDANDO COMPOSIÇÃO [NUTRIÇÃO - INVESTIDOR]" → "AGUARDANDO COMPOSIÇÃO"

export const ETAPAS_TRATAMENTO = [
  'POTENCIAIS',
  'NOVO LEAD',
  'EM QUALIFICAÇÃO',
  'DIAGNÓSTICO AGENDADO',
];

export const ETAPAS_QUALIFICADO = [
  'DIAGNÓSTICO REALIZADO',
  'MODELO NEGÓCIO AGENDADO',
  'MODELO NEGÓCIO REALIZADO',
  'FIT FRANQUEADO',
  'COF E VALIDAÇÕES FINAIS',
  'AGUARDANDO COMPOSIÇÃO',
  'CANDIDATO APROVADO',
];

// Etapas que definem MQL (somente fases 5 e 6)
export const ETAPAS_MQL = [
  'DIAGNÓSTICO REALIZADO',
  'MODELO NEGÓCIO AGENDADO',
  'MODELO NEGÓCIO REALIZADO',
];

// ========== DISPLAY ==========
export const DISPLAY_CONFIG = {
  CURRENCY_LOCALE: 'pt-BR',
  DATE_LOCALE: 'pt-BR',
};
