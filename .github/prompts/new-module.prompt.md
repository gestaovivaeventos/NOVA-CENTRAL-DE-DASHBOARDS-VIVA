# Skill: Criar Novo Módulo

Quando o usuário pedir para criar um novo módulo, siga este scaffolding.

## Parâmetros

- `nome`: Nome do módulo (kebab-case, ex: `meu-modulo`)
- `descricao`: Breve descrição do propósito

## Estrutura a criar

```
src/modules/<nome>/
├── index.ts
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
├── types/
│   └── <nome>.types.ts
└── utils/
    └── index.ts
```

## Templates

### `src/modules/<nome>/index.ts`
```ts
export * from './components';
export * from './hooks';
export * from './types/<nome>.types';
export * from './utils';
```

### `src/modules/<nome>/types/<nome>.types.ts`
```ts
// Tipos do módulo <nome>
export interface <NomePascalCase>Data {
  // TODO: definir campos
}
```

### `src/modules/<nome>/hooks/index.ts`
```ts
// Hooks do módulo <nome>
```

### `src/modules/<nome>/components/index.ts`
```ts
// Componentes do módulo <nome>
```

### `src/modules/<nome>/utils/index.ts`
```ts
// Utilitários do módulo <nome>
```

## Página (se necessário)

Criar `src/pages/<nome>/index.tsx`:

```tsx
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function <NomePascalCase>Page() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-dark-text mb-6">
        {/* Título do módulo */}
      </h1>
    </div>
  );
}
```

## API Route (se necessário)

Seguir o padrão da skill `api-route`.

## Checklist pós-criação

1. Verificar se o módulo precisa ser registrado na planilha BASE MODULOS
2. Criar barrel exports em cada `index.ts`
3. Verificar tipagem com `npm run lint`
