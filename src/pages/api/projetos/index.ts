/**
 * API Route para listar projetos da planilha
 * GET /api/projetos
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SPREADSHEET_ID = '182mM7NKo8IxLe1QKP7kSvAP-pNTZQbWPEaLje7oE7s4';
const SHEET_NAME = 'Projetos';

// Mapeamento de colunas (0-based)
const COL = {
  ID: 0,              // A
  PROJETO: 1,         // B - NOME DO PROJETO
  OBJETIVO: 2,        // C - OBJETIVO DO PROJETO
  DATA_INICIO: 3,     // D - INÍCIO DO PROJETO
  PRAZO_FINAL: 4,     // E - DATA DE CONCLUSÃO PREVISTA
  RESPONSAVEL: 5,     // F - RESPONSÁVEL
  TIME: 6,            // G - TIME
  INDICADOR: 7,       // H - INDICADOR
  TENDENCIA: 8,       // I - TENDÊNCIA
  RESULTADO_ESPERADO: 9,  // J - RESULTADO ESPERADO
  RESULTADO_ATINGIDO: 10, // K - RESULTADO
  PERC_ATINGIMENTO: 11,   // L - % ATINGIMENTO
  DATA_IMPACTO: 12,   // M - QUANDO TERÁ IMPACTO
  CUSTO: 13,          // N - CUSTO
  CRIADO_POR: 14,     // O - CRIADO POR
  DATA_CRIACAO: 15,   // P - DATA DE CRIAÇÃO
  ALTERADO_POR: 16,   // Q - ALTERADO POR
  DATA_ALTERACAO: 17, // R - DATA ALTERAÇÃO
  INATIVADO_POR: 18,  // S - INATIVADO POR
  DATA_INATIVACAO: 19,// T - DATA INATIVAÇÃO
  STATUS: 20,         // U - STATUS
};

function getAuthenticatedClient() {
  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurada');
  const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  return new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  // Remove R$, %, pontos de milhar e troca vírgula por ponto
  const cleaned = val.replace(/[R$%\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function mapTendencia(val: string | undefined): 'Subir' | 'Descer' {
  if (!val) return 'Subir';
  const upper = val.toUpperCase().trim();
  if (upper === 'DIMINUIR' || upper === 'DESCER' || upper === 'BAIXAR') return 'Descer';
  return 'Subir';
}

function mapStatus(val: string | undefined): string {
  if (!val) return 'Em Andamento';
  const s = val.trim();
  // Normalizar status da planilha para os tipos do sistema
  if (s === 'Concluído' || s === 'Finalizado') return 'Concluído';
  if (s === 'Cancelado') return 'Cancelado';
  if (s === 'Inativo') return 'Inativo';
  if (s === 'Em Andamento' || s === 'Em andamento') return 'Em Andamento';
  return s;
}

function getSituacao(percentual: number): 'verde' | 'amarelo' | 'vermelho' {
  if (percentual >= 80) return 'verde';
  if (percentual >= 50) return 'amarelo';
  return 'vermelho';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar projetos (A2:U) e lista de responsáveis (X2:X) em paralelo
    const [projetosRes, responsaveisRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!A2:U`,
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${SHEET_NAME}'!X2:X`,
      }),
    ]);

    const rows = projetosRes.data.values || [];
    const responsaveisRows = responsaveisRes.data.values || [];
    
    // Extrair lista de responsáveis (coluna X)
    const responsaveisList = responsaveisRows
      .map(r => (r[0] || '').toString().trim())
      .filter(Boolean);
    
    const projetos = rows
      .filter(row => row[COL.ID] && row[COL.PROJETO]) // Ignorar linhas vazias
      .map((row) => {
        const percentual = parseNumber(row[COL.PERC_ATINGIMENTO]);
        const tendencia = mapTendencia(row[COL.TENDENCIA]);
        
        return {
          id: String(row[COL.ID] || ''),
          projeto: row[COL.PROJETO] || '',
          objetivo: row[COL.OBJETIVO] || '',
          dataInicio: row[COL.DATA_INICIO] || '',
          prazoFinal: row[COL.PRAZO_FINAL] || '',
          responsavel: row[COL.RESPONSAVEL] || '',
          time: row[COL.TIME] || '',
          indicador: row[COL.INDICADOR] || '',
          tendencia,
          resultadoEsperado: parseNumber(row[COL.RESULTADO_ESPERADO]),
          resultadoAtingido: parseNumber(row[COL.RESULTADO_ATINGIDO]),
          percentualAtingimento: percentual,
          dataAfericao: row[COL.DATA_IMPACTO] || '',
          custo: parseNumber(row[COL.CUSTO]),
          criadoPor: row[COL.CRIADO_POR] || '',
          dataCriacao: row[COL.DATA_CRIACAO] || '',
          alteradoPor: row[COL.ALTERADO_POR] || '',
          dataAlteracao: row[COL.DATA_ALTERACAO] || '',
          inativadoPor: row[COL.INATIVADO_POR] || '',
          dataInativacao: row[COL.DATA_INATIVACAO] || '',
          status: mapStatus(row[COL.STATUS]),
          // Campos calculados
          progresso: Math.min(percentual, 100),
          situacao: getSituacao(percentual),
          esforcoEstimado: '',
          impactoEsperado: '',
        };
      });

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return res.status(200).json({
      success: true,
      data: projetos,
      responsaveis: responsaveisList,
      total: projetos.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[API projetos] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar projetos',
      message: error.message,
    });
  }
}
