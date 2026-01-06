/**
 * Hook para buscar e gerenciar dados de fundos
 * Com cache para evitar re-fetch desnecessário
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Fundo } from '@/modules/vendas/types/vendas.types';
import { parseDate } from '@/modules/vendas/utils/periodo';
import { clientCache, CACHE_KEYS, CACHE_TTL } from '@/modules/vendas/utils/cache';
import { normalizarNomeUnidade } from '@/modules/vendas/utils/calculos';

interface UseFundosDataReturn {
  data: Fundo[];
  fundos: Fundo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Hook para buscar dados de fundos com cache
 */
export function useFundosData(): UseFundosDataReturn {
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isFetching = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Evitar múltiplas chamadas simultâneas
    if (isFetching.current) {
      return;
    }

    // Verificar cache primeiro (a menos que force refresh)
    if (!forceRefresh) {
      const cachedData = clientCache.get<Fundo[]>(CACHE_KEYS.FUNDOS_DATA);
      if (cachedData) {
        setFundos(cachedData);
        setLoading(false);
        return;
      }
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      // Usar API route local
      const url = '/api/vendas/fundos';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados de fundos');
      }

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length < 2) {
        setFundos([]);
        return;
      }

      // Mapear headers
      const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
      
      // Encontrar índices das colunas
      const indices = {
        unidade: headers.indexOf('nm_unidade'),
        idFundo: headers.indexOf('id_fundo'),
        nmFundo: headers.indexOf('nm_fundo'),
        dtContrato: headers.indexOf('dt_contrato'),
        dtCadastro: headers.indexOf('dt_cadastro_fundo'),
        tipoServico: headers.indexOf('tp_servico'),
        instituicao: headers.indexOf('nm_instituicao'),
        cursoFundo: headers.indexOf('curso_fundo'),
        tipoCliente: headers.indexOf('tipo_cliente'),
        dtBaile: headers.indexOf('dt_baile'),
      };

      // Verificar colunas essenciais
      if (indices.unidade === -1 || indices.idFundo === -1 || indices.dtContrato === -1) {
        throw new Error('Colunas essenciais não encontradas na planilha de fundos');
      }

      // Processar dados
      const processedData: Fundo[] = rows.slice(1)
        .map((row: string[]) => {
          const dtContrato = parseDate(row[indices.dtContrato]);
          if (!dtContrato) return null;

          return {
            nm_unidade: normalizarNomeUnidade(row[indices.unidade]) || 'N/A',
            id_fundo: row[indices.idFundo] || 'N/A',
            nm_fundo: indices.nmFundo !== -1 ? row[indices.nmFundo] || 'N/A' : 'N/A',
            dt_contrato: dtContrato,
            dt_cadastro: indices.dtCadastro !== -1 ? parseDate(row[indices.dtCadastro]) : null,
            tipo_servico: indices.tipoServico !== -1 ? row[indices.tipoServico] || 'N/A' : 'N/A',
            instituicao: indices.instituicao !== -1 ? row[indices.instituicao] || 'N/A' : 'N/A',
            dt_baile: indices.dtBaile !== -1 ? parseDate(row[indices.dtBaile]) : null,
            curso_fundo: indices.cursoFundo !== -1 ? row[indices.cursoFundo] || '' : '',
            tipo_cliente: indices.tipoCliente !== -1 ? row[indices.tipoCliente] || 'N/A' : 'N/A',
          } as Fundo;
        })
        .filter(Boolean) as Fundo[];

      // Salvar no cache
      clientCache.set(CACHE_KEYS.FUNDOS_DATA, processedData, CACHE_TTL.MEDIUM);
      
      setFundos(processedData);
      setLastUpdate(new Date());

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar fundos');
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

  return {
    data: fundos,
    fundos,
    loading,
    error,
    refetch,
    lastUpdate,
  };
}

