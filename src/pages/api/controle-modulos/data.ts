/**
 * API Route - Buscar dados de controle de módulos
 * GET: retorna todos os módulos configurados na planilha BASE MODULOS
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData, getAuthenticatedClient } from '@/lib/sheets-client';
import { google } from 'googleapis';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:data';
const CACHE_TTL = 30 * 1000; // 30s

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Sempre invalidar cache e buscar direto da planilha para garantir dados frescos
    cache.invalidate(CACHE_KEY);

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:X`,
    });
    const rows = response.data.values || [];

    // Pular header (primeira linha)
    const dataRows = rows.slice(1);

    // Helper: parse CSV cell
    const csv = (v: any): string[] => {
      const s = (v || '').toString().trim();
      return s ? s.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
    };

    // Helper: normaliza valor de eixo ('geral' | 'sem_acesso' | 'restrito')
    const parseEixo = (v: any): 'geral' | 'sem_acesso' | 'restrito' | '' => {
      const s = (v || '').toString().trim().toLowerCase();
      if (s === 'geral' || s === 'sem_acesso' || s === 'restrito') return s;
      return '';
    };

    const modulos = dataRows
      .filter((row: string[]) => row[0]) // filtrar linhas vazias
      .map((row: string[]) => {
        // Legado
        const nvlAcesso = parseInt(row[3] || '0', 10);
        const usuariosPermitidos = csv(row[4]);
        const setoresPermitidos = csv(row[12]);
        const gruposPermitidos = csv(row[13]);

        // Novo modelo (Q-X): se preenchido, usa; senão, deriva do legado
        let acessoFranqueadora = parseEixo(row[16]);
        let franqueadoraSetores = csv(row[17]);
        let franqueadoraGrupos = csv(row[18]);
        let franqueadoraUsuarios = csv(row[19]);
        let acessoFranquia = parseEixo(row[20]);
        let franquiaSetores = csv(row[21]);
        let franquiaGrupos = csv(row[22]);
        let franquiaUsuarios = csv(row[23]);

        // Derivação: se eixo não está definido na planilha, calcula a partir do legado
        // Mantém permissões IDÊNTICAS às do sistema antigo.
        const hasRestricoes =
          usuariosPermitidos.length > 0 ||
          setoresPermitidos.length > 0 ||
          gruposPermitidos.length > 0;

        if (!acessoFranqueadora) {
          if (nvlAcesso === 0) {
            // Rede: franqueadora tem acesso
            acessoFranqueadora = hasRestricoes ? 'restrito' : 'geral';
            if (hasRestricoes) {
              franqueadoraSetores = setoresPermitidos;
              franqueadoraGrupos = gruposPermitidos;
              franqueadoraUsuarios = usuariosPermitidos;
            }
          } else if (nvlAcesso === 1) {
            // Franqueadora only
            acessoFranqueadora = hasRestricoes ? 'restrito' : 'geral';
            if (hasRestricoes) {
              franqueadoraSetores = setoresPermitidos;
              franqueadoraGrupos = gruposPermitidos;
              franqueadoraUsuarios = usuariosPermitidos;
            }
          } else if (nvlAcesso === 2) {
            // Franquia only → franqueadora sem acesso
            acessoFranqueadora = 'sem_acesso';
          }
        }

        if (!acessoFranquia) {
          if (nvlAcesso === 0) {
            // Rede: franquia tem acesso
            acessoFranquia = hasRestricoes ? 'restrito' : 'geral';
            if (hasRestricoes) {
              franquiaSetores = setoresPermitidos;
              franquiaGrupos = gruposPermitidos;
              franquiaUsuarios = usuariosPermitidos;
            }
          } else if (nvlAcesso === 1) {
            // Franqueadora only → franquia sem acesso
            acessoFranquia = 'sem_acesso';
          } else if (nvlAcesso === 2) {
            // Franquia only
            acessoFranquia = hasRestricoes ? 'restrito' : 'geral';
            if (hasRestricoes) {
              franquiaSetores = setoresPermitidos;
              franquiaGrupos = gruposPermitidos;
              franquiaUsuarios = usuariosPermitidos;
            }
          }
        }

        return {
          moduloId: (row[0] || '').trim(),
          moduloNome: (row[1] || '').trim(),
          moduloPath: (row[2] || '').trim(),
          nvlAcesso,
          usuariosPermitidos,
          ativo: (row[5] || '').toUpperCase() === 'TRUE',
          grupo: (row[6] || '').trim(),
          ordem: parseInt(row[7] || '0', 10),
          icone: (row[8] || '').trim(),
          tipo: ((row[9] || '').trim().toLowerCase() || 'interno') as 'interno' | 'externo',
          urlExterna: (row[10] || '').trim(),
          subgrupo: (row[11] || '').trim(),
          setoresPermitidos,
          gruposPermitidos,
          beta: (row[14] || '').toUpperCase() === 'TRUE',
          usuariosExcecao: csv(row[15]),
          acessoFranqueadora: (acessoFranqueadora || 'sem_acesso') as 'geral' | 'sem_acesso' | 'restrito',
          franqueadoraSetores,
          franqueadoraGrupos,
          franqueadoraUsuarios,
          acessoFranquia: (acessoFranquia || 'sem_acesso') as 'geral' | 'sem_acesso' | 'restrito',
          franquiaSetores,
          franquiaGrupos,
          franquiaUsuarios,
        };
      });

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json({ modulos, cached: true });
  } catch (error: any) {
    console.error('[API/controle-modulos/data] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}
