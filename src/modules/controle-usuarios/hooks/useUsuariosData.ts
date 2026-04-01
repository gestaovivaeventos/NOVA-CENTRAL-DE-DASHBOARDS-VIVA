/**
 * Hook para buscar dados de usuários e senhas
 */

import { useState, useEffect, useCallback } from 'react';
import type { UsuarioRow } from '../types';

interface UseUsuariosDataReturn {
  data: UsuarioRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUsuariosData(): UseUsuariosDataReturn {
  const [data, setData] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = forceRefresh
        ? '/api/controle-usuarios/data?refresh=true'
        : '/api/controle-usuarios/data';

      const response = await fetch(url);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Erro ao buscar dados');
      }

      const json = await response.json();
      setData(json.usuarios || []);
    } catch (err: any) {
      console.error('[useUsuariosData] Erro:', err.message);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { data, loading, error, refetch };
}
