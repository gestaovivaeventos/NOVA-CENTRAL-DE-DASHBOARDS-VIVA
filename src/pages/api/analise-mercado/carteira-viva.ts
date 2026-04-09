/**
 * API Route — Carteira Viva Medicina
 * Fonte: Google Sheets externa com dados de fundos/carteira
 * Filtra: curso_fundo = "Medicina", exclui situacao_fundo "Rescindido"/"Rescindindo"
 * Agrega aderidos_principal por nm_unidade (franquia)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const SPREADSHEET_ID = '1nNUVFGhD6ihAFj_EMQibwcEJGMuxYPI6VtDxx-9ye7E';
const CACHE_KEY = 'analise-mercado:carteira-viva';
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

        // Discover actual tab name (gid=714743788)
        const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheet = meta.data.sheets?.find(s => s.properties?.sheetId === 714743788);
        const sheetName = sheet?.properties?.title || meta.data.sheets?.[0]?.properties?.title || 'Sheet1';

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: sheetName,
        });
        return response.data.values || [];
      },
      CACHE_TTL
    );

    if (!rows || rows.length < 2) {
      return res.status(200).json({ franquias: [], totalViva: 0 });
    }

    // Find columns dynamically
    const header = rows[0].map((h: string) => String(h).trim().toUpperCase());
    const idxUnidade = header.findIndex((h: string) => h === 'NM_UNIDADE');
    const idxCurso = header.findIndex((h: string) => h === 'CURSO_FUNDO');
    const idxSituacao = header.findIndex((h: string) => h === 'SITUACAO_FUNDO');
    const idxAderidos = header.findIndex((h: string) => h === 'ADERIDOS_PRINCIPAL');

    if (idxUnidade === -1 || idxCurso === -1 || idxSituacao === -1 || idxAderidos === -1) {
      console.error('[API/carteira-viva] Colunas não encontradas. Headers:', header);
      return res.status(200).json({
        franquias: [],
        totalViva: 0,
        error: 'Colunas necessárias não encontradas',
        headers: header,
      });
    }

    const SITUACOES_EXCLUIDAS = ['RESCINDIDO', 'RESCINDINDO'];

    // Filter and aggregate
    const agrupado = new Map<string, number>();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const curso = String(row[idxCurso] || '').trim().toUpperCase();
      const situacao = String(row[idxSituacao] || '').trim().toUpperCase();
      const franquia = String(row[idxUnidade] || '').trim();
      const aderidos = parseFloat(String(row[idxAderidos] || '0').replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      // Only Medicina and not rescinded
      if (curso !== 'MEDICINA') continue;
      if (SITUACOES_EXCLUIDAS.includes(situacao)) continue;
      if (!franquia) continue;

      agrupado.set(franquia, (agrupado.get(franquia) || 0) + aderidos);
    }

    const franquias = Array.from(agrupado.entries())
      .map(([franquia, alunosViva]) => ({ franquia, alunosViva: Math.round(alunosViva) }))
      .sort((a, b) => b.alunosViva - a.alunosViva);

    const totalViva = franquias.reduce((sum, f) => sum + f.alunosViva, 0);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ franquias, totalViva });
  } catch (error: any) {
    console.error('[API/carteira-viva] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
