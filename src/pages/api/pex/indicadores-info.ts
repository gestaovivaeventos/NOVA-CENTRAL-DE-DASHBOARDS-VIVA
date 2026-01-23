/**
 * API Handler para buscar informações dos indicadores (RESUMO e CÁLCULO)
 * Lê da aba CRITERIOS RANKING colunas H (RESUMO) e I (CÁLCULO)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, CACHE_TTL } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:indicadores-info';

interface IndicadorInfo {
  indicador: string;
  resumo: string;
  calculo: string;
}

interface SuccessResponse {
  success: boolean;
  data: IndicadorInfo[];
}

interface ErrorResponse {
  error: string;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Método não permitido',
      message: 'Apenas GET é permitido',
    });
  }

  try {
    // Buscar colunas B (indicador), H (RESUMO) e I (CÁLCULO) da aba CRITERIOS RANKING
    // Usamos A:I para pegar todas as colunas até I
    const data = await getSheetData('CRITERIOS RANKING!A:I', CACHE_KEY, CACHE_TTL.CRITERIOS);
    
    if (!data || data.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Primeira linha são headers
    const headers = data[0] as string[];
    const rows = data.slice(1);

    // Encontrar índices das colunas
    // Coluna B = índice 1 (INDICADOR)
    // Coluna H = índice 7 (RESUMO)
    // Coluna I = índice 8 (CÁLCULO)
    const indicadorIdx = 1; // Coluna B
    const resumoIdx = 7;    // Coluna H
    const calculoIdx = 8;   // Coluna I

    const indicadoresInfo: IndicadorInfo[] = rows
      .filter((row: any[]) => row[indicadorIdx] && row[indicadorIdx].toString().trim())
      .map((row: any[]) => ({
        indicador: (row[indicadorIdx] || '').toString().trim(),
        resumo: (row[resumoIdx] || '').toString().trim(),
        calculo: (row[calculoIdx] || '').toString().trim(),
      }));

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).json({
      success: true,
      data: indicadoresInfo,
    });

  } catch (error: any) {
    console.error('Erro ao buscar informações dos indicadores:', error);
    return res.status(500).json({
      error: 'Erro ao buscar dados',
      message: error.message || 'A aba CRITERIOS RANKING não foi encontrada na planilha',
    });
  }
}
