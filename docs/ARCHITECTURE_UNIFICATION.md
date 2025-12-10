# Arquitetura de Unificação - Projeto Central

## 📋 Índice
1. [Visão Geral da Migração](#visão-geral)
2. [Nova Estrutura de Pastas](#estrutura-de-pastas)
3. [Roadmap de Migração](#roadmap)
4. [Exemplo: Integração do Módulo Novo Pex](#exemplo-novo-pex)
5. [Abstração do Sistema de Autenticação](#autenticação)
6. [Padrões de Comunicação entre Módulos](#padrões-comunicação)
7. [Checklist de Implementação](#checklist)

---

## Visão Geral da Migração

### Objetivo Geral
Consolidar 3 aplicações separadas em uma única aplicação Next.js com arquitetura modular, centralizando:
- **Autenticação** (Login único para todos os dashboards)
- **Roteamento** (Shell unificado coordena os módulos)
- **Estado Global** (Context API para dados compartilhados)
- **Estilos e Temas** (Design system centralizado)

### Arquitetura-Alvo: Micro Front-ends com Shell Pattern
```
┌─────────────────────────────────────────────────────────┐
│            SHELL (Central - Main App)                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Auth Provider (login, token, user context)         │  │
│  │ Router (rota para módulo apropriado)               │  │
│  │ Layout Wrapper (Header, Sidebar, Footer)           │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Módulo PEX  │  │Módulo Vendas │  │Módulo Future │   │
│  │  (Lazy Load) │  │  (Lazy Load) │  │  (Lazy Load) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Tecnologias
- **Framework**: Next.js 14+ (SSR/SSG)
- **UI**: React 18+, Tailwind CSS
- **State**: React Context API + useReducer
- **Type Safety**: TypeScript Strict Mode
- **Auth**: JWT (stored in localStorage, validated server-side)
- **Code Splitting**: Dynamic imports para lazy loading dos módulos

---

## Estrutura de Pastas

### Antes (Atual)
```
Projeto Central/
├── Central/central_dashs_viva_html/          (HTML/JS legado)
├── Novo Pex/novo_pex/                        (React/Next.js ideal)
└── Vendas/dashboard-vendas-html/             (HTML/JS legado)
```

### Depois (Proposto)
```
projeto-central/                              ← Nova root
├── package.json                              (workspaces monorepo OU single repo)
├── .github/
│   └── copilot-instructions.md               (já existente)
├── public/
│   ├── images/
│   │   ├── logo_viva.png
│   │   └── capa_site.png
│   └── icons/
├── src/
│   ├── pages/
│   │   ├── _app.tsx                          (App principal com AuthProvider)
│   │   ├── _document.tsx
│   │   ├── index.tsx                         (Redirect para /dashboard ou /login)
│   │   ├── login.tsx                         (Login centralizado)
│   │   ├── dashboard.tsx                     (Shell - escolhe módulo)
│   │   ├── [module]/
│   │   │   └── [[...slug]].tsx               (Catch-all para rotas dos módulos)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login.ts                  (Auth centralizado)
│   │       │   ├── logout.ts
│   │       │   └── verify.ts
│   │       ├── modules/                      (APIs de controle dos módulos)
│   │       │   └── load-config.ts
│   │       └── [...proxy].ts                 (Proxy para APIs dos módulos)
│   ├── modules/                              ← NOVO: Diretório dos módulos
│   │   ├── pex/
│   │   │   ├── index.ts                      (Barril export)
│   │   │   ├── PexModule.tsx                 (Componente root do módulo)
│   │   │   ├── hooks/
│   │   │   │   ├── usePexData.ts
│   │   │   │   └── useSheetsData.ts
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Ranking.tsx
│   │   │   │   ├── Resultados.tsx
│   │   │   │   ├── Parametros.tsx
│   │   │   │   └── ResetPassword.tsx
│   │   │   ├── components/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── TabelaRanking.tsx
│   │   │   │   └── ...outros
│   │   │   ├── utils/
│   │   │   │   ├── calculosPex.ts
│   │   │   │   ├── formatacao.ts
│   │   │   │   └── validacao.ts
│   │   │   ├── types/
│   │   │   │   └── pex.types.ts
│   │   │   ├── styles/
│   │   │   │   └── pex.module.css
│   │   │   └── README.md
│   │   ├── vendas/
│   │   │   ├── index.ts
│   │   │   ├── VendasModule.tsx
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── styles/
│   │   └── registry.ts                       (Registro central de módulos)
│   ├── context/                              ← NOVO: Context global
│   │   ├── AuthContext.tsx                   (Centraliza autenticação)
│   │   ├── useAuth.ts                        (Hook de auth)
│   │   └── ModuleContext.tsx                 (Contexto de módulos)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Shell.tsx                     (Layout wrapper)
│   │   │   ├── Header.tsx                    (Header global)
│   │   │   ├── Sidebar.tsx                   (Nav global)
│   │   │   └── Footer.tsx
│   │   ├── common/
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── LogoutButton.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                        (Exportado de context)
│   │   ├── useModuleRoute.ts                 (Controla navegação módulos)
│   │   └── useWindowSize.ts
│   ├── utils/
│   │   ├── auth.utils.ts                     (Helpers de autenticação)
│   │   ├── api-client.ts                     (Cliente HTTP centralizado)
│   │   ├── storage.ts                        (localStorage com type-safety)
│   │   └── constants.ts
│   ├── styles/
│   │   ├── globals.css                       (Tailwind + estilos globais)
│   │   ├── theme.css                         (Tema Viva)
│   │   └── animations.css
│   ├── types/
│   │   ├── auth.types.ts                     (Tipos Auth globais)
│   │   ├── modules.types.ts                  (Tipos de módulos)
│   │   └── common.types.ts
│   └── config/
│       ├── modules.config.ts                 (Registro e config de módulos)
│       ├── app.config.ts
│       └── env.ts
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── package-lock.json
├── .env.local.example
├── .eslintrc.json
└── README.md
```

### Mapeamento: Código Antigo → Novo Local
```
novo_pex/src/pages/login.tsx
  → projeto-central/src/pages/login.tsx (refatorado)

novo_pex/src/pages/dashboard.tsx
  → projeto-central/src/modules/pex/pages/Dashboard.tsx

novo_pex/src/pages/ranking.tsx
  → projeto-central/src/modules/pex/pages/Ranking.tsx

novo_pex/src/components/*
  → projeto-central/src/modules/pex/components/*

novo_pex/src/utils/calculosPex.ts
  → projeto-central/src/modules/pex/utils/calculosPex.ts

novo_pex/src/hooks/useSheetsData.ts
  → projeto-central/src/modules/pex/hooks/useSheetsData.ts

dashboard-vendas-html/* (HTML/JS)
  → projeto-central/src/modules/vendas/* (convertido para React)

central_dashs_viva_html/* (HTML/JS)
  → Descontinuado (shell será o novo login/router)
```

---

## Roadmap de Migração

### Fase 1: Preparação da Arquitetura Global (Semana 1)
**Objetivo**: Criar o shell base com autenticação centralizada

- [ ] 1.1 - Criar repositório novo `projeto-central` com estrutura base
- [ ] 1.2 - Configurar `package.json`, `tsconfig.json`, Tailwind, ESLint
- [ ] 1.3 - Criar Context de Autenticação (`AuthContext.tsx`, `useAuth.ts`)
- [ ] 1.4 - Implementar `src/pages/login.tsx` (abstraindo do Novo Pex)
- [ ] 1.5 - Implementar `src/pages/api/auth/login.ts` (com lógica centralizada)
- [ ] 1.6 - Criar `Shell.tsx` (wrapper layout global)
- [ ] 1.7 - Criar `src/pages/_app.tsx` com AuthProvider

**Deliverables**: 
- Login funcionando, usuário autenticado, token em localStorage
- Shell renderizando com placeholder para módulos
- CI/CD pipeline inicial

### Fase 2: Integração do Módulo PEX (Semana 2-3)
**Objetivo**: Mover Novo Pex como módulo encapsulado

- [ ] 2.1 - Criar estrutura `src/modules/pex/*`
- [ ] 2.2 - Mover componentes do Novo Pex (adaptar imports)
- [ ] 2.3 - Criar `PexModule.tsx` (wrapper que encapsula lógica interna)
- [ ] 2.4 - Implementar roteamento interno do PEX (nested routes)
- [ ] 2.5 - Criar `src/pages/[module]/[[...slug]].tsx` (catch-all router)
- [ ] 2.6 - Integrar contexto de auth com permissões do PEX
- [ ] 2.7 - Testes E2E do módulo PEX

**Deliverables**:
- PEX funcionando completamente como módulo
- Roteamento funcionando (`/pex/dashboard`, `/pex/ranking`, etc)
- Permissões respeitadas

### Fase 3: Conversão e Integração do Módulo Vendas (Semana 3-4)
**Objetivo**: Converter Vendas de HTML/JS para React

- [ ] 3.1 - Análise do código Vendas (9832 linhas!)
- [ ] 3.2 - Planejar decomposição em componentes React
- [ ] 3.3 - Criar estrutura `src/modules/vendas/*`
- [ ] 3.4 - Converter componentes HTML → React (em blocos)
- [ ] 3.5 - Migrar lógica JS → TypeScript utils
- [ ] 3.6 - Criar `VendasModule.tsx` wrapper
- [ ] 3.7 - Integrar com autenticação centralizada

**Deliverables**:
- Módulo Vendas funcional como React
- Roteamento funcionando (`/vendas/...`)
- Dados sincronizados com shell

### Fase 4: Limpeza e Deploy (Semana 4-5)
**Objetivo**: Finalizar migração e colocar em produção

- [ ] 4.1 - Remover código legado (Central HTML/JS antigo)
- [ ] 4.2 - Otimizar bundle size (code splitting, lazy loading)
- [ ] 4.3 - Configurar variáveis de ambiente (.env.local)
- [ ] 4.4 - Testes de carga e performance
- [ ] 4.5 - Deploy staging → produção
- [ ] 4.6 - Descomissionar aplicações antigas

**Deliverables**:
- Deploy de produção funcional
- 1 URL para acessar todos os dashboards
- Zero downtime migration

---

## Exemplo: Integração do Módulo Novo PEX

### 1. Context de Autenticação Global

**Arquivo: `src/context/AuthContext.tsx`**
```typescript
'use client';

import React, { createContext, useCallback, useReducer, useEffect } from 'react';

export interface User {
  username: string;
  firstName: string;
  accessLevel: 0 | 1;
  unitNames?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthAction 
  | { type: 'SET_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_SESSION'; payload: { user: User; token: string } };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

export const AuthContext = createContext<{
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthorized: (requiredLevel?: 0 | 1) => boolean;
}>(null!);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'RESTORE_SESSION':
      return {
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      // Limpar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return initialState;
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sessão ao montar
  useEffect(() => {
    const restoreSession = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');

        if (token && userJson) {
          const user = JSON.parse(userJson);
          dispatch({
            type: 'RESTORE_SESSION',
            payload: { user, token },
          });
        } else {
          dispatch({ type: 'SET_LOADING' });
          setTimeout(() => {
            // Simular fim de carregamento
            dispatch({ type: 'LOGOUT' });
          }, 500);
        }
      } catch (err) {
        console.error('Erro ao restaurar sessão:', err);
        dispatch({ type: 'LOGOUT' });
      }
    };

    if (typeof window !== 'undefined') {
      restoreSession();
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Salvar no localStorage e dispatch
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user, token: data.token },
      });
    } catch (error: any) {
      const message = error.message || 'Erro desconhecido';
      dispatch({ type: 'LOGIN_ERROR', payload: message });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const isAuthorized = useCallback(
    (requiredLevel?: 0 | 1): boolean => {
      if (!state.isAuthenticated) return false;
      if (requiredLevel === undefined) return true;
      return state.user?.accessLevel === requiredLevel;
    },
    [state.isAuthenticated, state.user?.accessLevel]
  );

  return (
    <AuthContext.Provider value={{ state, login, logout, isAuthorized }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Arquivo: `src/hooks/useAuth.ts`**
```typescript
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
```

### 2. Shell Layout

**Arquivo: `src/components/layout/Shell.tsx`**
```tsx
'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';

interface ShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function Shell({ children, showSidebar = true }: ShellProps) {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {showSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 3. Login Page (Centralizado)

**Arquivo: `src/pages/login.tsx`**
```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const { login, state } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(username, password);
      // Após login bem-sucedido, redirecionar para dashboard
      router.push('/dashboard');
    } catch (error) {
      // Erro já está em state.error
    }
  };

  return (
    <>
      <Head>
        <title>Login - Projeto Central</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-900" 
           style={{ backgroundImage: 'url(/capa_site.png)', backgroundSize: 'cover' }}>
        <div className="bg-gray-800 p-10 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Central de Dashboards</h1>
          
          {state.error && (
            <div className="bg-red-500 text-white p-3 rounded mb-4">
              {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600"
              disabled={state.loading}
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600"
              disabled={state.loading}
            />
            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
              disabled={state.loading}
            >
              {state.loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
```

### 4. Module Router (Catch-all)

**Arquivo: `src/pages/[module]/[[...slug]].tsx`**
```tsx
'use client';

import React, { Suspense } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import Shell from '@/components/layout/Shell';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { getModuleConfig } from '@/config/modules.config';

// Importar módulos dinamicamente
const PexModule = dynamic(() => import('@/modules/pex').then(m => m.PexModule), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const VendasModule = dynamic(() => import('@/modules/vendas').then(m => m.VendasModule), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const moduleMap: Record<string, React.ComponentType<any>> = {
  pex: PexModule,
  vendas: VendasModule,
};

export default function ModulePage() {
  const router = useRouter();
  const { module = 'pex' } = router.query;
  const { state } = useAuth();
  const slug = Array.isArray(router.query.slug) ? router.query.slug : [];

  if (!state.isAuthenticated) {
    router.push('/login');
    return null;
  }

  const moduleName = Array.isArray(module) ? module[0] : module;
  const ModuleComponent = moduleMap[moduleName];

  if (!ModuleComponent) {
    return (
      <Shell>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-500">Módulo não encontrado: {moduleName}</h1>
          <p className="text-gray-400 mt-2">Módulos disponíveis: pex, vendas</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell showSidebar={true}>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <ModuleComponent slug={slug} />
        </Suspense>
      </ErrorBoundary>
    </Shell>
  );
}
```

### 5. PEX Module Wrapper

**Arquivo: `src/modules/pex/index.ts`**
```typescript
export { PexModule } from './PexModule';
export * from './hooks';
export * from './types';
export * from './utils';
```

**Arquivo: `src/modules/pex/PexModule.tsx`**
```tsx
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import DashboardPage from './pages/Dashboard';
import RankingPage from './pages/Ranking';
import ResultadosPage from './pages/Resultados';
import ParametrosPage from './pages/Parametros';

interface PexModuleProps {
  slug?: string[];
}

export function PexModule({ slug = [] }: PexModuleProps) {
  const router = useRouter();
  const { state, isAuthorized } = useAuth();
  const [page] = slug;

  // Rotas internas do módulo PEX
  const renderPage = useMemo(() => {
    switch (page) {
      case 'ranking':
        return <RankingPage />;
      case 'resultados':
        return <ResultadosPage />;
      case 'parametros':
        if (!isAuthorized(1)) {
          return (
            <div className="p-8 text-center text-red-500">
              <h1 className="text-2xl font-bold">Acesso Negado</h1>
              <p>Apenas franqueadoras podem acessar parâmetros</p>
            </div>
          );
        }
        return <ParametrosPage />;
      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  }, [page, isAuthorized]);

  return (
    <div className="w-full">
      {renderPage}
    </div>
  );
}
```

### 6. App Provider

**Arquivo: `src/pages/_app.tsx`**
```tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
```

### 7. Exemplo de Página PEX Adaptada

**Arquivo: `src/modules/pex/pages/Dashboard.tsx`**
```tsx
'use client';

import React from 'react';
import { useSheetsData } from '../hooks/useSheetsData';
import { useAuth } from '@/hooks/useAuth';
import { filterDataByPermission } from '../utils/permissoes';
import Card from '../components/Card';
import TabelaRanking from '../components/TabelaRanking';

export default function DashboardPage() {
  const { state: authState } = useAuth();
  const { dados, loading, error, refetch } = useSheetsData();

  // Filtrar dados por permissão
  const dadosFiltrados = React.useMemo(() => {
    if (!authState.user) return [];
    return filterDataByPermission(dados, {
      username: authState.user.username,
      firstName: authState.user.firstName,
      accessLevel: authState.user.accessLevel,
      unitNames: authState.user.unitNames,
    });
  }, [dados, authState.user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8 border-red-500">
        <h2 className="text-xl font-bold text-red-600">Erro</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Tentar Novamente
        </button>
      </Card>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard PEX</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <h2 className="text-xl font-bold">Visão Geral</h2>
          <p className="text-gray-600 mt-2">
            Total de franquias: {dadosFiltrados.length}
          </p>
        </Card>
      </div>

      <Card>
        <TabelaRanking dados={dadosFiltrados} />
      </Card>
    </div>
  );
}
```

---

## Abstração do Sistema de Autenticação

### Antes (Espalhado e Duplicado)
```
Novo Pex/src/pages/login.tsx          ← Login hardcoded
Novo Pex/src/pages/api/auth/login.ts  ← Lógica de autenticação
Central HTML/script.js                ← Outra lógica de login
Vendas HTML/script.js                 ← Outra lógica de login
```

### Depois (Centralizado)
```
projeto-central/src/pages/login.tsx
projeto-central/src/pages/api/auth/login.ts      ← Única verdade
projeto-central/src/context/AuthContext.tsx       ← State global
projeto-central/src/hooks/useAuth.ts              ← Hook compartilhado
projeto-central/src/utils/auth.utils.ts           ← Helpers
projeto-central/src/types/auth.types.ts           ← Tipos únicos
```

### Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário acessa /login                                │
│    → Componente LoginForm renderizado                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Usuário submete username + password                  │
│    → POST /api/auth/login                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. API Backend (/api/auth/login.ts)                     │
│    a) Busca credenciais na Google Sheets (CSV export)   │
│    b) Valida username + password (bcryptjs)             │
│    c) Gera JWT token                                    │
│    d) Retorna { token, user: {...} }                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Frontend (LoginForm) recebe resposta                 │
│    a) Chama useAuth().login()                           │
│    b) AuthContext atualiza state                        │
│    c) localStorage.setItem('auth_token', token)         │
│    d) localStorage.setItem('auth_user', user)           │
│    e) Redireciona para /dashboard/pex                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Módulos acessam AuthContext                          │
│    a) const { state } = useAuth()                       │
│    b) Filtram dados por accessLevel                     │
│    c) Protegem rotas sensíveis                          │
└─────────────────────────────────────────────────────────┘
```

### Proteção de Rotas

**Arquivo: `src/components/common/ProtectedRoute.tsx`**
```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel?: 0 | 1;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredLevel,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { state, isAuthorized } = useAuth();

  if (state.loading) {
    return <div className="text-center p-8">Carregando...</div>;
  }

  if (!state.isAuthenticated) {
    router.push('/login');
    return null;
  }

  if (requiredLevel !== undefined && !isAuthorized(requiredLevel)) {
    return (
      fallback || (
        <div className="p-8 text-center text-red-500">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p>Você não tem permissão para acessar esta página</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
```

### Uso em Rotas Sensíveis

```tsx
// src/modules/pex/pages/Parametros.tsx
export default function ParametrosPage() {
  return (
    <ProtectedRoute requiredLevel={1}>
      <div>
        <h1>Gerenciamento de Parâmetros</h1>
        {/* Apenas franqueadoras veem isso */}
      </div>
    </ProtectedRoute>
  );
}
```

---

## Padrões de Comunicação entre Módulos

### 1. Via Context API (State Compartilhado)

**Arquivo: `src/context/ModuleContext.tsx`**
```typescript
'use client';

import React, { createContext, useCallback } from 'react';

export interface ModuleMessage {
  type: 'NOTIFY' | 'ERROR' | 'SUCCESS' | 'REQUEST_DATA';
  module: string;
  payload: any;
}

export const ModuleContext = createContext<{
  sendMessage: (message: ModuleMessage) => void;
  onMessage: (callback: (message: ModuleMessage) => void) => () => void;
}>(null!);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const listeners: Set<(message: ModuleMessage) => void> = new Set();

  const sendMessage = useCallback((message: ModuleMessage) => {
    console.log('📨 Message:', message);
    listeners.forEach(listener => listener(message));
  }, []);

  const onMessage = useCallback((callback: (message: ModuleMessage) => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, []);

  return (
    <ModuleContext.Provider value={{ sendMessage, onMessage }}>
      {children}
    </ModuleContext.Provider>
  );
}
```

### 2. Via Query String (Cross-Module Navigation)

```typescript
// Dentro de PEX, ir para Vendas passando filtro
router.push('/vendas/filtro?periodo=2025-01&franquia=ABC-123');

// Em Vendas, capturar parâmetro
const { periodo, franquia } = router.query;
```

### 3. Via LocalStorage (Estado Persistente)

```typescript
// Em PEX, salvar seleção
localStorage.setItem('lastSelectedCluster', JSON.stringify(clusterData));

// Em Vendas, restaurar seleção
const cluster = JSON.parse(localStorage.getItem('lastSelectedCluster') || 'null');
```

---

## Checklist de Implementação

### Fase 1: Autenticação
- [ ] AuthContext criado e testado
- [ ] LoginPage funcionando
- [ ] Token salvo em localStorage
- [ ] useAuth() disponível em todos os componentes
- [ ] Sessão restaurada ao recarregar página

### Fase 2: Shell e Layout
- [ ] Shell.tsx renderizando corretamente
- [ ] Header com logo e logout
- [ ] Sidebar com navegação de módulos
- [ ] Responsividade funcional

### Fase 3: Módulo PEX
- [ ] PexModule.tsx criado
- [ ] Rotas internas mapeadas (/pex/dashboard, /pex/ranking, etc)
- [ ] Permissões respeitadas
- [ ] Dados filtrados corretamente
- [ ] Componentes funcionando

### Fase 4: Módulo Vendas
- [ ] VendasModule.tsx criado
- [ ] Componentes React convertidos
- [ ] Dados sincronizados
- [ ] Rotas funcionando

### Fase 5: Deploy
- [ ] Variáveis de ambiente configuradas
- [ ] Build otimizado (bundle analysis)
- [ ] Testes E2E passando
- [ ] Performance auditada
- [ ] Deploy em staging
- [ ] Deploy em produção

---

## Resumo Executivo

| Aspecto | Antes | Depois |
|--------|-------|--------|
| **Aplicações** | 3 separadas | 1 unificada |
| **Login** | 3 logins distintos | 1 login centralizado |
| **Autenticação** | Espalhada em código | AuthContext global |
| **Roteamento** | Cada app com seu router | Next.js Router unificado |
| **Estado** | localStorage desorganizado | Context API + localStorage |
| **Módulos** | Aplicações monolíticas | Encapsulados + Lazy loading |
| **Deployment** | 3 URLs, 3 deploys | 1 URL, 1 deploy |
| **Manutenção** | Código duplicado | DRY, reutilizável |
| **Escalabilidade** | Difícil adicionar novos módulos | Fácil (padrão estabelecido) |

