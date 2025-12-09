/**
 * API Handler para gerenciar clusters por unidade
 * Lê e escreve na aba UNI CONS - COM CACHE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getSheetData, CACHE_TTL, invalidateCache } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:clusters';

interface ErrorResponse {
  error: string;
  message: string;
}

interface UpdateClusterRequest {
  unidade: string;
  cluster: string;
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
        // Verificar se deve ignorar cache (forceRefresh=true)
        const forceRefresh = req.query.forceRefresh === 'true';
        
        if (forceRefresh) {
          // Invalidar cache e buscar dados frescos
          invalidateCache(CACHE_KEY);
          console.log('[Clusters API] Cache invalidado por forceRefresh');
        }
        
        // Usar cache para leitura
        const data = await getSheetData('UNI CONS!A:G', CACHE_KEY, CACHE_TTL.UNI_CONS);
        
        // Desabilitar cache do browser para garantir dados frescos
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.status(200).json(data);
      } catch (error: any) {
        return res.status(500).json({
          error: 'Erro ao buscar dados',
          message: error.message || 'A aba UNI CONS não foi encontrada na planilha',
        });
      }
    }

    if (req.method === 'POST') {
      const { unidade, cluster } = req.body as UpdateClusterRequest;

      if (!unidade || !cluster) {
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Unidade e cluster são obrigatórios',
        });
      }

      const responseGet = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: 'UNI CONS!A:C',
      });

      const rows = responseGet.data.values || [];
      
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === unidade) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({
          error: 'Unidade não encontrada',
          message: `A unidade "${unidade}" não foi encontrada na planilha`,
        });
      }

      const sheetRowNumber = rowIndex + 1;
      const updateRange = `UNI CONS!C${sheetRowNumber}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: updateRange,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[cluster]],
        },
      });

      // IMPORTANTE: Invalidar cache após atualização
      invalidateCache(CACHE_KEY);
      console.log(`[Clusters API] Cache invalidado após atualização de ${unidade}`);

      return res.status(200).json({
        success: true,
        message: `Cluster atualizado com sucesso para ${unidade}`,
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
