/**
 * useAnaliseMercado — Hook principal do módulo Análise de Mercado
 * Busca dados reais do Supabase (INEP)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  DadosAnaliseMercado,
  FiltrosAnaliseMercado,
  VisaoAtiva,
  DadosFranquia,
} from '../types';
import {
  fetchDadosAnaliseMercado,
  fetchAnosDisponiveis,
  fetchAreasDisponiveis,
  invalidarCacheAnaliseMercado,
} from '../utils/supabase-queries';

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
  franquiaId: null,
  estado: null,
  areaConhecimento: null,
  curso: null,
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
  forceRefresh: () => void;
}

export function useAnaliseMercado(): UseAnaliseMercadoReturn {
  const [loading, setLoading] = useState(true);
  const [dadosBase, setDadosBase] = useState<DadosAnaliseMercado>(DADOS_VAZIO);
  const [filtros, setFiltrosState] = useState<FiltrosAnaliseMercado>(FILTROS_INICIAIS);
  const [visaoAtiva, setVisaoAtiva] = useState<VisaoAtiva>('alunos');
  const [anosDisp, setAnosDisp] = useState<number[]>([]);
  const [areasDisp, setAreasDisp] = useState<string[]>([]);
  const fetchedAno = useRef<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Forçar re-fetch (limpa cache localStorage e re-busca)
  const forceRefresh = useCallback(() => {
    invalidarCacheAnaliseMercado();
    fetchedAno.current = null;
    setRefreshKey(k => k + 1);
  }, []);

  // Buscar dados do Supabase ao montar e quando ano mudar
  useEffect(() => {
    // Evitar refetch se o ano não mudou
    if (fetchedAno.current === filtros.ano) return;

    let cancelled = false;
    setLoading(true);

    async function carregarDados() {
      try {
        const [dados, anos, areas] = await Promise.all([
          fetchDadosAnaliseMercado(filtros.ano),
          anosDisp.length > 0 ? Promise.resolve(anosDisp) : fetchAnosDisponiveis(),
          areasDisp.length > 0 ? Promise.resolve(areasDisp) : fetchAreasDisponiveis(),
        ]);

        if (cancelled) return;
        setDadosBase(dados);

        if (anos.length > 0) setAnosDisp(anos);
        if (areas.length > 0) setAreasDisp(areas);
        fetchedAno.current = filtros.ano;
      } catch (err) {
        console.error('[Análise de Mercado] Erro ao buscar dados:', err);
        // Manter estado atual (vazio ou dados anteriores)
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    carregarDados();
    return () => { cancelled = true; };
  }, [filtros.ano, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualizar filtros (merge parcial — limpa curso se área mudar)
  const setFiltros = useCallback((patch: Partial<FiltrosAnaliseMercado>) => {
    setFiltrosState(prev => {
      const next = { ...prev, ...patch };
      if ('areaConhecimento' in patch && patch.areaConhecimento !== prev.areaConhecimento) {
        next.curso = null;
      }
      return next;
    });
  }, []);

  // Anos disponíveis
  const anosDisponiveis = useMemo(() => {
    if (anosDisp.length > 0) return anosDisp;
    return dadosBase.evolucaoAlunos.map(e => e.ano);
  }, [anosDisp, dadosBase]);

  // Áreas disponíveis
  const areasDisponiveis = useMemo(() => {
    if (areasDisp.length > 0) return areasDisp;
    const areas = new Set(dadosBase.rankingCursos.map(c => c.area));
    return Array.from(areas).sort();
  }, [areasDisp, dadosBase]);

  // Cursos disponíveis (filtrados por área selecionada)
  const cursosDisponiveis = useMemo(() => {
    let cursos = dadosBase.rankingCursos;
    if (filtros.areaConhecimento) {
      cursos = cursos.filter(c => c.area === filtros.areaConhecimento);
    }
    return cursos.map(c => c.nome).sort();
  }, [dadosBase, filtros.areaConhecimento]);

  // Dados processados (filtragem + franquia)
  const dados = useMemo(() => {
    let resultado = { ...dadosBase };

    // Filtrar ranking de cursos por área e/ou curso
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

    // Filtrar instituições por tipo
    if (filtros.tipoInstituicao !== 'todos') {
      resultado = {
        ...resultado,
        instituicoes: dadosBase.instituicoes.filter(
          inst => inst.tipo === filtros.tipoInstituicao
        ),
      };
    }

    // Filtrar por estado (clicado no mapa)
    if (filtros.estado) {
      resultado = {
        ...resultado,
        distribuicaoEstados: dadosBase.distribuicaoEstados.filter(
          e => e.uf === filtros.estado
        ),
      };
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

        resultado = {
          ...resultado,
          dadosFranquia,
          distribuicaoEstados: filtros.estado
            ? resultado.distribuicaoEstados
            : dadosBase.distribuicaoEstados,
        };
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
    forceRefresh,
  };
}
