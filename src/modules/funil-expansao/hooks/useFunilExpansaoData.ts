/**
 * Hook para buscar dados do Funil de Expansão
 * Padrão: fetch via API route com cache client-side
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { LeadExpansao } from '../types';

interface CacheEntry {
  data: LeadExpansao[];
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let cache: CacheEntry | null = null;
let pendingRequest: Promise<LeadExpansao[]> | null = null;

/**
 * Mapeia um array de header + rows para objetos LeadExpansao
 * Headers reais da planilha (normalização: lowercase, trim, espaços→_):
 *   id, lead_título, empresa_lead_'s, contato_principal, empresa_do_contato,
 *   lead_usuário_responsável, etapa_do_lead, funil_de_vendas, venda, data_criada,
 *   criado_por, última_modificação, modificado_por, lead_tags, próxima_tarefa,
 *   fechada_em, data_criação, telefone, e-mail, estado, cidade, área_de_atuação,
 *   url_onde_converteu, utm_source, utm_medium, utm_campaign, origem_do_lead,
 *   assertividade_território, assertividade_persona, motivo_qualificação,
 *   [fase_que_perdeu], utm_content, utm_medium, utm_campaign, utm_source,
 *   utm_term, utm_referrer, referrer, gclientid, gclid, fbclid, ...
 */
