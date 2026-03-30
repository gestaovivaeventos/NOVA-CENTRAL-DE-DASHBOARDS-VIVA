/**
 * API Route — Franquias → Municípios
 * Lê mapeamento franquia→municípios da planilha Google Sheets
 * Ignora linhas com status "EM VALIDAÇÃO", "EM ABERTO", "VALIDAÇÃO"
 *
 * Retorna: { franquias: { nome: string; municipios: string[] }[] }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const CACHE_TTL = 60 * 60 * 1000; // 1 hora
const CACHE_KEY = 'franquias_municipios';

const STATUS_IGNORAR = ['EM VALIDAÇÃO', 'EM ABERTO', 'VALIDAÇÃO'];

let authClient: InstanceType<typeof google.auth.JWT> | null = null;

function getAuth() {
  if (authClient) return authClient;
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado');
  const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  authClient = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return authClient;
}

export interface FranquiaMunicipios {
  nome: string;
  municipios: string[];
}

async function fetchFranquias(): Promise<FranquiaMunicipios[]> {
  const cached = cache.get<FranquiaMunicipios[]>(CACHE_KEY);
  if (cached) return cached;

  const spreadsheetId = process.env.FRANQUIAS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('FRANQUIAS_SPREADSHEET_ID não configurado');

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:B',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const mapa = new Map<string, Set<string>>();

  for (let i = 1; i < rows.length; i++) {
    const franquia = (rows[i][0] || '').toString().trim();
    const cidade = (rows[i][1] || '').toString().trim().toUpperCase();

    if (!franquia || !cidade) continue;

    // Ignorar linhas com status especial
    if (STATUS_IGNORAR.includes(franquia.toUpperCase()) || STATUS_IGNORAR.includes(cidade)) continue;

    // Ignorar entradas genéricas
    if (cidade.includes('TODOS QUE NÃO FOREM')) continue;

    if (!mapa.has(franquia)) mapa.set(franquia, new Set());
    mapa.get(franquia)!.add(cidade);
  }

  const resultado: FranquiaMunicipios[] = Array.from(mapa.entries())
    .map(([nome, cidades]) => ({
      nome,
      municipios: Array.from(cidades).sort(),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  cache.set(CACHE_KEY, resultado, CACHE_TTL);
  console.log(`[Franquias] ${resultado.length} franquias carregadas`);
  return resultado;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const franquias = await fetchFranquias();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ franquias });
  } catch (err: unknown) {
    console.error('[API Franquias] Erro:', err);
    const message = err instanceof Error ? err.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
}
