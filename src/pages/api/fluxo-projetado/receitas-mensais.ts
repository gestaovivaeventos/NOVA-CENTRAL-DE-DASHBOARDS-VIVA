/**
 * API: Receitas Mensais (RPS FEE E MARGEM)
 * Busca dados da aba RPS FEE E MARGEM da planilha BACKEND FLUXO PROJETADO FRANQUIAS
 * Agrupa receitas por mês/ano com detalhamento por tipo
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ID da planilha de Fluxo Projetado
const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'RPS FEE E MARGEM';
const CACHE_KEY = 'receitas-mensais';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Mapeamento das colunas da aba RPS FEE E MARGEM
 * Baseado nas informações do usuário:
 * 
 * C (2) = FRANQUIA
 * F (5) = VALOR (coluna para soma)
 * G (6) = DATA DE REFERÊNCIA
 * T (19) = TIPO DE RECEITA (ANTECIPAÇÃO, ÚLTIMA PARCELA, etc)
 */
const COLUNAS = {
  FRANQUIA: 2,           // C - Franquia
  VALOR: 5,              // F - Valor para soma
  DATA_REFERENCIA: 6,    // G - Data de referência
  TIPO_RECEITA: 19,      // T - Tipo de receita
};

// Linha onde começa o cabeçalho (0-indexed), assumindo linha 1 é título
const HEADER_ROW = 0;

// Meses por extenso
const MESES_NOME: { [key: number]: string } = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

interface ReceitaMensalAgrupada {
  mes: string;                  // ex: "01/2025", "02/2025"
  mesNome: string;              // ex: "Janeiro", "Fevereiro"
  ano: number;
  valorTotal: number;
  antecipacaoFee: number;       // Antecipação FEE
  ultimaParcelaFee: number;     // Última Parcela FEE
  demaisReceitas: number;       // Demais Receitas
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

// Função para extrair mês e ano de uma data (formato brasileiro DD/MM/YYYY ou serial do Google Sheets)
function extrairMesAno(dataValue: any): { mes: number; ano: number } | null {
  if (!dataValue) return null;
  
  const dataStr = String(dataValue).trim();
  
  // Tenta formato DD/MM/YYYY
  const matchBr = dataStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchBr) {
    return {
      mes: parseInt(matchBr[2], 10),
      ano: parseInt(matchBr[3], 10),
    };
  }
  
  // Tenta formato YYYY-MM-DD
  const matchIso = dataStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (matchIso) {
    return {
      mes: parseInt(matchIso[2], 10),
      ano: parseInt(matchIso[1], 10),
    };
  }
  
  // Tenta interpretar como número serial do Google Sheets
  const serial = parseFloat(dataStr);
  if (!isNaN(serial) && serial > 40000) {
    // Converte serial do Google Sheets para data
    const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
    return {
      mes: date.getUTCMonth() + 1,
      ano: date.getUTCFullYear(),
    };
  }
  
  return null;
}

// Função para normalizar tipo de receita
function normalizarTipoReceita(tipo: string): 'antecipacao' | 'ultima_parcela' | 'demais' {
  if (!tipo) return 'demais';
  
  const tipoUpper = tipo.toUpperCase().trim();
  
  if (tipoUpper.includes('ANTECIPA')) {
    return 'antecipacao';
  }
  
  if (tipoUpper.includes('ÚLTIMA PARCELA') || tipoUpper.includes('ULTIMA PARCELA')) {
    return 'ultima_parcela';
  }
  
  return 'demais';
}

