'use client';

import React, { useMemo, useState } from 'react';
import { KpiData } from '../types';
import { Pencil, TrendingUp, TrendingDown, Info, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

interface KpiTableViewProps {
  kpiGroups: Record<string, KpiData[]>;
  accentColor: string;
  onEdit: (kpiName: string, data: KpiData[]) => void;
  onInactivate?: (kpiName: string, data: KpiData[]) => void;
  allKpiData?: KpiData[]; // Dados históricos de todos os anos
}

// Cores para linhas do gráfico por ano
const YEAR_COLORS = [
  '#ff6600', // laranja
  '#3b82f6', // azul
  '#10b981', // verde
  '#f59e0b', // âmbar
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#06b6d4', // ciano
  '#84cc16', // lima
];

// Nomes dos meses abreviados
const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Helper para formatar valor conforme grandeza
const formatValue = (value: number | undefined | null, grandeza: string): string => {
  if (value === undefined || value === null || isNaN(value)) return '-';
  
  if (grandeza === 'Moeda') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  }
  
  if (grandeza === '%') {
    // Valor já vem como percentual da planilha (10 = 10%), não multiplicar por 100
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }) + '%';
  }
  
  return new Intl.NumberFormat('pt-BR').format(value);
};

// Helper para extrair mês da competência (DD/MM/YYYY ou MM/YYYY)
const extractMonth = (competencia: string): number => {
  if (!competencia) return 0;
  const parts = competencia.split('/');
  if (parts.length === 3) {
    return parseInt(parts[1]); // DD/MM/YYYY
  } else if (parts.length === 2) {
    return parseInt(parts[0]); // MM/YYYY
  }
  return 0;
};

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Função para gerar texto explicativo do cálculo de atingimento
const getAtingimentoExplanation = (tipo: string, tendencia: string): string => {
  const tipoUpper = (tipo || '').toUpperCase().trim();
  
  if (tipoUpper === 'ACUMULADO NO ANO') {
    if (tendencia === 'MAIOR, MELHOR') {
      return 'Acumulado no Ano: Soma dos Resultados ÷ Soma das Metas × 100';
    } else {
      return 'Acumulado no Ano: Soma das Metas ÷ Soma dos Resultados × 100 (invertido por ser MENOR, MELHOR)';
    }
  } else if (tipoUpper === 'MÉDIA NO ANO') {
    return 'Média no Ano: Média aritmética dos atingimentos mensais';
  } else {
    return 'Evolução: Último atingimento mensal registrado';
  }
};

// Helper para ordenar por competência
const parseComp = (s: string) => {
  if (!s) return 0;
  const parts = s.split('/').map((x) => parseInt(x));
  if (parts.length === 3) {
    const [, mes, ano] = parts;
    return (ano || 0) * 100 + (mes || 0);
  } else if (parts.length === 2) {
    const [mes, ano] = parts;
    return (ano || 0) * 100 + (mes || 0);
  }
  return 0;
};

