/**
 * API Route para dados de OKR
 * GET /api/okr/data - Retorna todos os dados de OKR
 * GET /api/okr/data?team=TIME&quarter=Q1-2025 - Retorna dados filtrados
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { OkrData, OkrApiResponse } from '@/modules/okr/types';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs';
const SHEET_NAME = 'NOVO PAINEL OKR';

// Cache em memória
let cache: { data: OkrData[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Funções auxiliares
const parsePtBrDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('/');
  return parts.length === 3 
    ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])) 
    : null;
};

const parseNumBR = (numStr: string | undefined): number => {
  if (!numStr) return 0;
  let cleanStr = String(numStr).replace(/[R$\s]/g, '');

  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (cleanStr.includes(',') && !cleanStr.includes('.')) {
    cleanStr = cleanStr.replace(',', '.');
  } else if (cleanStr.includes('.') && !cleanStr.includes(',')) {
    const dotCount = (cleanStr.match(/\./g) || []).length;
    const lastDotIndex = cleanStr.lastIndexOf('.');
    const afterLastDot = cleanStr.length - lastDotIndex - 1;

    if (dotCount > 1 || afterLastDot !== 2) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }

  return parseFloat(cleanStr) || 0;
};

async function fetchOkrData(): Promise<OkrData[]> {
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
    throw new Error('Planilha de OKRs vazia');
  }

  const headers = rows[0].map((h: string) => h.trim().toLowerCase());

  const processedData: OkrData[] = rows.slice(1).map((row: string[], index: number) => {
    const rowData: Record<string, string> = {};
    headers.forEach((header: string, i: number) => {
      rowData[header] = row[i] || '';
    });

    const medida = (rowData['medida'] || '').toUpperCase();
    let meta: number | null = null;
    let realizado: number | null = null;
    let atingimento: number | null = null;

    // Processar meta
    const metaStr = (rowData['meta'] || '').trim();
    if (metaStr !== '') {
      if (medida.includes('PORCENTAGEM')) {
        meta = parseFloat(metaStr.replace('%', '').replace(',', '.')) / 100;
        if (isNaN(meta)) meta = null;
      } else {
        meta = parseNumBR(metaStr);
      }
    }

    // Processar realizado
    const realizadoStr = (rowData['realizado'] || '').trim();
    if (realizadoStr !== '') {
      if (medida.includes('PORCENTAGEM')) {
        realizado = parseFloat(realizadoStr.replace('%', '').replace(',', '.')) / 100;
        if (isNaN(realizado)) realizado = null;
      } else {
        realizado = parseNumBR(realizadoStr);
      }
    }

    // Processar atingimento
    const atingimentoStr = String(rowData['atingimento'] || '');
    if (atingimentoStr !== '' && atingimentoStr !== 'undefined' && atingimentoStr !== 'null') {
      let cleanValue = atingimentoStr.replace('%', '').trim();
      if (cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(',', '.');
      }
      atingimento = parseFloat(cleanValue) || 0;
    }

    return {
      data: parsePtBrDate(rowData['data']),
      time: rowData['time'] || '',
      idOkr: rowData['id okr'] || rowData['idokr'] || '',
      objetivo: rowData['objetivo'] || '',
      idKr: rowData['id kr'] || rowData['idkr'] || '',
      indicador: rowData['indicador'] || rowData['kr'] || '',
      meta,
      realizado,
      atingimento,
      atingMetaMes: rowData['atingiu meta mês'] || rowData['atingiu meta mes'] || '',
      quarter: rowData['quarter'] || rowData['q'] || '',
      tendencia: rowData['tendencia'] || rowData['tendência'] || '',
      medida: rowData['medida'] || '',
      formaDeMedir: rowData['forma de medir'] || '',
      responsavel: rowData['responsavel'] || rowData['responsável'] || '',
      rowIndex: index + 2, // +2 porque pulamos o cabeçalho e as linhas começam em 1
    };
  }).filter((d: OkrData) => d.time && (d.objetivo || d.indicador));

  // Atualizar cache
  cache = { data: processedData, timestamp: Date.now() };

  return processedData;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkrApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, data: [], error: 'Método não permitido' });
  }

  try {
    let data = await fetchOkrData();
    
    // Filtrar por time se especificado
    const { team, quarter } = req.query;
    if (team && typeof team === 'string') {
      data = data.filter(d => d.time === team);
    }
    if (quarter && typeof quarter === 'string') {
      data = data.filter(d => d.quarter === quarter || d.quarter.includes(quarter.replace('-', ' ')));
    }

    res.status(200).json({
      success: true,
      data,
      cached: cache ? Date.now() - cache.timestamp < CACHE_TTL : false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao buscar dados de OKR:', error);
    res.status(500).json({
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}
