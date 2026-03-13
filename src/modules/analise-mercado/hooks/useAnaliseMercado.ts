/**
 * useAnaliseMercado — Hook principal do módulo Análise de Mercado
 * Busca dados reais do Supabase (INEP)
 * Hierarquia de filtros: Ano → Rede → Estado → Município → Instituição → Curso
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  DadosAnaliseMercado,
  FiltrosAnaliseMercado,
  VisaoAtiva,
  DadosFranquia,
  DadosInstituicao,
  TipoInstituicao,
} from '../types';
import {
  fetchDadosAnaliseMercado,
  fetchAnosDisponiveis,
  fetchAreasDisponiveis,
  invalidarCacheAnaliseMercado,
} from '../utils/supabase-queries';

/** Converter tipoInstituicao (string) → tp_rede (number) para SQL */
function redeToNumber(tipo: TipoInstituicao): number | null {
  if (tipo === 'publica') return 1;
  if (tipo === 'privada') return 2;
  return null;
}

/** Estado vazio — exibe "-" nos cards e gráficos até dados carregarem */
const DADOS_VAZIO: DadosAnaliseMercado = {
  indicadores: [],
  evolucaoAlunos: [],
  distribuicaoEstados: [],
  cidadesPorEstado: {},
  rankingCursos: [],
  instituicoes: [],
  demografia: { genero: [] },
  evolucaoTurmas: [],
  gruposEducacionais: [],
  franquias: [],
  ultimaAtualizacao: '',
  fonte: '',
};

const FILTROS_INICIAIS: FiltrosAnaliseMercado = {
  ano: 2024,
  tipoInstituicao: 'todos',
  estado: null,
  municipio: null,
  instituicaoId: null,
  curso: null,
  franquiaId: null,
  areaConhecimento: null,
  metricasAtivas: ['matriculas'],
};

interface UseAnaliseMercadoReturn {
  dados: DadosAnaliseMercado;
  loading: boolean;
  filtros: FiltrosAnaliseMercado;
  setFiltros: (patch: Partial<FiltrosAnaliseMercado>) => void;
  visaoAtiva: VisaoAtiva;
  setVisaoAtiva: (v: VisaoAtiva) => void;
  anosDisponiveis: number[];
  areasDisponiveis: string[];
  cursosDisponiveis: string[];
  instituicoesDisponiveis: DadosInstituicao[];
  estadosDisponiveis: { uf: string; nome: string }[];
  municipiosDisponiveis: string[];
  forceRefresh: () => void;
}

