/**
 * Sheets Queries — Análise de Mercado
 * Busca dados INEP via API route (/api/analise-mercado/inep)
 * que por sua vez lê Google Sheets regionais com roteamento por UF
 *
 * Mantém a mesma interface pública do módulo anterior:
 *   fetchDadosAnaliseMercado, fetchAnosDisponiveis, etc.
 */

import { getCoordenadaMunicipio } from './coordenadas-municipios';
import { fixText } from './fix-encoding';
import type {
  DadosAnaliseMercado,
  DadosEvolucaoAnual,
  DadosEstado,
  DadosCidade,
  DadosCurso,
  DadosInstituicao,
  DadosDemografia,
  IndicadorCard,
  Franquia,
  DadosTurma,
  GrupoEducacional,
  BreakdownMetrica,
} from '../types';

// ─── Cache localStorage (30 dias TTL) ─────────────────────────────
const CACHE_VERSION = 18;
const CACHE_PREFIX = `am_cache_v${CACHE_VERSION}_`;
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, expiresAt } = JSON.parse(raw) as { data: T; expiresAt: number };
    if (Date.now() > expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, data: T): void {
  try {
    const entry = { data, expiresAt: Date.now() + CACHE_TTL };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // quota exceeded
  }
}

/** Limpa todo o cache de análise de mercado */
export function invalidarCacheAnaliseMercado(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('am_cache_'));
    keys.forEach(k => localStorage.removeItem(k));
    console.log(`[Análise de Mercado] Cache limpo (${keys.length} entradas)`);
  } catch { /* ignore */ }
}

// Limpar cache de versões antigas na inicialização
try {
  const oldKeys = Object.keys(localStorage).filter(
    k => k.startsWith('am_cache_') && !k.startsWith(CACHE_PREFIX)
  );
  if (oldKeys.length > 0) {
    oldKeys.forEach(k => localStorage.removeItem(k));
    console.log(`[Análise de Mercado] Cache antigo removido (${oldKeys.length} entradas)`);
  }
} catch { /* ignore */ }

/** Busca com cache: tenta localStorage primeiro, senão chama fetcher */
async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    if (Array.isArray(cached) && cached.length === 0) {
      console.log(`[Cache] SKIP empty: ${key}`);
    } else {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
  }
  console.log(`[Cache] MISS: ${key} — buscando no Google Sheets...`);
  const data = await fetcher();
  if (Array.isArray(data) ? data.length > 0 : data != null) {
    cacheSet(key, data);
  }
  return data;
}

