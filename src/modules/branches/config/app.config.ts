/**
 * Configuração do módulo de Gerenciamento de Branches
 */

// ========== PLANILHA ==========
export const BRANCHES_SPREADSHEET_ID = process.env.BRANCHES_SPREADSHEET_ID || '1zjb2Z9pvNeJ2I29LPYCT5OVhKNonzze098QrmDH1YLs';
export const BRANCHES_SHEET_NAME = 'BASE';

// ========== COLUNAS DA PLANILHA ==========
// Ordem das colunas na aba BASE:
// A: id
// B: tipo (release | branch)
// C: versao
// D: nome_completo
// E: criado_por (login)
// F: criado_por_nome
// G: modulo
// H: data_criacao
// I: status
// J: link
// K: descricao
// L: release_id (para branches, id da release pai)
// M: aprovado_por (login de quem aprovou)
// N: aprovado_por_nome (nome de quem aprovou)
// O: data_aprovacao (data da aprovação)
// P: entregue_por (login de quem entregou)
// Q: entregue_por_nome (nome de quem entregou)
// R: data_entrega (data da entrega)

export const SHEET_HEADERS = [
  'id',
  'tipo',
  'versao',
  'nome_completo',
  'criado_por',
  'criado_por_nome',
  'modulo',
  'data_criacao',
  'status',
  'link',
  'descricao',
  'release_id',
  'aprovado_por',
  'aprovado_por_nome',
  'data_aprovacao',
  'entregue_por',
  'entregue_por_nome',
  'data_entrega',
];

// ========== CORES ==========
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
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#dc3545',
  INFO: '#3b82f6',
  BACKLOG: '#6b7280',
};

// ========== CACHE ==========
export const CACHE_KEY = 'branches:data';
export const CACHE_TTL = 30 * 1000; // 30 segundos
