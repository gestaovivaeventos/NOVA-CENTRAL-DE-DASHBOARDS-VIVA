'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { KpiData, NovoOkrData, ProjectData } from '../types';

interface PerformanceChartProps {
  kpis: KpiData[];
  novoOkrs: NovoOkrData[];
  projetos: ProjectData[];
}

type FilterType = 'kpi' | 'okr' | 'projeto';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const QUARTERS = ['1Q', '2Q', '3Q', '4Q'];

// Datas de fechamento de quarter (dia/mês)
const QUARTER_DATES = ['01/03', '01/06', '01/09', '01/12'];

// Cores para diferentes anos
const YEAR_COLORS: Record<number, string> = {
  2019: '#64748B',
  2020: '#94A3B8',
  2021: '#A78BFA',
  2022: '#60A5FA',
  2023: '#34D399',
  2024: '#FBBF24',
  2025: '#FF6600',
  2026: '#EF4444',
  2027: '#EC4899',
  2028: '#8B5CF6',
};

const getYearColor = (year: number): string => {
  return YEAR_COLORS[year] || '#FF6600';
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  kpis,
  novoOkrs,
  projetos
}) => {
  const [filterType, setFilterType] = useState<FilterType>('kpi');
  const [selectedYears, setSelectedYears] = useState<number[]>([2025, 2026]);
  const [selectedTeam, setSelectedTeam] = useState<string>('Todos');

  // Times disponíveis baseados nos dados
  const availableTeams = useMemo(() => {
    const teams = new Set<string>();
    
    kpis.forEach(kpi => {
      if (kpi.time) teams.add(kpi.time);
    });
    
    novoOkrs.forEach(okr => {
      if (okr.time) teams.add(okr.time);
    });
    
    projetos.forEach(projeto => {
      if (projeto.time) teams.add(projeto.time);
    });
    
    return ['Todos', ...Array.from(teams).sort()];
  }, [kpis, novoOkrs, projetos]);

  // Filtrar dados pelo time selecionado
  const filteredKpis = useMemo(() => {
    if (selectedTeam === 'Todos') return kpis;
    return kpis.filter(kpi => kpi.time === selectedTeam);
  }, [kpis, selectedTeam]);

  const filteredOkrs = useMemo(() => {
    if (selectedTeam === 'Todos') return novoOkrs;
    return novoOkrs.filter(okr => okr.time === selectedTeam);
  }, [novoOkrs, selectedTeam]);

  const filteredProjetos = useMemo(() => {
    if (selectedTeam === 'Todos') return projetos;
    return projetos.filter(projeto => projeto.time === selectedTeam);
  }, [projetos, selectedTeam]);

  // Obter anos disponíveis
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    
    kpis.forEach(kpi => {
      if (kpi.year) years.add(kpi.year);
    });
    
    novoOkrs.forEach(okr => {
      if (okr.data) {
        const parts = okr.data.split('/');
        if (parts.length === 3) {
          const year = parseInt(parts[2], 10);
          if (year) years.add(year);
        }
      }
    });
    
    return Array.from(years).sort((a, b) => a - b);
  }, [kpis, novoOkrs]);

  // Calcular dados do gráfico
  const chartData = useMemo(() => {
    if (filterType === 'okr') {
      // Para OKRs, usar quarters com datas específicas de fechamento
      const quarterData: Record<string, Record<number, { total: number; count: number }>> = {};
      
      // Inicializar quarters
      QUARTERS.forEach(q => {
        quarterData[q] = {};
      });
      
      // Processar OKRs - apenas datas de fechamento de quarter (01/03, 01/06, 01/09, 01/12)
      filteredOkrs.forEach(okr => {
        if (!okr.data || !okr.atingReal) return;
        
        const parts = okr.data.split('/');
        if (parts.length !== 3) return;
        
        const dia = parts[0].padStart(2, '0');
        const mes = parts[1].padStart(2, '0');
        const year = parseInt(parts[2], 10);
        
        const dataFormatada = `${dia}/${mes}`;
        const quarterIndex = QUARTER_DATES.indexOf(dataFormatada);
        
        if (quarterIndex === -1 || !year) return;
        
        const quarterName = QUARTERS[quarterIndex];
        
        if (!quarterData[quarterName][year]) {
          quarterData[quarterName][year] = { total: 0, count: 0 };
        }
        
        quarterData[quarterName][year].total += okr.atingReal;
        quarterData[quarterName][year].count += 1;
      });
      
      // Converter para formato do gráfico
      return QUARTERS.map(q => {
        const dataPoint: Record<string, any> = { mes: q };
        
        selectedYears.forEach(year => {
          const data = quarterData[q][year];
          if (data && data.count > 0) {
            dataPoint[year.toString()] = parseFloat((data.total / data.count).toFixed(1));
          } else {
            dataPoint[year.toString()] = null;
          }
        });
        
        return dataPoint;
      });
    }
    
    // Para KPIs e Projetos, usar meses
    const monthlyData: Record<string, Record<number, { total: number; count: number }>> = {};
    
    // Inicializar todos os meses
    MESES.forEach(mes => {
      monthlyData[mes] = {};
    });

    if (filterType === 'kpi') {
      // Processar KPIs
      filteredKpis.forEach(kpi => {
        if (!kpi.year || !kpi.competencia || kpi.metasReal === null) return;
        
        const [mesStr] = kpi.competencia.split('/');
        const mes = parseInt(mesStr, 10);
        if (mes < 1 || mes > 12) return;
        
        const mesNome = MESES[mes - 1];
        const year = kpi.year;
        
        if (!monthlyData[mesNome][year]) {
          monthlyData[mesNome][year] = { total: 0, count: 0 };
        }
        
        monthlyData[mesNome][year].total += kpi.metasReal * 100;
        monthlyData[mesNome][year].count += 1;
      });
    } else if (filterType === 'projeto') {
      // Para projetos, usar a média geral em todos os meses (não tem data mensal)
      const projetosAtivos = filteredProjetos.filter(p => p.atingimento > 0);
      if (projetosAtivos.length > 0) {
        const mediaGeral = projetosAtivos.reduce((acc, p) => acc + p.atingimento, 0) / projetosAtivos.length;
        
        // Mostrar no ano atual
        const anoAtual = new Date().getFullYear();
        MESES.forEach(mes => {
          monthlyData[mes][anoAtual] = { total: mediaGeral, count: 1 };
        });
      }
    }
    
    // Converter para formato do gráfico
    return MESES.map(mes => {
      const dataPoint: Record<string, any> = { mes };
      
      selectedYears.forEach(year => {
        const data = monthlyData[mes][year];
        if (data && data.count > 0) {
          dataPoint[year.toString()] = parseFloat((data.total / data.count).toFixed(1));
        } else {
          dataPoint[year.toString()] = null;
        }
      });
      
      return dataPoint;
    });
  }, [filteredKpis, filteredOkrs, filteredProjetos, filterType, selectedYears]);

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            entry.value !== null && (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-slate-400">{entry.name}:</span>
                <span className="text-white font-medium">{entry.value}%</span>
              </div>
            )
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-6">
      <Card>
        <SectionTitle 
          title="EVOLUÇÃO DO ATINGIMENTO" 
          icon=""
          subtitle="Média mensal de atingimento por ano"
        />
        
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {/* Filtro de tipo */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('kpi')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filterType === 'kpi'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              KPIs
            </button>
            <button
              onClick={() => setFilterType('okr')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filterType === 'okr'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              OKRs
            </button>
            <button
              onClick={() => setFilterType('projeto')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                filterType === 'projeto'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Projetos
            </button>
          </div>
          
          {/* Seletor de time */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">Time:</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="bg-slate-700 text-slate-200 px-3 py-2 rounded border border-slate-600 focus:border-orange-500 focus:outline-none"
            >
              {availableTeams.map(team => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
          
          {/* Seletor de anos */}
          <div className="flex gap-2 flex-wrap">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all border-2 ${
                  selectedYears.includes(year)
                    ? 'text-white'
                    : 'bg-slate-800 text-slate-400 border-slate-600 hover:border-slate-500'
                }`}
                style={{
                  backgroundColor: selectedYears.includes(year) ? getYearColor(year) : undefined,
                  borderColor: selectedYears.includes(year) ? getYearColor(year) : undefined
                }}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
        
        {/* Gráfico */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="mes" 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8' }}
              />
              <YAxis 
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8' }}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span className="text-slate-300">{value}</span>}
              />
              {selectedYears.map(year => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={year.toString()}
                  name={year.toString()}
                  stroke={getYearColor(year)}
                  strokeWidth={2}
                  dot={{ fill: getYearColor(year), strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: getYearColor(year), strokeWidth: 2 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default PerformanceChart;
