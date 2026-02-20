// Hook para buscar dados do dashboard

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, OkrData, KpiData, NovoOkrData, EbitdaYearData, TeamPerformance, ProjectData } from '../types';
import { API_CONFIG } from '../config/app.config';

const buildSheetUrl = (sheetName: string) => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_CONFIG.API_KEY}`;
};

const buildProjectsSheetUrl = () => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.PROJECTS_SPREADSHEET_ID}/values/${encodeURIComponent(API_CONFIG.SHEETS.PROJETOS)}?key=${API_CONFIG.API_KEY}`;
};

async function fetchSheetData(sheetName: string): Promise<any[][]> {
  try {
    const response = await fetch(buildSheetUrl(sheetName));
    if (!response.ok) {
      throw new Error(`Erro ao buscar ${sheetName}: ${response.status}`);
    }
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error(`Erro ao buscar dados de ${sheetName}:`, error);
    return [];
  }
}

// Buscar dados de projetos (planilha separada)
async function fetchProjectsData(): Promise<any[][]> {
  try {
    const response = await fetch(buildProjectsSheetUrl());
    if (!response.ok) {
      throw new Error(`Erro ao buscar Projetos: ${response.status}`);
    }
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Erro ao buscar dados de Projetos:', error);
    return [];
  }
}