// Função para calcular atingimento baseado no TIPO
const calculateAtingimento = (
  data: KpiData[],
  tipo: string,
  tendencia: string
): number => {
  if (!data || data.length === 0) return 0;
  
  const tipoUpper = (tipo || '').toUpperCase().trim();
  
  // Ordenar dados por competência
  const sortedData = [...data].sort((a, b) => parseComp(a.competencia) - parseComp(b.competencia));
  
  if (tipoUpper === 'ACUMULADO NO ANO') {
    // Encontrar o último mês com resultado
    let lastIndexWithResult = -1;
    for (let i = sortedData.length - 1; i >= 0; i--) {
      if (sortedData[i].resultado !== null && sortedData[i].resultado !== undefined) {
        lastIndexWithResult = i;
        break;
      }
    }
    
    if (lastIndexWithResult === -1) return 0;
    
    // Somar resultados e metas do início até o último mês com resultado
    let somaResultado = 0;
    let somaMeta = 0;
    for (let i = 0; i <= lastIndexWithResult; i++) {
      somaResultado += sortedData[i].resultado || 0;
      somaMeta += sortedData[i].meta || 0;
    }
    
    if (somaMeta === 0) return 0;
    
    if (tendencia === 'MAIOR, MELHOR') {
      return (somaResultado / somaMeta) * 100;
    } else {
      // MENOR, MELHOR - conta inversa
      return somaResultado !== 0 ? (somaMeta / somaResultado) * 100 : 0;
    }
  } else if (tipoUpper === 'MÉDIA NO ANO') {
    // Média dos valores da coluna % ATINGIMENTO (atingimento)
    const itemsWithAtingimento = data.filter(
      (item) => item.atingimento !== null && item.atingimento !== undefined
    );
    if (itemsWithAtingimento.length === 0) return 0;
    
    const totalAtingimento = itemsWithAtingimento.reduce(
      (acc, item) => acc + (item.atingimento || 0),
      0
    );
    return totalAtingimento / itemsWithAtingimento.length;
  } else {
    // EVOLUÇÃO ou outros - último valor da coluna % ATINGIMENTO
    // Pegar o último item com atingimento preenchido
    for (let i = sortedData.length - 1; i >= 0; i--) {
      if (sortedData[i].atingimento !== null && sortedData[i].atingimento !== undefined) {
        return sortedData[i].atingimento || 0;
      }
    }
    return 0;
  }
};

// Função para calcular Atingimento do Ano
const calculateAtingimentoAno = (
  data: KpiData[],
  tipo: string,
  tendencia: string
): number => {
  if (!data || data.length === 0) return 0;
  
  const tipoUpper = (tipo || '').toUpperCase().trim();
  const isMenorMelhor = tendencia === 'MENOR, MELHOR';
  
  // Ordenar dados por competência
  const sortedData = [...data].sort((a, b) => parseComp(a.competencia) - parseComp(b.competencia));
  
  // Encontrar o último mês com resultado
  let ultimoIdxComResultado = -1;
  for (let i = sortedData.length - 1; i >= 0; i--) {
    if (sortedData[i].resultado !== null && sortedData[i].resultado !== undefined) {
      ultimoIdxComResultado = i;
      break;
    }
  }
  
  if (ultimoIdxComResultado === -1) return 0;
  
  if (tipoUpper === 'EVOLUÇÃO' || tipoUpper === 'MÉDIA NO ANO') {
    // EVOLUÇÃO / MÉDIA NO ANO: Último Resultado / Meta de dezembro (último mês)
    const ultimoRes = sortedData[ultimoIdxComResultado].resultado || 0;
    const metaDezembro = sortedData[sortedData.length - 1]?.meta || 0;
    
    if (metaDezembro === 0) return 0;
    
    if (isMenorMelhor) {
      return ultimoRes !== 0 ? (metaDezembro / ultimoRes) * 100 : 0;
    } else {
      return (ultimoRes / metaDezembro) * 100;
    }
  } else {
    // ACUMULADO NO ANO: Soma dos resultados / Soma total das metas do ano
    let somaResultado = 0;
    let somaMetaTotal = 0;
    
    for (let i = 0; i <= ultimoIdxComResultado; i++) {
      somaResultado += sortedData[i].resultado || 0;
    }
    
    for (let i = 0; i < sortedData.length; i++) {
      somaMetaTotal += sortedData[i].meta || 0;
    }
    
    if (somaMetaTotal === 0) return 0;
    
    if (isMenorMelhor) {
      return somaResultado !== 0 ? (somaMetaTotal / somaResultado) * 100 : 0;
    } else {
      return (somaResultado / somaMetaTotal) * 100;
    }
  }
};

