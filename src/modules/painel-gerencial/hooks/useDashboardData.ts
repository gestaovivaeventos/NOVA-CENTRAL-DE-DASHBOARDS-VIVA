/**
 * Hook para buscar dados do Painel Gerencial
 */

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, GerencialApiResponse } from '../types';
import { getCompetenciaAtual } from '../utils';

interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  selectedCompetencia: string;
  changeCompetencia: (competencia: string) => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetencia, setSelectedCompetencia] = useState(getCompetenciaAtual());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/painel-gerencial/data?competencia=${encodeURIComponent(selectedCompetencia)}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do painel gerencial');
      }

      const result: GerencialApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [selectedCompetencia]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeCompetencia = (competencia: string) => {
    setSelectedCompetencia(competencia);
  };

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData, 
    selectedCompetencia, 
    changeCompetencia 
  };
}

export default useDashboardData;
