/**
 * API Route - Atualizar um módulo na planilha BASE MODULOS
 * PUT: atualiza uma linha existente
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:data';

// Mapear campos para índice de coluna
const FIELD_TO_COL: Record<string, number> = {
  modulo_id: 0,        // A
  modulo_nome: 1,      // B
  modulo_path: 2,      // C
  nvl_acesso: 3,       // D
  usuarios_permitidos: 4, // E
  ativo: 5,            // F
  grupo: 6,            // G
  ordem: 7,            // H
  icone: 8,            // I
  tipo: 9,             // J
  url_externa: 10,     // K
  subgrupo: 11,        // L
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
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

    const { moduloId, field, value } = req.body;

    if (!moduloId || !field || value === undefined) {
      return res.status(400).json({
        error: 'Dados inválidos. Envie { moduloId, field, value }',
      });
    }

    const colIndex = FIELD_TO_COL[field];
    if (colIndex === undefined) {
      return res.status(400).json({ error: `Campo inválido: ${field}` });
    }

    // Invalidar cache para buscar dados frescos
    cache.invalidate(CACHE_KEY);

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:L`,
    });

    const rows = response.data.values || [];

    // Encontrar a linha com o moduloId
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || '').trim() === moduloId) {
        rowIndex = i + 1; // 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Módulo "${moduloId}" não encontrado` });
    }

    const colLetter = String.fromCharCode(65 + colIndex);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!${colLetter}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[value]] },
    });

    // Invalidar cache após escrita
    cache.invalidate(CACHE_KEY);

    return res.status(200).json({ success: true, message: 'Módulo atualizado com sucesso' });
  } catch (error: any) {
    console.error('[API/controle-modulos/update] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
