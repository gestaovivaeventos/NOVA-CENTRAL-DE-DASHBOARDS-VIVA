/**
 * API: Lista de Franquias do Fluxo Realizado
 * Busca franquias únicas da coluna A da aba carteira_realizado
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const SPREADSHEET_ID = process.env.PLANILHA_FLUXO_PROJETADO_ID!;
const SHEET_NAME = 'carteira_realizado';
const CACHE_KEY = 'fluxo-realizado:franquias';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar cache
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar apenas a coluna A (FRANQUIA) - a partir da linha 2 (pula cabeçalho)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:A`,
    });

    const rows = response.data.values || [];

    // Extrair valores únicos, filtrar vazios e ordenar
    const franquiasSet = new Set<string>();
    for (const row of rows) {
      const valor = row[0]?.toString().trim();
      if (valor) {
        franquiasSet.add(valor);
      }
    }

    const franquias = Array.from(franquiasSet).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
    );

    // Salvar no cache
    cache.set(CACHE_KEY, franquias, CACHE_TTL);

    return res.status(200).json({ data: franquias });
  } catch (error: any) {
    console.error('[API franquias] Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar franquias' });
  }
}
