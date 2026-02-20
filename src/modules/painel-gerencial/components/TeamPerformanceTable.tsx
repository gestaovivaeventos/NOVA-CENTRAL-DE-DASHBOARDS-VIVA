'use client';

import React, { useState } from 'react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { TeamPerformance, KpiData, NovoOkrData, ProjectData } from '../types';

interface TeamPerformanceTableProps {
  teams: TeamPerformance[];
  competencia: string;
  kpis?: KpiData[];
  novoOkrs?: NovoOkrData[];
  projetos?: ProjectData[];
}

type SelectionMode = 'kpi' | 'okr' | 'projeto';

const getStatusColor = (percent: number | null) => {
  if (percent === null) return '#94A3B8';
  if (percent >= 100) return '#22C55E'; // Verde
  if (percent >= 61) return '#FF6600';  // Laranja
  return '#EF4444';                      // Vermelho
};

const ProgressBar: React.FC<{ value: number | null; isBold?: boolean }> = ({ value, isBold }) => {
  if (value === null) {
    return <span className="text-slate-500">-</span>;
  }

  const color = getStatusColor(value);
  const width = Math.min(value, 100);

  return (
    <div className="flex flex-col gap-1">
      <span 
        className={`text-sm ${isBold ? 'font-bold' : 'font-medium'}`}
        style={{ color }}
      >
        {value.toFixed(1)}%
      </span>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            transitionDuration: '300ms'
          }}
        />
      </div>
    </div>
  );
};

