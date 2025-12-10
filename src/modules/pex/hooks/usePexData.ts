import { useState, useEffect, useCallback } from 'react';
import { FranquiaRaw } from '../types';
import { useAuth } from '@/context/AuthContext';

interface UsePexDataReturn {
  dados: FranquiaRaw[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar dados PEX do Google Sheets
 * Aplica filtro de permissões automaticamente
 */
export function usePexData(): UsePexDataReturn {
  const [dados, setDados] = useState<FranquiaRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, hasAccessToUnit } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pex/sheets');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados');
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error(result.message || 'Dados inválidos');
      }

      // Processa os dados brutos
      const processedData: FranquiaRaw[] = result.data;

      // Aplica filtro de permissões
      let filteredData = processedData;
      
      if (user && user.accessLevel === 0) {
        // Franqueado: filtra apenas suas unidades
        filteredData = processedData.filter((f) => 
          hasAccessToUnit(f.nome)
        );
      }
      // Níveis 1 e 22: veem todas as franquias

      setDados(filteredData);
    } catch (err) {
      console.error('Erro ao buscar dados PEX:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user, hasAccessToUnit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dados,
    loading,
    error,
    refetch: fetchData,
  };
}

export default usePexData;
