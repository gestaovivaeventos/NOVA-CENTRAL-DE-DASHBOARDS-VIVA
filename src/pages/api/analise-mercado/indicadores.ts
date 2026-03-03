/**
 * API Handler para buscar indicadores com filtros - Análise de Mercado
 * Retorna totais de QT_MAT, QT_ING, QT_CONC filtrados por ano, tipoInstituicao e área
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// IDs dos arquivos do Google Drive
const FILE_IDS: Record<string, string> = {
  '2022': '1AB9U9HkW3LjP1gGepAcMk30WCxpxOpm1',
  '2023': '1Any8xbG7YyOX21pRZRHbIL6nRbF6fbTl',
  '2024': '1sOxBpbiUt57DsAM4VUdbcQboQ_XifpFy',
};

interface IndicadoresResponse {
  ano: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
  // Comparativo com ano anterior
  variacaoMat: number;
  variacaoConc: number;
  variacaoIng: number;
  // Filtros aplicados
  filtros: {
    tipoInstituicao: string;
    area: string | null;
  };
}

interface ErrorResponse {
  error: string;
  message: string;
}

// Cache em memória (compartilhado com evolucao.ts através de require)
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Cache para dados parseados
const parsedDataCache: { [ano: string]: { headers: string[]; rows: string[][] } } = {};

/**
 * Baixa arquivo txt do Google Drive
 */
async function downloadFromDrive(fileId: string): Promise<string> {
  const cacheKey = `drive:${fileId}`;
  const now = Date.now();
  
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  const url = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    redirect: 'follow',
  });
  
  if (!response.ok) {
    throw new Error(`Falha ao baixar arquivo: ${response.status}`);
  }
  
  const text = await response.text();
  
  if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html')) {
    throw new Error('Google Drive retornou página HTML');
  }
  
  cache[cacheKey] = { data: text, timestamp: now };
  return text;
}

/**
 * Processa arquivo txt
 */
function parseTxtFile(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : 
                    firstLine.includes(';') ? ';' : 
                    firstLine.includes('|') ? '|' : ',';
  
  const headers = lines[0].split(delimiter).map(h => h.trim());
  const rows = lines.slice(1)
    .filter(line => line.trim())
    .map(line => line.split(delimiter).map(cell => cell.trim()));
  
  return { headers, rows };
}

/**
 * Encontra o índice de uma coluna pelo nome
 */
