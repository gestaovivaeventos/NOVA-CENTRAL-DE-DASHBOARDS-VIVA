/**
 * API Handler para gerenciar bônus por unidade
 * Lê e escreve na aba DEVERIA - COM CACHE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSheetData, CACHE_TTL, invalidateCache } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:bonus';

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
        message: 'Variáveis de ambiente do Google não configuradas',
      });
    }

    const credentialsJson = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      try {
        // Usar cache para leitura
        const data = await getSheetData('DEVERIA!A:V', CACHE_KEY, CACHE_TTL.DEVERIA);
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        return res.status(200).json(data);
      } catch (error: any) {
        console.error('Erro ao buscar bônus:', error.message);
        return res.status(500).json({
          error: 'Erro ao buscar dados',
          message: error.message || 'Não foi possível carregar os dados de bônus',
        });
      }
    }

    if (req.method === 'POST') {
      const { unidade, quarter, valor } = req.body;

      if (!unidade || !quarter || valor === undefined) {
        return res.status(400).json({
          error: 'Dados incompletos',
          message: 'unidade, quarter e valor são obrigatórios',
        });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'DEVERIA!A:V',
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return res.status(404).json({
          error: 'Planilha vazia',
          message: 'A planilha DEVERIA está vazia',
        });
      }

      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        const nmUnidade = rows[i][0];
        const quarterDaLinha = rows[i][23]; // Coluna X
        
        if (nmUnidade === unidade && quarterDaLinha === quarter) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({
          error: 'Registro não encontrado',
          message: `Não foi encontrado registro para unidade "${unidade}" no quarter "${quarter}"`,
        });
      }

      const sheetRowNumber = rowIndex + 1;
      const updateRange = `DEVERIA!D${sheetRowNumber}`;

      const numero = parseFloat(String(valor).replace(',', '.'));
      const valorFormatado = String(numero.toFixed(1)).replace('.', ',');

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[valorFormatado]],
        },
      });

      return res.status(200).json({
        success: true,
        message: `Bônus atualizado com sucesso para ${unidade} no ${quarter}º Quarter`,
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
