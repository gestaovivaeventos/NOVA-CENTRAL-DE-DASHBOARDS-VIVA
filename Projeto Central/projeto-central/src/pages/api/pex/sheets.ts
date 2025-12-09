import type { NextApiRequest, NextApiResponse } from 'next';
import { FranquiaRaw } from '@/modules/pex/types';

interface SheetsResponse {
  success: boolean;
  data?: FranquiaRaw[];
  message?: string;
}

/**
 * API para buscar dados PEX do Google Sheets
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SheetsResponse>
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
    });
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheetId) {
      // Retorna dados mock se não houver sheet configurada
      return res.status(200).json({
        success: true,
        data: getMockData(),
        message: 'Usando dados mock (GOOGLE_SHEET_ID não configurado)',
      });
    }

    // Busca dados do Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Erro ao buscar sheet: ${response.status}`);
    }

    const csvText = await response.text();
    const data = parseCSVToFranquias(csvText);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Erro ao buscar dados PEX:', error);
    
    // Fallback para dados mock em caso de erro
    return res.status(200).json({
      success: true,
      data: getMockData(),
      message: 'Usando dados mock (erro ao conectar com Google Sheets)',
    });
  }
}

/**
 * Parse CSV para array de FranquiaRaw
 */
function parseCSVToFranquias(csv: string): FranquiaRaw[] {
  const lines = csv.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const franquias: FranquiaRaw[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const franquia: FranquiaRaw = {
      id: `franquia_${i}`,
      nome: getColumnValue(headers, values, 'nome') || 
            getColumnValue(headers, values, 'franquia') || `Franquia ${i}`,
      cluster: getColumnValue(headers, values, 'cluster') || 'CALOURO',
      consultor: getColumnValue(headers, values, 'consultor'),
      regiao: getColumnValue(headers, values, 'regiao'),
      vvr: parseFloat(getColumnValue(headers, values, 'vvr')) || 0,
      mac: parseFloat(getColumnValue(headers, values, 'mac')) || 0,
      endividamento: parseFloat(getColumnValue(headers, values, 'endividamento')) || 0,
      nps: parseFloat(getColumnValue(headers, values, 'nps')) || 0,
      mc: parseFloat(getColumnValue(headers, values, 'mc')) || 0,
      enps: parseFloat(getColumnValue(headers, values, 'enps')) || 0,
      conformidades: parseFloat(getColumnValue(headers, values, 'conformidades')) || 0,
      bonus1: getColumnValue(headers, values, 'bonus1')?.toLowerCase() === 'sim',
      bonus2: getColumnValue(headers, values, 'bonus2')?.toLowerCase() === 'sim',
      bonus3: getColumnValue(headers, values, 'bonus3')?.toLowerCase() === 'sim',
    };

    franquias.push(franquia);
  }

  return franquias;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function getColumnValue(headers: string[], values: string[], columnName: string): string {
  const index = headers.findIndex((h) => h === columnName || h.includes(columnName));
  return index >= 0 && index < values.length ? values[index] : '';
}

/**
 * Dados mock para desenvolvimento
 */
function getMockData(): FranquiaRaw[] {
  return [
    {
      id: 'franquia_1',
      nome: 'Viva São Paulo Centro',
      cluster: 'POS_GRADUADO',
      consultor: 'Maria Silva',
      regiao: 'Sudeste',
      vvr: 92,
      mac: 85,
      endividamento: 28,
      nps: 82,
      mc: 24,
      enps: 72,
      conformidades: 95,
      bonus1: true,
      bonus2: true,
      bonus3: true,
    },
    {
      id: 'franquia_2',
      nome: 'Viva Rio de Janeiro',
      cluster: 'GRADUADO',
      consultor: 'João Santos',
      regiao: 'Sudeste',
      vvr: 85,
      mac: 78,
      endividamento: 35,
      nps: 75,
      mc: 21,
      enps: 65,
      conformidades: 88,
      bonus1: true,
      bonus2: true,
      bonus3: false,
    },
    {
      id: 'franquia_3',
      nome: 'Viva Belo Horizonte',
      cluster: 'GRADUADO',
      consultor: 'Ana Oliveira',
      regiao: 'Sudeste',
      vvr: 82,
      mac: 75,
      endividamento: 38,
      nps: 72,
      mc: 20,
      enps: 62,
      conformidades: 85,
      bonus1: true,
      bonus2: false,
      bonus3: false,
    },
    {
      id: 'franquia_4',
      nome: 'Viva Curitiba',
      cluster: 'CALOURO',
      consultor: 'Pedro Costa',
      regiao: 'Sul',
      vvr: 78,
      mac: 70,
      endividamento: 42,
      nps: 68,
      mc: 18,
      enps: 58,
      conformidades: 80,
      bonus1: true,
      bonus2: false,
      bonus3: false,
    },
    {
      id: 'franquia_5',
      nome: 'Viva Porto Alegre',
      cluster: 'CALOURO',
      consultor: 'Carla Lima',
      regiao: 'Sul',
      vvr: 75,
      mac: 68,
      endividamento: 45,
      nps: 65,
      mc: 17,
      enps: 55,
      conformidades: 78,
      bonus1: false,
      bonus2: false,
      bonus3: false,
    },
    {
      id: 'franquia_6',
      nome: 'Viva Salvador',
      cluster: 'CALOURO_INICIANTE',
      consultor: 'Roberto Alves',
      regiao: 'Nordeste',
      vvr: 72,
      mac: 62,
      endividamento: 48,
      nps: 60,
      mc: 16,
      enps: 52,
      conformidades: 75,
      bonus1: false,
      bonus2: false,
      bonus3: false,
    },
    {
      id: 'franquia_7',
      nome: 'Viva Recife',
      cluster: 'CALOURO_INICIANTE',
      consultor: 'Fernanda Souza',
      regiao: 'Nordeste',
      vvr: 70,
      mac: 60,
      endividamento: 50,
      nps: 58,
      mc: 15,
      enps: 50,
      conformidades: 72,
      bonus1: false,
      bonus2: false,
      bonus3: false,
    },
    {
      id: 'franquia_8',
      nome: 'Viva Brasília',
      cluster: 'POS_GRADUADO',
      consultor: 'Lucas Mendes',
      regiao: 'Centro-Oeste',
      vvr: 90,
      mac: 82,
      endividamento: 30,
      nps: 80,
      mc: 23,
      enps: 70,
      conformidades: 92,
      bonus1: true,
      bonus2: true,
      bonus3: false,
    },
  ];
}
