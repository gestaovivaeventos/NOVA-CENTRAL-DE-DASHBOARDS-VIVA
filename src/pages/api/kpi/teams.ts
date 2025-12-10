/**
 * API Route para listar times disponíveis para KPI
 * GET /api/kpi/teams - Retorna lista de times únicos
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs';
const SHEET_NAME = 'KPIS';

// Cache em memória
let teamsCache: { data: string[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

async function fetchTeams(): Promise<string[]> {
  // Verificar cache
  if (teamsCache && Date.now() - teamsCache.timestamp < CACHE_TTL) {
    return teamsCache.data;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status}`);
  }
  
  const result = await response.json();
  const rows = result.values || [];

  if (rows.length < 2) {
    return [];
  }

  // Coluna B (índice 1) é o TIME
  const teamsSet = new Set<string>();
  rows.slice(1).forEach((row: string[]) => {
    const team = row[1]?.trim();
    if (team) {
      teamsSet.add(team);
    }
  });

  const teams = Array.from(teamsSet).sort();

  // Atualizar cache
  teamsCache = { data: teams, timestamp: Date.now() };

  return teams;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const teams = await fetchTeams();

    res.status(200).json({
      success: true,
      data: teams,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar times:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
