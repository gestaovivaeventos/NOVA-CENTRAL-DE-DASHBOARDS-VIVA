/**
 * Hook para histórico mensal de PEX por franquia (BASE GESTAO REDE).
 */

import { useState, useEffect, useCallback } from 'react';
import { SaudeFranquia } from '../types';

export interface HistoricoMensalItem {
  nm_unidade: string;
  data: string;
  mes: number;
  ano: number;
  pontuacao_pex: number;
  saude: SaudeFranquia;
}

interface Return {
  historico: HistoricoMensalItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHistoricoMensalPex(): Return {
  const [historico, setHistorico] = useState<HistoricoMensalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/gestao-rede/historico-mensal');
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Erro ao buscar histórico');
      setHistorico(result.data || []);
    } catch (err) {
      console.error('[useHistoricoMensalPex] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setHistorico([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { historico, isLoading, error, refetch: fetchData };
}

export default useHistoricoMensalPex;
