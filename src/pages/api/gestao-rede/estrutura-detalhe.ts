/**
 * API para buscar detalhamento estrutural de uma franquia
 *
 * Fonte: Google Sheets - "NOVA BASE ESTRUTURA ORGANIZACIONAL"
 *   - Aba "BASE SOCIETARIA MV"    -> sócios (cabeçalho na linha 2)
 *   - Aba "ESTRUTURA ATUAL"       -> estrutura ideal x atual (cabeçalhos se repetem por franquia)
 *
 * Query: ?franquia=<nm_unidade>
 *
 * Retorna detalhes usados para explicar as flags "Sócio Operador" e "Time Crítico"
 * no kanban de Análise de Flags Estruturais.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getExternalSheetData, CACHE_TTL } from '@/lib/sheets-client';

// IDs via env (com fallback para o ID fornecido pelo negócio)
const SPREADSHEET_ID =
  process.env.ESTRUTURA_ORGANIZACIONAL_SPREADSHEET_ID ||
  '1FowRchKoX1cbAru73mb22BTIO27Fz92zgrByMLXhvu4';

const SHEET_SOCIETARIA = 'BASE SOCIETARIA MV';
const SHEET_ESTRUTURA = 'ESTRUTURA ATUAL';

const CACHE_KEY_SOCIETARIA = 'estrutura-org:societaria';
const CACHE_KEY_ESTRUTURA = 'estrutura-org:estrutura-atual';

// Cargos do time (exclui sócios/líderes pois já computados na societária)
const CARGOS_EXCLUIR = new Set(['LIDER COMERCIAL', 'LIDER DE OPERAÇÕES', 'LIDER DE OPERACOES']);

// Tipos de função estratégica
type TipoSocio = 'vendas' | 'operacoes' | 'outro';

interface SocioItem {
  nome: string;
  cargo: string;
  funcaoEstrategica: string;
  tipo: TipoSocio;
}

interface CargoEstrutura {
  cargo: string;
  ideal: number;
  atual: number;
  gap: number; // ideal - atual (positivo = faltando)
}

interface EstruturaAtualDetalhe {
  tamanho: string;
  percentualSemSocios: number | null; // 0..1
  cargos: CargoEstrutura[];
  totalIdeal: number;
  totalAtual: number;
}

interface EstruturaDetalheResponse {
  success: boolean;
  franquia?: string;
  socios?: {
    vendas: SocioItem[];
    operacoes: SocioItem[];
    outros: SocioItem[];
    temVendas: boolean;
    temOperacoes: boolean;
  };
  estruturaAtual?: EstruturaAtualDetalhe | null;
  error?: string;
}

function normalizarNome(valor: string): string {
  return (valor || '').trim().toLowerCase();
}

function classificarFuncao(funcao: string): TipoSocio {
  const f = (funcao || '').toLowerCase();
  if (f.includes('vendas')) return 'vendas';
  if (f.includes('opera')) return 'operacoes';
  return 'outro';
}

function parseNumero(valor: any): number {
  if (valor === null || valor === undefined || valor === '') return 0;
  const str = String(valor).replace(',', '.').trim();
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
}

function parsePercentual(valor: any): number | null {
  if (valor === null || valor === undefined || valor === '') return null;
  const str = String(valor).replace('%', '').replace(',', '.').trim();
  if (!str) return null;
  const n = parseFloat(str);
  if (!Number.isFinite(n)) return null;
  // Se vier como "33,33%" -> 33.33, convertemos para 0.3333
  return n > 1 ? n / 100 : n;
}

async function buscarSocios(nomeFranquia: string) {
  // A:G contém nm_unidade, id, nome, datacriacao, dataalteracao, cargo, funcao_estrategica
  const rows = await getExternalSheetData(
    SPREADSHEET_ID,
    `${SHEET_SOCIETARIA}!A2:G`,
    CACHE_KEY_SOCIETARIA,
    CACHE_TTL.PONTUACAO_OFICIAL
  );

  // Primeira linha (índice 0) é o cabeçalho (linha 2 da planilha)
  const dados = rows.slice(1);
  const alvo = normalizarNome(nomeFranquia);

  const itens: SocioItem[] = dados
    .filter((row) => normalizarNome(row?.[0]) === alvo)
    .map((row) => {
      const funcao = String(row?.[6] || '').trim();
      return {
        nome: String(row?.[2] || '').trim(),
        cargo: String(row?.[5] || '').trim(),
        funcaoEstrategica: funcao,
        tipo: classificarFuncao(funcao),
      } as SocioItem;
    })
    .filter((s) => s.nome);

  const vendas = itens.filter((s) => s.tipo === 'vendas');
  const operacoes = itens.filter((s) => s.tipo === 'operacoes');
  const outros = itens.filter((s) => s.tipo === 'outro');

  return {
    vendas,
    operacoes,
    outros,
    temVendas: vendas.length > 0,
    temOperacoes: operacoes.length > 0,
  };
}

async function buscarEstruturaAtual(nomeFranquia: string): Promise<EstruturaAtualDetalhe | null> {
  // A:H -> UNIDADE, TAMANHO, CARGOS, ESTRUTURA IDEAL, ESTRUTURA ATUAL, CORREÇÃO, (col G), %_sem_socios
  const rows = await getExternalSheetData(
    SPREADSHEET_ID,
    `${SHEET_ESTRUTURA}!A1:H`,
    CACHE_KEY_ESTRUTURA,
    CACHE_TTL.PONTUACAO_OFICIAL
  );

  const alvo = normalizarNome(nomeFranquia);

  // Filtra linhas da franquia, ignorando cabeçalhos que se repetem
  const linhas = rows.filter((row) => {
    const unidade = normalizarNome(row?.[0]);
    if (!unidade) return false;
    if (unidade === 'unidade') return false; // cabeçalho
    return unidade === alvo;
  });

  if (linhas.length === 0) return null;

  const tamanho = String(linhas[0]?.[1] || '').trim();
  const percentualSemSocios = parsePercentual(linhas[0]?.[7]);

  const cargos: CargoEstrutura[] = linhas
    .map((row) => {
      const cargo = String(row?.[2] || '').trim();
      return {
        cargo,
        ideal: parseNumero(row?.[3]),
        atual: parseNumero(row?.[4]),
      };
    })
    .filter((c) => c.cargo && !CARGOS_EXCLUIR.has(c.cargo.toUpperCase()))
    .map((c) => ({ ...c, gap: c.ideal - c.atual }));

  const totalIdeal = cargos.reduce((acc, c) => acc + c.ideal, 0);
  const totalAtual = cargos.reduce((acc, c) => acc + c.atual, 0);

  return {
    tamanho,
    percentualSemSocios,
    cargos,
    totalIdeal,
    totalAtual,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EstruturaDetalheResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const franquia = String(req.query.franquia || '').trim();
  if (!franquia) {
    return res.status(400).json({ success: false, error: 'Parâmetro "franquia" é obrigatório' });
  }

  if (!SPREADSHEET_ID) {
    return res
      .status(500)
      .json({ success: false, error: 'ESTRUTURA_ORGANIZACIONAL_SPREADSHEET_ID não configurado' });
  }

  try {
    const [socios, estruturaAtual] = await Promise.all([
      buscarSocios(franquia),
      buscarEstruturaAtual(franquia),
    ]);

    return res.status(200).json({
      success: true,
      franquia,
      socios,
      estruturaAtual,
    });
  } catch (error) {
    console.error('[estrutura-detalhe] Erro:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar detalhamento estrutural',
    });
  }
}
