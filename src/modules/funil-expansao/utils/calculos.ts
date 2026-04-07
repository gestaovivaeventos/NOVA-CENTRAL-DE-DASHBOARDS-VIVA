/**
 * Utilitarios de calculos do Funil de Expansao
 */

import { siglaEstado } from './formatacao';
import type {
  LeadExpansao,
  KPIsExpansao,
  EtapaFunil,
  FunilCompleto,
  DadosPorOrigem,
  DadosAssertividade,
  DadosPorPersona,
  DadosPorPerfil,
  MotivoPerda,
  DadosCampanha,
  CandidatoCidade,
  TempoComposicaoCidade,
  FiltrosExpansao,
} from '../types';
import { ETAPAS_TRATAMENTO, ETAPAS_QUALIFICADO, ETAPA_DISPLAY } from '../config/app.config';

// Ordem completa de todas as etapas para logica de cascata
const STATUS_ORDER = [...ETAPAS_TRATAMENTO, ...ETAPAS_QUALIFICADO];

/** Retorna o indice da etapa mais avancada do lead na ordem global */
function getStatusIndex(status: string): number {
  const s = status.toUpperCase();
  for (let i = STATUS_ORDER.length - 1; i >= 0; i--) {
    if (s.includes(STATUS_ORDER[i])) return i;
  }
  return -1;
}

/** Retorna o indice efetivo do lead para o funil de conversao.
 *  Para leads com status nao reconhecido (VENDA PERDIDA, RECUPERAÇÃO, etc.),
 *  tenta usar faseQuePerdeu. Caso contrario, assume que o lead passou
 *  pelo menos pela primeira fase do seu funil.
 */
function getLeadFunilIndex(lead: LeadExpansao): number {
  const idx = getStatusIndex(lead.status);
  if (idx >= 0) return idx;

  // Status nao reconhecido (VENDA PERDIDA, RECUPERAÇÃO, etc.)
  // Tentar usar faseQuePerdeu para identificar a fase mais avancada
  if (lead.faseQuePerdeu) {
    const faseIdx = getStatusIndex(lead.faseQuePerdeu);
    if (faseIdx >= 0) return faseIdx;
  }

  // Fallback: primeira fase do funil do lead
  if (lead.tipoFunil === 'INVESTIDOR' || lead.tipoFunil === 'OPERADOR') {
    return STATUS_ORDER.indexOf('DIAGNÓSTICO REALIZADO');
  }
  return STATUS_ORDER.indexOf('NOVO');
}

/** Verifica se um lead esta perdido */
function isPerdido(lead: LeadExpansao): boolean {
  return lead.motivoPerda !== '';
}

/** Verifica se o texto raw da etapa contem a tag MQL (case-insensitive) */
function rawContainsMQL(raw: string): boolean {
  return raw.toUpperCase().includes('MQL');
}

/** Verifica se o texto raw da etapa contem a tag SQL (case-insensitive) */
function rawContainsSQL(raw: string): boolean {
  return raw.toUpperCase().includes('SQL');
}

/** Classifica lead perdido como MQL pela fase em que perdeu */
function isMQLPorFasePerda(lead: LeadExpansao): boolean {
  const fase = (lead.faseQuePerdeu || '').toUpperCase();
  return rawContainsMQL(fase) || isSQLPorFasePerda(lead);
}

/** Classifica lead perdido como SQL pela fase em que perdeu */
function isSQLPorFasePerda(lead: LeadExpansao): boolean {
  const fase = (lead.faseQuePerdeu || '').toUpperCase();
  return (
    rawContainsSQL(fase) ||
    fase.includes('FIT FRANQUEADO') ||
    fase.includes('COF E VALIDA') ||
    fase.includes('AGUARDANDO COMPOSI') ||
    fase.includes('CANDIDATO APROVADO')
  );
}

