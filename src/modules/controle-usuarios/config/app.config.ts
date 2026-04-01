/**
 * Configuração do módulo Controle de Usuários e Senhas
 */

// ========== CORES (padrão vendas) ==========
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
};

// ========== CACHE ==========
export const CACHE_KEY = 'controle-usuarios:data';
export const CACHE_TTL = 60 * 1000; // 1 minuto

// ========== COLUNAS DA TABELA ==========
export const TABLE_COLUMNS = [
  { key: 'unidadePrincipal' as const, title: 'Unidade Principal' },
  { key: 'nome' as const, title: 'Nome' },
  { key: 'username' as const, title: 'Username (Login)', highlight: true },
  { key: 'enabled' as const, title: 'Status' },
  { key: 'nmGrupo' as const, title: 'Grupo / Cargo' },
  { key: 'senhaHash' as const, title: 'Senha Hash' },
  { key: 'tokenResetAdmin' as const, title: 'Token Redefinição de Senha', highlight: true },
  { key: 'tokenPrimeiraSenha' as const, title: 'Token Primeira Senha', highlight: true },
];
