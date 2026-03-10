/**
 * API para gerenciar metas dos indicadores PEX por unidade (Gestão Rede)
 * Fonte: Google Sheets - Planilha GESTAO_REDE_METAS_SPREADSHEET_ID, aba BASE
 * Colunas: data | nm_unidade | vvr | vvr_carteira | endividamento | nps | mc_entrega | enps | conformidade | reclame_aqui | colab_1_ano | estrutura_organizacional | churn | ativo_pex
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient, invalidateCache } from '@/lib/sheets-client';

const SPREADSHEET_ID = process.env.GESTAO_REDE_METAS_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.GESTAO_REDE_METAS_SHEET_NAME || 'BASE';
const CACHE_KEY = 'gestao-rede:metas';

// Mapeamento de coluna por nome do indicador (baseado na aba BASE)
const COLUNA_MAP: Record<string, string> = {
  'data': 'A',
  'nm_unidade': 'B',
  'vvr': 'C',
  'vvr_carteira': 'D',
  'endividamento': 'E',
  'nps': 'F',
  'mc_entrega': 'G',
  'enps': 'H',
  'conformidade': 'I',
  'reclame_aqui': 'J',
  'colab_1_ano': 'K',
  'estrutura_organizacional': 'L',
  'churn': 'M',
  'ativo_pex': 'N',
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!SPREADSHEET_ID) {
      return res.status(500).json({
        error: 'Configuração incompleta',
        message: 'GESTAO_REDE_METAS_SPREADSHEET_ID não configurado',
      });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!A:N`,
      });

      const rows = response.data.values || [];

      if (rows.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      const headers = rows[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, '_'));

      const data = rows.slice(1).map((row: string[]) => {
        const obj: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { unidade, data: dataRef, coluna, valor } = req.body;

      if (!unidade || !dataRef || !coluna || valor === undefined) {
        return res.status(400).json({
          error: 'Dados incompletos',
          message: 'unidade, data, coluna e valor são obrigatórios',
        });
      }

      const columnLetter = COLUNA_MAP[coluna];
      if (!columnLetter) {
        return res.status(400).json({
          error: 'Coluna inválida',
          message: `A coluna "${coluna}" não é válida`,
        });
      }

      // Buscar dados para encontrar a linha
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!A:N`,
      });

      const rows = response.data.values || [];
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Planilha vazia' });
      }

      // Encontrar a linha pela combinação unidade + data
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        const rowData = (rows[i][0] || '').trim();
        const rowUnidade = (rows[i][1] || '').trim();
        if (rowData === dataRef.trim() && rowUnidade === unidade.trim()) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        return res.status(404).json({
          error: 'Registro não encontrado',
          message: `Não encontrada a linha para "${unidade}" em "${dataRef}"`,
        });
      }

      const sheetRowNumber = rowIndex + 1;
      const updateRange = `'${SHEET_NAME}'!${columnLetter}${sheetRowNumber}`;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[String(valor)]],
        },
      });

      invalidateCache(CACHE_KEY);

      return res.status(200).json({
        success: true,
        message: `Meta atualizada: ${unidade} / ${coluna} = ${valor}`,
      });
    }

    return res.status(405).json({
      error: 'Método não permitido',
      message: 'Apenas GET e POST são permitidos',
    });

  } catch (error: any) {
    console.error('[API gestao-rede/metas] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao processar requisição',
      message: error.message || 'Erro interno',
    });
  }
}
