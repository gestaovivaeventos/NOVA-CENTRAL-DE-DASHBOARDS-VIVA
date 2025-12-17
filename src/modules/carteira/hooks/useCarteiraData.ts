/**
 * Hook para buscar e processar dados da carteira
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  CarteiraRow, 
  KPIsCarteira, 
  DadosPorFundo, 
  DadosPorFranquia, 
  DadosHistorico,
  FiltrosCarteiraOpcoes,
  FiltrosCarteira 
} from '@/modules/carteira/types';
import { parseDate, parseNumericValue, getMesAno } from '@/modules/carteira/utils/formatacao';
import { clientCache, CACHE_KEYS, CACHE_TTL } from '@/modules/carteira/utils/cache';

// Tipo extendido com consultores
interface CarteiraRowExtended extends CarteiraRow {
  consultorRelacionamento: string;
  consultorAtendimento: string;
  consultorProducao: string;
  unidade: string;
}

interface UseCarteiraDataReturn {
  // Dados brutos
  dados: CarteiraRow[];
  
  // Dados processados
  kpis: KPIsCarteira;
  dadosPorFundo: DadosPorFundo[];
  dadosPorFranquia: DadosPorFranquia[];
  historico: DadosHistorico[];
  
  // Opções de filtros
  filtrosOpcoes: FiltrosCarteiraOpcoes;
  
  // Estado
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Ações
  refetch: () => Promise<void>;
}

// Valores iniciais para KPIs
const INITIAL_KPIS: KPIsCarteira = {
  atingimentoMAC: { realizado: 0, meta: 0, percentual: 0 },
  fundosAtivos: 0,
  alunosAtivos: 0,
  alunosEventoPrincipal: 0,
  integrantesInadimplentes: 0,
};

/**
 * Hook para buscar e gerenciar dados da carteira
 */
