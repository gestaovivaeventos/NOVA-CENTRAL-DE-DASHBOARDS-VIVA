/**
 * Context para cache de dados do Google Sheets
 * Busca dados uma vez e compartilha entre todas as páginas
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

interface FranquiaRaw {
  [key: string]: string;
}

interface SheetsDataContextType {
  dados: FranquiaRaw[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastFetched: Date | null;
}

const SheetsDataContext = createContext<SheetsDataContextType | undefined>(undefined);

// Tempo de cache em milissegundos (5 minutos)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Converte array de arrays em array de objetos
 */
function processarDados(dados: any[][]): FranquiaRaw[] {
  if (!dados || dados.length < 2) return [];

  const headers = dados[0];
  const rows = dados.slice(1);

  return rows.map(row => {
    const obj: FranquiaRaw = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

interface SheetsDataProviderProps {
  children: ReactNode;
}

export function SheetsDataProvider({ children }: SheetsDataProviderProps) {
  const [dados, setDados] = useState<FranquiaRaw[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchData = useCallback(async (force: boolean = false) => {
    // Se já tem dados em cache e não está forçando, não busca novamente
    if (!force && hasFetched && lastFetched) {
      const timeSinceLastFetch = Date.now() - lastFetched.getTime();
      if (timeSinceLastFetch < CACHE_DURATION) {
        console.log('[SheetsDataContext] Usando dados em cache');
        return;
      }
    }

    // Evitar múltiplas requisições simultâneas
    if (loading) {
      console.log('[SheetsDataContext] Requisição já em andamento');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[SheetsDataContext] Buscando dados do Google Sheets...');
      const response = await fetch('/api/sheets');

      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.statusText}`);
      }

      const rawData: any[][] = await response.json();
      const dadosProcessados = processarDados(rawData);

      setDados(dadosProcessados);
      setLastFetched(new Date());
      setHasFetched(true);
      console.log(`[SheetsDataContext] Dados carregados: ${dadosProcessados.length} registros`);

    } catch (err: any) {
      console.error('[SheetsDataContext] Erro:', err);
      setError(err.message || 'Erro desconhecido ao buscar dados');
    } finally {
      setLoading(false);
    }
  }, [loading, hasFetched, lastFetched]);

  // Função para forçar atualização
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const value: SheetsDataContextType = {
    dados,
    loading,
    error,
    refetch,
    lastFetched,
  };

  return (
    <SheetsDataContext.Provider value={value}>
      {children}
    </SheetsDataContext.Provider>
  );
}

/**
 * Hook para usar os dados do Sheets com cache
 * Busca automaticamente na primeira vez que é usado
 */
export function useSheetsDataCached(): SheetsDataContextType {
  const context = useContext(SheetsDataContext);

  if (context === undefined) {
    throw new Error('useSheetsDataCached deve ser usado dentro de um SheetsDataProvider');
  }

  // Buscar dados automaticamente se ainda não foram buscados
  useEffect(() => {
    if (context.dados.length === 0 && !context.loading && !context.error) {
      context.refetch();
    }
  }, [context]);

  return context;
}

/**
 * Hook compatível com a interface antiga (para migração gradual)
 */
export function useSheetsData() {
  const { dados, loading, error, refetch } = useSheetsDataCached();
  
  return {
    dados,
    loading,
    error,
    refetch,
  };
}
