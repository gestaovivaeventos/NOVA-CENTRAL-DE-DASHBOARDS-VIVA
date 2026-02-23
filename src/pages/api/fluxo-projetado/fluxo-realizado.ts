/**
 * API: Fluxo Realizado - Fundos por Franquia
 * Busca dados da aba FUNDOS CARTEIRA (FLUXO REALIZADO)
 * Retorna lista de fundos com FEE, antecipação e saldo para o componente RecebimentoFeeFundo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'FUNDOS CARTEIRA (FLUXO REALIZADO)';
const CACHE_KEY = 'fluxo-realizado:fundos';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Mapeamento das colunas da aba FUNDOS CARTEIRA (FLUXO REALIZADO)
 * Linha 1 = Título/metadata, Linha 2 = Cabeçalho, Linha 3+ = Dados
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
};

// Linha onde começa o cabeçalho (0-indexed)
const HEADER_ROW = 1;

interface FundoRealizado {
  id: string;
  nome: string;
  unidade: string;
  feeTotal: number;
  feeAntecipacaoTotal: number;
  feeAntecipacaoRecebido: number;
  saldoFundo: number;
  faltaReceber: number;  // Coluna O - Valor Restante de FEE
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

async function getFundosRealizado(franquia: string, skipCache: boolean = false): Promise<FundoRealizado[]> {
  const cacheKey = `${CACHE_KEY}:${franquia.toUpperCase()}`;
  
  // Verifica cache primeiro
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[Fluxo Realizado API] Cache hit para ${franquia}`);
      return cached as FundoRealizado[];
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba
  const range = `'${SHEET_NAME}'!A:Z`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  const rows = response.data.values || [];
  
  if (!rows || rows.length <= 2) {
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
    
    // Antecipação recebida = M + N (FEE Pago + Valor Pago RP FEE)
    const antecipacaoRecebida = feePago + valorPagoRpFee;
    
    // Falta Receber = FEE Inicial - Antecipação Recebida (calculado, não usa coluna O)
    const faltaReceber = Math.max(0, feeInicial - antecipacaoRecebida);
    
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
      faltaReceber: faltaReceber, // Calculado: FEE - (M + N)
    };
    
    fundos.push(fundo);
  }

  console.log(`[Fluxo Realizado API] ${fundos.length} fundos encontrados para ${franquia}`);
  
  // Salva no cache
  cache.set(cacheKey, fundos, CACHE_TTL);
  
  return fundos;
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

    const fundos = await getFundosRealizado(
      franquia as string, 
      skipCache === 'true'
    );

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