/**
 * Hook: useFluxoRealizado
 * Busca dados de fundos do fluxo realizado da API
 */

import { useState, useEffect, useCallback } from 'react';
import { FundoFee } from '../components/RecebimentoFeeFundo';

interface TotaisFluxoRealizado {
  totalFundos: number;
  valorFeeTotal: number;
  antecipacaoRecebidaTotal: number;
  faltaReceberTotal: number;
  fundosComSaqueDisponivel: number;
}

interface UseFluxoRealizadoResult {
  fundos: FundoFee[];
  totais: TotaisFluxoRealizado | null;
  percentualAntecipacao: number;
  diasBaileAntecipar: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFluxoRealizado(franquia: string): UseFluxoRealizadoResult {
  const [fundos, setFundos] = useState<FundoFee[]>([]);
  const [totais, setTotais] = useState<TotaisFluxoRealizado | null>(null);
  const [percentualAntecipacao, setPercentualAntecipacao] = useState<number>(0);
  const [diasBaileAntecipar, setDiasBaileAntecipar] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!franquia) {
      setFundos([]);
      setTotais(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/fluxo-projetado/fluxo-realizado?franquia=${encodeURIComponent(franquia)}`
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.error || 'Erro desconhecido');
      }

      setFundos(json.data.fundos || []);
      setTotais(json.data.totais || null);
      setPercentualAntecipacao(json.data.percentualAntecipacao || 0);
      setDiasBaileAntecipar(json.data.diasBaileAntecipar || 0);
    } catch (err: any) {
      console.error('[useFluxoRealizado] Erro:', err);
      setError(err.message || 'Erro ao carregar dados');
      setFundos([]);
      setTotais(null);
      setPercentualAntecipacao(0);
      setDiasBaileAntecipar(0);
    } finally {
      setLoading(false);
    }
  }, [franquia]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    fundos,
    totais,
    percentualAntecipacao,
    diasBaileAntecipar,
    loading,
    error,
    refetch: fetchData,
  };
}

export default useFluxoRealizado;
