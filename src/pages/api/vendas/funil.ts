/**
 * API Route para buscar dados do funil do Google Sheets
 * Com cache centralizado e deduplicação de requests
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

// TTL: 5 minutos para dados do funil
const CACHE_KEY = 'vendas:funil';
const CACHE_TTL = 5 * 60 * 1000;

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
        const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_FUNIL || '1t67xdPLHB34pZw8WzBUphGRqFye0ZyrTLvDhC7jbVEc';
        const SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_FUNIL || 'base';
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!API_KEY) {
          throw new Error('Variáveis de ambiente do Google Sheets não configuradas');
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        
        console.log('[Cache] Fetching: vendas:funil');
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
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return res.status(200).json({ values: rows, cached: true });

  } catch (error: any) {
    console.error('[API/funil] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
