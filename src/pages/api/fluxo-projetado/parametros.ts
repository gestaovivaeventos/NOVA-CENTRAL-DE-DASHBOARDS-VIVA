/**
 * API: Parâmetros do Fluxo Projetado
 * Busca e atualiza os parâmetros por franquia da planilha Google Sheets
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'PARAMETROS PAINEL';
const CACHE_KEY = 'fluxo-projetado:parametros';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

export interface ParametrosFranquiaAPI {
  franquia: string;
  inicioPgFee: number;
  percentualAntecipacao: number;
  percentualFechamento: number;
  numParcelasAntecipacao: number;
  quebraOrcamentoFinal: number;
  diasBaileAnteciparUltimaParcela: number;
  demaisReceitas: number;
  margem: number;
  mesesPermanenciaCarteira: number;
  feePercentual: number;
  despesaFixa: number; // Coluna AK - Despesa Fixa Anual
}

// Mapeia índices das colunas (baseado na ordem dos cabeçalhos)
const COLUNAS = {
  FRANQUIA: 0,
  INICIO_PG_FEE: 1,
  PERCENTUAL_ANTECIPACAO: 2,
  PERCENTUAL_FECHAMENTO: 3,
  NUM_PARCELAS_ANTECIPACAO: 4,
  QUEBRA_ORCAMENTO_FINAL: 5,
  DIAS_BAILE: 6,
  DEMAIS_RECEITAS: 7,
  MARGEM: 8,
  MESES_PERMANENCIA: 9,
  FEE_PERCENTUAL: 10,
  DESPESA_FIXA: 36, // Coluna AK = índice 36
};

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  // Remove caracteres não numéricos exceto ponto e vírgula e sinal negativo
  const cleaned = String(value).replace(/[^\d.,\-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Converte percentual para exibição
// Na planilha os valores vêm como decimais (0.62 = 62%, 0.0202 = 2,02%)
// Retorna o valor como percentual para exibição (62 ou 2.02)
function parsePercentual(value: any): number {
  const num = parseNumber(value);
  // Se o valor for menor que 1 e maior que -1, assume que está em formato decimal
  // Ex: 0.62 = 62%, 0.0202 = 2.02%, -0.05 = -5%
  if (num > -1 && num < 1 && num !== 0) {
    return Math.round(num * 10000) / 100; // 0.0202 → 2.02, 0.62 → 62
  }
  // Se for maior que 1 ou menor que -1, já está como percentual inteiro
  return Math.round(num * 100) / 100;
}

// Converte valor de QUEBRA ORÇAMENTO - usa mesma lógica de parsePercentual
// Planilha mostra: 0.0202 → Sistema exibe: 2,02%
// Planilha mostra: 0.5110 → Sistema exibe: 51,10%
function parseQuebraOrcamento(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  
  const strValue = String(value);
  
  // Remove o símbolo de % se existir
  const semPercent = strValue.replace('%', '');
  
  // Remove caracteres não numéricos exceto ponto, vírgula e sinal negativo
  const cleaned = semPercent.replace(/[^\d.,\-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned) || 0;
  
  // Se o valor for menor que 1 e maior que -1, está em formato decimal
  // Ex: 0.0202 = 2.02%, 0.5110 = 51.10%, -0.3311 = -33.11%
  if (num > -1 && num < 1 && num !== 0) {
    return Math.round(num * 10000) / 100; // 0.0202 → 2.02
  }
  
  // Se já é um valor inteiro/decimal maior (ex: 202, 13.64), retorna arredondado
  return Math.round(num * 100) / 100;
}

function parseRow(row: any[]): ParametrosFranquiaAPI | null {
  const franquia = row[COLUNAS.FRANQUIA];
  if (!franquia || typeof franquia !== 'string' || franquia.trim() === '') {
    return null;
  }

  return {
    franquia: franquia.trim(),
    inicioPgFee: parseNumber(row[COLUNAS.INICIO_PG_FEE]),
    percentualAntecipacao: parsePercentual(row[COLUNAS.PERCENTUAL_ANTECIPACAO]),
    percentualFechamento: parsePercentual(row[COLUNAS.PERCENTUAL_FECHAMENTO]),
    numParcelasAntecipacao: parseNumber(row[COLUNAS.NUM_PARCELAS_ANTECIPACAO]),
    quebraOrcamentoFinal: parseQuebraOrcamento(row[COLUNAS.QUEBRA_ORCAMENTO_FINAL]),
    diasBaileAnteciparUltimaParcela: parseNumber(row[COLUNAS.DIAS_BAILE]),
    demaisReceitas: parsePercentual(row[COLUNAS.DEMAIS_RECEITAS]),
    margem: parsePercentual(row[COLUNAS.MARGEM]),
    mesesPermanenciaCarteira: parseNumber(row[COLUNAS.MESES_PERMANENCIA]),
    feePercentual: parsePercentual(row[COLUNAS.FEE_PERCENTUAL]),
    despesaFixa: parseNumber(row[COLUNAS.DESPESA_FIXA]),
  };
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

async function getParametros(skipCache: boolean = false): Promise<ParametrosFranquiaAPI[]> {
  // Verifica cache primeiro (se não for para ignorar)
  if (!skipCache) {
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return cached as ParametrosFranquiaAPI[];
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  const range = `${SHEET_NAME}!A:AK`;
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
  const parametros: ParametrosFranquiaAPI[] = [];

  for (const row of dataRows) {
    const parsed = parseRow(row);
    if (parsed) {
      parametros.push(parsed);
    }
  }

  // Salva no cache
  cache.set(CACHE_KEY, parametros, CACHE_TTL);

  return parametros;
}

// Converte percentual (ex: 2.02, 51.10, 62) para decimal (ex: 0.0202, 0.5110, 0.62) para salvar na planilha
function toDecimal(value: number): number {
  // Divide por 100 para converter de percentual para decimal
  // 2.02 → 0.0202, 51.10 → 0.5110, 62 → 0.62
  return value / 100;
}

async function updateParametros(parametros: ParametrosFranquiaAPI[]): Promise<void> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Monta os dados para escrita - converte percentuais para decimal
  const values = parametros.map((p) => [
    p.franquia,
    p.inicioPgFee,
    toDecimal(p.percentualAntecipacao),       // 62 → 0.62
    toDecimal(p.percentualFechamento),        // 38 → 0.38
    p.numParcelasAntecipacao,
    toDecimal(p.quebraOrcamentoFinal),        // 2.02 → 0.0202
    p.diasBaileAnteciparUltimaParcela,
    toDecimal(p.demaisReceitas),              // 7.24 → 0.0724
    toDecimal(p.margem),                      // 18.81 → 0.1881
    p.mesesPermanenciaCarteira,
    toDecimal(p.feePercentual),               // 11.97 → 0.1197
  ]);

  // Atualiza a partir da linha 2 (após cabeçalhos)
  const range = `${SHEET_NAME}!A2:K${parametros.length + 1}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  // Invalida o cache
  cache.invalidate(CACHE_KEY);
}

// Atualiza parâmetros de uma única franquia
async function updateParametrosFranquia(franquia: string, parametros: Partial<ParametrosFranquiaAPI>): Promise<{ success: boolean; rowIndex?: number }> {
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Primeiro, busca todas as linhas para encontrar a franquia
  const range = `'${SHEET_NAME}'!A:K`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  // Encontra o índice da linha da franquia (começando da linha 2, índice 1)
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

  // Monta os valores a serem atualizados
  const values = [[
    franquia,
    parametros.inicioPgFee ?? 0,
    toDecimal(parametros.percentualAntecipacao ?? 0),
    toDecimal(parametros.percentualFechamento ?? 0),
    parametros.numParcelasAntecipacao ?? 0,
    toDecimal(parametros.quebraOrcamentoFinal ?? 0),
    parametros.diasBaileAnteciparUltimaParcela ?? 0,
    toDecimal(parametros.demaisReceitas ?? 0),
    toDecimal(parametros.margem ?? 0),
    parametros.mesesPermanenciaCarteira ?? 0,
    toDecimal(parametros.feePercentual ?? 0),
  ]];

  // Atualiza apenas a linha da franquia
  const updateRange = `'${SHEET_NAME}'!A${rowIndex}:K${rowIndex}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: updateRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });

  // Invalida o cache
  cache.invalidate(CACHE_KEY);

  return { success: true, rowIndex };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Se tiver parâmetro refresh, ignora o cache e busca dados frescos
      const skipCache = !!req.query.refresh;
      const parametros = await getParametros(skipCache);
      return res.status(200).json({
        success: true,
        data: parametros,
        total: parametros.length,
        cached: !skipCache,
      });
    }

    if (req.method === 'PUT') {
      const { parametros } = req.body;
      
      if (!Array.isArray(parametros)) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos: parametros deve ser um array',
        });
      }

      await updateParametros(parametros);
      
      return res.status(200).json({
        success: true,
        message: 'Parâmetros atualizados com sucesso',
      });
    }

    // PATCH - Atualiza parâmetros de uma única franquia
    if (req.method === 'PATCH') {
      const { franquia, parametros } = req.body;
      
      if (!franquia || typeof franquia !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Franquia é obrigatória',
        });
      }

      if (!parametros || typeof parametros !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros são obrigatórios',
        });
      }

      const result = await updateParametrosFranquia(franquia, parametros);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: `Franquia "${franquia}" não encontrada`,
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Parâmetros da franquia "${franquia}" atualizados com sucesso`,
        rowIndex: result.rowIndex,
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
    });
  } catch (error) {
    console.error('[API Parametros] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
}
