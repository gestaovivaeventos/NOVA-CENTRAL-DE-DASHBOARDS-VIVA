# Agent Instructions — Central de Dashboards VIVA

## Overview

Plataforma unificada de dashboards (Next.js 14 Pages Router) para a rede de franquias VIVA Eventos. Usa **Google Sheets como banco de dados** via API Routes. Dark theme com laranja `#FF6600` como cor primária.

**Status atual:** 15 módulos em produção, arquitetura unificada consolidada.

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build (TS/ESLint errors ignored)
npm run lint     # ESLint
```

> Não há framework de testes configurado.

## Architecture (resumo)

- **Pages Router** (`src/pages/`) — não usa App Router
- **15 módulos independentes** em `src/modules/` — ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalhes
- **Data layer** — Google Sheets lido/escrito via [sheets-client.ts](../src/lib/sheets-client.ts) com cache em memória ([cache.ts](../src/lib/cache.ts))
- **Auth** — JWT + bcrypt, dados de usuários na planilha. [AuthContext.tsx](../src/context/AuthContext.tsx) é o sistema principal
- **Layout** — módulo [central](../src/modules/central/) (Shell + Header + Sidebar). Todo módulo é renderizado dentro do Shell
- **Sidebar 100% dinâmica** — lê da planilha BASE MODULOS quais dashboards existem, seus grupos, subgrupos, ícones e ordem

### Módulos atuais

`analise-mercado`, `branches`, `carteira`, `central`, `controle-modulos`, `controle-usuarios`, `fluxo-projetado`, `funil-expansao`, `gestao-rede`, `kpi`, `okr`, `painel-gerencial`, `pex`, `projetos`, `vendas`

### Access Levels

| Level | Role | Scope |
|-------|------|-------|
| `0` | Franqueado | Apenas suas unidades |
| `1` | Franqueadora | Todas as unidades |
| `22` | Super Admin | Acesso total |

## Module Structure

Padrão para módulos novos e existentes:

```
src/modules/<nome>/
├── index.ts          # Barrel exports
├── components/
├── hooks/
├── types/
├── utils/
├── config/           # opcional
└── context/          # opcional
```

Imports entre módulos via path alias: `@/modules/<nome>`.

## API Routes

Padrão em `src/pages/api/<domínio>/`:

1. Receber query params (ex: `chunk`, `refresh`)
2. Usar `cache.getOrFetch()` para deduplicação + TTL
3. Chamar Google Sheets via `getAuthenticatedClient()` de `@/lib/sheets-client`
4. Retornar JSON com `Cache-Control` headers
5. Dados grandes: leitura em chunks de 60K linhas

Template completo: [.github/prompts/api-route.prompt.md](../.github/prompts/api-route.prompt.md)

## Styling

- **Tailwind CSS 3.4** dark theme padrão
- Cor primária: `#FF6600`
- Fonte: **Poppins** (principal), **Orbitron** (display)
- **Inline styles** (`style={{}}`) são comuns — não é erro, é o padrão em Sidebar, modais, etc.
- Classes utilitárias globais: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.badge-*`
- Path alias: `@/*` → `./src/*`

## Key Conventions

- **Idioma**: Código e comentários em **português** (pt-BR)
- **Ícones**: Lucide React via `getLucideIcon()` de `@/modules/controle-modulos/config/icones`
- **Permissões**: Hook `useModuloPermissions()` controla acesso por módulo
- **Favoritos**: `localStorage['dashboard-favorites']`
- **Env vars**: `GOOGLE_SERVICE_ACCOUNT_BASE64`, `GOOGLE_SHEET_ID`, `JWT_SECRET`
- **Named exports** em barrel files (não default exports, exceto páginas)

## Pitfalls

- **ESLint/TS errors ignorados no build** ([next.config.js](../next.config.js)) — rodar `npm run lint` manualmente
- **Cache em memória** — reinicia no redeploy. TTLs 1-5 min
- **Vercel timeouts** — 10s padrão, até 60s via `vercel.json` (ver `analise-mercado/inep.ts` e rotas de vendas)
- **Dois sistemas de auth** coexistem: `AuthContext` (principal) e HOCs legados em [auth.tsx](../src/utils/auth.tsx) (`withAuth`, `withAuthAndFranchiser`, `withAuthFluxoProjetado`)

## Prompt Skills disponíveis

- [.github/prompts/new-module.prompt.md](../.github/prompts/new-module.prompt.md) — scaffolding de módulo
- [.github/prompts/api-route.prompt.md](../.github/prompts/api-route.prompt.md) — template de API route
- [.github/prompts/code-style.instructions.md](../.github/prompts/code-style.instructions.md) — convenções de código

## Documentação adicional

- [ARCHITECTURE.md](ARCHITECTURE.md) — Arquitetura detalhada
- [diretrizes.md](diretrizes.md) — Diretrizes corporativas de desenvolvimento IA
# Agent Instructions — Central de Dashboards VIVA

## Overview

Plataforma unificada de dashboards (Next.js 14 Pages Router) para a rede de franquias VIVA Eventos. Usa **Google Sheets como banco de dados** via API Routes. Dark theme com laranja `#FF6600` como cor primária.

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build (TS/ESLint errors ignored)
npm run lint     # ESLint
```

> Não há framework de testes configurado.

## Architecture

- **Pages Router** (`src/pages/`) — não usa App Router
- **Módulos independentes** em `src/modules/<nome>/` — cada um com `index.ts` (barrel), `components/`, `hooks/`, `types/`, `utils/`, `config/` (opcional), `context/` (opcional)
- **Data layer** — Google Sheets lido/escrito via `src/lib/sheets-client.ts` com cache em memória (`src/lib/cache.ts`)
- **Auth** — JWT + bcrypt, dados de usuários na planilha. `AuthContext` (`src/context/AuthContext.tsx`) é o sistema principal
- **Layout** — módulo `central` (Shell + Header + Sidebar). Todo módulo é renderizado dentro do Shell

### Provider Stack (`_app.tsx`)

```
AuthProvider → SheetsDataProvider → ParametrosProvider → FiltrosCarteiraProvider → VendasFiltersProvider → Shell → Page
```

### Access Levels

| Level | Role | Scope |
|-------|------|-------|
| `0` | Franqueado | Apenas suas unidades |
| `1` | Franqueadora | Todas as unidades |
| `22` | Super Admin | Acesso total |

## Module Structure

Ao criar ou modificar módulos, siga este padrão:

```
src/modules/<nome>/
├── index.ts          # Barrel exports (named exports preferencialmente)
├── components/       # Componentes React do módulo
├── hooks/            # Custom hooks (data fetching, lógica)
├── types/            # Interfaces/tipos TypeScript
├── utils/            # Funções puras auxiliares
├── config/           # Constantes, mapeamentos (opcional)
└── context/          # Context/Provider próprio (opcional)
```

Imports entre módulos usam path alias: `@/modules/<nome>`.

## API Routes

Padrão em `src/pages/api/<domínio>/`:

1. Receber query params (ex: `chunk`, `refresh`)
2. Usar `cache.getOrFetch()` para deduplicação + TTL
3. Chamar Google Sheets via `getAuthenticatedClient()` de `@/lib/sheets-client`
4. Retornar JSON. Usar `Cache-Control` headers para CDN Vercel
5. Dados grandes: leitura em chunks de 60K linhas

## Styling

- **Tailwind CSS 3.4** com dark theme padrão
- Cor primária: `#FF6600` (laranja VIVA)
- Fonte principal: **Poppins**; display: **Orbitron**
- Componentes inline `style={}` são comuns (não é erro — é o padrão do projeto)
- Classes utilitárias globais: `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.badge-*`
- Path alias `@/*` → `./src/*`

Referência completa: [tailwind.config.js](tailwind.config.js) e [src/styles/globals.css](src/styles/globals.css).

## Key Conventions

- **Idioma**: Código e comentários em **português** (pt-BR). Nomes de variáveis/funções misturam pt-BR e inglês
- **Ícones**: Lucide React. Mapeamento centralizado em `src/modules/controle-modulos/config/icones.tsx` via `getLucideIcon()`
- **Módulos dinâmicos**: A sidebar é 100% dinâmica — lê da planilha BASE MODULOS quais dashboards existem, seus grupos, subgrupos, ícones e ordem
- **Permissões**: `useModuloPermissions()` hook controla acesso por módulo. Shell bloqueia renderização até verificar
- **Favoritos**: Armazenados em `localStorage` com key `dashboard-favorites`
- **Google Sheets env vars**: `GOOGLE_SERVICE_ACCOUNT_BASE64`, `GOOGLE_SHEET_ID`

## Pitfalls

- **ESLint/TS errors ignorados no build** — não confie no build para pegar erros. Rode `npm run lint` e verifique tipos manualmente
- **Cache em memória** — reinicia no redeploy. TTLs curtos (1-5 min). Cuidado com dados stale
- **Vercel timeouts** — API routes têm timeout de 10s (padrão) a 60s (config em `vercel.json`). Dados grandes precisam de chunking
- **Dois sistemas de auth** coexistem: `AuthContext` (principal) e HOCs legados em `src/utils/auth.tsx` (`withAuth`, `withAuthAndFranchiser`)
- **Inline styles** são o padrão em vários componentes (Sidebar, modais) — mantenha consistência

## Documentation

Documentação detalhada em [docs/](docs/):
- [docs/START_HERE.md](docs/START_HERE.md) — Ponto de partida
- [docs/MODULE_STRUCTURE_GUIDE.md](docs/MODULE_STRUCTURE_GUIDE.md) — Guia de estrutura de módulos
- [docs/ARCHITECTURE_UNIFICATION.md](docs/ARCHITECTURE_UNIFICATION.md) — Decisões arquiteturais
- [docs/diretrizes.md](docs/diretrizes.md) — Diretrizes de desenvolvimento
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) — Referência rápida
