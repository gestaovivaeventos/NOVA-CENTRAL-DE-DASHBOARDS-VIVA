/**
 * API para buscar dados de Gestão da Rede
 * Fonte: Google Sheets - Aba BASE GESTAO REDE
 * Colunas: chave_data, data, nm_unidade, status, status_inativacao, dt_inauguracao, maturidade, pontuacao_pex, saude, flags, posto_avancado
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData, CACHE_TTL } from '@/lib/sheets-client';
import { 
  Franquia, 
  GestaoRedeApiResponse,
  StatusFranquia,
  StatusInativacao,
  MaturidadeFranquia,
  SaudeFranquia,
  FlagsEstruturais
} from '@/modules/gestao-rede/types';

// Planilha específica de Gestão Rede - via variáveis de ambiente
const SPREADSHEET_ID = process.env.GESTAO_REDE_SPREADSHEET_ID || '';
const SHEET_NAME = process.env.GESTAO_REDE_SHEET_NAME || 'BASE GESTAO REDE';
const CACHE_KEY = 'gestao-rede:data';

/**
 * Mapeia o valor de saúde da planilha para o tipo
 * Baseado na fórmula: >= 95: TOP PERFORMANCE, >= 85: PERFORMANDO, >= 75: EM EVOLUÇÃO, >= 60: ATENÇÃO, < 60: UTI
 */
function mapSaude(valor: string): SaudeFranquia {
  const saude = valor?.toUpperCase()?.trim() || '';
  
  // Valores manuais específicos (UTI com classificação)
  if (saude.includes('RECUPERA') || saude === 'UTI RECUPERAÇÃO' || saude === 'UTI RECUPERACAO') return 'UTI_RECUPERACAO';
  if (saude.includes('REPASSE') || saude === 'UTI REPASSE') return 'UTI_REPASSE';
  
  // Valores calculados pela fórmula
  if (saude.includes('TOP') || saude === 'TOP PERFORMANCE') return 'TOP_PERFORMANCE';
  if (saude.includes('PERFORMANDO') || saude === 'PERFORMANDO') return 'PERFORMANDO';
  if (saude.includes('EVOLU') || saude === 'EM EVOLUÇÃO' || saude === 'EM EVOLUCAO') return 'EM_EVOLUCAO';
  if (saude.includes('ATEN') || saude === 'ATENÇÃO' || saude === 'ATENCAO') return 'ATENCAO';
  if (saude === 'UTI') return 'UTI';
  
  return 'SEM_AVALIACAO';
}

/**
 * Mapeia o valor de maturidade da planilha para o tipo
 */
function mapMaturidade(valor: string): MaturidadeFranquia {
  const maturidade = valor?.toUpperCase()?.trim() || '';
  
  if (maturidade.includes('IMPLANTA')) return 'IMPLANTACAO';
  if (maturidade.includes('1') && maturidade.includes('ANO')) return '1º ANO OP.';
  if (maturidade.includes('2') && maturidade.includes('ANO')) return '2º ANO OP.';
  if (maturidade.includes('3') && maturidade.includes('ANO')) return '3º ANO OP.';
  if (maturidade.includes('MADURA')) return 'MADURA';
  
  return 'IMPLANTACAO';
}

/**
 * Mapeia o valor de status da planilha para o tipo
 */
function mapStatus(valor: string): StatusFranquia {
  const status = valor?.toUpperCase()?.trim() || '';
  return status === 'ATIVA' ? 'ATIVA' : 'INATIVA';
}

/**
 * Mapeia o valor de status de inativação
 */
function mapStatusInativacao(valor: string): StatusInativacao {
  const status = valor?.toUpperCase()?.trim() || '';
  
  if (status.includes('OPERA')) return 'ENCERRADA_OPERACAO';
  if (status.includes('IMPLANTA')) return 'ENCERRADA_IMPLANTACAO';
  
  return null;
}