// ─── Tipo da linha bruta retornada pela API ───────────────────────
interface InepRow {
  NU_ANO_CENSO: number;
  CO_IES: number;
  NO_IES: string;
  SG_IES: string;
  TP_REDE: number;
  SG_UF: string;
  NO_MUNICIPIO: string;
  CO_CURSO: number;
  NO_CURSO: string;
  NO_CINE_AREA_GERAL: string;
  TP_MODALIDADE_ENSINO: number;
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

// ─── Fetch genérico: chama /api/analise-mercado/inep ──────────────
async function fetchInepRows(params: {
  uf?: string | null;
  ano?: number | null;
  rede?: number | null;
  municipio?: string | null;
  ies?: number | null;
  curso?: string | null;
  modalidade?: number | null;
}): Promise<InepRow[]> {
  const query = new URLSearchParams();
  if (params.uf) query.set('uf', params.uf);
  if (params.ano) query.set('ano', String(params.ano));
  if (params.rede) query.set('rede', String(params.rede));
  if (params.municipio) query.set('municipio', params.municipio);
  if (params.ies) query.set('ies', String(params.ies));
  if (params.curso) query.set('curso', params.curso);
  if (params.modalidade) query.set('modalidade', String(params.modalidade));

  const res = await fetch(`/api/analise-mercado/inep?${query.toString()}`);
  if (!res.ok) {
    console.error('[INEP] Erro na API:', res.status, res.statusText);
    return [];
  }
  const json = await res.json();
  return (json.rows || []) as InepRow[];
}

// ─── Mapeamento UF → Nome ─────────────────────────────────────────
export const UF_NOMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

// ─── Coordenadas capitais ─────────────────────────────────────────
const COORDS_CAPITAIS: Record<string, { lat: number; lng: number }> = {
  SP: { lat: -23.55, lng: -46.63 }, MG: { lat: -19.92, lng: -43.94 },
  RJ: { lat: -22.91, lng: -43.17 }, PR: { lat: -25.43, lng: -49.27 },
  RS: { lat: -30.03, lng: -51.23 }, BA: { lat: -12.97, lng: -38.51 },
  SC: { lat: -27.60, lng: -48.55 }, GO: { lat: -16.68, lng: -49.25 },
  PE: { lat: -8.05, lng: -34.87 }, CE: { lat: -3.72, lng: -38.53 },
  PA: { lat: -1.46, lng: -48.50 }, DF: { lat: -15.79, lng: -47.88 },
  MA: { lat: -2.53, lng: -44.28 }, MT: { lat: -15.60, lng: -56.10 },
  MS: { lat: -20.44, lng: -54.65 }, ES: { lat: -20.32, lng: -40.34 },
  PB: { lat: -7.12, lng: -34.84 }, RN: { lat: -5.79, lng: -35.21 },
  PI: { lat: -5.09, lng: -42.80 }, AL: { lat: -9.67, lng: -35.74 },
  SE: { lat: -10.91, lng: -37.07 }, TO: { lat: -10.18, lng: -48.33 },
  AM: { lat: -3.12, lng: -60.02 }, RO: { lat: -8.76, lng: -63.90 },
  AC: { lat: -9.97, lng: -67.81 }, AP: { lat: 0.03, lng: -51.05 },
  RR: { lat: 2.82, lng: -60.67 },
};

// ─── Franquias (carregadas da planilha via API) ──────────────────
export interface FranquiaMunicipios {
  nome: string;
  municipios: string[];
}

let _franquiasCache: FranquiaMunicipios[] | null = null;
let _franquiasCacheExpires = 0;

/** Busca mapeamento franquia→municípios da API */
export async function fetchFranquiasMunicipios(): Promise<FranquiaMunicipios[]> {
  if (_franquiasCache && Date.now() < _franquiasCacheExpires) return _franquiasCache;

  try {
    const res = await fetch('/api/analise-mercado/franquias');
    if (!res.ok) return _franquiasCache || [];
    const data = await res.json();
    _franquiasCache = (data.franquias || []) as FranquiaMunicipios[];
    _franquiasCacheExpires = Date.now() + 60 * 60 * 1000; // 1h
    return _franquiasCache;
  } catch {
    return _franquiasCache || [];
  }
}

/** Converter lista de franquias para o formato Franquia[] do módulo */
function franquiasParaLista(fms: FranquiaMunicipios[]): Franquia[] {
  return fms.map(f => ({
    id: f.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    nome: f.nome,
  }));
}

/** Obter municípios de uma franquia pelo id */
export function getMunicipiosFranquia(franquiaId: string, fms: FranquiaMunicipios[]): string[] {
  const franquia = fms.find(
    f => f.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') === franquiaId
  );
  return franquia ? franquia.municipios : [];
}

// ─── Helpers ──────────────────────────────────────────────────────
function variacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return Number((((atual - anterior) / anterior) * 100).toFixed(1));
}

function tendencia(v: number): 'up' | 'down' | 'stable' {
  if (v > 0.5) return 'up';
  if (v < -0.5) return 'down';
  return 'stable';
}

function mkBreakdown(): BreakdownMetrica {
  return {
    presencial: 0, ead: 0,
    publica: 0, privada: 0,
    feminino: 0, masculino: 0,
    publicaPresencial: 0, publicaEad: 0,
    privadaPresencial: 0, privadaEad: 0,
  };
}

function addToBreakdown(
  bd: BreakdownMetrica,
  row: InepRow,
  getVal: (r: InepRow) => number,
  getFem: (r: InepRow) => number,
  getMasc: (r: InepRow) => number,
) {
  const val = getVal(row);
  const fem = getFem(row);
  const masc = getMasc(row);
  const isPub = row.TP_REDE === 1;
  const isPres = row.TP_MODALIDADE_ENSINO === 1;

  if (isPres) bd.presencial += val; else bd.ead += val;
  if (isPub) bd.publica += val; else bd.privada += val;
  bd.feminino += fem;
  bd.masculino += masc;

  if (isPub && isPres) bd.publicaPresencial += val;
  else if (isPub && !isPres) bd.publicaEad += val;
  else if (!isPub && isPres) bd.privadaPresencial += val;
  else bd.privadaEad += val;
}