function parseRows(rows: string[][]): LeadExpansao[] {
  if (!rows || rows.length < 2) return [];

  // Normaliza headers removendo acentos para facilitar matching
  const rawHeaders = rows[0].map(h => h.trim());
  const headers = rawHeaders.map(h =>
    h.toLowerCase()
      .replace(/\s+/g, '_')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
  );
  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => { colIndex[h] = i; });

  /** Busca valor por um ou mais nomes de coluna possíveis */
  const get = (row: string[], ...cols: string[]) => {
    for (const col of cols) {
      const normalized = col.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const idx = colIndex[normalized];
      if (idx !== undefined && row[idx]) return row[idx].trim();
    }
    return '';
  };

  /** Extrai tipo de funil do texto "1. FUNIL EXP 26 | Tratamento" */
  const extractTipoFunil = (raw: string): 'TRATAMENTO' | 'INVESTIDOR' | 'OPERADOR' => {
    const upper = raw.toUpperCase();
    if (upper.includes('INVESTIDOR')) return 'INVESTIDOR';
    if (upper.includes('OPERADOR')) return 'OPERADOR';
    return 'TRATAMENTO';
  };

  /** Extrai etapa limpa de "3 | DIAGNÓSTICO AGENDADO [LEAD]" → "DIAGNÓSTICO AGENDADO" */
  const extractEtapa = (raw: string): string => {
    if (!raw) return '';
    // Remove prefixo numérico "3 | ", sufixo "[LEAD]" / "[PROSPECTS]" e parênteses "(motivo)"
    let clean = raw.replace(/^\d+\s*\|\s*/, '').replace(/\s*\[.*?\]\s*/g, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    return clean.toUpperCase();
  };

  /** Extrai tags de persona/perfil do "Lead tags" (separadas por vírgula) */
  /** Personas = tags que começam com número, Perfil = tags que começam com OPERADOR ou INVESTIDOR */
  const extractFromTags = (tags: string): { persona: string; perfil: string } => {
    if (!tags) return { persona: '', perfil: '' };
    const parts = tags.split(',').map(t => t.trim()).filter(Boolean);
    
    let persona = '';
    let perfil = '';
    
    for (const part of parts) {
      // Persona: começa com número
      if (/^\d/.test(part)) {
        persona = persona ? `${persona}, ${part}` : part;
      }
      // Perfil: começa com OPERADOR, OPERAÇÕES ou INVESTIDOR
      const upper = part.toUpperCase();
      if (upper.startsWith('OPERADOR') || upper.startsWith('OPERAÇÕES') || upper.startsWith('OPERACOES') || upper.startsWith('INVESTIDOR')) {
        perfil = perfil ? `${perfil}, ${part}` : part;
      }
    }
    
    return { persona, perfil };
  };

  const leads: LeadExpansao[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const nome = get(row, 'lead_titulo', 'lead_título', 'nome', 'lead');
    const id = get(row, 'id') || String(i);
    if (!nome && !id) continue;

    const funilRaw = get(row, 'funil_de_vendas');
    const etapaRaw = get(row, 'etapa_do_lead');
    const tags = get(row, 'lead_tags');
    const { persona, perfil } = extractFromTags(tags);

    // Dados de UTM para campanhas
    // utm_campaign = campanhas, utm_source = anúncios, utm_medium = conjuntos
    const utmCampaign = get(row, 'utm_campaign');
    const utmSource = get(row, 'utm_source');
    const utmMedium = get(row, 'utm_medium');

    // Extrair motivo de perda: da etapa "Venda perdida (Parceria)" ou da coluna [fase_que_perdeu]
    const etapaLimpa = extractEtapa(etapaRaw);
    const faseQuePerdeu = get(row, '[fase_que_perdeu]', 'fase_que_perdeu') || '';
    let motivoPerda = '';

    // Primeiro: checar se a própria etapa é "Venda perdida (motivo)"
    if (etapaRaw.toUpperCase().includes('VENDA PERDIDA') || etapaRaw.toUpperCase().includes('VENDA GANHA')) {
      const matchParens = etapaRaw.match(/\(([^)]+)\)/);
      if (matchParens && etapaRaw.toUpperCase().includes('VENDA PERDIDA')) {
        motivoPerda = matchParens[1].trim();
      } else if (etapaRaw.toUpperCase().includes('VENDA PERDIDA')) {
        motivoPerda = 'Sem motivo especificado';
      }
    }
    // Fallback: coluna [fase_que_perdeu]
    if (!motivoPerda && faseQuePerdeu) {
      const matchParens = faseQuePerdeu.match(/\(([^)]+)\)/);
      if (matchParens) {
        motivoPerda = matchParens[1].trim();
      } else if (faseQuePerdeu.toUpperCase().includes('VENDA PERDIDA') || faseQuePerdeu.toUpperCase().includes('PERDID')) {
        motivoPerda = 'Sem motivo especificado';
      }
    }

    leads.push({
      id,
      nome: nome || get(row, 'contato_principal') || `Lead ${id}`,
      dataEntrada: get(row, 'data_criacao', 'data_criação', 'data_criada'),
      dataUltimaAtualizacao: get(row, 'ultima_modificacao', 'última_modificação') || '',
      tipoFunil: extractTipoFunil(funilRaw),
      status: etapaLimpa,
      origem: get(row, 'origem_do_lead', 'origem'),
      cidade: get(row, 'cidade') || '',
      uf: get(row, 'estado') || '',
      regiao: get(row, 'regiao', 'região') || '',
      persona,
      perfil,
      motivoPerda,
      motivoQualificacao: get(row, 'motivo_qualificacao', 'motivo_qualificação') || '',
      campanha: utmCampaign || '',
      conjunto: utmMedium || '',     // utm_medium = conjuntos
      anuncio: utmSource || '',      // utm_source = anúncios
      assertividadeTerritorio: get(row, 'assertividade_territorio', 'assertividade_território') || '',
      assertividadePersona: get(row, 'assertividade_persona') || '',
      tempoComposicao: '',
      faseQuePerdeu: faseQuePerdeu || '',
    });
  }

  return leads;
}

export function useFunilExpansaoData() {
  const [data, setData] = useState<LeadExpansao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    // Usar cache se válido
    if (!force && cache && Date.now() - cache.timestamp < CACHE_TTL) {
      setData(cache.data);
      setLoading(false);
      setLastUpdate(new Date(cache.timestamp).toLocaleString('pt-BR'));
      return;
    }

    // Deduplicar requests
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        if (mounted.current) {
          setData(result);
          setLoading(false);
        }
      } catch {}
      return;
    }

    setLoading(true);
    setError(null);

    const promise = fetch('/api/funil-expansao/data')
      .then(async (res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const json = await res.json();
        const parsed = parseRows(json.values || []);

        cache = { data: parsed, timestamp: Date.now() };
        return parsed;
      })
      .finally(() => { pendingRequest = null; });

    pendingRequest = promise;

    try {
      const result = await promise;
      if (mounted.current) {
        setData(result);
        setLastUpdate(new Date().toLocaleString('pt-BR'));
      }
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Erro ao buscar dados');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchData();
    return () => { mounted.current = false; };
  }, [fetchData]);

  return { data, loading, error, lastUpdate, refetch: () => fetchData(true) };
}
