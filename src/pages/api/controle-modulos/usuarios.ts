/**
 * API Route - Listar todos os usernames habilitados da planilha de controle de acesso
 * GET: retorna lista de { username, name, accessLevel }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:usuarios';
const CACHE_TTL = 60 * 1000; // 1 minuto

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return res.status(200).json({ usuarios: cached });
    }

    const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
    if (!sheetId) {
      return res.status(500).json({ error: 'GOOGLE_ACCESS_CONTROL_SHEET_ID não configurado' });
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Erro ao buscar CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Colunas: D (3) = nome, E (4) = username, F (5) = enabled, L (11) = nvl_acesso_unidade
    const userMap = new Map<string, { username: string; name: string; accessLevel: number }>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVLine(line);
      if (cells.length > 11) {
        const name = cells[3]?.trim().replace(/^"|"$/g, '');
        const username = cells[4]?.trim().replace(/^"|"$/g, '');
        const enabledStr = cells[5]?.trim().replace(/^"|"$/g, '').toUpperCase();
        const accessLevelStr = cells[11]?.trim().replace(/^"|"$/g, '');

        const enabled = enabledStr === 'TRUE';
        const accessLevel = accessLevelStr === '1' ? 1 : 0;

        if (username && name && enabled && !userMap.has(username)) {
          userMap.set(username, { username, name, accessLevel });
        }
      }
    }

    const usuarios = Array.from(userMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR')
    );

    cache.set(CACHE_KEY, usuarios, CACHE_TTL);

    return res.status(200).json({ usuarios });
  } catch (error: any) {
    console.error('[API/controle-modulos/usuarios] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}

// Parser CSV que lida com aspas e vírgulas dentro de campos
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
