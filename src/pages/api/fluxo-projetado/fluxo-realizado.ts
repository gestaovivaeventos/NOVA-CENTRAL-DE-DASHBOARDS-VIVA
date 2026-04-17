/**
 * API: Fluxo Realizado - Fundos por Franquia
 * Busca dados da aba carteira_realizado
 * Retorna lista de fundos com FEE, antecipação e saldo para o componente RecebimentoFeeFundo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = process.env.PLANILHA_FLUXO_PROJETADO_ID!;
const SHEET_NAME = 'carteira_realizado';
const CACHE_KEY = 'fluxo-realizado:fundos';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

/**
 * Mapeamento das colunas da aba carteira_realizado
 * Linha 1 = Cabeçalho, Linha 2+ = Dados
 * 
 * A (0) = FRANQUIA
 * B (1) = COD FUNDO
 * C (2) = FUNDO (nome completo)
 * D (3) = MAF INICIAL
 * E (4) = % FEE/MAF
 * F (5) = FEE INICIAL (valor total do FEE)
 * G (6) = dt_contrato_fundo
 * H (7) = PRIMEIRO BOLETO
 * I (8) = dt_baile
 * J (9) = VALOR ARRECADADO PELO FUNDO
 * K (10) = VALOR TOTAL DE RP PAGA
 * L (11) = SALDO
 * M (12) = FEE PAGO (antecipação recebida)
 * N (13) = VALOR PAGO DE RP (FEE)
 * O (14) = VALOR RESTANTE DE FEE
 * P (15) = % PAGO FEE
 * Q (16) = VALOR PAGO DE MARGEM
 */
const COLUNAS = {
  FRANQUIA: 0,                 // A - Franquia
  COD_FUNDO: 1,                // B - Código do Fundo
  NOME_FUNDO: 2,               // C - Nome completo do Fundo
  MAF_INICIAL: 3,              // D - MAF Inicial
  PERCENTUAL_FEE: 4,           // E - % FEE/MAF
  FEE_INICIAL: 5,              // F - FEE INICIAL (valor total do FEE)
  DT_CONTRATO: 6,              // G - Data do contrato
  PRIMEIRO_BOLETO: 7,          // H - Primeiro boleto
  DT_BAILE: 8,                 // I - Data do baile
  VALOR_ARRECADADO: 9,         // J - Valor arrecadado pelo fundo
  VALOR_RP_PAGA: 10,           // K - Valor total de RP paga
  SALDO: 11,                   // L - Saldo do fundo
  FEE_PAGO: 12,                // M - FEE Pago (antecipação recebida)
  VALOR_PAGO_RP_FEE: 13,       // N - Valor pago de RP (FEE)
  VALOR_RESTANTE_FEE: 14,      // O - Valor restante de FEE
  PERCENTUAL_PAGO_FEE: 15,     // P - % Pago FEE
  VALOR_PAGO_MARGEM: 16,       // Q - Valor pago de margem
  PERCENTUAL_ATING_MAC: 19,    // T - % Atingimento MAC
  SITUACAO: 20,                // U - Situação do fundo
  FEE_INICIAL_V: 21,           // V - FEE INICIAL
  FEE_REPLANEJADO: 22,         // W - FEE REPLANEJADO
  PRETENDE_ABRIR_CP: 23,       // X - PRETENDE ABRIR CP
  FUNDO_CORRELATOS: 24,        // Y - FUNDO CORRELATOS
};

// Linha onde começa o cabeçalho (0-indexed): linha 1 da planilha = índice 0
const HEADER_ROW = 0;

interface FundoRealizado {
  id: string;
  nome: string;
  unidade: string;
  feeTotal: number;
  feeAntecipacaoTotal: number;
  feeAntecipacaoRecebido: number;
  saldoFundo: number;
  faltaReceber: number;  // Coluna O - Valor Restante de FEE
  dataContrato?: string;  // Coluna G - Data do contrato
  dataBaile?: string;     // Coluna I - Data do baile
  percentualAtingMac?: number; // Coluna T - % Atingimento MAC
  situacao?: string;      // Coluna U - Situação do fundo
  feeInicialV?: number;   // Coluna V - FEE INICIAL
  feeReplanejado?: number; // Coluna W - FEE REPLANEJADO
  pretendeAbrirCP?: boolean; // Coluna X - PRETENDE ABRIR CP
  fundoCorrelatos?: string; // Coluna Y - FUNDO CORRELATOS
}

