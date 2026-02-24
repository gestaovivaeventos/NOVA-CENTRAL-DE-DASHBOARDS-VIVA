/**
 * API Route para atualizar projeto na planilha
 * POST /api/projetos/update
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

function formatPercentual(valor: number): string {
  return valor.toFixed(2).replace('.', ',') + '%';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, alteradoPor, ...dados } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Campo obrigatório: id' });
    }

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar todas as linhas para encontrar o ID
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:U`,
    });

    const rows = existing.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === String(id)) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      return res.status(404).json({ error: `Projeto ID ${id} não encontrado` });
    }

    const currentRow = rows[rowIndex];
    const now = formatDate(new Date());

    // Montar a linha atualizada preservando valores não enviados
    // A=ID(0), B=PROJETO(1), C=OBJETIVO(2), D=INICIO(3), E=CONCLUSÃO(4),
    // F=RESPONSÁVEL(5), G=TIME(6), H=INDICADOR(7), I=TENDÊNCIA(8), J=RESULTADO ESP(9),
    // K=RESULTADO(10), L=% ATING(11), M=IMPACTO(12), N=CUSTO(13),
    // O=CRIADO POR(14), P=DATA CRIAÇÃO(15), Q=ALTERADO POR(16), R=DATA ALTER(17),
    // S=INATIVADO POR(18), T=DATA INATIV(19), U=STATUS(20)

    const updatedRow = [
      currentRow[0],                                              // A - ID (não muda)
      dados.projeto ?? currentRow[1] ?? '',                       // B - NOME DO PROJETO
      dados.objetivo ?? currentRow[2] ?? '',                      // C - OBJETIVO
      dados.dataInicio ?? currentRow[3] ?? '',                    // D - INÍCIO
      dados.prazoFinal ?? currentRow[4] ?? '',                    // E - CONCLUSÃO
      dados.responsavel ?? currentRow[5] ?? '',                   // F - RESPONSÁVEL
      dados.time ?? currentRow[6] ?? '',                          // G - TIME
      dados.indicador ?? currentRow[7] ?? '',                     // H - INDICADOR
      dados.tendencia ? mapTendenciaToSheet(dados.tendencia) : (currentRow[8] ?? ''),  // I - TENDÊNCIA
      dados.resultadoEsperado != null ? dados.resultadoEsperado : (currentRow[9] ?? ''),   // J - RESULTADO ESPERADO
      dados.resultadoAtingido != null ? dados.resultadoAtingido : (currentRow[10] ?? ''),   // K - RESULTADO
      dados.percentualAtingimento != null ? formatPercentual(dados.percentualAtingimento) : (currentRow[11] ?? ''), // L - %
      dados.dataAfericao ?? currentRow[12] ?? '',                 // M - QUANDO TERÁ IMPACTO
      dados.custo != null ? dados.custo : (currentRow[13] ?? ''),                           // N - CUSTO
      currentRow[14] ?? '',                                       // O - CRIADO POR (não muda)
      currentRow[15] ?? '',                                       // P - DATA CRIAÇÃO (não muda)
      alteradoPor || currentRow[16] || '',                        // Q - ALTERADO POR
      now,                                                        // R - DATA ALTERAÇÃO
      currentRow[18] ?? '',                                       // S - INATIVADO POR
      currentRow[19] ?? '',                                       // T - DATA INATIVAÇÃO
      dados.status ?? currentRow[20] ?? '',                       // U - STATUS
    ];

    // Atualizar a linha na planilha (rowIndex + 1 porque a API é 1-based)
    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A${sheetRow}:U${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [updatedRow] },
    });

    return res.status(200).json({
      success: true,
      message: 'Projeto atualizado com sucesso',
    });

  } catch (error: any) {
    console.error('[API projetos/update] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar projeto',
      message: error.message,
    });
  }
}
