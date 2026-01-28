/**
 * Cliente Google Sheets com Cache
 * Centraliza a lógica de autenticação e cache
 */

import { google } from 'googleapis';
import cache from './cache';

// TTL para diferentes tipos de dados
export const CACHE_TTL = {
  // PEX
  PONTUACAO_OFICIAL: 30 * 1000,      // 30 segundos - dados principais (atualiza frequentemente)
  UNI_CONS: 60 * 1000,     // 1 minuto - consultores/clusters
  CRITERIOS: 60 * 1000,    // 1 minuto - pesos
  // Vendas
  SALES: 60 * 1000,        // 1 minuto - dados de vendas
  FUNIL: 60 * 1000,        // 1 minuto - dados do funil
  FUNDOS: 60 * 1000,       // 1 minuto - dados de fundos
  METAS: 30 * 1000,        // 30 segundos - metas (para refletir alterações rápido)
};

interface SheetsConfig {
  spreadsheetId: string;
  email: string;
  privateKey: string;
}

let cachedAuth: any = null;
let cachedConfig: SheetsConfig | null = null;

/**
 * Obtém a configuração do Google Sheets das variáveis de ambiente
 */
export function getConfig(): SheetsConfig {
  if (cachedConfig) return cachedConfig;
  
  const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

  if (!GOOGLE_SHEET_ID || !GOOGLE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('Variáveis de ambiente do Google Sheets não configuradas');
  }

  const serviceAccountBuffer = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
  const serviceAccount = JSON.parse(serviceAccountBuffer.toString('utf-8'));
  const { client_email, private_key } = serviceAccount;

  if (!client_email || !private_key) {
    throw new Error('Service Account inválido');
  }

  cachedConfig = {
    spreadsheetId: GOOGLE_SHEET_ID,
    email: client_email,
    privateKey: private_key,
  };

  return cachedConfig;
}

/**
 * Obtém cliente autenticado do Google Sheets (reutiliza autenticação)
 */
export function getAuthenticatedClient() {
  if (cachedAuth) return cachedAuth;
  
  const config = getConfig();
  
  cachedAuth = new google.auth.JWT({
    email: config.email,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return cachedAuth;
}

/**
 * Busca dados de uma aba com cache
 */
export async function getSheetData(
  range: string, 
  cacheKey: string, 
  ttl: number = CACHE_TTL.PONTUACAO_OFICIAL
): Promise<any[][]> {
  const config = getConfig();
  
  return cache.getOrFetch(
    cacheKey,
    async () => {
      const auth = getAuthenticatedClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range,
      });
      
      return response.data.values || [];
    },
    ttl
  );
}

/**
 * Busca dados de uma planilha específica (diferente da principal) com cache
 */
export async function getExternalSheetData(
  spreadsheetId: string,
  range: string, 
  cacheKey: string, 
  ttl: number = CACHE_TTL.PONTUACAO_OFICIAL
): Promise<any[][]> {
  return cache.getOrFetch(
    cacheKey,
    async () => {
      const auth = getAuthenticatedClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      
      return response.data.values || [];
    },
    ttl
  );
}

/**
 * Escreve dados em uma aba e invalida o cache relacionado
 */
export async function updateSheetData(
  range: string,
  values: any[][],
  cacheKeyToInvalidate?: string
): Promise<void> {
  const config = getConfig();
  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
  
  // Invalidar cache após escrita
  if (cacheKeyToInvalidate) {
    cache.invalidate(cacheKeyToInvalidate);
    console.log(`[SheetsClient] Cache invalidated: ${cacheKeyToInvalidate}`);
  }
}

/**
 * Invalida todo o cache de uma categoria
 */
export function invalidateCache(prefix: string): number {
  return cache.invalidateByPrefix(prefix);
}

/**
 * Retorna estatísticas do cache
 */
export function getCacheStats() {
  return cache.getStats();
}
