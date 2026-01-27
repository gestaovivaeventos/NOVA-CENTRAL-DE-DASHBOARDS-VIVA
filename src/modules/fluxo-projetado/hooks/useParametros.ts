/**
 * Hook para gerenciar os parâmetros do Fluxo Projetado
 */

import { useState, useEffect, useCallback } from 'react';
import { ParametrosFranquia } from '../components/TabelaParametros';

interface UseParametrosReturn {
  parametros: ParametrosFranquia[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  salvar: (dados: ParametrosFranquia[]) => Promise<boolean>;
  salvando: boolean;
}

export function useParametros(): UseParametrosReturn {
  const [parametros, setParametros] = useState<ParametrosFranquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchParametros = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/fluxo-projetado/parametros');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar parâmetros');
      }

      setParametros(result.data);
    } catch (err) {
      console.error('[useParametros] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const salvar = useCallback(async (dados: ParametrosFranquia[]): Promise<boolean> => {
    setSalvando(true);
    setError(null);

    try {
      const response = await fetch('/api/fluxo-projetado/parametros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parametros: dados }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar parâmetros');
      }

      setParametros(dados);
      return true;
    } catch (err) {
      console.error('[useParametros] Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
      return false;
    } finally {
      setSalvando(false);
    }
  }, []);

  useEffect(() => {
    fetchParametros();
  }, [fetchParametros]);

  return {
    parametros,
    loading,
    error,
    refetch: fetchParametros,
    salvar,
    salvando,
  };
}
