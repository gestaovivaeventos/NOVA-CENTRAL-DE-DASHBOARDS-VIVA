/**
 * Hook para buscar e gerenciar dados de branches/releases
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Release, Branch } from '../types';
import { parseSheetRows } from '../utils';

interface UseBranchesDataReturn {
  releases: Release[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

export function useBranchesData(): UseBranchesDataReturn {
  const [releases, setReleases] = useState<Release[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isFetching = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh ? '/api/branches/data?refresh=true' : '/api/branches/data';
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao buscar dados: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      const { releases: parsedReleases, branches: parsedBranches } = parseSheetRows(rows);

      setReleases(parsedReleases);
      setBranches(parsedBranches);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return { releases, branches, loading, error, refetch, lastUpdate };
}
