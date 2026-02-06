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
 * Baseado na fórmula: >= 95: TOP PERFORMANCE, >= 85: PERFORMANDO, >= 75: EM CONSOLIDAÇÃO, >= 60: ATENÇÃO, < 60: UTI
 */
function mapSaude(valor: string): SaudeFranquia {
  const saude = valor?.toUpperCase()?.trim() || '';
  
  // Valores manuais específicos (UTI com classificação)
  if (saude.includes('RECUPERA') || saude === 'UTI RECUPERAÇÃO' || saude === 'UTI RECUPERACAO') return 'UTI_RECUPERACAO';
  if (saude.includes('REPASSE') || saude === 'UTI REPASSE') return 'UTI_REPASSE';
  
  // Valores calculados pela fórmula
  if (saude.includes('TOP') || saude === 'TOP PERFORMANCE') return 'TOP_PERFORMANCE';
  if (saude.includes('PERFORMANDO') || saude === 'PERFORMANDO') return 'PERFORMANDO';
  if (saude.includes('CONSOLIDA') || saude === 'EM CONSOLIDAÇÃO' || saude === 'EM CONSOLIDACAO') return 'EM_CONSOLIDACAO';
  if (saude.includes('ATEN') || saude === 'ATENÇÃO' || saude === 'ATENCAO') return 'ATENCAO';
  // UTI agora entra direto como UTI_RECUPERACAO - decisão manual apenas para UTI_REPASSE
  if (saude === 'UTI') return 'UTI_RECUPERACAO';
  
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
 * Agrupa por franquia para calcular evolução de saúde (saúde anterior + meses estagnado)
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
  
  // Processar todas as linhas em registros intermediários
  interface RegistroIntermediario {
    raw: string[];
    nome: string;
    dataRef: string;
    saude: SaudeFranquia;
  }
  
  const registrosPorFranquia: Record<string, RegistroIntermediario[]> = {};
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const getValue = (colName: string): string => {
      const idx = colIndex[colName];
      return idx !== undefined ? (row[idx] || '') : '';
    };
    
    const nomeUnidade = getValue('nm_unidade').trim();
    if (!nomeUnidade) continue;
    
    const dataRef = getValue('data').trim();
    const saudeStr = getValue('saude');
    
    if (!registrosPorFranquia[nomeUnidade]) {
      registrosPorFranquia[nomeUnidade] = [];
    }
    
    registrosPorFranquia[nomeUnidade].push({
      raw: row,
      nome: nomeUnidade,
      dataRef,
      saude: mapSaude(saudeStr),
    });
  }
  
  const franquias: Franquia[] = [];
  
  // Para cada franquia, ordenar por data e pegar o registro mais recente
  for (const [nomeUnidade, registros] of Object.entries(registrosPorFranquia)) {
    // Ordenar por data (mais recente primeiro)
    registros.sort((a, b) => {
      // Tentar comparar como string (YYYY-MM ou similar) 
      return b.dataRef.localeCompare(a.dataRef);
    });
    
    // O registro mais recente é o atual
    const registroAtual = registros[0];
    const row = registroAtual.raw;
    
    const getValue = (colName: string): string => {
      const idx = colIndex[colName];
      return idx !== undefined ? (row[idx] || '') : '';
    };
    
    const pontuacaoStr = getValue('pontuacao_pex').replace(',', '.').replace('%', '');
    const pontuacao = parseFloat(pontuacaoStr) || 0;
    
    // Processar latitude e longitude
    const latStr = getValue('latitude').replace(',', '.');
    const lngStr = getValue('longitude').replace(',', '.');
    const latitude = latStr ? parseFloat(latStr) : null;
    const longitude = lngStr ? parseFloat(lngStr) : null;
    
    // Processar postos avançados (lista separada por vírgula)
    const postoAvancadoStr = getValue('posto_avancado')?.trim() || '';
    const postosAvancados = postoAvancadoStr
      ? postoAvancadoStr.split(',').map(p => p.trim()).filter(p => p.length > 0)
      : [];
    
    // Calcular saúde anterior (do mês anterior, se existir)
    const saudeAtual = registroAtual.saude;
    let saudeAnterior: SaudeFranquia | undefined = undefined;
    let mesesNaSaudeAtual = 1;
    
    if (registros.length > 1) {
      // Segundo registro = mês anterior
      saudeAnterior = registros[1].saude;
      
      // Contar meses consecutivos na saúde atual (percorrer do mais recente para trás)
      for (let j = 1; j < registros.length; j++) {
        if (registros[j].saude === saudeAtual) {
          mesesNaSaudeAtual++;
        } else {
          break;
        }
      }
    }
    
    const franquia: Franquia = {
      id: `fr-${franquias.length + 1}`,
      chaveData: getValue('chave_data'),
      dataReferencia: getValue('data'),
      nome: nomeUnidade,
      status: mapStatus(getValue('status')),
      statusInativacao: mapStatusInativacao(getValue('status_inativacao')),
      dataInauguracao: getValue('dt_inauguracao'),
      maturidade: mapMaturidade(getValue('maturidade')),
      pontuacaoPex: pontuacao,
      saude: saudeAtual,
      flags: parseFlags(getValue('flags')),
      postosAvancados: postosAvancados,
      mercado: getValue('mercado')?.trim() || '',
      // Campos de localização
      cidade: getValue('cidade')?.trim() || '',
      estado: getValue('estado')?.trim() || '',
      latitude: !isNaN(latitude!) ? latitude : null,
      longitude: !isNaN(longitude!) ? longitude : null,
      // Campos de evolução de saúde
      saudeAnterior,
      mesesNaSaudeAtual,
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
    // Colunas: A-K (originais) + L (cidade) + M (mercado) + N (estado) + O (latitude) + P (longitude)
    const rows = await getExternalSheetData(
      SPREADSHEET_ID,
      `'${SHEET_NAME}'!A:P`, // Colunas A até P (incluindo mercado e localização)
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
