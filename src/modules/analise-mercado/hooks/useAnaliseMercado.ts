/**
 * useAnaliseMercado - Hook para gerenciar dados do módulo Análise de Mercado
 * Utiliza dados mockados para validação de layout
 */

import { useState, useEffect, useMemo } from 'react';
import type { DadosAnaliseMercado, FiltrosAnaliseMercado } from '../types';
import { dadosAnaliseMercadoMockados } from '../utils/mock-data';

interface UseAnaliseMercadoReturn {
  dados: DadosAnaliseMercado;
  loading: boolean;
  error: string | null;
  filtros: FiltrosAnaliseMercado;
  setFiltros: (filtros: FiltrosAnaliseMercado) => void;
  dadosFiltrados: DadosAnaliseMercado;
}

export function useAnaliseMercado(): UseAnaliseMercadoReturn {
  const [dados, setDados] = useState<DadosAnaliseMercado>(dadosAnaliseMercadoMockados);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAnaliseMercado>({});

  // Simular carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setDados(dadosAnaliseMercadoMockados);
      setLoading(false);
    }, 500); // Simula delay de carregamento

    return () => clearTimeout(timer);
  }, []);

  // Dados filtrados baseado nos filtros selecionados
  const dadosFiltrados = useMemo(() => {
    let resultado = { ...dados };

    // Filtrar por ano se especificado
    if (filtros.ano) {
      resultado.evolucao = dados.evolucao.filter(d => d.ano <= filtros.ano!);
      resultado.participacao = dados.participacao.filter(d => d.ano <= filtros.ano!);
    }

    // Filtrar por segmento se especificado
    if (filtros.segmento && filtros.segmento !== 'Todos') {
      resultado.segmentos = dados.segmentos.filter(
        s => s.nome.toLowerCase().includes(filtros.segmento!.toLowerCase())
      );
    }

    return resultado;
  }, [dados, filtros]);

  return {
    dados,
    loading,
    error,
    filtros,
    setFiltros,
    dadosFiltrados,
  };
}
