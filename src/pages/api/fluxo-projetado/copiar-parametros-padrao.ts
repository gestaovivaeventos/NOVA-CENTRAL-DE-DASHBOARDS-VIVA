/**
 * API: Copiar Parâmetros Padrão
 * Copia os parâmetros da aba PARAMETROS PAINEL para a aba PARAMETROS - CALCULADORA FRANQUEADO
 * Apenas as colunas B a K (parâmetros editáveis) são copiadas
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_PADRAO = 'PARAMETROS PAINEL';
const SHEET_CALCULADORA = 'PARAMETROS - CALCULADORA FRANQUEADO';
const CACHE_KEY_CALCULADORA = 'fluxo-projetado:parametros-calculadora';

// Mapeamento das colunas (B a K - colunas 1 a 10, índice 0 = coluna A)
// A = FRANQUIA (não copiar)
// B = INÍCIO PG FEE
// C = % ANTECIPAÇÃO
// D = % FECHAMENTO
// E = Nº PARCELAS ANTECIPAÇÃO
// F = QUEBRA ORÇAMENTO FINAL / MAF INICIAL
// G = DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
// H = DEMAIS RECEITAS
// I = MARGEM
// J = MESES PERMANENCIA NA CARTEIRA
// K = FEE (%)
const COLUNAS = {
  FRANQUIA: 0,        // A
  INICIO_PG_FEE: 1,   // B
  ANTECIPACAO: 2,     // C
  FECHAMENTO: 3,      // D
  PARCELAS: 4,        // E
  QUEBRA: 5,          // F
  DIAS_BAILE: 6,      // G
  DEMAIS_RECEITAS: 7, // H
  MARGEM: 8,          // I
  MESES: 9,           // J
  FEE: 10,            // K
};

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/[R$\s%]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Obtém cliente autenticado do Google Sheets
function getAuthenticatedClient(readonly: boolean = true) {
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
    scopes: readonly 
      ? ['https://www.googleapis.com/auth/spreadsheets.readonly']
      : ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

interface ParametrosPadrao {
  franquia: string;
  inicioPgFee: number;          // B
  percentualAntecipacao: number; // C
  percentualFechamento: number;  // D
  numParcelas: number;           // E
  quebraOrcamento: number;       // F
  diasBaile: number;             // G
  demaisReceitas: number;        // H
  margem: number;                // I
  mesesPermanencia: number;      // J
  feePercentual: number;         // K
}

async function buscarParametrosPadrao(franquia: string): Promise<ParametrosPadrao | null> {
  const auth = getAuthenticatedClient(true);
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba PARAMETROS PAINEL
  const range = `'${SHEET_PADRAO}'!A:K`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  if (!rows || rows.length <= 1) return null;

  // Procura a linha da franquia
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const franquiaRow = String(row[COLUNAS.FRANQUIA] || '').toUpperCase().trim();
    
    if (franquiaRow === franquia.toUpperCase().trim()) {
      return {
        franquia: franquiaRow,
        inicioPgFee: parseNumber(row[COLUNAS.INICIO_PG_FEE]),
        percentualAntecipacao: row[COLUNAS.ANTECIPACAO], // Mantém valor original para preservar formato
        percentualFechamento: row[COLUNAS.FECHAMENTO],
        numParcelas: parseNumber(row[COLUNAS.PARCELAS]),
        quebraOrcamento: row[COLUNAS.QUEBRA],
        diasBaile: parseNumber(row[COLUNAS.DIAS_BAILE]),
        demaisReceitas: row[COLUNAS.DEMAIS_RECEITAS],
        margem: row[COLUNAS.MARGEM],
        mesesPermanencia: parseNumber(row[COLUNAS.MESES]),
        feePercentual: row[COLUNAS.FEE],
      };
    }
  }

  return null;
}

async function encontrarLinhaCalculadora(franquia: string): Promise<number> {
  const auth = getAuthenticatedClient(true);
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba PARAMETROS - CALCULADORA FRANQUEADO
  const range = `'${SHEET_CALCULADORA}'!A:A`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  // Procura a linha da franquia
  for (let i = 1; i < rows.length; i++) {
    const franquiaRow = String(rows[i][0] || '').toUpperCase().trim();
    if (franquiaRow === franquia.toUpperCase().trim()) {
      return i + 1; // +1 porque planilha começa em 1
    }
  }

  return -1;
}

async function copiarParametrosPadrao(franquia: string): Promise<{ success: boolean; message: string }> {
  // 1. Buscar parâmetros da aba PARAMETROS PAINEL
  const parametrosPadrao = await buscarParametrosPadrao(franquia);
  
  if (!parametrosPadrao) {
    throw new Error(`Franquia "${franquia}" não encontrada na aba PARAMETROS PAINEL`);
  }

  // 2. Encontrar linha na aba PARAMETROS - CALCULADORA FRANQUEADO
  const rowIndex = await encontrarLinhaCalculadora(franquia);
  
  if (rowIndex === -1) {
    throw new Error(`Franquia "${franquia}" não encontrada na aba PARAMETROS - CALCULADORA FRANQUEADO`);
  }

  // 3. Atualizar valores na aba PARAMETROS - CALCULADORA FRANQUEADO
  const auth = getAuthenticatedClient(false);
  const sheets = google.sheets({ version: 'v4', auth });

  const updates = [
    {
      range: `'${SHEET_CALCULADORA}'!B${rowIndex}`, // INÍCIO PG FEE
      values: [[parametrosPadrao.inicioPgFee]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!C${rowIndex}`, // % ANTECIPAÇÃO
      values: [[parametrosPadrao.percentualAntecipacao]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!D${rowIndex}`, // % FECHAMENTO
      values: [[parametrosPadrao.percentualFechamento]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!E${rowIndex}`, // Nº PARCELAS ANTECIPAÇÃO
      values: [[parametrosPadrao.numParcelas]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!F${rowIndex}`, // QUEBRA ORÇAMENTO FINAL / MAF INICIAL
      values: [[parametrosPadrao.quebraOrcamento]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!G${rowIndex}`, // DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
      values: [[parametrosPadrao.diasBaile]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!H${rowIndex}`, // DEMAIS RECEITAS
      values: [[parametrosPadrao.demaisReceitas]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!I${rowIndex}`, // MARGEM
      values: [[parametrosPadrao.margem]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!J${rowIndex}`, // MESES PERMANENCIA NA CARTEIRA
      values: [[parametrosPadrao.mesesPermanencia]],
    },
    {
      range: `'${SHEET_CALCULADORA}'!K${rowIndex}`, // FEE (%)
      values: [[parametrosPadrao.feePercentual]],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    },
  });

  // 4. Limpar cache
  cache.invalidate(`${CACHE_KEY_CALCULADORA}:all`);

  return {
    success: true,
    message: `Parâmetros padrão copiados com sucesso para ${franquia}`,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido. Use POST.',
      });
    }

    const { franquia } = req.body;

    if (!franquia) {
      return res.status(400).json({
        success: false,
        error: 'Franquia é obrigatória',
      });
    }

    const resultado = await copiarParametrosPadrao(franquia);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('[API Copiar Parâmetros Padrão] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