const KpiTableView: React.FC<KpiTableViewProps> = ({ kpiGroups, accentColor, onEdit, onInactivate, allKpiData }) => {
  // Estado para controlar qual tooltip está visível
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  // Estado para controlar qual KPI está expandido (gráfico histórico)
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  // Estado para controlar anos selecionados no gráfico
  const [selectedYears, setSelectedYears] = useState<Record<string, string[]>>({});

  // Transformar dados para formato de tabela
  const tableData = useMemo(() => {
    return Object.entries(kpiGroups).map(([kpiName, data]) => {
      // Primeiro item para obter grandeza, tendência e tipo
      const firstItem = data[0];
      const grandeza = firstItem?.grandeza || '';
      const tendencia = firstItem?.tendencia || '';
      const tipo = firstItem?.tipo || '';
      
      // Metas e resultados por mês
      const monthlyData: Record<number, { meta: number; resultado: number | null; situacao: string }> = {};
      
      data.forEach((item) => {
        const month = extractMonth(item.competencia);
        if (month > 0) {
          const situacaoNormalizada = (item.situacao || 'Ativo').toString().trim().toUpperCase();
          monthlyData[month] = {
            meta: item.meta,
            resultado: item.resultado ?? null,
            situacao: situacaoNormalizada,
          };
        }
      });
      
      // Calcular atingimento baseado no TIPO
      const calculatedAtingimento = calculateAtingimento(data, tipo, tendencia);
      
      // Calcular atingimento do ano
      const atingimentoAno = calculateAtingimentoAno(data, tipo, tendencia);
      
      // Verificar se tem meses inativos e encontrar o primeiro
      const mesesOrdenados = Object.keys(monthlyData).map(Number).sort((a, b) => a - b);
      const primeiroMesInativo = mesesOrdenados.find(m => monthlyData[m].situacao === 'INATIVO');
      
      return {
        kpiName,
        grandeza,
        tendencia,
        tipo,
        monthlyData,
        avgAtingimento: calculatedAtingimento,
        atingAno: atingimentoAno,
        data,
        primeiroMesInativo,
      };
    });
  }, [kpiGroups]);

  // Determinar quais meses têm dados
  const activeMonths = useMemo(() => {
    const monthsSet = new Set<number>();
    tableData.forEach((row) => {
      Object.keys(row.monthlyData).forEach((m) => monthsSet.add(parseInt(m)));
    });
    return Array.from(monthsSet).sort((a, b) => a - b);
  }, [tableData]);

  // Função para extrair ano da competência
  const extractYear = (competencia: string): string => {
    if (!competencia) return '';
    const parts = competencia.split('/');
    if (parts.length === 3) {
      return parts[2]; // DD/MM/YYYY
    } else if (parts.length === 2) {
      return parts[1]; // MM/YYYY
    }
    return '';
  };

  // Função para preparar dados do gráfico histórico de um KPI
  const getHistoricalChartData = (kpiName: string) => {
    if (!allKpiData) return { chartData: [], years: [] };

    // Filtrar dados deste KPI
    const kpiHistoricData = allKpiData.filter(d => d.kpi === kpiName);
    
    // Agrupar por ano
    const dataByYear: Record<string, Record<number, number | null>> = {};
    
    kpiHistoricData.forEach(item => {
      const year = extractYear(item.competencia);
      const month = extractMonth(item.competencia);
      
      if (year && month > 0) {
        if (!dataByYear[year]) {
          dataByYear[year] = {};
        }
        dataByYear[year][month] = item.resultado;
      }
    });

    // Anos disponíveis ordenados
    const years = Object.keys(dataByYear).sort();

    // Criar dados para o gráfico (12 meses)
    const chartData = MONTHS.map((monthName, idx) => {
      const monthNum = idx + 1;
      const dataPoint: Record<string, string | number | null> = { month: monthName };
      
      years.forEach(year => {
        dataPoint[year] = dataByYear[year]?.[monthNum] ?? null;
      });
      
      return dataPoint;
    });

    return { chartData, years };
  };

  // Inicializar anos selecionados quando expandir KPI
  const handleToggleExpand = (kpiName: string) => {
    if (expandedKpi === kpiName) {
      setExpandedKpi(null);
    } else {
      setExpandedKpi(kpiName);
      // Inicializar com os 2 últimos anos selecionados
      const { years } = getHistoricalChartData(kpiName);
      if (years.length > 0 && !selectedYears[kpiName]) {
        const lastTwoYears = years.slice(-2);
        setSelectedYears(prev => ({ ...prev, [kpiName]: lastTwoYears }));
      }
    }
  };

  // Toggle seleção de ano
  const handleToggleYear = (kpiName: string, year: string) => {
    setSelectedYears(prev => {
      const current = prev[kpiName] || [];
      if (current.includes(year)) {
        return { ...prev, [kpiName]: current.filter(y => y !== year) };
      } else {
        return { ...prev, [kpiName]: [...current, year] };
      }
    });
  };

  // Formatador para valores do tooltip
  const formatChartValue = (value: number | null, grandeza: string): string => {
    if (value === null || value === undefined) return '-';
    
    if (grandeza === 'moeda') {
      if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)} mi`;
      } else if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)} mil`;
      }
      return `R$ ${value.toLocaleString('pt-BR')}`;
    }
    
    if (grandeza === '%') {
      return `${value.toFixed(1)}%`;
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} mi`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)} mil`;
    }
    
    return value.toLocaleString('pt-BR');
  };

  if (tableData.length === 0) {
    return (
      <div className="bg-dark-card rounded-xl p-8 text-center">
        <p className="text-gray-400">Nenhum KPI encontrado para este time.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
        <table className="w-full text-sm" style={{ minWidth: '1200px' }}>
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left text-gray-400 font-medium sticky left-0 bg-dark-card z-10 min-w-[200px]">
                KPI
              </th>
              <th className="px-3 py-3 text-center text-gray-400 font-medium min-w-[80px]">
                Tendência
              </th>
              {activeMonths.map((month) => (
                <th key={month} className="px-3 py-3 text-center text-gray-400 font-medium min-w-[90px]">
                  {MONTHS[month - 1]}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-gray-400 font-medium min-w-[100px]">
                Ating. do Mês
              </th>
              <th className="px-3 py-3 text-center text-gray-400 font-medium min-w-[100px]">
                Ating. Ano
              </th>
              <th className="px-3 py-3 text-center text-gray-400 font-medium w-[60px]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => {
              // Determinar status do atingimento
              let statusColor = 'text-gray-400';
              if (row.avgAtingimento >= 100) {
                statusColor = 'text-green-400';
              } else if (row.avgAtingimento >= 80) {
                statusColor = 'text-yellow-400';
              } else if (row.avgAtingimento > 0) {
                statusColor = 'text-red-400';
              }

              return (
                <React.Fragment key={row.kpiName}>
                  <tr 
                    className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${idx % 2 === 0 ? 'bg-dark-card' : 'bg-dark-primary/30'}`}
                  >
                    {/* Nome do KPI - Clicável para expandir */}
                    <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                      <button
                        onClick={() => allKpiData && handleToggleExpand(row.kpiName)}
                        className={`flex items-center gap-2 w-full text-left ${allKpiData ? 'cursor-pointer hover:text-orange-400' : 'cursor-default'} transition-colors`}
                        disabled={!allKpiData}
                      >
                        {allKpiData && (
                          expandedKpi === row.kpiName ? (
                            <ChevronUp size={16} className="text-orange-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                          )
                        )}
                        <div>
                          <div className="font-medium text-white truncate max-w-[160px]" title={row.kpiName}>
                            {row.kpiName}
                          </div>
                          <div className="text-xs text-gray-500">{row.grandeza}</div>
                          {row.primeiroMesInativo && (
                            <div className="text-xs text-red-400 mt-0.5">
                              Inativo a partir de {monthNames[row.primeiroMesInativo - 1]}
                            </div>
                          )}
                        </div>
                      </button>
                    </td>
                  
                  {/* Tendência */}
                  <td className="px-3 py-3 text-center">
                    {row.tendencia === 'MAIOR, MELHOR' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400">
                        <TrendingUp size={14} />
                      </span>
                    ) : row.tendencia === 'MENOR, MELHOR' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-400">
                        <TrendingDown size={14} />
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  
                  {/* Dados mensais */}
                  {activeMonths.map((month) => {
                    const monthData = row.monthlyData[month];
                    if (!monthData) {
                      return (
                        <td key={month} className="px-3 py-3 text-center text-gray-600">
                          -
                        </td>
                      );
                    }
                    
                    // Se o mês está inativado, mostrar apenas "-"
                    if (monthData.situacao === 'INATIVO') {
                      return (
                        <td key={month} className="px-3 py-3 text-center text-gray-600">
                          -
                        </td>
                      );
                    }
                    
                    const meta = monthData.meta;
                    const resultado = monthData.resultado;
                    
                    // Calcular atingimento do mês baseado na tendência
                    let monthAtingimento = 0;
                    
                    if (resultado !== null && meta > 0) {
                      // Para MENOR, MELHOR: gastar menos é melhor, então inverte o cálculo
                      if (row.tendencia === 'MENOR, MELHOR') {
                        monthAtingimento = resultado > 0 ? (meta / resultado) * 100 : 100;
                      } else {
                        // MAIOR, MELHOR: resultado maior é melhor
                        monthAtingimento = (resultado / meta) * 100;
                      }
                    }
                    
                    return (
                      <td key={month} className="px-3 py-2 text-center">
                        <div className="text-xs text-gray-400">
                          M: {formatValue(meta, row.grandeza)}
                        </div>
                        <div className="text-sm text-white font-medium">
                          {resultado !== null ? formatValue(resultado, row.grandeza) : '-'}
                        </div>
                        {resultado !== null && meta > 0 && (
                          <div className={`text-xs ${monthAtingimento >= 100 ? 'text-green-400' : monthAtingimento >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {monthAtingimento.toFixed(0)}%
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Atingimento médio */}
                  <td className={`px-3 py-3 text-center font-semibold ${statusColor}`}>
                    <span>{row.avgAtingimento > 0 ? `${row.avgAtingimento.toFixed(1)}%` : '-'}</span>
                  </td>
                  
                  {/* Atingimento do Ano */}
                  <td className={`px-3 py-3 text-center font-semibold ${row.atingAno >= 100 ? 'text-green-400' : row.atingAno >= 80 ? 'text-yellow-400' : row.atingAno > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    <div className="relative inline-flex items-center gap-1">
                      <span>{row.atingAno > 0 ? `${row.atingAno.toFixed(1)}%` : '-'}</span>
                      <button
                        className="text-gray-500 hover:text-gray-300 transition-colors"
                        onMouseEnter={() => setActiveTooltip(row.kpiName)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        onClick={() => setActiveTooltip(activeTooltip === row.kpiName ? null : row.kpiName)}
                      >
                        <Info size={14} />
                      </button>
                      {/* Tooltip */}
                      {activeTooltip === row.kpiName && (
                        <div className="absolute bottom-full right-0 mb-2 z-50 w-64 p-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl text-xs text-gray-300 font-normal">
                          <div className="font-semibold text-white mb-1">{row.tipo || 'EVOLUÇÃO'}</div>
                          {getAtingimentoExplanation(row.tipo, row.tendencia)}
                          <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800 border-r border-b border-gray-600"></div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Ações */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(row.kpiName, row.data)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                        title="Editar KPI"
                      >
                        <Pencil size={16} />
                      </button>
                      {onInactivate && (
                        <button
                          onClick={() => onInactivate(row.kpiName, row.data)}
                          className="p-1.5 rounded-lg hover:bg-red-900/50 transition-colors text-gray-400 hover:text-red-400"
                          title="Inativar KPI"
                        >
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Linha expandível com gráfico histórico */}
                {expandedKpi === row.kpiName && allKpiData && (() => {
                  const { chartData, years } = getHistoricalChartData(row.kpiName);
                  const currentSelectedYears = selectedYears[row.kpiName] || years.slice(-2);
                  
                  return (
                    <tr className="bg-dark-primary/50">
                      <td colSpan={activeMonths.length + 5} className="p-4">
                        <div className="bg-dark-card rounded-xl p-4">
                          {/* Cabeçalho com título e legenda */}
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-white font-medium text-sm tracking-wide">COMPARATIVO DE {row.kpiName.toUpperCase()}</h4>
                            {/* Legenda no canto direito */}
                            <div className="flex items-center gap-4">
                              {currentSelectedYears.sort().map((year) => {
                                const colorIdx = years.indexOf(year) % YEAR_COLORS.length;
                                return (
                                  <div key={year} className="flex items-center gap-1.5">
                                    <span 
                                      className="w-3 h-3 rounded-sm"
                                      style={{ backgroundColor: YEAR_COLORS[colorIdx] }}
                                    />
                                    <span className="text-sm text-gray-300 font-medium">{year}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Filtros de ano abaixo do título */}
                          <div className="flex items-center gap-2 mb-4">
                            {years.map((year) => {
                              const isSelected = currentSelectedYears.includes(year);
                              const colorIdx = years.indexOf(year) % YEAR_COLORS.length;
                              return (
                                <button
                                  key={year}
                                  onClick={() => handleToggleYear(row.kpiName, year)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                    isSelected
                                      ? 'text-white'
                                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                  }`}
                                  style={isSelected ? { backgroundColor: YEAR_COLORS[colorIdx] } : {}}
                                >
                                  {year}
                                </button>
                              );
                            })}
                          </div>
                          
                          {/* Gráfico */}
                          <div style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 35, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="0" horizontal={true} vertical={false} stroke="#374151" />
                                <XAxis 
                                  dataKey="month" 
                                  stroke="#6b7280"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <YAxis 
                                  stroke="#6b7280"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                                  tickFormatter={(value) => formatChartValue(value, row.grandeza)}
                                />
                                <Tooltip
                                  content={({ active, payload, label }) => {
                                    if (!active || !payload || payload.length === 0) return null;
                                    return (
                                      <div className="bg-black/95 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
                                        <p className="text-white font-medium mb-1.5">{label}</p>
                                        {payload.map((entry: any, idx: number) => {
                                          const colorIdx = years.indexOf(entry.name) % YEAR_COLORS.length;
                                          return (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                              <span 
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: YEAR_COLORS[colorIdx] }}
                                              />
                                              <span className="text-gray-300">
                                                {entry.name}: {formatChartValue(entry.value, row.grandeza)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  }}
                                />
                                {currentSelectedYears.map((year) => {
                                  const colorIdx = years.indexOf(year) % YEAR_COLORS.length;
                                  return (
                                    <Line
                                      key={year}
                                      type="monotone"
                                      dataKey={year}
                                      stroke={YEAR_COLORS[colorIdx]}
                                      strokeWidth={2}
                                      dot={{ fill: YEAR_COLORS[colorIdx], strokeWidth: 2, r: 5 }}
                                      activeDot={{ r: 7, fill: YEAR_COLORS[colorIdx] }}
                                      connectNulls
                                      name={year}
                                    >
                                      <LabelList
                                        dataKey={year}
                                        position="top"
                                        formatter={(value: any) => value !== null && value !== undefined ? formatChartValue(value, row.grandeza) : ''}
                                        fill={YEAR_COLORS[colorIdx]}
                                        fontSize={11}
                                        offset={10}
                                      />
                                    </Line>
                                  );
                                })}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })()}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legenda */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center gap-6 text-xs text-gray-500">
        <span>M: Meta</span>
        <span className="flex items-center gap-1">
          <span className="text-green-400">●</span>
          ≥100%
        </span>
        <span className="flex items-center gap-1">
          <span className="text-yellow-400">●</span>
          80-99%
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-400">●</span>
          &lt;80%
        </span>
      </div>
    </div>
  );
};

export default KpiTableView;
