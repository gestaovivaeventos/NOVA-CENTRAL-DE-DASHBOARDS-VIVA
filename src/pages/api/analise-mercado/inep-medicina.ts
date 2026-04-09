/**
 * API Route — INEP Medicina agregado por município
 * Carrega todas as 5 regiões INEP, filtra Medicina, agrega QT_MAT por município
 * Retorna: { municipios: { municipio, uf, matriculas }[], total }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

export const config = { maxDuration: 60 };

const REGIOES = ['SUL', 'SUDESTE', 'NORTE', 'CENTRO_OESTE', 'NORDESTE'];
const ANO = 2024;
const CACHE_KEY = 'analise-mercado:inep-medicina-municipios';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h (dados censitários)

let authClient: any = null;
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

// Column aliases (same as inep.ts)
const COLUMN_ALIASES: Record<string, string[]> = {
  NO_CURSO:     ['NO_CURSO'],
  NO_MUNICIPIO: ['NO_MUNICIPIO', 'NO_MUNICIPIO_IES', 'MUNICIPIO'],
  SG_UF:        ['SG_UF', 'SG_UF_IES', 'UF'],
  QT_MAT:       ['QT_MAT'],
};

interface MunicipioMat {
  municipio: string;
  uf: string;
  matriculas: number;
}

async function fetchRegiaoMedicina(regiao: string): Promise<MunicipioMat[]> {
  const envKey = `INEP_${ANO}_${regiao}`;
  const spreadsheetId = process.env[envKey];
  if (!spreadsheetId) return [];

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:T',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  const header = rows[0].map((h: string) => String(h).trim().toUpperCase());

  // Resolve column indexes
  const findCol = (aliases: string[]) => {
    for (const a of aliases) {
      const idx = header.indexOf(a);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxCurso = findCol(COLUMN_ALIASES.NO_CURSO);
  const idxMun = findCol(COLUMN_ALIASES.NO_MUNICIPIO);
  const idxUf = findCol(COLUMN_ALIASES.SG_UF);
  const idxMat = findCol(COLUMN_ALIASES.QT_MAT);

  if (idxCurso === -1 || idxMun === -1 || idxMat === -1) return [];

  const result: MunicipioMat[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const curso = String(row[idxCurso] || '').trim().toUpperCase();
    if (curso !== 'MEDICINA') continue;

    result.push({
      municipio: String(row[idxMun] || '').trim().toUpperCase(),
      uf: idxUf >= 0 ? String(row[idxUf] || '').trim() : '',
      matriculas: Number(row[idxMat]) || 0,
    });
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await cache.getOrFetch(
      CACHE_KEY,
      async () => {
        const allResults = await Promise.allSettled(
          REGIOES.map(r => fetchRegiaoMedicina(r))
        );

        // Aggregate by municipio
        const porMun = new Map<string, { uf: string; mat: number }>();
        for (const result of allResults) {
          if (result.status !== 'fulfilled') continue;
          for (const row of result.value) {
            if (!row.municipio) continue;
            const existing = porMun.get(row.municipio);
            if (existing) {
              existing.mat += row.matriculas;
            } else {
              porMun.set(row.municipio, { uf: row.uf, mat: row.matriculas });
            }
          }
        }

        const municipios = Array.from(porMun.entries())
          .map(([municipio, d]) => ({ municipio, uf: d.uf, matriculas: d.mat }))
          .sort((a, b) => b.matriculas - a.matriculas);

        const total = municipios.reduce((s, m) => s + m.matriculas, 0);
        return { municipios, total };
      },
      CACHE_TTL
    );

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[API/inep-medicina] Erro:', error.message);
    return res.status(500).json({ error: 'Erro interno', message: error.message });
  }
}
