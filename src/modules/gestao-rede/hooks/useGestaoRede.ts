/**
 * Hook useGestaoRede
 * Busca e gerencia dados da Gestão da Rede
 */

import { useState, useEffect, useCallback } from 'react';
import { Franquia, GestaoRedeApiResponse } from '../types';

interface UseGestaoRedeReturn {
  franquias: Franquia[];
  dataReferencia: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGestaoRede(): UseGestaoRedeReturn {
  const [franquias, setFranquias] = useState<Franquia[]>([]);
  const [dataReferencia, setDataReferencia] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/gestao-rede/data');
      const result: GestaoRedeApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erro ao buscar dados');
      }
      
      setFranquias(result.data || []);
      setDataReferencia(result.dataReferencia || '');
      
    } catch (err) {
      console.error('[useGestaoRede] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setFranquias([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    franquias,
    dataReferencia,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useGestaoRede;
