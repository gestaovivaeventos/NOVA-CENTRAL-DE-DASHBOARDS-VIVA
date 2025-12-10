# ⚡ Quick Reference Card - Unificação Projeto Central

## 🚀 Start Here (2 minutos)

### Status Atual
- 3 aplicações separadas
- 3 logins distintos  
- Código duplicado em 3 lugares

### Status Desejado
- 1 aplicação Next.js
- 1 login centralizado
- Módulos reutilizáveis

### Timeline
- **Semana 1**: Setup Global (Auth + Login)
- **Semana 2-3**: Integrar PEX
- **Semana 3-4**: Converter Vendas  
- **Semana 4-5**: Deploy
- **Total**: 5 semanas, 2-3 devs

---

## 📁 Documentos (Qual Ler?)

```
├─ PROPOSAL_SUMMARY.md (você leu isso)
│  └─ Resumo completo + checklist
│
├─ EXECUTIVE_SUMMARY.md ⭐ (ler primeiro)
│  └─ Para decisores: visão, timeline, ROI
│
├─ DIAGRAMS.md ⭐
│  └─ 10 diagramas visuais (antes/depois/fluxos)
│
├─ ARCHITECTURE_UNIFICATION.md ⭐⭐ (ler segundo)
│  └─ Para arquitetos: detalhes completos
│
├─ IMPLEMENTATION_GUIDE.md ⭐⭐ (ler terceiro)
│  └─ Para devs: código pronto para usar
│
├─ MODULE_STRUCTURE_GUIDE.md ⭐⭐
│  └─ Como estruturar cada módulo
│
└─ DOCUMENTATION_INDEX.md
   └─ Índice completo + busca por tópico
```

**Leitura recomendada**: 2-3 horas total (ou 30 min por dia)

---

## 🎯 Arquitetura em 1 Página

```
┌──────────────────────────────────┐
│        PROJETO CENTRAL           │
│         (Next.js)                │
├──────────────────────────────────┤
│                                  │
│  🔐 AuthContext                 │
│     (centraliza login)           │
│                                  │
│  🏗️  Shell Layout                │
│     (Header + Sidebar)           │
│                                  │
│  📦 Módulos                      │
│     ├─ PEX (refatorado)         │
│     ├─ Vendas (convertido)      │
│     └─ Academy (futuro)         │
│                                  │
│  📡 APIs Centralizadas           │
│     └─ /api/auth/login.ts       │
│                                  │
└──────────────────────────────────┘
```

---

## 🔐 Autenticação (O Que Centralizar?)

### Antes (Espalhado)
```
Central HTML   ← Login A
Novo Pex      ← Login B  
Vendas HTML   ← Login C
```

### Depois (Centralizado)
```
                ↓
        LoginPage.tsx
                ↓
    /api/auth/login.ts (único)
                ↓
        AuthContext.tsx
                ↓
    useAuth() hook (compartilhado)
                ↓
    Todos os módulos acessam
```

### Código-Chave
```typescript
// AuthContext.tsx (global)
const { state, login, logout, isAuthorized } = useAuth();

// Qualquer componente
if (!state.isAuthenticated) redirect to /login
if (!isAuthorized(1)) show "Acesso Negado"
```

---

## 📦 Módulos: Padrão Repetível

### Estrutura
```
src/modules/[nome]/
├── index.ts                 (barril export)
├── [Nome]Module.tsx        (componente raiz)
├── pages/                  (páginas internas)
├── components/             (UI específica)
├── hooks/                  (dados)
├── utils/                  (lógica)
├── types/                  (tipos)
└── styles/                 (CSS)
```

### Adicionar novo módulo (3 passos)
1. Criar `src/modules/novo-modulo/`
2. Criar `NovoModuloComponent.tsx` (com roteamento interno)
3. Adicionar em `modules.config.ts`

---

## 🛣️ Roteamento (Automático)

