/**
 * Hook para buscar a lista de módulos dinamicamente da API
 * Retorna os nomes das pastas em src/modules
 */

import { useState, useEffect } from 'react';
import { MODULOS_CENTRAL } from '../types';

export function useModulos() {
  const [modulos, setModulos] = useState<string[]>([...MODULOS_CENTRAL]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchModulos() {
      try {
        const res = await fetch('/api/branches/modules');
        if (!res.ok) throw new Error('Erro ao buscar módulos');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.modules)) {
          setModulos(data.modules);
        }
      } catch (err) {
        console.warn('Falha ao buscar módulos dinâmicos, usando lista estática:', err);
        // Mantém a lista estática como fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchModulos();
    return () => { cancelled = true; };
  }, []);

  return { modulos, loading };
}
