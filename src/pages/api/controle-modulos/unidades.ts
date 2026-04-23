/**
 * API Route - Listar todas as unidades (franquias) cadastradas na planilha de controle de acesso.
 * GET: retorna lista de { nome } (únicos e ordenados) das colunas nm_unidade,
 * considerando apenas linhas com nvl_acesso_unidade = 0 (franquia).
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import cache from '@/lib/cache';

const CACHE_KEY = 'controle-modulos:unidades';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
      return res.status(200).json({ unidades: cached });
    }

    const sheetId = process.env.GOOGLE_ACCESS_CONTROL_SHEET_ID;
    if (!sheetId) {
      return res
        .status(500)
        .json({ error: 'GOOGLE_ACCESS_CONTROL_SHEET_ID não configurado' });
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Erro ao buscar CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Colunas: B (1) = nm_unidade, F (5) = enabled, L (11) = nvl_acesso_unidade
    const set = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = parseCSVLine(line);
      if (cells.length > 11) {
        const nmUnidade = cells[1]?.trim().replace(/^"|"$/g, '') || '';
        const enabledStr = cells[5]?.trim().replace(/^"|"$/g, '').toUpperCase();
        const accessLevelStr = cells[11]?.trim().replace(/^"|"$/g, '');

        if (!nmUnidade) continue;
        if (enabledStr !== 'TRUE') continue;
        // Somente franquias (accessLevel = 0) possuem unidades reais vinculadas
        if (accessLevelStr !== '0') continue;

        set.add(nmUnidade);
      }
    }

    const unidades = Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    cache.set(CACHE_KEY, unidades, CACHE_TTL);

    return res.status(200).json({ unidades });
  } catch (error: any) {
    console.error('[API/controle-modulos/unidades] Erro:', error.message);
    return res.status(500).json({
      error: 'Erro interno',
      message: error.message || 'Erro desconhecido',
    });
  }
}

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
