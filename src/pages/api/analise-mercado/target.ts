/**
 * API Route — Target Medicina (Alunos)
 * Fonte: Google Sheets externa com dados de vagas por franquia
 * Coluna "Média de abertura de vagas por turma" → Alunos Target
 * Coluna "FRANQUIA" → Franquia
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const SPREADSHEET_ID = '1i-RdzBkvkzDDVBWi1nokzAPRb4moHSD9yC0bTG-mJ74';
const CACHE_KEY = 'analise-mercado:target';
const CACHE_TTL = 60 * 1000; // 1 minuto

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows: any[][] = await cache.getOrFetch(
      CACHE_KEY,
      async () => {
        const auth = getAuthenticatedClient();
        const sheets = google.sheets({ version: 'v4', auth });

        // First get sheet metadata to find the actual tab name
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheetName = meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: sheetName,
        });
        return response.data.values || [];
      },
      CACHE_TTL
    );

    if (!rows || rows.length < 2) {
      return res.status(200).json({ franquias: [] });
    }

    // Header row to find column indexes dynamically
    const header = rows[0].map((h: string) => String(h).trim().toUpperCase());
    const idxFranquia = header.findIndex((h: string) => h.includes('FRANQUIA'));
    const idxTarget = header.findIndex((h: string) =>
      h.includes('MÉDIA DE ABERTURA') || h.includes('MEDIA DE ABERTURA') || h.includes('VAGAS POR TURMA')
    );

    if (idxFranquia === -1 || idxTarget === -1) {
      console.error('[API/target] Colunas não encontradas. Headers:', header);
      return res.status(200).json({
        franquias: [],
        error: 'Colunas FRANQUIA ou Média de abertura de vagas não encontradas',
        headers: header,
      });
    }

    const rawRows = rows.slice(1)
      .filter((row: any[]) => row[idxFranquia] && String(row[idxFranquia]).trim())
      .map((row: any[]) => ({
        franquia: String(row[idxFranquia]).trim(),
        alunosTarget: parseFloat(String(row[idxTarget] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      }))
      .filter((f: { franquia: string; alunosTarget: number }) => f.alunosTarget > 0);

    // Aggregate by franquia (sum alunosTarget)
    const agrupado = new Map<string, number>();
    for (const r of rawRows) {
      agrupado.set(r.franquia, (agrupado.get(r.franquia) || 0) + r.alunosTarget);
    }

    const franquias = Array.from(agrupado.entries())
      .map(([franquia, alunosTarget]) => ({ franquia, alunosTarget: Math.round(alunosTarget) }))
      .sort((a, b) => b.alunosTarget - a.alunosTarget);

    const totalTarget = franquias.reduce((sum, f) => sum + f.alunosTarget, 0);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      franquias,
      totalTarget,
      headers: header, // Ajuda no debug para ver os nomes reais das colunas
    });
  } catch (error: any) {
    console.error('[API/target] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
