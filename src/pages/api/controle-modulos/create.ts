/**
 * API Route - Criar novo módulo (link externo) na planilha BASE MODULOS
 * POST: adiciona uma nova linha
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const spreadsheetId = process.env.CONTROLE_MODULOS_SPREADSHEET_ID;
    const sheetName = process.env.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

    if (!spreadsheetId) {
      return res.status(500).json({
        error: 'Configuração ausente',
        message: 'CONTROLE_MODULOS_SPREADSHEET_ID não configurado',
      });
    }

    const {
      moduloId,
      moduloNome,
      moduloPath,
      nvlAcesso = 0,
      usuariosPermitidos = '',
      ativo = 'TRUE',
      grupo = '',
      ordem = 1,
      icone = 'link',
      tipo = 'externo',
      urlExterna = '',
      subgrupo = '',
      setoresPermitidos = '',
      gruposPermitidos = '',
      beta = 'FALSE',
      usuariosExcecao = '',
      acessoFranqueadora = '',
      franqueadoraSetores = '',
      franqueadoraGrupos = '',
      franqueadoraUsuarios = '',
      acessoFranquia = '',
      franquiaSetores = '',
      franquiaGrupos = '',
      franquiaUsuarios = '',
    } = req.body;

    if (!moduloId || !moduloNome) {
      return res.status(400).json({
        error: 'Dados obrigatórios: moduloId e moduloNome',
      });
    }

    if (tipo === 'externo' && !urlExterna) {
      return res.status(400).json({
        error: 'URL Externa é obrigatória para módulos do tipo externo',
      });
    }

    // Invalidar cache
    cache.invalidate(CACHE_KEY);

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Verificar se moduloId já existe
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });

    const rows = existing.data.values || [];
    const idExists = rows.some((row, i) => i > 0 && (row[0] || '').trim() === moduloId.trim());

    if (idExists) {
      return res.status(409).json({
        error: `Já existe um módulo com o ID "${moduloId}"`,
      });
    }

    // Montar nova linha: A-N
    const newRow = [
      moduloId.trim(),
      moduloNome.trim(),
      (moduloPath || '').trim(),
      String(nvlAcesso),
      usuariosPermitidos,
      ativo,
      grupo.trim(),
      String(ordem),
      icone.trim(),
      tipo,
      urlExterna.trim(),
      (subgrupo || '').trim(),
      setoresPermitidos,
      gruposPermitidos,
      beta,
      usuariosExcecao,
      acessoFranqueadora,
      franqueadoraSetores,
      franqueadoraGrupos,
      franqueadoraUsuarios,
      acessoFranquia,
      franquiaSetores,
      franquiaGrupos,
      franquiaUsuarios,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:X`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    // Invalidar cache após escrita
    cache.invalidate(CACHE_KEY);

    return res.status(201).json({
      success: true,
      message: 'Módulo criado com sucesso',
    });
  } catch (error: any) {
    console.error('[API/controle-modulos/create] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
