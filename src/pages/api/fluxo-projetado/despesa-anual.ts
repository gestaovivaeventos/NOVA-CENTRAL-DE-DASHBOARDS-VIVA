/**
 * API: Despesa Anual do Fluxo Projetado
 * Busca e atualiza a Despesa Fixa (coluna AK) da aba PARAMETROS PAINEL
 * O valor é armazenado diretamente como despesa anual
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'PARAMETROS PAINEL';

// Coluna AK = índice 36 (A=0, B=1, ..., AK=36)
const COLUNA_DESPESA_FIXA_MENSAL = 36;

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  
  const strValue = String(value);
  
  // Detecta formato brasileiro (ex: 96.504,73) vs americano (ex: 96,504.73)
  // Formato BR: ponto como milhar, vírgula como decimal
  // Formato US: vírgula como milhar, ponto como decimal
  const hasComma = strValue.includes(',');
  const hasDot = strValue.includes('.');
  
  let cleaned = strValue.replace(/[^\d.,\-]/g, '');
  
  if (hasComma && hasDot) {
    // Ambos existem - determinar qual é o separador decimal
    const lastComma = strValue.lastIndexOf(',');
    const lastDot = strValue.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato BR: 96.504,73 → vírgula é decimal
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US: 96,504.73 → ponto é decimal
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Só tem vírgula - assume formato BR onde vírgula é decimal
    cleaned = cleaned.replace(',', '.');
  }
  // Se só tem ponto, já está no formato correto para parseFloat
  
  return parseFloat(cleaned) || 0;
}

// Obtém cliente autenticado do Google Sheets
function getAuthenticatedClient() {
  const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

  if (!GOOGLE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado');
  }

  const serviceAccountBuffer = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
  const serviceAccount = JSON.parse(serviceAccountBuffer.toString('utf-8'));
  const { client_email, private_key } = serviceAccount;

  if (!client_email || !private_key) {
    throw new Error('Service Account inválido');
  }

  return new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

// Busca a despesa fixa de uma franquia
async function getDespesaFixa(franquia: string): Promise<{ despesaAnual: number; rowIndex: number } | null> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca coluna A (franquias) e coluna AK (despesa fixa)
  const range = `'${SHEET_NAME}'!A:AK`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  // Procura a franquia (começando da linha 2, índice 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] && row[0].toString().toUpperCase() === franquia.toUpperCase()) {
      const despesaAnual = parseNumber(row[COLUNA_DESPESA_FIXA_MENSAL]);
      return {
        despesaAnual,
        rowIndex: i + 1, // +1 porque Google Sheets é 1-indexed
      };
    }
  }

  return null;
}

// Atualiza a despesa fixa de uma franquia
async function updateDespesaFixa(franquia: string, despesaAnual: number): Promise<{ success: boolean; rowIndex?: number }> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Primeiro, busca para encontrar a linha da franquia
  const range = `'${SHEET_NAME}'!A:A`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  // Encontra o índice da linha da franquia
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toString().toUpperCase() === franquia.toUpperCase()) {
      rowIndex = i + 1; // +1 porque Google Sheets é 1-indexed
      break;
    }
  }

  if (rowIndex === -1) {
    return { success: false };
  }

  // Atualiza apenas a coluna AK da linha encontrada
  const updateRange = `'${SHEET_NAME}'!AK${rowIndex}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: updateRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[despesaAnual]] },
  });

  return { success: true, rowIndex };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // GET - Busca a despesa fixa de uma franquia
    if (req.method === 'GET') {
      const { franquia } = req.query;
      
      if (!franquia || typeof franquia !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Franquia é obrigatória',
        });
      }

      const resultado = await getDespesaFixa(franquia);
      
      if (!resultado) {
        return res.status(404).json({
          success: false,
          error: `Franquia "${franquia}" não encontrada`,
        });
      }
      
      return res.status(200).json({
        success: true,
        data: resultado,
      });
    }

    // PUT - Atualiza a despesa fixa de uma franquia
    if (req.method === 'PUT') {
      const { franquia, despesaAnual } = req.body;
      
      if (!franquia || typeof franquia !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Franquia é obrigatória',
        });
      }

      if (typeof despesaAnual !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Despesa anual é obrigatória e deve ser um número',
        });
      }

      const result = await updateDespesaFixa(franquia, despesaAnual);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: `Franquia "${franquia}" não encontrada`,
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Despesa fixa da franquia "${franquia}" atualizada com sucesso`,
        rowIndex: result.rowIndex,
        despesaAnual,
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
    });
  } catch (error) {
    console.error('[API Despesa Anual] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
}
