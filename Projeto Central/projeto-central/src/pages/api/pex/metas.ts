/**
 * API Handler para gerenciar metas por cluster
 * Lê e escreve na aba METAS POR CLUSTER - COM CACHE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSheetData, CACHE_TTL, invalidateCache } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:metas';

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
        const data = await getSheetData('METAS POR CLUSTER!A:H', CACHE_KEY, CACHE_TTL.METAS);
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
        return res.status(200).json(data);
      } catch (error: any) {
        // Tentar nome alternativo
        try {
          const data = await getSheetData('METASPORCLUSTER!A:H', CACHE_KEY, CACHE_TTL.METAS);
          res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
          return res.status(200).json(data);
        } catch (altError: any) {
          return res.status(500).json({
            error: 'Erro ao buscar dados',
            message: error.message || 'A aba METAS POR CLUSTER não foi encontrada',
          });
        }
      }
    }

    if (req.method === 'POST') {
      const { cluster, coluna, valor } = req.body;

      if (!cluster || !coluna || valor === undefined) {
        return res.status(400).json({
          error: 'Dados incompletos',
          message: 'cluster, coluna e valor são obrigatórios',
        });
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'METAS POR CLUSTER!A:H',
      });

      const rows = response.data.values || [];
      
      if (rows.length === 0) {
        return res.status(404).json({
          error: 'Planilha vazia',
          message: 'A planilha METAS POR CLUSTER está vazia',
        });
      }

      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === cluster) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({
          error: 'Cluster não encontrado',
          message: `O cluster "${cluster}" não foi encontrado na planilha`,
        });
      }

      const colunaMap: Record<string, string> = {
        'VVR': 'B',
        '% ATIGIMENTO MAC': 'C',
        '% ENDIVIDAMENTO': 'D',
        'NPS': 'E',
        '% MC ENTREGA': 'F',
        'E-NPS': 'G',
        'CONFORMIDADE': 'H'
      };

      const columnLetter = colunaMap[coluna];
      
      if (!columnLetter) {
        return res.status(400).json({
          error: 'Coluna inválida',
          message: `A coluna "${coluna}" não é válida`,
        });
      }

      const sheetRowNumber = rowIndex + 1;
      const updateRange = `METAS POR CLUSTER!${columnLetter}${sheetRowNumber}`;

      let valorFormatado: string;
      let valueInputOption: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED';
      
      if (coluna === 'VVR') {
        const numero = parseFloat(String(valor).replace(',', '.'));
        const valorFixo = numero.toFixed(2);
        const [parteInteira, parteDecimal] = valorFixo.split('.');
        const parteInteiraFormatada = parteInteira.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        valorFormatado = `R$ ${parteInteiraFormatada},${parteDecimal}`;
        valueInputOption = 'RAW';
      } else if (coluna.includes('%') || coluna === 'CONFORMIDADE') {
        const numero = parseFloat(String(valor).replace(',', '.'));
        const valorFixo = numero.toFixed(2);
        const valorComVirgula = valorFixo.replace('.', ',');
        valorFormatado = `${valorComVirgula}%`;
        valueInputOption = 'USER_ENTERED';
      } else {
        const numero = parseFloat(String(valor).replace(',', '.'));
        valorFormatado = String(Math.round(numero));
        valueInputOption = 'USER_ENTERED';
      }

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: updateRange,
        valueInputOption: valueInputOption,
        requestBody: {
          values: [[valorFormatado]],
        },
      });

      return res.status(200).json({
        success: true,
        message: `Meta atualizada com sucesso para ${cluster} na coluna ${coluna}`,
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
