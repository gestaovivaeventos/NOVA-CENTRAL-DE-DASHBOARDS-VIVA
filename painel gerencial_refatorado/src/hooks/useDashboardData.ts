// Hook para buscar dados do dashboard

import { useState, useEffect, useCallback } from 'react';
import { DashboardData, OkrData, KpiData, NovoOkrData, EbitdaYearData, TeamPerformance } from '../types';
import { API_CONFIG } from '../config/app.config';

const buildSheetUrl = (sheetName: string) => {
  return `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_CONFIG.API_KEY}`;
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
    fato: headers.indexOf('FATO'),
    causa: headers.indexOf('CAUSA'),
    efeito: headers.indexOf('EFEITO'),
    acao: headers.indexOf('AÇÃO (LINK DO CAR'),
    responsavel: headers.indexOf('RESPONSÁVEL (FC')
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
      fato: row[colIndices.fato] || '',
      causa: row[colIndices.causa] || '',
      efeito: row[colIndices.efeito] || '',
      acao: row[colIndices.acao] || '',
      responsavel: row[colIndices.responsavel] || ''
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
  
  const headers = rows[0].map((h: string) => h ? String(h).trim().toUpperCase() : '');
  console.log('Headers NOVO PAINEL OKR:', headers);
  
  // Índices fixos baseados na referência fornecida:
  // A=0 DATA, B=1 TIME, C=2 ID_OKR, D=3 OBJETIVOS, E=4 ID_KR, F=5 INDICADORES
  // G=6 VALOR INICIAL, H=7 META, I=8 REALIZADO, J=9 ATINGIMENTO, K=10 QUARTER
  // L=11 TENDENCIA, M=12 MEDIDA, N=13 FORMA DE MEDIR, O=14 CHAVE, P=15 RESPONSÁVEL
  // Q=16 ATING META MES, R=17 ATING REAL, S=18 Ordem, T=19 NOME DO TIME NO QUARTER
  
  const colData = 0;       // Coluna A: DATA
  const colTime = 1;       // Coluna B: TIME
  const colObjetivo = 3;   // Coluna D: OBJETIVOS ESTRATÉGICOS
  const colIndicador = 5;  // Coluna F: INDICADORES
  const colChave = 14;     // Coluna O: CHAVE (identificador único do KR)
  const colAtingReal = 17; // Coluna R: ATING REAL

  console.log('Usando colunas fixas - Indicador:', colIndicador, 'Objetivo:', colObjetivo, 'AtingReal:', colAtingReal, 'Chave:', colChave);

  const processedData: NovoOkrData[] = [];
  const competenciasSet = new Set<string>();

  rows.slice(1).forEach((row, index) => {
    const data = row[colData] ? String(row[colData]).trim() : '';
    if (!data) return;
    
    const [dia, mes, ano] = data.split('/');
    if (!mes || !ano) return;
    
    const competenciaStr = `${mes.padStart(2, '0')}/${ano}`;
    competenciasSet.add(competenciaStr);
    
    const time = row[colTime] ? String(row[colTime]).trim() : '';
    const objetivo = row[colObjetivo] ? String(row[colObjetivo]).trim() : '';
    const indicador = row[colIndicador] ? String(row[colIndicador]).trim() : '';
    
    // Usar a coluna CHAVE se existir, senão criar chave combinando objetivo + indicador
    const chaveOriginal = row[colChave] ? String(row[colChave]).trim() : '';
    const chaveUnica = chaveOriginal || `${objetivo}||${indicador}`;
    
    // Usar ATING REAL (coluna R, índice 17)
    const atingStr = row[colAtingReal] ? String(row[colAtingReal]).replace('%', '').replace(',', '.').trim() : '';
    const atingNum = parseFloat(atingStr) || 0;
    
    if (time) {
      processedData.push({
        data: data,
        time: time,
        indicador: chaveUnica, // Usar a chave única como identificador
        meta: parseToNumber(row[3]),
        realizado: parseToNumber(row[4]),
        atingReal: atingNum
      });
    }
  });

  // Log para debug
  const tiSample = processedData.filter(d => d.time === 'TI');
  console.log('=== DEBUG PROCESSAMENTO NOVO OKR ===');
  console.log('Total registros TI:', tiSample.length);
  console.log('Registros TI com valores:', tiSample.map(d => ({
    data: d.data,
    indicador: d.indicador.substring(0, 50),
    atingReal: d.atingReal
  })));
  console.log('Indicadores únicos TI:', [...new Set(tiSample.map(d => d.indicador))].length);

  // Ordenar competências (mais recente primeiro)
  const competencias = Array.from(competenciasSet).sort((a, b) => {
    const [mesA, anoA] = a.split('/').map(Number);
    const [mesB, anoB] = b.split('/').map(Number);
    if (anoB !== anoA) return anoB - anoA;
    return mesB - mesA;
  });

  // Filtrar competências para remover o mês atual
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1; // getMonth() retorna 0-11
  const anoAtual = hoje.getFullYear();
  
  const competenciasFiltradas = competencias.filter(comp => {
    const [mes, ano] = comp.split('/').map(Number);
    // Remove se for o mês atual do ano atual
    if (ano === anoAtual && mes === mesAtual) {
      return false;
    }
    return true;
  });

  return { data: processedData, competencias: competenciasFiltradas };
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
    'FEAT | GROWTH': ['FEAT', 'FEAT E GROWTH'], // Mudou de nome em 10/2025
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
    return 4; // 10, 11, 12
  };

  // Extrair mês e ano da competência selecionada
  const [mesCompetencia, anoCompetencia] = competencia.split('/').map(Number);
  const quarterCompetencia = getQuarter(mesCompetencia);

  // Função para obter o último KPI de um time
  // Se não houver KPI no mês da competência, busca o último mês disponível
  const getLastKpiForTeam = (teamName: string, kpiName: string): number | null => {
    // Filtrar todos os KPIs deste time e indicador
    const teamKpis = kpis.filter(item => 
      item.time === teamName && 
      item.kpi === kpiName &&
      item.status === 'Finalizado'
    );
    
    if (teamKpis.length === 0) return null;
    
    // Primeiro, tentar encontrar exatamente na competência selecionada
    const exactMatch = teamKpis.find(item => item.competencia === competencia);
    if (exactMatch) return exactMatch.metasReal;
    
    // Se não encontrou, buscar o último resultado disponível anterior
    const previousKpis = teamKpis.filter(item => {
      const [mes, ano] = item.competencia.split('/').map(Number);
      // Aceita anos anteriores OU mesmo ano com mês <= competência
      if (ano < anoCompetencia) return true;
      if (ano === anoCompetencia && mes <= mesCompetencia) return true;
      return false;
    });
    
    if (previousKpis.length === 0) return null;
    
    // Ordenar por competência (mais recente primeiro)
    const sorted = previousKpis.sort((a, b) => {
      const [mesA, anoA] = a.competencia.split('/').map(Number);
      const [mesB, anoB] = b.competencia.split('/').map(Number);
      if (anoB !== anoA) return anoB - anoA;
      return mesB - mesA;
    });
    
    return sorted[0].metasReal;
  };

  // Consolidar dados por time - armazenar atingimentos individuais
  const timesConsolidados: Record<string, { kpis: number[], okrs: number[] }> = {};

  // Primeiro, identificar todos os times únicos tanto de KPIs quanto de OKRs
  const timesKpiUnicos = [...new Set(kpis
    .filter(item => item.time.toUpperCase() !== 'FRANQUEADORA')
    .map(item => item.time))];
  
  // Adicionar dados dos KPIs - APENAS da competência exata
  timesKpiUnicos.forEach(teamName => {
    // Buscar KPIs deste time na competência exata
    const kpisDoTime = kpis.filter(item => 
      item.time === teamName &&
      item.competencia === competencia &&
      item.status === 'Finalizado' &&
      item.metasReal !== null && // Ignorar valores null (células vazias)
      item.metasReal > 0 // Ignorar zeros
    );
    
    kpisDoTime.forEach(kpi => {
      if (!timesConsolidados[teamName]) {
        timesConsolidados[teamName] = { kpis: [], okrs: [] };
      }
      timesConsolidados[teamName].kpis.push(kpi.metasReal);
    });
  });
  // Para cada indicador (KR), pega o resultado mais recente dentro do mesmo quarter
  // e que seja até a competência selecionada
  // Se o resultado for 0% no mês selecionado, busca o último mês com resultado > 0
  const getLastResultPerKrForTeam = (teamOkrName: string): number[] => {
    // Filtrar todos os OKRs deste time no mesmo ano e quarter, até a competência selecionada
    const teamOkrs = novoOkrs.filter(item => {
      if (item.time !== teamOkrName) return false;
      const [dia, mes, ano] = item.data.split('/').map(Number);
      // Só considerar do mesmo ano
      if (ano !== anoCompetencia) return false;
      // Só considerar do mesmo quarter
      const quarterItem = getQuarter(mes);
      if (quarterItem !== quarterCompetencia) return false;
      // Só considerar meses anteriores ou iguais à competência selecionada
      if (mes > mesCompetencia) return false;
      return true;
    });

    if (teamOkrs.length === 0) return [];

    // Agrupar por indicador (chave única = objetivo||indicador) e pegar o mais recente de cada
    const krPorIndicador: Record<string, NovoOkrData[]> = {};
    
    teamOkrs.forEach((okr) => {
      // O indicador já é a chave única (objetivo||indicador)
      const chave = okr.indicador;
      
      if (!krPorIndicador[chave]) {
        krPorIndicador[chave] = [];
      }
      krPorIndicador[chave].push(okr);
    });

    // Log para debug do time TI
    if (teamOkrName === 'TI') {
      console.log(`\n========== DEBUG TI (Competência: ${competencia}) ==========`);
      console.log(`Quarter: Q${quarterCompetencia}, Ano: ${anoCompetencia}, Mês até: ${mesCompetencia}`);
      console.log(`Total registros do TI no quarter: ${teamOkrs.length}`);
      console.log(`KRs únicos encontrados: ${Object.keys(krPorIndicador).length}`);
      console.log('\n--- TODOS OS REGISTROS DO TI NO QUARTER ---');
      teamOkrs.forEach((okr, i) => {
        console.log(`  ${i+1}. Data: ${okr.data} | AtingReal: ${okr.atingReal}% | Indicador: ${okr.indicador.substring(0, 80)}...`);
      });
      console.log('\n--- KRs AGRUPADOS ---');
    }

    // Para cada KR, pegar o resultado mais recente COM VALOR > 0
    // Se o mais recente for 0%, buscar o anterior que tenha valor
    const resultados: number[] = [];
    
    Object.keys(krPorIndicador).forEach((indicador, idx) => {
      const okrsDoIndicador = krPorIndicador[indicador];
      
      // Ordenar por data (mais recente primeiro)
      okrsDoIndicador.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          const [dia, mes, ano] = dateStr.split('/').map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        };
        return parseDate(b.data) - parseDate(a.data);
      });
      
      // Pegar o resultado mais recente que tenha valor > 0
      // Se todos forem 0, pegar o mais recente mesmo assim
      let resultadoEscolhido = okrsDoIndicador[0];
      
      // Se o mais recente for 0%, procurar um anterior com valor > 0
      if (resultadoEscolhido && resultadoEscolhido.atingReal === 0) {
        const comValor = okrsDoIndicador.find(okr => okr.atingReal > 0);
        if (comValor) {
          resultadoEscolhido = comValor;
        }
      }
      
      if (resultadoEscolhido) {
        resultados.push(resultadoEscolhido.atingReal / 100);
        
        // Log para debug do time TI
        if (teamOkrName === 'TI') {
          const maisRecente = okrsDoIndicador[0];
          if (maisRecente.atingReal === 0 && resultadoEscolhido !== maisRecente) {
            console.log(`  KR ${idx+1}: ${resultadoEscolhido.atingReal}% (data: ${resultadoEscolhido.data}) [Nov=0%, usando anterior]`);
          } else {
            console.log(`  KR ${idx+1}: ${resultadoEscolhido.atingReal}% (data: ${resultadoEscolhido.data})`);
          }
          console.log(`         Indicador: ${indicador.substring(0, 100)}`);
        }
      }
    });

    if (teamOkrName === 'TI') {
      console.log('\n--- RESUMO TI ---');
      console.log('Valores usados na média:', resultados.map(r => (r*100).toFixed(1) + '%').join(' + '));
      const soma = resultados.reduce((a,b) => a+b, 0) * 100;
      console.log(`Soma: ${soma.toFixed(1)}%`);
      console.log(`Quantidade: ${resultados.length}`);
      const media = resultados.length > 0 ? soma / resultados.length : 0;
      console.log(`MÉDIA CALCULADA TI: ${media.toFixed(2)}%`);
      console.log('='.repeat(60) + '\n');
    }

    return resultados;
  };

  // Identificar todos os times únicos na planilha de OKRs
  const timesOkrUnicos = [...new Set(novoOkrs.map(item => item.time))];

  // Para cada time de OKR, buscar o último resultado de cada KR individual
  timesOkrUnicos.forEach(timeOkr => {
    if (timeOkr === 'INOVAÇÃO') return; // Ignorar INOVAÇÃO
    
    const mapping = teamMappingOkrToKpis[timeOkr];
    
    // Buscar o último resultado de cada KR individual do time
    const resultadosKrs = getLastResultPerKrForTeam(timeOkr);

    // Adicionar os resultados ao time correspondente
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
        // Se não houver mapeamento, usar o nome do time direto
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
    
    // Média de KPIs = soma dos atingimentos dos KPIs / quantidade de KPIs
    const mediaKpis = teamData.kpis.length > 0
      ? (teamData.kpis.reduce((acc, val) => acc + val, 0) / teamData.kpis.length) * 100
      : null;
    
    // Média de OKRs = soma dos atingimentos das KRs / quantidade de KRs
    const mediaOkrs = teamData.okrs.length > 0
      ? (teamData.okrs.reduce((acc, val) => acc + val, 0) / teamData.okrs.length) * 100
      : null;
    
    // Média Geral = soma de TODOS os atingimentos (KPIs + KRs) / quantidade total
    const todosAtingimentos = [...teamData.kpis, ...teamData.okrs];
    const mediaGeral = todosAtingimentos.length > 0
      ? (todosAtingimentos.reduce((acc, val) => acc + val, 0) / todosAtingimentos.length) * 100
      : 0;
    
    // Debug para TI
    if (teamName === 'TI') {
      console.log('\n========== DEBUG MÉDIA GERAL TI ==========');
      console.log('KPIs do TI:', teamData.kpis.map(k => (k*100).toFixed(1) + '%'));
      console.log('OKRs do TI:', teamData.okrs.map(o => (o*100).toFixed(1) + '%'));
      console.log(`Média KPIs: ${mediaKpis?.toFixed(2)}%`);
      console.log(`Média OKRs: ${mediaOkrs?.toFixed(2)}%`);
      console.log(`Todos atingimentos: ${todosAtingimentos.map(t => (t*100).toFixed(1) + '%').join(' + ')}`);
      console.log(`MÉDIA GERAL TI: ${mediaGeral.toFixed(2)}%`);
      console.log('='.repeat(50) + '\n');
    }
    
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
      const [kpisRaw, okrsRaw, novoOkrRaw] = await Promise.all([
        fetchSheetData(API_CONFIG.SHEETS.KPIS),
        fetchSheetData(API_CONFIG.SHEETS.OKRS),
        fetchSheetData(API_CONFIG.SHEETS.PAINEL_OKR)
      ]);

      console.log('Dados brutos recebidos:', {
        kpis: kpisRaw.length,
        okrs: okrsRaw.length,
        novoOkr: novoOkrRaw.length
      });

      // Processar dados
      const kpis = processKpiData(kpisRaw);
      const okrs = processOkrsData(okrsRaw);
      const { data: novoOkrs, competencias } = processNovoOkrData(novoOkrRaw);

      console.log('Dados processados:', {
        kpis: kpis.length,
        okrs: okrs.length,
        novoOkrs: novoOkrs.length,
        competencias: competencias
      });

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
               kpi.metasReal !== null && // Ignorar valores null
               kpi.metasReal < 0.6 &&
               kpi.status === 'Finalizado' &&
               kpi.time.toUpperCase() !== 'FRANQUEADORA'
      ).sort((a, b) => (a.metasReal || 0) - (b.metasReal || 0));

      const dashboardData: DashboardData = {
        ebitdaByYear,
        okrs,
        kpis,
        novoOkrs,
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
