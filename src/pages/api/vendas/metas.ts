/**
 * API Route para buscar dados de metas do Google Sheets
 * Com cache centralizado e deduplicação de requests
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

// TTL: 10 minutos para metas (mudam pouco)
const CACHE_KEY = 'vendas:metas';
const CACHE_TTL = 10 * 60 * 1000;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar se é refresh forçado
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      cache.invalidate(CACHE_KEY);
    }

    // Usar cache com deduplicação
    const rows = await cache.getOrFetch(
      CACHE_KEY,
      async () => {
        const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_METAS;
        const SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_METAS || 'metas';
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!SPREADSHEET_ID || !API_KEY) {
          throw new Error('Variáveis de ambiente do Google Sheets não configuradas');
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        
        console.log('[Cache] Fetching: vendas:metas');
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao buscar dados: ${errorText}`);
        }

        const data = await response.json();
        return data.values || [];
      },
      CACHE_TTL
    );

    // Headers de cache para o browser
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    
    return res.status(200).json({ values: rows, cached: true });

  } catch (error: any) {
    console.error('[API/metas] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