export const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ 
  teams, 
  competencia,
  kpis = [],
  novoOkrs = [],
  projetos = []
}) => {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('kpi');
  
  // Extrair ano da competência
  const [mesCompetencia, anoCompetencia] = competencia.split('/').map(Number);
  
  // Mapeamento de times KPI para OKR (inverso do usado no hook)
  const teamMappingKpiToOkr: Record<string, string[]> = {
    'ATENDIMENTO': ['ATENDIMENTO'],
    'CONSULTORIA PERFORMANCE': ['CONSULTORIA'],
    'EXPANSÃO': ['EXPANSÃO'],
    'FEAT': ['FEAT | GROWTH'],
    'FEAT E GROWTH': ['FEAT | GROWTH'],
    'SQUAD FORNECEDORES': ['FORNECEDORES'],
    'GESTÃO': ['GESTÃO'],
    'GESTÃO DE PESSOAS': ['GP'],
    'MARKETING': ['MARKETING'],
    'MARKETING E GROWTH': ['MARKETING E GROWTH', 'MARKETING'],
    'PÓS VENDA - CAF': ['POS VENDA'],
    'POS VENDA': ['POS VENDA'],
    'CASH OUT | CONTROLADORIA': ['QUOKKA'],
    'FINANCEIRO (CSC)': ['QUOKKA'],
    'TI': ['TI'],
    'PERFORMANCE': ['PERFORMANCE'],
    'SQUAD PRODUTOS': ['SQUAD PRODUTOS', 'PRODUTOS'],
    'SQUAD FOTO': ['SQUAD FOTO', 'FOTO']
  };
  
  // Filtrar KPIs de um time específico para o ano selecionado
  const getKpisForTeam = (time: string): KpiData[] => {
    return kpis.filter(kpi => {
      const timeMatch = kpi.time?.toUpperCase() === time?.toUpperCase();
      const yearMatch = kpi.year === anoCompetencia;
      return timeMatch && yearMatch;
    });
  };
  
  // Nomes dos meses
  const mesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  // Agrupar KPIs por nome para formato pivotado (meses em colunas)
  type KpiPivotRow = {
    kpi: string;
    grandeza: string;
    meses: Record<number, { meta: number; resultado: number; atingimento: number | null } | null>;
    atingimentoMes: number | null;
    atingimentoAno: number | null;
  };
  
  const getKpisPivotados = (teamKpis: KpiData[]): KpiPivotRow[] => {
    // Agrupar por nome do KPI
    const kpiGroups: Record<string, KpiData[]> = {};
    teamKpis.forEach(kpi => {
      if (!kpiGroups[kpi.kpi]) {
        kpiGroups[kpi.kpi] = [];
      }
      kpiGroups[kpi.kpi].push(kpi);
    });
    
    // Criar linhas pivotadas
    return Object.entries(kpiGroups).map(([kpiName, kpiData]) => {
      const grandeza = kpiData[0]?.grandeza || '';
      const meses: KpiPivotRow['meses'] = {};
      
      // Extrair mês de cada KPI pela competência
      kpiData.forEach(kpi => {
        if (kpi.competencia) {
          const [mesStr] = kpi.competencia.split('/');
          const mes = parseInt(mesStr, 10);
          if (mes >= 1 && mes <= 12) {
            const atingimento = kpi.metasReal !== null ? kpi.metasReal * 100 : null;
            meses[mes] = {
              meta: kpi.meta,
              resultado: kpi.resultado,
              atingimento
            };
          }
        }
      });
      
      // Calcular atingimento do mês selecionado
      const dadosMesSelecionado = meses[mesCompetencia];
      const atingimentoMes = dadosMesSelecionado?.atingimento ?? null;
      
      // Calcular atingimento do ano (média dos meses finalizados)
      const mesesFinalizados = Object.values(meses).filter(m => m !== null && m.atingimento !== null);
      const atingimentoAno = mesesFinalizados.length > 0
        ? mesesFinalizados.reduce((acc, m) => acc + (m?.atingimento || 0), 0) / mesesFinalizados.length
        : null;
      
      return {
        kpi: kpiName,
        grandeza,
        meses,
        atingimentoMes,
        atingimentoAno
      };
    });
  };
  
  // Formatar valor conforme grandeza
  const formatarValor = (valor: number, grandeza: string): string => {
    if (grandeza === '%') {
      return `${(valor * 100).toFixed(2)}%`;
    }
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Filtrar OKRs de um time específico para o ano selecionado
  const getOkrsForTeam = (time: string): NovoOkrData[] => {
    // Obter os nomes de times OKR correspondentes ao time KPI
    const okrTeamNames = teamMappingKpiToOkr[time.toUpperCase()] || [time.toUpperCase()];
    
    return novoOkrs.filter(okr => {
      if (!okr.data) return false;
      const parts = okr.data.split('/');
      if (parts.length !== 3) return false;
      const ano = parseInt(parts[2], 10);
      const timeMatch = okrTeamNames.some(t => okr.time?.toUpperCase() === t);
      return ano === anoCompetencia && timeMatch;
    });
  };
  
  // Filtrar Projetos de um time específico
  const getProjectsForTeam = (time: string): ProjectData[] => {
    const timeUpper = time.toUpperCase();
    
    // Mapeamento de times da tabela de performance para times da planilha de projetos
    const teamMappingProjetos: Record<string, string[]> = {
      'GESTÃO': ['GESTÃO'],
      'GESTÃO DE PESSOAS': ['GESTÃO DE PESSOAS', 'GP'],
      'TI': ['TI'],
      'EXPANSÃO': ['EXPANSÃO'],
      'ATENDIMENTO': ['ATENDIMENTO'],
      'PERFORMANCE': ['PERFORMANCE'],
      'PÓS VENDA - CAF': ['PÓS VENDA - CAF', 'POS VENDA', 'PÓS VENDA'],
      'POS VENDA': ['POS VENDA', 'PÓS VENDA'],
      'FINANCEIRO (CSC)': ['FINANCEIRO (CSC)', 'FINANCEIRO', 'CSC'],
      'CASH OUT | CONTROLADORIA': ['CASH OUT | CONTROLADORIA', 'CONTROLADORIA', 'CASH OUT'],
      'FEAT': ['FEAT'],
      'MARKETING E GROWTH': ['MARKETING E GROWTH', 'MARKETING'],
      'SQUAD FORNECEDORES': ['SQUAD FORNECEDORES', 'FORNECEDORES'],
      'SQUAD PRODUTOS': ['SQUAD PRODUTOS', 'PRODUTOS']
    };
    
    const timesValidos = teamMappingProjetos[timeUpper] || [timeUpper];
    
    return projetos.filter(projeto => {
      const projetoTime = projeto.time?.toUpperCase();
      // Verificar correspondência exata com os times mapeados
      return timesValidos.some(t => projetoTime === t);
    });
  };
  
  // Tipo para OKR agrupado com último resultado
  type OkrAgrupado = {
    indicadorNome: string;
    objetivo: string;
    idOkr: number;
    idKr: number;
    quarter: number;
    meta: number;
    realizado: number;
    atingimento: number;
    data: string;
    formaDeMedir: string;
  };
  
  // Tipo para OKRs agrupados por objetivo dentro de um quarter
  type OkrsPorObjetivo = {
    objetivo: string;
    idOkr: number;
    indicadores: OkrAgrupado[];
  };
  
  // Tipo para hierarquia Quarter > OKR > KRs
  type OkrsPorQuarter = {
    quarter: number;
    objetivos: OkrsPorObjetivo[];
  };
  
  // Agrupar OKRs por indicadorNome e aplicar regras de acordo com FORMA DE MEDIR
  const getOkrsAgrupados = (teamOkrs: NovoOkrData[]): OkrAgrupado[] => {
    // Agrupar por indicadorNome
    const okrGroups: Record<string, NovoOkrData[]> = {};
    teamOkrs.forEach(okr => {
      const nome = okr.indicadorNome || okr.indicador;
      if (!okrGroups[nome]) {
        okrGroups[nome] = [];
      }
      okrGroups[nome].push(okr);
    });
    
    // Para cada indicador, aplicar a regra de acordo com FORMA DE MEDIR
    const result = Object.entries(okrGroups).map(([indicadorNome, okrData]) => {
      // Ordenar por data (mais recente primeiro)
      const sorted = okrData.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          const [dia, mes, ano] = dateStr.split('/').map(Number);
          return new Date(ano, mes - 1, dia).getTime();
        };
        return parseDate(b.data) - parseDate(a.data);
      });
      
      const ultimo = sorted[0];
      const formaDeMedir = ultimo.formaDeMedir || '';
      const objetivo = ultimo.objetivo || 'Sem Objetivo';
      const idOkr = ultimo.idOkr || 0;
      const idKr = ultimo.idKr || 0;
      const quarter = ultimo.quarter || 0;
      
      // Se FORMA DE MEDIR for ACUMULADO, somar meta e realizado de todo o período
      if (formaDeMedir === 'ACUMULADO') {
        const metaTotal = okrData.reduce((acc, okr) => acc + okr.meta, 0);
        const realizadoTotal = okrData.reduce((acc, okr) => acc + okr.realizado, 0);
        const atingimento = metaTotal > 0 ? (realizadoTotal / metaTotal) * 100 : 0;
        
        return {
          indicadorNome,
          objetivo,
          idOkr,
          idKr,
          quarter,
          meta: metaTotal,
          realizado: realizadoTotal,
          atingimento: atingimento,
          data: ultimo.data,
          formaDeMedir
        };
      }
      
      // Caso contrário, pegar o último valor (mais recente)
      return {
        indicadorNome,
        objetivo,
        idOkr,
        idKr,
        quarter,
        meta: ultimo.meta,
        realizado: ultimo.realizado,
        atingimento: ultimo.atingReal,
        data: ultimo.data,
        formaDeMedir
      };
    });
    
    // Ordenar por Quarter, ID_OKR e depois ID_KR
    return result.sort((a, b) => {
      if (a.quarter !== b.quarter) return a.quarter - b.quarter;
      if (a.idOkr !== b.idOkr) return a.idOkr - b.idOkr;
      return a.idKr - b.idKr;
    });
  };
  
  // Agrupar OKRs por Quarter > Objetivo > KRs (hierarquia completa)
  const getOkrsPorQuarter = (okrsAgrupados: OkrAgrupado[]): OkrsPorQuarter[] => {
    // Primeiro agrupar por quarter
    const quarterGroups: Record<number, OkrAgrupado[]> = {};
    
    okrsAgrupados.forEach(okr => {
      const q = okr.quarter || 0;
      if (!quarterGroups[q]) {
        quarterGroups[q] = [];
      }
      quarterGroups[q].push(okr);
    });
    
    // Para cada quarter, agrupar por objetivo
    return Object.entries(quarterGroups)
      .map(([quarterStr, okrs]) => {
        const quarter = parseInt(quarterStr, 10);
        
        // Agrupar por objetivo dentro do quarter
        const objetivoGroups: Record<string, { idOkr: number; indicadores: OkrAgrupado[] }> = {};
        
        okrs.forEach(okr => {
          const obj = okr.objetivo || 'Sem Objetivo';
          if (!objetivoGroups[obj]) {
            objetivoGroups[obj] = { idOkr: okr.idOkr, indicadores: [] };
          }
          objetivoGroups[obj].indicadores.push(okr);
        });
        
        // Ordenar objetivos por ID_OKR e indicadores por ID_KR
        const objetivos = Object.entries(objetivoGroups)
          .map(([objetivo, data]) => ({
            objetivo,
            idOkr: data.idOkr,
            indicadores: data.indicadores.sort((a, b) => a.idKr - b.idKr)
          }))
          .sort((a, b) => a.idOkr - b.idOkr);
        
        return {
          quarter,
          objetivos
        };
      })
      .sort((a, b) => a.quarter - b.quarter);
  };
  
  // Função para toggle da expansão
  const toggleExpand = (time: string) => {
    setExpandedTeam(expandedTeam === time ? null : time);
  };
  
  // Calcular métricas gerais
  const timesCom80Porcento = teams.filter(team => team.mediaGeral >= 80).length;
  const totalTimes = teams.length;
  const percentualTimes80 = totalTimes > 0 ? (timesCom80Porcento / totalTimes) * 100 : 0;
  
  const totalIndicadores = teams.reduce((acc, team) => acc + team.totalIndicadores, 0);
  const somaMedias = teams.reduce((acc, team) => acc + (team.mediaGeral * team.totalIndicadores), 0);
  const mediaGeralConsolidada = totalIndicadores > 0 ? somaMedias / totalIndicadores : 0;

  if (teams.length === 0) {
    return (
      <div className="mb-8">
        <SectionTitle 
          title="Performance dos Times" 
          icon=""
          subtitle={`Competência: ${competencia}`}
        />
        <Card>
          <p className="text-slate-400 text-center py-8">
            Nenhum dado disponível para a competência {competencia}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{timesCom80Porcento}</p>
            <p className="text-slate-400 text-sm">TIMES ACIMA DE 80%</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{percentualTimes80.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm">% TIMES NA META</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p 
              className="text-3xl font-bold"
              style={{ color: getStatusColor(mediaGeralConsolidada) }}
            >
              {mediaGeralConsolidada.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">MÉDIA GERAL</p>
          </div>
        </Card>
      </div>

      {/* Container agrupando título e tabela */}
      <Card>
        <SectionTitle 
          title="PERFORMANCE DOS TIMES" 
          icon=""
          subtitle={`Competência: ${competencia}`}
        />
        
        {/* Tabela detalhada */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-orange-500">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">TIME</th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => setSelectionMode('projeto')}
                    className={`font-medium px-3 py-1 rounded transition-all ${
                      selectionMode === 'projeto' 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-300 hover:text-orange-400 hover:bg-slate-700'
                    }`}
                  >
                    PROJETOS
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => setSelectionMode('kpi')}
                    className={`font-medium px-3 py-1 rounded transition-all ${
                      selectionMode === 'kpi' 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-300 hover:text-orange-400 hover:bg-slate-700'
                    }`}
                  >
                    MÉDIA KPIS
                  </button>
                </th>
                <th className="text-center py-3 px-4">
                  <button
                    onClick={() => setSelectionMode('okr')}
                    className={`font-medium px-3 py-1 rounded transition-all ${
                      selectionMode === 'okr' 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-300 hover:text-orange-400 hover:bg-slate-700'
                    }`}
                  >
                    MÉDIA OKRS
                  </button>
                </th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">MÉDIA GERAL</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => {
                const isExpanded = expandedTeam === team.time;
                const teamKpis = getKpisForTeam(team.time);
                const teamOkrs = getOkrsForTeam(team.time);
                const teamProjetos = getProjectsForTeam(team.time);
                
                // Calcular média de atingimento dos projetos do time
                const mediaProjetosList = teamProjetos.filter(p => p.atingimento > 0);
                const mediaProjetos = mediaProjetosList.length > 0
                  ? mediaProjetosList.reduce((acc, p) => acc + p.atingimento, 0) / mediaProjetosList.length
                  : null;
                
                return (
                  <React.Fragment key={index}>
                    <tr 
                      className={`${index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/50'} hover:bg-slate-700/30 transition-colors cursor-pointer`}
                      onClick={() => toggleExpand(team.time)}
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`transform transition-transform duration-200 text-orange-500 ${isExpanded ? 'rotate-90' : ''}`}
                          >
                            ▶
                          </span>
                          {team.time}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBar value={mediaProjetos} />
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBar value={team.mediaKpis} />
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBar value={team.mediaOkrs} />
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBar value={team.mediaGeral} isBold />
                      </td>
                    </tr>
                    
                    {/* Linha expandida com detalhes */}
                    {isExpanded && (
                      <tr className="bg-slate-900/80">
                        <td colSpan={5} className="py-4 px-6">
                          <div className="border-l-4 border-orange-500 pl-4">
                            {selectionMode === 'kpi' ? (
                              <>
                                {(() => {
                                  const kpisPivotados = getKpisPivotados(teamKpis);
                                  const kpisUnicos = [...new Set(teamKpis.map(k => k.kpi))];
                                  return (
                                    <>
                                      <h4 className="text-orange-400 font-semibold mb-3">
                                        KPIs - {team.time} ({kpisUnicos.length} indicadores)
                                      </h4>
                                      {kpisPivotados.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs">
                                            <thead>
                                              <tr className="border-b border-slate-700">
                                                <th className="text-left py-2 px-2 text-slate-400 sticky left-0 bg-slate-900 min-w-[180px]">KPI</th>
                                                {mesesNomes.map((mes, idx) => (
                                                  <th 
                                                    key={mes} 
                                                    className={`text-center py-2 px-2 text-slate-400 min-w-[80px] ${idx + 1 === mesCompetencia ? 'bg-orange-500/20' : ''}`}
                                                  >
                                                    {mes}
                                                  </th>
                                                ))}
                                                <th className="text-center py-2 px-2 text-slate-400 min-w-[90px] bg-slate-800">Ating. Mês</th>
                                                <th className="text-center py-2 px-2 text-slate-400 min-w-[90px] bg-slate-800">Ating. Ano</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {kpisPivotados.map((row, rowIndex) => (
                                                <tr 
                                                  key={rowIndex}
                                                  className={rowIndex % 2 === 0 ? 'bg-slate-800/30' : ''}
                                                >
                                                  <td className="py-2 px-2 text-slate-300 sticky left-0 bg-slate-900 border-r border-slate-700">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-orange-400">↗</span>
                                                      <span className="truncate max-w-[160px]" title={row.kpi}>{row.kpi}</span>
                                                    </div>
                                                    <span className="text-slate-500 text-[10px]">{row.grandeza || 'valor'}</span>
                                                  </td>
                                                  {mesesNomes.map((_, mesIdx) => {
                                                    const mesNum = mesIdx + 1;
                                                    const dadosMes = row.meses[mesNum];
                                                    const isCurrentMonth = mesNum === mesCompetencia;
                                                    
                                                    if (!dadosMes) {
                                                      return (
                                                        <td 
                                                          key={mesIdx} 
                                                          className={`py-2 px-2 text-center text-slate-600 ${isCurrentMonth ? 'bg-orange-500/10' : ''}`}
                                                        >
                                                          -
                                                        </td>
                                                      );
                                                    }
                                                    
                                                    return (
                                                      <td 
                                                        key={mesIdx} 
                                                        className={`py-2 px-2 text-center ${isCurrentMonth ? 'bg-orange-500/10' : ''}`}
                                                      >
                                                        <div className="flex flex-col items-center">
                                                          <span className="text-slate-500 text-[10px]">
                                                            M: {formatarValor(dadosMes.meta, row.grandeza)}
                                                          </span>
                                                          <span className="text-slate-300 font-medium">
                                                            {formatarValor(dadosMes.resultado, row.grandeza)}
                                                          </span>
                                                          {dadosMes.atingimento !== null && (
                                                            <span 
                                                              className="text-[10px]"
                                                              style={{ color: getStatusColor(dadosMes.atingimento) }}
                                                            >
                                                              {dadosMes.atingimento.toFixed(0)}%
                                                            </span>
                                                          )}
                                                        </div>
                                                      </td>
                                                    );
                                                  })}
                                                  <td className="py-2 px-2 text-center bg-slate-800/50">
                                                    {row.atingimentoMes !== null ? (
                                                      <span 
                                                        className="font-semibold"
                                                        style={{ color: getStatusColor(row.atingimentoMes) }}
                                                      >
                                                        {row.atingimentoMes.toFixed(1)}%
                                                      </span>
                                                    ) : (
                                                      <span className="text-slate-600">-</span>
                                                    )}
                                                  </td>
                                                  <td className="py-2 px-2 text-center bg-slate-800/50">
                                                    {row.atingimentoAno !== null ? (
                                                      <span 
                                                        className="font-semibold"
                                                        style={{ color: getStatusColor(row.atingimentoAno) }}
                                                      >
                                                        {row.atingimentoAno.toFixed(1)}%
                                                      </span>
                                                    ) : (
                                                      <span className="text-slate-600">-</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 text-sm">Nenhum KPI encontrado para este time no ano de {anoCompetencia}</p>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : selectionMode === 'okr' ? (
                              <>
                                {(() => {
                                  const okrsAgrupados = getOkrsAgrupados(teamOkrs);
                                  const okrsPorQuarter = getOkrsPorQuarter(okrsAgrupados);
                                  return (
                                    <>
                                      <h4 className="text-orange-400 font-semibold mb-3">
                                        OKRs - {team.time} ({okrsAgrupados.length} indicadores)
                                      </h4>
                                      {okrsPorQuarter.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b border-slate-700">
                                                <th className="text-left py-2 px-3 text-slate-400">INDICADOR</th>
                                                <th className="text-center py-2 px-3 text-slate-400">META</th>
                                                <th className="text-center py-2 px-3 text-slate-400">REALIZADO</th>
                                                <th className="text-center py-2 px-3 text-slate-400">ATINGIMENTO</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {okrsPorQuarter.map((quarterGroup, quarterIndex) => {
                                                // Calcular média de atingimento do quarter
                                                const todosIndicadores = quarterGroup.objetivos.flatMap(obj => obj.indicadores);
                                                const mediaQuarter = todosIndicadores.length > 0
                                                  ? todosIndicadores.reduce((acc, okr) => acc + okr.atingimento, 0) / todosIndicadores.length
                                                  : 0;
                                                
                                                return (
                                                <React.Fragment key={quarterIndex}>
                                                  {/* Header do Quarter */}
                                                  <tr className="bg-orange-500/10">
                                                    <td 
                                                      colSpan={3} 
                                                      className="py-2 px-3 text-orange-400 text-sm font-semibold uppercase tracking-wide border-b border-orange-500/30"
                                                    >
                                                      Q{quarterGroup.quarter} - {anoCompetencia}
                                                    </td>
                                                    <td className="py-2 px-3 text-center border-b border-orange-500/30">
                                                      <span className="text-slate-400 text-xs mr-2">média do quarter</span>
                                                      <span 
                                                        className="font-semibold"
                                                        style={{ color: getStatusColor(mediaQuarter) }}
                                                      >
                                                        {mediaQuarter.toFixed(1)}%
                                                      </span>
                                                    </td>
                                                  </tr>
                                                  {/* Objetivos dentro do Quarter */}
                                                  {quarterGroup.objetivos.map((grupo, grupoIndex) => (
                                                    <React.Fragment key={grupoIndex}>
                                                      {/* Título do Objetivo Estratégico - discreto */}
                                                      <tr className="bg-slate-800/20">
                                                        <td 
                                                          colSpan={4} 
                                                          className="py-2 px-3 pl-6 text-slate-500 text-xs uppercase tracking-wide border-b border-slate-700/50"
                                                        >
                                                          <span className="text-orange-400/70">▸</span> {grupo.objetivo}
                                                        </td>
                                                      </tr>
                                                      {/* Indicadores (KRs) do objetivo */}
                                                      {grupo.indicadores.map((okr, okrIndex) => {
                                                        return (
                                                          <tr 
                                                            key={okrIndex}
                                                            className={okrIndex % 2 === 0 ? 'bg-slate-800/30' : ''}
                                                          >
                                                            <td className="py-2 px-3 pl-10 text-slate-300">{okr.indicadorNome}</td>
                                                            <td className="py-2 px-3 text-center text-slate-300">
                                                              {okr.meta ? `${okr.meta.toLocaleString('pt-BR')}%` : '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-center text-slate-300">
                                                              {okr.realizado ? `${okr.realizado.toLocaleString('pt-BR')}%` : '-'}
                                                            </td>
                                                            <td className="py-2 px-3 text-center">
                                                              <span style={{ color: getStatusColor(okr.atingimento) }}>
                                                                {okr.atingimento.toFixed(1)}%
                                                              </span>
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </React.Fragment>
                                                  ))}
                                                </React.Fragment>
                                              );})}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <p className="text-slate-500 text-sm">Nenhum OKR encontrado para este time no ano de {anoCompetencia}</p>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <>
                                {/* Seção de Projetos */}
                                <h4 className="text-orange-400 font-semibold mb-3">
                                  PROJETOS - {team.time} ({teamProjetos.length} projetos)
                                </h4>
                                {teamProjetos.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-slate-700">
                                          <th className="text-left py-2 px-3 text-slate-400">NOME DO PROJETO</th>
                                          <th className="text-center py-2 px-3 text-slate-400">STATUS</th>
                                          <th className="text-left py-2 px-3 text-slate-400">INDICADOR</th>
                                          <th className="text-center py-2 px-3 text-slate-400">RESULTADO ESPERADO</th>
                                          <th className="text-center py-2 px-3 text-slate-400">RESULTADO</th>
                                          <th className="text-center py-2 px-3 text-slate-400">% ATINGIMENTO</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {teamProjetos.map((projeto, projetoIndex) => (
                                          <tr 
                                            key={projetoIndex}
                                            className={projetoIndex % 2 === 0 ? 'bg-slate-800/30' : ''}
                                          >
                                            <td className="py-2 px-3 text-slate-300">{projeto.nome}</td>
                                            <td className="py-2 px-3 text-center">
                                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                projeto.status === 'Concluído' ? 'bg-green-500/20 text-green-400' :
                                                projeto.status === 'Em andamento' ? 'bg-orange-500/20 text-orange-400' :
                                                projeto.status === 'Atrasado' ? 'bg-red-500/20 text-red-400' :
                                                projeto.status === 'Não iniciado' ? 'bg-slate-500/20 text-slate-400' :
                                                'bg-slate-600/20 text-slate-300'
                                              }`}>
                                                {projeto.status || '-'}
                                              </span>
                                            </td>
                                            <td className="py-2 px-3 text-slate-300">{projeto.indicador || '-'}</td>
                                            <td className="py-2 px-3 text-center text-slate-300">
                                              {projeto.resultadoEsperado ? `${projeto.resultadoEsperado.toLocaleString('pt-BR')}%` : '-'}
                                            </td>
                                            <td className="py-2 px-3 text-center text-slate-300">
                                              {projeto.resultado ? `${projeto.resultado.toLocaleString('pt-BR')}%` : '-'}
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="flex flex-col gap-1 items-center">
                                                <span 
                                                  className="font-medium"
                                                  style={{ color: getStatusColor(projeto.atingimento) }}
                                                >
                                                  {projeto.atingimento ? `${projeto.atingimento.toFixed(1)}%` : '-'}
                                                </span>
                                                {projeto.atingimento > 0 && (
                                                  <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                      className="h-full rounded-full transition-all"
                                                      style={{
                                                        width: `${Math.min(projeto.atingimento, 100)}%`,
                                                        backgroundColor: getStatusColor(projeto.atingimento),
                                                        transitionDuration: '300ms'
                                                      }}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm">Nenhum projeto encontrado para este time</p>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeamPerformanceTable;
