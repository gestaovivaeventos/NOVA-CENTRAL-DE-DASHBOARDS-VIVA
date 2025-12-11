/**
 * API Handler para salvar FCA (Fato, Causa, Ação) na planilha KPIS
 * 
 * Colunas fixas na planilha:
 * V = CRIADO EM
 * W = FATO
 * X = CAUSA
 * Y = EFEITO
 * Z = AÇÃO (LINK DO CARD)
 * AA = RESPONSÁVEL (FCA)
 * AB = TÉRMINO PREVISTO
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// ID da planilha do Painel Gerencial
const GERENCIAL_SPREADSHEET_ID = '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs';

// Colunas fixas para FCA (conforme estrutura da planilha)
const FCA_COLUMNS = {
  criadoEm: 'V',        // CRIADO EM
  fato: 'W',            // FATO
  causa: 'X',           // CAUSA
  efeito: 'Y',          // EFEITO
  acao: 'Z',            // AÇÃO (LINK DO CARD)
  responsavel: 'AA',    // RESPONSÁVEL (FCA)
  terminoPrevisto: 'AB', // TÉRMINO PREVISTO
  realizado: 'AC'       // REALIZADO
};

interface FcaRequestBody {
  time: string;
  kpi: string;
  competencia: string;
  fato?: string;
  causa?: string;
  efeito?: string;
  acao?: string;
  responsavel?: string;
  terminoPrevisto?: string;
  action?: 'save' | 'complete'; // 'save' para salvar FCA, 'complete' para concluir
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido',
      message: 'Use POST para salvar FCA',
    });
  }

  try {
    const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

    if (!GOOGLE_SERVICE_ACCOUNT_BASE64) {
      return res.status(500).json({
        success: false,
        error: 'Configuração incompleta',
        message: 'Credenciais do Google não configuradas',
      });
    }

    // Decodificar credenciais
    const credentialsJson = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
    const credentials = JSON.parse(credentialsJson);

    // Autenticar com Google Sheets API
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Extrair dados do body
    const { 
      time, 
      kpi, 
      competencia, 
      fato, 
      causa,
      efeito,
      acao, 
      responsavel, 
      terminoPrevisto 
    }: FcaRequestBody = req.body;

    // Validar campos obrigatórios
    if (!time || !kpi || !competencia) {
      return res.status(400).json({
        success: false,
        error: 'Dados incompletos',
        message: 'time, kpi e competencia são obrigatórios',
      });
    }

    // Buscar dados da planilha KPIS para encontrar a linha correta
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GERENCIAL_SPREADSHEET_ID,
      range: 'KPIS!A:S', // Buscar colunas A até S para encontrar DATA, TIME, KPI e COMPETÊNCIA
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Planilha vazia',
        message: 'A planilha KPIS está vazia',
      });
    }

    // Encontrar índices das colunas de identificação
    const headers = rows[0].map((h: string) => h?.toString().trim() || '');
    
    // Buscar índices das colunas
    const colIndices = {
      data: headers.findIndex((h: string) => h.toUpperCase() === 'DATA'),
      time: headers.findIndex((h: string) => h.toUpperCase() === 'TIME'),
      kpi: headers.findIndex((h: string) => h.toUpperCase() === 'KPI'),
      competencia: headers.findIndex((h: string) => h.toUpperCase() === 'COMPETÊNCIA' || h.toUpperCase() === 'COMPETENCIA'),
    };

    console.log('Headers encontrados:', headers.slice(0, 20));
    console.log('Índices das colunas:', colIndices);
    console.log('Buscando: TIME=', time, 'KPI=', kpi, 'COMPETÊNCIA=', competencia);

    // Verificar se as colunas de identificação existem
    if (colIndices.time === -1 || colIndices.kpi === -1 || colIndices.competencia === -1) {
      return res.status(500).json({
        success: false,
        error: 'Estrutura da planilha inválida',
        message: 'Colunas TIME, KPI ou COMPETÊNCIA não encontradas',
        headers: headers.slice(0, 25),
        indices: colIndices,
      });
    }

    // Encontrar a linha correta (match por TIME, KPI e COMPETÊNCIA)
    let rowIndex = -1;
    console.log('Procurando linha com TIME=', time, 'KPI=', kpi, 'COMPETÊNCIA=', competencia);
    
    for (let i = 1; i < rows.length; i++) {
      const rowTime = (rows[i][colIndices.time] || '').toString().trim();
      const rowKpi = (rows[i][colIndices.kpi] || '').toString().trim();
      const rowCompetencia = (rows[i][colIndices.competencia] || '').toString().trim();
      
      // Log das primeiras linhas para debug
      if (i <= 5) {
        console.log(`Linha ${i}: TIME="${rowTime}" KPI="${rowKpi}" COMP="${rowCompetencia}"`);
      }
      
      if (rowTime === time && rowKpi === kpi && rowCompetencia === competencia) {
        console.log(`Match encontrado na linha ${i + 1}!`);
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      // Tentar buscar sem a competência para debug
      let foundWithoutComp = false;
      for (let i = 1; i < rows.length; i++) {
        const rowTime = (rows[i][colIndices.time] || '').toString().trim();
        const rowKpi = (rows[i][colIndices.kpi] || '').toString().trim();
        if (rowTime === time && rowKpi === kpi) {
          const rowCompetencia = (rows[i][colIndices.competencia] || '').toString().trim();
          console.log(`Encontrado TIME+KPI na linha ${i+1}, mas COMPETÊNCIA é "${rowCompetencia}" != "${competencia}"`);
          foundWithoutComp = true;
          break;
        }
      }
      
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        message: `Não foi encontrado KPI "${kpi}" do time "${time}" na competência "${competencia}"`,
        debug: foundWithoutComp ? 'TIME+KPI encontrado mas COMPETÊNCIA diferente' : 'TIME+KPI não encontrados'
      });
    }

    // Número da linha na planilha (1-indexed)
    const sheetRowNumber = rowIndex + 1;

    // Data atual para "CRIADO EM"
    const hoje = new Date();
    const criadoEm = `${hoje.getDate().toString().padStart(2, '0')}/${(hoje.getMonth() + 1).toString().padStart(2, '0')}/${hoje.getFullYear()}`;

    // Preparar atualizações usando colunas fixas
    const updates = [
      {
        range: `KPIS!${FCA_COLUMNS.criadoEm}${sheetRowNumber}`,
        values: [[criadoEm]]
      },
      {
        range: `KPIS!${FCA_COLUMNS.fato}${sheetRowNumber}`,
        values: [[fato || '']]
      },
      {
        range: `KPIS!${FCA_COLUMNS.causa}${sheetRowNumber}`,
        values: [[causa || '']]
      },
      {
        range: `KPIS!${FCA_COLUMNS.efeito}${sheetRowNumber}`,
        values: [[efeito || '']]
      },
      {
        range: `KPIS!${FCA_COLUMNS.acao}${sheetRowNumber}`,
        values: [[acao || '']]
      },
      {
        range: `KPIS!${FCA_COLUMNS.responsavel}${sheetRowNumber}`,
        values: [[responsavel || '']]
      },
      {
        range: `KPIS!${FCA_COLUMNS.terminoPrevisto}${sheetRowNumber}`,
        values: [[terminoPrevisto || '']]
      }
    ];

    // Determinar o valor da coluna REALIZADO baseado na ação
    const actionType = req.body.action || 'save';
    if (actionType === 'complete') {
      // Ao concluir, preencher com "Sim"
      updates.push({
        range: `KPIS!${FCA_COLUMNS.realizado}${sheetRowNumber}`,
        values: [['Sim']]
      });
    } else {
      // Ao criar/salvar, preencher com "Não"
      updates.push({
        range: `KPIS!${FCA_COLUMNS.realizado}${sheetRowNumber}`,
        values: [['Não']]
      });
    }

    // Executar atualizações em batch
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: GERENCIAL_SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates
      }
    });

    const message = actionType === 'complete' ? 'FCA concluído com sucesso!' : 'FCA salvo com sucesso!';

    return res.status(200).json({
      success: true,
      message,
      data: {
        time,
        kpi,
        competencia,
        criadoEm,
        fato,
        causa,
        efeito,
        acao,
        responsavel,
        terminoPrevisto,
        realizado: actionType === 'complete' ? 'Sim' : 'Não',
        rowUpdated: sheetRowNumber
      }
    });

  } catch (error: any) {
    console.error('Erro ao salvar FCA:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao salvar FCA',
      message: error.message || 'Ocorreu um erro ao salvar os dados',
    });
  }
}
