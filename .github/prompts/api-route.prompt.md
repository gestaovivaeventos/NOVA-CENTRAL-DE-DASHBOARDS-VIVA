# Skill: Criar API Route

Quando o usuário pedir para criar uma nova API route, siga o padrão do projeto.

## Padrão

Todas as API routes ficam em `src/pages/api/<domínio>/`. Usam Google Sheets como data source com cache em memória.

## Template Base

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const CACHE_KEY = '<dominio>_<recurso>';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const refresh = req.query.refresh === 'true';

    if (refresh) {
      cache.invalidate(CACHE_KEY);
    }

    const data = await cache.getOrFetch(CACHE_KEY, async () => {
      const sheets = await getAuthenticatedClient();
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: '<ABA>!A:Z', // Ajustar range
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      const headers = rows[0];
      return rows.slice(1).map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((h: string, i: number) => {
          obj[h] = row[i] || '';
        });
        return obj;
      });
    }, CACHE_TTL);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ data });
  } catch (error) {
    console.error(`[API ${CACHE_KEY}]`, error);
    return res.status(500).json({ error: 'Erro interno ao buscar dados' });
  }
}
```

## Para dados grandes (>10K linhas)

Usar chunking:

```ts
const CHUNK_SIZE = 60000;
const chunk = parseInt(req.query.chunk as string) || 0;
const startRow = 2 + chunk * CHUNK_SIZE;
const endRow = startRow + CHUNK_SIZE - 1;
const range = `<ABA>!A${startRow}:Z${endRow}`;
```

Retornar `{ headers, values, hasMore: values.length === CHUNK_SIZE }`.

## Para escrita

```ts
import { updateSheetData } from '@/lib/sheets-client';

// Dentro do handler (método POST/PUT):
await updateSheetData('<ABA>!A1:Z1', [valores], CACHE_KEY);
```

## Regras

- Sempre usar `cache.getOrFetch()` para leitura
- Suportar `?refresh=true` para invalidar cache
- Usar `Cache-Control` header para CDN Vercel
- Respeitar timeouts do Vercel (10s padrão, até 60s com config em `vercel.json`)
- Logar erros com `console.error` e contexto
- Retornar mensagens de erro em português
