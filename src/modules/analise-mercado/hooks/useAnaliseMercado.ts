/**
 * useAnaliseMercado — Hook principal do módulo Análise de Mercado
 * Gerencia filtros, dados mockados e lógica de franquia
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  DadosAnaliseMercado,
  FiltrosAnaliseMercado,
  VisaoAtiva,
  DadosFranquia,
} from '../types';
import { mockAnaliseMercado } from '../utils/mock-data';

const FILTROS_INICIAIS: FiltrosAnaliseMercado = {
  ano: 2025,
  tipoInstituicao: 'todos',
  franquiaId: null,
  estado: null,
  areaConhecimento: null,
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
}

export function useAnaliseMercado(): UseAnaliseMercadoReturn {
  const [loading, setLoading] = useState(true);
  const [dadosBase] = useState<DadosAnaliseMercado>(mockAnaliseMercado);
  const [filtros, setFiltrosState] = useState<FiltrosAnaliseMercado>(FILTROS_INICIAIS);
  const [visaoAtiva, setVisaoAtiva] = useState<VisaoAtiva>('alunos');

  // Simular carregamento dos dados de mercado
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar filtros (merge parcial)
  const setFiltros = useCallback((patch: Partial<FiltrosAnaliseMercado>) => {
    setFiltrosState(prev => ({ ...prev, ...patch }));
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

  // Dados processados (filtragem + franquia)
  const dados = useMemo(() => {
    let resultado = { ...dadosBase };

    // Filtrar ranking de cursos por área
    if (filtros.areaConhecimento) {
      resultado = {
        ...resultado,
        rankingCursos: dadosBase.rankingCursos.filter(
          c => c.area === filtros.areaConhecimento
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
  };
}