// Função para obter cliente autenticado
function getAuthenticatedClient() {
  const GOOGLE_SERVICE_ACCOUNT_BASE64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;

  if (!GOOGLE_SERVICE_ACCOUNT_BASE64) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado');
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
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

// Função para converter valor numérico (padrão brasileiro)
function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  let cleaned = String(value).replace(/[R$\s]/g, '');
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Interface para parâmetros da aba PARAMETRO OFICIAL DO FLUXO REALIZADO
interface ParametrosPainel {
  percentualAntecipacao: number;
  diasBaileAntecipar: number;
}

// Busca parâmetros da aba PARAMETRO OFICIAL DO FLUXO REALIZADO para a franquia
// Coluna C = % ANTECIPAÇÃO | Coluna G = DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
async function getParametrosPainel(sheets: any, franquia: string): Promise<ParametrosPainel> {
  try {
    const range = `'PARAMETRO OFICIAL DO FLUXO REALIZADO'!A:G`;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });
    const rows = response.data.values || [];
    const franquiaUpper = franquia.toUpperCase().trim();
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] && row[0].toString().trim().toUpperCase() === franquiaUpper) {
        // Coluna C (índice 2) = % ANTECIPAÇÃO (vem como decimal, ex: 0.60 = 60%)
        let percentualAntecipacao = 0;
        const valorC = row[2];
        if (valorC !== undefined && valorC !== null && valorC !== '') {
          let cleaned = String(valorC).replace('%', '').replace(',', '.').trim();
          let num = parseFloat(cleaned) || 0;
          // Se o valor é maior que 1, já está em percentual (ex: 60); senão é decimal (0.60)
          if (num > 0 && num <= 1) num = num * 100;
          percentualAntecipacao = num;
        }
        
        // Coluna G (índice 6) = DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
        let diasBaileAntecipar = 0;
        const valorG = row[6];
        if (valorG !== undefined && valorG !== null && valorG !== '') {
          diasBaileAntecipar = parseInt(String(valorG).trim(), 10) || 0;
        }
        
        return { percentualAntecipacao, diasBaileAntecipar };
      }
    }
    return { percentualAntecipacao: 0, diasBaileAntecipar: 0 };
  } catch (err) {
    console.error('[Fluxo Realizado API] Erro ao buscar parâmetros:', err);
    return { percentualAntecipacao: 0, diasBaileAntecipar: 0 };
  }
}

interface FluxoRealizadoResult {
  fundos: FundoRealizado[];
  percentualAntecipacao: number;
  diasBaileAntecipar: number;
}

