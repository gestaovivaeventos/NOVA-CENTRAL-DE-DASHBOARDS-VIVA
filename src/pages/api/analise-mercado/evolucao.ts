/**
 * API Handler para buscar dados de evolução histórica - Análise de Mercado
 * Busca dados das planilhas INEP (2022, 2023, 2024) via Google Drive
 * Colunas: QT_MAT (matriculados), QT_ING (ingressantes), QT_CONC (concluintes)
 */

import type { NextApiRequest, NextApiResponse } from 'next';

// IDs dos arquivos do Google Drive (arquivos .txt tratados)
const FILE_IDS = {
  '2022': '1AB9U9HkW3LjP1gGepAcMk30WCxpxOpm1',
  '2023': '1Any8xbG7YyOX21pRZRHbIL6nRbF6fbTl',
  '2024': '1sOxBpbiUt57DsAM4VUdbcQboQ_XifpFy',
};

interface DadosEvolucao {
  ano: number;
  matriculas: number;
  concluintes: number;
  ingressantes: number;
}

interface EvolucaoResponse {
  evolucao: DadosEvolucao[];
  debug?: any;
}

interface ErrorResponse {
  error: string;
  message: string;
}

// Cache em memória simples
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Baixa arquivo txt do Google Drive (com bypass de virus scan para arquivos grandes)
 */
async function downloadFromDrive(fileId: string): Promise<string> {
  const cacheKey = `drive:${fileId}`;
  const now = Date.now();
  
  // Verificar cache
  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  // URL de download direto com parâmetro confirm para arquivos grandes
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
  
  // Verificar se ainda é página HTML (aviso do Google)
  if (text.startsWith('<!DOCTYPE html>') || text.startsWith('<html')) {
    throw new Error('Google Drive retornou página HTML ao invés do arquivo');
  }
  
  // Salvar no cache
  cache[cacheKey] = { data: text, timestamp: now };
  
  return text;
}

/**
 * Processa arquivo txt (delimitado por tabulação ou ponto-e-vírgula)
 */
function parseTxtFile(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Detectar delimitador (tabulação ou ponto-e-vírgula)
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
 * Soma valores de uma coluna específica
 */
function sumColumn(rows: string[][], colIndex: number): number {
  if (colIndex === -1) return 0;
  return rows.reduce((acc, row) => {
    const val = row[colIndex];
    const num = parseFloat(String(val || '0').replace(/[^\d.-]/g, ''));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EvolucaoResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', message: 'Use GET' });
  }

  try {
    const evolucao: DadosEvolucao[] = [];
    const debugInfo: any = {};

    // Buscar dados de cada ano em paralelo
    const anos = Object.keys(FILE_IDS) as Array<keyof typeof FILE_IDS>;
    
    const resultados = await Promise.all(
      anos.map(async (ano) => {
        try {
          const content = await downloadFromDrive(FILE_IDS[ano]);
          return { ano, content, error: null };
        } catch (err: any) {
          console.error(`[API analise-mercado/evolucao] Erro ao baixar ${ano}:`, err.message);
          return { ano, content: '', error: err.message };
        }
      })
    );

    // Processar resultados
    for (const { ano, content, error } of resultados) {
      if (error || !content) {
        console.warn(`[API analise-mercado/evolucao] Sem dados para ${ano}: ${error}`);
        debugInfo[ano] = { error };
        continue;
      }

      const { headers, rows } = parseTxtFile(content);
      
      if (rows.length === 0) {
        console.warn(`[API analise-mercado/evolucao] Arquivo vazio para ${ano}`);
        debugInfo[ano] = { error: 'Arquivo vazio', headers };
        continue;
      }

      // Encontrar índices das colunas
      const idxMat = findColumnIndex(headers, 'QT_MAT', 'QTMAT', 'MATRICULAS');
      const idxIng = findColumnIndex(headers, 'QT_ING', 'QTING', 'INGRESSANTES');
      const idxConc = findColumnIndex(headers, 'QT_CONC', 'QTCONC', 'CONCLUINTES');

      debugInfo[ano] = { 
        headers, 
        rowCount: rows.length,
        idxMat,
        idxIng,
        idxConc,
        sampleRow: rows[0]
      };

      // Calcular totais
      const matriculas = sumColumn(rows, idxMat);
      const ingressantes = sumColumn(rows, idxIng);
      const concluintes = sumColumn(rows, idxConc);

      evolucao.push({
        ano: parseInt(ano),
        matriculas,
        ingressantes,
        concluintes,
      });
    }

    // Ordenar por ano
    evolucao.sort((a, b) => a.ano - b.ano);

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ evolucao, debug: debugInfo });

  } catch (error: any) {
    console.error('[API analise-mercado/evolucao] Error:', error.message);
    return res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message || 'Ocorreu um erro ao tentar buscar os dados dos arquivos',
    });
  }
}
