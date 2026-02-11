/**
 * API Route para dados de KPI
 * GET /api/kpi/data - Retorna todos os dados de KPI
 * GET /api/kpi/data?team=TIME - Retorna dados filtrados por time
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { KpiData, KpiApiResponse } from '@/modules/kpi/types';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs';
const SHEET_NAME = 'KPIS';

// Cache em memória
let cache: { data: KpiData[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Mapeamento de colunas
const COL_MAP = {
  COMPETENCIA: 0,   // A - DATA
  TIME: 1,          // B
  KPI: 3,           // D
  META: 4,          // E
  RESULTADO: 5,     // F
  ATINGIMENTO: 6,   // G - % ATINGIMENTO
  PERCENTUAL: 16,   // Q
  GRANDEZA: 9,      // J
  TENDENCIA: 15,    // P
  TIPO: 29,         // AD
  NIVEL_ACESSO: 7,  // H
};

async function fetchKpiData(): Promise<KpiData[]> {
  // Verificar cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(SHEET_NAME)}?key=${API_KEY}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status}`);
  }
  
  const result = await response.json();
  const rows = result.values || [];

  if (rows.length < 2) {
    throw new Error('Planilha de KPIs vazia');
  }

  const processedData: KpiData[] = rows
    .slice(1) // Pular cabeçalho
    .map((row: string[]) => {
      const resultadoCell = row[COL_MAP.RESULTADO];
      const atingimentoCell = row[COL_MAP.ATINGIMENTO];
      return {
        competencia: row[COL_MAP.COMPETENCIA] || '',
        time: row[COL_MAP.TIME] || '',
        kpi: row[COL_MAP.KPI] || '',
        meta: parseFloat((row[COL_MAP.META] || '0').replace(',', '.')),
        resultado:
          resultadoCell !== null && resultadoCell !== undefined && String(resultadoCell).trim() !== ''
            ? parseFloat(String(resultadoCell).replace(',', '.'))
            : null,
        atingimento:
          atingimentoCell !== null && atingimentoCell !== undefined && String(atingimentoCell).trim() !== ''
            ? parseFloat(String(atingimentoCell).replace(',', '.'))
            : null,
        percentual: parseFloat((row[COL_MAP.PERCENTUAL] || '0').replace(',', '.')),
        grandeza: (row[COL_MAP.GRANDEZA] || '').trim().toLowerCase(),
        tendencia: (row[COL_MAP.TENDENCIA] || '').toString().toUpperCase().trim(),
        tipo: (row[COL_MAP.TIPO] || '').toString().toUpperCase().trim(),
      };
    })
    .filter((d: KpiData) => d.time && d.kpi && d.competencia);

  // Atualizar cache
  cache = { data: processedData, timestamp: Date.now() };

  return processedData;
}

// Exportar função para invalidar cache (usada pelo create.ts)
export function invalidateKpiCache() {
  cache = null;
  console.log('[KPI Data] Cache invalidado');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KpiApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, data: [], error: 'Método não permitido' });
  }

  try {
    // Forçar refresh do cache se solicitado
    const { refresh } = req.query;
    if (refresh === 'true') {
      cache = null;
      console.log('[KPI Data] Cache forçado a atualizar');
    }

    let data = await fetchKpiData();
    
    // Filtrar por time se especificado
    const { team } = req.query;
    if (team && typeof team === 'string') {
      data = data.filter(d => d.time === team);
    }

    res.status(200).json({
      success: true,
      data,
      cached: cache ? Date.now() - cache.timestamp < CACHE_TTL : false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar dados de KPI:', error);
    res.status(500).json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
