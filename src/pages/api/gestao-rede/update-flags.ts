/**
 * API para atualizar as flags de uma franquia
 * Permite adicionar/remover múltiplas flags na coluna O (flag_sistema) da planilha
 * A leitura das flags continua pela coluna J (flags)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// Tipo local para evitar problemas de importação em API routes
interface FlagsEstruturais {
  governanca: boolean;
  necessidadeCapitalGiro: boolean;
  timeCritico: boolean;
  socioOperador: boolean;
}

// Planilha específica de Gestão Rede - via variáveis de ambiente
const SPREADSHEET_ID = process.env.GESTAO_REDE_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.GESTAO_REDE_SHEET_NAME || 'BASE GESTAO REDE';
const CACHE_KEY = 'gestao-rede:data';

// Coluna de flags do sistema é a coluna O (flag_sistema) - escrita pelo painel
// A coluna J (flags) continua sendo usada apenas para leitura
const FLAGS_COLUMN_LETTER = 'O';

// Coluna de log de última alteração de flags
const LOG_COLUMN_LETTER = 'S';

// Usuários autorizados a alterar flags
const ALLOWED_FLAG_EDITORS = ['EVERDAN', 'vitor', 'marcos', 'cris', 'gabriel.braz'];

interface UpdateFlagsRequest {
  chaveData: string;  // Identificador único da linha (coluna A)
  flags: FlagsEstruturais;
  username?: string;  // Usuário que está fazendo a alteração
}

interface UpdateFlagsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Mapeamento de flags para labels da planilha
const FLAG_LABELS: Record<keyof FlagsEstruturais, string> = {
  governanca: 'GOVERNANÇA',
  necessidadeCapitalGiro: 'NECESSIDADE CAPITAL DE GIRO',
  timeCritico: 'TIME CRÍTICO',
  socioOperador: 'SÓCIO OPERADOR',
};

/**
 * Converte FlagsEstruturais para string da planilha
 */
function flagsToString(flags: FlagsEstruturais): string {
  const flagsAtivas: string[] = [];

  if (flags.governanca) flagsAtivas.push(FLAG_LABELS.governanca);
  if (flags.necessidadeCapitalGiro) flagsAtivas.push(FLAG_LABELS.necessidadeCapitalGiro);
  if (flags.timeCritico) flagsAtivas.push(FLAG_LABELS.timeCritico);
  if (flags.socioOperador) flagsAtivas.push(FLAG_LABELS.socioOperador);

  return flagsAtivas.join(', ');
}

/**
 * Obtém cliente autenticado do Google Sheets
 */
async function getAuthClient() {
  const credentials = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf-8')
  );

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  // Autorizar o cliente
  await auth.authorize();

  return auth;
}

/**
 * Encontra a linha pelo chaveData
 */
async function findRowByChaveData(sheets: ReturnType<typeof google.sheets>, chaveData: string): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A:A`,
  });

  const values = response.data.values || [];
  
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === chaveData) {
      return i + 1; // Google Sheets usa índice 1-based
    }
  }

  return null;
}

/**
 * Handler da API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateFlagsResponse>
) {
  // Apenas POST é permitido
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido. Use POST.',
    });
  }

  try {
    const { chaveData, flags, username } = req.body as UpdateFlagsRequest;

    // Validar entrada
    if (!chaveData || flags === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: chaveData e flags',
      });
    }

    // Validar permissão do usuário
    if (!username || !ALLOWED_FLAG_EDITORS.includes(username)) {
      return res.status(403).json({
        success: false,
        error: 'Usuário não autorizado a alterar flags',
      });
    }

    // Converter flags para string da planilha
    const valorPlanilha = flagsToString(flags);

    // Gerar descrição da alteração para o log
    const flagsAtivas: string[] = [];
    if (flags.governanca) flagsAtivas.push(FLAG_LABELS.governanca);
    if (flags.necessidadeCapitalGiro) flagsAtivas.push(FLAG_LABELS.necessidadeCapitalGiro);
    if (flags.timeCritico) flagsAtivas.push(FLAG_LABELS.timeCritico);
    if (flags.socioOperador) flagsAtivas.push(FLAG_LABELS.socioOperador);
    
    const descricaoAlteracao = flagsAtivas.length > 0 
      ? flagsAtivas.join(' | ') 
      : 'Flags removidas';
    
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const logAlteracao = `${username}, ${descricaoAlteracao}, ${dataAtual}`;

    console.log('[API update-flags] Atualizando flags:', { chaveData, flags, valorPlanilha, username });

    // Autenticar
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Encontrar a linha
    const rowNumber = await findRowByChaveData(sheets, chaveData);

    if (!rowNumber) {
      return res.status(404).json({
        success: false,
        error: `Franquia com chaveData "${chaveData}" não encontrada`,
      });
    }

    console.log('[API update-flags] Linha encontrada:', rowNumber);

    // Atualizar a célula de flags
    const range = `'${SHEET_NAME}'!${FLAGS_COLUMN_LETTER}${rowNumber}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[valorPlanilha]],
      },
    });

    console.log('[API update-flags] Célula atualizada:', range, 'Valor:', valorPlanilha);

    // Registrar log da alteração na coluna S (ultima_alteracao_flags)
    const logRange = `'${SHEET_NAME}'!${LOG_COLUMN_LETTER}${rowNumber}`;
    
    // Ler log existente para não sobrescrever
    const logAtual = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: logRange,
    });
    const logExistente = logAtual.data.values?.[0]?.[0] || '';
    const novoLog = logExistente 
      ? `${logAlteracao} | ${logExistente}`
      : logAlteracao;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: logRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[novoLog]],
      },
    });

    console.log('[API update-flags] Log registrado:', logRange, 'Valor:', novoLog);

    // Invalidar cache para forçar recarregamento dos dados
    cache.invalidate(CACHE_KEY);

    const flagsCount = Object.values(flags).filter(Boolean).length;
    const message = flagsCount === 0 
      ? 'Todas as flags foram removidas'
      : `${flagsCount} flag(s) atualizada(s)`;

    return res.status(200).json({
      success: true,
      message,
    });

  } catch (error) {
    console.error('[API update-flags] Erro:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar flags',
    });
  }
}