export function useCarteiraData(filtros?: FiltrosCarteira): UseCarteiraDataReturn {
  const [dados, setDados] = useState<CarteiraRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const isFetching = useRef(false);

  // Processar linhas da planilha para CarteiraRow
  const processRows = useCallback((rows: string[][]): CarteiraRow[] => {
    if (rows.length < 2) return [];

    // Mapear headers (normalizar para lowercase)
    const headers = rows[0].map((h: string) => String(h).trim().toLowerCase());
    
    // Mapear índices das colunas (flexível para diferentes nomes)
    const getIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const idx = headers.indexOf(name.toLowerCase());
        if (idx !== -1) return idx;
      }
      return -1;
    };

    const indices = {
      data: getIndex(['data', 'dt_referencia', 'data_referencia', 'mes_ref']),
      fundo: getIndex(['fundo', 'nm_fundo', 'nome_fundo', 'fundo_formatura']),
      idFundo: getIndex(['id_fundo', 'idfundo', 'codigo_fundo']),
      franquia: getIndex(['franquia', 'nm_unidade', 'unidade', 'nm_franquia']),
      instituicao: getIndex(['instituicao', 'nm_instituicao', 'escola']),
      curso: getIndex(['curso', 'curso_fundo', 'nm_curso']),
      tipoServico: getIndex(['tipo_servico', 'tp_servico', 'servico']),
      macRealizado: getIndex(['mac_realizado', 'realizado', 'vlr_realizado', 'arrecadado']),
      macMeta: getIndex(['mac_meta', 'meta', 'vlr_meta', 'meta_mac']),
      alunosAtivos: getIndex(['alunos_ativos', 'qtd_alunos', 'integrantes_ativos']),
      alunosAderidos: getIndex(['alunos_aderidos', 'aderidos', 'qtd_aderidos']),
      alunosEventoPrincipal: getIndex(['alunos_evento', 'evento_principal', 'integrantes_evento']),
      inadimplentes: getIndex(['inadimplentes', 'qtd_inadimplentes', 'integrantes_inadimplentes']),
      valorInadimplencia: getIndex(['valor_inadimplencia', 'vlr_inadimplencia']),
      status: getIndex(['status', 'situacao_fundo', 'status_fundo']),
      situacao: getIndex(['situacao', 'situacao_carteira']),
      // Novos campos de consultores
      consultorRelacionamento: getIndex(['consultor_relacionamento', 'consultor_rel', 'relacionamento']),
      consultorAtendimento: getIndex(['consultor_atendimento', 'consultor_atd', 'atendimento']),
      consultorProducao: getIndex(['consultor_producao', 'consultor_prod', 'producao']),
      unidade: getIndex(['unidade', 'nm_unidade', 'franquia']),
    };

    // Processar dados
    const processedData: CarteiraRowExtended[] = rows.slice(1)
      .map((row: string[]) => {
        const dateValue = indices.data !== -1 ? parseDate(row[indices.data]) : new Date();
        if (!dateValue) return null;

        return {
          data: dateValue,
          mesAno: getMesAno(dateValue),
          fundo: indices.fundo !== -1 ? row[indices.fundo] || 'N/A' : 'N/A',
          idFundo: indices.idFundo !== -1 ? row[indices.idFundo] || '' : '',
          franquia: indices.franquia !== -1 ? row[indices.franquia] || 'N/A' : 'N/A',
          instituicao: indices.instituicao !== -1 ? row[indices.instituicao] || 'N/A' : 'N/A',
          curso: indices.curso !== -1 ? row[indices.curso] || '' : '',
          tipoServico: indices.tipoServico !== -1 ? row[indices.tipoServico] || '' : '',
          macRealizado: indices.macRealizado !== -1 ? parseNumericValue(row[indices.macRealizado]) : 0,
          macMeta: indices.macMeta !== -1 ? parseNumericValue(row[indices.macMeta]) : 0,
          macAtingimento: 0, // Calculado depois
          alunosAtivos: indices.alunosAtivos !== -1 ? parseNumericValue(row[indices.alunosAtivos]) : 0,
          alunosAderidos: indices.alunosAderidos !== -1 ? parseNumericValue(row[indices.alunosAderidos]) : 0,
          alunosEventoPrincipal: indices.alunosEventoPrincipal !== -1 ? parseNumericValue(row[indices.alunosEventoPrincipal]) : 0,
          integrantesInadimplentes: indices.inadimplentes !== -1 ? parseNumericValue(row[indices.inadimplentes]) : 0,
          valorInadimplencia: indices.valorInadimplencia !== -1 ? parseNumericValue(row[indices.valorInadimplencia]) : 0,
          status: indices.status !== -1 ? row[indices.status] || 'Ativo' : 'Ativo',
          situacao: indices.situacao !== -1 ? row[indices.situacao] || '' : '',
          // Campos de consultores
          consultorRelacionamento: indices.consultorRelacionamento !== -1 ? row[indices.consultorRelacionamento] || '' : '',
          consultorAtendimento: indices.consultorAtendimento !== -1 ? row[indices.consultorAtendimento] || '' : '',
          consultorProducao: indices.consultorProducao !== -1 ? row[indices.consultorProducao] || '' : '',
          unidade: indices.unidade !== -1 ? row[indices.unidade] || '' : '',
        } as CarteiraRowExtended;
      })
      .filter(Boolean) as CarteiraRowExtended[];

    // Calcular atingimento para cada linha
    processedData.forEach(row => {
      row.macAtingimento = row.macMeta > 0 ? row.macRealizado / row.macMeta : 0;
    });

    return processedData;
  }, []);

  // Buscar dados da API
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (isFetching.current) return;

    // Verificar cache
    if (!forceRefresh) {
      const cachedData = clientCache.get<CarteiraRow[]>(CACHE_KEYS.CARTEIRA_DATA, CACHE_TTL.MEDIUM);
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
      const url = '/api/carteira/data';
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Falha ao buscar dados: ${response.status}`);
      }

      const data = await response.json();
      const rows = data.values || [];
      
      const processedData = processRows(rows);
      
      // Salvar no cache
      clientCache.set(CACHE_KEYS.CARTEIRA_DATA, processedData);
      
      setDados(processedData);
      setLastUpdate(new Date());

    } catch (err: any) {
      setError(err.message || 'Erro desconhecido ao buscar dados');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [processRows]);

  // Efeito para buscar dados na montagem
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrar dados baseado nos filtros
  const dadosFiltrados = useMemo(() => {
    if (!filtros) return dados;

    return dados.filter((row: any) => {
      // Filtro de data
      if (filtros.dataInicio) {
        const dataInicio = new Date(filtros.dataInicio);
        if (row.data < dataInicio) return false;
      }
      if (filtros.dataFim) {
        const dataFim = new Date(filtros.dataFim);
        if (row.data > dataFim) return false;
      }

      // Filtro de unidades
      if (filtros.unidades && filtros.unidades.length > 0) {
        const unidadeRow = row.unidade || row.franquia;
        if (!filtros.unidades.includes(unidadeRow)) return false;
      }

      // Filtro de fundos
      if (filtros.fundos && filtros.fundos.length > 0 && !filtros.fundos.includes(row.fundo)) {
        return false;
      }

      // Filtro de consultor de relacionamento
      if (filtros.consultorRelacionamento && filtros.consultorRelacionamento.length > 0) {
        if (!filtros.consultorRelacionamento.includes(row.consultorRelacionamento)) return false;
      }

      // Filtro de consultor de atendimento
      if (filtros.consultorAtendimento && filtros.consultorAtendimento.length > 0) {
        if (!filtros.consultorAtendimento.includes(row.consultorAtendimento)) return false;
      }

      // Filtro de consultor de produção
      if (filtros.consultorProducao && filtros.consultorProducao.length > 0) {
        if (!filtros.consultorProducao.includes(row.consultorProducao)) return false;
      }

      return true;
    });
  }, [dados, filtros]);

  // Calcular KPIs
  const kpis = useMemo((): KPIsCarteira => {
    if (dadosFiltrados.length === 0) return INITIAL_KPIS;

    const macRealizado = dadosFiltrados.reduce((sum, row) => sum + row.macRealizado, 0);
    const macMeta = dadosFiltrados.reduce((sum, row) => sum + row.macMeta, 0);
    const fundosUnicos = new Set(dadosFiltrados.map(row => row.idFundo || row.fundo)).size;
    const alunosAtivos = dadosFiltrados.reduce((sum, row) => sum + row.alunosAtivos, 0);
    const alunosEventoPrincipal = dadosFiltrados.reduce((sum, row) => sum + row.alunosEventoPrincipal, 0);
    const inadimplentes = dadosFiltrados.reduce((sum, row) => sum + row.integrantesInadimplentes, 0);

    return {
      atingimentoMAC: {
        realizado: macRealizado,
        meta: macMeta,
        percentual: macMeta > 0 ? macRealizado / macMeta : 0,
      },
      fundosAtivos: fundosUnicos,
      alunosAtivos,
      alunosEventoPrincipal,
      integrantesInadimplentes: inadimplentes,
    };
  }, [dadosFiltrados]);

  // Agrupar por fundo
  const dadosPorFundo = useMemo((): DadosPorFundo[] => {
    const fundoMap = new Map<string, DadosPorFundo>();

    dadosFiltrados.forEach(row => {
      const key = row.idFundo || row.fundo;
      const existing = fundoMap.get(key);

      if (existing) {
        existing.macRealizado += row.macRealizado;
        existing.macMeta += row.macMeta;
        existing.alunosAtivos += row.alunosAtivos;
        existing.alunosAderidos += row.alunosAderidos;
        existing.inadimplentes += row.integrantesInadimplentes;
      } else {
        fundoMap.set(key, {
          fundo: row.fundo,
          idFundo: row.idFundo,
          franquia: row.franquia,
          instituicao: row.instituicao,
          curso: row.curso,
          macRealizado: row.macRealizado,
          macMeta: row.macMeta,
          atingimento: 0,
          alunosAtivos: row.alunosAtivos,
          alunosAderidos: row.alunosAderidos,
          inadimplentes: row.integrantesInadimplentes,
          status: row.status,
        });
      }
    });

    // Calcular atingimento
    const result = Array.from(fundoMap.values());
    result.forEach(item => {
      item.atingimento = item.macMeta > 0 ? item.macRealizado / item.macMeta : 0;
    });

    // Ordenar por atingimento (menor primeiro para destacar problemas)
    return result.sort((a, b) => a.atingimento - b.atingimento);
  }, [dadosFiltrados]);

  // Agrupar por franquia
  const dadosPorFranquia = useMemo((): DadosPorFranquia[] => {
    const franquiaMap = new Map<string, DadosPorFranquia>();

    dadosFiltrados.forEach(row => {
      const key = row.franquia;
      const existing = franquiaMap.get(key);

      if (existing) {
        existing.totalFundos += 1;
        existing.macRealizado += row.macRealizado;
        existing.macMeta += row.macMeta;
        existing.alunosAtivos += row.alunosAtivos;
        existing.inadimplentes += row.integrantesInadimplentes;
      } else {
        franquiaMap.set(key, {
          franquia: row.franquia,
          totalFundos: 1,
          macRealizado: row.macRealizado,
          macMeta: row.macMeta,
          atingimento: 0,
          alunosAtivos: row.alunosAtivos,
          inadimplentes: row.integrantesInadimplentes,
        });
      }
    });

    // Calcular atingimento e contar fundos únicos
    const fundosPorFranquia = new Map<string, Set<string>>();
    dadosFiltrados.forEach(row => {
      const fundos = fundosPorFranquia.get(row.franquia) || new Set();
      fundos.add(row.idFundo || row.fundo);
      fundosPorFranquia.set(row.franquia, fundos);
    });

    const result = Array.from(franquiaMap.values());
    result.forEach(item => {
      item.atingimento = item.macMeta > 0 ? item.macRealizado / item.macMeta : 0;
      item.totalFundos = fundosPorFranquia.get(item.franquia)?.size || 0;
    });

    // Ordenar por atingimento
    return result.sort((a, b) => b.atingimento - a.atingimento);
  }, [dadosFiltrados]);

  // Agrupar por período (histórico)
  const historico = useMemo((): DadosHistorico[] => {
    const periodoMap = new Map<string, DadosHistorico>();

    dadosFiltrados.forEach(row => {
      const key = row.mesAno;
      const existing = periodoMap.get(key);

      if (existing) {
        existing.macRealizado += row.macRealizado;
        existing.macMeta += row.macMeta;
        existing.alunosAtivos += row.alunosAtivos;
      } else {
        periodoMap.set(key, {
          periodo: key,
          macRealizado: row.macRealizado,
          macMeta: row.macMeta,
          atingimento: 0,
          alunosAtivos: row.alunosAtivos,
          fundosAtivos: 0,
        });
      }
    });

    // Contar fundos por período
    const fundosPorPeriodo = new Map<string, Set<string>>();
    dadosFiltrados.forEach(row => {
      const fundos = fundosPorPeriodo.get(row.mesAno) || new Set();
      fundos.add(row.idFundo || row.fundo);
      fundosPorPeriodo.set(row.mesAno, fundos);
    });

    const result = Array.from(periodoMap.values());
    result.forEach(item => {
      item.atingimento = item.macMeta > 0 ? item.macRealizado / item.macMeta : 0;
      item.fundosAtivos = fundosPorPeriodo.get(item.periodo)?.size || 0;
    });

    // Ordenar por período
    return result.sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [dadosFiltrados]);

  // Extrair opções de filtros
  const filtrosOpcoes = useMemo((): FiltrosCarteiraOpcoes => {
    const unidades = [...new Set(dados.map((row: any) => row.unidade || row.franquia))].filter(Boolean).sort();
    const fundos = [...new Set(dados.map((row: any) => row.fundo))].filter(Boolean).sort();
    const consultoresRelacionamento = [...new Set(dados.map((row: any) => row.consultorRelacionamento))].filter(Boolean).sort();
    const consultoresAtendimento = [...new Set(dados.map((row: any) => row.consultorAtendimento))].filter(Boolean).sort();
    const consultoresProducao = [...new Set(dados.map((row: any) => row.consultorProducao))].filter(Boolean).sort();

    return { unidades, fundos, consultoresRelacionamento, consultoresAtendimento, consultoresProducao };
  }, [dados]);

  // Função para refetch
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    dados: dadosFiltrados,
    kpis,
    dadosPorFundo,
    dadosPorFranquia,
    historico,
    filtrosOpcoes,
    loading,
    error,
    lastUpdate,
    refetch,
  };
}
