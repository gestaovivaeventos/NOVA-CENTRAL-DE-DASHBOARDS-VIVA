/**
 * Supabase Queries — Análise de Mercado
 * Service layer para buscar dados agregados via RPC do Supabase
 * Inclui cache em localStorage (TTL 24h) — dados INEP são censo anual
 */

import { supabase } from '@/lib/supabase';
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
} from '../types';

// ─── Cache localStorage (24h TTL) ───────────
const CACHE_PREFIX = 'am_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

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
    // quota exceeded — silently ignore
  }
}

/** Limpa todo o cache de análise de mercado */
export function invalidarCacheAnaliseMercado(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    console.log(`[Análise de Mercado] Cache limpo (${keys.length} entradas)`);
  } catch {
    // ignore
  }
}

/** Busca com cache: tenta localStorage primeiro, senão chama fetcher */
async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    // Não usar cache se for array vazio (resultado de erro/timeout)
    if (Array.isArray(cached) && cached.length === 0) {
      console.log(`[Cache] SKIP empty: ${key}`);
    } else {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }
  }
  console.log(`[Cache] MISS: ${key} — buscando no Supabase...`);
  const data = await fetcher();
  // Só cachear se tiver dados reais
  if (Array.isArray(data) ? data.length > 0 : data != null) {
    cacheSet(key, data);
  }
  return data;
}

// ─── Mapeamento UF → Nome ───────────────────
const UF_NOMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

// ─── Coordenadas capitais (para drill-down do mapa) ─
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

// ─── Franquias (estático) ───────────────────
const NOMES_FRANQUIAS = [
  'Barbacena', 'Belo Horizonte', 'Cacoal', 'Campo Grande', 'Campos',
  'Cascavel', 'Contagem', 'Cuiaba', 'Curitiba', 'Divinópolis',
  'Florianópolis', 'Fortaleza', 'Governador Valadares', 'Ipatinga',
  'Itaperuna Muriae', 'João Pessoa', 'Juiz de Fora', 'Lavras', 'Linhares',
  'Londrina', 'Montes Claros', 'Palmas', 'Passos', 'Petropolis',
  'Pocos de Caldas', 'Porto Alegre', 'Porto Velho', 'Pouso Alegre',
  'Recife', 'Região dos Lagos', 'Rio Branco', 'Rio de Janeiro', 'Salvador',
  'São Luís', 'Sao Paulo', 'Uba', 'Uberlândia', 'Vitória',
  'Volta Redonda - VivaMixx',
];

const FRANQUIAS: Franquia[] = NOMES_FRANQUIAS.map(nome => ({
  id: nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  nome,
}));

// ─── Helper: calcular variação % ─────────────
function variacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return Number((((atual - anterior) / anterior) * 100).toFixed(1));
}

function tendencia(v: number): 'up' | 'down' | 'stable' {
  if (v > 0.5) return 'up';
  if (v < -0.5) return 'down';
  return 'stable';
}

// ─── Fetch: Anos Disponíveis ────────────────
export async function fetchAnosDisponiveis(): Promise<number[]> {
  return cachedFetch('anos', async () => {
    const { data, error } = await supabase.rpc('fn_anos_disponiveis');
    if (error || !data) return [2022, 2023, 2024];
    return (data as { ano: number }[]).map(r => r.ano);
  });
}

// ─── Fetch: Áreas Disponíveis ───────────────
export async function fetchAreasDisponiveis(): Promise<string[]> {
  return cachedFetch('areas', async () => {
    const { data, error } = await supabase.rpc('fn_areas_disponiveis');
    if (error || !data) return [];
    return (data as { area: string }[]).map(r => r.area);
  });
}

