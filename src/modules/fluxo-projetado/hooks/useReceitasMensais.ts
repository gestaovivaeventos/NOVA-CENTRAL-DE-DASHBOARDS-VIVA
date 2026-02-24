/**
 * Hook: useReceitasMensais
 * Busca dados de receitas mensais agrupadas da API
 */

import { useState, useEffect, useCallback } from 'react';
import { ReceitaMensalAgrupada } from '../components/ReceitasMensaisAgrupadas';

interface TotaisReceitasMensais {
  totalGeral: number;
  totalAntecipacao: number;
  totalUltimaParcela: number;
  totalDemais: number;
}

interface UseReceitasMensaisResult {
  receitas: ReceitaMensalAgrupada[];
  totais: TotaisReceitasMensais | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReceitasMensais(franquia: string): UseReceitasMensaisResult {
  const [receitas, setReceitas] = useState<ReceitaMensalAgrupada[]>([]);
  const [totais, setTotais] = useState<TotaisReceitasMensais | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!franquia) {
      setReceitas([]);
      setTotais(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/fluxo-projetado/receitas-mensais?franquia=${encodeURIComponent(franquia)}`
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Erro desconhecido');
      }

      setReceitas(json.data.receitas || []);
      setTotais(json.data.totais || null);
    } catch (err: any) {
      console.error('[useReceitasMensais] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
      setReceitas([]);
      setTotais(null);
    } finally {
      setLoading(false);
    }
  }, [franquia]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    receitas,
    totais,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useReceitasMensais;
