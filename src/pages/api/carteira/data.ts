/**
 * API Route para buscar dados da carteira do Google Sheets
 * Aba: HISTORICO
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

// TTL: 5 minutos para dados de carteira
const CACHE_KEY = 'carteira:data';
const CACHE_TTL = 5 * 60 * 1000;

// ID da planilha via variável de ambiente
const SPREADSHEET_ID = process.env.CARTEIRA_SHEET_ID;
const SHEET_NAME = 'HISTORICO';

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
        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!API_KEY) {
          throw new Error('Variável NEXT_PUBLIC_GOOGLE_API_KEY não configurada');
        }

        if (!SPREADSHEET_ID) {
          throw new Error('Variável CARTEIRA_SHEET_ID não configurada no .env.local');
        }

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;
        
        console.log('[Cache] Fetching: carteira:data');
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao buscar dados da carteira: ${errorText}`);
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
    console.error('[API/carteira/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
