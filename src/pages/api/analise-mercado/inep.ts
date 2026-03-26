/**
 * API Route — Análise de Mercado / INEP
 * Lê dados do Google Sheets (5 planilhas regionais) via Service Account
 * Roteamento regional: UF → região → planilha correspondente
 *
 * Query params:
 *   uf       — filtro por UF (ex: "MG") → carrega apenas planilha da região
 *   ano      — filtro por ano (ex: 2024)
 *   rede     — 1 = pública, 2 = privada (opcional)
 *   municipio — nome do município (opcional)
 *   ies      — código da IES (opcional)
 *
 * Se uf não for informado → carrega as 5 regiões em paralelo (visão nacional)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import cache from '@/lib/cache';

// ─── Planilhas regionais por ano (IDs lidos de variáveis de ambiente) ─────
const REGIOES = ['SUL', 'SUDESTE', 'NORTE', 'CENTRO_OESTE', 'NORDESTE'];
const INEP_ANOS = [2022, 2023, 2024]; // anos configurados

function buildSheetsPorAno(): Record<number, Record<string, string>> {
  const result: Record<number, Record<string, string>> = {};
  for (const ano of INEP_ANOS) {
    const regiaoMap: Record<string, string> = {};
    for (const regiao of REGIOES) {
      const envKey = `INEP_${ano}_${regiao}`;
      const id = process.env[envKey];
      if (id) regiaoMap[regiao] = id;
    }
    if (Object.keys(regiaoMap).length > 0) {
      result[ano] = regiaoMap;
    }
  }
  return result;
}

const SHEETS_POR_ANO = buildSheetsPorAno();
const ANOS_DISPONIVEIS = Object.keys(SHEETS_POR_ANO).map(Number).sort();

// ─── Mapeamento UF → Região ───────────────────────────────────────
const UF_PARA_REGIAO: Record<string, string> = {
  PR: 'SUL', SC: 'SUL', RS: 'SUL',
  SP: 'SUDESTE', RJ: 'SUDESTE', MG: 'SUDESTE', ES: 'SUDESTE',
  AM: 'NORTE', PA: 'NORTE', AC: 'NORTE', RO: 'NORTE', RR: 'NORTE', AP: 'NORTE', TO: 'NORTE',
  MT: 'CENTRO_OESTE', MS: 'CENTRO_OESTE', GO: 'CENTRO_OESTE', DF: 'CENTRO_OESTE',
  BA: 'NORDESTE', SE: 'NORDESTE', AL: 'NORDESTE', PE: 'NORDESTE',
  PB: 'NORDESTE', RN: 'NORDESTE', CE: 'NORDESTE', PI: 'NORDESTE', MA: 'NORDESTE',
};

// ─── Cache TTL (dados censitários estáticos — 24 horas no server) ─
const INEP_CACHE_TTL = 24 * 60 * 60 * 1000;

// ─── Auth Google Sheets ───────────────────────────────────────────
let authClient: InstanceType<typeof google.auth.JWT> | null = null;

function getAuth() {
  if (authClient) return authClient;

  const base64 = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) throw new Error('GOOGLE_SERVICE_ACCOUNT_BASE64 não configurado');

  const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  authClient = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return authClient;
}

// ─── Tipo de cada linha bruta da planilha ─────────────────────────
export interface InepRow {
  NU_ANO_CENSO: number;
  CO_IES: number;
  NO_IES: string;
  SG_IES: string;
  TP_REDE: number;           // 1 = Pública, 2 = Privada
  SG_UF: string;
  NO_MUNICIPIO: string;
  CO_CURSO: number;
  NO_CURSO: string;
  NO_CINE_AREA_GERAL: string;
  TP_MODALIDADE_ENSINO: number; // 1 = Presencial, 2 = EAD
  QT_MAT: number;
  QT_ING: number;
  QT_CONC: number;
  QT_MAT_FEM: number;
  QT_MAT_MASC: number;
  QT_ING_FEM: number;
  QT_ING_MASC: number;
  QT_CONC_FEM: number;
  QT_CONC_MASC: number;
}

// ─── Alias de colunas (header real → campo interno) ───────────────
const COLUMN_ALIASES: Record<string, string[]> = {
  NU_ANO_CENSO:        ['NU_ANO_CENSO'],
  CO_IES:              ['CO_IES'],
  NO_IES:              ['NO_IES'],
  SG_IES:              ['SG_IES'],
  TP_REDE:             ['TP_REDE'],
  SG_UF:               ['SG_UF', 'SG_UF_IES', 'UF'],
  NO_MUNICIPIO:        ['NO_MUNICIPIO', 'NO_MUNICIPIO_IES', 'MUNICIPIO'],
  CO_CURSO:            ['CO_CURSO'],
  NO_CURSO:            ['NO_CURSO'],
  NO_CINE_AREA_GERAL:  ['NO_CINE_AREA_GERAL', 'NO_AREA'],
  TP_MODALIDADE_ENSINO:['TP_MODALIDADE_ENSINO', 'TP_MODALIDADE'],
  QT_MAT:              ['QT_MAT'],
  QT_ING:              ['QT_ING'],
  QT_CONC:             ['QT_CONC'],
  QT_MAT_FEM:          ['QT_MAT_FEM'],
  QT_MAT_MASC:         ['QT_MAT_MASC'],
  QT_ING_FEM:          ['QT_ING_FEM'],
  QT_ING_MASC:         ['QT_ING_MASC'],
  QT_CONC_FEM:         ['QT_CONC_FEM'],
  QT_CONC_MASC:        ['QT_CONC_MASC'],
};

// ─── Leitura de uma planilha regional por ano ─────────────────────
async function fetchRegiao(regiao: string, ano: number): Promise<InepRow[]> {
  const cacheKey = `inep_${ano}_${regiao}`;
  const cached = cache.get<InepRow[]>(cacheKey);
  if (cached) return cached;

  const spreadsheetId = SHEETS_POR_ANO[ano]?.[regiao];
  if (!spreadsheetId) return [];

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Ler primeira aba inteira (header + dados)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:T', // 20 colunas
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) return [];

  // Normalizar header → índice (uppercase para match case-insensitive)
  const header = rows[0].map((h: string) => String(h).trim().toUpperCase());
  console.log(`[INEP] Header ${regiao}:`, header.join(', '));

  // Resolver alias: para cada campo interno, encontrar a coluna no header
  const colMap: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    let found = -1;
    for (const alias of aliases) {
      const idx = header.indexOf(alias);
      if (idx >= 0) { found = idx; break; }
    }
    colMap[field] = found;
  }

  const numFields = [
    'NU_ANO_CENSO', 'CO_IES', 'TP_REDE',
    'CO_CURSO', 'TP_MODALIDADE_ENSINO',
    'QT_MAT', 'QT_ING', 'QT_CONC',
    'QT_MAT_FEM', 'QT_MAT_MASC',
    'QT_ING_FEM', 'QT_ING_MASC',
    'QT_CONC_FEM', 'QT_CONC_MASC',
  ];

  const strFields = [
    'NO_IES', 'SG_IES', 'SG_UF', 'NO_MUNICIPIO',
    'NO_CURSO', 'NO_CINE_AREA_GERAL',
  ];

  const data: InepRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, unknown> = {};

    for (const f of numFields) {
      const idx = colMap[f];
      obj[f] = idx >= 0 && row[idx] != null ? Number(row[idx]) || 0 : 0;
    }
    for (const f of strFields) {
      const idx = colMap[f];
      obj[f] = idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '';
    }

    data.push(obj as unknown as InepRow);
  }

  console.log(`[INEP] ${ano}/${regiao}: ${data.length} linhas carregadas`);
  cache.set(cacheKey, data, INEP_CACHE_TTL);
  return data;
}

// ─── Determinar regiões a consultar ───────────────────────────────
function regioesParaConsultar(uf: string | null): string[] {
  if (uf) {
    const regiao = UF_PARA_REGIAO[uf.toUpperCase()];
    return regiao ? [regiao] : [];
  }
  return REGIOES;
}

// ─── Carregar e filtrar linhas para um ano ────────────────────────
async function loadRows(
  ano: number,
  regioes: string[],
  filters: { uf?: string | null; rede?: number | null; municipio?: string | null; municipios?: string[] | null; ies?: number | null; curso?: string | null; modalidade?: number | null },
): Promise<InepRow[]> {
  const results = await Promise.allSettled(regioes.map(r => fetchRegiao(r, ano)));
  let rows: InepRow[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') rows = rows.concat(r.value);
  }
  if (filters.uf) rows = rows.filter(r => r.SG_UF === filters.uf);
  if (filters.rede) rows = rows.filter(r => r.TP_REDE === filters.rede);
  // Filtro múltiplo de municípios (franquia) tem prioridade sobre município único
  if (filters.municipios && filters.municipios.length > 0) {
    const munSet = new Set(filters.municipios.map(m => m.toUpperCase()));
    rows = rows.filter(r => munSet.has(r.NO_MUNICIPIO.toUpperCase()));
  } else if (filters.municipio) {
    rows = rows.filter(r => r.NO_MUNICIPIO.toUpperCase() === filters.municipio!.toUpperCase());
  }
  if (filters.ies) rows = rows.filter(r => r.CO_IES === filters.ies);
  if (filters.curso) rows = rows.filter(r => r.NO_CURSO.toUpperCase() === filters.curso!.toUpperCase());
  if (filters.modalidade) rows = rows.filter(r => r.TP_MODALIDADE_ENSINO === filters.modalidade);
  return rows;
}

// ─── Helpers de agregação ─────────────────────────────────────────
interface Breakdown {
  presencial: number; ead: number;
  publica: number; privada: number;
  feminino: number; masculino: number;
  publicaPresencial: number; publicaEad: number;
  privadaPresencial: number; privadaEad: number;
}

function mkBd(): Breakdown {
  return { presencial: 0, ead: 0, publica: 0, privada: 0, feminino: 0, masculino: 0, publicaPresencial: 0, publicaEad: 0, privadaPresencial: 0, privadaEad: 0 };
}

function addBd(bd: Breakdown, r: InepRow, val: number, fem: number, masc: number) {
  const isPub = r.TP_REDE === 1;
  const isPres = r.TP_MODALIDADE_ENSINO === 1;
  if (isPres) bd.presencial += val; else bd.ead += val;
  if (isPub) bd.publica += val; else bd.privada += val;
  bd.feminino += fem; bd.masculino += masc;
  if (isPub && isPres) bd.publicaPresencial += val;
  else if (isPub) bd.publicaEad += val;
  else if (isPres) bd.privadaPresencial += val;
  else bd.privadaEad += val;
}

function vari(a: number, b: number): number {
  return b === 0 ? 0 : Number((((a - b) / b) * 100).toFixed(1));
}
function tend(v: number): string {
  return v > 0.5 ? 'up' : v < -0.5 ? 'down' : 'stable';
}

// ─── Nomes UF ─────────────────────────────────────────────────────
const UF_NOMES: Record<string, string> = {
  AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',
  DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',
  MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',
  PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',RJ:'Rio de Janeiro',
  RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',RO:'Rondônia',RR:'Roraima',
  SC:'Santa Catarina',SP:'São Paulo',SE:'Sergipe',TO:'Tocantins',
};

// ─── action=dashboard — Só ano selecionado + anterior em PARALELO ─
async function handleDashboard(req: NextApiRequest, res: NextApiResponse) {
  const { uf, ano, rede, municipio, municipios, ies, curso, modalidade } = req.query;
  const ufStr = uf ? String(uf).toUpperCase() : null;
  const anoNum = ano ? Number(ano) : 2024;
  const redeNum = rede ? Number(rede) : null;
  const municipioStr = municipio ? String(municipio) : null;
  const municipiosArr = municipios ? String(municipios).split(',').map(m => m.trim()).filter(Boolean) : null;
  const iesNum = ies ? Number(ies) : null;
  const cursoStr = curso ? String(curso) : null;
  const modalidadeNum = modalidade ? Number(modalidade) : null;

  // Se municipios (franquia) especificado, precisamos buscar todas as regiões necessárias
  const regioes = municipiosArr && municipiosArr.length > 0
    ? REGIOES  // busca todas as regiões pois municípios podem estar em várias
    : regioesParaConsultar(ufStr);
  const filters = { uf: ufStr, rede: redeNum, municipio: municipioStr, municipios: municipiosArr, ies: iesNum, curso: cursoStr, modalidade: modalidadeNum };

  // Carrega ano selecionado + ano anterior em paralelo para calcular variação
  const anoAnt = anoNum - 1;
  const temAnoAnterior = ANOS_DISPONIVEIS.includes(anoAnt);
  const [rowsAtual, rowsAnterior] = await Promise.all([
    loadRows(anoNum, regioes, filters),
    temAnoAnterior ? loadRows(anoAnt, regioes, filters) : Promise.resolve([]),
  ]);

  // ── 1. Indicadores (cards KPI) — variação calculada server-side (atual/anterior - 1) ──
  let mat = 0, conc = 0, ing = 0;
  const iesSet = new Set<number>(), cursoSet = new Set<number>();
  for (const r of rowsAtual) { mat += r.QT_MAT; conc += r.QT_CONC; ing += r.QT_ING; iesSet.add(r.CO_IES); cursoSet.add(r.CO_CURSO); }

  // Agregar ano anterior
  let matAnt = 0, concAnt = 0, ingAnt = 0;
  const iesSetAnt = new Set<number>(), cursoSetAnt = new Set<number>();
  for (const r of rowsAnterior) { matAnt += r.QT_MAT; concAnt += r.QT_CONC; ingAnt += r.QT_ING; iesSetAnt.add(r.CO_IES); cursoSetAnt.add(r.CO_CURSO); }

  // Variação: (atual / anterior) - 1, em percentual
  const varCalc = (a: number, b: number) => b === 0 ? 0 : Number((((a / b) - 1) * 100).toFixed(1));

  const matVar = temAnoAnterior ? varCalc(mat, matAnt) : 0;
  const ingVar = temAnoAnterior ? varCalc(ing, ingAnt) : 0;
  const concVar = temAnoAnterior ? varCalc(conc, concAnt) : 0;
  const iesVar = temAnoAnterior ? varCalc(iesSet.size, iesSetAnt.size) : 0;
  const cursosVar = temAnoAnterior ? varCalc(cursoSet.size, cursoSetAnt.size) : 0;

  const indicadores = mat === 0 && conc === 0 && ing === 0 ? [] : [
    { id: 'mat', titulo: 'Matrículas Ativas', valor: mat, variacao: matVar, tendencia: tend(matVar), cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
    { id: 'ing', titulo: 'Ingressantes/Ano', valor: ing, variacao: ingVar, tendencia: tend(ingVar), cor: '#8B5CF6', subtitulo: 'Novos alunos' },
    { id: 'conc', titulo: 'Concluintes/Ano', valor: conc, variacao: concVar, tendencia: tend(concVar), cor: '#10B981', subtitulo: 'Potenciais Formandos' },
    { id: 'ies', titulo: 'Ensino Superior', valor: iesSet.size, variacao: iesVar, tendencia: tend(iesVar), cor: '#F59E0B', subtitulo: 'Instituições Ativas' },
    { id: 'cursos', titulo: 'Cursos Ativos', valor: cursoSet.size, variacao: cursosVar, tendencia: tend(cursosVar), cor: '#EC4899', subtitulo: 'Graduação + Tecnólogo' },
  ];

  // ── 2. Evolução — apenas o ano atual (o gráfico completo vem de action=evolucao) ──
  const evolucao: unknown[] = [];
  if (rowsAtual.length > 0) {
    const bdMat = mkBd(), bdConc = mkBd(), bdIng = mkBd();
    let totalMat = 0, totalConc = 0, totalIng = 0;
    for (const r of rowsAtual) {
      totalMat += r.QT_MAT; totalConc += r.QT_CONC; totalIng += r.QT_ING;
      addBd(bdMat, r, r.QT_MAT, r.QT_MAT_FEM, r.QT_MAT_MASC);
      addBd(bdConc, r, r.QT_CONC, r.QT_CONC_FEM, r.QT_CONC_MASC);
      addBd(bdIng, r, r.QT_ING, r.QT_ING_FEM, r.QT_ING_MASC);
    }
    evolucao.push({
      ano: anoNum, matriculas: totalMat, concluintes: totalConc, ingressantes: totalIng,
      presencial: bdMat.presencial, ead: bdMat.ead, publica: bdMat.publica, privada: bdMat.privada,
      genero: { feminino: bdMat.feminino, masculino: bdMat.masculino },
      porMetrica: { matriculas: bdMat, concluintes: bdConc, ingressantes: bdIng },
    });
  }

  // ── 3. Distribuição por estado ──
  const porUf = new Map<string, { mat: number; conc: number; ies: Set<number> }>();
  for (const r of rowsAtual) {
    if (!r.SG_UF) continue;
    let e = porUf.get(r.SG_UF);
    if (!e) { e = { mat: 0, conc: 0, ies: new Set() }; porUf.set(r.SG_UF, e); }
    e.mat += r.QT_MAT; e.conc += r.QT_CONC; e.ies.add(r.CO_IES);
  }
  const totalMatEst = Array.from(porUf.values()).reduce((s, e) => s + e.mat, 0);
  const estados = Array.from(porUf.entries()).map(([u, e]) => ({
    uf: u, nome: UF_NOMES[u] || u, matriculas: e.mat, concluintes: e.conc, turmas: 0,
    instituicoes: e.ies.size, percentual: totalMatEst > 0 ? Number(((e.mat / totalMatEst) * 100).toFixed(1)) : 0,
  }));

  // ── 4. Cidades (se UF filtrado ou franquia com múltiplos municípios) ──
  const cidades: unknown[] = [];
  if (ufStr || (municipiosArr && municipiosArr.length > 0)) {
    const porMun = new Map<string, { mat: number; conc: number; ing: number; uf: string; ies: Set<number> }>();
    for (const r of rowsAtual) {
      if (!r.NO_MUNICIPIO) continue;
      let e = porMun.get(r.NO_MUNICIPIO);
      if (!e) { e = { mat: 0, conc: 0, ing: 0, uf: r.SG_UF, ies: new Set() }; porMun.set(r.NO_MUNICIPIO, e); }
      e.mat += r.QT_MAT; e.conc += r.QT_CONC; e.ing += r.QT_ING; e.ies.add(r.CO_IES);
    }
    for (const [mun, e] of porMun.entries()) {
      cidades.push({ nome: mun, uf: e.uf, lat: 0, lng: 0, matriculas: e.mat, concluintes: e.conc, ingressantes: e.ing, turmas: 0, instituicoes: e.ies.size });
    }
  }

  // ── 5. Ranking cursos ──
  const porCurso = new Map<string, { area: string; mat: number; conc: number; ing: number; ies: Set<number>; bdMat: Breakdown; bdConc: Breakdown; bdIng: Breakdown }>();
  for (const r of rowsAtual) {
    if (!r.NO_CURSO) continue;
    let e = porCurso.get(r.NO_CURSO);
    if (!e) { e = { area: r.NO_CINE_AREA_GERAL || '', mat: 0, conc: 0, ing: 0, ies: new Set(), bdMat: mkBd(), bdConc: mkBd(), bdIng: mkBd() }; porCurso.set(r.NO_CURSO, e); }
    e.mat += r.QT_MAT; e.conc += r.QT_CONC; e.ing += r.QT_ING; e.ies.add(r.CO_IES);
    addBd(e.bdMat, r, r.QT_MAT, r.QT_MAT_FEM, r.QT_MAT_MASC);
    addBd(e.bdConc, r, r.QT_CONC, r.QT_CONC_FEM, r.QT_CONC_MASC);
    addBd(e.bdIng, r, r.QT_ING, r.QT_ING_FEM, r.QT_ING_MASC);
  }
  const cursoEntries = Array.from(porCurso.entries()).sort((a, b) => b[1].mat - a[1].mat).slice(0, 500);
  const totalMatCur = cursoEntries.reduce((s, [, e]) => s + e.mat, 0);
  const cursosAgg = cursoEntries.map(([nome, e]) => ({
    nome, area: e.area, matriculas: e.mat, concluintes: e.conc, ingressantes: e.ing,
    turmas: 0, mediaPorTurma: 0, instituicoes: e.ies.size,
    percentual: totalMatCur > 0 ? Number(((e.mat / totalMatCur) * 100).toFixed(1)) : 0,
    presencial: e.bdMat.presencial, ead: e.bdMat.ead, publica: e.bdMat.publica, privada: e.bdMat.privada,
    publicaPresencial: e.bdMat.publicaPresencial, publicaEad: e.bdMat.publicaEad, privadaPresencial: e.bdMat.privadaPresencial, privadaEad: e.bdMat.privadaEad,
    publicaConc: e.bdConc.publica, privadaConc: e.bdConc.privada, publicaIng: e.bdIng.publica, privadaIng: e.bdIng.privada,
    publicaPresencialConc: e.bdConc.publicaPresencial, publicaEadConc: e.bdConc.publicaEad, privadaPresencialConc: e.bdConc.privadaPresencial, privadaEadConc: e.bdConc.privadaEad,
    publicaPresencialIng: e.bdIng.publicaPresencial, publicaEadIng: e.bdIng.publicaEad, privadaPresencialIng: e.bdIng.privadaPresencial, privadaEadIng: e.bdIng.privadaEad,
    genero: { feminino: e.bdMat.feminino, masculino: e.bdMat.masculino },
  }));

  // ── 6. Instituições ──
  const porIes = new Map<number, { nome: string; tipo: number; uf: string; cursos: Set<number>; mat: number; conc: number; ing: number }>();
  for (const r of rowsAtual) {
    let e = porIes.get(r.CO_IES);
    if (!e) { e = { nome: r.NO_IES, tipo: r.TP_REDE, uf: r.SG_UF, cursos: new Set(), mat: 0, conc: 0, ing: 0 }; porIes.set(r.CO_IES, e); }
    e.cursos.add(r.CO_CURSO); e.mat += r.QT_MAT; e.conc += r.QT_CONC; e.ing += r.QT_ING;
  }
  const instituicoes = Array.from(porIes.entries()).map(([cod, e]) => ({
    codIes: cod, nome: e.nome, tipo: e.tipo === 1 ? 'publica' : 'privada', modalidade: 'ambas',
    cursos: e.cursos.size, matriculas: e.mat, concluintes: e.conc, ingressantes: e.ing, turmas: 0, uf: e.uf,
  }));

  // ── 7. Áreas distintas ──
  const areasSet = new Set<string>();
  for (const r of rowsAtual) { if (r.NO_CINE_AREA_GERAL) areasSet.add(r.NO_CINE_AREA_GERAL); }
  const areas = Array.from(areasSet).sort();

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  return res.status(200).json({
    indicadores, evolucao, estados, cidades, cursos: cursosAgg, instituicoes, areas,
    anos: ANOS_DISPONIVEIS,
  });
}

// ─── action=evolucao — Lazy: todos os anos, apenas agregação temporal ─
async function handleEvolucao(req: NextApiRequest, res: NextApiResponse) {
  const { uf, rede, municipio, municipios, ies, curso, modalidade } = req.query;
  const ufStr = uf ? String(uf).toUpperCase() : null;
  const municipiosArr = municipios ? String(municipios).split(',').map(m => m.trim()).filter(Boolean) : null;
  const filters = {
    uf: ufStr,
    rede: rede ? Number(rede) : null,
    municipio: municipio ? String(municipio) : null,
    municipios: municipiosArr,
    ies: ies ? Number(ies) : null,
    curso: curso ? String(curso) : null,
    modalidade: modalidade ? Number(modalidade) : null,
  };
  const regioes = municipiosArr && municipiosArr.length > 0
    ? REGIOES
    : regioesParaConsultar(ufStr);

  const evolucao: unknown[] = [];
  // Sequencial para não estourar memória — cada ano já pode estar em cache
  for (const a of ANOS_DISPONIVEIS) {
    const rows = await loadRows(a, regioes, filters);
    if (rows.length === 0) continue;
    const bdMat = mkBd(), bdConc = mkBd(), bdIng = mkBd();
    let totalMat = 0, totalConc = 0, totalIng = 0;
    const iesSet = new Set<number>(), cursoSet = new Set<number>();
    for (const r of rows) {
      totalMat += r.QT_MAT; totalConc += r.QT_CONC; totalIng += r.QT_ING;
      iesSet.add(r.CO_IES); cursoSet.add(r.CO_CURSO);
      addBd(bdMat, r, r.QT_MAT, r.QT_MAT_FEM, r.QT_MAT_MASC);
      addBd(bdConc, r, r.QT_CONC, r.QT_CONC_FEM, r.QT_CONC_MASC);
      addBd(bdIng, r, r.QT_ING, r.QT_ING_FEM, r.QT_ING_MASC);
    }
    evolucao.push({
      ano: a, matriculas: totalMat, concluintes: totalConc, ingressantes: totalIng,
      ies: iesSet.size, cursos: cursoSet.size,
      presencial: bdMat.presencial, ead: bdMat.ead, publica: bdMat.publica, privada: bdMat.privada,
      genero: { feminino: bdMat.feminino, masculino: bdMat.masculino },
      porMetrica: { matriculas: bdMat, concluintes: bdConc, ingressantes: bdIng },
    });
  }

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  return res.status(200).json({ evolucao });
}

// ─── Handler ──────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const action = req.query.action ? String(req.query.action) : null;

    // Endpoint leve: anos disponíveis
    if (action === 'anos') {
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
      return res.status(200).json({ anos: ANOS_DISPONIVEIS });
    }

    // Dashboard principal: só ano atual + anterior (rápido)
    if (action === 'dashboard') {
      return handleDashboard(req, res);
    }

    // Evolução histórica (lazy): todos os anos, chamado em segundo plano
    if (action === 'evolucao') {
      return handleEvolucao(req, res);
    }

    // Fallback raw rows (para uso específico, ex: cidades drill-down)
    const { uf, ano, rede, municipio, ies, curso, modalidade } = req.query;
    const ufStr = uf ? String(uf).toUpperCase() : null;
    const anoNum = ano ? Number(ano) : null;
    const filters = {
      uf: ufStr,
      rede: rede ? Number(rede) : null,
      municipio: municipio ? String(municipio) : null,
      ies: ies ? Number(ies) : null,
      curso: curso ? String(curso) : null,
      modalidade: modalidade ? Number(modalidade) : null,
    };

    if (!anoNum) {
      return res.status(400).json({ error: 'Parâmetro "ano" obrigatório para raw rows. Use action=dashboard para dados completos.' });
    }

    const regioes = regioesParaConsultar(ufStr);
    const rows = await loadRows(anoNum, regioes, filters);

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({ rows, total: rows.length });
  } catch (err: unknown) {
    console.error('[API INEP] Erro:', err);
    const message = err instanceof Error ? err.message : 'Erro interno';
    return res.status(500).json({ error: message });
  }
}
