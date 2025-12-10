import { NextApiRequest, NextApiResponse } from 'next';
import { gerencialConfig } from '../../../modules/painel-gerencial/config/app.config';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs';

interface KpiRow {
  equipe: string;
  nome: string;
  meta: number;
  realizado: number;
  percentual: number;
  unidade: string;
  competencia: string;
}

interface OkrRow {
  equipe: string;
  objetivo: string;
  keyResult: string;
  meta: number;
  realizado: number;
  percentual: number;
  trimestre: string;
}

interface TeamPerformance {
  equipe: string;
  totalKpis: number;
  kpisNaMeta: number;
  kpisAbaixoMeta: number;
  mediaPercentual: number;
}

async function fetchSheetData(sheetName: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${gerencialConfig.spreadsheetId}/values/${sheetName}!${range}?key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching ${sheetName}:`, response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error(`Error fetching ${sheetName}:`, error);
    return [];
  }
}

function parseKpiData(rows: string[][]): KpiRow[] {
  if (rows.length < 2) return [];
  
  return rows.slice(1).map(row => ({
    equipe: row[0] || '',
    nome: row[1] || '',
    meta: parseFloat(row[2]?.replace(',', '.') || '0'),
    realizado: parseFloat(row[3]?.replace(',', '.') || '0'),
    percentual: parseFloat(row[4]?.replace(',', '.') || '0'),
    unidade: row[5] || '',
    competencia: row[6] || '',
  })).filter(kpi => kpi.nome && kpi.equipe);
}

function parseOkrData(rows: string[][]): OkrRow[] {
  if (rows.length < 2) return [];
  
  return rows.slice(1).map(row => ({
    equipe: row[0] || '',
    objetivo: row[1] || '',
    keyResult: row[2] || '',
    meta: parseFloat(row[3]?.replace(',', '.') || '0'),
    realizado: parseFloat(row[4]?.replace(',', '.') || '0'),
    percentual: parseFloat(row[5]?.replace(',', '.') || '0'),
    trimestre: row[6] || '',
  })).filter(okr => okr.objetivo && okr.equipe);
}

function calculateTeamPerformance(kpis: KpiRow[]): TeamPerformance[] {
  const teamMap = new Map<string, KpiRow[]>();
  
  kpis.forEach(kpi => {
    const existing = teamMap.get(kpi.equipe) || [];
    existing.push(kpi);
    teamMap.set(kpi.equipe, existing);
  });

  return Array.from(teamMap.entries()).map(([equipe, teamKpis]) => {
    const totalKpis = teamKpis.length;
    const kpisNaMeta = teamKpis.filter(k => k.percentual >= 100).length;
    const kpisAbaixoMeta = teamKpis.filter(k => k.percentual < 80).length;
    const mediaPercentual = teamKpis.reduce((acc, k) => acc + k.percentual, 0) / totalKpis;

    return {
      equipe,
      totalKpis,
      kpisNaMeta,
      kpisAbaixoMeta,
      mediaPercentual,
    };
  });
}

function calculateEbitda(kpis: KpiRow[]): { valor: number; meta: number; percentual: number } {
  const ebitdaKpi = kpis.find(kpi => 
    kpi.nome.toLowerCase().includes('ebitda') || 
    kpi.nome.toLowerCase().includes('resultado')
  );

  if (ebitdaKpi) {
    return {
      valor: ebitdaKpi.realizado,
      meta: ebitdaKpi.meta,
      percentual: ebitdaKpi.percentual,
    };
  }

  // Calcular EBITDA agregado se não encontrar específico
  const totalRealizado = kpis.reduce((acc, k) => acc + k.realizado, 0);
  const totalMeta = kpis.reduce((acc, k) => acc + k.meta, 0);
  
  return {
    valor: totalRealizado,
    meta: totalMeta,
    percentual: totalMeta > 0 ? (totalRealizado / totalMeta) * 100 : 0,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { equipe, trimestre } = req.query;

    // Buscar dados em paralelo
    const [kpiRows, okrRows] = await Promise.all([
      fetchSheetData(gerencialConfig.sheets.KPIS, 'A:G'),
      fetchSheetData(gerencialConfig.sheets.OKRS, 'A:G'),
    ]);

    let kpis = parseKpiData(kpiRows);
    let okrs = parseOkrData(okrRows);

    // Filtrar por equipe se especificado
    if (equipe && equipe !== 'Todas') {
      kpis = kpis.filter(k => k.equipe === equipe);
      okrs = okrs.filter(o => o.equipe === equipe);
    }

    // Filtrar por trimestre se especificado
    if (trimestre && trimestre !== 'Todos') {
      okrs = okrs.filter(o => o.trimestre === trimestre);
    }

    // Calcular métricas
    const ebitda = calculateEbitda(kpis);
    const teamPerformance = calculateTeamPerformance(kpis);
    const kpisAtencao = kpis.filter(k => k.percentual < 80);

    // Extrair equipes únicas
    const equipes = [...new Set([...kpis.map(k => k.equipe), ...okrs.map(o => o.equipe)])];

    return res.status(200).json({
      success: true,
      data: {
        kpis,
        okrs,
        ebitda,
        teamPerformance,
        kpisAtencao,
        equipes,
      },
    });
  } catch (error) {
    console.error('Error in gerencial API:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do painel gerencial',
    });
  }
}
