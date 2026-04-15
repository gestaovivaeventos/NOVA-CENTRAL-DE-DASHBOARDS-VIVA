# Resumo Executivo - Unificação Projeto Central

## 📊 Proposta de Arquitetura

### Estado Atual (Antes)
```
┌─────────────────────────────────────────────────┐
│                INTERNET                          │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
   ┌────▼──┐  ┌───▼────┐  ┌──▼────┐   
   │Central│  │Novo    │  │Vendas │
   │(HTML) │  │Pex     │  │(HTML) │
   │:3001  │  │(React) │  │:3002  │
   │       │  │:3000   │  │       │
   │Login A│  │Login B │  │Login C│
   └───────┘  └────────┘  └───────┘
   
❌ 3 UIs diferentes
❌ 3 logins distintos
❌ 3 deploys independentes
❌ Código duplicado
```

### Estado Desejado (Depois)
```
┌─────────────────────────────────────────────────┐
│                INTERNET                          │
└──────────────────┬──────────────────────────────┘
                   │
            ┌──────▼──────┐
            │ Projeto     │
            │ Central     │
            │ (Next.js)   │
            │ :3000       │
            └──────┬──────┘
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
   ┌────▼──┐  ┌───▼────┐  ┌──▼────┐   
   │Login  │  │PEX     │  │Vendas │
   │Global │  │Module  │  │Module │
   │(único)│  │(async) │  │(async)│
   └───────┘  └────────┘  └───────┘

✅ 1 UI unificada
✅ 1 login centralizado
✅ 1 deploy único
✅ Código reutilizável
✅ Fácil escalabilidade
```

---

## 🏗️ Arquitetura em Camadas

```
┌──────────────────────────────────────────────────┐
│         PÁGINAS / ROTAS (Next.js)                │
│  login.tsx  |  [module]/[[...slug]].tsx          │
└──────────────────────────────────────────────────┘
                        ▲
┌──────────────────────────────────────────────────┐
│        SHELL / LAYOUT WRAPPER                    │
│  Shell.tsx | Header.tsx | Sidebar.tsx            │
└──────────────────────────────────────────────────┘
                        ▲
┌──────────────────────────────────────────────────┐
│      MÓDULOS (Componentes Encapsulados)          │
│  ┌─────────────┐  ┌──────────────┐               │
│  │ PEX Module  │  │ Vendas Module│  ...         │
│  │ - pages/    │  │ - pages/     │               │
│  │ - components│  │ - components │               │
│  │ - hooks/    │  │ - hooks/     │               │
│  │ - utils/    │  │ - utils/     │               │
│  └─────────────┘  └──────────────┘               │
└──────────────────────────────────────────────────┘
                        ▲
┌──────────────────────────────────────────────────┐
│    CONTEXTO GLOBAL (Auth + State)                │
│  AuthContext.tsx | useAuth.ts                    │
└──────────────────────────────────────────────────┘
                        ▲
┌──────────────────────────────────────────────────┐
│      API BACKEND / Google Sheets                 │
│  /api/auth/login | /api/sheets | /api/vendas    │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação Unificado

```
┌─────────────┐
│  Login Page │
│  (única)    │
└──────┬──────┘
       │ usuário + senha
       ▼
┌──────────────────────────────────────┐
│ POST /api/auth/login                 │
│                                      │
│ 1. Busca credenciais Google Sheets   │
│ 2. Valida com bcryptjs               │
│ 3. Gera JWT token                    │
│ 4. Retorna user + permissões         │
└──────────┬───────────────────────────┘
           │ { token, user }
           ▼
