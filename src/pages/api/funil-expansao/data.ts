/**
 * API Route para buscar dados do Funil de Expansão
 * Fonte: Google Sheets - Aba BASE
 * Usa Service Account autenticado (mesmo padrão Gestão Rede)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData } from '@/lib/sheets-client';

const SPREADSHEET_ID = process.env.FUNIL_EXPANSAO_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.FUNIL_EXPANSAO_SHEET_NAME || 'BASE';
const CACHE_KEY = 'funil-expansao:data';
const CACHE_TTL = 60 * 1000; // 1 minuto

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!SPREADSHEET_ID) {
      throw new Error('FUNIL_EXPANSAO_SPREADSHEET_ID não configurado');
    }

    const rows = await getExternalSheetData(
      SPREADSHEET_ID,
      SHEET_NAME,
      CACHE_KEY,
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ values: rows, cached: true });
  } catch (error: any) {
    console.error('[API/funil-expansao] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
