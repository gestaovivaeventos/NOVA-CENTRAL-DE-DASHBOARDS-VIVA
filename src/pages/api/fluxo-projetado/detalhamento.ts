/**
 * API: Detalhamento Mensal
 * Busca dados mensais da aba FLUXO PROJETADO para uma franquia e ano específicos
 * Colunas: A=Data, B=Franquia, C=VVR, D=Antecipação Carteira, E=Fechamento Carteira, 
 *          F=Demais Receitas Carteira, G=Antecipação Novas Vendas, H=Fechamento Novas Vendas, 
 *          I=Demais Receitas Novas Vendas
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1ymgmW6ISadb8xKBpcNDXTnGr0buoOFVszSZmxaOxKBQ';
const SHEET_NAME = 'FLUXO PROJETADO';
const RANGE = `'${SHEET_NAME}'!A:I`;

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

// Função para converter valor numérico (padrão brasileiro: ponto = milhar, vírgula = decimal)
function parseNumber(value: string | undefined): number {
  if (!value || value === '' || value === '-') return 0;
  // Remove R$, espaços e outros caracteres não numéricos exceto ponto e vírgula
  let cleaned = value.toString().replace(/[R$\s]/g, '');
  // Remove pontos (separador de milhar) e substitui vírgula (separador decimal) por ponto
  cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

// Função para extrair ano da data
function extractYear(dateStr: string): number | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    // Formato DD/MM/YYYY
    return parseInt(parts[2]);
  }
  return null;
}

// Função para extrair mês no formato para ordenação
function extractMonthIndex(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return parseInt(parts[1]); // MM
  }
  return 0;
}

interface DadoMensal {
  mes: string;
  franquia: string;
  ano: number;
  antecipacaoCarteira: number;
  fechamentoCarteira: number;
  demaisReceitasCarteira: number;
  antecipacaoNovasVendas: number;
  fechamentoNovasVendas: number;
  demaisReceitasNovasVendas: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { franquia, ano } = req.query;

    if (!franquia || !ano) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetros obrigatórios: franquia e ano' 
      });
    }

    const franquiaUpper = (franquia as string).toUpperCase();
    const anoNumber = parseInt(ano as string);

    console.log(`[Detalhamento API] Buscando dados para ${franquiaUpper} - ${anoNumber}`);

    const auth = getAuthenticatedClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values || [];
    console.log(`[Detalhamento API] Total de linhas: ${rows.length}`);

    if (rows.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Nenhum dado encontrado'
      });
    }

    // Filtrar dados por franquia e ano
    const dadosFiltrados: DadoMensal[] = rows.slice(1) // Pular cabeçalho
      .filter((row: string[]) => {
        const rowFranquia = (row[1] || '').toUpperCase();
        const rowYear = extractYear(row[0]);
        return rowFranquia === franquiaUpper && rowYear === anoNumber;
      })
      .map((row: string[]) => ({
        mes: row[0] || '',
        franquia: row[1] || '',
        ano: extractYear(row[0]) || anoNumber,
        antecipacaoCarteira: parseNumber(row[3]),       // D
        fechamentoCarteira: parseNumber(row[4]),        // E
        demaisReceitasCarteira: parseNumber(row[5]),    // F
        antecipacaoNovasVendas: parseNumber(row[6]),    // G
        fechamentoNovasVendas: parseNumber(row[7]),     // H
        demaisReceitasNovasVendas: parseNumber(row[8]), // I
      }))
      // Ordenar por mês
      .sort((a: DadoMensal, b: DadoMensal) => extractMonthIndex(a.mes) - extractMonthIndex(b.mes));

    console.log(`[Detalhamento API] Dados filtrados: ${dadosFiltrados.length} registros`);

    return res.status(200).json({
      success: true,
      data: dadosFiltrados,
      franquia: franquiaUpper,
      ano: anoNumber,
      totalRegistros: dadosFiltrados.length
    });

  } catch (error) {
    console.error('[Detalhamento API] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados'
    });
  }
}