┌──────────────────────────────────────┐
│ AuthContext (Global State)           │
│                                      │
│ state.isAuthenticated = true         │
│ state.user = { username, accessLevel}│
│ state.token = JWT                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ localStorage salva token + user      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Redirecionar para /dashboard/pex     │
│                                      │
│ Módulos acessam useAuth() hook       │
│ Filtram dados por accessLevel        │
│ Protegem rotas sensíveis             │
└──────────────────────────────────────┘
```

---

## 📦 Estrutura de Pastas Resumida

```
projeto-central/
│
├── src/
│   ├── pages/                    ← Rotas Next.js
│   │   ├── login.tsx             (login único)
│   │   ├── [module]/[[...slug]]  (roteador de módulos)
│   │   ├── _app.tsx              (AuthProvider wrapper)
│   │   └── api/
│   │       ├── auth/login.ts      (autenticação centralizada)
│   │       └── ...proxy.ts        (APIs dos módulos)
│   │
│   ├── context/                  ← Estado Global
│   │   ├── AuthContext.tsx        (user, token, login)
│   │   └── useAuth.ts             (hook compartilhado)
│   │
│   ├── components/               ← Componentes Globais
│   │   ├── layout/
│   │   │   ├── Shell.tsx          (wrapper layout)
│   │   │   ├── Header.tsx         (header global)
│   │   │   └── Sidebar.tsx        (nav modular)
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── modules/                  ← MÓDULOS (novo conceito)
│   │   ├── pex/
│   │   │   ├── PexModule.tsx      (entrada do módulo)
│   │   │   ├── pages/             (5 pages do PEX)
│   │   │   ├── components/        (10+ componentes)
│   │   │   ├── hooks/             (useSheetsData, etc)
│   │   │   ├── utils/             (calculosPex.ts, etc)
│   │   │   └── types/             (tipos PEX)
│   │   │
│   │   ├── vendas/
│   │   │   ├── VendasModule.tsx
│   │   │   ├── pages/             (3 pages)
│   │   │   ├── components/        (10+ componentes)
│   │   │   └── ...
│   │   │
│   │   └── registry.ts            (registro central)
│   │
│   ├── hooks/                    ← Hooks Globais
│   │   └── useAuth.ts             (exportado de context)
│   │
│   ├── types/                    ← Tipos Globais
│   │   └── auth.types.ts
│   │
│   ├── utils/                    ← Utils Globais
│   │   ├── auth.utils.ts
│   │   ├── storage.ts
│   │   └── api-client.ts
│   │
│   ├── styles/                   ← CSS Global
│   │   ├── globals.css
│   │   └── theme.css
│   │
│   └── config/
│       └── modules.config.ts      (config de módulos)
│
├── public/
│   └── images/
│       ├── logo_viva.png
│       └── capa_site_nova_hd.png
│
├── .env.local                    ← Variáveis de ambiente
├── tsconfig.json                 ← TypeScript config
├── tailwind.config.js            ← Tailwind config
├── next.config.js                ← Next.js config
└── package.json
```

---

## 🚀 Timeline de Implementação (5 Semanas)

### **SEMANA 1: Setup Global**
- [ ] Criar novo repo `projeto-central`
- [ ] Configurar Next.js 14 + TypeScript strict
- [ ] Criar AuthContext e login centralizado
- [ ] Implementar Shell layout
- **Status**: Login funcionando

### **SEMANA 2-3: Integrar PEX**
- [ ] Migrar componentes do Novo Pex
- [ ] Adaptar imports (de `novo_pex/` para `modules/pex/`)
- [ ] Integrar `useSheetsData` como hook do módulo
- [ ] Implementar roteamento interno (`/pex/**`)
- [ ] Testes: permissões, dados, roteamento
- **Status**: PEX funcionando como módulo + roteamento OK

### **SEMANA 3-4: Converter Vendas**
- [ ] Analisar `script.js` (9832 linhas) → componentes
- [ ] Migrar HTML → React components
- [ ] Converter JS → TypeScript
- [ ] Criar hooks para dados + filtros
- [ ] Implementar roteamento (`/vendas/**`)
- **Status**: Vendas funcional como módulo

### **SEMANA 4-5: Otimização + Deploy**
- [ ] Code splitting & lazy loading
- [ ] Performance audit (Lighthouse)
- [ ] Testes E2E (Cypress/Playwright)
- [ ] Variáveis de ambiente
- [ ] Deploy staging
- [ ] Deploy produção
- **Status**: ✅ Live em produção

---

## 💡 Padrões Chave de Implementação

### 1. Context de Autenticação Global
```typescript
const { state, login, logout, isAuthorized } = useAuth();

// Em qualquer componente!
if (!state.isAuthenticated) redirect to /login
if (!isAuthorized(1)) show access denied
```

### 2. Roteamento de Módulos (Automático)
```
URL: /pex/dashboard         → PexModule slug=['dashboard']
URL: /pex/ranking           → PexModule slug=['ranking']
URL: /vendas/analise        → VendasModule slug=['analise']
URL: /academy/courses       → AcademyModule slug=['courses']
```

### 3. Lazy Loading de Módulos
```typescript
const PexModule = dynamic(() => 
  import('@/modules/pex').then(m => m.PexModule),
  { loading: () => <LoadingSpinner />, ssr: false }
);
```

### 4. Proteção de Rotas Sensíveis
```tsx
<ProtectedRoute requiredLevel={1}>  {/* Apenas franqueadora */}
  <ParametrosPage />
