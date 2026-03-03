/**
 * useAnaliseMercado — Hook principal do módulo Análise de Mercado
 * Gerencia filtros, dados da API e lógica de franquia
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  DadosAnaliseMercado,
  FiltrosAnaliseMercado,
  VisaoAtiva,
  DadosFranquia,
  DadosEvolucaoAnual,
  IndicadorCard,
} from '../types';
import { mockAnaliseMercado } from '../utils/mock-data';

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
}

export function useAnaliseMercado(): UseAnaliseMercadoReturn {
  const [loading, setLoading] = useState(true);
  const [dadosBase, setDadosBase] = useState<DadosAnaliseMercado>(mockAnaliseMercado);
  const [filtros, setFiltrosState] = useState<FiltrosAnaliseMercado>(FILTROS_INICIAIS);
  const [visaoAtiva, setVisaoAtiva] = useState<VisaoAtiva>('alunos');
  const [indicadoresReais, setIndicadoresReais] = useState<IndicadorCard[] | null>(null);

  // Buscar dados de evolução da API
  useEffect(() => {
    const fetchEvolucao = async () => {
      try {
        const response = await fetch('/api/analise-mercado/evolucao');
        if (response.ok) {
          const data = await response.json();
          if (data.evolucao && data.evolucao.length > 0) {
            const evolucaoAlunos: DadosEvolucaoAnual[] = data.evolucao.map((item: any) => ({
              ano: item.ano,
              matriculas: item.matriculas,
              concluintes: item.concluintes,
              ingressantes: item.ingressantes,
              presencial: 0,
              ead: 0,
              publica: 0,
              privada: 0,
              genero: { feminino: 0, masculino: 0 },
            }));

            setDadosBase(prev => ({
              ...prev,
              evolucaoAlunos,
            }));
          }
        }
      } catch (error) {
        console.error('[useAnaliseMercado] Erro ao buscar evolução:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvolucao();
  }, []);

  // Buscar indicadores quando filtros mudarem
  useEffect(() => {
    const fetchIndicadores = async () => {
      try {
        const params = new URLSearchParams({
          ano: String(filtros.ano),
          tipo: filtros.tipoInstituicao,
        });
        if (filtros.areaConhecimento) {
          params.append('area', filtros.areaConhecimento);
        }
        
        const response = await fetch(`/api/analise-mercado/indicadores?${params}`);
        if (response.ok) {
          const data = await response.json();
          
          // Criar indicadores com dados reais
          const indicadores: IndicadorCard[] = [
            {
              id: 'mat',
              titulo: 'Matrículas Ativas',
              valor: data.matriculas,
              variacao: data.variacaoMat,
              tendencia: data.variacaoMat > 0 ? 'up' : data.variacaoMat < 0 ? 'down' : 'stable',
              cor: '#3B82F6',
              subtitulo: 'Graduação + Tecnólogo',
            },
            {
              id: 'conc',
              titulo: 'Concluintes/Ano',
              valor: data.concluintes,
              variacao: data.variacaoConc,
              tendencia: data.variacaoConc > 0 ? 'up' : data.variacaoConc < 0 ? 'down' : 'stable',
              cor: '#10B981',
              subtitulo: 'Potenciais Formandos',
            },
            {
              id: 'ing',
              titulo: 'Ingressantes/Ano',
              valor: data.ingressantes,
              variacao: data.variacaoIng,
              tendencia: data.variacaoIng > 0 ? 'up' : data.variacaoIng < 0 ? 'down' : 'stable',
              cor: '#8B5CF6',
              subtitulo: 'Novos alunos',
            },
          ];
          
          setIndicadoresReais(indicadores);
        }
      } catch (error) {
        console.error('[useAnaliseMercado] Erro ao buscar indicadores:', error);
      }
    };

    fetchIndicadores();
  }, [filtros.ano, filtros.tipoInstituicao, filtros.areaConhecimento]);

  // Atualizar filtros (merge parcial — limpa curso se área mudar)
  const setFiltros = useCallback((patch: Partial<FiltrosAnaliseMercado>) => {
    setFiltrosState(prev => {
      const next = { ...prev, ...patch };
      // Se a área mudou, resetar o curso selecionado
      if ('areaConhecimento' in patch && patch.areaConhecimento !== prev.areaConhecimento) {
        next.curso = null;
      }
      return next;
    });
  }, []);

  // Anos disponíveis
  const anosDisponiveis = useMemo(() => {
    return dadosBase.evolucaoAlunos.map(e => e.ano);
  }, [dadosBase]);

  // Áreas disponíveis
  const areasDisponiveis = useMemo(() => {
    const areas = new Set(dadosBase.rankingCursos.map(c => c.area));
    return Array.from(areas).sort();
  }, [dadosBase]);

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

    // Gerar dados da franquia (mockados)
    if (filtros.franquiaId) {
      const franquia = dadosBase.franquias.find(f => f.id === filtros.franquiaId);
      if (franquia) {
        // Dados territoriais simulados
        const totalBrasilMat = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.matriculas, 0);
        const totalBrasilConc = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.concluintes, 0);
        const totalBrasilTurmas = dadosBase.distribuicaoEstados.reduce((sum, e) => sum + e.turmas, 0);

        // Fração simulada
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
          // Manter foco nos estados da franquia para o mapa
          distribuicaoEstados: filtros.estado
            ? resultado.distribuicaoEstados
            : dadosBase.distribuicaoEstados,
        };
      }
    }

    // Usar indicadores reais quando disponíveis
    if (indicadoresReais && indicadoresReais.length > 0) {
      resultado = {
        ...resultado,
        indicadores: indicadoresReais,
      };
    }

    return resultado;
  }, [dadosBase, filtros, indicadoresReais]);

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
  };
}
