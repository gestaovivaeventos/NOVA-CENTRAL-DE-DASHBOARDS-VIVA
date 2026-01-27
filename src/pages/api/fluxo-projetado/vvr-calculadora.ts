/**
 * API: VVR Calculadora Franqueado
 * Busca dados de VVR da aba "NOVAS VENDAS - CALCULADORA FRANQUEADO"
 * Coluna A = Data, Coluna B = Franquia, Coluna G = VVR
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'NOVAS VENDAS - CALCULADORA FRNQUEADO';
const CACHE_KEY = 'fluxo-projetado:vvr-calculadora';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Mapeamento das colunas
const COLUNAS = {
  DATA: 0,      // A
  FRANQUIA: 1,  // B
  VVR: 6,       // G
};

interface VVRPorAno {
  ano: number;
  vvr: number;
  meses: { mes: number; vvr: number }[];
}

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  // Remove R$, espaços e trata formato brasileiro
  const cleaned = String(value).replace(/[R$\s%]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: any): Date | null {
  if (!value) return null;
  
  const str = String(value);
  
  // Tenta formato dd/mm/yyyy
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  
  // Tenta formato ISO ou número serial do Google Sheets
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  // Número serial do Excel/Google Sheets
  const serial = parseFloat(value);
  if (!isNaN(serial) && serial > 0) {
    // Excel serial date: dias desde 1/1/1900
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + serial * 86400000);
  }
  
  return null;
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
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

async function getVVRCalculadora(franquia: string, skipCache: boolean = false): Promise<VVRPorAno[]> {
  const cacheKey = `${CACHE_KEY}:${franquia.toUpperCase()}`;
  
  // Verifica cache primeiro (se não for para ignorar)
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as VVRPorAno[];
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba NOVAS VENDAS - CALCULADORA FRANQUEADO
  const range = `'${SHEET_NAME}'!A:G`;
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
  
  // Agrupa VVR por ano para a franquia selecionada
  const vvrPorAnoMap = new Map<number, { total: number; meses: Map<number, number> }>();
  
  for (const row of dataRows) {
    const franquiaRow = String(row[COLUNAS.FRANQUIA] || '').toUpperCase().trim();
    
    // Filtra pela franquia
    if (franquiaRow !== franquia.toUpperCase().trim()) continue;
    
    const data = parseDate(row[COLUNAS.DATA]);
    if (!data) continue;
    
    const ano = data.getFullYear();
    const mes = data.getMonth() + 1;
    const vvr = parseNumber(row[COLUNAS.VVR]);
    
    if (!vvrPorAnoMap.has(ano)) {
      vvrPorAnoMap.set(ano, { total: 0, meses: new Map() });
    }
    
    const anoData = vvrPorAnoMap.get(ano)!;
    anoData.total += vvr;
    
    // Acumula por mês
    const mesAtual = anoData.meses.get(mes) || 0;
    anoData.meses.set(mes, mesAtual + vvr);
  }
  
  // Converte para array
  const resultado: VVRPorAno[] = [];
  vvrPorAnoMap.forEach((data, ano) => {
    const meses: { mes: number; vvr: number }[] = [];
    data.meses.forEach((vvr, mes) => {
      meses.push({ mes, vvr });
    });
    meses.sort((a, b) => a.mes - b.mes);
    
    resultado.push({
      ano,
      vvr: data.total,
      meses,
    });
  });
  
  resultado.sort((a, b) => a.ano - b.ano);
  
  // Salva no cache
  cache.set(cacheKey, resultado, CACHE_TTL);
  
  return resultado;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido',
      });
    }

    const franquia = req.query.franquia as string;
    if (!franquia) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro franquia é obrigatório',
      });
    }
    
    const skipCache = !!req.query.refresh;
    const dados = await getVVRCalculadora(franquia, skipCache);

    return res.status(200).json({
      success: true,
      data: dados,
      cache: !skipCache,
    });
  } catch (error) {
    console.error('[VVR Calculadora API] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
