'use client';

import React, { useMemo, useState } from 'react';
import { KpiData } from '../types';
import { Pencil, TrendingUp, TrendingDown, Info, Ban } from 'lucide-react';

interface KpiTableViewProps {
  kpiGroups: Record<string, KpiData[]>;
  accentColor: string;
  onEdit: (kpiName: string, data: KpiData[]) => void;
  onInactivate?: (kpiName: string, data: KpiData[]) => void;
}

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

// Função para calcular atingimento baseado no TIPO
const calculateAtingimento = (
  data: KpiData[],
  tipo: string,
  tendencia: string
): number => {
  if (!data || data.length === 0) return 0;
  
  const tipoUpper = (tipo || '').toUpperCase().trim();
  
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

const KpiTableView: React.FC<KpiTableViewProps> = ({ kpiGroups, accentColor, onEdit, onInactivate }) => {
  // Estado para controlar qual tooltip está visível
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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
                Atingimento
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
                <tr 
                  key={row.kpiName} 
                  className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${idx % 2 === 0 ? 'bg-dark-card' : 'bg-dark-primary/30'}`}
                >
                  {/* Nome do KPI */}
                  <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                    <div className="font-medium text-white truncate max-w-[180px]" title={row.kpiName}>
                      {row.kpiName}
                    </div>
                    <div className="text-xs text-gray-500">{row.grandeza}</div>
                    {row.primeiroMesInativo && (
                      <div className="text-xs text-red-400 mt-0.5">
                        Inativo a partir de {monthNames[row.primeiroMesInativo - 1]}
                      </div>
                    )}
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
                    <div className="relative inline-flex items-center gap-1">
                      <span>{row.avgAtingimento > 0 ? `${row.avgAtingimento.toFixed(1)}%` : '-'}</span>
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