// ─── Anos Disponíveis (endpoint leve, sem carregar planilhas) ───────
export async function fetchAnosDisponiveis(): Promise<number[]> {
  return cachedFetch('anos_sheets_v3', async () => {
    try {
      const res = await fetch('/api/analise-mercado/inep?action=anos');
      if (!res.ok) return [2022, 2023, 2024];
      const json = await res.json();
      const anos = (json.anos || []) as number[];
      return anos.length > 0 ? anos : [2022, 2023, 2024];
    } catch {
      return [2022, 2023, 2024];
    }
  });
}

// ─── Áreas Disponíveis (usa apenas ano mais recente) ─────────────────
export async function fetchAreasDisponiveis(): Promise<string[]> {
  return cachedFetch('areas_sheets_v2', async () => {
    const anos = await fetchAnosDisponiveis();
    const anoRecente = anos.length > 0 ? anos[anos.length - 1] : 2024;
    const rows = await fetchInepRows({ ano: anoRecente });
    const areas = new Set<string>();
    for (const r of rows) {
      if (r.NO_CINE_AREA_GERAL) areas.add(fixText(r.NO_CINE_AREA_GERAL));
    }
    return Array.from(areas).sort();
  });
}

// ─── Indicadores (KPI Cards) ──────────────────────────────────────
export async function fetchIndicadores(
  ano: number,
  ies: number | null = null,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<IndicadorCard[]> {
  const parts = [`ind_s_${ano}`];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const [rowsAtual, rowsAnterior] = await Promise.all([
      fetchInepRows({ ano, uf, rede, municipio, ies, curso, modalidade }),
      fetchInepRows({ ano: ano - 1, uf, rede, municipio, ies, curso, modalidade }),
    ]);

    function agregar(rows: InepRow[]) {
      let mat = 0, conc = 0, ing = 0;
      const iesSet = new Set<number>();
      const cursoSet = new Set<number>();
      for (const r of rows) {
        mat += r.QT_MAT;
        conc += r.QT_CONC;
        ing += r.QT_ING;
        iesSet.add(r.CO_IES);
        cursoSet.add(r.CO_CURSO);
      }
      return { mat, conc, ing, ies: iesSet.size, cursos: cursoSet.size };
    }

    const atual = agregar(rowsAtual);
    const anterior = agregar(rowsAnterior);

    if (atual.mat === 0 && atual.conc === 0 && atual.ing === 0) return [];

    const varMat = variacao(atual.mat, anterior.mat);
    const varConc = variacao(atual.conc, anterior.conc);
    const varIng = variacao(atual.ing, anterior.ing);
    const varIes = variacao(atual.ies, anterior.ies);
    const varCursos = variacao(atual.cursos, anterior.cursos);

    return [
      { id: 'mat', titulo: 'Matrículas Ativas', valor: atual.mat, variacao: varMat, tendencia: tendencia(varMat), cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
      { id: 'ing', titulo: 'Ingressantes/Ano', valor: atual.ing, variacao: varIng, tendencia: tendencia(varIng), cor: '#8B5CF6', subtitulo: 'Novos alunos' },
      { id: 'conc', titulo: 'Concluintes/Ano', valor: atual.conc, variacao: varConc, tendencia: tendencia(varConc), cor: '#10B981', subtitulo: 'Potenciais Formandos' },
      { id: 'ies', titulo: 'Ensino Superior', valor: atual.ies, variacao: varIes, tendencia: tendencia(varIes), cor: '#F59E0B', subtitulo: 'Instituições Ativas' },
      { id: 'cursos', titulo: 'Cursos Ativos', valor: atual.cursos, variacao: varCursos, tendencia: tendencia(varCursos), cor: '#EC4899', subtitulo: 'Graduação + Tecnólogo' },
    ];
  });
}

