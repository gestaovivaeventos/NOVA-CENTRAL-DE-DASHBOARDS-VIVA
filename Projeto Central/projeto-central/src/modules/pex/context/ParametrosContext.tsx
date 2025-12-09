/**
 * Context para cache de dados de Parâmetros do PEX
 * Busca dados uma vez e compartilha entre navegações
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

interface UnidadeConsultor {
  unidade: string;
  consultor: string;
}

interface UnidadeCluster {
  unidade: string;
  cluster: string;
}

interface IndicadorPeso {
  indicador: string;
  quarter1: string;
  quarter2: string;
  quarter3: string;
  quarter4: string;
}

interface MetaCluster {
  cluster: string;
  vvr: string;
  percentualAtigimentoMac: string;
  percentualEndividamento: string;
  nps: string;
  percentualMcEntrega: string;
  enps: string;
  conformidade: string;
}

interface BonusUnidade {
  unidade: string;
  quarter1: string;
  quarter2: string;
  quarter3: string;
  quarter4: string;
}

interface ParametrosData {
  consultores: UnidadeConsultor[];
  consultoresAtivos: string[];
  clusters: UnidadeCluster[];
  clustersAtivos: string[];
  pesos: IndicadorPeso[];
  metas: MetaCluster[];
  clustersDisponiveis: string[];
  bonus: BonusUnidade[];
}

interface ParametrosContextType {
  data: ParametrosData;
  loading: {
    consultores: boolean;
    clusters: boolean;
    pesos: boolean;
    metas: boolean;
    bonus: boolean;
  };
  errors: {
    consultores: string | null;
    clusters: string | null;
    pesos: string | null;
    metas: string | null;
    bonus: string | null;
  };
  hasFetched: boolean;
  fetchAll: () => Promise<void>;
  forceRefetchAll: () => Promise<void>;
  refetchConsultores: () => Promise<void>;
  refetchClusters: () => Promise<void>;
  refetchPesos: () => Promise<void>;
  refetchMetas: () => Promise<void>;
  refetchBonus: () => Promise<void>;
  updateData: (key: keyof ParametrosData, value: any) => void;
  invalidateCache: () => void;
}

const defaultData: ParametrosData = {
  consultores: [],
  consultoresAtivos: [],
  clusters: [],
  clustersAtivos: [],
  pesos: [],
  metas: [],
  clustersDisponiveis: [],
  bonus: [],
};

const ParametrosContext = createContext<ParametrosContextType | undefined>(undefined);

// Funções auxiliares de processamento
const formatarPeso = (valor: any): string => {
  if (valor === undefined || valor === null || valor === '') return '0';
  return String(valor).replace(',', '.');
};

const formatarValorMeta = (valor: any): string => {
  if (valor === undefined || valor === null || valor === '') return '0';
  let valorStr = String(valor);
  valorStr = valorStr.replace(/R\$\s*/g, '');
  valorStr = valorStr.replace(/%/g, '');
  valorStr = valorStr.replace(/\./g, '');
  valorStr = valorStr.replace(',', '.');
  valorStr = valorStr.trim();
  if (valorStr === '' || isNaN(parseFloat(valorStr))) return '0';
  return valorStr;
};

