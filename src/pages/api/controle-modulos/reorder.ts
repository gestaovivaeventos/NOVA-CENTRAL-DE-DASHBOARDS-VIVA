/**
 * API Route - Reordenar itens em lote (grupos, subgrupos, módulos)
 * PUT: atualiza ordem de múltiplos itens de uma vez
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const spreadsheetId = process.env.CONTROLE_MODULOS_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'CONTROLE_MODULOS_SPREADSHEET_ID não configurado' });
    }

    const { type, items } = req.body;

    if (!type || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Envie { type: "grupo"|"subgrupo"|"modulo", items: [{ id, ordem }] }' });
    }

    if (!['grupo', 'subgrupo', 'modulo'].includes(type)) {
      return res.status(400).json({ error: 'type deve ser "grupo", "subgrupo" ou "modulo"' });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    if (type === 'grupo') {
      const sheetName = 'GRUPOS';
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:D`,
      });
      const rows = result.data.values || [];

      for (const item of items) {
        const { id, ordem } = item;
        if (!id || ordem === undefined) continue;

        for (let i = 1; i < rows.length; i++) {
          if ((rows[i][0] || '').trim().toLowerCase() === String(id).trim().toLowerCase()) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${sheetName}!C${i + 1}`,
              valueInputOption: 'RAW',
              requestBody: { values: [[String(ordem)]] },
            });
            break;
          }
        }
      }

      cache.invalidate('controle-modulos:grupos');
    }

    if (type === 'subgrupo') {
      const sheetName = 'SUBGRUPOS';
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:E`,
      });
      const rows = result.data.values || [];

      for (const item of items) {
        // id format: "grupo::subgrupo" or just subgrupo name with grupo field
        const { id, grupo: itemGrupo, ordem } = item;
        if (!id || ordem === undefined) continue;

        for (let i = 1; i < rows.length; i++) {
          const rowNome = (rows[i][0] || '').trim().toLowerCase();
          const rowGrupo = (rows[i][1] || '').trim().toLowerCase();
          const matchNome = rowNome === String(id).trim().toLowerCase();
          const matchGrupo = !itemGrupo || rowGrupo === String(itemGrupo).trim().toLowerCase();
          if (matchNome && matchGrupo) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${sheetName}!D${i + 1}`,
              valueInputOption: 'RAW',
              requestBody: { values: [[String(ordem)]] },
            });
            break;
          }
        }
      }

      cache.invalidate('controle-modulos:subgrupos');
    }

    if (type === 'modulo') {
      const sheetName = process.env.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:L`,
      });
      const rows = result.data.values || [];

      for (const item of items) {
        const { id, ordem } = item;
        if (!id || ordem === undefined) continue;

        for (let i = 1; i < rows.length; i++) {
          if ((rows[i][0] || '').trim() === String(id).trim()) {
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: `${sheetName}!H${i + 1}`,
              valueInputOption: 'RAW',
              requestBody: { values: [[String(ordem)]] },
            });
            break;
          }
        }
      }

      cache.invalidate('controle-modulos:data');
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[API/reorder] Erro:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
