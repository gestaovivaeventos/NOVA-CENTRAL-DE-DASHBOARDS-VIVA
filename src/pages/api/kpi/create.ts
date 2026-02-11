/**
 * API Route para criar novo KPI
 * POST /api/kpi/create - Insere novo KPI na planilha
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const SHEET_NAME = 'KPIS';

interface CreateKpiRequest {
  team: string;
  nome: string;
  inicioMes: string;
  inicioAno: string;
  terminoMes: string;
  terminoAno: string;
  tendencia: string;
  grandeza: string;
  metas: Record<string, string>; // { "MM/YYYY": "valor" }
}

interface CreateKpiResponse {
  success: boolean;
  message?: string;
  error?: string;
  kpiId?: number;
  rowsInserted?: number;
}

// Mapeamento de índice de colunas (0-based)
const COL_INDEX = {
  DATA: 0,        // A - Data (DD/MM/YYYY)
  TIME: 1,        // B
  ID: 2,          // C - # (ID do KPI no time)
  KPI: 3,         // D - Nome do KPI
  META: 4,        // E
  RESULTADO: 5,   // F
  GRANDEZA: 9,    // J
  TENDENCIA: 15,  // P
  COMPETENCIA: 18, // S - Competência (MM/YYYY)
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

/**
 * Busca o próximo ID de KPI para o time
 */
