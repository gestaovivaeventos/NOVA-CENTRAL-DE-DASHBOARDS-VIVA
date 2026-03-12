import { useState, useEffect, useCallback } from 'react';
import { ModuloConfig } from '../types';

/**
 * Hook para buscar e gerenciar os módulos configurados na planilha
 */
export function useControleModulos() {
  const [modulos, setModulos] = useState<ModuloConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModulos = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const url = forceRefresh
        ? '/api/controle-modulos/data?refresh=true'
        : '/api/controle-modulos/data';

      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao buscar módulos');

      const data = await res.json();
      setModulos(data.modulos || []);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const updateModulo = useCallback(
    async (moduloId: string, field: string, value: string) => {
      try {
        const res = await fetch('/api/controle-modulos/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduloId, field, value }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao atualizar');
        }

        // Recarregar dados após atualização
        await fetchModulos(true);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [fetchModulos]
  );

  const createModulo = useCallback(
    async (data: Record<string, any>) => {
      try {
        const res = await fetch('/api/controle-modulos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.error || 'Erro ao criar módulo');
        }

        await fetchModulos(true);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [fetchModulos]
  );

  return {
    modulos,
    loading,
    error,
    refetch: fetchModulos,
    updateModulo,
    createModulo,
  };
}
