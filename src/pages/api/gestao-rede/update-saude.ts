/**
 * API para atualizar o status de saúde de uma franquia
 * Permite mover franquias em UTI para UTI RECUPERAÇÃO ou UTI REPASSE
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// Planilha específica de Gestão Rede - via variáveis de ambiente
const SPREADSHEET_ID = process.env.GESTAO_REDE_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.GESTAO_REDE_SHEET_NAME || 'BASE GESTAO REDE';
const CACHE_KEY = 'gestao-rede:data';

// Coluna de saúde é a coluna I (índice 8, ou seja, coluna 9)
const SAUDE_COLUMN_INDEX = 8;
const SAUDE_COLUMN_LETTER = 'I';

interface UpdateSaudeRequest {
  chaveData: string;  // Identificador único da linha (coluna A)
  novoStatus: 'UTI_RECUPERACAO' | 'UTI_REPASSE';
}

interface UpdateSaudeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Obtém cliente autenticado do Google Sheets
 */
async function getAuthClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf-8')
  );

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // Autorizar o cliente
  await auth.authorize();

  return auth;
}

/**
 * Encontra a linha pelo chaveData
 */
async function findRowByChaveData(sheets: ReturnType<typeof google.sheets>, chaveData: string): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A:A`,
  });

  const values = response.data.values || [];
  
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === chaveData) {
      return i + 1; // Google Sheets usa índice 1-based
    }
  }

  return null;
}

/**
 * Handler da API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateSaudeResponse>
) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.',
    });
  }

  try {
    const { chaveData, novoStatus } = req.body as UpdateSaudeRequest;

    // Validar entrada
    if (!chaveData || !novoStatus) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: chaveData e novoStatus',
      });
    }

    // Validar status permitidos
    if (!['UTI_RECUPERACAO', 'UTI_REPASSE'].includes(novoStatus)) {
      return res.status(400).json({
        success: false,
        error: 'novoStatus deve ser UTI_RECUPERACAO ou UTI_REPASSE',
      });
    }

    // Mapear para valor da planilha
    const valorPlanilha = novoStatus === 'UTI_RECUPERACAO' ? 'UTI RECUPERAÇÃO' : 'UTI REPASSE';

    console.log('[API update-saude] Atualizando saúde:', { chaveData, novoStatus, valorPlanilha });

    // Autenticar
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Encontrar a linha
    const rowNumber = await findRowByChaveData(sheets, chaveData);

    if (!rowNumber) {
      return res.status(404).json({
        success: false,
        error: `Franquia com chaveData "${chaveData}" não encontrada`,
      });
    }

    console.log('[API update-saude] Linha encontrada:', rowNumber);

    // Atualizar a célula de saúde
    const range = `'${SHEET_NAME}'!${SAUDE_COLUMN_LETTER}${rowNumber}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[valorPlanilha]],
      },
    });

    console.log('[API update-saude] Célula atualizada:', range);

    // Invalidar cache para forçar recarregamento dos dados
    cache.invalidate(CACHE_KEY);

    return res.status(200).json({
      success: true,
      message: `Saúde atualizada para ${valorPlanilha}`,
    });

  } catch (error) {
    console.error('[API update-saude] Erro:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar saúde',
    });
  }
}