async function getNextKpiId(sheets: any, team: string): Promise<number> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!B:C`, // Colunas TIME e ID
  });

  const rows = response.data.values || [];
  
  // Encontrar todos os IDs únicos do time
  const teamIds = new Set<number>();
  
  for (let i = 1; i < rows.length; i++) { // Pular cabeçalho
    const rowTeam = rows[i]?.[0]?.toString().trim();
    const rowId = rows[i]?.[1];
    
    if (rowTeam === team && rowId) {
      const id = parseInt(rowId.toString());
      if (!isNaN(id)) {
        teamIds.add(id);
      }
    }
  }

  // Próximo ID é o maior + 1, ou 1 se não houver KPIs
  const maxId = teamIds.size > 0 ? Math.max(...teamIds) : 0;
  return maxId + 1;
}

/**
 * Gera lista de meses entre início e término no formato 01/MM/YYYY
 */
function generateMonthsList(
  inicioMes: string,
  inicioAno: string,
  terminoMes: string,
  terminoAno: string
): string[] {
  const meses: string[] = [];
  
  const startYear = parseInt(inicioAno);
  const endYear = parseInt(terminoAno);
  const startMonth = parseInt(inicioMes);
  const endMonth = parseInt(terminoMes);

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 1;
    const monthEnd = year === endYear ? endMonth : 12;
    
    for (let month = monthStart; month <= monthEnd; month++) {
      const mesStr = month.toString().padStart(2, '0');
      // Formato 01/MM/YYYY
      meses.push(`01/${mesStr}/${year}`);
    }
  }

  return meses;
}

/**
 * Cria uma linha para a planilha com os dados do KPI
 */
function createRow(
  competencia: string,
  team: string,
  kpiId: number,
  kpiName: string,
  meta: string,
  grandeza: string,
  tendencia: string
): (string | number)[] {
  // Criar array com 31 colunas (até AE)
  const row: (string | number)[] = new Array(31).fill('');
  
  // Processar valor da meta
  let metaValue: string | number = '';
  if (meta) {
    // Converter para número (trocar vírgula por ponto)
    const numericValue = parseFloat(meta.replace(',', '.'));
    
    if (!isNaN(numericValue)) {
      if (grandeza === '%') {
        // Para percentual, dividir por 100 (60 -> 0.60)
        metaValue = numericValue / 100;
      } else {
        metaValue = numericValue;
      }
    }
  }
  
  // Extrair MM/YYYY do formato 01/MM/YYYY para coluna COMPETÊNCIA
  const parts = competencia.split('/');
  const competenciaMesAno = parts.length === 3 ? `${parts[1]}/${parts[2]}` : competencia;
  
  row[COL_INDEX.DATA] = competencia;           // A - DATA (01/MM/YYYY)
  row[COL_INDEX.TIME] = team;                  // B - TIME
  row[COL_INDEX.ID] = kpiId;                   // C - # (ID)
  row[COL_INDEX.KPI] = kpiName;                // D - KPI
  row[COL_INDEX.META] = metaValue;             // E - META
  row[COL_INDEX.GRANDEZA] = grandeza;          // J - GRANDEZA
  row[COL_INDEX.TENDENCIA] = tendencia;        // P - TENDÊNCIA
  row[COL_INDEX.COMPETENCIA] = competenciaMesAno; // S - COMPETÊNCIA (MM/YYYY)
  
  return row;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateKpiResponse>
) {
  // Apenas aceitar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use POST.' 
    });
  }

  try {
    const data: CreateKpiRequest = req.body;

    // Validações
    if (!data.team) {
      return res.status(400).json({ success: false, error: 'Time não informado' });
    }
    if (!data.nome) {
      return res.status(400).json({ success: false, error: 'Nome do KPI não informado' });
    }
    if (!data.inicioMes || !data.inicioAno) {
      return res.status(400).json({ success: false, error: 'Data de início não informada' });
    }
    if (!data.tendencia) {
      return res.status(400).json({ success: false, error: 'Tendência não informada' });
    }
    if (!data.grandeza) {
      return res.status(400).json({ success: false, error: 'Grandeza não informada' });
    }

    // Autenticação
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar próximo ID do KPI para o time
    const kpiId = await getNextKpiId(sheets, data.team);

    // Buscar a última linha da planilha para saber onde inserir
    const sheetDataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });
    const lastRow = (sheetDataResponse.data.values?.length || 1);

    // Gerar lista de meses
    const meses = generateMonthsList(
      data.inicioMes,
      data.inicioAno,
      data.terminoMes || '12',
      data.terminoAno || data.inicioAno
    );

    // Criar linhas para inserção
    const rows = meses.map((competencia) => {
      // Extrair MM/YYYY do formato 01/MM/YYYY para buscar a meta
      const parts = competencia.split('/');
      const metaKey = `${parts[1]}/${parts[2]}`; // MM/YYYY
      const meta = data.metas[metaKey] || '';
      
      return createRow(
        competencia,
        data.team,
        kpiId,
        data.nome,
        meta,
        data.grandeza,
        data.tendencia
      );
    });

    // Inserir dados na planilha (append na última linha)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AD`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows,
      },
    });

    // Aplicar formatação nas células da coluna META (E) baseado na grandeza
    const startRow = lastRow + 1; // Linha onde começaram os novos dados
    const endRow = startRow + rows.length;
    
    // Buscar o sheetId da aba KPIS
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === SHEET_NAME);
    const sheetId = sheet?.properties?.sheetId || 0;

    // Definir o formato baseado na grandeza
    let numberFormat: { type: string; pattern: string };
    
    switch (data.grandeza) {
      case 'Moeda':
        numberFormat = {
          type: 'CURRENCY',
          pattern: '"R$" #,##0.00',
        };
        break;
      case '%':
        numberFormat = {
          type: 'PERCENT',
          pattern: '0.00%',
        };
        break;
      case 'Número inteiro':
      default:
        numberFormat = {
          type: 'NUMBER',
          pattern: '#,##0',
        };
        break;
    }

    // Aplicar formatação via batchUpdate
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: startRow - 1, // 0-based
                endRowIndex: endRow - 1,
                startColumnIndex: COL_INDEX.META, // Coluna E (índice 4)
                endColumnIndex: COL_INDEX.META + 1,
              },
              cell: {
                userEnteredFormat: {
                  numberFormat: numberFormat,
                },
              },
              fields: 'userEnteredFormat.numberFormat',
            },
          },
        ],
      },
    });

    console.log(`[KPI Create] KPI "${data.nome}" criado para ${data.team} com ID ${kpiId}. ${rows.length} linhas inseridas. Formatação: ${data.grandeza}`);

    return res.status(201).json({
      success: true,
      message: `KPI "${data.nome}" criado com sucesso!`,
      kpiId,
      rowsInserted: rows.length,
    });

  } catch (error) {
    console.error('[KPI Create] Erro:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return res.status(500).json({
      success: false,
      error: `Erro ao criar KPI: ${errorMessage}`,
    });
  }
}
