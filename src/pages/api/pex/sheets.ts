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
      vvr_12_meses: parseFloat(getColumnValue(headers, values, 'vvr_12_meses')) || 0,
      vvr_carteira: parseFloat(getColumnValue(headers, values, 'vvr_carteira')) || 0,
      indice_endividamento: parseFloat(getColumnValue(headers, values, 'indice_endividamento')) || 0,
      nps_geral: parseFloat(getColumnValue(headers, values, 'nps_geral')) || 0,
      indice_margem_entrega: parseFloat(getColumnValue(headers, values, 'indice_margem_entrega')) || 0,
      enps_rede: parseFloat(getColumnValue(headers, values, 'enps_rede')) || 0,
      conformidades: parseFloat(getColumnValue(headers, values, 'conformidades')) || 0,
      reclame_aqui: parseFloat(getColumnValue(headers, values, 'reclame_aqui')) || 0,
      colaboradores_mais_1_ano: parseFloat(getColumnValue(headers, values, 'colaboradores_mais_1_ano')) || 0,
      estrutura_organizacional: parseFloat(getColumnValue(headers, values, 'estrutura_organizacional')) || 0,
      churn: parseFloat(getColumnValue(headers, values, 'churn')) || 0,
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
      vvr_12_meses: 92,
      vvr_carteira: 88,
      indice_endividamento: 28,
      nps_geral: 82,
      indice_margem_entrega: 24,
      enps_rede: 72,
      conformidades: 95,
      reclame_aqui: 90,
      colaboradores_mais_1_ano: 75,
      estrutura_organizacional: 85,
      churn: 4,
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
      vvr_12_meses: 85,
      vvr_carteira: 82,
      indice_endividamento: 35,
      nps_geral: 75,
      indice_margem_entrega: 21,
      enps_rede: 65,
      conformidades: 88,
      reclame_aqui: 85,
      colaboradores_mais_1_ano: 68,
      estrutura_organizacional: 80,
      churn: 6,
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
      vvr_12_meses: 82,
      vvr_carteira: 78,
      indice_endividamento: 38,
      nps_geral: 72,
      indice_margem_entrega: 20,
      enps_rede: 62,
      conformidades: 85,
      reclame_aqui: 82,
      colaboradores_mais_1_ano: 65,
      estrutura_organizacional: 78,
      churn: 7,
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
      vvr_12_meses: 78,
      vvr_carteira: 75,
      indice_endividamento: 42,
      nps_geral: 68,
      indice_margem_entrega: 18,
      enps_rede: 58,
      conformidades: 80,
      reclame_aqui: 78,
      colaboradores_mais_1_ano: 55,
      estrutura_organizacional: 72,
      churn: 9,
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
      vvr_12_meses: 75,
      vvr_carteira: 72,
      indice_endividamento: 45,
      nps_geral: 65,
      indice_margem_entrega: 17,
      enps_rede: 55,
      conformidades: 78,
      reclame_aqui: 75,
      colaboradores_mais_1_ano: 50,
      estrutura_organizacional: 70,
      churn: 10,
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
      vvr_12_meses: 72,
      vvr_carteira: 68,
      indice_endividamento: 48,
      nps_geral: 60,
      indice_margem_entrega: 16,
      enps_rede: 52,
      conformidades: 75,
      reclame_aqui: 70,
      colaboradores_mais_1_ano: 45,
      estrutura_organizacional: 68,
      churn: 12,
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
      vvr_12_meses: 70,
      vvr_carteira: 65,
      indice_endividamento: 50,
      nps_geral: 58,
      indice_margem_entrega: 15,
      enps_rede: 50,
      conformidades: 72,
      reclame_aqui: 68,
      colaboradores_mais_1_ano: 42,
      estrutura_organizacional: 65,
      churn: 13,
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
      vvr_12_meses: 90,
      vvr_carteira: 86,
      indice_endividamento: 30,
      nps_geral: 80,
      indice_margem_entrega: 23,
      enps_rede: 70,
      conformidades: 92,
      reclame_aqui: 88,
      colaboradores_mais_1_ano: 72,
      estrutura_organizacional: 82,
      churn: 5,
      bonus1: true,
      bonus2: true,
      bonus3: false,
    },
  ];
}
