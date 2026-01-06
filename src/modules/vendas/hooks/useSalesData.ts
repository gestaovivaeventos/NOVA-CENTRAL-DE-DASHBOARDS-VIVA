/**
 * Hook para buscar e gerenciar dados de vendas/adesões
 * Com cache para evitar re-fetch desnecessário
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Adesao } from '@/modules/vendas/types/vendas.types';
import { parseDate } from '@/modules/vendas/utils/periodo';
import { clientCache, CACHE_KEYS, CACHE_TTL } from '@/modules/vendas/utils/cache';
import { normalizarNomeUnidade } from '@/modules/vendas/utils/calculos';

interface UseSalesDataReturn {
  data: Adesao[];
  dados: Adesao[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdate: Date | null;
}

/**
 * Hook para buscar dados de vendas com cache
 */
export function useSalesData(): UseSalesDataReturn {
  const [dados, setDados] = useState<Adesao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isFetching = useRef(false);

  const processRows = useCallback((rows: string[][]) => {
    if (rows.length < 2) {
      return [];
    }

    // Mapear headers
    const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
    
    // Encontrar índices das colunas
    const indices = {
      unidade: headers.indexOf('nm_unidade'),
      data: headers.indexOf('dt_cadastro_integrante'),
      valor: headers.indexOf('vl_plano'),
      tipoVenda: headers.indexOf('venda_posvenda'),
      indicadoPor: headers.indexOf('indicado_por'),
      consultorComercial: headers.indexOf('consultor_comercial'),
      codigoIntegrante: headers.indexOf('codigo_integrante'),
      nomeIntegrante: headers.indexOf('nm_integrante'),
      idFundo: headers.indexOf('id_fundo'),
      nmFundo: headers.indexOf('nm_fundo'),
      cursoFundo: headers.indexOf('curso_fundo'),
      tpServico: headers.indexOf('tp_servico'),
      nmInstituicao: headers.indexOf('nm_instituicao'),
      tipoCliente: headers.indexOf('tipo_cliente'),
    };

    // Verificar colunas essenciais
    if (indices.unidade === -1 || indices.data === -1 || indices.valor === -1) {
      throw new Error('Colunas essenciais não encontradas na planilha');
    }

    // Processar dados
    const processedData: Adesao[] = rows.slice(1)
      .map((row: string[]) => {
        const dateValue = parseDate(row[indices.data]);
        if (!dateValue) return null;

        return {
          nm_unidade: normalizarNomeUnidade(row[indices.unidade]) || 'N/A',
          dt_cadastro_integrante: dateValue,
          vl_plano: parseFloat(String(row[indices.valor] || '0').replace(',', '.')) || 0,
          venda_posvenda: indices.tipoVenda !== -1 ? row[indices.tipoVenda] || 'VENDA' : 'N/A',
          indicado_por: indices.indicadoPor !== -1 ? row[indices.indicadoPor] || 'N/A' : 'N/A',
          consultor_comercial: indices.consultorComercial !== -1 ? row[indices.consultorComercial] || 'N/A' : 'N/A',
          codigo_integrante: indices.codigoIntegrante !== -1 ? row[indices.codigoIntegrante] || 'N/A' : 'N/A',
          nm_integrante: indices.nomeIntegrante !== -1 ? row[indices.nomeIntegrante] || 'N/A' : 'N/A',
          id_fundo: indices.idFundo !== -1 ? row[indices.idFundo] || 'N/A' : 'N/A',
          nm_fundo: indices.nmFundo !== -1 ? row[indices.nmFundo] || 'N/A' : 'N/A',
          curso_fundo: indices.cursoFundo !== -1 ? row[indices.cursoFundo] || '' : '',
          tp_servico: indices.tpServico !== -1 ? row[indices.tpServico] || 'N/A' : 'N/A',
          nm_instituicao: indices.nmInstituicao !== -1 ? row[indices.nmInstituicao] || 'N/A' : 'N/A',
          tipo_cliente: indices.tipoCliente !== -1 ? row[indices.tipoCliente] || 'N/A' : 'N/A',
        } as Adesao;
      })
      .filter(Boolean) as Adesao[];

    return processedData;
  }, []);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Evitar múltiplas chamadas simultâneas
    if (isFetching.current) {
      return;
    }

    // Verificar cache primeiro (a menos que force refresh)
    if (!forceRefresh) {
      const cachedData = clientCache.get<Adesao[]>(CACHE_KEYS.SALES_DATA);
      if (cachedData) {
        setDados(cachedData);
        setLoading(false);
        return;
      }
    }

    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      // Usar API route local para evitar CORS
      const url = '/api/vendas/sales';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Falha ao buscar dados de vendas: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      const processedData = processRows(rows);
      
      // Salvar no cache com TTL longo (os dados são atualizados via API cache)
      clientCache.set(CACHE_KEYS.SALES_DATA, processedData, CACHE_TTL.LONG);
      
      setDados(processedData);
      setLastUpdate(new Date());

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar dados');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [processRows]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data: dados,
    dados,
    loading,
    error,
    refetch,
    lastUpdate,
  };
}

