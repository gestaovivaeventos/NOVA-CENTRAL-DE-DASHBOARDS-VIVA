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
  FiltrosCarteira,
  SaudeFundo 
} from '@/modules/carteira/types';
import { parseDate, parseNumericValue, getMesAno } from '@/modules/carteira/utils/formatacao';
import { clientCache, CACHE_KEYS, CACHE_TTL } from '@/modules/carteira/utils/cache';

// Tipo extendido com consultores
interface CarteiraRowExtended extends CarteiraRow {
  consultorRelacionamento: string;
  consultorAtendimento: string;
  consultorProducao: string;
  unidade: string;
  tatAtual: number;
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
  nuncaPagaram: 0,
  tatAtual: 0,
  fundosPorSaude: {
    critico: 0,
    atencao: 0,
    quaseLa: 0,
    alcancada: 0,
  },
};

/**
 * Calcula a saúde do fundo baseado no tempo até o baile e percentual MAC
 */
function calcularSaudeFundo(dataBaile: Date | null, atingimentoMAC: number): SaudeFundo {
  if (!dataBaile) return 'Atenção'; // Sem data de baile = atenção por padrão
  
  const hoje = new Date();
  const diffMs = dataBaile.getTime() - hoje.getTime();
  const mesesAteBaile = diffMs / (1000 * 60 * 60 * 24 * 30);
  const percentual = atingimentoMAC * 100;
  
  if (percentual >= 100) return 'Alcançada';
  
  // Até 6 meses
  if (mesesAteBaile <= 6) {
    if (percentual < 90) return 'Crítico';
    if (percentual <= 95) return 'Atenção';
    return 'Quase lá';
  }
  
  // Até 1 ano (12 meses)
  if (mesesAteBaile <= 12) {
    if (percentual < 80) return 'Crítico';
    if (percentual <= 85) return 'Atenção';
    return 'Quase lá';
  }
  
  // Até 1.5 anos (18 meses)
  if (mesesAteBaile <= 18) {
    if (percentual < 70) return 'Crítico';
    if (percentual <= 80) return 'Atenção';
    return 'Quase lá';
  }
  
  // Até 2 anos (24 meses)
  if (mesesAteBaile <= 24) {
    if (percentual < 65) return 'Crítico';
    if (percentual <= 70) return 'Atenção';
    return 'Quase lá';
  }
  
  // Mais de 2 anos
  if (percentual < 50) return 'Crítico';
  if (percentual <= 60) return 'Atenção';
  return 'Quase lá';
}

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
      macMeta: getIndex(['mac_meta', 'meta', 'vlr_meta', 'meta_mac', 'mac_atual']),
      alunosAtivos: getIndex(['alunos_ativos', 'qtd_alunos', 'integrantes_ativos']),
      alunosAderidos: getIndex(['alunos_aderidos', 'aderidos', 'qtd_aderidos']),
      alunosEventoPrincipal: getIndex(['aderidos_principal', 'alunos_evento', 'evento_principal', 'integrantes_evento']),
      inadimplentes: getIndex(['total_inadimplentes', 'inadimplentes', 'qtd_inadimplentes', 'integrantes_inadimplentes']),
      nuncaPagaram: getIndex(['int_nunca_pagaram', 'nunca_pagaram', 'nunca_pagou']),
      valorInadimplencia: getIndex(['valor_inadimplencia', 'vlr_inadimplencia']),
      baileARealizar: getIndex(['baile_a_realizar', 'baile_realizar', 'realizar_baile']),
      dataBaile: getIndex(['data_baile', 'dt_baile', 'data_evento']),
      status: getIndex(['status', 'situacao_fundo', 'status_fundo']),
      situacao: getIndex(['situacao', 'situacao_carteira']),
      // Novos campos de consultores
      consultorRelacionamento: getIndex(['consultor_planejamento', 'consultor_relacionamento', 'consultor_rel', 'relacionamento']),
      consultorAtendimento: getIndex(['consultor_atendimento', 'consultor_atd', 'atendimento']),
      consultorProducao: getIndex(['consultor_producao', 'consultor_prod', 'producao']),
      unidade: getIndex(['unidade', 'nm_unidade', 'franquia']),
      // TAT
      tatAtual: getIndex(['tat_atual', 'tat', 'meta_tat']),
    };

    // Processar dados
    const processedData: CarteiraRowExtended[] = rows.slice(1)
      .map((row: string[]) => {
        const dateValue = indices.data !== -1 ? parseDate(row[indices.data]) : new Date();
        if (!dateValue) return null;

        // Parse da data do baile
        const dataBaileValue = indices.dataBaile !== -1 ? parseDate(row[indices.dataBaile]) : null;
        
        // Verificar se baile é para realizar
        const baileARealizar = indices.baileARealizar !== -1 ? (row[indices.baileARealizar] || '').toUpperCase().trim() : '';

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
          tatAtual: indices.tatAtual !== -1 ? parseNumericValue(row[indices.tatAtual]) : 0,
          alunosAtivos: indices.alunosAtivos !== -1 ? parseNumericValue(row[indices.alunosAtivos]) : 0,
          alunosAderidos: indices.alunosAderidos !== -1 ? parseNumericValue(row[indices.alunosAderidos]) : 0,
          alunosEventoPrincipal: indices.alunosEventoPrincipal !== -1 ? parseNumericValue(row[indices.alunosEventoPrincipal]) : 0,
          integrantesInadimplentes: indices.inadimplentes !== -1 ? parseNumericValue(row[indices.inadimplentes]) : 0,
          nuncaPagaram: indices.nuncaPagaram !== -1 ? parseNumericValue(row[indices.nuncaPagaram]) : 0,
          valorInadimplencia: indices.valorInadimplencia !== -1 ? parseNumericValue(row[indices.valorInadimplencia]) : 0,
          baileARealizar: baileARealizar,
          dataBaile: dataBaileValue,
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
    // IMPORTANTE: Só considerar fundos com baile "REALIZAR"
    let filteredData = dados.filter((row: any) => {
      return row.baileARealizar === 'REALIZAR';
    });

    if (!filtros) return filteredData;

    return filteredData.filter((row: any) => {
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

      // Filtro de cursos
      if (filtros.cursos && filtros.cursos.length > 0) {
        if (!filtros.cursos.includes(row.curso)) return false;
      }

      // Filtro de fundos
      if (filtros.fundos && filtros.fundos.length > 0 && !filtros.fundos.includes(row.fundo)) {
        return false;
      }

      return true;
    });
  }, [dados, filtros]);

  // Filtrar dadosPorFundo por saúde (após agrupar)
  const dadosFiltradosPorSaude = useMemo(() => {
    if (!filtros?.saude || filtros.saude.length === 0) return null;
    return filtros.saude;
  }, [filtros?.saude]);

  // Calcular mapa de saúde por fundo (necessário para filtrar KPIs por saúde)
  const fundoSaudeMap = useMemo(() => {
    const map = new Map<string, SaudeFundo>();
    const fundoDataMap = new Map<string, { alunosAtivos: number; macMeta: number; dataBaile: Date | null }>();
    
    dadosFiltrados.forEach((row: any) => {
      const key = row.idFundo || row.fundo;
      const existing = fundoDataMap.get(key);
      if (existing) {
        existing.alunosAtivos += row.alunosAtivos;
        existing.macMeta += row.macMeta;
      } else {
        fundoDataMap.set(key, {
          alunosAtivos: row.alunosAtivos,
          macMeta: row.macMeta,
          dataBaile: row.dataBaile,
        });
      }
    });

    fundoDataMap.forEach((data, key) => {
      const atingimento = data.macMeta > 0 ? data.alunosAtivos / data.macMeta : 0;
      const saude = calcularSaudeFundo(data.dataBaile, atingimento);
      map.set(key, saude);
    });

    return map;
  }, [dadosFiltrados]);

  // Dados filtrados também por saúde (para KPIs)
  const dadosFiltradosComSaude = useMemo(() => {
    if (!dadosFiltradosPorSaude || dadosFiltradosPorSaude.length === 0) {
      return dadosFiltrados;
    }
    
    // Filtrar dados apenas dos fundos que têm a saúde selecionada
    return dadosFiltrados.filter((row: any) => {
      const key = row.idFundo || row.fundo;
      const saude = fundoSaudeMap.get(key);
      return saude && dadosFiltradosPorSaude.includes(saude);
    });
  }, [dadosFiltrados, dadosFiltradosPorSaude, fundoSaudeMap]);

  // Calcular KPIs - Atingimento MAC = integrantes_ativos / mac_atual
  // AGORA USA dadosFiltradosComSaude para incluir filtro de saúde
  const kpis = useMemo((): KPIsCarteira => {
    if (dadosFiltradosComSaude.length === 0) return INITIAL_KPIS;

    const integrantesAtivos = dadosFiltradosComSaude.reduce((sum, row) => sum + row.alunosAtivos, 0);
    const macAtual = dadosFiltradosComSaude.reduce((sum, row) => sum + row.macMeta, 0);
    const tatAtual = dadosFiltradosComSaude.reduce((sum, row: any) => sum + (row.tatAtual || 0), 0);
    const fundosUnicos = new Set(dadosFiltradosComSaude.map(row => row.idFundo || row.fundo)).size;
    const alunosEventoPrincipal = dadosFiltradosComSaude.reduce((sum, row) => sum + row.alunosEventoPrincipal, 0);
    const inadimplentes = dadosFiltradosComSaude.reduce((sum, row) => sum + row.integrantesInadimplentes, 0);
    const nuncaPagaram = dadosFiltradosComSaude.reduce((sum, row) => sum + row.nuncaPagaram, 0);

    // Calcular fundos por saúde
    const fundosPorSaude = {
      critico: 0,
      atencao: 0,
      quaseLa: 0,
      alcancada: 0,
    };

    // Contar fundos únicos e sua saúde
    const fundosContados = new Set<string>();
    dadosFiltradosComSaude.forEach((row: any) => {
      const key = row.idFundo || row.fundo;
      if (!fundosContados.has(key)) {
        fundosContados.add(key);
        const saude = fundoSaudeMap.get(key);
        switch (saude) {
          case 'Crítico': fundosPorSaude.critico++; break;
          case 'Atenção': fundosPorSaude.atencao++; break;
          case 'Quase lá': fundosPorSaude.quaseLa++; break;
          case 'Alcançada': fundosPorSaude.alcancada++; break;
        }
      }
    });

    return {
      atingimentoMAC: {
        realizado: integrantesAtivos,
        meta: macAtual,
        percentual: macAtual > 0 ? integrantesAtivos / macAtual : 0,
      },
      fundosAtivos: fundosUnicos,
      alunosAtivos: integrantesAtivos,
      alunosEventoPrincipal,
      integrantesInadimplentes: inadimplentes,
      nuncaPagaram,
      tatAtual,
      fundosPorSaude,
    };
  }, [dadosFiltradosComSaude, fundoSaudeMap]);

  // Agrupar por fundo
  const dadosPorFundo = useMemo((): DadosPorFundo[] => {
    const fundoMap = new Map<string, DadosPorFundo & { dataBaile: Date | null }>();

    dadosFiltrados.forEach((row: any) => {
      const key = row.idFundo || row.fundo;
      const existing = fundoMap.get(key);

      if (existing) {
        existing.macRealizado += row.macRealizado;
        existing.macMeta += row.macMeta;
        existing.tatAtual += row.tatAtual || 0;
        existing.alunosAtivos += row.alunosAtivos;
        existing.alunosAderidos += row.alunosAderidos;
        existing.alunosEventoPrincipal += row.alunosEventoPrincipal;
        existing.inadimplentes += row.integrantesInadimplentes;
        existing.nuncaPagaram += row.nuncaPagaram;
      } else {
        fundoMap.set(key, {
          fundo: row.fundo,
          idFundo: row.idFundo,
          franquia: row.franquia,
          instituicao: row.instituicao,
          curso: row.curso,
          tipoServico: row.tipoServico || '',
          macRealizado: row.macRealizado,
          macMeta: row.macMeta,
          tatAtual: row.tatAtual || 0,
          atingimento: 0,
          alunosAtivos: row.alunosAtivos,
          alunosAderidos: row.alunosAderidos,
          alunosEventoPrincipal: row.alunosEventoPrincipal,
          inadimplentes: row.integrantesInadimplentes,
          nuncaPagaram: row.nuncaPagaram,
          status: row.status,
          dataBaile: row.dataBaile,
          baileARealizar: row.baileARealizar,
          saude: 'Atenção',
          consultorRelacionamento: row.consultorRelacionamento || '',
          consultorAtendimento: row.consultorAtendimento || '',
          consultorProducao: row.consultorProducao || '',
        });
      }
    });

    // Calcular atingimento e saúde
    let result = Array.from(fundoMap.values());
    result.forEach(item => {
      item.atingimento = item.macMeta > 0 ? item.alunosAtivos / item.macMeta : 0;
      item.saude = calcularSaudeFundo(item.dataBaile, item.atingimento);
    });

    // Filtrar por saúde se houver filtro
    if (dadosFiltradosPorSaude && dadosFiltradosPorSaude.length > 0) {
      result = result.filter(item => dadosFiltradosPorSaude.includes(item.saude));
    }

    // Ordenar por atingimento (menor primeiro para destacar problemas)
    return result.sort((a, b) => a.atingimento - b.atingimento);
  }, [dadosFiltrados, dadosFiltradosPorSaude]);

  // Agrupar por franquia - USA dadosFiltradosComSaude para incluir filtro de saúde
  const dadosPorFranquia = useMemo((): DadosPorFranquia[] => {
    const franquiaMap = new Map<string, DadosPorFranquia>();

    dadosFiltradosComSaude.forEach((row: any) => {
      const key = row.franquia;
      const existing = franquiaMap.get(key);

      if (existing) {
        existing.totalFundos += 1;
        existing.macRealizado += row.macRealizado;
        existing.macMeta += row.macMeta;
        existing.tatAtual += row.tatAtual || 0;
        existing.alunosAtivos += row.alunosAtivos;
        existing.alunosEventoPrincipal += row.alunosEventoPrincipal;
        existing.inadimplentes += row.integrantesInadimplentes;
        existing.nuncaPagaram += row.nuncaPagaram;
      } else {
        franquiaMap.set(key, {
          franquia: row.franquia,
          totalFundos: 1,
          macRealizado: row.macRealizado,
          macMeta: row.macMeta,
          tatAtual: row.tatAtual || 0,
          atingimento: 0,
          alunosAtivos: row.alunosAtivos,
          alunosEventoPrincipal: row.alunosEventoPrincipal,
          inadimplentes: row.integrantesInadimplentes,
          nuncaPagaram: row.nuncaPagaram,
        });
      }
    });

    // Calcular atingimento e contar fundos únicos
    const fundosPorFranquia = new Map<string, Set<string>>();
    dadosFiltradosComSaude.forEach(row => {
      const fundos = fundosPorFranquia.get(row.franquia) || new Set();
      fundos.add(row.idFundo || row.fundo);
      fundosPorFranquia.set(row.franquia, fundos);
    });

    const result = Array.from(franquiaMap.values());
    result.forEach(item => {
      // CORREÇÃO: Atingimento = Alunos Ativos / MAC Meta (igual ao card e tabela de fundos)
      item.atingimento = item.macMeta > 0 ? item.alunosAtivos / item.macMeta : 0;
      item.totalFundos = fundosPorFranquia.get(item.franquia)?.size || 0;
    });

    // Ordenar por atingimento
    return result.sort((a, b) => b.atingimento - a.atingimento);
  }, [dadosFiltradosComSaude]);

  // Dados filtrados SEM filtro de período (para histórico)
  const dadosSemFiltroPeriodo = useMemo(() => {
    // IMPORTANTE: Só considerar fundos com baile "REALIZAR"
    let filteredData = dados.filter((row: any) => {
      return row.baileARealizar === 'REALIZAR';
    });

    if (!filtros) return filteredData;

    return filteredData.filter((row: any) => {
      // NÃO aplicar filtro de data aqui - queremos todos os períodos

      // Filtro de unidades
      if (filtros.unidades && filtros.unidades.length > 0) {
        const unidadeRow = row.unidade || row.franquia;
        if (!filtros.unidades.includes(unidadeRow)) return false;
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

      // Filtro de cursos
      if (filtros.cursos && filtros.cursos.length > 0) {
        if (!filtros.cursos.includes(row.curso)) return false;
      }

      // Filtro de fundos
      if (filtros.fundos && filtros.fundos.length > 0 && !filtros.fundos.includes(row.fundo)) {
        return false;
      }

      return true;
    });
  }, [dados, filtros]);

  // Agrupar por período (histórico) - SEM FILTRO DE PERÍODO
  const historico = useMemo((): DadosHistorico[] => {
    const periodoMap = new Map<string, DadosHistorico>();

    dadosSemFiltroPeriodo.forEach(row => {
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
    dadosSemFiltroPeriodo.forEach(row => {
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
  }, [dadosSemFiltroPeriodo]);

  // Extrair opções de filtros COM HIERARQUIA
  // Unidade é o filtro pai - quando selecionado, os filtros abaixo só mostram dados da unidade
  const filtrosOpcoes = useMemo((): FiltrosCarteiraOpcoes => {
    // Unidades sempre mostram todas as opções (é o filtro principal)
    const unidades = [...new Set(dados.map((row: any) => row.unidade || row.franquia))].filter(Boolean).sort();
    
    // Determinar base de dados para filtros hierárquicos
    // Se unidade está selecionada, filtrar os dados para extrair opções dos outros filtros
    let dadosParaFiltros = dados;
    if (filtros?.unidades && filtros.unidades.length > 0) {
      dadosParaFiltros = dados.filter((row: any) => {
        const unidadeRow = row.unidade || row.franquia;
        return filtros.unidades.includes(unidadeRow);
      });
    }

    // Extrair opções dos filtros hierárquicos baseado na unidade selecionada
    const consultoresRelacionamento = [...new Set(dadosParaFiltros.map((row: any) => row.consultorRelacionamento))].filter(Boolean).sort();
    const consultoresAtendimento = [...new Set(dadosParaFiltros.map((row: any) => row.consultorAtendimento))].filter(Boolean).sort();
    const consultoresProducao = [...new Set(dadosParaFiltros.map((row: any) => row.consultorProducao))].filter(Boolean).sort();
    const cursos = [...new Set(dadosParaFiltros.map((row: any) => row.curso))].filter(Boolean).sort();
    const fundos = [...new Set(dadosParaFiltros.map((row: any) => row.fundo))].filter(Boolean).sort();
    
    const saudeOpcoes: SaudeFundo[] = ['Crítico', 'Atenção', 'Quase lá', 'Alcançada'];

    return { unidades, consultoresRelacionamento, consultoresAtendimento, consultoresProducao, cursos, fundos, saudeOpcoes };
  }, [dados, filtros?.unidades]);

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