// ─── Fetch: Indicadores (KPI Cards) ─────────
export async function fetchIndicadores(ano: number): Promise<IndicadorCard[]> {
  return cachedFetch(`indicadores_${ano}`, async () => {
  const { data, error } = await supabase.rpc('fn_indicadores', { p_ano: ano });
  if (error || !data || data.length === 0) return [];

  const rows = data as {
    ano: number;
    total_matriculas: number;
    total_concluintes: number;
    total_ingressantes: number;
    total_ies: number;
    total_cursos: number;
  }[];

  const atual = rows.find(r => r.ano === ano);
  const anterior = rows.find(r => r.ano === ano - 1);

  if (!atual) return [];

  const varMat = anterior ? variacao(atual.total_matriculas, anterior.total_matriculas) : 0;
  const varConc = anterior ? variacao(atual.total_concluintes, anterior.total_concluintes) : 0;
  const varIng = anterior ? variacao(atual.total_ingressantes, anterior.total_ingressantes) : 0;
  const varIes = anterior ? variacao(atual.total_ies, anterior.total_ies) : 0;
  const varCursos = anterior ? variacao(atual.total_cursos, anterior.total_cursos) : 0;

  return [
    { id: 'mat', titulo: 'Matrículas Ativas', valor: atual.total_matriculas, variacao: varMat, tendencia: tendencia(varMat), cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
    { id: 'conc', titulo: 'Concluintes/Ano', valor: atual.total_concluintes, variacao: varConc, tendencia: tendencia(varConc), cor: '#10B981', subtitulo: 'Potenciais Formandos' },
    { id: 'ing', titulo: 'Ingressantes/Ano', valor: atual.total_ingressantes, variacao: varIng, tendencia: tendencia(varIng), cor: '#8B5CF6', subtitulo: 'Novos alunos' },
    { id: 'ies', titulo: 'Ensino Superior', valor: atual.total_ies, variacao: varIes, tendencia: tendencia(varIes), cor: '#F59E0B', subtitulo: 'Instituições Ativas' },
    { id: 'cursos', titulo: 'Cursos Ativos', valor: atual.total_cursos, variacao: varCursos, tendencia: tendencia(varCursos), cor: '#EC4899', subtitulo: 'Graduação + Tecnólogo' },
  ];
  });
}

// ─── Fetch: Evolução Anual ──────────────────
export async function fetchEvolucaoAnual(): Promise<DadosEvolucaoAnual[]> {
  return cachedFetch('evolucao', async () => {
  const { data, error } = await supabase.rpc('fn_evolucao_anual');
  if (error || !data) return [];

  return (data as {
    ano: number;
    matriculas: number;
    concluintes: number;
    ingressantes: number;
    presencial_mat: number;
    ead_mat: number;
    publica_mat: number;
    privada_mat: number;
    feminino_mat: number;
    masculino_mat: number;
  }[]).map(r => ({
    ano: r.ano,
    matriculas: r.matriculas,
    concluintes: r.concluintes,
    ingressantes: r.ingressantes,
    presencial: r.presencial_mat,
    ead: r.ead_mat,
    publica: r.publica_mat,
    privada: r.privada_mat,
    genero: { feminino: r.feminino_mat, masculino: r.masculino_mat },
  }));
  });
}

// ─── Fetch: Distribuição por Estado ─────────
export async function fetchDistribuicaoEstados(ano: number): Promise<DadosEstado[]> {
  return cachedFetch(`estados_${ano}`, async () => {
  const { data, error } = await supabase.rpc('fn_distribuicao_estados', { p_ano: ano });
  if (error || !data) return [];

  const rows = data as {
    uf: string;
    matriculas: number;
    concluintes: number;
    ingressantes: number;
    instituicoes: number;
    cursos: number;
  }[];

  const totalMat = rows.reduce((s, r) => s + r.matriculas, 0);

  return rows.map(r => ({
    uf: r.uf,
    nome: UF_NOMES[r.uf] || r.uf,
    matriculas: r.matriculas,
    concluintes: r.concluintes,
    turmas: Math.round(r.cursos * 1.05), // estimativa: ~1.05 turma por curso
    instituicoes: r.instituicoes,
    percentual: totalMat > 0 ? Number(((r.matriculas / totalMat) * 100).toFixed(1)) : 0,
  }));
  });
}

// ─── Fetch: Cidades por Estado ──────────────
export async function fetchCidadesEstado(ano: number, uf: string): Promise<DadosCidade[]> {
  return cachedFetch(`cidades_${ano}_${uf}`, async () => {
  const { data, error } = await supabase.rpc('fn_cidades_estado', { p_ano: ano, p_uf: uf });
  if (error || !data) return [];

  const coords = COORDS_CAPITAIS[uf] || { lat: -15.79, lng: -47.88 };

  return (data as {
    municipio: string;
    matriculas: number;
    concluintes: number;
    ingressantes: number;
    instituicoes: number;
  }[]).map((r, i) => ({
    nome: r.municipio,
    uf,
    // Espaçar cidades ao redor da capital para visualização no mapa
    lat: coords.lat + (i * 0.3 * (i % 2 === 0 ? 1 : -1)),
    lng: coords.lng + (i * 0.25 * (i % 2 === 0 ? -1 : 1)),
    matriculas: r.matriculas,
    concluintes: r.concluintes,
    turmas: Math.round(r.matriculas / 200),
    instituicoes: r.instituicoes,
  }));
  });
}

// ─── Fetch: Ranking de Cursos ───────────────
export async function fetchRankingCursos(ano: number): Promise<DadosCurso[]> {
  return cachedFetch(`cursos_${ano}`, async () => {
  const { data, error } = await supabase.rpc('fn_ranking_cursos', { p_ano: ano });
  if (error || !data) return [];

  const rows = data as {
    nome: string;
    area: string;
    matriculas: number;
    concluintes: number;
    ingressantes: number;
    instituicoes: number;
    presencial_mat: number;
    ead_mat: number;
    publica_mat: number;
    privada_mat: number;
    feminino_mat: number;
    masculino_mat: number;
  }[];

  const totalMat = rows.reduce((s, r) => s + r.matriculas, 0);

  return rows.map(r => ({
    nome: r.nome,
    area: r.area,
    matriculas: r.matriculas,
    concluintes: r.concluintes,
    ingressantes: r.ingressantes,
    turmas: Math.max(1, Math.round(r.matriculas / 180)),
    mediaPorTurma: r.matriculas > 0 ? Math.round(r.matriculas / Math.max(1, Math.round(r.matriculas / 180))) : 0,
    instituicoes: r.instituicoes,
    percentual: totalMat > 0 ? Number(((r.matriculas / totalMat) * 100).toFixed(1)) : 0,
    presencial: r.presencial_mat,
    ead: r.ead_mat,
    publica: r.publica_mat,
    privada: r.privada_mat,
    genero: { feminino: r.feminino_mat, masculino: r.masculino_mat },
  }));
  });
}

// ─── Fetch: Instituições ────────────────────
export async function fetchInstituicoes(ano: number): Promise<DadosInstituicao[]> {
  return cachedFetch(`instituicoes_${ano}`, async () => {
  const { data, error } = await supabase.rpc('fn_instituicoes', { p_ano: ano });
  if (error || !data) return [];

  return (data as {
    cod_ies: number;
    nome: string;
    sigla: string;
    tipo: number;
    uf: string;
    cursos: number;
    matriculas: number;
    concluintes: number;
    ingressantes: number;
  }[]).map(r => ({
    nome: r.nome,
    tipo: r.tipo === 1 ? 'publica' as const : 'privada' as const,
    modalidade: 'ambas' as const, // não temos essa info consolidada por IES
    cursos: r.cursos,
    matriculas: r.matriculas,
    concluintes: r.concluintes,
    ingressantes: r.ingressantes,
    turmas: Math.max(1, Math.round(r.matriculas / 180)),
    uf: r.uf,
  }));
  });
}

// ─── Derivar: Evolução Turmas ───────────────
// Estimativa baseada nos dados de evolução anual
function derivarEvolucaoTurmas(evolucao: DadosEvolucaoAnual[]): DadosTurma[] {
  return evolucao.map(e => {
    const estimativaTurmas = Math.round(e.matriculas / 180);
    const turmasPublica = Math.round(e.publica / 180);
    const turmasPrivada = Math.round(e.privada / 180);
    return {
      ano: e.ano,
      totalTurmas: estimativaTurmas,
      mediaPorTurma: e.matriculas > 0 ? Math.round(e.matriculas / estimativaTurmas) : 0,
      medianaPorTurma: Math.round(e.matriculas / estimativaTurmas * 0.93),
      turmasPublica,
      turmasPrivada,
    };
  });
}

// ─── Derivar: Demografia ────────────────────
// Gênero extraído direto da evolução
function derivarDemografia(evolucao: DadosEvolucaoAnual[]): DadosDemografia {
  const ultimo = evolucao[evolucao.length - 1];
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

// ─── Derivar: Grupos Educacionais ───────────
// Não dispomos dessa info no DB; mantemos estática
function derivarGruposEducacionais(instituicoes: DadosInstituicao[]): GrupoEducacional[] {
  const totalMat = instituicoes.reduce((s, i) => s + i.matriculas, 0);

  // Top 10 IES como "grupos"
  const top = instituicoes.slice(0, 10);
  const grupos: GrupoEducacional[] = top.map(inst => ({
    nome: inst.nome,
    turmas: inst.turmas,
    matriculas: inst.matriculas,
    percentual: totalMat > 0 ? Number(((inst.matriculas / totalMat) * 100).toFixed(1)) : 0,
    tipo: inst.tipo,
  }));

  // Somar o restante
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

// ─── Fetch completo ─────────────────────────
export async function fetchDadosAnaliseMercado(ano: number): Promise<DadosAnaliseMercado> {
  // Buscar dados principais em paralelo (sem cidades – serão lazy-loaded)
  const [indicadores, evolucao, estados, cursos, instituicoes, anos] = await Promise.all([
    fetchIndicadores(ano),
    fetchEvolucaoAnual(),
    fetchDistribuicaoEstados(ano),
    fetchRankingCursos(ano),
    fetchInstituicoes(ano),
    fetchAnosDisponiveis(),
  ]);

  return {
    indicadores,
    evolucaoAlunos: evolucao,
    distribuicaoEstados: estados,
    cidadesPorEstado: {},
    rankingCursos: cursos,
    instituicoes,
    demografia: derivarDemografia(evolucao),
    evolucaoTurmas: derivarEvolucaoTurmas(evolucao),
    gruposEducacionais: derivarGruposEducacionais(instituicoes),
    franquias: FRANQUIAS,
    ultimaAtualizacao: new Date().toISOString(),
    fonte: `Censo da Educação Superior — INEP (${anos.length > 0 ? `${anos[0]}–${anos[anos.length - 1]}` : 'N/A'})`,
  };
}
