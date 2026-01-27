/**
 * API: Projeção Fluxo Projetado
 * Busca dados da aba FLUXO PROJETADO da planilha Google Sheets
 * e agrupa por ano/semestre para exibição nos cards
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'FLUXO PROJETADO';
const SHEET_VVR = 'NOVOS FUNDOS';
const CACHE_KEY = 'fluxo-projetado:projecao';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Mapeamento das colunas da planilha FLUXO PROJETADO (conforme planilha real)
// A = MÊS, B = FRANQUIA, C = ANO
// D = Antecipação Carteira (MV)
// E = Fechamento Carteira (MV) / Ultima Parcela
// F = Demais receitas (MV)
// G = Antecipação Novas Vendas
// H = Fechamento Novas Vendas
// I = Demais Receitas Novas Vendas
// J = Antecipação Novas Vendas CALCULADORA FRANQUEADO
// K = Ultima parcela FEE Novas Vendas CALCULADORA FRANQUEADO  
// L = Demais Receitas Novas Vendas CALCULADORA FRANQUEADO
const COLUNAS = {
  MES: 0,                           // A - Data (ex: 01/01/2026)
  FRANQUIA: 1,                      // B - Franquia
  ANO: 2,                           // C - Ano
  ANTECIPACAO_CARTEIRA: 3,          // D - Antecipação Carteira (MV)
  FECHAMENTO_CARTEIRA: 4,           // E - Fechamento Carteira (MV) / Ultima Parcela
  DEMAIS_RECEITAS_CARTEIRA: 5,      // F - Demais receitas (MV) - Carteira
  ANTECIPACAO_NOVAS_VENDAS: 6,      // G - Antecipação Novas Vendas
  FECHAMENTO_NOVAS_VENDAS: 7,       // H - Fechamento Novas Vendas
  DEMAIS_RECEITAS_NOVAS_VENDAS: 8,  // I - Demais Receitas Novas Vendas
  ANTECIPACAO_CALC_FRANQUEADO: 9,   // J - Antecipação Novas Vendas CALCULADORA FRANQUEADO
  FECHAMENTO_CALC_FRANQUEADO: 10,   // K - Ultima parcela FEE Novas Vendas CALCULADORA FRANQUEADO
  DEMAIS_RECEITAS_CALC_FRANQUEADO: 11, // L - Demais Receitas Novas Vendas CALCULADORA FRANQUEADO
};

// Mapeamento das colunas da aba NOVOS FUNDOS
// A = MÊS VENDA, B = FRANQUIA, G = VVR
const COLUNAS_VVR = {
  MES_VENDA: 0,                     // A - MÊS VENDA
  FRANQUIA: 1,                      // B - FRANQUIA
  VVR: 6,                           // G - VVR - índice 6 (coluna G)
};

interface DadosMensal {
  mes: string;
  mesNumero: number;
  ano: number;
  franquia: string;
  antecipacaoCarteira: number;      // D
  fechamentoCarteira: number;       // E (Ultima Parcela)
  demaisReceitasCarteira: number;   // F
  antecipacaoNovasVendas: number;   // G
  fechamentoNovasVendas: number;    // H
  demaisReceitasNovasVendas: number;// I
  // Dados calculadora franqueado (colunas J+K+L)
  antecipacaoCalcFranqueado: number;    // J
  fechamentoCalcFranqueado: number;     // K
  demaisReceitasCalcFranqueado: number; // L
}

interface DadosSemestre {
  semestre: string;
  receitaCarteira: number;            // D + E + F (Proj. Carteira)
  receitaNovosVendas: number;         // G + H + I (Proj. Novas Vendas)
  custo: number;                      // Despesa (definida manualmente no painel)
  subtotal: number;                   // Subtotal (receitaCarteira + receitaNovosVendas)
  saldo: number;                      // Cálculo (subtotal + custo)
  somaAntecipacaoCarteira: number;    // D (Antecipação Carteira)
  somaExecucaoCarteira: number;       // E (Fechamento/Ultima Parc Carteira)
  somaDemaisReceitasCarteira: number; // F (Demais Receitas Carteira)
  somaAntecipacaoNovasVendas: number; // G (Antecipação Novas Vendas)
  somaExecucaoNovasVendas: number;    // H (Fechamento Novas Vendas)
  somaDemaisReceitasNovasVendas: number; // I (Demais Receitas Novas Vendas)
  somaVVR: number;                    // VVR do ano (da aba NOVOS FUNDOS)
  // Dados calculadora franqueado (colunas J+K+L)
  somaAntecipacaoCalcFranqueado: number;    // J
  somaFechamentoCalcFranqueado: number;     // K
  somaDemaisReceitasCalcFranqueado: number; // L
  receitaCalcFranqueado: number;            // J + K + L
}

interface DadosAnual {
  ano: number;
  receitaCarteira: number;
  receitaNovosVendas: number;
  subtotal: number;
  custo: number;
  saldo: number;
  semestres: DadosSemestre[];
}

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  const cleaned = String(value).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string): { mes: number; ano: number } | null {
  if (!value) return null;
  // Formato esperado: DD/MM/YYYY
  const parts = value.split('/');
  if (parts.length >= 3) {
    return {
      mes: parseInt(parts[1]),
      ano: parseInt(parts[2]),
    };
  }
  return null;
}

function getSemestre(mes: number): number {
  return mes <= 6 ? 1 : 2;
}

// Obtém cliente autenticado do Google Sheets
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

async function getProjecao(franquia: string, skipCache: boolean = false): Promise<DadosAnual[]> {
  const cacheKey = `${CACHE_KEY}:${franquia}`;
  
  // Verifica cache primeiro (se não for para ignorar)
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached as DadosAnual[];
    }
  }

  const auth = getAuthenticatedClient();
  const sheets = google.sheets({ version: 'v4', auth });
  
  // Busca dados da aba FLUXO PROJETADO (A até L para incluir colunas da calculadora franqueado)
  const range = `'${SHEET_NAME}'!A:L`;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range,
  });

  // Busca dados da aba NOVOS FUNDOS para VVR (coluna G)
  const rangeVVR = `'${SHEET_VVR}'!A:G`;
  const responseVVR = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: rangeVVR,
  });

  const rows = response.data.values || [];
  const rowsVVR = responseVVR.data.values || [];

  if (!rows || rows.length <= 1) {
    return [];
  }

  // Processa dados da aba NOVOS FUNDOS para calcular VVR por ano/semestre
  const vvrPorSemestre = new Map<string, number>(); // chave: "ano-semestre", valor: soma VVR
  
  if (rowsVVR.length > 1) {
    const dataRowsVVR = rowsVVR.slice(1);
    for (const row of dataRowsVVR) {
      const franquiaRow = row[COLUNAS_VVR.FRANQUIA];
      if (!franquiaRow || franquiaRow.toUpperCase() !== franquia.toUpperCase()) {
        continue;
      }
      
      const dateInfo = parseDate(row[COLUNAS_VVR.MES_VENDA]);
      if (!dateInfo) continue;
      
      const vvrValor = parseNumber(row[COLUNAS_VVR.VVR]);
      const semestreNum = getSemestre(dateInfo.mes);
      const chave = `${dateInfo.ano}-${semestreNum}`;
      
      const valorAtual = vvrPorSemestre.get(chave) || 0;
      vvrPorSemestre.set(chave, valorAtual + vvrValor);
    }
  }

  // Pula a primeira linha (cabeçalhos)
  const dataRows = rows.slice(1);
  
  // Filtra por franquia e parseia os dados
  const dadosMensais: DadosMensal[] = [];
  
  for (const row of dataRows) {
    const franquiaRow = row[COLUNAS.FRANQUIA];
    if (!franquiaRow || franquiaRow.toUpperCase() !== franquia.toUpperCase()) {
      continue;
    }

    const dateInfo = parseDate(row[COLUNAS.MES]);
    if (!dateInfo) continue;

    dadosMensais.push({
      mes: row[COLUNAS.MES],
      mesNumero: dateInfo.mes,
      ano: parseNumber(row[COLUNAS.ANO]) || dateInfo.ano,
      franquia: franquiaRow,
      antecipacaoCarteira: parseNumber(row[COLUNAS.ANTECIPACAO_CARTEIRA]),           // D
      fechamentoCarteira: parseNumber(row[COLUNAS.FECHAMENTO_CARTEIRA]),             // E
      demaisReceitasCarteira: parseNumber(row[COLUNAS.DEMAIS_RECEITAS_CARTEIRA]),    // F
      antecipacaoNovasVendas: parseNumber(row[COLUNAS.ANTECIPACAO_NOVAS_VENDAS]),    // G
      fechamentoNovasVendas: parseNumber(row[COLUNAS.FECHAMENTO_NOVAS_VENDAS]),      // H
      demaisReceitasNovasVendas: parseNumber(row[COLUNAS.DEMAIS_RECEITAS_NOVAS_VENDAS]), // I
      // Dados calculadora franqueado (colunas J+K+L)
      antecipacaoCalcFranqueado: parseNumber(row[COLUNAS.ANTECIPACAO_CALC_FRANQUEADO]),    // J
      fechamentoCalcFranqueado: parseNumber(row[COLUNAS.FECHAMENTO_CALC_FRANQUEADO]),     // K
      demaisReceitasCalcFranqueado: parseNumber(row[COLUNAS.DEMAIS_RECEITAS_CALC_FRANQUEADO]), // L
    });
  }

  // Agrupa por ano e semestre
  const anosMap = new Map<number, Map<number, DadosMensal[]>>();
  
  for (const dado of dadosMensais) {
    if (!anosMap.has(dado.ano)) {
      anosMap.set(dado.ano, new Map());
    }
    const semestreNum = getSemestre(dado.mesNumero);
    const semestreMap = anosMap.get(dado.ano)!;
    if (!semestreMap.has(semestreNum)) {
      semestreMap.set(semestreNum, []);
    }
    semestreMap.get(semestreNum)!.push(dado);
  }

  // Monta estrutura final
  const resultado: DadosAnual[] = [];
  
  for (const [ano, semestreMap] of Array.from(anosMap.entries()).sort((a, b) => a[0] - b[0])) {
    const semestres: DadosSemestre[] = [];
    let receitaCarteiraAnual = 0;
    let receitaNovasVendasAnual = 0;
    let subtotalAnual = 0;

    for (const [semestreNum, dados] of Array.from(semestreMap.entries()).sort((a, b) => a[0] - b[0])) {
      // PROJ. CARTEIRA = D + E + F (Antecipação + Fechamento + Demais Receitas da Carteira)
      const somaAntecipacaoCarteira = dados.reduce((sum, d) => sum + d.antecipacaoCarteira, 0);       // D
      const somaExecucaoCarteira = dados.reduce((sum, d) => sum + d.fechamentoCarteira, 0);          // E
      const somaDemaisReceitasCarteira = dados.reduce((sum, d) => sum + d.demaisReceitasCarteira, 0); // F
      const receitaCarteira = somaAntecipacaoCarteira + somaExecucaoCarteira + somaDemaisReceitasCarteira;
      
      // PROJ. NOVAS VENDAS = G + H + I (Antecipação + Fechamento + Demais Receitas de Novas Vendas)
      const somaAntecipacaoNovasVendas = dados.reduce((sum, d) => sum + d.antecipacaoNovasVendas, 0);        // G
      const somaExecucaoNovasVendas = dados.reduce((sum, d) => sum + d.fechamentoNovasVendas, 0);            // H
      const somaDemaisReceitasNovasVendas = dados.reduce((sum, d) => sum + d.demaisReceitasNovasVendas, 0);  // I
      const receitaNovosVendas = somaAntecipacaoNovasVendas + somaExecucaoNovasVendas + somaDemaisReceitasNovasVendas;
      
      // DADOS CALCULADORA FRANQUEADO = J + K + L
      const somaAntecipacaoCalcFranqueado = dados.reduce((sum, d) => sum + d.antecipacaoCalcFranqueado, 0);        // J
      const somaFechamentoCalcFranqueado = dados.reduce((sum, d) => sum + d.fechamentoCalcFranqueado, 0);          // K
      const somaDemaisReceitasCalcFranqueado = dados.reduce((sum, d) => sum + d.demaisReceitasCalcFranqueado, 0);  // L
      const receitaCalcFranqueado = somaAntecipacaoCalcFranqueado + somaFechamentoCalcFranqueado + somaDemaisReceitasCalcFranqueado;
      
      // SUBTOTAL = receitaCarteira + receitaNovosVendas
      const subtotal = receitaCarteira + receitaNovosVendas;
      
      // SALDO = subtotal (despesa é definida manualmente no painel, não vem da planilha)
      const saldo = subtotal;

      // VVR DO ANO = soma da coluna G (VVR) da aba NOVOS FUNDOS (filtrando por ano e franquia)
      const somaVVR = vvrPorSemestre.get(`${ano}-${semestreNum}`) || 0;

      semestres.push({
        semestre: `${ano}-${semestreNum}`,
        receitaCarteira,
        receitaNovosVendas,
        custo: 0, // Despesa é definida manualmente no painel
        subtotal,
        saldo,
        somaAntecipacaoCarteira,
        somaExecucaoCarteira,
        somaDemaisReceitasCarteira,
        somaAntecipacaoNovasVendas,
        somaExecucaoNovasVendas,
        somaDemaisReceitasNovasVendas,
        somaVVR,
        // Dados calculadora franqueado
        somaAntecipacaoCalcFranqueado,
        somaFechamentoCalcFranqueado,
        somaDemaisReceitasCalcFranqueado,
        receitaCalcFranqueado,
      });

      receitaCarteiraAnual += receitaCarteira;
      receitaNovasVendasAnual += receitaNovosVendas;
      subtotalAnual += subtotal;
    }

    resultado.push({
      ano,
      receitaCarteira: receitaCarteiraAnual,
      receitaNovosVendas: receitaNovasVendasAnual,
      subtotal: subtotalAnual,
      custo: 0, // Despesa é definida manualmente no painel
      saldo: subtotalAnual, // Saldo sem despesa
      semestres,
    });
  }

  // Salva no cache
  cache.set(cacheKey, resultado, CACHE_TTL);

  return resultado;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido',
      });
    }

    const franquia = (req.query.franquia as string) || 'JUIZ DE FORA';
    const skipCache = !!req.query.refresh;
    
    const dados = await getProjecao(franquia, skipCache);
    
    return res.status(200).json({
      success: true,
      data: dados,
      franquia,
      cached: !skipCache,
    });
  } catch (error) {
    console.error('[API Projecao] Erro completo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[API Projecao] Stack:', errorStack);
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorStack,
    });
  }
}
