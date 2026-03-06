/**
 * Hook useIndicadoresRede
 * Busca resultados dos indicadores PEX, metas e VVR de vendas das franquias ativas
 */

import { useState, useEffect, useCallback } from 'react';
import { MetaIndicadorUnidade } from '../types';

interface UseIndicadoresRedeReturn {
  resultados: any[];
  metas: MetaIndicadorUnidade[];
  vendasVVR: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useIndicadoresRede(): UseIndicadoresRedeReturn {
  const [resultados, setResultados] = useState<any[]>([]);
  const [metas, setMetas] = useState<MetaIndicadorUnidade[]>([]);
  const [vendasVVR, setVendasVVR] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/gestao-rede/indicadores');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar indicadores');
      }

      setResultados(result.resultados || []);
      setMetas(result.metas || []);
      setVendasVVR(result.vendasVVR || {});
    } catch (err) {
      console.error('[useIndicadoresRede] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setResultados([]);
      setMetas([]);
      setVendasVVR({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    resultados,
    metas,
    vendasVVR,
    isLoading,
    error,
    refetch: fetchData,
  };
}
