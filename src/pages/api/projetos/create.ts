/**
 * API Route para criar novo projeto na planilha
 * POST /api/projetos/create
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SPREADSHEET_ID = '182mM7NKo8IxLe1QKP7kSvAP-pNTZQbWPEaLje7oE7s4';
const SHEET_NAME = 'Projetos';

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

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function mapTendenciaToSheet(tendencia: string): string {
  return tendencia === 'Descer' ? 'DIMINUIR' : 'AUMENTAR';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      projeto,
      objetivo,
      dataInicio,
      prazoFinal,
      responsavel,
      time,
      indicador,
      tendencia,
      resultadoEsperado,
      dataAfericao,
      custo,
      criadoPor,
    } = req.body;

    if (!projeto || !time) {
      return res.status(400).json({ error: 'Campos obrigatórios: projeto, time' });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar próximo ID
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:A`,
    });
    const ids = (existing.data.values || [])
      .slice(1) // skip header
      .map(r => parseInt(r[0]) || 0);
    const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;

    const now = formatDate(new Date());

    // Montar linha: A=ID, B=PROJETO, C=OBJETIVO, D=INICIO, E=CONCLUSÃO,
    // F=RESPONSÁVEL, G=TIME, H=INDICADOR, I=TENDÊNCIA, J=RESULTADO ESPERADO,
    // K=RESULTADO, L=% ATINGIMENTO, M=QUANDO TERÁ IMPACTO, N=CUSTO,
    // O=CRIADO POR, P=DATA DE CRIAÇÃO, Q=ALTERADO POR, R=DATA ALTERAÇÃO,
    // S=INATIVADO POR, T=DATA INATIVAÇÃO, U=STATUS
    const newRow = [
      nextId,                          // A - ID
      projeto,                         // B - NOME DO PROJETO
      objetivo || '',                  // C - OBJETIVO
      dataInicio || now,               // D - INÍCIO
      prazoFinal || '',                // E - CONCLUSÃO PREVISTA
      responsavel || '',               // F - RESPONSÁVEL
      time,                            // G - TIME
      indicador || '',                 // H - INDICADOR
      mapTendenciaToSheet(tendencia),  // I - TENDÊNCIA
      resultadoEsperado || 0,          // J - RESULTADO ESPERADO
      '',                              // K - RESULTADO (vazio)
      '',                              // L - % ATINGIMENTO (vazio)
      dataAfericao || '',              // M - QUANDO TERÁ IMPACTO
      custo || 0,                      // N - CUSTO
      criadoPor || '',                 // O - CRIADO POR
      now,                             // P - DATA DE CRIAÇÃO
      '',                              // Q - ALTERADO POR
      '',                              // R - DATA ALTERAÇÃO
      '',                              // S - INATIVADO POR
      '',                              // T - DATA INATIVAÇÃO
      'Em Andamento',                  // U - STATUS
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:U`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [newRow] },
    });

    return res.status(201).json({
      success: true,
      message: 'Projeto criado com sucesso',
      id: nextId,
    });

  } catch (error: any) {
    console.error('[API projetos/create] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar projeto',
      message: error.message,
    });
  }
}