/**
 * Parseia as flags da planilha
 * Formato esperado: "SÓCIO OPERADOR, TIME CRÍTICO, GOVERNANÇA, NECESSIDADE CAPITAL DE GIRO" (separado por vírgula)
 */
function parseFlags(valor: string): FlagsEstruturais {
  const flagsStr = valor?.toUpperCase()?.trim() || '';
  
  return {
    socioOperador: flagsStr.includes('SOCIO') || flagsStr.includes('SÓCIO'),
    timeCritico: flagsStr.includes('TIME') || flagsStr.includes('CRITICO') || flagsStr.includes('CRÍTICO'),
    governanca: flagsStr.includes('GOVERNA'),
    necessidadeCapitalGiro: flagsStr.includes('CAPITAL') || flagsStr.includes('GIRO'),
  };
}

/**
 * Converte dados brutos da planilha para o formato da aplicação
 */
function processarDados(rows: string[][]): Franquia[] {
  if (!rows || rows.length < 2) return [];
  
  // Primeira linha é o cabeçalho
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
  
  // Mapear índices das colunas
  const colIndex: Record<string, number> = {};
  headers.forEach((header, index) => {
    colIndex[header] = index;
  });
  
  const franquias: Franquia[] = [];
  
  // Processar cada linha de dados
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const getValue = (colName: string): string => {
      const idx = colIndex[colName];
      return idx !== undefined ? (row[idx] || '') : '';
    };
    
    const nomeUnidade = getValue('nm_unidade').trim();
    if (!nomeUnidade) continue;
    
    const pontuacaoStr = getValue('pontuacao_pex').replace(',', '.').replace('%', '');
    const pontuacao = parseFloat(pontuacaoStr) || 0;
    
    const franquia: Franquia = {
      id: `fr-${i}`,
      chaveData: getValue('chave_data'),
      dataReferencia: getValue('data'),
      nome: nomeUnidade,
      status: mapStatus(getValue('status')),
      statusInativacao: mapStatusInativacao(getValue('status_inativacao')),
      dataInauguracao: getValue('dt_inauguracao'),
      maturidade: mapMaturidade(getValue('maturidade')),
      pontuacaoPex: pontuacao,
      saude: mapSaude(getValue('saude')),
      flags: parseFlags(getValue('flags')),
      postoAvancado: getValue('posto_avancado')?.toUpperCase()?.trim() === 'SIM',
    };
    
    franquias.push(franquia);
  }
  
  return franquias;
}

/**
 * Handler da API
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GestaoRedeApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
    });
  }

  try {
    console.log('[API gestao-rede/data] Buscando dados da planilha:', SPREADSHEET_ID);
    console.log('[API gestao-rede/data] Aba:', SHEET_NAME);
    
    // Buscar dados da planilha externa com cache
    const rows = await getExternalSheetData(
      SPREADSHEET_ID,
      `'${SHEET_NAME}'!A:K`, // Colunas A até K (com aspas simples para nomes com espaços)
      CACHE_KEY,
      CACHE_TTL.PONTUACAO_OFICIAL
    );
    
    console.log('[API gestao-rede/data] Linhas recebidas:', rows?.length || 0);
    if (rows && rows.length > 0) {
      console.log('[API gestao-rede/data] Cabeçalhos:', rows[0]);
      if (rows.length > 1) {
        console.log('[API gestao-rede/data] Primeira linha de dados:', rows[1]);
      }
    }
    
    if (!rows || rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'Nenhum dado encontrado na planilha',
      });
    }
    
    // Processar dados
    const franquias = processarDados(rows);
    
    // Obter data de referência (da primeira linha de dados)
    const dataReferencia = franquias.length > 0 ? franquias[0].dataReferencia : '';
    
    return res.status(200).json({
      success: true,
      data: franquias,
      dataReferencia,
    });
    
  } catch (error) {
    console.error('[API gestao-rede/data] Erro:', error);
    
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro interno do servidor',
    });
  }
}