/** Verifica se lead esta ATUALMENTE na fase MQL (pela tag da etapa original) */
function isMQLAtivo(lead: LeadExpansao): boolean {
  const raw = (lead.rawEtapa || '').toUpperCase();
  return rawContainsMQL(raw) && !isPerdido(lead);
}

/** Verifica se lead esta ATUALMENTE na fase SQL (FIT FRANQUEADO ate CANDIDATO APROVADO) */
function isSQLAtivo(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return (
    s.includes('FIT FRANQUEADO') ||
    s.includes('COF E VALIDA') ||
    s.includes('AGUARDANDO COMPOSI') ||
    s.includes('CANDIDATO APROVADO')
  ) && !isPerdido(lead);
}

/** Funil cheio: MQL inclui leads cuja etapa contem tag MQL, ou que estao em fase SQL+ */
function isMQL(lead: LeadExpansao): boolean {
  return rawContainsMQL(lead.rawEtapa || '') || isSQL(lead);
}

/** Funil cheio: SQL inclui leads cuja etapa contem tag SQL, ou em fases SQL+ pelo nome */
function isSQL(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return (
    rawContainsSQL(lead.rawEtapa || '') ||
    s.includes('FIT FRANQUEADO') ||
    s.includes('COF E VALIDA') ||
    s.includes('AGUARDANDO COMPOSI') ||
    s.includes('CANDIDATO APROVADO') ||
    s.includes('VENDA GANHA')
  );
}

/** Filtra leads pelo filtro ativo */
export function filtrarLeads(leads: LeadExpansao[], filtros: FiltrosExpansao): LeadExpansao[] {
  return leads.filter(lead => {
    // Multi-select de funil: array vazio ou contendo 'TODOS' = sem filtro
    if (filtros.tipoFunil.length > 0 && !filtros.tipoFunil.includes('TODOS')) {
      if (!filtros.tipoFunil.includes(lead.tipoFunil)) return false;
    }
    if (filtros.origem.length > 0 && !filtros.origem.includes('Todas')) {
      if (!filtros.origem.includes(lead.origem)) return false;
    }
    if (filtros.periodoInicio) {
      const dataLead = parseDate(lead.dataEntrada);
      const inicio = parseDate(filtros.periodoInicio);
      if (dataLead && inicio && dataLead < inicio) return false;
    }
    if (filtros.periodoFim) {
      const dataLead = parseDate(lead.dataEntrada);
      const fim = parseDate(filtros.periodoFim);
      if (dataLead && fim && dataLead > fim) return false;
    }
    return true;
  });
}

