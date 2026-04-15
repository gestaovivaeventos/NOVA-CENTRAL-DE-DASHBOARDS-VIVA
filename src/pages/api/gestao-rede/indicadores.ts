/**
 * API para buscar resultados dos indicadores PEX das franquias ativas no programa
 * Combina: resultados do HISTORICO RESULTADOS (PEX) + metas da planilha de Gestão Rede
 * + VVR agregado da planilha de Vendas (ADESOES)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/sheets-client';

const PEX_SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '';
const METAS_SPREADSHEET_ID = process.env.GESTAO_REDE_METAS_SPREADSHEET_ID || '';
const METAS_SHEET_NAME = process.env.GESTAO_REDE_METAS_SHEET_NAME || 'BASE';
const VENDAS_SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_SALES || '';
const VENDAS_SHEET_NAME = process.env.NEXT_PUBLIC_SHEET_ADESOES || 'ADESOES';
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

/**
 * Busca dados da planilha de vendas (ADESOES) via API key pública
 * Retorna VVR agregado por franquia e mês: { "franquia_lower|MM/YYYY": valor }
 */
async function fetchVendasVVR(): Promise<Record<string, number>> {
  const vendasVVR: Record<string, number> = {};

  if (!VENDAS_SPREADSHEET_ID || !GOOGLE_API_KEY) return vendasVVR;

  try {
    const encodedSheet = encodeURIComponent(VENDAS_SHEET_NAME);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(VENDAS_SPREADSHEET_ID)}/values/${encodedSheet}?key=${encodeURIComponent(GOOGLE_API_KEY)}`;
    const response = await fetch(url);
    if (!response.ok) return vendasVVR;

    const data = await response.json();
    const rows: string[][] = data.values || [];
    if (rows.length < 2) return vendasVVR;

    const headers = rows[0].map((h: string) => h.toLowerCase().trim());
    const idxUnidade = headers.indexOf('nm_unidade');
    const idxValor = headers.indexOf('vl_plano');
    const idxData = headers.indexOf('dt_cadastro_integrante');

    if (idxUnidade < 0 || idxValor < 0 || idxData < 0) return vendasVVR;

    rows.slice(1).forEach((row) => {
      const unidade = (row[idxUnidade] || '').trim();
      const valorStr = (row[idxValor] || '0').replace(',', '.');
      const valor = parseFloat(valorStr) || 0;
      const dataStr = (row[idxData] || '').trim();

      let mes = '';
      let ano = '';

      // Formato ISO: YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS
      const isoMatch = dataStr.match(/^(\d{4})-(\d{2})/);
      if (isoMatch) {
        ano = isoMatch[1];
        mes = isoMatch[2];
      } else {
        // Formato DD/MM/YYYY
        const brMatch = dataStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (brMatch) {
          mes = brMatch[2].padStart(2, '0');
          ano = brMatch[3];
        }
      }

      if (mes && ano && unidade) {
        const key = `${unidade.toLowerCase().trim()}|${mes}/${ano}`;
        vendasVVR[key] = (vendasVVR[key] || 0) + valor;
      }
    });
  } catch (err) {
    console.error('[indicadores] Erro ao buscar vendas VVR:', err);
  }

  return vendasVVR;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar resultados do PEX + metas + vendas em paralelo
    const [resultadosResponse, metasResponse, vendasVVR] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: PEX_SPREADSHEET_ID,
        range: "'HISTORICO RESULTADOS'!A:BA",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: METAS_SPREADSHEET_ID,
        range: `'${METAS_SHEET_NAME}'!A:O`,
      }),
      fetchVendasVVR(),
    ]);

    // Processar resultados PEX
    const resultadosRows = resultadosResponse.data.values || [];
    let resultados: any[] = [];
    if (resultadosRows.length > 1) {
      const headers = resultadosRows[0];
      resultados = resultadosRows.slice(1).map((row: string[]) => {
        const obj: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }

    // Processar metas
    const metasRows = metasResponse.data.values || [];
    let metas: any[] = [];
    if (metasRows.length > 1) {
      const metasHeaders = metasRows[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, '_'));

      // Garantir que coluna O (index 14) mapeie para 'validado' mesmo sem header na planilha
      while (metasHeaders.length <= 14) metasHeaders.push('');
      if (!metasHeaders[14] || metasHeaders[14] === '') metasHeaders[14] = 'validado';

      metas = metasRows.slice(1).map((row: string[]) => {
        const obj: Record<string, string> = {};
        metasHeaders.forEach((header: string, index: number) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
    }

    return res.status(200).json({
      success: true,
      resultados,
      metas,
      vendasVVR,
    });

  } catch (error: any) {
    console.error('[API gestao-rede/indicadores] Erro:', error);
    return res.status(500).json({
      error: 'Erro ao buscar indicadores',
      message: error.message || 'Erro interno',
    });
  }
}