// ─── Evolução Anual ───────────────────────────────────────────────
export async function fetchEvolucaoAnual(
  ies: number | null = null,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<DadosEvolucaoAnual[]> {
  const parts = ['evol_s'];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    // Sem filtro de ano → todos os anos
    const rows = await fetchInepRows({ uf, rede, municipio, ies, curso, modalidade });

    // Agrupar por ano
    const porAno = new Map<number, InepRow[]>();
    for (const r of rows) {
      const arr = porAno.get(r.NU_ANO_CENSO) || [];
      arr.push(r);
      porAno.set(r.NU_ANO_CENSO, arr);
    }

    const resultado: DadosEvolucaoAnual[] = [];
    for (const [ano, anoRows] of Array.from(porAno.entries()).sort((a, b) => a[0] - b[0])) {
      const bdMat = mkBreakdown();
      const bdConc = mkBreakdown();
      const bdIng = mkBreakdown();

      let totalMat = 0, totalConc = 0, totalIng = 0;

      for (const r of anoRows) {
        totalMat += r.QT_MAT;
        totalConc += r.QT_CONC;
        totalIng += r.QT_ING;
        addToBreakdown(bdMat, r, x => x.QT_MAT, x => x.QT_MAT_FEM, x => x.QT_MAT_MASC);
        addToBreakdown(bdConc, r, x => x.QT_CONC, x => x.QT_CONC_FEM, x => x.QT_CONC_MASC);
        addToBreakdown(bdIng, r, x => x.QT_ING, x => x.QT_ING_FEM, x => x.QT_ING_MASC);
      }

      resultado.push({
        ano,
        matriculas: totalMat,
        concluintes: totalConc,
        ingressantes: totalIng,
        presencial: bdMat.presencial,
        ead: bdMat.ead,
        publica: bdMat.publica,
        privada: bdMat.privada,
        genero: { feminino: bdMat.feminino, masculino: bdMat.masculino },
        porMetrica: {
          matriculas: bdMat,
          concluintes: bdConc,
          ingressantes: bdIng,
        },
      });
    }

    return resultado;
  });
}

// ─── Distribuição por Estado ──────────────────────────────────────
export async function fetchDistribuicaoEstados(
  ano: number,
  ies: number | null = null,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<DadosEstado[]> {
  const parts = [`est_s_${ano}`];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const rows = await fetchInepRows({ ano, rede, ies, uf, municipio, curso, modalidade });

    // Agrupar por UF
    const porUf = new Map<string, { mat: number; conc: number; ies: Set<number>; cursos: Set<number> }>();
    for (const r of rows) {
      const uf = r.SG_UF;
      if (!uf) continue;
      let entry = porUf.get(uf);
      if (!entry) {
        entry = { mat: 0, conc: 0, ies: new Set(), cursos: new Set() };
        porUf.set(uf, entry);
      }
      entry.mat += r.QT_MAT;
      entry.conc += r.QT_CONC;
      entry.ies.add(r.CO_IES);
      entry.cursos.add(r.CO_CURSO);
    }

    const totalMat = Array.from(porUf.values()).reduce((s, e) => s + e.mat, 0);

    return Array.from(porUf.entries()).map(([uf, e]) => ({
      uf,
      nome: UF_NOMES[uf] || uf,
      matriculas: e.mat,
      concluintes: e.conc,
      turmas: 0,
      instituicoes: e.ies.size,
      percentual: totalMat > 0 ? Number(((e.mat / totalMat) * 100).toFixed(1)) : 0,
    }));
  });
}