```
URL                 → Componente
──────────────────────────────────
/login              → LoginPage

/pex/dashboard      → PexModule (Dashboard)
/pex/ranking        → PexModule (Ranking)
/pex/parametros     → PexModule (Parametros - se level 1)

/vendas/analise     → VendasModule (Analise)

/academy/courses    → AcademyModule (futuro)
```

Padrão: `/[MODULE]/[PAGE]`

---

## 🔑 Permissões (Simples)

```
accessLevel = 0  → Franqueado
├─ Vê: Sua unidade
├─ Acesso: Dashboard, Ranking, Resultados
└─ Bloqueado: Parametros

accessLevel = 1  → Franqueadora
├─ Vê: Todas unidades
├─ Acesso: Tudo
└─ Admin features: Parametros
```

Código:
```typescript
<ProtectedRoute requiredLevel={1}>
  <AdminPage />
</ProtectedRoute>
```

---

## 💾 Estado Global (localStorage)

```
localStorage
├─ auth_token: "JWT_STRING"
└─ auth_user: {
    username: "joao",
    firstName: "João",
    accessLevel: 1,
    unitNames: ["UNI-001"]
  }
```

Acessível via:
```typescript
const { state: { user, token, isAuthenticated } } = useAuth();
```

---

## 🏃 Quick Commands

```bash
# Setup novo projeto
npx create-next-app@14 projeto-central --typescript --tailwind

# Instalar deps
npm install bcryptjs googleapis recharts xlsx lucide-react

# Dev
npm run dev

# Build + start
npm run build && npm start

# Lint
npm run lint
```

---

## 📋 Tarefas Fase 1 (1 semana)

- [ ] Criar repo `projeto-central`
- [ ] Setup Next.js 14 + TypeScript
- [ ] Copiar AuthContext.tsx
- [ ] Copiar LoginPage.tsx
- [ ] Copiar Shell.tsx + Header.tsx + Sidebar.tsx
- [ ] Copiar _app.tsx com AuthProvider
- [ ] Testar login local
- [ ] Conectar Google Sheets (auth data)
- [ ] **Checkpoint**: Login funcionando ✅

---

## 📋 Tarefas Fase 2 (2 semanas)

- [ ] Criar pasta `src/modules/pex/`
- [ ] Migrar componentes do novo_pex
- [ ] Adaptar imports (@/ → ../)
- [ ] Criar PexModule.tsx wrapper
- [ ] Testar rotas `/pex/**`
- [ ] Validar permissões (franqueado vs franqueadora)
- [ ] E2E tests
- [ ] **Checkpoint**: PEX como módulo ✅

---

## 📋 Tarefas Fase 3 (2 semanas)

- [ ] Analisar Vendas (9832 linhas)
- [ ] Decompor em componentes React
- [ ] Criar `src/modules/vendas/`
- [ ] Converter HTML → React components
- [ ] Converter JS → TypeScript
- [ ] Criar VendasModule.tsx wrapper
- [ ] Integrar com autenticação
- [ ] Testar filtros + dados
- [ ] **Checkpoint**: Vendas como módulo ✅

---

## 📋 Tarefas Fase 4 (1 semana)

- [ ] Code splitting (lazy loading módulos)
- [ ] Performance audit (Lighthouse)
- [ ] E2E tests (Cypress/Playwright)
- [ ] .env.local setup
- [ ] Deploy staging
- [ ] Testes finais
- [ ] Deploy produção
- [ ] **Checkpoint**: LIVE ✅

---

## 🛠️ Stack Tecnológico

```
Frontend:       Next.js 14 + React 18 + TypeScript
Styling:        Tailwind CSS + lucide-react icons
State:          React Context API
Auth:           JWT tokens + bcryptjs
API:            Next.js API routes
Data:           Google Sheets API
Types:          TypeScript strict mode
DB:             Google Sheets (CSV export)
Icons:          lucide-react
Charts:         Recharts
```

---

## 🚨 Possíveis Armadilhas

