/**
 * API Route para buscar dados da carteira do Google Sheets
 * Aba: HISTORICO
 * Com paginação para respeitar limites do Vercel (4.5MB body, 10s timeout)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

const DEFAULT_PAGE_SIZE = 10000;
const CACHE_TTL = 5 * 60 * 1000;
const SHEET_NAME = 'HISTORICO';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const page = Math.max(0, parseInt(req.query.page as string) || 0);
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE, 15000);
    const forceRefresh = req.query.refresh === 'true';

    const SPREADSHEET_ID = process.env.CARTEIRA_SHEET_ID;
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!API_KEY) {
      throw new Error('Variável NEXT_PUBLIC_GOOGLE_API_KEY não configurada');
    }

    if (!SPREADSHEET_ID) {
      throw new Error('Variável CARTEIRA_SHEET_ID não configurada no .env.local');
    }

    const cacheKey = `carteira:data:p${page}:s${pageSize}`;
    if (forceRefresh) {
      cache.invalidateByPrefix('carteira:data:');
    }

    const result = await cache.getOrFetch(
      cacheKey,
      async () => {
        const startRow = page * pageSize + 2;
        const endRow = startRow + pageSize - 1;

        const headerRange = encodeURIComponent(`${SHEET_NAME}!1:1`);
        const dataRange = encodeURIComponent(`${SHEET_NAME}!${startRow}:${endRow}`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchGet?ranges=${headerRange}&ranges=${dataRange}&key=${API_KEY}`;

        console.log(`[API/carteira] Fetching page ${page} (rows ${startRow}-${endRow})`);
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao buscar dados da carteira: ${errorText}`);
        }

        const data = await response.json();
        const headers = data.valueRanges?.[0]?.values?.[0] || [];
        const rows = data.valueRanges?.[1]?.values || [];

        return { headers, rows };
      },
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      headers: result.headers,
      values: result.rows,
      pagination: {
        page,
        pageSize,
        rowsInPage: result.rows.length,
        hasMore: result.rows.length === pageSize,
      },
    });

  } catch (error: any) {
    console.error('[API/carteira/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