// ─── Cidades por Estado ───────────────────────────────────────────
export async function fetchCidadesEstado(
  ano: number,
  uf: string,
  ies: number | null = null,
  rede: number | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<DadosCidade[]> {
  const parts = [`cid_s_${ano}_${uf}`];
  if (rede) parts.push(`r${rede}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const rows = await fetchInepRows({ ano, uf, rede, ies, curso, modalidade });

    const porMunicipio = new Map<string, { mat: number; conc: number; ing: number; ies: Set<number> }>();
    for (const r of rows) {
      const mun = r.NO_MUNICIPIO;
      if (!mun) continue;
      let entry = porMunicipio.get(mun);
      if (!entry) {
        entry = { mat: 0, conc: 0, ing: 0, ies: new Set() };
        porMunicipio.set(mun, entry);
      }
      entry.mat += r.QT_MAT;
      entry.conc += r.QT_CONC;
      entry.ing += r.QT_ING;
      entry.ies.add(r.CO_IES);
    }

    return Array.from(porMunicipio.entries()).map(([mun, e]) => {
      const nomeFix = fixText(mun);
      const coord = getCoordenadaMunicipio(nomeFix, uf, COORDS_CAPITAIS);
      return {
        nome: nomeFix,
        uf,
        lat: coord.lat,
        lng: coord.lng,
        matriculas: e.mat,
        concluintes: e.conc,
        ingressantes: e.ing,
        turmas: 0,
        instituicoes: e.ies.size,
      };
    });
  });
}

// ─── Ranking de Cursos ────────────────────────────────────────────
export async function fetchRankingCursos(
  ano: number,
  ies: number | null = null,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<DadosCurso[]> {
  const parts = [`cur_s_${ano}`];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const rows = await fetchInepRows({ ano, uf, rede, municipio, ies, curso, modalidade });

    // Agrupar por nome de curso
    const porCurso = new Map<string, {
      area: string;
      mat: number; conc: number; ing: number;
      ies: Set<number>;
      bdMat: BreakdownMetrica;
      bdConc: BreakdownMetrica;
      bdIng: BreakdownMetrica;
    }>();

    for (const r of rows) {
      const nome = r.NO_CURSO;
      if (!nome) continue;
      let entry = porCurso.get(nome);
      if (!entry) {
        entry = {
          area: r.NO_CINE_AREA_GERAL || '',
          mat: 0, conc: 0, ing: 0,
          ies: new Set(),
          bdMat: mkBreakdown(), bdConc: mkBreakdown(), bdIng: mkBreakdown(),
        };
        porCurso.set(nome, entry);
      }
      entry.mat += r.QT_MAT;
      entry.conc += r.QT_CONC;
      entry.ing += r.QT_ING;
      entry.ies.add(r.CO_IES);
      addToBreakdown(entry.bdMat, r, x => x.QT_MAT, x => x.QT_MAT_FEM, x => x.QT_MAT_MASC);
      addToBreakdown(entry.bdConc, r, x => x.QT_CONC, x => x.QT_CONC_FEM, x => x.QT_CONC_MASC);
      addToBreakdown(entry.bdIng, r, x => x.QT_ING, x => x.QT_ING_FEM, x => x.QT_ING_MASC);
    }

    const entries = Array.from(porCurso.entries());
    entries.sort((a, b) => b[1].mat - a[1].mat);
    const top = entries.slice(0, 500);
    const totalMat = top.reduce((s, [, e]) => s + e.mat, 0);

    return top.map(([nome, e]) => ({
      nome: fixText(nome),
      area: fixText(e.area),
      matriculas: e.mat,
      concluintes: e.conc,
      ingressantes: e.ing,
      turmas: 0,
      mediaPorTurma: 0,
      instituicoes: e.ies.size,
      percentual: totalMat > 0 ? Number(((e.mat / totalMat) * 100).toFixed(1)) : 0,
      presencial: e.bdMat.presencial,
      ead: e.bdMat.ead,
      publica: e.bdMat.publica,
      privada: e.bdMat.privada,
      publicaPresencial: e.bdMat.publicaPresencial,
      publicaEad: e.bdMat.publicaEad,
      privadaPresencial: e.bdMat.privadaPresencial,
      privadaEad: e.bdMat.privadaEad,
      publicaConc: e.bdConc.publica,
      privadaConc: e.bdConc.privada,
      publicaIng: e.bdIng.publica,
      privadaIng: e.bdIng.privada,
      publicaPresencialConc: e.bdConc.publicaPresencial,
      publicaEadConc: e.bdConc.publicaEad,
      privadaPresencialConc: e.bdConc.privadaPresencial,
      privadaEadConc: e.bdConc.privadaEad,
      publicaPresencialIng: e.bdIng.publicaPresencial,
      publicaEadIng: e.bdIng.publicaEad,
      privadaPresencialIng: e.bdIng.privadaPresencial,
      privadaEadIng: e.bdIng.privadaEad,
      genero: { feminino: e.bdMat.feminino, masculino: e.bdMat.masculino },
    }));
  });
}

// ─── Instituições ─────────────────────────────────────────────────
export async function fetchInstituicoes(
  ano: number,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
): Promise<DadosInstituicao[]> {
  const parts = [`inst_s_${ano}`];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const rows = await fetchInepRows({ ano, uf, rede, municipio, curso, modalidade });

    const porIes = new Map<number, {
      nome: string;
      tipo: number;
      uf: string;
      cursos: Set<number>;
      mat: number; conc: number; ing: number;
    }>();

    for (const r of rows) {
      let entry = porIes.get(r.CO_IES);
      if (!entry) {
        entry = {
          nome: r.NO_IES,
          tipo: r.TP_REDE,
          uf: r.SG_UF,
          cursos: new Set(),
          mat: 0, conc: 0, ing: 0,
        };
        porIes.set(r.CO_IES, entry);
      }
      entry.cursos.add(r.CO_CURSO);
      entry.mat += r.QT_MAT;
      entry.conc += r.QT_CONC;
      entry.ing += r.QT_ING;
    }

    return Array.from(porIes.entries()).map(([cod, e]) => ({
      codIes: cod,
      nome: fixText(e.nome),
      tipo: e.tipo === 1 ? 'publica' as const : 'privada' as const,
      modalidade: 'ambas' as const,
      cursos: e.cursos.size,
      matriculas: e.mat,
      concluintes: e.conc,
      ingressantes: e.ing,
      turmas: 0,
      uf: e.uf,
    }));
  });
}

// ─── Derivar: Evolução Turmas ─────────────────────────────────────
function derivarEvolucaoTurmas(evolucao: DadosEvolucaoAnual[]): DadosTurma[] {
  return evolucao.map(e => ({
    ano: e.ano,
    totalTurmas: 0,
    mediaPorTurma: 0,
    medianaPorTurma: 0,
    turmasPublica: 0,
    turmasPrivada: 0,
  }));
}

// ─── Derivar: Demografia ──────────────────────────────────────────
function derivarDemografia(evolucao: DadosEvolucaoAnual[], ano: number): DadosDemografia {
  const ultimo = evolucao.find(e => e.ano === ano) || evolucao[evolucao.length - 1];
  const totalGenero = ultimo ? ultimo.genero.feminino + ultimo.genero.masculino : 1;
  const pctFem = ultimo ? Number(((ultimo.genero.feminino / totalGenero) * 100).toFixed(1)) : 58;
  const pctMasc = ultimo ? Number(((ultimo.genero.masculino / totalGenero) * 100).toFixed(1)) : 42;

  return {
    genero: [
      { tipo: 'Feminino', total: ultimo?.genero.feminino || 0, percentual: pctFem },
      { tipo: 'Masculino', total: ultimo?.genero.masculino || 0, percentual: pctMasc },
    ],
  };
}

// ─── Derivar: Grupos Educacionais ─────────────────────────────────
function derivarGruposEducacionais(instituicoes: DadosInstituicao[]): GrupoEducacional[] {
  const totalMat = instituicoes.reduce((s, i) => s + i.matriculas, 0);
  const top = instituicoes.slice(0, 10);
  const grupos: GrupoEducacional[] = top.map(inst => ({
    nome: inst.nome,
    turmas: inst.turmas,
    matriculas: inst.matriculas,
    percentual: totalMat > 0 ? Number(((inst.matriculas / totalMat) * 100).toFixed(1)) : 0,
    tipo: inst.tipo,
  }));

  const restanteInsts = instituicoes.slice(10);
  if (restanteInsts.length > 0) {
    const matRestante = restanteInsts.reduce((s, i) => s + i.matriculas, 0);
    grupos.push({
      nome: 'Demais Instituições',
      turmas: restanteInsts.reduce((s, i) => s + i.turmas, 0),
      matriculas: matRestante,
      percentual: totalMat > 0 ? Number(((matRestante / totalMat) * 100).toFixed(1)) : 0,
      tipo: 'privada',
    });
  }

  return grupos;
}

// ─── Fetch completo (usa action=dashboard — só ano atual + anterior) ─
export async function fetchDadosAnaliseMercado(
  ano: number,
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  ies: number | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
  municipios: string[] | null = null,
): Promise<DadosAnaliseMercado> {
  const parts = [`dash_${ano}`];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (municipios && municipios.length > 0) parts.push(`muns${municipios.join('|')}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const query = new URLSearchParams();
    query.set('action', 'dashboard');
    query.set('ano', String(ano));
    if (uf) query.set('uf', uf);
    if (rede) query.set('rede', String(rede));
    if (municipio) query.set('municipio', municipio);
    if (municipios && municipios.length > 0) query.set('municipios', municipios.join(','));
    if (ies) query.set('ies', String(ies));
    if (curso) query.set('curso', curso);
    if (modalidade) query.set('modalidade', String(modalidade));

    const res = await fetch(`/api/analise-mercado/inep?${query.toString()}`);
    if (!res.ok) {
      console.error('[Dashboard] Erro:', res.status, res.statusText);
      throw new Error(`Dashboard API error: ${res.status}`);
    }
    const data = await res.json();

    const indicadores: IndicadorCard[] = data.indicadores || [];
    const evolucao: DadosEvolucaoAnual[] = data.evolucao || [];
    const estados: DadosEstado[] = data.estados || [];
    const cursos: DadosCurso[] = (data.cursos || []).map((c: Record<string, unknown>) => ({
      ...c, nome: fixText(String(c.nome || '')), area: fixText(String(c.area || '')),
    }));
    const instituicoes: DadosInstituicao[] = (data.instituicoes || []).map((i: Record<string, unknown>) => ({
      ...i, nome: fixText(String(i.nome || '')),
    }));
    const cidades: DadosCidade[] = (data.cidades || []).map((c: Record<string, unknown>) => {
      const nome = fixText(String(c.nome || ''));
      const cidUf = String(c.uf || '');
      const coord = getCoordenadaMunicipio(nome, cidUf, COORDS_CAPITAIS);
      return { ...c, nome, lat: coord.lat, lng: coord.lng };
    });

    const anosDisp: number[] = data.anos || [];

    // Carregar lista de franquias da planilha
    const franquiasMun = await fetchFranquiasMunicipios();

    // Cidades por estado: quando franquia ativa, agrupar por UF
    const cidadesPorEstado: Record<string, DadosCidade[]> = {};
    if (municipios && municipios.length > 0 && cidades.length > 0) {
      // Agrupar cidades por UF para o mapa
      for (const c of cidades) {
        const cidUf = String(c.uf || '');
        if (!cidUf) continue;
        if (!cidadesPorEstado[cidUf]) cidadesPorEstado[cidUf] = [];
        cidadesPorEstado[cidUf].push(c);
      }
    } else if (uf && cidades.length > 0) {
      cidadesPorEstado[uf] = cidades;
    }

    return {
      indicadores,
      evolucaoAlunos: evolucao,
      distribuicaoEstados: estados,
      cidadesPorEstado,
      rankingCursos: cursos,
      instituicoes,
      demografia: derivarDemografia(evolucao, ano),
      evolucaoTurmas: derivarEvolucaoTurmas(evolucao),
      gruposEducacionais: derivarGruposEducacionais(instituicoes),
      franquias: franquiasParaLista(franquiasMun),
      ultimaAtualizacao: new Date().toISOString(),
      fonte: `Censo da Educação Superior — INEP (${anosDisp.length > 0 ? `${anosDisp[0]}–${anosDisp[anosDisp.length - 1]}` : 'N/A'})`,
    };
  });
}

