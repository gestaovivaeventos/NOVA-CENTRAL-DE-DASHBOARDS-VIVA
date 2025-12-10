/**
 * API Handler para buscar dados do Google Sheets
 * Busca dados da aba DEVERIA COM CACHE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, CACHE_TTL } from '@/lib/sheets-client';

interface ErrorResponse {
  error: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any[][] | ErrorResponse>
) {
  // Apenas GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', message: 'Use GET' });
  }

  try {
    // Buscar dados com cache
    const data = await getSheetData(
      'DEVERIA!A:Z',
      'sheets:deveria',
      CACHE_TTL.DEVERIA
    );

    // Headers de cache para o browser
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return res.status(200).json(data);

  } catch (error: any) {
    console.error('[API sheets] Error:', error.message);
    return res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message || 'Ocorreu um erro ao tentar buscar os dados do Google Sheets',
    });
  }
}
