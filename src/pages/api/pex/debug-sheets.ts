/**
 * API de Debug - Lista todas as abas da planilha
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
    const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

    if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_BASE64) {
      return res.status(500).json({
        error: 'Configuração incompleta',
        message: 'Variáveis de ambiente não configuradas',
      });
    }

    const credentialsJson = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar metadados da planilha para ver todas as abas
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });

    const abas = spreadsheet.data.sheets?.map(sheet => ({
      titulo: sheet.properties?.title,
      id: sheet.properties?.sheetId,
      linhas: sheet.properties?.gridProperties?.rowCount,
      colunas: sheet.properties?.gridProperties?.columnCount,
    })) || [];

    return res.status(200).json({
      spreadsheetId: GOOGLE_SHEET_ID,
      titulo: spreadsheet.data.properties?.title,
      abas: abas,
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Erro ao buscar informações',
      message: error.message,
    });
  }
}
