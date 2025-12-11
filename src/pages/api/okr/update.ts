import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface UpdateRequest {
  updates: Array<{
    rowIndex: number;
    meta: string;
    realizado: string;
    formaDeMedir: string;
    responsavel: string;
    medida: string;
  }>;
  sheetName: string;
}

// Colunas de atualização para a planilha OKR
const OKR_COLUMNS = {
  meta: 'H',        // Coluna H (META)
  realizado: 'I',   // Coluna I (REALIZADO)
  medida: 'M',      // Coluna M (MEDIDA)
  formaDeMedir: 'N', // Coluna N (FORMA DE MEDIR)
  responsavel: 'P'  // Coluna P (RESPONSÁVEL)
};

// Mapa de índices para letras de coluna
const indexToLetter = (index: number): string => {
  let letter = '';
  let num = index + 1;
  while (num > 0) {
    num--;
    letter = String.fromCharCode(65 + (num % 26)) + letter;
    num = Math.floor(num / 26);
  }
  return letter;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { updates, sheetName }: UpdateRequest = req.body;

    // Validar dados
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: 'Nenhuma atualização fornecida'
      });
    }

    if (!sheetName) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'Nome da aba é obrigatório'
      });
    }

    // Decodificar credentials do service account
    const serviceAccountBase64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      return res.status(500).json({
        success: false,
        error: 'Configuração ausente',
        message: 'Service account não configurada'
      });
    }

    const serviceAccountJson = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
    );

    // Inicializar Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountJson,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';

    // Preparar batch updates
    const batchUpdates: Array<{ range: string; values: string[][] }> = [];

    updates.forEach((update) => {
      // rowIndex já vem como número da linha na planilha (1-based)
      const sheetRowNumber = update.rowIndex;

      // META (coluna G)
      if (update.meta) {
        batchUpdates.push({
          range: `'${sheetName}'!${OKR_COLUMNS.meta}${sheetRowNumber}`,
          values: [[update.meta]]
        });
      }

      // REALIZADO (coluna H)
      if (update.realizado) {
        batchUpdates.push({
          range: `'${sheetName}'!${OKR_COLUMNS.realizado}${sheetRowNumber}`,
          values: [[update.realizado]]
        });
      }

      // MEDIDA (coluna L)
      if (update.medida) {
        batchUpdates.push({
          range: `'${sheetName}'!${OKR_COLUMNS.medida}${sheetRowNumber}`,
          values: [[update.medida]]
        });
      }

      // FORMA DE MEDIR (coluna M)
      if (update.formaDeMedir) {
        batchUpdates.push({
          range: `'${sheetName}'!${OKR_COLUMNS.formaDeMedir}${sheetRowNumber}`,
          values: [[update.formaDeMedir]]
        });
      }

      // RESPONSÁVEL (coluna O)
      if (update.responsavel) {
        batchUpdates.push({
          range: `'${sheetName}'!${OKR_COLUMNS.responsavel}${sheetRowNumber}`,
          values: [[update.responsavel]]
        });
      }
    });

    // Se não há nada para atualizar
    if (batchUpdates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma alteração',
        message: 'Nenhum campo foi preenchido para atualização'
      });
    }

    // Executar atualizações em batch
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchUpdates
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Dados do OKR atualizados com sucesso!',
      data: {
        updatedRows: updates.length,
        updatesCount: batchUpdates.length
      }
    });

  } catch (error: any) {
    console.error('Erro ao atualizar OKR:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar dados',
      message: error.message || 'Ocorreu um erro ao atualizar os dados do OKR'
    });
  }
}
