# Arquitetura — Central de Dashboards VIVA

## Stack

- **Framework**: Next.js 14.2 (Pages Router)
- **Linguagem**: TypeScript 5.5
- **UI**: React 18 + Tailwind CSS 3.4
- **Data source**: Google Sheets (via `googleapis`)
- **Auth**: JWT (`jsonwebtoken`) + bcrypt
- **Charts**: Chart.js, Recharts
- **Deploy**: Vercel

## Camadas

```
┌──────────────────────────────────────────────────────┐
│                      _app.tsx                         │
│  AuthProvider → SheetsDataProvider → ParametrosProvider │
│    → FiltrosCarteiraProvider → VendasFiltersProvider   │
│           → Shell (Header + Sidebar) → Page           │
└──────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
     src/pages/<modulo>/       src/pages/api/<domínio>/
              │                       │
              ▼                       ▼
     src/modules/<nome>/      src/lib/sheets-client.ts
         (UI + hooks)              + cache.ts
                                       │
                                       ▼
                              Google Sheets API
```

## Módulos (15)

| Módulo | Propósito |
|--------|-----------|
| `analise-mercado` | INEP + concorrentes + franquias |
| `branches` | Gestão de unidades/filiais |
| `carteira` | Carteira de clientes |
| `central` | Layout (Shell, Header, Sidebar) |
| `controle-modulos` | Permissões de acesso por módulo |
| `controle-usuarios` | CRUD de usuários |
| `fluxo-projetado` | Projeções financeiras |
| `funil-expansao` | Funil de expansão de franquias |
| `gestao-rede` | Gestão da rede |
| `kpi` | KPIs operacionais |
| `okr` | OKRs |
| `painel-gerencial` | Dashboard executivo |
| `pex` | Programa de Excelência |
| `projetos` | Gestão de projetos |
| `vendas` | Vendas consolidadas |

Cada módulo em `src/modules/<nome>/` segue estrutura uniforme (barrel `index.ts` + `components/`, `hooks/`, `types/`, `utils/`).

Páginas correspondentes em `src/pages/<nome>/index.tsx` consumem o módulo.

## Data Layer

### `src/lib/sheets-client.ts`

- Auth via Service Account (`GOOGLE_SERVICE_ACCOUNT_BASE64`)
- Funções: `getSheetData`, `getExternalSheetData`, `updateSheetData`, `invalidateCache`
- Scope: `spreadsheets` (leitura + escrita)

### `src/lib/cache.ts`

- Singleton `MemoryCache` com TTL individual por chave
- `getOrFetch(key, fetcher, ttl)` — padrão obrigatório em API routes
- **Request deduplication**: `pendingRequests` Map previne chamadas simultâneas
- Limpeza automática a cada 5 min

## Auth

### Sistema principal — [AuthContext.tsx](../src/context/AuthContext.tsx)

- `useReducer` com actions: `LOGIN_SUCCESS`, `LOGIN_ERROR`, `LOGOUT`, `RESTORE_SESSION`, etc.
- Login: `POST /api/auth/login` → JWT salvo em `localStorage`
- Sessão: timeout de **10 horas** por inatividade, renovada em focus/click
- `isAuthorized(level?, modules?)`, `hasAccessToUnit(unitName)`

### HOCs legados — [auth.tsx](../src/utils/auth.tsx)

- `withAuth`, `withAuthAndFranchiser`, `withAuthFluxoProjetado`
- Ainda usados em páginas antigas — prefira `useAuth()` + checagem manual em páginas novas

### Controle de módulos

Hook `useModuloPermissions()` (de `@/modules/controle-modulos/hooks`) consulta a planilha de controle e retorna `{ allowedIds, modulos, loading }`. O `Shell` bloqueia a renderização até a verificação completar.

## API Routes

Padrão em `src/pages/api/<domínio>/<recurso>.ts`:

```
Query params → Cache check → Sheets fetch → Transform → JSON response
                  ↑
         Request deduplication (Map pendingRequests)
```

Domínios existentes: `analise-mercado`, `auth`, `branches`, `carteira`, `controle-modulos`, `controle-usuarios`, `fluxo-projetado`, `funil-expansao`, `gerencial`, `gestao-rede`, `kpi`, `okr`, `pex`, `projetos`, `vendas`.

### Timeouts (`vercel.json`)

| Rota | Timeout | RAM |
|------|---------|-----|
| `analise-mercado/inep.ts` | 60s | 512MB |
| `analise-mercado/franquias.ts` | 60s | — |
| `vendas/sales.ts`, `funil.ts`, `fundos.ts`, `metas.ts` | 30s | — |
| Demais | 10s (padrão) | — |

## Sidebar dinâmica

A sidebar ([Sidebar.tsx](../src/modules/central/components/Sidebar.tsx)) é **100% dirigida por planilha**:

- Planilha **BASE MODULOS** define: ID, nome, path, ícone, grupo, subgrupo, ordem, tipo (interno/externo), beta
- APIs [/api/controle-modulos/grupos](../src/pages/api/controle-modulos/) e `/subgrupos` entregam metadados (ícone, ordem, ativo)
- Sidebar monta árvore: Grupo → Subgrupo → Módulo
- Permissões filtram quais módulos o usuário pode ver

Para adicionar um novo módulo à sidebar: cadastrá-lo na planilha BASE MODULOS e dar permissão no módulo `controle-modulos`.

## Env Vars

```bash
GOOGLE_SERVICE_ACCOUNT_BASE64=   # Service account JSON em base64
GOOGLE_SHEET_ID=                 # ID da planilha principal
JWT_SECRET=                      # Secret para assinar tokens
APP_NAME=                        # Nome exibido na UI
APP_VERSION=                     # Versão exibida
```

## Config Files

- [next.config.js](../next.config.js) — ESLint/TS errors ignorados no build (deliberado); redirect `/fluxo-projetado` → `/fluxo-projetado/realizado`
- [tsconfig.json](../tsconfig.json) — path aliases `@/*`; exclui pastas legadas (`kpi_refatorado`, `okr_refatorado`)
- [vercel.json](../vercel.json) — timeouts customizados por função
- [tailwind.config.js](../tailwind.config.js) — paleta VIVA (laranja `#FF6600`, dark `#212529`)