/** Parseia uma data em formato DD/MM/YYYY, DD.MM.YYYY HH:MM:SS, ou YYYY-MM-DD */
function parseDate(str: string): Date | null {
  if (!str) return null;
  if (str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  if (str.includes('.')) {
    const datePart = str.split(' ')[0];
    const [d, m, y] = datePart.split('.').map(Number);
    return new Date(y, m - 1, d);
  }
  if (str.includes('-')) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

/** Calcula KPIs consolidados */
export function calcularKPIs(leads: LeadExpansao[]): KPIsExpansao {
  const totalLeads = leads.length;
  const mqls = leads.filter(isMQL).length;
  const sqls = leads.filter(isSQL).length;
  const mqlAtivos = leads.filter(isMQLAtivo).length;
  const sqlAtivos = leads.filter(isSQLAtivo).length;
  const candidatosAprovados = leads.filter(l => l.status.includes('CANDIDATO APROVADO')).length;
  const aguardandoComposicao = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI')).length;
  const emRecuperacao = leads.filter(l => l.status.toUpperCase().includes('RECUPERA')).length;
  const perdidos = leads.filter(isPerdido).length;

  // Franquias: cidades com pelo menos 1 investidor E 1 operador com VENDA GANHA
  const cidadesInvGanha = new Set<string>();
  const cidadesOpGanha = new Set<string>();
  for (const lead of leads) {
    if (lead.status.toUpperCase().includes('VENDA GANHA') && lead.cidade) {
      const cidade = lead.cidade.toUpperCase().trim();
      if (lead.tipoFunil === 'INVESTIDOR') cidadesInvGanha.add(cidade);
      if (lead.tipoFunil === 'OPERADOR') cidadesOpGanha.add(cidade);
    }
  }
  let franquias = 0;
  cidadesInvGanha.forEach(cidade => { if (cidadesOpGanha.has(cidade)) franquias++; });

  // Breakdowns por tipo de funil
  const candidatosAprovadosInv = leads.filter(l => l.status.includes('CANDIDATO APROVADO') && l.tipoFunil === 'INVESTIDOR').length;
  const candidatosAprovadosOp = leads.filter(l => l.status.includes('CANDIDATO APROVADO') && l.tipoFunil === 'OPERADOR').length;
  const aguardandoComposicaoInv = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI') && l.tipoFunil === 'INVESTIDOR').length;
  const aguardandoComposicaoOp = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI') && l.tipoFunil === 'OPERADOR').length;
  const emRecuperacaoTrat = leads.filter(l => l.status.toUpperCase().includes('RECUPERA') && l.tipoFunil === 'TRATAMENTO').length;
  const emRecuperacaoInv = leads.filter(l => l.status.toUpperCase().includes('RECUPERA') && l.tipoFunil === 'INVESTIDOR').length;
  const emRecuperacaoOp = leads.filter(l => l.status.toUpperCase().includes('RECUPERA') && l.tipoFunil === 'OPERADOR').length;
  const perdidosTrat = leads.filter(l => isPerdido(l) && l.tipoFunil === 'TRATAMENTO').length;
  const perdidosInv = leads.filter(l => isPerdido(l) && l.tipoFunil === 'INVESTIDOR').length;
  const perdidosOp = leads.filter(l => isPerdido(l) && l.tipoFunil === 'OPERADOR').length;

  const assertTerr = leads.filter(l => l.assertividadeTerritorio.toUpperCase() === 'FOCO').length;
  const assertPers = leads.filter(l => l.assertividadePersona.toUpperCase() === 'FOCO').length;
  const comTerritorio = leads.filter(l => l.assertividadeTerritorio).length;
  const comPersona = leads.filter(l => l.assertividadePersona).length;

  return {
    totalLeads,
    mqls,
    sqls,
    candidatosAprovados,
    franquias,
    taxaMql: totalLeads > 0 ? (mqls / totalLeads) * 100 : 0,
    taxaSql: totalLeads > 0 ? (sqls / totalLeads) * 100 : 0,
    taxaAprovacao: totalLeads > 0 ? (candidatosAprovados / totalLeads) * 100 : 0,
    aguardandoComposicao,
    emRecuperacao,
    perdidos,
    assertividadeTerritorio: comTerritorio > 0 ? (assertTerr / comTerritorio) * 100 : 0,
    assertividadePersona: comPersona > 0 ? (assertPers / comPersona) * 100 : 0,
    candidatosAprovadosInv,
    candidatosAprovadosOp,
    aguardandoComposicaoInv,
    aguardandoComposicaoOp,
    emRecuperacaoTrat,
    emRecuperacaoInv,
    emRecuperacaoOp,
    perdidosTrat,
    perdidosInv,
    perdidosOp,
    mqlAtivos,
    sqlAtivos,
  };
}

/**
 * Constroi etapas do funil com logica de CASCATA:
 * Primeira etapa = todos os leads do funil (independente da fase atual).
 * Demais etapas = leads que passaram por aquela fase (>= na ordem),
 * incluindo leads perdidos via faseQuePerdeu.
 */
function buildFunilEtapas(leads: LeadExpansao[], etapas: string[]): EtapaFunil[] {
  const result: EtapaFunil[] = [];
  const totalLeads = leads.length;
  let anterior = 0;

  for (let i = 0; i < etapas.length; i++) {
    const etapaIdx = STATUS_ORDER.indexOf(etapas[i]);
    const count = i === 0 ? totalLeads : leads.filter(l => getLeadFunilIndex(l) >= etapaIdx).length;
    const displayName = ETAPA_DISPLAY[etapas[i]] || etapas[i];

    const taxa = i === 0 ? 100 : (anterior > 0 ? (count / anterior) * 100 : 0);
    result.push({ nome: displayName, quantidade: count, taxaConversao: taxa });
    anterior = count;
  }

  return result;
}

/** Calcula dados do funil completo com etapas */
export function calcularFunil(leads: LeadExpansao[]): FunilCompleto {
  const tratamento = leads.filter(l => l.tipoFunil === 'TRATAMENTO');
  const investidores = leads.filter(l => l.tipoFunil === 'INVESTIDOR');
  const operadores = leads.filter(l => l.tipoFunil === 'OPERADOR');

  return {
    tratamento: buildFunilEtapas(tratamento, ETAPAS_TRATAMENTO),
    investidor: buildFunilEtapas(investidores, ETAPAS_QUALIFICADO),
    operador: buildFunilEtapas(operadores, ETAPAS_QUALIFICADO),
  };
}

/**
 * Calcula funil de ativos (sem perdidos), com mesma logica de cascata.
 * Sem percentuais de conversao.
 */
export function calcularFunilAtivos(leads: LeadExpansao[]): FunilCompleto {
  const ativos = leads.filter(l => !isPerdido(l));
  const ativosTrat = ativos.filter(l => l.tipoFunil === 'TRATAMENTO');
  const ativosInv = ativos.filter(l => l.tipoFunil === 'INVESTIDOR');
  const ativosOp = ativos.filter(l => l.tipoFunil === 'OPERADOR');

  const buildAtivos = (subset: LeadExpansao[], etapas: string[]): EtapaFunil[] => {
    return etapas.map((etapa) => {
      const etapaIdx = STATUS_ORDER.indexOf(etapa);
      const count = subset.filter(l => getStatusIndex(l.status) === etapaIdx).length;
      const displayName = ETAPA_DISPLAY[etapa] || etapa;
      return { nome: displayName, quantidade: count, taxaConversao: 0 };
    });
  };

  return {
    tratamento: buildAtivos(ativosTrat, ETAPAS_TRATAMENTO),
    investidor: buildAtivos(ativosInv, ETAPAS_QUALIFICADO),
    operador: buildAtivos(ativosOp, ETAPAS_QUALIFICADO),
  };
}

/** Agrupa leads por origem (funil cheio: SQL conta como MQL) */
export function agruparPorOrigem(leads: LeadExpansao[]): DadosPorOrigem[] {
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of leads) {
    const origem = lead.origem || 'Sem Origem';
    if (!map.has(origem)) map.set(origem, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(origem)!;
    entry.geral++;
    if (isMQL(lead)) entry.mql++;
    if (isSQL(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([origem, vals]) => ({ origem, ...vals }))
    .sort((a, b) => b.geral - a.geral);
}

/** Calcula assertividade de territorio (exclui leads sem valor) */
export function calcularAssertividadeTerritorio(leads: LeadExpansao[]): DadosAssertividade[] {
  const comValor = leads.filter(l => l.assertividadeTerritorio && l.assertividadeTerritorio.trim() !== '');
  const map = new Map<string, number>();
  const total = comValor.length;

  for (const lead of comValor) {
    const cat = lead.assertividadeTerritorio;
    map.set(cat, (map.get(cat) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
      percentual: total > 0 ? (quantidade / total) * 100 : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

/** Calcula assertividade de persona (exclui leads sem valor) */
export function calcularAssertividadePersona(leads: LeadExpansao[]): DadosAssertividade[] {
  const comValor = leads.filter(l => l.assertividadePersona && l.assertividadePersona.trim() !== '');
  const map = new Map<string, number>();
  const total = comValor.length;

  for (const lead of comValor) {
    const cat = lead.assertividadePersona;
    map.set(cat, (map.get(cat) || 0) + 1);
  }

  return Array.from(map.entries())
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
      percentual: total > 0 ? (quantidade / total) * 100 : 0,
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

/** Calcula regiao com maior acerto de foco e foco franquia operacao */
export function calcularRegiaoMaiorAcerto(leads: LeadExpansao[]): {
  focoRegiao: string;
  focoQtd: number;
  focoFranquiaRegiao: string;
  focoFranquiaQtd: number;
  menorRegiao: string;
  menorQtd: number;
} {
  const focoMap = new Map<string, number>();
  const focoFranquiaMap = new Map<string, number>();
  const naFocoMap = new Map<string, number>();

  for (const lead of leads) {
    const regiao = lead.regiao || 'Sem Regiao';
    const terr = lead.assertividadeTerritorio.toUpperCase();
    if (terr === 'FOCO') {
      focoMap.set(regiao, (focoMap.get(regiao) || 0) + 1);
    }
    if (terr === 'FOCO FRANQUIA OPERACAO' || terr.includes('FOCO FRANQUIA OPERA')) {
      focoFranquiaMap.set(regiao, (focoFranquiaMap.get(regiao) || 0) + 1);
    }
    if (terr.includes('FORA') || terr.includes('OPORTUNIDADE')) {
      naFocoMap.set(regiao, (naFocoMap.get(regiao) || 0) + 1);
    }
  }

  let focoRegiao = '';
  let focoQtd = 0;
  focoMap.forEach((qtd, regiao) => {
    if (qtd > focoQtd) { focoQtd = qtd; focoRegiao = regiao; }
  });

  let focoFranquiaRegiao = '';
  let focoFranquiaQtd = 0;
  focoFranquiaMap.forEach((qtd, regiao) => {
    if (qtd > focoFranquiaQtd) { focoFranquiaQtd = qtd; focoFranquiaRegiao = regiao; }
  });

  let menorRegiao = '';
  let menorQtd = 0;
  naFocoMap.forEach((qtd, regiao) => {
    if (qtd > menorQtd) { menorQtd = qtd; menorRegiao = regiao; }
  });

  return { focoRegiao, focoQtd, focoFranquiaRegiao, focoFranquiaQtd, menorRegiao, menorQtd };
}

/** Calcula persona com maior e menor assertividade */
export function calcularAssertividadePersonaExtremos(leads: LeadExpansao[]): {
  maiorPersona: string;
  maiorQtd: number;
  menorPersona: string;
  menorQtd: number;
} {
  const focoMap = new Map<string, number>();
  const naFocoMap = new Map<string, number>();

  for (const lead of leads) {
    const persona = lead.persona || 'Sem Persona';
    const pers = lead.assertividadePersona.toUpperCase();
    if (pers === 'FOCO') {
      focoMap.set(persona, (focoMap.get(persona) || 0) + 1);
    }
    if (pers.includes('FORA') || pers.includes('OPORTUNIDADE')) {
      naFocoMap.set(persona, (naFocoMap.get(persona) || 0) + 1);
    }
  }

  let maiorPersona = '';
  let maiorQtd = 0;
  focoMap.forEach((qtd, persona) => {
    if (qtd > maiorQtd) { maiorQtd = qtd; maiorPersona = persona; }
  });

  let menorPersona = '';
  let menorQtd = 0;
  naFocoMap.forEach((qtd, persona) => {
    if (qtd > menorQtd) { menorQtd = qtd; menorPersona = persona; }
  });

  return { maiorPersona, maiorQtd, menorPersona, menorQtd };
}

/** Agrupa leads por persona (funil cheio: SQL conta como MQL) */
export function agruparPorPersona(leads: LeadExpansao[]): DadosPorPersona[] {
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of leads) {
    const persona = lead.persona || 'Sem Persona Definida';
    if (!map.has(persona)) map.set(persona, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(persona)!;
    entry.geral++;
    if (isMQL(lead)) entry.mql++;
    if (isSQL(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([persona, vals]) => ({ persona, ...vals }))
    .sort((a, b) => a.persona.localeCompare(b.persona, 'pt-BR', { numeric: true }));
}

/** Agrupa leads por perfil (funil cheio: SQL conta como MQL) */
export function agruparPorPerfil(leads: LeadExpansao[]): DadosPorPerfil[] {
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of leads) {
    const perfil = lead.perfil || 'Sem Perfil Definido';
    if (!map.has(perfil)) map.set(perfil, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(perfil)!;
    entry.geral++;
    if (isMQL(lead)) entry.mql++;
    if (isSQL(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([perfil, vals]) => ({ perfil, ...vals }))
    .sort((a, b) => b.geral - a.geral);
}

/** Agrupa motivos de perda (funil cheio: perdido em SQL tambem conta como MQL) */
export function agruparMotivosPerda(leads: LeadExpansao[]): MotivoPerda[] {
  const perdidos = leads.filter(isPerdido);
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of perdidos) {
    const motivo = lead.motivoPerda || 'Motivo indefinido';
    if (!map.has(motivo)) map.set(motivo, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(motivo)!;
    entry.geral++;
    if (isMQLPorFasePerda(lead) || isSQLPorFasePerda(lead)) entry.mql++;
    if (isSQLPorFasePerda(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([motivo, vals]) => ({ motivo, ...vals }))
    .sort((a, b) => b.geral - a.geral);
}

/** Agrupa motivos de qualificacao (funil cheio: SQL conta como MQL) */
export function agruparMotivosQualificacao(leads: LeadExpansao[]): MotivoPerda[] {
  const qualificados = leads.filter(l => isMQL(l) && l.motivoQualificacao);
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of qualificados) {
    const motivo = lead.motivoQualificacao || 'Sem motivo';
    if (!map.has(motivo)) map.set(motivo, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(motivo)!;
    entry.geral++;
    if (isMQL(lead)) entry.mql++;
    if (isSQL(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([motivo, vals]) => ({ motivo, ...vals }))
    .sort((a, b) => b.geral - a.geral);
}

/** Agrupa fases em que ocorreu a perda (coluna [FASE QUE PERDEU]) */
export function agruparFasesPerda(leads: LeadExpansao[]): MotivoPerda[] {
  const perdidos = leads.filter(isPerdido);
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of perdidos) {
    const fase = lead.faseQuePerdeu || 'Fase indefinida';
    if (!map.has(fase)) map.set(fase, { geral: 0, mql: 0, sql: 0 });
    const entry = map.get(fase)!;
    entry.geral++;
    if (isMQLPorFasePerda(lead)) entry.mql++;
    if (isSQLPorFasePerda(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([motivo, vals]) => ({ motivo, ...vals }))
    .sort((a, b) => a.motivo.localeCompare(b.motivo, 'pt-BR', { numeric: true }));
}

/** Helper: agrupa leads por chave com colunas por tipo de funil */
function agruparPorFunil(leads: LeadExpansao[], getKey: (l: LeadExpansao) => string): DadosCampanha[] {
  const map = new Map<string, { tratamento: number; investidores: number; operadores: number; recupPerdidos: number }>();

  for (const lead of leads) {
    const key = getKey(lead);
    if (!key) continue;
    if (!map.has(key)) map.set(key, { tratamento: 0, investidores: 0, operadores: 0, recupPerdidos: 0 });
    const entry = map.get(key)!;

    if (lead.tipoFunil === 'TRATAMENTO') entry.tratamento++;
    else if (lead.tipoFunil === 'INVESTIDOR') entry.investidores++;
    else if (lead.tipoFunil === 'OPERADOR') entry.operadores++;

    if (isPerdido(lead) || lead.status.toUpperCase().includes('RECUPERA')) {
      entry.recupPerdidos++;
    }
  }

  return Array.from(map.entries())
    .map(([nome, vals]) => ({ nome, ...vals }))
    .sort((a, b) => (b.tratamento + b.investidores + b.operadores) - (a.tratamento + a.investidores + a.operadores));
}

/** Agrupa dados de campanhas (utm_campaign) por tipo de funil */
export function agruparCampanhas(leads: LeadExpansao[]): DadosCampanha[] {
  return agruparPorFunil(leads, l => l.campanha);
}

/** Agrupa conjuntos (utm_medium) por tipo de funil */
export function agruparConjuntos(leads: LeadExpansao[]): DadosCampanha[] {
  return agruparPorFunil(leads, l => l.conjunto);
}

/** Agrupa anuncios (utm_source) por tipo de funil */
export function agruparAnuncios(leads: LeadExpansao[]): DadosCampanha[] {
  return agruparPorFunil(leads, l => l.anuncio);
}

/** Agrupa candidatos por cidade com quebra por perfil completo — somente leads em AGUARDANDO COMPOSIÇÃO de Investidor e Operador */
export function agruparPorCidade(leads: LeadExpansao[]): CandidatoCidade[] {
  const aguardando = leads.filter(l =>
    l.status.toUpperCase().includes('AGUARDANDO COMPOSI') &&
    (l.tipoFunil === 'INVESTIDOR' || l.tipoFunil === 'OPERADOR')
  );
  const map = new Map<string, { investidorTotal: number; investidorParcial: number; opVendaParcial: number; opVendaSem: number; opPosVendaParcial: number }>();

  for (const lead of aguardando) {
    const cidade = lead.cidade && lead.uf ? `${lead.cidade} - ${siglaEstado(lead.uf)}` : lead.cidade || 'Nao informado';
    if (!map.has(cidade)) {
      map.set(cidade, {
        investidorTotal: 0,
        investidorParcial: 0,
        opVendaParcial: 0,
        opVendaSem: 0,
        opPosVendaParcial: 0,
      });
    }
    const entry = map.get(cidade)!;
    const perfil = lead.perfil.toUpperCase();

    if (perfil.includes('INVESTIDOR') && perfil.includes('TOTAL')) entry.investidorTotal++;
    else if (perfil.includes('INVESTIDOR') && perfil.includes('PARCIAL')) entry.investidorParcial++;
    else if (perfil.includes('VENDAS') && perfil.includes('COM INVESTIMENTO PARCIAL')) entry.opPosVendaParcial++;
    else if (perfil.includes('VENDA') && perfil.includes('SEM')) entry.opVendaSem++;
    else if (perfil.includes('VENDA') && perfil.includes('PARCIAL')) entry.opVendaParcial++;
    else if (lead.tipoFunil === 'INVESTIDOR') entry.investidorParcial++;
    else entry.opVendaSem++;
  }

  const total = aguardando.length;
  return Array.from(map.entries())
    .map(([cidade, vals]) => {
      const t = vals.investidorTotal + vals.investidorParcial + vals.opVendaParcial + vals.opVendaSem + vals.opPosVendaParcial;
      const hasInvestidor = (vals.investidorTotal + vals.investidorParcial) > 0;
      const hasOperador = (vals.opVendaParcial + vals.opVendaSem + vals.opPosVendaParcial) > 0;
      return {
        cidade,
        ...vals,
        total: t,
        percentual: total > 0 ? (t / total) * 100 : 0,
        temOportunidade: hasInvestidor && hasOperador,
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** Agrupa tempo em composicao por cidade com buckets: <=1M, 1-3M, 3-6M, +6M */
export function agruparTempoComposicaoPorCidade(leads: LeadExpansao[]): TempoComposicaoCidade[] {
  const aguardando = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI'));
  const hoje = new Date();

  const map = new Map<string, { invAte1m: number; inv1a3m: number; inv3a6m: number; invMais6m: number; opAte1m: number; op1a3m: number; op3a6m: number; opMais6m: number }>();

  for (const lead of aguardando) {
    const cidade = lead.cidade && lead.uf ? `${lead.cidade} - ${siglaEstado(lead.uf)}` : lead.cidade || 'Nao informado';
    if (!map.has(cidade)) {
      map.set(cidade, { invAte1m: 0, inv1a3m: 0, inv3a6m: 0, invMais6m: 0, opAte1m: 0, op1a3m: 0, op3a6m: 0, opMais6m: 0 });
    }
    const entry = map.get(cidade)!;

    const dataCriacao = parseDate(lead.dataEntrada);
    const dias = dataCriacao ? Math.max(0, Math.floor((hoje.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24))) : 0;

    const isInv = lead.tipoFunil === 'INVESTIDOR';
    if (dias <= 30) {
      isInv ? entry.invAte1m++ : entry.opAte1m++;
    } else if (dias <= 90) {
      isInv ? entry.inv1a3m++ : entry.op1a3m++;
    } else if (dias <= 180) {
      isInv ? entry.inv3a6m++ : entry.op3a6m++;
    } else {
      isInv ? entry.invMais6m++ : entry.opMais6m++;
    }
  }

  return Array.from(map.entries())
    .map(([cidade, vals]) => ({
      cidade,
      ...vals,
      total: vals.invAte1m + vals.inv1a3m + vals.inv3a6m + vals.invMais6m + vals.opAte1m + vals.op1a3m + vals.op3a6m + vals.opMais6m,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Extrai origens unicas */
export function extrairOrigens(leads: LeadExpansao[]): string[] {
  const set = new Set<string>();
  for (const lead of leads) {
    if (lead.origem) set.add(lead.origem);
  }
  return Array.from(set).sort();
}

/** Retorna cidades onde franquia foi vendida (investidor + operador com VENDA GANHA na mesma cidade) */
export function listarCidadesFranquias(leads: LeadExpansao[]): string[] {
  const cidadesInvGanha = new Map<string, string>(); // upper -> original
  const cidadesOpGanha = new Set<string>();

  for (const lead of leads) {
    if (lead.status.toUpperCase().includes('VENDA GANHA') && lead.cidade) {
      const upper = lead.cidade.toUpperCase().trim();
      if (lead.tipoFunil === 'INVESTIDOR') {
        cidadesInvGanha.set(upper, lead.cidade.trim() + (lead.uf ? ` - ${siglaEstado(lead.uf)}` : ''));
      }
      if (lead.tipoFunil === 'OPERADOR') cidadesOpGanha.add(upper);
    }
  }

  const result: string[] = [];
  cidadesInvGanha.forEach((label, upper) => {
    if (cidadesOpGanha.has(upper)) result.push(label);
  });
  return result.sort();
}

/** Retorna cidades com leads aguardando composição (com contagem inv/op) */
export function listarCidadesAguardandoComposicao(leads: LeadExpansao[]): { cidade: string; inv: number; op: number }[] {
  const aguardando = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI'));
  const map = new Map<string, { cidade: string; inv: number; op: number }>();

  for (const lead of aguardando) {
    const cidadeLabel = lead.cidade && lead.uf ? `${lead.cidade} - ${siglaEstado(lead.uf)}` : lead.cidade || 'Não informado';
    const key = cidadeLabel.toUpperCase();
    if (!map.has(key)) map.set(key, { cidade: cidadeLabel, inv: 0, op: 0 });
    const entry = map.get(key)!;
    if (lead.tipoFunil === 'INVESTIDOR') entry.inv++;
    else entry.op++;
  }

  return Array.from(map.values()).sort((a, b) => (b.inv + b.op) - (a.inv + a.op));
}

/** Retorna contagem de leads por região */
export function listarLeadsPorRegiao(leads: LeadExpansao[]): { regiao: string; quantidade: number }[] {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const regiao = lead.regiao || 'Sem Região';
    map.set(regiao, (map.get(regiao) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([regiao, quantidade]) => ({ regiao, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}
