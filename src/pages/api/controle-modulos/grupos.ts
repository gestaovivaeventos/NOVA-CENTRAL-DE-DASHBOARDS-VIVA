/**
 * API Route - Gerenciar grupos customizados
 * GET: lista grupos salvos na aba GRUPOS (nome + ícone + ordem + ativo)
 * POST: adiciona novo grupo
 * PUT: atualiza campos de um grupo (nome, ícone, ordem, ativo)
 * DELETE: remove grupo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:grupos';
const SHEET_NAME = 'GRUPOS';

// Grupos padrão para seed inicial (coluna A: nome, B: ícone, C: ordem, D: ativo)
const SEED_GRUPOS = [
  ['Direcionamento Estratégico', 'target', '1', 'TRUE'],
  ['Saúde Financeira & Tesouraria', 'money', '2', 'TRUE'],
  ['Performance & Vendas', 'chart', '3', 'TRUE'],
  ['Operações & Sucesso do Aluno', 'trophy', '4', 'TRUE'],
  ['Gente, Cultura & Time', 'users', '5', 'TRUE'],
  ['Ferramentas & Apoio', 'settings', '6', 'TRUE'],
  ['Relatórios Recorrentes', 'file-spreadsheet', '7', 'TRUE'],
  ['Desenvolvimento', 'code', '8', 'TRUE'],
];

interface GrupoInfo {
  nome: string;
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

  // Garantir que a aba GRUPOS existe, com seed se for nova
  // Também repara headers e dados deslocados
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
        // Cabeçalho + dados padrão (4 colunas)
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A1:D${1 + SEED_GRUPOS.length}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['grupo', 'icone', 'ordem', 'ativo'], ...SEED_GRUPOS],
          },
        });
        return;
      }

      // Sempre garantir header correto (repara headers faltando)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1:D1`,
        valueInputOption: 'RAW',
        requestBody: { values: [['grupo', 'icone', 'ordem', 'ativo']] },
      });

      // Reparar dados deslocados: ler range amplo e normalizar
      const allData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A2:H`,
      });
      const allRows = allData.data.values || [];
      let needsRepair = false;
      const cleanRows: string[][] = [];

      for (const row of allRows) {
        const colA = (row[0] || '').trim();
        if (colA) {
          // Dados na coluna A — row ok, normalizar para 4 colunas
          cleanRows.push([
            colA,
            (row[1] || 'settings').trim(),
            (row[2] || '99'),
            (row[3] || 'TRUE'),
          ]);
        } else {
          // Coluna A vazia — verificar se há dados deslocados
          const values = row.map(v => (v || '').trim()).filter(Boolean);
          if (values.length >= 1) {
            needsRepair = true;
            // Reconstruir: primeiro valor não-numérico que não é TRUE/FALSE/icon é o nome
            cleanRows.push([
              values[0] || '',
              values[1] || 'settings',
              values[2] || '99',
              values[3] || 'TRUE',
            ]);
          }
        }
      }

      if (needsRepair && cleanRows.length > 0) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:H`,
        });
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:D${1 + cleanRows.length}`,
          valueInputOption: 'RAW',
          requestBody: { values: cleanRows },
        });
      }
    } catch (err: any) {
      console.error('[API/grupos] Erro ao garantir aba:', err.message);
    }
  }

  // Helper: ler todos os grupos da planilha
  async function readAllGrupos(): Promise<GrupoInfo[]> {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:D`,
    });

    const rows = result.data.values || [];
    return rows
      .slice(1)
      .filter((r) => (r[0] || '').trim())
      .map((r) => ({
        nome: (r[0] || '').trim(),
        icone: (r[1] || 'settings').trim(),
        ordem: parseInt(r[2] || '99', 10) || 99,
        ativo: (r[3] || 'TRUE').trim().toUpperCase() !== 'FALSE',
      }));
  }

  if (req.method === 'GET') {
    try {
      const forceRefresh = req.query.refresh === 'true';
      if (!forceRefresh) {
        const cached = cache.get(CACHE_KEY);
        if (cached) {
          return res.status(200).json({ grupos: cached });
        }
      }

      await ensureSheet();
      const grupos = await readAllGrupos();

      cache.set(CACHE_KEY, grupos);
      return res.status(200).json({ grupos });
    } catch (error: any) {
      console.error('[API/grupos] GET erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { grupo, icone = 'settings', ordem, ativo = true } = req.body;
      if (!grupo || !grupo.trim()) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }

      await ensureSheet();

      const existing = await readAllGrupos();
      const alreadyExists = existing.some(
        (g) => g.nome.toLowerCase() === grupo.trim().toLowerCase()
      );

      if (alreadyExists) {
        return res.status(409).json({ error: `Grupo "${grupo.trim()}" já existe` });
      }

      // Calcular ordem se não fornecida
      const ordemFinal = ordem != null ? ordem : (existing.length > 0 ? Math.max(...existing.map(g => g.ordem)) + 1 : 1);

      // Escrever explicitamente na próxima linha vazia (evita append deslocado)
      const allRows = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:A`,
      });
      const nextRow = (allRows.data.values?.length || 1) + 1;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A${nextRow}:D${nextRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[grupo.trim(), icone.trim(), String(ordemFinal), ativo ? 'TRUE' : 'FALSE']] },
      });

      cache.invalidate(CACHE_KEY);
      return res.status(201).json({ success: true, grupo: grupo.trim() });
    } catch (error: any) {
      console.error('[API/grupos] POST erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { grupo, nome, icone, ordem, ativo } = req.body;
      if (!grupo || !grupo.trim()) {
        return res.status(400).json({ error: 'Nome do grupo (identificador) é obrigatório' });
      }

      await ensureSheet();

      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAME}!A:D`,
      });

      const rows = result.data.values || [];
      const rowIndex = rows.findIndex(
        (r, i) =>
          i > 0 &&
          (r[0] || '').trim().toLowerCase() === grupo.trim().toLowerCase()
      );

      if (rowIndex === -1) {
        // Grupo não existe na planilha — criar (upsert)
        const allGrupos = rows.slice(1).filter(r => (r[0] || '').trim());
        const ordemFinal = ordem != null ? ordem : (allGrupos.length + 1);
        const newRow = [
          (nome || grupo).trim(),
          (icone || 'settings').trim(),
          String(ordemFinal),
          ativo != null ? (ativo ? 'TRUE' : 'FALSE') : 'TRUE',
        ];

        // Escrever explicitamente na próxima linha (evita append deslocado)
        const nextRow = rows.length + 1;
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A${nextRow}:D${nextRow}`,
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] },
        });
      } else {
        // Se renomeou, verificar duplicata
        if (nome && nome.trim() !== grupo.trim()) {
          const duplicate = rows.find(
            (r, i) =>
              i > 0 &&
              i !== rowIndex &&
              (r[0] || '').trim().toLowerCase() === nome.trim().toLowerCase()
          );
          if (duplicate) {
            return res.status(409).json({ error: `Grupo "${nome.trim()}" já existe` });
          }
        }

        // Montar linha atualizada
        const currentRow = rows[rowIndex];
        const oldNome = (currentRow[0] || '').trim();
        const newNome = nome != null ? nome.trim() : oldNome;
        const updatedRow = [
          newNome,
          icone != null ? icone.trim() : (currentRow[1] || 'settings').trim(),
          ordem != null ? String(ordem) : (currentRow[2] || '99'),
          ativo != null ? (ativo ? 'TRUE' : 'FALSE') : (currentRow[3] || 'TRUE'),
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A${rowIndex + 1}:D${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [updatedRow] },
        });

        // Cascade: se renomeou, atualizar grupo em BASE MODULOS e SUBGRUPOS
        if (newNome.toLowerCase() !== oldNome.toLowerCase()) {
          const baseSheetName = process.env.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

          // 1) Atualizar coluna G (grupo) em BASE MODULOS
          try {
            const baseData = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `${baseSheetName}!A:L`,
            });
            const baseRows = baseData.data.values || [];
            for (let i = 1; i < baseRows.length; i++) {
              const rowGrupo = (baseRows[i][6] || '').trim();
              if (rowGrupo.toLowerCase() === oldNome.toLowerCase()) {
                await sheets.spreadsheets.values.update({
                  spreadsheetId,
                  range: `${baseSheetName}!G${i + 1}`,
                  valueInputOption: 'RAW',
                  requestBody: { values: [[newNome]] },
                });
              }
            }
          } catch (err: any) {
            console.error('[API/grupos] Cascade BASE MODULOS erro:', err.message);
          }

          // 2) Atualizar coluna B (grupo) em SUBGRUPOS
          try {
            const sgData = await sheets.spreadsheets.values.get({
              spreadsheetId,
              range: `SUBGRUPOS!A:E`,
            });
            const sgRows = sgData.data.values || [];
            for (let i = 1; i < sgRows.length; i++) {
              const sgGrupo = (sgRows[i][1] || '').trim();
              if (sgGrupo.toLowerCase() === oldNome.toLowerCase()) {
                await sheets.spreadsheets.values.update({
                  spreadsheetId,
                  range: `SUBGRUPOS!B${i + 1}`,
                  valueInputOption: 'RAW',
                  requestBody: { values: [[newNome]] },
                });
              }
            }
          } catch (err: any) {
            console.error('[API/grupos] Cascade SUBGRUPOS erro:', err.message);
          }

          // Invalidar caches relacionados
          cache.invalidate('controle-modulos:data');
          cache.invalidate('controle-modulos:subgrupos');
        }
      }

      cache.invalidate(CACHE_KEY);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[API/grupos] PUT erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { grupo } = req.body;
      if (!grupo || !grupo.trim()) {
        return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
      }

      await ensureSheet();

      const existing = await readAllGrupos();
      const filtered = existing.filter(
        (g) => g.nome.toLowerCase() !== grupo.trim().toLowerCase()
      );

      if (filtered.length === existing.length) {
        return res.status(404).json({ error: 'Grupo não encontrado' });
      }

      // Limpar e reescrever
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `${SHEET_NAME}!A2:D`,
      });

      if (filtered.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${SHEET_NAME}!A2:D${1 + filtered.length}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: filtered.map((g) => [g.nome, g.icone, String(g.ordem), g.ativo ? 'TRUE' : 'FALSE']),
          },
        });
      }

      cache.invalidate(CACHE_KEY);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('[API/grupos] DELETE erro:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
