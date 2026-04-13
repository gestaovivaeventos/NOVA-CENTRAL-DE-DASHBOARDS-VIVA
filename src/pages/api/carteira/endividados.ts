/**
 * API Route para buscar dados de integrantes endividados
 * Planilha: CARTEIRA_ENDIVIDADOS_SPREADSHEET_ID
 * Aba: HISTORICO (coluna Q = integrantes_endividados)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_TTL = 5 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const forceRefresh = req.query.refresh === 'true';

    const SPREADSHEET_ID = process.env.CARTEIRA_ENDIVIDADOS_SPREADSHEET_ID;
    const SHEET_NAME = process.env.CARTEIRA_ENDIVIDADOS_SHEET_HISTORICO || 'HISTORICO';

    if (!SPREADSHEET_ID) {
      throw new Error('Variável CARTEIRA_ENDIVIDADOS_SPREADSHEET_ID não configurada no .env.local');
    }

    const cacheKey = 'carteira:endividados';
    if (forceRefresh) {
      cache.invalidateByPrefix('carteira:endividados');
    }

    const result = await cache.getOrFetch(
      cacheKey,
      async () => {
        const auth = getAuthenticatedClient();
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}`,
        });

        const rows = response.data.values || [];
        if (rows.length < 2) return { headers: [], data: [] };

        const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
        const dataRows = rows.slice(1);

        return { headers, data: dataRows, count: dataRows.length };
      },
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return res.status(200).json({
      headers: result.headers,
      values: result.data,
      count: result.count || 0,
    });

  } catch (error: any) {
    console.error('[API/carteira/endividados] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
