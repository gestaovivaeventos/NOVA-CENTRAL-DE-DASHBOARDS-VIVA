/**
 * API Route - Gerenciar subgrupos dentro de grupos
 * GET: lista subgrupos salvos na aba SUBGRUPOS (nome + grupo + icone + ordem + ativo)
 * POST: adiciona novo subgrupo
 * PUT: atualiza campos de um subgrupo (nome, grupo, icone, ordem, ativo)
 * DELETE: remove subgrupo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:subgrupos';
const SHEET_NAME = 'SUBGRUPOS';

export interface SubgrupoInfo {
  nome: string;
  grupo: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const spreadsheetId = process.env.CONTROLE_MODULOS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    return res.status(500).json({
      error: 'Configuração ausente',
      message: 'CONTROLE_MODULOS_SPREADSHEET_ID não configurado',
    });
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });

  async function ensureSheet() {
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const exists = meta.data.sheets?.some(
        (s) => s.properties?.title === SHEET_NAME
      );
      if (!exists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: SHEET_NAME },
                },
              },
            ],
          },
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A1:E1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['subgrupo', 'grupo', 'icone', 'ordem', 'ativo']],
          },
        });
        return;
      }

      // Garantir header correto
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1:E1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['subgrupo', 'grupo', 'icone', 'ordem', 'ativo']] },
      });
    } catch (err: any) {
      console.error('[API/subgrupos] Erro ao garantir aba:', err.message);
    }
  }

  async function readAllSubgrupos(): Promise<SubgrupoInfo[]> {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = result.data.values || [];
    return rows
      .slice(1)
      .filter((r) => (r[0] || '').trim())
      .map((r) => ({
        nome: (r[0] || '').trim(),
        grupo: (r[1] || '').trim(),
        icone: (r[2] || 'folder').trim(),
        ordem: parseInt(r[3] || '99', 10) || 99,
        ativo: (r[4] || 'TRUE').trim().toUpperCase() !== 'FALSE',
      }));
  }

  if (req.method === 'GET') {
    try {
      const forceRefresh = req.query.refresh === 'true';
      if (!forceRefresh) {
        const cached = cache.get(CACHE_KEY);
        if (cached) {
          return res.status(200).json({ subgrupos: cached });
        }
      }

      await ensureSheet();
      const subgrupos = await readAllSubgrupos();

      cache.set(CACHE_KEY, subgrupos);
      return res.status(200).json({ subgrupos });
    } catch (error: any) {
      console.error('[API/subgrupos] GET erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { subgrupo, grupo, icone = 'folder', ordem, ativo = true } = req.body;
      if (!subgrupo || !subgrupo.trim()) {
        return res.status(400).json({ error: 'Nome do subgrupo é obrigatório' });
      }
      if (!grupo || !grupo.trim()) {
        return res.status(400).json({ error: 'Grupo pai é obrigatório' });
      }

      await ensureSheet();

      const existing = await readAllSubgrupos();
      const alreadyExists = existing.some(
        (s) =>
          s.nome.toLowerCase() === subgrupo.trim().toLowerCase() &&
          s.grupo.toLowerCase() === grupo.trim().toLowerCase()
      );

      if (alreadyExists) {
        return res.status(409).json({ error: `Subgrupo "${subgrupo.trim()}" já existe no grupo "${grupo.trim()}"` });
      }

      const sameGroup = existing.filter(s => s.grupo.toLowerCase() === grupo.trim().toLowerCase());
      const ordemFinal = ordem != null ? ordem : (sameGroup.length > 0 ? Math.max(...sameGroup.map(s => s.ordem)) + 1 : 1);

      const allRows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:A`,
      });
      const nextRow = (allRows.data.values?.length || 1) + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${nextRow}:E${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[subgrupo.trim(), grupo.trim(), icone.trim(), String(ordemFinal), ativo ? 'TRUE' : 'FALSE']],
        },
      });

      cache.invalidate(CACHE_KEY);
      return res.status(201).json({ success: true, subgrupo: subgrupo.trim() });
    } catch (error: any) {
      console.error('[API/subgrupos] POST erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { subgrupo, grupo: grupoPai, nome, novoGrupo, icone, ordem, ativo } = req.body;
      if (!subgrupo || !subgrupo.trim()) {
        return res.status(400).json({ error: 'Nome do subgrupo (identificador) é obrigatório' });
      }

      await ensureSheet();

      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:E`,
      });

      const rows = result.data.values || [];
      const rowIndex = rows.findIndex(
        (r, i) =>
          i > 0 &&
          (r[0] || '').trim().toLowerCase() === subgrupo.trim().toLowerCase() &&
          (!grupoPai || (r[1] || '').trim().toLowerCase() === grupoPai.trim().toLowerCase())
      );

      if (rowIndex === -1) {
        // Upsert: criar
        const allSubgrupos = rows.slice(1).filter(r => (r[0] || '').trim());
        const ordemFinal = ordem != null ? ordem : (allSubgrupos.length + 1);
        const newRow = [
          (nome || subgrupo).trim(),
          (novoGrupo || grupoPai || '').trim(),
          (icone || 'folder').trim(),
          String(ordemFinal),
          ativo != null ? (ativo ? 'TRUE' : 'FALSE') : 'TRUE',
        ];

        const nextRow = rows.length + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A${nextRow}:E${nextRow}`,
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] },
        });
      } else {
        const currentRow = rows[rowIndex];
        const updatedRow = [
          nome != null ? nome.trim() : (currentRow[0] || '').trim(),
          novoGrupo != null ? novoGrupo.trim() : (currentRow[1] || '').trim(),
          icone != null ? icone.trim() : (currentRow[2] || 'folder').trim(),
          ordem != null ? String(ordem) : (currentRow[3] || '99'),
          ativo != null ? (ativo ? 'TRUE' : 'FALSE') : (currentRow[4] || 'TRUE'),
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A${rowIndex + 1}:E${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [updatedRow] },
        });
      }

      cache.invalidate(CACHE_KEY);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[API/subgrupos] PUT erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { subgrupo, grupo: grupoPai } = req.body;
      if (!subgrupo || !subgrupo.trim()) {
        return res.status(400).json({ error: 'Nome do subgrupo é obrigatório' });
      }

      await ensureSheet();

      const existing = await readAllSubgrupos();
      const filtered = existing.filter(
        (s) =>
          !(s.nome.toLowerCase() === subgrupo.trim().toLowerCase() &&
            (!grupoPai || s.grupo.toLowerCase() === grupoPai.trim().toLowerCase()))
      );

      if (filtered.length === existing.length) {
        return res.status(404).json({ error: 'Subgrupo não encontrado' });
      }

      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A2:E`,
      });

      if (filtered.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:E${1 + filtered.length}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: filtered.map((s) => [s.nome, s.grupo, s.icone, String(s.ordem), s.ativo ? 'TRUE' : 'FALSE']),
          },
        });
      }

      cache.invalidate(CACHE_KEY);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[API/subgrupos] DELETE erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