async function getFundosRealizado(franquia: string, skipCache: boolean = false): Promise<FluxoRealizadoResult> {
  const cacheKey = `${CACHE_KEY}:${franquia.toUpperCase()}`;
  
  // Verifica cache primeiro
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[Fluxo Realizado API] Cache hit para ${franquia}`);
      return cached as FluxoRealizadoResult;
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba de fundos e parâmetros em paralelo
  const [fundosResponse, parametros] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET_NAME}'!A:Z`,
    }),
    getParametrosPainel(sheets, franquia),
  ]);
  const { percentualAntecipacao, diasBaileAntecipar } = parametros;

  const response = fundosResponse;

  const rows = response.data.values || [];
  
  if (!rows || rows.length <= 1) {
    console.log('[Fluxo Realizado API] Nenhum dado encontrado na planilha');
    return [];
  }

  // Log do cabeçalho para debug (linha 2 = índice 1)
  console.log('[Fluxo Realizado API] Cabeçalho:', rows[HEADER_ROW]);

  const franquiaUpper = franquia.toUpperCase();
  const fundos: FundoRealizado[] = [];
  
  // Processa linhas (pula título linha 1 e cabeçalho linha 2, começa na linha 3 = índice 2)
  const dataRows = rows.slice(HEADER_ROW + 1);
  
  for (const row of dataRows) {
    // Verifica se a franquia corresponde
    const franquiaRow = row[COLUNAS.FRANQUIA];
    if (!franquiaRow || franquiaRow.toString().toUpperCase() !== franquiaUpper) {
      continue;
    }
    
    const codFundo = row[COLUNAS.COD_FUNDO] || '';
    const nomeFundo = row[COLUNAS.NOME_FUNDO] || '';
    const feeInicial = parseNumber(row[COLUNAS.FEE_INICIAL]);
    const feePago = parseNumber(row[COLUNAS.FEE_PAGO]);
    const valorPagoRpFee = parseNumber(row[COLUNAS.VALOR_PAGO_RP_FEE]); // Coluna N
    const saldo = parseNumber(row[COLUNAS.SALDO]); // Coluna L
    const valorRestanteFee = parseNumber(row[COLUNAS.VALOR_RESTANTE_FEE]); // Coluna O
    const dataContrato = row[COLUNAS.DT_CONTRATO] || ''; // Coluna G
    const dataBaile = row[COLUNAS.DT_BAILE] || ''; // Coluna I
    const situacao = (row[COLUNAS.SITUACAO] || '').toString().trim(); // Coluna U
    const feeInicialV = parseNumber(row[COLUNAS.FEE_INICIAL_V]); // Coluna V
    const feeReplanejado = parseNumber(row[COLUNAS.FEE_REPLANEJADO]); // Coluna W
    const pretendeAbrirCP = (row[COLUNAS.PRETENDE_ABRIR_CP] || '').toString().trim().toUpperCase() === 'SIM'; // Coluna X
    // Coluna Y - FUNDO CORRELATOS: pode vir como texto "8344,7423,7720" ou como número se Sheets interpretou vírgula como decimal
    const rawCorrelatos = row[COLUNAS.FUNDO_CORRELATOS];
    let fundoCorrelatos = '';
    if (rawCorrelatos !== undefined && rawCorrelatos !== null && rawCorrelatos !== '') {
      const strVal = rawCorrelatos.toString().trim();
      // Extrai todos os códigos numéricos (funciona para "8344,7423,7720", "8344.7423" etc)
      const codigos = strVal.match(/\d+/g);
      fundoCorrelatos = codigos ? codigos.join(',') : '';
    }
    // Coluna T: % Atingimento MAC (pode vir como decimal 0.75 ou percentual 75)
    const rawAtingMac = row[COLUNAS.PERCENTUAL_ATING_MAC];
    let percentualAtingMac = 0;
    if (rawAtingMac !== undefined && rawAtingMac !== null && rawAtingMac !== '') {
      let cleaned = String(rawAtingMac).replace('%', '').replace(',', '.').trim();
      let num = parseFloat(cleaned) || 0;
      if (num > 0 && num <= 1) num = num * 100;
      percentualAtingMac = num;
    }
    
    // Antecipação recebida = M + N (FEE Pago + Valor Pago RP FEE)
    const antecipacaoRecebida = feePago + valorPagoRpFee;
    
    // Falta Receber = Coluna O (VALOR RESTANTE DE FEE) diretamente da planilha
    const faltaReceber = valorRestanteFee;
    
    // Ignora linhas sem código de fundo
    if (!codFundo) continue;
    
    const fundo: FundoRealizado = {
      id: codFundo.toString(),
      nome: nomeFundo || `Fundo ${codFundo}`,
      unidade: '',
      feeTotal: feeInicial,
      feeAntecipacaoTotal: feeInicial,
      feeAntecipacaoRecebido: antecipacaoRecebida, // M + N
      saldoFundo: saldo, // L
      faltaReceber: faltaReceber, // Coluna O - VALOR RESTANTE DE FEE
      dataContrato: dataContrato, // Coluna G
      dataBaile: dataBaile, // Coluna I
      percentualAtingMac: percentualAtingMac, // Coluna T
      situacao: situacao, // Coluna U
      feeInicialV: feeInicialV, // Coluna V
      feeReplanejado: feeReplanejado, // Coluna W
      pretendeAbrirCP: pretendeAbrirCP, // Coluna X
      fundoCorrelatos: fundoCorrelatos || undefined, // Coluna Y
    };
    
    fundos.push(fundo);
  }

  console.log(`[Fluxo Realizado API] ${fundos.length} fundos encontrados para ${franquia} | % Antecipação: ${percentualAntecipacao}% | Dias Baile Antecipar: ${diasBaileAntecipar}`);
  
  const result: FluxoRealizadoResult = { fundos, percentualAntecipacao, diasBaileAntecipar };
  
  // Salva no cache
  cache.set(cacheKey, result, CACHE_TTL);
  
  return result;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { franquia, skipCache } = req.query;

    if (!franquia) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro obrigatório: franquia' 
      });
    }

    const result = await getFundosRealizado(
      franquia as string, 
      skipCache === 'true'
    );

    const { fundos, percentualAntecipacao, diasBaileAntecipar } = result;

    // Calcula totais para o resumo
    const totais = {
      totalFundos: fundos.length,
      valorFeeTotal: fundos.reduce((sum, f) => sum + f.feeTotal, 0),
      antecipacaoRecebidaTotal: fundos.reduce((sum, f) => sum + f.feeAntecipacaoRecebido, 0),
      faltaReceberTotal: fundos.reduce((sum, f) => sum + f.faltaReceber, 0), // Usa coluna O diretamente
      fundosComSaqueDisponivel: fundos.filter(f => {
        return f.faltaReceber > 0 && f.saldoFundo >= f.faltaReceber;
      }).length,
    };

    return res.status(200).json({
      success: true,
      data: {
        fundos,
        totais,
        percentualAntecipacao,
        diasBaileAntecipar,
      },
    });
  } catch (error: any) {
    console.error('[Fluxo Realizado API] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
}
//Feito por Marcos Castro - 2026