### ❌ Não fazer:
```typescript
// ❌ Hardcode valores
const accessLevel = 1;

// ✅ Use context
const { state: { user } } = useAuth();
```

### ❌ Não fazer:
```typescript
// ❌ Duplicar lógica de auth
if (localStorage.getItem('token')) { ... }

// ✅ Use useAuth()
const { state: { isAuthenticated } } = useAuth();
```

### ❌ Não fazer:
```typescript
// ❌ Sem filtro de permissão
const data = allFranquias;

// ✅ Filtre sempre
const data = filterDataByPermission(allFranquias, user);
```

---

## 🆘 Se Travar...

### Problema: Login não funciona
→ Verificar `/api/auth/login.ts`  
→ Verificar Google Sheets conexão  
→ Check `.env.local` vars

### Problema: Módulo não carrega
→ Verificar `modules.config.ts`  
→ Verificar `[module]/index.ts` exports  
→ Check console errors

### Problema: Permissões não funcionam
→ Verificar `state.user.accessLevel`  
→ Verificar `filterDataByPermission()`  
→ Check `<ProtectedRoute>` wrapper

### Problema: TypeScript errors
→ Check tipos em `src/types/auth.types.ts`  
→ Add types explícitos  
→ Rodar `npm run type-check`

---

## 📞 Documentação Rápida

| Tópico | Arquivo | Seção |
|--------|---------|-------|
| Overview | EXECUTIVE_SUMMARY.md | Top |
| Arquitetura | ARCHITECTURE_UNIFICATION.md | Section 2 |
| Setup | IMPLEMENTATION_GUIDE.md | Part 1-2 |
| Código Auth | IMPLEMENTATION_GUIDE.md | Part 3-4 |
| Código Layout | IMPLEMENTATION_GUIDE.md | Part 5 |
| PEX | MODULE_STRUCTURE_GUIDE.md | Section 1 |
| Vendas | MODULE_STRUCTURE_GUIDE.md | Section 2 |
| Registry | MODULE_STRUCTURE_GUIDE.md | Section 3 |
| Novo módulo | MODULE_STRUCTURE_GUIDE.md | Section 6 |

---

## 💡 Melhores Práticas

✅ **DO**
- Centralizar lógica de auth
- Usar TypeScript strict mode
- Componentizar tudo
- Lazy load módulos
- Type tudo
- Testar permissões

❌ **DON'T**
- Duplicar auth code
- Use `any` types
- Render tudo inline
- Eager load tudo
- Hardcode valores
- Esqueça de filtros

---

## 📊 Métricas de Sucesso

Ao final da semana 5, validar:

- [ ] 1 URL única funcionando
- [ ] 1 login centralizado
- [ ] Token JWT válido por 24h
- [ ] PEX módulo 100% funcional
- [ ] Vendas módulo 100% funcional
- [ ] 0 código duplicado de auth
- [ ] Todas as permissões respeitadas
- [ ] Performance: Lighthouse > 80
- [ ] 0 downtime durante migração
- [ ] Todos os testes passando ✅

---

## 🎓 Como Aprender a Arquitetura

1. **Dia 1**: Ler EXECUTIVE_SUMMARY.md + DIAGRAMS.md
2. **Dia 2**: Ler ARCHITECTURE_UNIFICATION.md seções 1-3
3. **Dia 3**: Ler IMPLEMENTATION_GUIDE.md partes 1-4
4. **Dia 4**: Ler MODULE_STRUCTURE_GUIDE.md seção 1
5. **Dia 5**: Comece com código!

---

## 🎯 Checkpoints

```
Semana 1: Login ✅
Semana 2: PEX ✅
Semana 3: Vendas ✅
Semana 4: Pronto ✅
Semana 5: LIVE ✅
```

---

**Status**: ✅ Documentação Completa  
**Próximo**: Aprovação + Setup Repo  
**Tempo total leitura**: 2-3 horas  
**Tempo total implementação**: 5 semanas  

🚀 **Bora começar!**

