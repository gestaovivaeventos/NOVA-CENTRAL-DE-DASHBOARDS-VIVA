/**
 * Utilitários de cálculos do Funil de Expansão
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
  FiltrosExpansao,
} from '../types';
import { ETAPAS_TRATAMENTO, ETAPAS_QUALIFICADO } from '../config/app.config';

/** Verifica se um lead está perdido (motivoPerda = [FASE QUE PERDEU] preenchido) */
function isPerdido(lead: LeadExpansao): boolean {
  return lead.motivoPerda !== '';
}

/** Verifica se um lead está ativo (não perdido) */
function isAtivo(lead: LeadExpansao): boolean {
  return !isPerdido(lead);
}

/** Verifica se lead é MQL (etapas qualificadas: DIAGNÓSTICO REALIZADO em diante) */
function isMQL(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return ETAPAS_QUALIFICADO.some(e => s.includes(e));
}

/** Verifica se lead é SQL (etapas avançadas: COF em diante) */
function isSQL(lead: LeadExpansao): boolean {
  const s = lead.status.toUpperCase();
  return (
    s.includes('FIT FRANQUEADO') ||
    s.includes('COF E VALIDAÇ') ||
    s.includes('AGUARDANDO COMPOSIÇÃO') ||
    s.includes('CANDIDATO APROVADO')
  );
}

