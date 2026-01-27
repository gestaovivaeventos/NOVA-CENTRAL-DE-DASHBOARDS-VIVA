/**
 * API: Parâmetros Calculadora Franqueado
 * Busca e atualiza dados da aba "PARAMETROS - CALCULADORA FRANQUEADO"
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'PARAMETROS - CALCULADORA FRANQUEADO';
const CACHE_KEY = 'fluxo-projetado:parametros-calculadora';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Mapeamento das colunas da aba PARAMETROS - CALCULADORA FRANQUEADO
// A = FRANQUIA
// B = INÍCIO PG FEE (DIAS APÓS VENC. 1ª BOLETO FUNDO)
// C = % ANTECIPAÇÃO
// D = % FECHAMENTO
// E = Nº PARCELAS ANTECIPAÇÃO
// F = QUEBRA ORÇAMENTO FINAL / MAF INICIAL
// G = DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
// H = DEMAIS RECEITAS
// I = MARGEM
// J = MESES PERMANÊNCIA NA CARTEIRA
// K = FEE (%)
// L = VVR
// AK = DESPESA ANUAL
const COLUNAS = {
  FRANQUIA: 0,                      // A
  INICIO_PG_FEE: 1,                 // B - não usado na calculadora
  PERCENTUAL_ANTECIPACAO: 2,        // C
  PERCENTUAL_FECHAMENTO: 3,         // D - não usado na calculadora
  NR_PARCELAS_ANTECIPACAO: 4,       // E
  QUEBRA_ORCAMENTO_FINAL: 5,        // F
  DIAS_INICIO_ANTECIPACAO: 6,       // G
  DEMAIS_RECEITAS: 7,               // H
  MARGEM: 8,                        // I
  TEMPO_MEDIO_FUNDOS_CARTEIRA: 9,   // J
  FEE_PERCENTUAL: 10,               // K
  VVR: 11,                          // L
  DESPESA_ANUAL: 36,                // AK - DESPESA ANUAL
};

interface ParametrosCalculadora {
  franquia: string;
  inicioPgFee: number;                 // B - INÍCIO PG FEE (DIAS APÓS VENC. 1º BOLETO FUNDO)
  percentualAntecipacao: number;       // C - % ANTECIPAÇÃO
  percentualFechamento: number;        // D - % FECHAMENTO (100% - percentualAntecipacao)
  nrParcelasAntecipacao: number;       // E - Nº PARCELAS ANTECIPAÇÃO
  quebraOrcamentoFinal: number;        // F - QUEBRA ORÇAMENTO FINAL / MAF INICIAL
  diasBaileUltimaParcela: number;      // G - DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
  demaisReceitas: number;              // H - DEMAIS RECEITAS
  margem: number;                      // I - MARGEM
  tempoMedioFundosCarteira: number;    // J - MESES PERMANÊNCIA NA CARTEIRA
  feePercentual: number;               // K - FEE (%)
  vvr: number;                         // L - META VVR VENDAS
  despesaAnual: number;                // AK - DESPESA ANUAL
}

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  // Remove R$, espaços e trata formato brasileiro
  const cleaned = String(value).replace(/[R$\s%]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parsePercentual(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const str = String(value).replace(/[%\s]/g, '').replace(',', '.');
  let num = parseFloat(str) || 0;
  // Se o valor está entre 0 e 1 (ex: 0.6 para 60%), converte para percentual
  if (num > 0 && num < 1) {
    num = num * 100;
  }
  return num;
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

async function getParametrosCalculadora(franquia?: string, skipCache: boolean = false): Promise<ParametrosCalculadora[]> {
  const cacheKey = `${CACHE_KEY}:all`;
  
  // Verifica cache primeiro (se não for para ignorar)
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      const dados = cached as ParametrosCalculadora[];
      if (franquia) {
        return dados.filter(p => p.franquia.toUpperCase() === franquia.toUpperCase());
      }
      return dados;
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba PARAMETROS - CALCULADORA FRANQUEADO (até coluna AK para despesaAnual)
  const range = `'${SHEET_NAME}'!A:AK`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];

  if (!rows || rows.length <= 1) {
    return [];
  }

  // Pula a primeira linha (cabeçalhos)
  const dataRows = rows.slice(1);
  
  const parametros: ParametrosCalculadora[] = dataRows.map((row) => ({
    franquia: row[COLUNAS.FRANQUIA] || '',
    inicioPgFee: parseNumber(row[COLUNAS.INICIO_PG_FEE]),
    percentualAntecipacao: parsePercentual(row[COLUNAS.PERCENTUAL_ANTECIPACAO]),
    percentualFechamento: parsePercentual(row[COLUNAS.PERCENTUAL_FECHAMENTO]),
    nrParcelasAntecipacao: parseNumber(row[COLUNAS.NR_PARCELAS_ANTECIPACAO]),
    quebraOrcamentoFinal: parsePercentual(row[COLUNAS.QUEBRA_ORCAMENTO_FINAL]),
    diasBaileUltimaParcela: parseNumber(row[COLUNAS.DIAS_INICIO_ANTECIPACAO]),
    demaisReceitas: parsePercentual(row[COLUNAS.DEMAIS_RECEITAS]),
    margem: parsePercentual(row[COLUNAS.MARGEM]),
    tempoMedioFundosCarteira: parseNumber(row[COLUNAS.TEMPO_MEDIO_FUNDOS_CARTEIRA]),
    feePercentual: parsePercentual(row[COLUNAS.FEE_PERCENTUAL]),
    vvr: parseNumber(row[COLUNAS.VVR]),
    despesaAnual: parseNumber(row[COLUNAS.DESPESA_ANUAL]),
  })).filter(p => p.franquia);

  // Salva no cache
  cache.set(cacheKey, parametros, CACHE_TTL);

  if (franquia) {
    return parametros.filter(p => p.franquia.toUpperCase() === franquia.toUpperCase());
  }
  return parametros;
}

async function updateParametrosCalculadora(
  franquia: string,
  parametros: Partial<ParametrosCalculadora>
): Promise<boolean> {
  const auth = getAuthenticatedClient(false);
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Primeiro, busca todas as linhas para encontrar a franquia
  const range = `'${SHEET_NAME}'!A:AK`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  // Encontra a linha da franquia (index 0 = cabeçalho)
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COLUNAS.FRANQUIA]?.toUpperCase() === franquia.toUpperCase()) {
      rowIndex = i + 1; // +1 porque a planilha começa em 1, não 0
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Franquia "${franquia}" não encontrada`);
  }

  // Prepara os valores para atualizar (apenas os campos modificados)
  const updates: { range: string; values: any[][] }[] = [];

  // B - INÍCIO PG FEE (DIAS PARA INICIO ANTECIPAÇÃO)
  if (parametros.inicioPgFee !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!B${rowIndex}`,
      values: [[parametros.inicioPgFee]],
    });
  }

  // C - % ANTECIPAÇÃO e D - % FECHAMENTO (complemento para 100%)
  if (parametros.percentualAntecipacao !== undefined) {
    const valorAntecipacao = parametros.percentualAntecipacao / 100;
    const valorFechamento = (100 - parametros.percentualAntecipacao) / 100;
    updates.push({
      range: `'${SHEET_NAME}'!C${rowIndex}`,
      values: [[valorAntecipacao]],
    });
    updates.push({
      range: `'${SHEET_NAME}'!D${rowIndex}`,
      values: [[valorFechamento]],
    });
  }

  // E - Nº PARCELAS ANTECIPAÇÃO
  if (parametros.nrParcelasAntecipacao !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!E${rowIndex}`,
      values: [[parametros.nrParcelasAntecipacao]],
    });
  }

  // F - QUEBRA ORÇAMENTO FINAL / MAF INICIAL
  if (parametros.quebraOrcamentoFinal !== undefined) {
    const valor = parametros.quebraOrcamentoFinal / 100;
    updates.push({
      range: `'${SHEET_NAME}'!F${rowIndex}`,
      values: [[valor]],
    });
  }

  // G - DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
  if (parametros.diasBaileUltimaParcela !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!G${rowIndex}`,
      values: [[parametros.diasBaileUltimaParcela]],
    });
  }

  // I - MARGEM
  if (parametros.margem !== undefined) {
    const valor = parametros.margem / 100;
    updates.push({
      range: `'${SHEET_NAME}'!I${rowIndex}`,
      values: [[valor]],
    });
  }

  // J - MESES PERMANÊNCIA NA CARTEIRA
  if (parametros.tempoMedioFundosCarteira !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!J${rowIndex}`,
      values: [[parametros.tempoMedioFundosCarteira]],
    });
  }

  // K - FEE (%)
  if (parametros.feePercentual !== undefined) {
    const valor = parametros.feePercentual / 100;
    updates.push({
      range: `'${SHEET_NAME}'!K${rowIndex}`,
      values: [[valor]],
    });
  }

  // L - META VVR VENDAS
  if (parametros.vvr !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!L${rowIndex}`,
      values: [[parametros.vvr]],
    });
  }

  // AK - DESPESA ANUAL
  if (parametros.despesaAnual !== undefined) {
    updates.push({
      range: `'${SHEET_NAME}'!AK${rowIndex}`,
      values: [[parametros.despesaAnual]],
    });
  }

  // Executa as atualizações
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });

    // Limpa o cache
    cache.invalidate(`${CACHE_KEY}:all`);
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const franquia = req.query.franquia as string | undefined;
      const skipCache = !!req.query.refresh;
      
      const dados = await getParametrosCalculadora(franquia, skipCache);
      
      return res.status(200).json({
        success: true,
        data: dados,
        franquia: franquia || 'todas',
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { franquia, ...parametros } = req.body;

      if (!franquia) {
        return res.status(400).json({
          success: false,
          error: 'Franquia é obrigatória',
        });
      }

      await updateParametrosCalculadora(franquia, parametros);

      return res.status(200).json({
        success: true,
        message: 'Parâmetros atualizados com sucesso',
        franquia,
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
    });
  } catch (error) {
    console.error('[API Parametros Calculadora] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