function findColumnIndex(headers: string[], ...possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => (h || '').toString().trim().toUpperCase());
  for (const name of possibleNames) {
    const idx = normalizedHeaders.findIndex(h => h.includes(name.toUpperCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Soma valores de uma coluna com filtros aplicados
 */
function sumColumnFiltered(
  rows: string[][], 
  colIndex: number, 
  filtros: { tipoRedeIdx: number; tipoRede: string | null; areaIdx: number; area: string | null }
): number {
  if (colIndex === -1) return 0;
  
  return rows.reduce((acc, row) => {
    // Aplicar filtro de tipo de rede (1 = pública, 2 = privada)
    if (filtros.tipoRede && filtros.tipoRedeIdx !== -1) {
      const valorRede = row[filtros.tipoRedeIdx];
      if (filtros.tipoRede === 'publica' && valorRede !== '1') return acc;
      if (filtros.tipoRede === 'privada' && valorRede !== '2') return acc;
    }
    
    // Aplicar filtro de área
    if (filtros.area && filtros.areaIdx !== -1) {
      const valorArea = (row[filtros.areaIdx] || '').toLowerCase();
      if (!valorArea.includes(filtros.area.toLowerCase())) return acc;
    }
    
    const val = row[colIndex];
    const num = parseFloat(String(val || '0').replace(/[^\d.-]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
}

/**
 * Obtém dados parseados de um ano (com cache)
 */
async function getDadosAno(ano: string): Promise<{ headers: string[]; rows: string[][] }> {
  if (parsedDataCache[ano]) {
    return parsedDataCache[ano];
  }
  
  const fileId = FILE_IDS[ano];
  if (!fileId) {
    return { headers: [], rows: [] };
  }
  
  const content = await downloadFromDrive(fileId);
  const parsed = parseTxtFile(content);
  parsedDataCache[ano] = parsed;
  return parsed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IndicadoresResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', message: 'Use GET' });
  }

  try {
    // Parâmetros de filtro
    const ano = String(req.query.ano || '2024');
    const tipoInstituicao = String(req.query.tipo || 'todos'); // todos, publica, privada
    const area = req.query.area ? String(req.query.area) : null;
    
    // Calcular ano anterior para variação
    const anoAnterior = String(parseInt(ano) - 1);
    
    // Buscar dados do ano selecionado e anterior em paralelo
    const [dadosAno, dadosAnoAnterior] = await Promise.all([
      getDadosAno(ano),
      getDadosAno(anoAnterior),
    ]);
    
    if (dadosAno.rows.length === 0) {
      return res.status(404).json({ error: 'Ano não encontrado', message: `Dados para ${ano} não disponíveis` });
    }
    
    // Encontrar índices de colunas
    const idxMat = findColumnIndex(dadosAno.headers, 'QT_MAT');
    const idxIng = findColumnIndex(dadosAno.headers, 'QT_ING');
    const idxConc = findColumnIndex(dadosAno.headers, 'QT_CONC');
    const idxRede = findColumnIndex(dadosAno.headers, 'TP_REDE');
    const idxArea = findColumnIndex(dadosAno.headers, 'NO_CINE_AREA_GERAL', 'AREA');
    
    // Configurar filtros
    const filtros = {
      tipoRedeIdx: idxRede,
      tipoRede: tipoInstituicao !== 'todos' ? tipoInstituicao : null,
      areaIdx: idxArea,
      area: area,
    };
    
    // Calcular totais do ano selecionado
    const matriculas = sumColumnFiltered(dadosAno.rows, idxMat, filtros);
    const ingressantes = sumColumnFiltered(dadosAno.rows, idxIng, filtros);
    const concluintes = sumColumnFiltered(dadosAno.rows, idxConc, filtros);
    
    // Calcular totais do ano anterior para variação
    let variacaoMat = 0, variacaoConc = 0, variacaoIng = 0;
    
    if (dadosAnoAnterior.rows.length > 0) {
      const idxMatAnt = findColumnIndex(dadosAnoAnterior.headers, 'QT_MAT');
      const idxIngAnt = findColumnIndex(dadosAnoAnterior.headers, 'QT_ING');
      const idxConcAnt = findColumnIndex(dadosAnoAnterior.headers, 'QT_CONC');
      const idxRedeAnt = findColumnIndex(dadosAnoAnterior.headers, 'TP_REDE');
      const idxAreaAnt = findColumnIndex(dadosAnoAnterior.headers, 'NO_CINE_AREA_GERAL', 'AREA');
      
      const filtrosAnt = {
        tipoRedeIdx: idxRedeAnt,
        tipoRede: tipoInstituicao !== 'todos' ? tipoInstituicao : null,
        areaIdx: idxAreaAnt,
        area: area,
      };
      
      const matAnt = sumColumnFiltered(dadosAnoAnterior.rows, idxMatAnt, filtrosAnt);
      const ingAnt = sumColumnFiltered(dadosAnoAnterior.rows, idxIngAnt, filtrosAnt);
      const concAnt = sumColumnFiltered(dadosAnoAnterior.rows, idxConcAnt, filtrosAnt);
      
      variacaoMat = matAnt > 0 ? ((matriculas - matAnt) / matAnt) * 100 : 0;
      variacaoIng = ingAnt > 0 ? ((ingressantes - ingAnt) / ingAnt) * 100 : 0;
      variacaoConc = concAnt > 0 ? ((concluintes - concAnt) / concAnt) * 100 : 0;
    }
    
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({
      ano: parseInt(ano),
      matriculas,
      concluintes,
      ingressantes,
      variacaoMat,
      variacaoConc,
      variacaoIng,
      filtros: {
        tipoInstituicao,
        area,
      },
    });

  } catch (error: any) {
    console.error('[API analise-mercado/indicadores] Error:', error.message);
    return res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message,
    });
  }
}
