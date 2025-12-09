// ============================================
// Tipos de Autenticação - Projeto Central
// ============================================

/**
 * Níveis de acesso do usuário
 * 0 = Franqueado (acesso restrito às suas unidades)
 * 1 = Franqueadora (acesso completo a todas as unidades)
 * 22 = Super Admin (acesso total ao sistema)
 */
export type AccessLevel = 0 | 1 | 22;

/**
 * Dados do usuário autenticado
 */
export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName?: string;
  email?: string;
  accessLevel: AccessLevel;
  unitNames?: string[];
  modules?: string[];
  createdAt?: string;
}

/**
 * Credenciais de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Resposta da API de login
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

/**
 * Estado do contexto de autenticação
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Ações do reducer de autenticação
 */
export type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } }
  | { type: 'CLEAR_ERROR' };

/**
 * Contexto de autenticação exportado
 */
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isAuthorized: (requiredLevel?: AccessLevel, requiredModules?: string[]) => boolean;
  hasAccessToUnit: (unitName: string) => boolean;
}

/**
 * Permissões do usuário (compatibilidade com Novo Pex)
 */
export interface UserPermissions {
  accessLevel: AccessLevel;
  unitNames?: string[];
}