export function ParametrosProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ParametrosData>(defaultData);
  const [hasFetched, setHasFetched] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [loading, setLoading] = useState({
    consultores: false,
    clusters: false,
    pesos: false,
    metas: false,
    bonus: false,
  });
  const [errors, setErrors] = useState({
    consultores: null as string | null,
    clusters: null as string | null,
    pesos: null as string | null,
    metas: null as string | null,
    bonus: null as string | null,
  });

  const fetchConsultores = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(prev => ({ ...prev, consultores: true }));
    try {
      // Adicionar parâmetro forceRefresh para invalidar cache do servidor
      const url = forceRefresh ? '/api/pex/consultores?forceRefresh=true' : '/api/pex/consultores';
      const response = await fetch(url);
      if (response.ok) {
        const dados = await response.json();
        
        if (dados.length > 0) {
          const headers = dados[0];
          const rows = dados.slice(1);
          
          const unidadeIdx = headers.findIndex((h: string) => h === 'nm_unidade');
          const consultorIdx = headers.findIndex((h: string) => h === 'Consultor');
          const consultoresAtivosIdx = headers.findIndex((h: string) => h === 'Consultores ativos');
          
          const unidades: UnidadeConsultor[] = rows
            .filter((row: any[]) => row[unidadeIdx])
            .map((row: any[]) => ({
              unidade: row[unidadeIdx] || '',
              consultor: row[consultorIdx] || ''
            }));
          
          const consultoresSet = new Set<string>();
          rows.forEach((row: any[]) => {
            const consultoresCell = row[consultoresAtivosIdx];
            if (consultoresCell) {
              consultoresCell.split('\n')
                .map((c: string) => c.trim())
                .filter((c: string) => c.length > 0)
                .forEach((c: string) => consultoresSet.add(c));
            }
          });
          
          setData(prev => ({
            ...prev,
            consultores: unidades,
            consultoresAtivos: Array.from(consultoresSet),
          }));
        }
        setErrors(prev => ({ ...prev, consultores: null }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, consultores: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, consultores: false }));
    }
  }, []);

  const fetchClusters = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(prev => ({ ...prev, clusters: true }));
    try {
      // Adicionar parâmetro forceRefresh para invalidar cache do servidor
      const url = forceRefresh ? '/api/pex/clusters?forceRefresh=true' : '/api/pex/clusters';
      const response = await fetch(url);
      if (response.ok) {
        const dados = await response.json();
        
        if (dados.length > 0) {
          const headers = dados[0];
          const rows = dados.slice(1);
          
          console.log('[ParametrosContext] Headers clusters:', headers);
          
          const unidadeIdx = headers.findIndex((h: string) => 
            h && (h.toLowerCase() === 'nm_unidade' || h.toLowerCase() === 'unidade')
          );
          // Busca por "Cluster" ignorando case e espaços
          const clusterIdx = headers.findIndex((h: string) => 
            h && h.toLowerCase().trim() === 'cluster'
          );
          const clustersAtivosIdx = headers.findIndex((h: string) => 
            h && h.toLowerCase().includes('cluster') && h.toLowerCase().includes('ativo')
          );
          
          console.log('[ParametrosContext] Índices - unidade:', unidadeIdx, 'cluster:', clusterIdx, 'clustersAtivos:', clustersAtivosIdx);
          
          // Debug: mostrar primeiras linhas
          if (rows.length > 0) {
            console.log('[ParametrosContext] Primeira linha:', rows[0]);
            console.log('[ParametrosContext] Cluster da primeira linha:', rows[0][clusterIdx]);
          }
          
          const unidades: UnidadeCluster[] = rows
            .filter((row: any[]) => row[unidadeIdx])
            .map((row: any[]) => ({
              unidade: row[unidadeIdx] || '',
              cluster: row[clusterIdx] || ''
            }));
          
          console.log('[ParametrosContext] Unidades com clusters:', unidades.slice(0, 3));
          
          // Extrair clusters únicos diretamente da coluna Cluster
          const clustersSet = new Set<string>();
          rows.forEach((row: any[]) => {
            const clusterValue = row[clusterIdx];
            if (clusterValue && typeof clusterValue === 'string' && clusterValue.trim()) {
              clustersSet.add(clusterValue.trim());
            }
          });
          
          console.log('[ParametrosContext] Clusters disponíveis:', Array.from(clustersSet));
          
          setData(prev => ({
            ...prev,
            clusters: unidades,
            clustersAtivos: Array.from(clustersSet).sort(),
          }));
        }
        setErrors(prev => ({ ...prev, clusters: null }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, clusters: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, clusters: false }));
    }
  }, []);

  const fetchPesos = useCallback(async () => {
    setLoading(prev => ({ ...prev, pesos: true }));
    try {
      const response = await fetch('/api/pex/pesos');
      if (response.ok) {
        const dados = await response.json();
        
        if (dados.length > 0) {
          const rows = dados.slice(1);
          
          const indicadores: IndicadorPeso[] = rows
            .filter((row: any[]) => row[0])
            .map((row: any[]) => ({
              indicador: row[0] || '',
              quarter1: formatarPeso(row[1]),
              quarter2: formatarPeso(row[2]),
              quarter3: formatarPeso(row[3]),
              quarter4: formatarPeso(row[4])
            }));
          
          setData(prev => ({ ...prev, pesos: indicadores }));
        }
        setErrors(prev => ({ ...prev, pesos: null }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, pesos: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, pesos: false }));
    }
  }, []);

  const fetchMetas = useCallback(async () => {
    setLoading(prev => ({ ...prev, metas: true }));
    try {
      const response = await fetch('/api/pex/metas');
      if (response.ok) {
        const dados = await response.json();
        
        if (dados.length > 0) {
          const rows = dados.slice(1);
          
          const metas: MetaCluster[] = rows
            .filter((row: any[]) => row[0])
            .map((row: any[]) => ({
              cluster: row[0] || '',
              vvr: formatarValorMeta(row[1]),
              percentualAtigimentoMac: formatarValorMeta(row[2]),
              percentualEndividamento: formatarValorMeta(row[3]),
              nps: formatarValorMeta(row[4]),
              percentualMcEntrega: formatarValorMeta(row[5]),
              enps: formatarValorMeta(row[6]),
              conformidade: formatarValorMeta(row[7])
            }));
          
          const clustersDisponiveis = metas.map(m => m.cluster);
          
          setData(prev => ({ ...prev, metas, clustersDisponiveis }));
        }
        setErrors(prev => ({ ...prev, metas: null }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, metas: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, metas: false }));
    }
  }, []);

  const fetchBonus = useCallback(async () => {
    setLoading(prev => ({ ...prev, bonus: true }));
    try {
      const response = await fetch('/api/pex/bonus');
      if (response.ok) {
        const dados = await response.json();
        
        if (dados && dados.length > 1) {
          const bonusPorUnidade = new Map<string, { [key: string]: string }>();
          
          for (let i = 1; i < dados.length; i++) {
            const row = dados[i];
            const unidade = row[0];
            const bonusAtual = row[3] || '0';
            const quarter = row[21];
            
            if (!unidade || !quarter) continue;
            
            if (!bonusPorUnidade.has(unidade)) {
              bonusPorUnidade.set(unidade, { '1': '0', '2': '0', '3': '0', '4': '0' });
            }
            
            bonusPorUnidade.get(unidade)![quarter] = bonusAtual;
          }
          
          const bonusArray: BonusUnidade[] = Array.from(bonusPorUnidade.entries())
            .map(([unidade, quarters]) => ({
              unidade,
              quarter1: quarters['1'],
              quarter2: quarters['2'],
              quarter3: quarters['3'],
              quarter4: quarters['4']
            }))
            .sort((a, b) => a.unidade.localeCompare(b.unidade));
          
          setData(prev => ({ ...prev, bonus: bonusArray }));
        }
        setErrors(prev => ({ ...prev, bonus: null }));
      }
    } catch (err: any) {
      setErrors(prev => ({ ...prev, bonus: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, bonus: false }));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (hasFetched || isFetching) {
      console.log('[ParametrosContext] Dados já em cache ou fetch em andamento');
      return;
    }

    setIsFetching(true);
    console.log('[ParametrosContext] Buscando todos os dados de parâmetros...');
    
    await Promise.all([
      fetchConsultores(),
      fetchClusters(),
      fetchPesos(),
      fetchMetas(),
      fetchBonus(),
    ]);

    setHasFetched(true);
    setIsFetching(false);
    console.log('[ParametrosContext] Todos os dados carregados em cache');
  }, [hasFetched, isFetching, fetchConsultores, fetchClusters, fetchPesos, fetchMetas, fetchBonus]);

  // Força busca de todos os dados ignorando cache (tanto cliente quanto servidor)
  const forceRefetchAll = useCallback(async () => {
    if (isFetching) {
      console.log('[ParametrosContext] Fetch já em andamento');
      return;
    }

    setIsFetching(true);
    console.log('[ParametrosContext] Forçando refetch de todos os dados (ignorando cache do servidor)...');
    
    await Promise.all([
      fetchConsultores(true),  // forceRefresh=true para invalidar cache do servidor
      fetchClusters(true),     // forceRefresh=true para invalidar cache do servidor
      fetchPesos(),
      fetchMetas(),
      fetchBonus(),
    ]);

    setHasFetched(true);
    setIsFetching(false);
    console.log('[ParametrosContext] Dados atualizados do banco');
  }, [isFetching, fetchConsultores, fetchClusters, fetchPesos, fetchMetas, fetchBonus]);

  // Invalida o cache para forçar nova busca
  const invalidateCache = useCallback(() => {
    console.log('[ParametrosContext] Cache invalidado');
    setHasFetched(false);
  }, []);

  const updateData = useCallback((key: keyof ParametrosData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const value: ParametrosContextType = {
    data,
    loading,
    errors,
    hasFetched,
    fetchAll,
    forceRefetchAll,
    refetchConsultores: fetchConsultores,
    refetchClusters: fetchClusters,
    refetchPesos: fetchPesos,
    refetchMetas: fetchMetas,
    refetchBonus: fetchBonus,
    updateData,
    invalidateCache,
  };

  return (
    <ParametrosContext.Provider value={value}>
      {children}
    </ParametrosContext.Provider>
  );
}

export function useParametrosData(): ParametrosContextType {
  const context = useContext(ParametrosContext);

  if (context === undefined) {
    throw new Error('useParametrosData deve ser usado dentro de um ParametrosProvider');
  }

  // Auto-fetch quando o hook é usado pela primeira vez
  useEffect(() => {
    if (!context.hasFetched) {
      context.fetchAll();
    }
  }, [context]);

  return context;
}