</ProtectedRoute>
```

### 5. Filtro de Dados por Permissão
```typescript
const dadosFiltrados = filterDataByPermission(dados, {
  accessLevel: user.accessLevel,
  unitNames: user.unitNames
});
```

---

## 📈 Benefícios da Arquitetura

| Benefício | Antes | Depois |
|-----------|-------|--------|
| **URLs Públicas** | 3 diferentes | 1 única |
| **Logins** | 3 diferentes | 1 centralizado |
| **Código Duplicado** | Alto | Eliminado |
| **Tempo Deploy** | 3x + demorado | Instantâneo |
| **Manutenção Auth** | 3 lugares | 1 lugar |
| **Escalabilidade** | Difícil | Fácil (padrão) |
| **UX** | Confusa | Unificada |
| **Performance** | Desotimizada | Code splitting |
| **Type Safety** | Parcial | Strict mode |
| **Custo DevOps** | Alto (3 deploys) | Baixo (1 deploy) |

---

## 🎯 Marcos de Sucesso

✅ **Fase 1 Completa**: Login funcionando, tokens salvos, sessão restaurada
✅ **Fase 2 Completa**: PEX integrado, roteamento funcional, permissões OK
✅ **Fase 3 Completa**: Vendas convertido, módulos comunicando
✅ **Fase 4 Completa**: Deploy em produção, zero downtime

---

## 📚 Documentação Gerada

1. **ARCHITECTURE_UNIFICATION.md** (este projeto)
   - Visão geral completa
   - Roadmap detalhado
   - Exemplos de código
   - Fluxos de autenticação

2. **IMPLEMENTATION_GUIDE.md**
   - Setup passo a passo
   - Código pronto para usar
   - Configurações completas

3. **MODULE_STRUCTURE_GUIDE.md**
   - Como estruturar módulos
   - Exemplos PEX e Vendas
   - Sistema de registro

---

## ⚡ Quick Start Commands

```bash
# 1. Criar projeto base
npx create-next-app@14 projeto-central --typescript --tailwind

# 2. Instalar dependências extras
npm install bcryptjs googleapis recharts xlsx lucide-react

# 3. Copiar estrutura de pastas
mkdir -p src/{context,modules/pex,modules/vendas,config}

# 4. Copiar arquivos do documento
# (AuthContext.tsx, _app.tsx, login.tsx, etc)

# 5. Configurar .env.local
# GOOGLE_ACCESS_CONTROL_SHEET_ID=...

# 6. Rodar desenvolvimento
npm run dev

# 7. Acessar
# http://localhost:3000/login
```

---

## 🤝 Próximas Ações Recomendadas

1. **Aprovação da Arquitetura**
   - Review desta documentação
   - Validar com stakeholders

2. **Setup do Repositório**
   - Criar repo `projeto-central`
   - Configurar CI/CD
   - Preparar ambientes (dev, staging, prod)

3. **Kick-off Desenvolvimento**
   - Atribuir tasks (Semana 1)
   - Daily standups
   - Code reviews

4. **Comunicação**
   - Notificar usuários sobre migration
   - Preparar runbook de migração
   - Planejar data de cutover

---

## 📞 Suporte e Dúvidas

Para dúvidas sobre a implementação, consultar:
- `ARCHITECTURE_UNIFICATION.md` - Conceitos
- `IMPLEMENTATION_GUIDE.md` - Código
- `MODULE_STRUCTURE_GUIDE.md` - Padrões
- `.github/copilot-instructions.md` - Convenções do projeto

---

## ✨ Conclusão

Esta arquitetura estabelece uma **base sólida e escalável** para:
- ✅ Consolidar 3 aplicações em 1
- ✅ Centralizar autenticação
- ✅ Criar padrão para novos módulos
- ✅ Melhorar manutenibilidade
- ✅ Reduzir custos operacionais

**Pronto para começar a implementação!** 🚀

