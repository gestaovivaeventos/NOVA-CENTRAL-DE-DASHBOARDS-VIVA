/**
 * API Handler para gerenciar pesos por quarter
 * Lê e escreve na aba CRITERIOS RANKING - COM CACHE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSheetData, CACHE_TTL, invalidateCache } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:pesos';

interface ErrorResponse {
  error: string;
  message: string;
}

interface UpdatePesoRequest {
  indicador: string;
  quarter: '1' | '2' | '3' | '4';
  peso: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any[][] | { success: boolean; message: string } | ErrorResponse>
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

    const serviceAccountBuffer = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
    const serviceAccount = JSON.parse(serviceAccountBuffer.toString('utf-8'));
    const { client_email, private_key } = serviceAccount;

    const auth = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      try {
        // Usar cache para leitura
        const data = await getSheetData('CRITERIOS RANKING!B:F', CACHE_KEY, CACHE_TTL.CRITERIOS);
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
        return res.status(200).json(data);
      } catch (error: any) {
        return res.status(500).json({
          error: 'Erro ao buscar dados',
          message: error.message || 'A aba CRITERIOS RANKING não foi encontrada na planilha',
        });
      }
    }

    if (req.method === 'POST') {
      const { indicador, quarter, peso } = req.body as UpdatePesoRequest;

      if (!indicador || !quarter || peso === undefined) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Indicador, quarter e peso são obrigatórios',
        });
      }

      const responseGet = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'CRITERIOS RANKING!B:F',
      });

      const rows = responseGet.data.values || [];
      
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === indicador) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({
          error: 'Indicador não encontrado',
          message: `O indicador "${indicador}" não foi encontrado na planilha`,
        });
      }

      const colunaMap: Record<string, string> = {
        '1': 'C',
        '2': 'D',
        '3': 'E',
        '4': 'F'
      };

      const coluna = colunaMap[quarter];
      const sheetRowNumber = rowIndex + 1;
      const updateRange = `CRITERIOS RANKING!${coluna}${sheetRowNumber}`;
      const pesoFormatado = String(peso).replace('.', ',');

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[pesoFormatado]],
        },
      });

      return res.status(200).json({
        success: true,
        message: `Peso atualizado com sucesso para ${indicador} no Quarter ${quarter}`,
      });
    }

    return res.status(405).json({
      error: 'Método não permitido',
      message: 'Apenas GET e POST são permitidos',
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Ocorreu um erro ao processar a requisição',
    });
  }
}
