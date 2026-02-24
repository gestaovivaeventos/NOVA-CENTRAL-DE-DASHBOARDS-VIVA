/**
 * API Route para inativar projeto na planilha
 * POST /api/projetos/inactivate
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SPREADSHEET_ID = '182mM7NKo8IxLe1QKP7kSvAP-pNTZQbWPEaLje7oE7s4';
const SHEET_NAME = 'Projetos';

function getAuthenticatedClient() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurada');
  const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, inativadoPor } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Campo obrigatório: id' });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar ID e localizar linha
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:U`,
    });

    const rows = existing.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === String(id)) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Projeto ID ${id} não encontrado` });
    }

    const now = formatDate(new Date());
    const sheetRow = rowIndex + 1;

    // Atualizar colunas: S=INATIVADO POR, T=DATA INATIVAÇÃO, U=STATUS
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!S${sheetRow}:U${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[inativadoPor || '', now, 'Inativo']],
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Projeto inativado com sucesso',
    });

  } catch (error: any) {
    console.error('[API projetos/inactivate] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao inativar projeto',
      message: error.message,
    });
  }
}