export function useAnaliseMercado(): UseAnaliseMercadoReturn {
  const [loading, setLoading] = useState(true);
  const [dadosBase, setDadosBase] = useState<DadosAnaliseMercado>(DADOS_VAZIO);
  const [filtros, setFiltrosState] = useState<FiltrosAnaliseMercado>(FILTROS_INICIAIS);
  const [visaoAtiva, setVisaoAtiva] = useState<VisaoAtiva>('alunos');
  const [anosDisp, setAnosDisp] = useState<number[]>([]);
  const [areasDisp, setAreasDisp] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forçar re-fetch (limpa cache localStorage e re-busca)
  const forceRefresh = useCallback(() => {
    invalidarCacheAnaliseMercado();
    setRefreshKey(k => k + 1);
  }, []);

  // ──── Fetch principal: depende de TODOS os filtros da hierarquia ────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const rede = redeToNumber(filtros.tipoInstituicao);
    const { ano, estado, municipio, instituicaoId } = filtros;

    async function carregarDados() {
      try {
        const [dados, anos, areas] = await Promise.all([
          fetchDadosAnaliseMercado(ano, rede, estado, municipio, instituicaoId),
          anosDisp.length > 0 ? Promise.resolve(anosDisp) : fetchAnosDisponiveis(),
          areasDisp.length > 0 ? Promise.resolve(areasDisp) : fetchAreasDisponiveis(),
        ]);

        if (cancelled) return;
        setDadosBase(dados);

        if (anos.length > 0) setAnosDisp(anos);
        if (areas.length > 0) setAreasDisp(areas);
      } catch (err) {
        console.error('[Análise de Mercado] Erro ao buscar dados:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    carregarDados();
    return () => { cancelled = true; };
  }, [filtros.ano, filtros.tipoInstituicao, filtros.estado, filtros.municipio, filtros.instituicaoId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──── Cascading resets na hierarquia ────
  const setFiltros = useCallback((patch: Partial<FiltrosAnaliseMercado>) => {
    setFiltrosState(prev => {
      const next = { ...prev, ...patch };

      // Hierarquia: Ano → Rede → Estado → Município → Instituição → Curso
      // Mudar um nível reseta todos os níveis abaixo
      if ('tipoInstituicao' in patch && patch.tipoInstituicao !== prev.tipoInstituicao) {
        next.estado = null;
        next.municipio = null;
        next.instituicaoId = null;
        next.curso = null;
      } else if ('estado' in patch && patch.estado !== prev.estado) {
        next.municipio = null;
        next.instituicaoId = null;
        next.curso = null;
      } else if ('municipio' in patch && patch.municipio !== prev.municipio) {
        next.instituicaoId = null;
        next.curso = null;
      } else if ('instituicaoId' in patch && patch.instituicaoId !== prev.instituicaoId) {
        next.curso = null;
      }

      // Legacy: área muda → limpa curso
      if ('areaConhecimento' in patch && patch.areaConhecimento !== prev.areaConhecimento) {
        next.curso = null;
      }

      return next;
    });
  }, []);

  // ──── Listas derivadas para dropdowns ────

  const anosDisponiveis = useMemo(() => {
    if (anosDisp.length > 0) return anosDisp;
    return dadosBase.evolucaoAlunos.map(e => e.ano);
  }, [anosDisp, dadosBase]);

  const estadosDisponiveis = useMemo(() => {
    return dadosBase.distribuicaoEstados
      .map(e => ({ uf: e.uf, nome: e.nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [dadosBase.distribuicaoEstados]);

  const municipiosDisponiveis = useMemo(() => {
    if (!filtros.estado) return [];
    const cidades = dadosBase.cidadesPorEstado[filtros.estado];
    if (!cidades) return [];
    return cidades.map(c => c.nome).sort();
  }, [filtros.estado, dadosBase.cidadesPorEstado]);

  const instituicoesDisponiveis = useMemo(() => {
    return dadosBase.instituicoes;
  }, [dadosBase.instituicoes]);

  const areasDisponiveis = useMemo(() => {
    if (areasDisp.length > 0) return areasDisp;
    const areas = new Set(dadosBase.rankingCursos.map(c => c.area));
    return Array.from(areas).sort();
  }, [areasDisp, dadosBase]);

  const cursosDisponiveis = useMemo(() => {
    let cursos = dadosBase.rankingCursos;
    if (filtros.areaConhecimento) {
      cursos = cursos.filter(c => c.area === filtros.areaConhecimento);
    }
    return cursos.map(c => c.nome).sort();
  }, [dadosBase, filtros.areaConhecimento]);

  // ──── Dados processados (filtragem client-side) ────
  const dados = useMemo(() => {
    let resultado = { ...dadosBase };

    // Filtrar ranking de cursos por área e/ou curso selecionado
    let cursosFiltrados = dadosBase.rankingCursos;
    if (filtros.areaConhecimento) {
      cursosFiltrados = cursosFiltrados.filter(c => c.area === filtros.areaConhecimento);
    }
    if (filtros.curso) {
      cursosFiltrados = cursosFiltrados.filter(c => c.nome === filtros.curso);
    }
    if (filtros.areaConhecimento || filtros.curso) {
      resultado = { ...resultado, rankingCursos: cursosFiltrados };
    }

    // Gerar dados da franquia
    if (filtros.franquiaId) {
      const franquia = dadosBase.franquias.find(f => f.id === filtros.franquiaId);
      if (franquia) {
        const totalBrasilMat = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.matriculas, 0);
        const totalBrasilConc = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.concluintes, 0);
        const totalBrasilTurmas = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.turmas, 0);

        const fatorFranquia = 0.35;
        const turmasLocal = Math.round(totalBrasilTurmas * fatorFranquia / dadosBase.franquias.length);
        const matriculasLocal = Math.round(totalBrasilMat * fatorFranquia / dadosBase.franquias.length);
        const concluintesLocal = Math.round(totalBrasilConc * fatorFranquia / dadosBase.franquias.length);
        const carteiraAtual = Math.round(turmasLocal * 0.12);

        const dadosFranquia: DadosFranquia = {
          franquia,
          matriculasLocal,
          concluintesLocal,
          turmasLocal,
          participacaoTerritorio: ((carteiraAtual / turmasLocal) * 100),
          gapOportunidade: turmasLocal - carteiraAtual,
          carteiraAtual,
          comparativoBrasil: {
            matriculasBrasil: totalBrasilMat,
            concluintesBrasil: totalBrasilConc,
            turmasBrasil: totalBrasilTurmas,
            percentualDoTotal: (turmasLocal / totalBrasilTurmas) * 100,
          },
        };

        resultado = { ...resultado, dadosFranquia };
      }
    }

    return resultado;
  }, [dadosBase, filtros]);

  return {
    dados,
    loading,
    filtros,
    setFiltros,
    visaoAtiva,
    setVisaoAtiva,
    anosDisponiveis,
    areasDisponiveis,
    cursosDisponiveis,
    instituicoesDisponiveis,
    estadosDisponiveis,
    municipiosDisponiveis,
    forceRefresh,
  };
}
