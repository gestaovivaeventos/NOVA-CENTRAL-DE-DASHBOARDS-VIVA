# Guia de Implementação Prática - Unificação Projeto Central

## Parte 1: Setup Inicial do Projeto

### 1.1 Criar novo repositório Next.js base

```bash
# Opção A: Usando create-next-app (recomendado)
npx create-next-app@14 projeto-central --typescript --tailwind --eslint

# Opção B: Manual
mkdir projeto-central
cd projeto-central
npm init -y
npm install next@14 react@18 react-dom@18 typescript tailwindcss postcss autoprefixer
```

### 1.2 Configurar TypeScript Strict

**`tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForEnumMembers": true,
    "lib": ["ES2020", "dom", "dom.iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 1.3 Configurar Path Aliases e Tailwind

**`next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    return config;
  },
};

module.exports = nextConfig;
```

**`tailwind.config.js`**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/modules/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        viva: {
          primary: '#FF6600',
          dark: '#212529',
          darker: '#1a1d21',
          gray: '#343A40',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        title: ['Orbitron', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

---

## Parte 2: Estrutura Base de Pastas e Arquivos

### 2.1 Criar diretório base

```bash
cd projeto-central

# Criar estrutura de diretórios
mkdir -p src/{pages,components,modules,hooks,context,types,utils,styles,config}
mkdir -p src/components/{layout,common,auth}
mkdir -p src/pages/api/auth
mkdir -p src/modules/{pex,vendas}/{pages,components,hooks,utils,types}
mkdir -p public/images
```

### 2.2 Arquivo `package.json` completo

```json
{
  "name": "projeto-central",
  "version": "1.0.0",
  "description": "Platform unificada de dashboards para franchises Viva",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "analyze": "ANALYZE=true next build"
  },
  "dependencies": {
    "next": "^14.2.33",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.0",
    "bcryptjs": "^3.0.3",
    "googleapis": "^128.0.0",
    "recharts": "^2.10.0",
    "xlsx": "^0.18.5",
    "lucide-react": "^0.554.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/bcryptjs": "^2.4.6",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-config-next": "^14.0.0",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.0"
  }
}
```

---

## Parte 3: Implementação do AuthContext

### 3.1 Tipos de Autenticação

**`src/types/auth.types.ts`**
```typescript
/**
 * Tipos globais de autenticação
 */

export interface AuthUser {
  username: string;
  firstName: string;
  accessLevel: 0 | 1; // 0: franqueado, 1: franqueadora
  unitNames?: string[];
  avatar?: string;
  email?: string;
}

export interface AuthToken {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
}

export interface AuthError {
  code: 'INVALID_CREDENTIALS' | 'USER_NOT_FOUND' | 'UNKNOWN';
  message: string;
}
```

### 3.2 AuthContext Completo

**`src/context/AuthContext.tsx`**
```typescript
'use client';

import React, { 
  createContext, 
  useCallback, 
  useReducer, 
  useEffect, 
  ReactNode 
} from 'react';
import { AuthUser, AuthError } from '@/types/auth.types';

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: AuthError | null;
}

type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'INIT_ERROR' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGIN_ERROR'; payload: AuthError }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT_START':
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };

    case 'INIT_SUCCESS':
    case 'LOGIN_SUCCESS':
      return {
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };

    case 'INIT_ERROR':
      return { ...initialState, loading: false };

    case 'LOGIN_ERROR':
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return initialState;

    default:
      return state;
  }
}

export interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthorized: (requiredLevel?: 0 | 1) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restaurar sessão ao montar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        dispatch({ type: 'INIT_START' });

        if (typeof window === 'undefined') {
          dispatch({ type: 'INIT_ERROR' });
          return;
        }

        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('auth_user');

        if (token && userJson) {
          try {
            const user = JSON.parse(userJson) as AuthUser;
            dispatch({
              type: 'INIT_SUCCESS',
              payload: { user, token },
            });
          } catch (e) {
            console.error('Erro ao parsear user:', e);
            localStorage.removeItem('auth_user');
            dispatch({ type: 'INIT_ERROR' });
          }
        } else {
          dispatch({ type: 'INIT_ERROR' });
        }
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        dispatch({ type: 'INIT_ERROR' });
      }
    };

    // Pequeno delay para evitar flashes
    const timeout = setTimeout(restoreSession, 100);
    return () => clearTimeout(timeout);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error: AuthError = {
          code: response.status === 401 ? 'INVALID_CREDENTIALS' : 'UNKNOWN',
          message: data.message || 'Erro ao fazer login',
        };
        dispatch({ type: 'LOGIN_ERROR', payload: error });
        throw new Error(error.message);
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user, token: data.token },
      });
    } catch (error) {
      if (state.error) throw new Error(state.error.message);
      throw error;
    }
  }, [state.error]);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const isAuthorized = useCallback(
    (requiredLevel?: 0 | 1): boolean => {
      if (!state.isAuthenticated || !state.user) return false;
      if (requiredLevel === undefined) return true;
      return state.user.accessLevel === requiredLevel;
    },
    [state.isAuthenticated, state.user]
  );

  const value: AuthContextType = {
    state,
    login,
    logout,
    isAuthorized,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 3.3 Hook useAuth

**`src/hooks/useAuth.ts`**
```typescript
'use client';

import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/context/AuthContext';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de um AuthProvider. ' +
      'Verifique se AuthProvider está envolvendo sua aplicação em _app.tsx'
    );
  }

  return context;
}
```

---

## Parte 4: API de Autenticação Centralizada

### 4.1 Endpoint POST /api/auth/login

**`src/pages/api/auth/login.ts`**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { AuthUser, LoginResponse } from '@/types/auth.types';

// Função auxiliar para buscar usuários da Google Sheets
// (Adaptada do Novo Pex)
async function getAuthorizedUsers(): Promise<
  Array<{
    username: string;
    name: string;
    password_hash: string; // Armazenar hash, não senha
    accessLevel: 0 | 1;
    unitNames?: string[];
    enabled: boolean;
  }>
> {
  try {
    const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
    if (!sheetId) {
      console.error('GOOGLE_ACCESS_CONTROL_SHEET_ID não configurado');
      return [];
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split('\n');
    const userMap = new Map<
      string,
      {
        name: string;
        password_hash: string;
        accessLevel: 0 | 1;
        unitNames: Set<string>;
        enabled: boolean;
      }
    >();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = line.split(',');
      if (cells.length > 12) {
        const unitName = cells[1]?.trim().replace(/^"|"$/g, '') || '';
        const name = cells[3]?.trim().replace(/^"|"$/g, '') || '';
        const username = cells[4]?.trim().replace(/^"|"$/g, '') || '';
        const enabled = cells[5]?.trim().replace(/^"|"$/g, '').toUpperCase() === 'TRUE';
        const accessLevelStr = cells[11]?.trim().replace(/^"|"$/g, '');
        const passwordHash = cells[12]?.trim().replace(/^"|"$/g, '') || '';

        const accessLevel = accessLevelStr === '1' ? 1 : (accessLevelStr === '0' ? 0 : null);

        if (username && name && accessLevel !== null && enabled && passwordHash) {
          if (!userMap.has(username)) {
            userMap.set(username, {
              name,
              password_hash: passwordHash,
              accessLevel,
              unitNames: new Set(),
              enabled,
            });
          }

          const user = userMap.get(username)!;
          if (accessLevel === 0 && unitName) {
            user.unitNames.add(unitName);
          }
        }
      }
    }

    return Array.from(userMap, ([username, data]) => ({
      username,
      ...data,
      unitNames: Array.from(data.unitNames),
    }));
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios',
      });
    }

    // Buscar usuários autorizados
    const authorizedUsers = await getAuthorizedUsers();
    const user = authorizedUsers.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos',
      });
    }

    // Validar senha com bcryptjs
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Usuário ou senha inválidos',
      });
    }

    // Gerar token JWT simples (em produção, usar library jwt)
    const token = Buffer.from(
      JSON.stringify({
        username,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
      })
    ).toString('base64');

    const authUser: AuthUser = {
      username: user.username,
      firstName: user.name.split(' ')[0],
      accessLevel: user.accessLevel,
      unitNames: user.unitNames,
    };

    return res.status(200).json({
      success: true,
      token,
      user: authUser,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
}
```

### 4.2 Endpoint POST /api/auth/logout

**`src/pages/api/auth/logout.ts`**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Logout é simplesmente remover token no cliente
  // Pode adicionar blacklist de tokens se necessário
  return res.status(200).json({ success: true, message: 'Logout realizado' });
}
```

---

## Parte 5: Componentes de Layout Shell

### 5.1 Shell Principal

**`src/components/layout/Shell.tsx`**
```tsx
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from '../common/LoadingSpinner';

interface ShellProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export default function Shell({ children, showSidebar = true }: ShellProps) {
  const { state } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Se não autenticado, não mostrar shell
  if (!state.isAuthenticated) {
    return <>{children}</>;
  }

  // Se ainda carregando autenticação
  if (state.loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="flex h-screen bg-viva-dark text-gray-100">
      {showSidebar && (
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 5.2 Header

**`src/components/layout/Header.tsx`**
```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { Menu, LogOut, User } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { state, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-viva-gray border-b-4 border-viva-primary px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Logo + Menu Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 hover:bg-viva-dark rounded transition"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/dashboard/pex" className="flex items-center gap-2">
            <div className="relative w-32 h-8">
              <Image
                src="/images/logo_viva.png"
                alt="Viva Eventos"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Right Side: User Info + Logout */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold">{state.user?.firstName}</p>
            <p className="text-xs text-gray-400">
              {state.user?.accessLevel === 1 ? 'Franqueadora' : 'Franqueado'}
            </p>
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 hover:bg-viva-dark rounded-full transition"
            >
              <User className="w-5 h-5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-viva-dark rounded shadow-xl z-10">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-3 hover:bg-viva-gray transition text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 5.3 Sidebar

**`src/components/layout/Sidebar.tsx`**
```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, Settings, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredLevel?: 0 | 1;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard PEX',
    href: '/pex/dashboard',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Ranking',
    href: '/pex/ranking',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    label: 'Resultados',
    href: '/pex/resultados',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Parâmetros',
    href: '/pex/parametros',
    icon: <Settings className="w-5 h-5" />,
    requiredLevel: 1,
  },
  {
    label: 'Vendas',
    href: '/vendas',
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const { isAuthorized } = useAuth();

  // Filtrar itens por permissão
  const visibleItems = navItems.filter(
    item => !item.requiredLevel || isAuthorized(item.requiredLevel)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          w-64 h-screen bg-viva-gray border-r border-viva-primary
          transform transition-transform duration-200 ease-in-out
          z-40 lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Close Button (Mobile) */}
        <div className="lg:hidden p-4 border-b border-viva-primary flex justify-between items-center">
          <h2 className="font-title text-lg text-viva-primary">Menu</h2>
          <button onClick={onToggle}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {visibleItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded transition
                ${router.pathname.startsWith(item.href.split('/')[1])
                  ? 'bg-viva-primary text-viva-dark font-semibold'
                  : 'text-gray-300 hover:bg-viva-dark'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
```

---

## Parte 6: Página de Login

**`src/pages/login.tsx`**
```tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import Head from 'next/head';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, state } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await login(username, password);
      // Login bem-sucedido, redirecionar
      router.push('/dashboard/pex');
    } catch (error) {
      // Erro já está em state.error
      console.error('Erro ao fazer login:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Projeto Central</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: 'url(/capa_site.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: '#212529',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40" />

        {/* Login Box */}
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-viva-gray p-8 rounded-lg shadow-2xl border border-viva-primary border-opacity-20">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <div className="relative w-40 h-12">
                <Image
                  src="/images/logo_viva.png"
                  alt="Viva Eventos"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h1 className="font-title text-3xl text-center text-white mb-2">
              CENTRAL DE DASHBOARDS
            </h1>
            <p className="text-center text-gray-400 mb-8">
              Bem-vindo ao Projeto Central
            </p>

            {/* Error Message */}
            {state.error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-500 rounded flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">{state.error.code}</p>
                  <p className="text-red-300 text-sm">{state.error.message}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-300 mb-2">
                  Usuário
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={state.loading}
                  className="w-full px-4 py-3 bg-viva-dark border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-viva-primary disabled:opacity-50 transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={state.loading}
                    className="w-full px-4 py-3 bg-viva-dark border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-viva-primary disabled:opacity-50 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={state.loading || !username || !password}
                className="w-full py-3 bg-gradient-to-r from-viva-primary to-orange-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {state.loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-gray-500 text-xs mt-8">
              © 2025 Viva Eventos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
```

---

## Parte 7: App Setup

**`src/pages/_app.tsx`**
```tsx
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/context/AuthContext';
import Shell from '@/components/layout/Shell';
import '@/styles/globals.css';

export default function App({ Component, pageProps, router }: AppProps) {
  // Não mostrar shell em página de login
  const showShell = router.pathname !== '/login';

  return (
    <AuthProvider>
      {showShell ? (
        <Shell>
          <Component {...pageProps} />
        </Shell>
      ) : (
        <Component {...pageProps} />
      )}
    </AuthProvider>
  );
}
```

---

## Parte 8: Variáveis de Ambiente

**`.env.local.example`**
```env
# Google Sheets (Autenticação)
GOOGLE_ACCESS_CONTROL_SHEET_ID=1QEsm1u0LDY_-8y_EWgifzUHJCHoz3_VOoUOSXuJZzSM

# Google Sheets (Dados PEX)
GOOGLE_SHEET_ID=seu_sheet_id_aqui
GOOGLE_SERVICE_ACCOUNT_EMAIL=sua_email@iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_BASE64=seu_json_base64_aqui

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

---

## Parte 9: Próximos Passos

Após implementar a base:

1. **Mover componentes do Novo Pex** para `src/modules/pex/`
2. **Converter Vendas** de HTML/JS para React em `src/modules/vendas/`
3. **Integrar hooks** (useSheetsData, etc) nos módulos
4. **Testes E2E** com Playwright ou Cypress
5. **Deploy** para Vercel

