'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  AuthState,
  AuthAction,
  AuthContextType,
  LoginCredentials,
  User,
  AccessLevel,
} from '@/types/auth.types';

// ============================================
// Estado Inicial
// ============================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // true inicial para verificar sessão
  error: null,
};

// ============================================
// Reducer
// ============================================

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// ============================================
// Contexto
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Constantes
// ============================================

// Tempo de expiração por inatividade: 10 horas em milissegundos
const SESSION_TIMEOUT_MS = 10 * 60 * 60 * 1000; // 10 horas

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Função para atualizar timestamp de última atividade
  const updateLastActivity = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_last_activity', Date.now().toString());
    }
  }, []);

  // Verificar se a sessão expirou por inatividade
  const isSessionExpired = useCallback((): boolean => {
    const lastActivity = localStorage.getItem('auth_last_activity');
    if (!lastActivity) return false; // Se não há registro, não expirou
    
    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    const elapsed = now - lastActivityTime;
    
    return elapsed > SESSION_TIMEOUT_MS;
  }, []);

  // Restaurar sessão do localStorage ao montar
  useEffect(() => {
    const restoreSession = () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          // Verificar se a sessão expirou por inatividade
          if (isSessionExpired()) {
            console.log('Sessão expirada por inatividade (10 horas)');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_last_activity');
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }

          const user: User = JSON.parse(storedUser);
          // Atualizar timestamp de atividade ao restaurar sessão
          updateLastActivity();
          dispatch({
            type: 'RESTORE_SESSION',
            payload: { user, token: storedToken },
          });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_last_activity');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    restoreSession();
  }, [isSessionExpired, updateLastActivity]);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        // Salvar no localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        // Registrar timestamp de atividade no login
        updateLastActivity();

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: data.user, token: data.token },
        });

        return true;
      } else {
        dispatch({
          type: 'LOGIN_ERROR',
          payload: data.message || 'Credenciais inválidas',
        });
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      dispatch({
        type: 'LOGIN_ERROR',
        payload: 'Erro de conexão. Tente novamente.',
      });
      return false;
    }
  }, [updateLastActivity]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_last_activity');
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Atualizar atividade ao navegar/interagir (apenas quando autenticado)
  useEffect(() => {
    if (!state.isAuthenticated) return;

    // Atualizar atividade em eventos de navegação e interação
    const handleActivity = () => {
      updateLastActivity();
    };

    // Eventos que indicam atividade do usuário
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', handleActivity);
    
    // Atualizar também periodicamente a cada 5 minutos se houver atividade
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        updateLastActivity();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [state.isAuthenticated, updateLastActivity]);

  // Limpar erro
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Verificar autorização
  const isAuthorized = useCallback(
    (requiredLevel?: AccessLevel, requiredModules?: string[]): boolean => {
      if (!state.user) return false;

      // Super admin tem acesso total
      if (state.user.accessLevel === 22) return true;

      // Verificar nível de acesso
      if (requiredLevel !== undefined && state.user.accessLevel < requiredLevel) {
        return false;
      }

      // Verificar módulos permitidos
      if (requiredModules && requiredModules.length > 0) {
        const userModules = state.user.modules || [];
        const hasRequiredModules = requiredModules.every((mod) =>
          userModules.includes(mod)
        );
        if (!hasRequiredModules) return false;
      }

      return true;
    },
    [state.user]
  );

  // Verificar acesso a unidade específica
  const hasAccessToUnit = useCallback(
    (unitName: string): boolean => {
      if (!state.user) return false;

      // Franqueadora (1) ou Super Admin (22) tem acesso a todas
      if (state.user.accessLevel >= 1) return true;

      // Franqueado (0) só tem acesso às suas unidades
      const userUnits = state.user.unitNames || [];
      return userUnits.includes(unitName);
    },
    [state.user]
  );

  // Valor do contexto
  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    isAuthorized,
    hasAccessToUnit,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook useAuth
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}

// ============================================
// Export default
// ============================================

export default AuthContext;
