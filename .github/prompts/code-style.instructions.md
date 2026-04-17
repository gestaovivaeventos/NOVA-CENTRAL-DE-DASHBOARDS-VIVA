# Instrução: Estilo de Código — Central VIVA

## Idioma

- Comentários, mensagens de erro e labels de UI em **português (pt-BR)**
- Nomes de variáveis/funções podem misturar pt-BR e inglês (padrão do projeto)
- Exemplos válidos: `fetchGruposInfo`, `toggleFavorite`, `setoresSelecionados`, `handleSave`

## Componentes

- **Inline styles** (`style={{}}`) são aceitos e comuns no projeto (Sidebar, modais, dashboards). Manter consistência com o componente ao redor
- **Tailwind** para layout e utilitários genéricos
- Cor primária: `#FF6600`. Dark bg: `#1a1d21`, `#212529`
- Fonte: `'Poppins', sans-serif`

## Exports

- Usar **named exports** em barrel files (`index.ts`), não default exports
- Exemplo: `export { MeuComponente } from './MeuComponente';`
- Wildcard `export * from './hooks'` é aceito para módulos simples

## Ícones

- Usar **Lucide React** para ícones novos
- Para ícones dinâmicos (vindos da planilha), usar `getLucideIcon()` de `@/modules/controle-modulos/config/icones`
- Não adicionar SVGs inline novos — usar Lucide

## Tipos

- Arquivo de tipos em `types/<nome>.types.ts` dentro do módulo
- Tipos globais em `src/types/`
- Usar `interface` para objetos, `type` para unions/intersections

## API Routes

- Sempre cachear com `cache.getOrFetch()`
- Suportar `?refresh=true`
- Retornar erros em português
- Usar `getAuthenticatedClient()` de `@/lib/sheets-client`

## Não fazer

- Não usar App Router (projeto usa Pages Router)
- Não adicionar dependências sem necessidade clara
- Não criar arquivos `.css` por módulo — usar Tailwind ou inline styles
- Não usar `default export` em componentes de módulo (exceto páginas em `src/pages/`)
