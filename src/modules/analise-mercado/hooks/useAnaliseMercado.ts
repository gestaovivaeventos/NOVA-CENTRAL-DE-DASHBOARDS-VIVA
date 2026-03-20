/**
 * useAnaliseMercado — Hook principal do módulo Análise de Mercado
 * Busca dados INEP via Google Sheets (5 bases regionais)
 * Hierarquia de filtros: Ano → Estado → Município → Rede → Instituição → Curso
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type {
  DadosAnaliseMercado,
  FiltrosAnaliseMercado,
  VisaoAtiva,
  DadosFranquia,
  DadosInstituicao,
  TipoInstituicao,
  TipoModalidade,
} from '../types';
import {
  fetchDadosAnaliseMercado,
  fetchEvolucaoLazy,
  fetchAnosDisponiveis,
  fetchAreasDisponiveis,
  invalidarCacheAnaliseMercado,
  UF_NOMES,
} from '../utils/sheets-queries';

/** Converter tipoInstituicao (string) → tp_rede (number) para filtro */
function redeToNumber(tipo: TipoInstituicao): number | null {
  if (tipo === 'publica') return 1;
  if (tipo === 'privada') return 2;
  return null;
}

/** Converter modalidade (string) → tp_modalidade_ensino (number) */
function modalidadeToNumber(mod: TipoModalidade): number | null {
  if (mod === 'presencial') return 1;
  if (mod === 'ead') return 2;
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
  modalidade: 'todos',
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
  loadingEvolucao: boolean;
  initialLoading: boolean;
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
  const [loadingEvolucao, setLoadingEvolucao] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
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

  // ──── Fetch principal com debounce: evita fetches cancelados ao mudar filtros rápido ────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Cancelar fetch anterior
    cancelledRef.current = true;

    // Limpar debounce anterior
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setLoading(true);

    debounceRef.current = setTimeout(() => {
      cancelledRef.current = false;
      const thisCancelled = cancelledRef;

      const rede = redeToNumber(filtros.tipoInstituicao);
      const modalidade = modalidadeToNumber(filtros.modalidade);
      const { ano, estado, municipio, instituicaoId, curso } = filtros;

      async function carregarDados() {
        try {
          const [dados, anos, areas] = await Promise.all([
            fetchDadosAnaliseMercado(ano, rede, estado, municipio, instituicaoId, curso, modalidade),
            anosDisp.length > 0 ? Promise.resolve(anosDisp) : fetchAnosDisponiveis(),
            areasDisp.length > 0 ? Promise.resolve(areasDisp) : fetchAreasDisponiveis(),
          ]);

          if (thisCancelled.current) return;
          setDadosBase(dados);
          if (anos.length > 0) setAnosDisp(anos);
          if (areas.length > 0) setAreasDisp(areas);
        } catch (err) {
          console.error('[Análise de Mercado] Erro ao buscar dados:', err);
        } finally {
          if (!thisCancelled.current) {
            setLoading(false);
            setInitialLoading(false);
          }
        }

        // Evolução histórica (todos os anos) em segundo plano — atualiza gráficos
        if (!thisCancelled.current) {
          setLoadingEvolucao(true);
          try {
            const evolucao = await fetchEvolucaoLazy(rede, estado, municipio, instituicaoId, curso, modalidade);
            if (!thisCancelled.current && evolucao.length > 0) {
              setDadosBase(prev => ({
                ...prev,
                evolucaoAlunos: evolucao,
              }));
            }
          } catch (err) {
            console.error('[Análise de Mercado] Erro ao buscar evolução:', err);
          } finally {
            if (!thisCancelled.current) setLoadingEvolucao(false);
          }
        }
      }

      carregarDados();
    }, 300);

    return () => {
      cancelledRef.current = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filtros.ano, filtros.tipoInstituicao, filtros.modalidade, filtros.estado, filtros.municipio, filtros.instituicaoId, filtros.curso, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ──── Cascading resets na hierarquia ────
  const setFiltros = useCallback((patch: Partial<FiltrosAnaliseMercado>) => {
    setFiltrosState(prev => {
      const next = { ...prev, ...patch };

      // Hierarquia: Ano → Estado → Município → Rede → Modalidade → Instituição → Curso
      // Mudar um nível reseta todos os níveis abaixo
      if ('ano' in patch && patch.ano !== prev.ano) {
        next.estado = null;
        next.municipio = null;
        next.tipoInstituicao = 'todos';
        next.modalidade = 'todos';
        next.instituicaoId = null;
        next.curso = null;
      } else if ('estado' in patch && patch.estado !== prev.estado) {
        next.municipio = null;
        next.tipoInstituicao = 'todos';
        next.modalidade = 'todos';
        next.instituicaoId = null;
        next.curso = null;
      } else if ('municipio' in patch && patch.municipio !== prev.municipio) {
        next.tipoInstituicao = 'todos';
        next.modalidade = 'todos';
        next.instituicaoId = null;
        next.curso = null;
      } else if ('tipoInstituicao' in patch && patch.tipoInstituicao !== prev.tipoInstituicao) {
        next.modalidade = 'todos';
        next.instituicaoId = null;
        next.curso = null;
      } else if ('modalidade' in patch && patch.modalidade !== prev.modalidade) {
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

  // Estado vazio carregado uma vez para o dropdown — lista completa dos 27 estados
  // Não deriva de distribuicaoEstados (que pode estar filtrada), garantindo o dropdown sempre funcional
  const estadosDisponiveis = useMemo(() => {
    return Object.entries(UF_NOMES)
      .map(([uf, nome]) => ({ uf, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, []);

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

    // Filtrar instituições pela IES selecionada (sem afetar o dropdown — que usa dadosBase.instituicoes)
    if (filtros.instituicaoId) {
      const instFiltrada = dadosBase.instituicoes.filter(i => i.codIes === filtros.instituicaoId);
      resultado = { ...resultado, instituicoes: instFiltrada };
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
    loadingEvolucao,
    initialLoading,
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
