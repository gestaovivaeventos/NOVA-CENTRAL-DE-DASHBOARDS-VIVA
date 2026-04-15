/**
 * API Handler para buscar dados de estrutura organizacional por franquia
 * Lê a aba ESTRUTURA OFICIAL - colunas A (nm_unidade), C (%_estrutura_societária), F (%estrutura_time_sem_socio)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, CACHE_TTL } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:estrutura-oficial';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const data = await getSheetData("'ESTRUTURA OFICIAL'!A:F", CACHE_KEY, CACHE_TTL.METAS);

    if (!data || data.length < 2) {
      return res.status(200).json({ data: {} });
    }

    const headers = data[0].map((h: string) => (h || '').toString().trim());
    const rows = data.slice(1);

    // Encontrar índices das colunas
    const unidadeIdx = headers.findIndex((h: string) =>
      h.toLowerCase() === 'nm_unidade' || h.toLowerCase() === 'unidade'
    );
    const societariaIdx = headers.findIndex((h: string) =>
      h.toLowerCase().includes('estrutura_societ')
    );
    const timeIdx = headers.findIndex((h: string) =>
      h.toLowerCase().includes('estrutura_time') || h.toLowerCase().includes('time_sem_socio')
    );

    if (unidadeIdx === -1) {
      return res.status(200).json({ data: {}, message: 'Coluna nm_unidade não encontrada' });
    }

    const resultado: Record<string, { societaria: string; time: string }> = {};

    for (const row of rows) {
      const unidade = (row[unidadeIdx] || '').toString().trim();
      if (!unidade) continue;

      const societaria = societariaIdx !== -1 ? (row[societariaIdx] || '').toString().trim() : '-';
      const time = timeIdx !== -1 ? (row[timeIdx] || '').toString().trim() : '-';

      resultado[unidade] = { societaria, time };
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).json({ data: resultado });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Erro ao buscar dados de estrutura',
      message: error.message,
    });
  }
}
