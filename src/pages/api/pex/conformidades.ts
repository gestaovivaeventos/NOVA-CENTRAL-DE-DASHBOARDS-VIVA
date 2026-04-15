/**
 * API Handler para buscar detalhamento de conformidades por franquia
 * Lê a aba BASE CONFORMIDADES - com lógica de data (mês/ano)
 * Retorna breakdown: pipe (vendas, relacionamento, produção) e financeira (fechamento, endividamento)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSheetData, CACHE_TTL } from '@/lib/sheets-client';

const CACHE_KEY = 'pex:base-conformidades';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const data = await getSheetData("'BASE CONFORMIDADES'!A:P", CACHE_KEY, CACHE_TTL.METAS);

    if (!data || data.length < 2) {
      return res.status(200).json({ data: {} });
    }

    const headers = data[0].map((h: string) => (h || '').toString().trim().toLowerCase());
    const rows = data.slice(1);

    // Encontrar índices das colunas por nome do header
    const findCol = (match: (h: string) => boolean) => headers.findIndex(match);

    const unidadeIdx = findCol(h => h === 'nm_unidade' || h === 'unidade');
    const dataIdx = findCol(h => h === 'data');
    const mesIdx = findCol(h => h === 'mês' || h === 'mes');
    const anoIdx = findCol(h => h === 'ano');
    const pipeVendasIdx = findCol(h => h.includes('pipe_venda'));
    const pipeRelacIdx = findCol(h => h.includes('pipe_relac'));
    const pipeProducaoIdx = findCol(h => h.includes('pipe_produ'));
    const confPipeIdx = findCol(h => h.includes('conformid') && h.includes('pipe') || h.includes('coformid') && h.includes('pipe'));
    const fechamentoIdx = findCol(h => h.includes('fechamento'));
    const endividamentoIdx = findCol(h => h.includes('endividamento') || h.includes('endividam'));
    const confFinanceiraIdx = findCol(h => h.includes('conformid') && h.includes('financ') || h.includes('coformid') && h.includes('financ'));

    if (unidadeIdx === -1) {
      return res.status(200).json({ data: {}, message: 'Coluna nm_unidade não encontrada' });
    }

    // Estrutura: { [franquia]: { [mes-ano]: { ... } } }
    const resultado: Record<string, Record<string, {
      pipeVendas: string;
      pipeRelacionamento: string;
      pipeProducao: string;
      confPipe: string;
      fechamentoPrazo: string;
      endividamentoFranq: string;
      confFinanceira: string;
    }>> = {};

    for (const row of rows) {
      const unidade = (row[unidadeIdx] || '').toString().trim();
      if (!unidade) continue;

      // Extrair mês e ano (pode vir de colunas separadas ou da coluna DATA)
      let mes = 0;
      let ano = 0;

      if (mesIdx !== -1 && anoIdx !== -1) {
        mes = parseInt((row[mesIdx] || '').toString().trim(), 10);
        ano = parseInt((row[anoIdx] || '').toString().trim(), 10);
      } else if (dataIdx !== -1) {
        const dataStr = (row[dataIdx] || '').toString().trim();
        const partes = dataStr.split('/');
        if (partes.length >= 3) {
          mes = parseInt(partes[1], 10);
          ano = parseInt(partes[2], 10);
        }
      }

      if (!mes || !ano) continue;

      const chave = `${mes}-${ano}`;

      const getValue = (idx: number) => idx !== -1 ? (row[idx] || '').toString().trim() : '-';

      if (!resultado[unidade]) resultado[unidade] = {};

      resultado[unidade][chave] = {
        pipeVendas: getValue(pipeVendasIdx),
        pipeRelacionamento: getValue(pipeRelacIdx),
        pipeProducao: getValue(pipeProducaoIdx),
        confPipe: getValue(confPipeIdx),
        fechamentoPrazo: getValue(fechamentoIdx),
        endividamentoFranq: getValue(endividamentoIdx),
        confFinanceira: getValue(confFinanceiraIdx),
      };
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    return res.status(200).json({ data: resultado });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Erro ao buscar dados de conformidades',
      message: error.message,
    });
  }
}
