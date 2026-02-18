/**
 * API Route - Inicializar headers da planilha
 * POST: cria os headers na primeira linha caso não existam
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';

const SPREADSHEET_ID = '1zjb2Z9pvNeJ2I29LPYCT5OVhKNonzze098QrmDH1YLs';
const SHEET_NAME = 'BASE';

const HEADERS = [
  'id',
  'tipo',
  'versao',
  'nome_completo',
  'criado_por',
  'criado_por_nome',
  'modulo',
  'data_criacao',
  'status',
  'link',
  'descricao',
  'release_id',
  'aprovado_por',
  'aprovado_por_nome',
  'data_aprovacao',
  'entregue_por',
  'entregue_por_nome',
  'data_entrega',
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Verificar se já existem headers completos
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:R1`,
    });

    const existingHeaders = response.data.values?.[0];

    // Verificar se os headers estão completos (todos os esperados presentes)
    const headersComplete = existingHeaders && 
      existingHeaders.length >= HEADERS.length && 
      existingHeaders[0] === 'id' &&
      existingHeaders[existingHeaders.length - 1] === HEADERS[HEADERS.length - 1];

    if (headersComplete) {
      return res.status(200).json({ 
        success: true, 
        message: 'Headers já existem',
        headers: existingHeaders 
      });
    }

    // Criar ou atualizar headers (inclui migração de colunas novas)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:R1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [HEADERS],
      },
    });

    return res.status(201).json({ 
      success: true, 
      message: 'Headers criados com sucesso',
      headers: HEADERS 
    });
  } catch (error: any) {
    console.error('[API/branches/init] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
