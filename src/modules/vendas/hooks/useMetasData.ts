/**
 * Hook para buscar e gerenciar dados de metas
 * Com cache para evitar re-fetch desnecessário
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Meta, MetasMap } from '@/modules/vendas/types/vendas.types';
import { clientCache, CACHE_KEYS, CACHE_TTL } from '@/modules/vendas/utils/cache';
import { normalizarNomeUnidade } from '@/modules/vendas/utils/calculos';

interface UseMetasDataReturn {
  data: MetasMap;
  metas: MetasMap;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Hook para buscar dados de metas com cache
 */
export function useMetasData(): UseMetasDataReturn {
  const [metas, setMetas] = useState<MetasMap>(new Map());
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
      const cachedData = clientCache.get<MetasMap>(CACHE_KEYS.METAS_DATA);
      if (cachedData) {
        setMetas(cachedData);
        setLoading(false);
        return;
      }
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      // Usar API route local para evitar CORS
      const url = '/api/vendas/metas';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao buscar dados de metas');
      }

      const data = await response.json();
      const rows = data.values || [];
      
      if (rows.length < 2) {
        setMetas(new Map());
        return;
      }

      // Mapear headers
      const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
      
      // Encontrar índices das colunas
      const indices = {
        unidade: headers.indexOf('nm_unidade'),
        ano: headers.indexOf('ano'),
        mes: headers.indexOf('mês'),
        metaVendas: headers.indexOf('meta vvr_venda'),
        metaPosVendas: headers.indexOf('meta vvr_pos_venda'),
        metaAdesoes: headers.indexOf('meta adesões'),
        metaLeads: headers.indexOf('meta_leads') !== -1 ? headers.indexOf('meta_leads') : 8,
        metaReunioes: headers.indexOf('meta_reunioes') !== -1 ? headers.indexOf('meta_reunioes') : 9,
        metaContratos: headers.indexOf('meta_contratos') !== -1 ? headers.indexOf('meta_contratos') : 10,
      };

      // Processar dados
      const metasMap: MetasMap = new Map();
      
      rows.slice(1).forEach((row: string[]) => {
        const unidade = normalizarNomeUnidade(row[indices.unidade]);
        const ano = row[indices.ano];
        const mes = String(row[indices.mes]).padStart(2, '0');

        if (!unidade || !ano || !mes) return;

        const parseValue = (value: string): number => {
          return parseFloat(String(value || '0').replace(/\./g, '').replace(',', '.')) || 0;
        };

        const chave = `${unidade}-${ano}-${mes}`;
        const metaVendas = parseValue(row[indices.metaVendas]);
        const metaPosVendas = parseValue(row[indices.metaPosVendas]);
        
        metasMap.set(chave, {
          meta_vvr_vendas: metaVendas,
          meta_vvr_posvendas: metaPosVendas,
          meta_vvr_total: metaVendas + metaPosVendas,
          meta_adesoes: parseInt(row[indices.metaAdesoes]) || 0,
          meta_leads: parseInt(row[indices.metaLeads]) || 0,
          meta_reunioes: parseInt(row[indices.metaReunioes]) || 0,
          meta_contratos: parseInt(row[indices.metaContratos]) || 0,
        });
      });

      // Salvar no cache
      clientCache.set(CACHE_KEYS.METAS_DATA, metasMap, CACHE_TTL.LONG);
      
      setMetas(metasMap);
      setLastUpdate(new Date());

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar metas');
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
    data: metas,
    metas,
    loading,
    error,
    refetch,
    lastUpdate,
  };
}

