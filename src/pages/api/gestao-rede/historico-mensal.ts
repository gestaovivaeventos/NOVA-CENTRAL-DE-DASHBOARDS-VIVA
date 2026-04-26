/**
 * API - Histórico mensal de PEX por franquia (aba BASE GESTAO REDE)
 * Retorna, para cada linha mensal: { nm_unidade, data, mes, ano, pontuacao_pex, saude }
 * Usado na tabela "Detalhamento PEX Mensal por Franquia" do módulo Gestão Rede.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData, CACHE_TTL } from '@/lib/sheets-client';
import { SaudeFranquia } from '@/modules/gestao-rede/types';

const SPREADSHEET_ID = process.env.GESTAO_REDE_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.GESTAO_REDE_SHEET_NAME || 'BASE GESTAO REDE';
const CACHE_KEY = 'gestao-rede:historico-mensal';

function mapSaude(valor: string): SaudeFranquia {
  const s = (valor || '').toUpperCase().trim();
  if (s.includes('RECUPERA')) return 'UTI_RECUPERACAO';
  if (s.includes('REPASSE')) return 'UTI_REPASSE';
  if (s.includes('TOP')) return 'TOP_PERFORMANCE';
  if (s.includes('PERFORMANDO')) return 'PERFORMANDO';
  if (s.includes('CONSOLIDA')) return 'EM_CONSOLIDACAO';
  if (s.includes('ATEN')) return 'ATENCAO';
  if (s === 'UTI') return 'UTI_RECUPERACAO';
  return 'SEM_AVALIACAO';
}

/** Extrai mes/ano de strings como "2026-01", "2026-01-15", "01/2026", "15/01/2026" */
function parseMesAno(raw: string): { mes: number; ano: number } | null {
  if (!raw) return null;
  const s = raw.trim();
  // YYYY-MM ou YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) {
    const ano = parseInt(m[1], 10);
    const mes = parseInt(m[2], 10);
    if (mes >= 1 && mes <= 12) return { mes, ano };
  }
  // DD/MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const mes = parseInt(m[2], 10);
    const ano = parseInt(m[3], 10);
    if (mes >= 1 && mes <= 12) return { mes, ano };
  }
  // MM/YYYY
  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mes = parseInt(m[1], 10);
    const ano = parseInt(m[2], 10);
    if (mes >= 1 && mes <= 12) return { mes, ano };
  }
  return null;
}

export interface HistoricoMensalItem {
  nm_unidade: string;
  data: string;
  mes: number;
  ano: number;
  pontuacao_pex: number;
  saude: SaudeFranquia;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    const rows = await getExternalSheetData(
      SPREADSHEET_ID,
      `'${SHEET_NAME}'!A:T`,
      CACHE_KEY,
      CACHE_TTL.PONTUACAO_OFICIAL
    );

    if (!rows || rows.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const headers = rows[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const idx = (name: string) => headers.indexOf(name);

    const iUnidade = idx('nm_unidade');
    const iData = idx('data');
    const iPontuacao = idx('pontuacao_pex');
    const iSaude = idx('saude');

    const historico: HistoricoMensalItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const nome = (row[iUnidade] || '').trim();
      const dataStr = (row[iData] || '').trim();
      if (!nome || !dataStr) continue;

      const parsed = parseMesAno(dataStr);
      if (!parsed) continue;

      const pontStr = (row[iPontuacao] || '').toString().replace('%', '').replace(',', '.').trim();
      const pontuacao = parseFloat(pontStr);
      const saude = mapSaude(row[iSaude] || '');

      historico.push({
        nm_unidade: nome,
        data: dataStr,
        mes: parsed.mes,
        ano: parsed.ano,
        pontuacao_pex: isNaN(pontuacao) ? 0 : pontuacao,
        saude,
      });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).json({ success: true, data: historico });
  } catch (error) {
    console.error('[API gestao-rede/historico-mensal] Erro:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno',
    });
  }
}
