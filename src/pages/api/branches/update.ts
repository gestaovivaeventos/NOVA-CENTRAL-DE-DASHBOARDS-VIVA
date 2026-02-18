/**
 * API Route - Atualizar status, link ou descrição de uma release/branch
 * PUT: atualiza uma linha existente na aba BASE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient, getExternalSheetData } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const SPREADSHEET_ID = '1zjb2Z9pvNeJ2I29LPYCT5OVhKNonzze098QrmDH1YLs';
const SHEET_NAME = 'BASE';
const CACHE_KEY = 'branches:data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id, field, value } = req.body;

    if (!id || !field || value === undefined) {
      return res.status(400).json({ 
        error: 'Dados inválidos. Envie { id, field, value }' 
      });
    }

    // Mapear field para índice da coluna
    const fieldToCol: Record<string, number> = {
      'modulo': 6,              // Coluna G (índice 6)
      'status': 8,              // Coluna I (índice 8)
      'link': 9,                // Coluna J (índice 9)
      'descricao': 10,          // Coluna K (índice 10)
      'aprovado_por': 12,       // Coluna M (índice 12)
      'aprovado_por_nome': 13,  // Coluna N (índice 13)
      'data_aprovacao': 14,     // Coluna O (índice 14)
      'entregue_por': 15,       // Coluna P (índice 15)
      'entregue_por_nome': 16,  // Coluna Q (índice 16)
      'data_entrega': 17,       // Coluna R (índice 17)
    };

    const colIndex = fieldToCol[field];
    if (colIndex === undefined) {
      return res.status(400).json({ error: `Campo inválido: ${field}` });
    }

    // Invalidar cache primeiro para buscar dados frescos
    cache.invalidate(CACHE_KEY);

    // Buscar dados frescos para encontrar a linha
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:R`,
    });

    const rows = response.data.values || [];
    
    // Encontrar a linha com o ID correspondente
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === id) {
        rowIndex = i + 1; // +1 porque sheets é 1-based
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Registro com id "${id}" não encontrado` });
    }

    // Coluna letter (A=0, B=1, ..., K=10)
    const colLetter = String.fromCharCode(65 + colIndex);

    // Atualizar apenas a célula específica
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!${colLetter}${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    // Invalidar cache após escrita
    cache.invalidate(CACHE_KEY);

    return res.status(200).json({ success: true, message: 'Campo atualizado com sucesso' });
  } catch (error: any) {
    console.error('[API/branches/update] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