// ─── Fetch evolução histórica (lazy) — chama action=evolucao ─────
export async function fetchEvolucaoLazy(
  rede: number | null = null,
  uf: string | null = null,
  municipio: string | null = null,
  ies: number | null = null,
  curso: string | null = null,
  modalidade: number | null = null,
  municipios: string[] | null = null,
): Promise<DadosEvolucaoAnual[]> {
  const parts = ['evol_lazy'];
  if (rede) parts.push(`r${rede}`);
  if (uf) parts.push(`uf${uf}`);
  if (municipio) parts.push(`m${municipio}`);
  if (municipios && municipios.length > 0) parts.push(`muns${municipios.join('|')}`);
  if (ies) parts.push(`ies${ies}`);
  if (curso) parts.push(`c${curso}`);
  if (modalidade) parts.push(`mod${modalidade}`);
  const cacheKey = parts.join('_');

  return cachedFetch(cacheKey, async () => {
    const query = new URLSearchParams();
    query.set('action', 'evolucao');
    if (uf) query.set('uf', uf);
    if (rede) query.set('rede', String(rede));
    if (municipio) query.set('municipio', municipio);
    if (municipios && municipios.length > 0) query.set('municipios', municipios.join(','));
    if (ies) query.set('ies', String(ies));
    if (curso) query.set('curso', curso);
    if (modalidade) query.set('modalidade', String(modalidade));

    const res = await fetch(`/api/analise-mercado/inep?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.evolucao || []) as DadosEvolucaoAnual[];
  });
}