async function getReceitasMensais(franquia: string, skipCache: boolean = false): Promise<ReceitaMensalAgrupada[]> {
  const cacheKey = `${CACHE_KEY}:${franquia.toUpperCase()}`;
  
  // Verifica cache primeiro
  if (!skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[Receitas Mensais API] Cache hit para ${franquia}`);
      return cached as ReceitaMensalAgrupada[];
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
  
  if (!rows || rows.length <= 1) {
    console.log('[Receitas Mensais API] Nenhum dado encontrado na planilha');
    return [];
  }

  // Log do cabeçalho para debug
  console.log('[Receitas Mensais API] Cabeçalho:', rows[HEADER_ROW]);

  const franquiaUpper = franquia.toUpperCase();
  
  // Mapa para agrupar por mês/ano
  const receitasPorMes = new Map<string, {
    mes: number;
    ano: number;
    antecipacao: number;
    ultimaParcela: number;
    demais: number;
  }>();
  
  // Processa linhas (pula cabeçalho)
  const dataRows = rows.slice(HEADER_ROW + 1);
  
  for (const row of dataRows) {
    // Verifica se a franquia corresponde (coluna C)
    const franquiaRow = row[COLUNAS.FRANQUIA];
    if (!franquiaRow || franquiaRow.toString().toUpperCase() !== franquiaUpper) {
      continue;
    }
    
    // Extrai valor (coluna F)
    const valor = parseNumber(row[COLUNAS.VALOR]);
    if (valor === 0) continue;
    
    // Extrai mês/ano da data (coluna G)
    const dataRef = extrairMesAno(row[COLUNAS.DATA_REFERENCIA]);
    if (!dataRef) continue;
    
    // Extrai tipo de receita (coluna T)
    const tipoReceita = row[COLUNAS.TIPO_RECEITA] || '';
    const tipoNormalizado = normalizarTipoReceita(tipoReceita);
    
    // Chave para agrupamento
    const chave = `${String(dataRef.mes).padStart(2, '0')}/${dataRef.ano}`;
    
    // Agrupa valores
    if (!receitasPorMes.has(chave)) {
      receitasPorMes.set(chave, {
        mes: dataRef.mes,
        ano: dataRef.ano,
        antecipacao: 0,
        ultimaParcela: 0,
        demais: 0,
      });
    }
    
    const registro = receitasPorMes.get(chave)!;
    
    switch (tipoNormalizado) {
      case 'antecipacao':
        registro.antecipacao += valor;
        break;
      case 'ultima_parcela':
        registro.ultimaParcela += valor;
        break;
      default:
        registro.demais += valor;
    }
  }

  // Converte para array ordenado
  const receitas: ReceitaMensalAgrupada[] = Array.from(receitasPorMes.entries())
    .map(([mes, dados]) => ({
      mes,
      mesNome: MESES_NOME[dados.mes] || '',
      ano: dados.ano,
      valorTotal: dados.antecipacao + dados.ultimaParcela + dados.demais,
      antecipacaoFee: dados.antecipacao,
      ultimaParcelaFee: dados.ultimaParcela,
      demaisReceitas: dados.demais,
    }))
    .sort((a, b) => {
      // Ordena por ano e mês
      if (a.ano !== b.ano) return a.ano - b.ano;
      const mesA = parseInt(a.mes.split('/')[0], 10);
      const mesB = parseInt(b.mes.split('/')[0], 10);
      return mesA - mesB;
    });

  console.log(`[Receitas Mensais API] ${receitas.length} meses encontrados para ${franquia}`);
  
  // Salva no cache
  cache.set(cacheKey, receitas, CACHE_TTL);
  
  return receitas;
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

    const receitas = await getReceitasMensais(
      franquia as string, 
      skipCache === 'true'
    );

    // Calcula totais
    const totais = {
      totalGeral: receitas.reduce((sum, r) => sum + r.valorTotal, 0),
      totalAntecipacao: receitas.reduce((sum, r) => sum + r.antecipacaoFee, 0),
      totalUltimaParcela: receitas.reduce((sum, r) => sum + r.ultimaParcelaFee, 0),
      totalDemais: receitas.reduce((sum, r) => sum + r.demaisReceitas, 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        receitas,
        totais,
      },
    });
  } catch (error: any) {
    console.error('[Receitas Mensais API] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor',
    });
  }
}
