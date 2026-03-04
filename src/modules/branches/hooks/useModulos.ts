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
          // Mescla a lista da API com a lista estática para garantir
          // que módulos conhecidos nunca desapareçam (ex: fluxo-projetado)
          const merged = Array.from(
            new Set([...MODULOS_CENTRAL, ...data.modules])
          ).sort();
          setModulos(merged);
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
