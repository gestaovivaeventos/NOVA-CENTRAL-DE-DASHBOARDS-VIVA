/**
 * Utilitarios de calculos do Funil de Expansao
 */

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
import { ETAPAS_TRATAMENTO, ETAPAS_QUALIFICADO, ETAPAS_MQL } from '../config/app.config';

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

/** Verifica se um lead esta perdido */
function isPerdido(lead: LeadExpansao): boolean {
  return lead.motivoPerda !== '';
}

/** Verifica se lead e MQL (somente fases DIAGNOSTICO REALIZADO e MODELO NEGOCIO *) */
function isMQL(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return ETAPAS_MQL.some(e => s.includes(e));
}

/** Verifica se lead e SQL (FIT FRANQUEADO em diante) */
function isSQL(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return (
    s.includes('FIT FRANQUEADO') ||
    s.includes('COF E VALIDA') ||
    s.includes('AGUARDANDO COMPOSI') ||
    s.includes('CANDIDATO APROVADO')
  );
}

/** Filtra leads pelo filtro ativo */
export function filtrarLeads(leads: LeadExpansao[], filtros: FiltrosExpansao): LeadExpansao[] {
  return leads.filter(lead => {
    if (filtros.tipoFunil !== 'TODOS') {
      if (lead.tipoFunil !== filtros.tipoFunil) return false;
    }
    if (filtros.origem && filtros.origem !== 'Todas') {
      if (lead.origem !== filtros.origem) return false;
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
    return new Date(str);
  }
  return null;
}

/** Calcula KPIs consolidados */
export function calcularKPIs(leads: LeadExpansao[]): KPIsExpansao {
  const totalLeads = leads.length;
  const mqls = leads.filter(isMQL).length;
  const sqls = leads.filter(isSQL).length;
  const candidatosAprovados = leads.filter(l => l.status.includes('CANDIDATO APROVADO')).length;
  const franquias = candidatosAprovados;
  const aguardandoComposicao = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSI')).length;
  const emRecuperacao = leads.filter(l => l.status.toUpperCase().includes('RECUPERA')).length;
  const perdidos = leads.filter(isPerdido).length;

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
  };
}

/**
 * Constroi etapas do funil com logica de CASCATA:
 * Um lead que chegou na ultima fase passou por todas anteriores,
 * entao ele conta em todas as fases anteriores tambem.
 */
function buildFunilEtapas(leads: LeadExpansao[], etapas: string[]): EtapaFunil[] {
  const result: EtapaFunil[] = [];
  const totalLeads = leads.length;
  let anterior = 0;

  for (let i = 0; i < etapas.length; i++) {
    // Primeira etapa = total de leads (todos passam pelo topo do funil)
    // Demais etapas = cascata (lead na fase N conta em todas as fases <= N)
    const etapaIdx = STATUS_ORDER.indexOf(etapas[i]);
    const count = i === 0 ? totalLeads : leads.filter(l => getStatusIndex(l.status) >= etapaIdx).length;

    const taxa = i === 0 ? 100 : (anterior > 0 ? (count / anterior) * 100 : 0);
    result.push({ nome: etapas[i], quantidade: count, taxaConversao: taxa });
    anterior = count;
  }

  return result;
}

/** Calcula dados do funil completo com etapas */
export function calcularFunil(leads: LeadExpansao[]): FunilCompleto {
  const investidores = leads.filter(l => l.tipoFunil === 'INVESTIDOR');
  const operadores = leads.filter(l => l.tipoFunil === 'OPERADOR');

  return {
    tratamento: buildFunilEtapas(leads, ETAPAS_TRATAMENTO),
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
  const ativosInv = ativos.filter(l => l.tipoFunil === 'INVESTIDOR');
  const ativosOp = ativos.filter(l => l.tipoFunil === 'OPERADOR');

  const buildAtivos = (subset: LeadExpansao[], etapas: string[]): EtapaFunil[] => {
    const totalSubset = subset.length;
    return etapas.map((etapa, i) => {
      const etapaIdx = STATUS_ORDER.indexOf(etapa);
      const count = i === 0 ? totalSubset : subset.filter(l => getStatusIndex(l.status) >= etapaIdx).length;
      return { nome: etapa, quantidade: count, taxaConversao: 0 };
    });
  };

  return {
    tratamento: buildAtivos(ativos, ETAPAS_TRATAMENTO),
    investidor: buildAtivos(ativosInv, ETAPAS_QUALIFICADO),
    operador: buildAtivos(ativosOp, ETAPAS_QUALIFICADO),
  };
}

/** Agrupa leads por origem */
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

/** Agrupa leads por persona */
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
    .sort((a, b) => b.geral - a.geral);
}

/** Agrupa leads por perfil */
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

/** Agrupa motivos de perda - motivo extraido do texto entre parenteses */
export function agruparMotivosPerda(leads: LeadExpansao[]): MotivoPerda[] {
  const perdidos = leads.filter(isPerdido);
  const map = new Map<string, { geral: number; mql: number; sql: number }>();

  for (const lead of perdidos) {
    const motivo = lead.motivoPerda || 'Motivo indefinido';
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

/** Agrupa motivos de qualificacao */
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
    if (isMQL(lead)) entry.mql++;
    if (isSQL(lead)) entry.sql++;
  }

  return Array.from(map.entries())
    .map(([motivo, vals]) => ({ motivo, ...vals }))
    .sort((a, b) => b.geral - a.geral);
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

/** Agrupa candidatos por cidade com quebra por perfil completo */
export function agruparPorCidade(leads: LeadExpansao[]): CandidatoCidade[] {
  const map = new Map<string, { investidorTotal: number; investidorParcial: number; opVendaParcial: number; opVendaSem: number; opPosVendaParcial: number }>();

  for (const lead of leads) {
    const cidade = lead.cidade && lead.uf ? `${lead.cidade} - ${lead.uf}` : lead.cidade || 'Nao informado';
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
    else if (perfil.includes('POS VENDA') || perfil.includes('POS VENDA')) entry.opPosVendaParcial++;
    else if (perfil.includes('VENDA') && perfil.includes('SEM')) entry.opVendaSem++;
    else if (perfil.includes('VENDA') && perfil.includes('PARCIAL')) entry.opVendaParcial++;
    else if (lead.tipoFunil === 'INVESTIDOR') entry.investidorParcial++;
    else entry.opVendaSem++;
  }

  const total = leads.length;
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
    const cidade = lead.cidade && lead.uf ? `${lead.cidade} - ${lead.uf}` : lead.cidade || 'Nao informado';
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
