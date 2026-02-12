/**
 * API Route para inativar KPI
 * POST /api/kpi/inactivate - Marca meses sem resultado como "Inativo"
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Configurações
const SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';
const SHEET_NAME = 'KPIS';

interface InactivateKpiRequest {
  team: string;
  kpiName: string;
}

interface InactivateKpiResponse {
  success: boolean;
  message?: string;
  error?: string;
  rowsUpdated?: number;
}

// Mapeamento de índice de colunas (0-based)
const COL_INDEX = {
  TIME: 1,          // B
  KPI: 3,           // D - Nome do KPI
  RESULTADO: 5,     // F
  SITUACAO_KPI: 32, // AG - Situação do KPI (Ativo/Inativo)
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
  res: NextApiResponse<InactivateKpiResponse>
) {
  // Apenas aceitar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use POST.' 
    });
  }

  try {
    const { team, kpiName }: InactivateKpiRequest = req.body;

    // Validações
    if (!team) {
      return res.status(400).json({ success: false, error: 'Time não informado' });
    }
    if (!kpiName) {
      return res.status(400).json({ success: false, error: 'Nome do KPI não informado' });
    }

    // Autenticação
    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar todas as linhas da planilha (colunas B, D, F e AG)
    // B = TIME, D = KPI, F = RESULTADO, AG = SITUAÇÃO KPI
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AG`,
    });

    const rows = response.data.values || [];
    
    // Encontrar linhas que correspondem ao time e KPI, onde RESULTADO está vazio
    const rowsToUpdate: number[] = [];
    
    for (let i = 1; i < rows.length; i++) { // Pular cabeçalho (linha 0)
      const row = rows[i];
      const rowTeam = row?.[COL_INDEX.TIME]?.toString().trim() || '';
      const rowKpiName = row?.[COL_INDEX.KPI]?.toString().trim() || '';
      const rowResultado = row?.[COL_INDEX.RESULTADO]?.toString().trim() || '';
      
      // Se é o KPI correto e não tem resultado, marcar para inativar
      if (rowTeam === team && rowKpiName === kpiName && !rowResultado) {
        // Linha na planilha é i + 1 (índice 0-based + 1 para linha real)
        rowsToUpdate.push(i + 1);
      }
    }

    if (rowsToUpdate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhuma linha para inativar. Todas as linhas já possuem resultado.',
        rowsUpdated: 0
      });
    }

    // Atualizar cada linha encontrada
    const updateRequests = rowsToUpdate.map(rowNumber => ({
      range: `${SHEET_NAME}!AG${rowNumber}`,
      values: [['Inativo']]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updateRequests
      }
    });

    return res.status(200).json({
      success: true,
      message: `KPI inativado com sucesso.`,
      rowsUpdated: rowsToUpdate.length
    });

  } catch (error: any) {
    console.error('[API] Erro ao inativar KPI:', error);
    
    // Verificar se é erro de autenticação
    if (error.message?.includes('GOOGLE_SERVICE_ACCOUNT')) {
      return res.status(500).json({
        success: false,
        error: 'Erro de configuração do servidor'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
}