/** Filtra leads pelo filtro ativo */
export function filtrarLeads(leads: LeadExpansao[], filtros: FiltrosExpansao): LeadExpansao[] {
  return leads.filter(lead => {
    // Filtro por tipo de funil
    if (filtros.tipoFunil !== 'TODOS') {
      if (lead.tipoFunil !== filtros.tipoFunil) return false;
    }

    // Filtro por origem
    if (filtros.origem && filtros.origem !== 'Todas') {
      if (lead.origem !== filtros.origem) return false;
    }

    // Filtro por período
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
  // DD/MM/YYYY
  if (str.includes('/')) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  // DD.MM.YYYY ou DD.MM.YYYY HH:MM:SS
  if (str.includes('.')) {
    const datePart = str.split(' ')[0];
    const [d, m, y] = datePart.split('.').map(Number);
    return new Date(y, m - 1, d);
  }
  // YYYY-MM-DD
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
  const aguardandoComposicao = leads.filter(l => l.status.toUpperCase().includes('AGUARDANDO COMPOSIÇÃO')).length;
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

/** Calcula dados do funil completo com etapas */
export function calcularFunil(leads: LeadExpansao[]): FunilCompleto {
  const calcEtapas = (subset: LeadExpansao[], etapas: string[]): EtapaFunil[] => {
    const result: EtapaFunil[] = [];
    let anterior = subset.length;

    for (const etapa of etapas) {
      const count = subset.filter(l => {
        const s = l.status.toUpperCase();
        return s.includes(etapa) || 
          // Incluir todos que já passaram dessa etapa
          etapas.indexOf(etapa) <= etapas.findIndex(e => s.includes(e));
      }).length;
      
      const taxa = anterior > 0 ? (count / anterior) * 100 : 0;
      result.push({ nome: etapa, quantidade: count, taxaConversao: taxa });
      anterior = count;
    }

    return result;
  };

  const tratamento = leads.filter(l => {
    const s = l.status.toUpperCase();
    return ETAPAS_TRATAMENTO.some(e => s.includes(e));
  });

  const investidores = leads.filter(l => l.tipoFunil === 'INVESTIDOR');
  const operadores = leads.filter(l => l.tipoFunil === 'OPERADOR');

  return {
    tratamento: buildFunilEtapas(leads, ETAPAS_TRATAMENTO),
    investidor: buildFunilEtapas(investidores, ETAPAS_QUALIFICADO),
    operador: buildFunilEtapas(operadores, ETAPAS_QUALIFICADO),
  };
}

/** Constrói as etapas do funil com contagens progressivas */
function buildFunilEtapas(leads: LeadExpansao[], etapas: string[]): EtapaFunil[] {
  const statusOrder = [...ETAPAS_TRATAMENTO, ...ETAPAS_QUALIFICADO];
  
  const getStatusIndex = (status: string): number => {
    const s = status.toUpperCase();
    for (let i = statusOrder.length - 1; i >= 0; i--) {
      if (s.includes(statusOrder[i])) return i;
    }
    return -1;
  };

  const result: EtapaFunil[] = [];
  let anterior = 0;

  for (let i = 0; i < etapas.length; i++) {
    const etapaIdx = statusOrder.indexOf(etapas[i]);
    // Conta leads que estão nessa etapa ou em etapas posteriores
    const count = leads.filter(l => {
      const idx = getStatusIndex(l.status);
      return idx >= etapaIdx;
    }).length;
    
    const taxa = i === 0 ? 100 : (anterior > 0 ? (count / anterior) * 100 : 0);
    result.push({ nome: etapas[i], quantidade: count, taxaConversao: taxa });
    anterior = count;
  }

  return result;
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

/** Calcula assertividade de território */
export function calcularAssertividadeTerritorio(leads: LeadExpansao[]): DadosAssertividade[] {
  const map = new Map<string, number>();
  const total = leads.filter(l => l.assertividadeTerritorio).length;
  
  for (const lead of leads) {
    const cat = lead.assertividadeTerritorio || 'Sem Validação';
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

/** Calcula assertividade de persona */
export function calcularAssertividadePersona(leads: LeadExpansao[]): DadosAssertividade[] {
  const map = new Map<string, number>();
  const total = leads.filter(l => l.assertividadePersona).length;
  
  for (const lead of leads) {
    const cat = lead.assertividadePersona || 'Sem Validação';
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

/** Agrupa motivos de perda */
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

/** Agrupa motivos de qualificação */
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

/** Agrupa dados de campanhas */
export function agruparCampanhas(leads: LeadExpansao[]): DadosCampanha[] {
  const map = new Map<string, { leads: number; mqls: number; sqls: number; conversoes: number }>();

  for (const lead of leads) {
    const campanha = lead.campanha;
    if (!campanha) continue;
    if (!map.has(campanha)) map.set(campanha, { leads: 0, mqls: 0, sqls: 0, conversoes: 0 });
    const entry = map.get(campanha)!;
    entry.leads++;
    if (isMQL(lead)) entry.mqls++;
    if (isSQL(lead)) entry.sqls++;
    if (lead.status.includes('CANDIDATO APROVADO')) entry.conversoes++;
  }

  return Array.from(map.entries())
    .map(([nome, vals]) => ({ nome, ...vals }))
    .sort((a, b) => b.leads - a.leads);
}

/** Agrupa conjuntos de anúncios */
export function agruparConjuntos(leads: LeadExpansao[]): DadosCampanha[] {
  const map = new Map<string, { leads: number; mqls: number; sqls: number; conversoes: number }>();

  for (const lead of leads) {
    const conjunto = lead.conjunto;
    if (!conjunto) continue;
    if (!map.has(conjunto)) map.set(conjunto, { leads: 0, mqls: 0, sqls: 0, conversoes: 0 });
    const entry = map.get(conjunto)!;
    entry.leads++;
    if (isMQL(lead)) entry.mqls++;
    if (isSQL(lead)) entry.sqls++;
    if (lead.status.includes('CANDIDATO APROVADO')) entry.conversoes++;
  }

  return Array.from(map.entries())
    .map(([nome, vals]) => ({ nome, ...vals }))
    .sort((a, b) => b.leads - a.leads);
}

/** Agrupa anúncios individuais */
export function agruparAnuncios(leads: LeadExpansao[]): DadosCampanha[] {
  const map = new Map<string, { leads: number; mqls: number; sqls: number; conversoes: number }>();

  for (const lead of leads) {
    const anuncio = lead.anuncio;
    if (!anuncio) continue;
    if (!map.has(anuncio)) map.set(anuncio, { leads: 0, mqls: 0, sqls: 0, conversoes: 0 });
    const entry = map.get(anuncio)!;
    entry.leads++;
    if (isMQL(lead)) entry.mqls++;
    if (isSQL(lead)) entry.sqls++;
    if (lead.status.includes('CANDIDATO APROVADO')) entry.conversoes++;
  }

  return Array.from(map.entries())
    .map(([nome, vals]) => ({ nome, ...vals }))
    .sort((a, b) => b.leads - a.leads);
}

/** Agrupa candidatos por cidade (composição) */
export function agruparPorCidade(leads: LeadExpansao[]): CandidatoCidade[] {
  const map = new Map<string, { investidor: number; operador: number }>();

  for (const lead of leads) {
    const cidade = lead.cidade && lead.uf ? `${lead.cidade} - ${lead.uf}` : lead.cidade || 'Não informado';
    if (!map.has(cidade)) map.set(cidade, { investidor: 0, operador: 0 });
    const entry = map.get(cidade)!;
    if (lead.tipoFunil === 'INVESTIDOR') entry.investidor++;
    else entry.operador++;
  }

  const total = leads.length;
  return Array.from(map.entries())
    .map(([cidade, vals]) => ({
      cidade,
      ...vals,
      total: vals.investidor + vals.operador,
      percentual: total > 0 ? ((vals.investidor + vals.operador) / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/** Extrai origens únicas */
export function extrairOrigens(leads: LeadExpansao[]): string[] {
  const set = new Set<string>();
  for (const lead of leads) {
    if (lead.origem) set.add(lead.origem);
  }
  return Array.from(set).sort();
}