// Helper para parse de números
const parseToNumber = (str: any): number => {
  if (typeof str !== 'string' || !str) return 0;
  return parseFloat(str.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
};

// Processar dados de KPIs
function processKpiData(rows: any[][]): KpiData[] {
  if (rows.length < 1) return [];
  
  const headers = rows[0].map((h: string) => h?.trim() || '');
  const colIndices = {
    competencia: headers.indexOf('COMPETÊNCIA'),
    organizacao: headers.indexOf('ORGANIZAÇÃO'),
    time: headers.indexOf('TIME'),
    kpi: headers.indexOf('KPI'),
    meta: headers.indexOf('META'),
    resultado: headers.indexOf('RESULTADO'),
    metasReal: headers.indexOf('% METAS REAL'),
    status: headers.indexOf('STATUS'),
    grandeza: headers.indexOf('GRANDEZA'),
    data: headers.indexOf('DATA'),
    criadoEm: headers.indexOf('CRIADO EM'),
    fato: headers.indexOf('FATO'),
    causa: headers.indexOf('CAUSA'),
    efeito: headers.indexOf('EFEITO'),
    acao: headers.findIndex((h: string) => h.includes('AÇÃO')),
    responsavel: headers.findIndex((h: string) => h.includes('RESPONSÁVEL (FCA)')),
    terminoPrevisto: headers.findIndex((h: string) => h.includes('TÉRMINO')),
    fcaRealizado: headers.indexOf('REALIZADO')
  };

  const dataRows = rows.slice(1);

  return dataRows.map(row => {
    const grandeza = row[colIndices.grandeza];
    let metaValue = parseToNumber(row[colIndices.meta]);
    let resultadoValue = parseToNumber(row[colIndices.resultado]);
    if (grandeza === '%') {
      metaValue /= 100;
      resultadoValue /= 100;
    }
    
    const dataValue = row[colIndices.data] || '';
    const yearParts = dataValue.split('/');
    const year = yearParts.length === 3 ? parseInt(yearParts[2], 10) : null;
    
    // Processar % METAS REAL - se vazio ou 0, considerar null
    const metasRealStr = (row[colIndices.metasReal] || '').toString().trim();
    let metasRealValue = null;
    if (metasRealStr && metasRealStr !== '0%' && metasRealStr !== '0') {
      const parsed = parseToNumber(metasRealStr.replace('%', '')) / 100;
      if (parsed > 0) {
        metasRealValue = parsed;
      }
    }
    
    return {
      competencia: row[colIndices.competencia] || '',
      organizacao: row[colIndices.organizacao] || '',
      time: row[colIndices.time] || '',
      kpi: row[colIndices.kpi] || '',
      meta: metaValue,
      resultado: resultadoValue,
      metasReal: metasRealValue,
      status: row[colIndices.status] || '',
      grandeza: grandeza || '',
      year: year,
      criadoEm: row[colIndices.criadoEm] || '',
      fato: row[colIndices.fato] || '',
      causa: row[colIndices.causa] || '',
      efeito: row[colIndices.efeito] || '',
      acao: colIndices.acao >= 0 ? (row[colIndices.acao] || '') : '',
      responsavel: colIndices.responsavel >= 0 ? (row[colIndices.responsavel] || '') : '',
      terminoPrevisto: colIndices.terminoPrevisto >= 0 ? (row[colIndices.terminoPrevisto] || '') : '',
      fcaRealizado: colIndices.fcaRealizado >= 0 ? (row[colIndices.fcaRealizado] || '') : ''
    };
  }).filter(item => 
    (item.organizacao === 'FRANQUEADORA | QUOKKA' || item.organizacao === 'FEAT') && 
    item.time && 
    item.year
  );
}

// Processar dados de OKRs (planilha OKRS VC)
function processOkrsData(rows: any[][]): OkrData[] {
  if (rows.length < 1) return [];
  
  const headers = rows[0].map((h: string) => h?.trim() || '');
  const dataRows = rows.slice(1);
  
  const colIndices = {
    data: headers.indexOf('DATA'),
    objective: headers.indexOf('OBJETIVOS ESTRATÉGICOS'),
    indicator: headers.indexOf('INDICADORES'),
    meta: headers.indexOf('META'),
    realizado: headers.indexOf('REALIZADO'),
    atingimento: headers.indexOf('ATINGIMENTO')
  };

  const processedData: OkrData[] = [];
  let currentObjective = "Sem Objetivo";

  dataRows.forEach(row => {
    if (row[colIndices.objective] && row[colIndices.objective].trim() !== '') {
      currentObjective = row[colIndices.objective].trim();
    }
    
    const indicator = row[colIndices.indicator];
    if (indicator && indicator.trim() !== '') {
      const atingimentoStr = row[colIndices.atingimento] || '0%';
      const atingimentoValue = parseToNumber(atingimentoStr.replace('%', '')) / 100;
      
      processedData.push({
        objective: currentObjective,
        indicator: indicator.trim(),
        meta: row[colIndices.meta] || '',
        realizado: row[colIndices.realizado] || '',
        atingimento: atingimentoValue,
        data: row[colIndices.data] || ''
      });
    }
  });

  return processedData;
}

// Processar dados do NOVO PAINEL OKR
function processNovoOkrData(rows: any[][]): { data: NovoOkrData[], competencias: string[] } {
  if (rows.length < 2) return { data: [], competencias: [] };
  
  const colData = 0;       // Coluna A: DATA
  const colTime = 1;       // Coluna B: TIME
  const colIdOkr = 2;      // Coluna C: ID_OKR
  const colObjetivo = 3;   // Coluna D: OBJETIVOS ESTRATÉGICOS
  const colIdKr = 4;       // Coluna E: ID_KR
  const colIndicador = 5;  // Coluna F: INDICADORES
  const colMeta = 7;       // Coluna H: META
  const colRealizado = 8;  // Coluna I: REALIZADO
  const colAtingimento = 9; // Coluna J: ATINGIMENTO
  const colQuarter = 10;   // Coluna K: QUARTER
  const colFormaDeMedir = 13; // Coluna N: FORMA DE MEDIR
  const colChave = 14;     // Coluna O: CHAVE (identificador único do KR)
  const colAtingReal = 17; // Coluna R: ATING REAL

  const processedData: NovoOkrData[] = [];
  const competenciasSet = new Set<string>();

  rows.slice(1).forEach((row) => {
    const data = row[colData] ? String(row[colData]).trim() : '';
    if (!data) return;
    
    const [dia, mes, ano] = data.split('/');
    if (!mes || !ano) return;
    
    const competenciaStr = `${mes.padStart(2, '0')}/${ano}`;
    competenciasSet.add(competenciaStr);
    
    const time = row[colTime] ? String(row[colTime]).trim() : '';
    const objetivo = row[colObjetivo] ? String(row[colObjetivo]).trim() : '';
    const indicadorNome = row[colIndicador] ? String(row[colIndicador]).trim() : '';
    
    // ID_OKR (coluna C) e ID_KR (coluna E)
    const idOkr = parseInt(row[colIdOkr], 10) || 0;
    const idKr = parseInt(row[colIdKr], 10) || 0;
    
    // QUARTER (coluna K)
    const quarter = parseInt(row[colQuarter], 10) || 0;
    
    // Usar a coluna CHAVE se existir, senão criar chave combinando objetivo + indicador
    const chaveOriginal = row[colChave] ? String(row[colChave]).trim() : '';
    const chaveUnica = chaveOriginal || `${objetivo}||${indicadorNome}`;
    
    // Meta (coluna H)
    const metaStr = row[colMeta] ? String(row[colMeta]).replace('%', '').replace(',', '.').trim() : '';
    const metaNum = parseFloat(metaStr) || 0;
    
    // Realizado (coluna I)
    const realizadoStr = row[colRealizado] ? String(row[colRealizado]).replace('%', '').replace(',', '.').trim() : '';
    const realizadoNum = parseFloat(realizadoStr) || 0;
    
    // Atingimento (coluna J)
    const atingStr = row[colAtingimento] ? String(row[colAtingimento]).replace('%', '').replace(',', '.').trim() : '';
    const atingNum = parseFloat(atingStr) || 0;
    
    // Forma de Medir (coluna N)
    const formaDeMedir = row[colFormaDeMedir] ? String(row[colFormaDeMedir]).trim().toUpperCase() : '';
    
    if (time && indicadorNome) {
      processedData.push({
        data: data,
        time: time,
        indicador: chaveUnica,
        indicadorNome: indicadorNome,
        objetivo: objetivo,
        idOkr: idOkr,
        idKr: idKr,
        quarter: quarter,
        meta: metaNum,
        realizado: realizadoNum,
        atingReal: atingNum,
        formaDeMedir: formaDeMedir
      });
    }
  });

  // Ordenar competências (mais recente primeiro)
  const competencias = Array.from(competenciasSet).sort((a, b) => {
    const [mesA, anoA] = a.split('/').map(Number);
    const [mesB, anoB] = b.split('/').map(Number);
    if (anoB !== anoA) return anoB - anoA;
    return mesB - mesA;
  });

  // Filtrar competências para remover o mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  
  const competenciasFiltradas = competencias.filter(comp => {
    const [mes, ano] = comp.split('/').map(Number);
    if (ano === anoAtual && mes === mesAtual) {
      return false;
    }
    return true;
  });

  return { data: processedData, competencias: competenciasFiltradas };
}

// Processar dados de Projetos
function processProjectsData(rows: any[][]): ProjectData[] {
  if (rows.length < 2) return [];
  
  // Colunas da planilha de Projetos (índice 0-based)
  const colId = 0;              // A: ID
  const colNome = 1;            // B: NOME DO PROJETO
  const colObjetivo = 2;        // C: OBJETIVO DO PROJETO
  const colInicio = 3;          // D: INÍCIO DO PROJETO
  const colConclusao = 4;       // E: DATA DE CONCLUSÃO PREVISTA
  const colResponsavel = 5;     // F: RESPONSÁVEL
  const colTime = 6;            // G: TIME
  const colIndicador = 7;       // H: INDICADOR
  const colTendencia = 8;       // I: TENDÊNCIA
  const colResultadoEsperado = 9; // J: RESULTADO ESPERADO
  const colResultado = 10;      // K: RESULTADO
  const colAtingimento = 11;    // L: % ATINGIMENTO
  const colQuandoImpacto = 12;  // M: QUANDO TERÁ IMPACTO
  const colCusto = 13;          // N: CUSTO
  const colStatus = 20;         // U: STATUS

  const processedData: ProjectData[] = [];

  rows.slice(1).forEach((row) => {
    const id = row[colId] ? String(row[colId]).trim() : '';
    const nome = row[colNome] ? String(row[colNome]).trim() : '';
    const time = row[colTime] ? String(row[colTime]).trim().toUpperCase() : '';
    
    // Ignorar linhas sem ID ou nome
    if (!id || !nome || !time) return;
    
    // Parse do atingimento (pode vir como "80%" ou "0.8")
    const atingimentoStr = row[colAtingimento] ? String(row[colAtingimento]).replace('%', '').replace(',', '.').trim() : '';
    let atingimentoNum = parseFloat(atingimentoStr) || 0;
    // Se o valor for menor que 2, provavelmente é um decimal (0.8 = 80%)
    if (atingimentoNum > 0 && atingimentoNum < 2) {
      atingimentoNum = atingimentoNum * 100;
    }
    
    // Parse do resultado esperado
    const resultadoEsperadoStr = row[colResultadoEsperado] ? String(row[colResultadoEsperado]).replace('%', '').replace(',', '.').trim() : '';
    let resultadoEsperadoNum = parseFloat(resultadoEsperadoStr) || 0;
    
    // Parse do resultado
    const resultadoStr = row[colResultado] ? String(row[colResultado]).replace('%', '').replace(',', '.').trim() : '';
    let resultadoNum = parseFloat(resultadoStr) || 0;

    processedData.push({
      id,
      nome,
      objetivo: row[colObjetivo] ? String(row[colObjetivo]).trim() : '',
      inicioProejto: row[colInicio] ? String(row[colInicio]).trim() : '',
      dataConclusao: row[colConclusao] ? String(row[colConclusao]).trim() : '',
      responsavel: row[colResponsavel] ? String(row[colResponsavel]).trim() : '',
      time,
      indicador: row[colIndicador] ? String(row[colIndicador]).trim() : '',
      tendencia: row[colTendencia] ? String(row[colTendencia]).trim() : '',
      resultadoEsperado: resultadoEsperadoNum,
      resultado: resultadoNum,
      atingimento: atingimentoNum,
      quandoImpacto: row[colQuandoImpacto] ? String(row[colQuandoImpacto]).trim() : '',
      custo: row[colCusto] ? String(row[colCusto]).trim() : '',
      status: row[colStatus] ? String(row[colStatus]).trim() : ''
    });
  });

  return processedData;
}

// Calcular EBITDA por ano
function calculateEbitdaByYear(kpis: KpiData[]): Record<number, EbitdaYearData> {
  const ebitdaData = kpis.filter(item => item.kpi.toUpperCase() === 'EBITDA');
  const accumulator: Record<number, EbitdaYearData> = {};

  for (const item of ebitdaData) {
    const year = item.year;
    if (!year) continue;
    
    if (!accumulator[year]) {
      accumulator[year] = { year: year, meta: 0, resultado: 0, metasReal: 0 };
    }
    accumulator[year].meta += item.meta;
    if (item.status === 'Finalizado') {
      accumulator[year].resultado += item.resultado;
    }
  }

  // Calcular percentual
  Object.values(accumulator).forEach(yearData => {
    yearData.metasReal = yearData.meta > 0 ? yearData.resultado / yearData.meta : 0;
  });

  return accumulator;
}

// Calcular performance por time
function calculateTeamPerformance(
  kpis: KpiData[],
  novoOkrs: NovoOkrData[],
  competencia: string
): TeamPerformance[] {
  // Mapeamento de times OKR para KPI
  const teamMappingOkrToKpis: Record<string, string | string[] | null> = {
    'ATENDIMENTO': 'ATENDIMENTO',
    'CONSULTORIA': 'CONSULTORIA PERFORMANCE',
    'EXPANSÃO': 'EXPANSÃO',
    'FEAT | GROWTH': ['FEAT', 'FEAT E GROWTH'],
    'FORNECEDORES': 'SQUAD FORNECEDORES',
    'GESTÃO': 'GESTÃO',
    'GP': 'GESTÃO DE PESSOAS',
    'INOVAÇÃO': null,
    'MARKETING': 'MARKETING',
    'MARKETING E GROWTH': 'MARKETING E GROWTH',
    'POS VENDA': 'PÓS VENDA - CAF',
    'QUOKKA': ['CASH OUT | CONTROLADORIA', 'FINANCEIRO (CSC)'],
    'TI': 'TI',
    'PERFORMANCE': 'PERFORMANCE'
  };

  // Função para calcular o quarter de um mês
  const getQuarter = (mes: number): number => {
    if (mes >= 1 && mes <= 3) return 1;
    if (mes >= 4 && mes <= 6) return 2;
    if (mes >= 7 && mes <= 9) return 3;
    return 4;
  };

  // Extrair mês e ano da competência selecionada
  const [mesCompetencia, anoCompetencia] = competencia.split('/').map(Number);
  const quarterCompetencia = getQuarter(mesCompetencia);

  // Consolidar dados por time
  const timesConsolidados: Record<string, { kpis: number[], okrs: number[] }> = {};

  // Identificar todos os times únicos de KPIs
  const timesKpiUnicos = [...new Set(kpis
    .filter(item => item.time.toUpperCase() !== 'FRANQUEADORA')
    .map(item => item.time))];
  
  // Adicionar dados dos KPIs - APENAS da competência exata
  timesKpiUnicos.forEach(teamName => {
    const kpisDoTime = kpis.filter(item => 
      item.time === teamName &&
      item.competencia === competencia &&
      item.status === 'Finalizado' &&
      item.metasReal !== null &&
      item.metasReal > 0
    );
    
    kpisDoTime.forEach(kpi => {
      if (!timesConsolidados[teamName]) {
        timesConsolidados[teamName] = { kpis: [], okrs: [] };
      }
      timesConsolidados[teamName].kpis.push(kpi.metasReal as number);
    });
  });

  // Função para obter último resultado por KR de um time
  const getLastResultPerKrForTeam = (teamOkrName: string): number[] => {
    const teamOkrs = novoOkrs.filter(item => {
      if (item.time !== teamOkrName) return false;
      const [dia, mes, ano] = item.data.split('/').map(Number);
      if (ano !== anoCompetencia) return false;
      const quarterItem = getQuarter(mes);
      if (quarterItem !== quarterCompetencia) return false;
      if (mes > mesCompetencia) return false;
      return true;
    });

    if (teamOkrs.length === 0) return [];

    const krPorIndicador: Record<string, NovoOkrData[]> = {};
    
    teamOkrs.forEach((okr) => {
      const chave = okr.indicador;
      if (!krPorIndicador[chave]) {
        krPorIndicador[chave] = [];
      }
      krPorIndicador[chave].push(okr);
    });

    const resultados: number[] = [];
    
    Object.keys(krPorIndicador).forEach((indicador) => {
      const okrsDoIndicador = krPorIndicador[indicador];
      
      okrsDoIndicador.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          const [dia, mes, ano] = dateStr.split('/').map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        };
        return parseDate(b.data) - parseDate(a.data);
      });
      
      let resultadoEscolhido = okrsDoIndicador[0];
      
      if (resultadoEscolhido && resultadoEscolhido.atingReal === 0) {
        const comValor = okrsDoIndicador.find(okr => okr.atingReal > 0);
        if (comValor) {
          resultadoEscolhido = comValor;
        }
      }
      
      if (resultadoEscolhido) {
        resultados.push(resultadoEscolhido.atingReal / 100);
      }
    });

    return resultados;
  };

  // Identificar todos os times únicos na planilha de OKRs
  const timesOkrUnicos = [...new Set(novoOkrs.map(item => item.time))];

  // Para cada time de OKR, buscar resultados
  timesOkrUnicos.forEach(timeOkr => {
    if (timeOkr === 'INOVAÇÃO') return;
    
    const mapping = teamMappingOkrToKpis[timeOkr];
    const resultadosKrs = getLastResultPerKrForTeam(timeOkr);

    resultadosKrs.forEach(atingimento => {
      if (mapping) {
        if (Array.isArray(mapping)) {
          mapping.forEach(teamName => {
            if (!timesConsolidados[teamName]) {
              timesConsolidados[teamName] = { kpis: [], okrs: [] };
            }
            timesConsolidados[teamName].okrs.push(atingimento);
          });
        } else {
          if (!timesConsolidados[mapping]) {
            timesConsolidados[mapping] = { kpis: [], okrs: [] };
          }
          timesConsolidados[mapping].okrs.push(atingimento);
        }
      } else {
        if (!timesConsolidados[timeOkr]) {
          timesConsolidados[timeOkr] = { kpis: [], okrs: [] };
        }
        timesConsolidados[timeOkr].okrs.push(atingimento);
      }
    });
  });

  // Calcular métricas por time
  const teamPerformance: TeamPerformance[] = [];

  Object.keys(timesConsolidados).forEach(teamName => {
    const teamData = timesConsolidados[teamName];
    
    const mediaKpis = teamData.kpis.length > 0
      ? (teamData.kpis.reduce((acc, val) => acc + val, 0) / teamData.kpis.length) * 100
      : null;
    
    const mediaOkrs = teamData.okrs.length > 0
      ? (teamData.okrs.reduce((acc, val) => acc + val, 0) / teamData.okrs.length) * 100
      : null;
    
    const todosAtingimentos = [...teamData.kpis, ...teamData.okrs];
    const mediaGeral = todosAtingimentos.length > 0
      ? (todosAtingimentos.reduce((acc, val) => acc + val, 0) / todosAtingimentos.length) * 100
      : 0;
    
    teamPerformance.push({
      time: teamName,
      mediaKpis,
      mediaOkrs,
      mediaGeral,
      totalIndicadores: todosAtingimentos.length
    });
  });

  // Ordenar por média geral (decrescente)
  teamPerformance.sort((a, b) => b.mediaGeral - a.mediaGeral);

  return teamPerformance;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetencia, setSelectedCompetencia] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar dados de todas as planilhas em paralelo
      const [kpisRaw, okrsRaw, novoOkrRaw, projetosRaw] = await Promise.all([
        fetchSheetData(API_CONFIG.SHEETS.KPIS),
        fetchSheetData(API_CONFIG.SHEETS.OKRS),
        fetchSheetData(API_CONFIG.SHEETS.PAINEL_OKR),
        fetchProjectsData()
      ]);

      // Processar dados
      const kpis = processKpiData(kpisRaw);
      const okrs = processOkrsData(okrsRaw);
      const { data: novoOkrs, competencias } = processNovoOkrData(novoOkrRaw);
      const projetos = processProjectsData(projetosRaw);

      // Selecionar competência mais recente se não houver selecionada
      const currentCompetencia = selectedCompetencia || competencias[0] || '';
      if (!selectedCompetencia && competencias[0]) {
        setSelectedCompetencia(competencias[0]);
      }

      // Calcular EBITDA por ano
      const ebitdaByYear = calculateEbitdaByYear(kpis);

      // Calcular performance por time
      const teamPerformance = calculateTeamPerformance(kpis, novoOkrs, currentCompetencia);

      // KPIs que precisam de atenção (abaixo de 60%)
      const kpisAtencao = kpis.filter(
        kpi => kpi.competencia === currentCompetencia &&
               kpi.metasReal !== null &&
               kpi.metasReal < 0.6 &&
               kpi.status === 'Finalizado' &&
               kpi.time.toUpperCase() !== 'FRANQUEADORA'
      ).sort((a, b) => (a.metasReal || 0) - (b.metasReal || 0));

      const dashboardData: DashboardData = {
        ebitdaByYear,
        okrs,
        kpis,
        novoOkrs,
        projetos,
        competencias,
        selectedCompetencia: currentCompetencia,
        teamPerformance,
        kpisAtencao,
        ultimaAtualizacao: new Date().toISOString()
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [selectedCompetencia]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changeCompetencia = useCallback((competencia: string) => {
    setSelectedCompetencia(competencia);
  }, []);

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
