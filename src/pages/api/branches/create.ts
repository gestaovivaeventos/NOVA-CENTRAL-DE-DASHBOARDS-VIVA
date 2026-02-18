/**
 * API Route - Criar release ou branch na planilha
 * POST: adiciona nova linha na aba BASE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const SPREADSHEET_ID = '1zjb2Z9pvNeJ2I29LPYCT5OVhKNonzze098QrmDH1YLs';
const SHEET_NAME = 'BASE';
const CACHE_KEY = 'branches:data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { values } = req.body;

    if (!values || !Array.isArray(values) || values.length === 0) {
      return res.status(400).json({ error: 'Dados inválidos. Envie { values: [array de valores] }' });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Append na planilha
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values],
      },
    });

    // Invalidar cache
    cache.invalidate(CACHE_KEY);

    return res.status(201).json({ success: true, message: 'Registro criado com sucesso' });
  } catch (error: any) {
    console.error('[API/branches/create] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
