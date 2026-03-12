/**
 * API Route - Buscar dados de controle de módulos
 * GET: retorna todos os módulos configurados na planilha BASE MODULOS
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:data';
const CACHE_TTL = 30 * 1000; // 30s

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const spreadsheetId = process.env.CONTROLE_MODULOS_SPREADSHEET_ID;
    const sheetName = process.env.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

    if (!spreadsheetId) {
      return res.status(500).json({
        error: 'Configuração ausente',
        message: 'CONTROLE_MODULOS_SPREADSHEET_ID não configurado',
      });
    }

    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      cache.invalidate(CACHE_KEY);
    }

    const rows = await getExternalSheetData(
      spreadsheetId,
      `${sheetName}!A:K`,
      CACHE_KEY,
      CACHE_TTL
    );

    // Pular header (primeira linha)
    const dataRows = rows.slice(1);

    const modulos = dataRows
      .filter((row: string[]) => row[0]) // filtrar linhas vazias
      .map((row: string[]) => ({
        moduloId: (row[0] || '').trim(),
        moduloNome: (row[1] || '').trim(),
        moduloPath: (row[2] || '').trim(),
        nvlAcesso: parseInt(row[3] || '0', 10),
        usuariosPermitidos: (row[4] || '').trim()
          ? (row[4] || '').split(',').map((u: string) => u.trim()).filter(Boolean)
          : [],
        ativo: (row[5] || '').toUpperCase() === 'TRUE',
        grupo: (row[6] || '').trim(),
        ordem: parseInt(row[7] || '0', 10),
        icone: (row[8] || '').trim(),
        tipo: ((row[9] || '').trim().toLowerCase() || 'interno') as 'interno' | 'externo',
        urlExterna: (row[10] || '').trim(),
      }));

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({ modulos, cached: true });
  } catch (error: any) {
    console.error('[API/controle-modulos/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
