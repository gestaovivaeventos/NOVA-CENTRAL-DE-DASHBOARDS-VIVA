/**
 * API Route para atualizar KPI existente
 * PUT /api/kpi/update - Atualiza dados do KPI na planilha
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const SHEET_NAME = 'KPIS';

interface UpdateKpiRequest {
  team: string;
  oldName: string;
  newName: string;
  tendencia: string;
  grandeza: string;
  metas: Record<string, string>; // { "competencia": "valor" }
  competencias: string[];
  username?: string; // Nome do usuário que está editando
}

interface UpdateKpiResponse {
  success: boolean;
  message?: string;
  error?: string;
  rowsUpdated?: number;
}

// Mapeamento de índice de colunas (0-based)
const COL_INDEX = {
  DATA: 0,        // A - Data (DD/MM/YYYY)
  TIME: 1,        // B
  ID: 2,          // C
  KPI: 3,         // D - Nome do KPI
  META: 4,        // E
  GRANDEZA: 9,    // J
  TENDENCIA: 15,  // P
  EDITADO_EM: 35,   // AJ - Data de edição
  EDITADO_POR: 36,  // AK - Usuário que editou
};

/**
 * Obtém cliente autenticado do Google Sheets
 */
function getAuthenticatedClient() {
  const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

  if (!GOOGLE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('Variável de ambiente GOOGLE_SERVICE_ACCOUNT_BASE64 não configurada');
  }

  const serviceAccountBuffer = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64');
  const serviceAccount = JSON.parse(serviceAccountBuffer.toString('utf-8'));
  const { client_email, private_key } = serviceAccount;

  if (!client_email || !private_key) {
    throw new Error('Service Account inválido');
  }

  return new google.auth.JWT({
    email: client_email,
    key: private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateKpiResponse>
) {
  // Apenas aceitar método PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use PUT.' 
    });
  }

  try {
    const data: UpdateKpiRequest = req.body;

    // Validações
    if (!data.team) {
      return res.status(400).json({ success: false, error: 'Time não informado' });
    }
    if (!data.oldName) {
      return res.status(400).json({ success: false, error: 'Nome do KPI original não informado' });
    }
    if (!data.newName) {
      return res.status(400).json({ success: false, error: 'Novo nome do KPI não informado' });
    }

    // Autenticação
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar todas as linhas da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AD`,
    });

    const rows = response.data.values || [];
    if (rows.length < 2) {
      return res.status(404).json({ success: false, error: 'Planilha vazia' });
    }

    // Encontrar índices das linhas que pertencem ao KPI (mesmo time e nome)
    const rowsToUpdate: { rowIndex: number; competencia: string }[] = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowTeam = row[COL_INDEX.TIME]?.toString().trim();
      const rowKpi = row[COL_INDEX.KPI]?.toString().trim();
      const rowCompetencia = row[COL_INDEX.DATA]?.toString().trim();
      
      if (rowTeam === data.team && rowKpi === data.oldName) {
        rowsToUpdate.push({ 
          rowIndex: i + 1, // +1 porque sheets usa 1-based
          competencia: rowCompetencia 
        });
      }
    }

    if (rowsToUpdate.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: `KPI "${data.oldName}" não encontrado para o time "${data.team}"` 
      });
    }

    // Buscar o sheetId para formatação
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
    const sheetId = sheet?.properties?.sheetId || 0;

    // Preparar requisições de atualização em batch
    const requests: any[] = [];
    
    // Data/hora atual no formato brasileiro
    const now = new Date();
    const dataHoraEdicao = now.toLocaleString('pt-BR', { 
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    for (const { rowIndex, competencia } of rowsToUpdate) {
      // Buscar meta para esta competência
      let metaValue: string | number = '';
      const metaStr = data.metas[competencia] || '';
      
      if (metaStr) {
        const numericValue = parseFloat(metaStr.replace(',', '.'));
        if (!isNaN(numericValue)) {
          if (data.grandeza === '%') {
            metaValue = numericValue / 100;
          } else {
            metaValue = numericValue;
          }
        }
      }

      // Atualizar nome do KPI (coluna D)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.KPI,
            endColumnIndex: COL_INDEX.KPI + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: { stringValue: data.newName }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });

      // Atualizar meta (coluna E)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.META,
            endColumnIndex: COL_INDEX.META + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: typeof metaValue === 'number' 
                ? { numberValue: metaValue }
                : { stringValue: '' }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });

      // Atualizar grandeza (coluna J)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.GRANDEZA,
            endColumnIndex: COL_INDEX.GRANDEZA + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: { stringValue: data.grandeza }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });

      // Atualizar tendência (coluna P)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.TENDENCIA,
            endColumnIndex: COL_INDEX.TENDENCIA + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: { stringValue: data.tendencia }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });

      // Atualizar EDITADO EM (coluna AJ)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.EDITADO_EM,
            endColumnIndex: COL_INDEX.EDITADO_EM + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: { stringValue: dataHoraEdicao }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });

      // Atualizar EDITADO POR (coluna AK)
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowIndex - 1,
            endRowIndex: rowIndex,
            startColumnIndex: COL_INDEX.EDITADO_POR,
            endColumnIndex: COL_INDEX.EDITADO_POR + 1,
          },
          rows: [{
            values: [{
              userEnteredValue: { stringValue: data.username || '' }
            }]
          }],
          fields: 'userEnteredValue',
        },
      });
    }

    // Executar todas as atualizações em batch
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: requests,
      },
    });

    // Aplicar formatação na coluna META baseado na grandeza
    let numberFormat: { type: string; pattern: string };
    
    switch (data.grandeza) {
      case 'Moeda':
        numberFormat = { type: 'CURRENCY', pattern: '"R$" #,##0.00' };
        break;
      case '%':
        numberFormat = { type: 'PERCENT', pattern: '0.00%' };
        break;
      default:
        numberFormat = { type: 'NUMBER', pattern: '#,##0' };
        break;
    }

    // Aplicar formatação para cada linha
    const formatRequests = rowsToUpdate.map(({ rowIndex }) => ({
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: rowIndex - 1,
          endRowIndex: rowIndex,
          startColumnIndex: COL_INDEX.META,
          endColumnIndex: COL_INDEX.META + 1,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: numberFormat,
          },
        },
        fields: 'userEnteredFormat.numberFormat',
      },
    }));

    if (formatRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: formatRequests,
        },
      });
    }

    console.log(`[KPI Update] KPI "${data.oldName}" -> "${data.newName}" atualizado para ${data.team}. ${rowsToUpdate.length} linhas atualizadas.`);

    return res.status(200).json({
      success: true,
      message: `KPI "${data.newName}" atualizado com sucesso!`,
      rowsUpdated: rowsToUpdate.length,
    });

  } catch (error) {
    console.error('[KPI Update] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      success: false,
      error: `Erro ao atualizar KPI: ${errorMessage}`,
    });
  }
}
