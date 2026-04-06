/**
 * API Route para buscar dados do funil do Google Sheets
 * Busca em chunk (15K linhas - funil tem mais colunas) para caber no Vercel Hobby (10s)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CHUNK_SIZE = 15000;
const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const chunk = Math.max(0, parseInt(req.query.chunk as string) || 0);
    const forceRefresh = req.query.refresh === 'true';

    const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_FUNIL;
    const SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_FUNIL || 'base';

    if (!SPREADSHEET_ID) {
      throw new Error('Variável NEXT_PUBLIC_SPREADSHEET_FUNIL não configurada');
    }

    const cacheKey = `vendas:funil:c${chunk}`;
    if (forceRefresh) {
      cache.invalidateByPrefix('vendas:funil:');
    }

    const result = await cache.getOrFetch(
      cacheKey,
      async () => {
        const auth = getAuthenticatedClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const startRow = chunk * CHUNK_SIZE + 2;
        const endRow = startRow + CHUNK_SIZE - 1;

        try {
          const response = await sheets.spreadsheets.values.batchGet({
            spreadsheetId: SPREADSHEET_ID,
            ranges: [`${SHEET_NAME}!1:1`, `${SHEET_NAME}!${startRow}:${endRow}`],
          });

          const headers = response.data.valueRanges?.[0]?.values?.[0] || [];
          const rows = response.data.valueRanges?.[1]?.values || [];

          console.log(`[API/funil] chunk ${chunk}: ${rows.length} rows`);
          return { headers, rows, count: rows.length };
        } catch (err: any) {
          if (err.message?.includes('exceeds grid limits')) {
            const headerResp = await sheets.spreadsheets.values.get({
              spreadsheetId: SPREADSHEET_ID,
              range: `${SHEET_NAME}!1:1`,
            });
            return { headers: headerResp.data.values?.[0] || [], rows: [], count: 0 };
          }
          throw err;
        }
      },
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      headers: result.headers,
      values: result.rows,
      chunk,
      hasMore: result.count === CHUNK_SIZE,
    });

  } catch (error: any) {
    console.error('[API/funil] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
