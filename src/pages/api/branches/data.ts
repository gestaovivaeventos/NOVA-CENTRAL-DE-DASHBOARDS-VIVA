/**
 * API Route - Buscar dados de branches/releases do Google Sheets
 * GET: retorna todos os dados
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const SPREADSHEET_ID = '1zjb2Z9pvNeJ2I29LPYCT5OVhKNonzze098QrmDH1YLs';
const SHEET_NAME = 'BASE';
const CACHE_KEY = 'branches:data';
const CACHE_TTL = 30 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      cache.invalidate(CACHE_KEY);
    }

    const rows = await getExternalSheetData(
      SPREADSHEET_ID,
      `${SHEET_NAME}!A:L`,
      CACHE_KEY,
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({ values: rows, cached: true });
  } catch (error: any) {
    console.error('[API/branches/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
