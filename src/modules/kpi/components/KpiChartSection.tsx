'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';
import { KpiData } from '../types';
import { TrendingDown, TrendingUp, Pencil } from 'lucide-react';

// Função para criar cor degradê (do claro para escuro) - igual ao OKR
const createGradientColors = (baseColor: string): { light: string; dark: string } => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 102, b: 0 };
  };

  const rgb = hexToRgb(baseColor);

  // Cor clara (mais luminosa)
  const lightR = Math.min(255, rgb.r + 40);
  const lightG = Math.min(255, rgb.g + 40);
  const lightB = Math.min(255, rgb.b + 40);

  // Cor escura (menos luminosa)
  const darkR = Math.max(0, rgb.r - 60);
  const darkG = Math.max(0, rgb.g - 60);
  const darkB = Math.max(0, rgb.b - 60);

  return {
    light: `rgb(${lightR}, ${lightG}, ${lightB})`,
    dark: `rgb(${darkR}, ${darkG}, ${darkB})`
  };
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

interface KpiChartSectionProps {
  kpiName: string;
  data: KpiData[];
  accentColor: string;
  onEdit?: () => void;
}

// Meses abreviados para formatação de labels
const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Formatar valor baseado na grandeza
const formatValor = (valor: number | null, grandeza: string, minDecimals = 0): string => {
  if (valor === null || valor === undefined) return '';
  if (typeof valor !== 'number' || isNaN(valor)) return '';

  const grandezaLower = grandeza?.toLowerCase() || '';

  if (grandezaLower === 'moeda' || grandezaLower === 'r$' || grandezaLower === 'real') {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (
    grandezaLower === '%' ||
    grandezaLower === 'percentual' ||
    grandezaLower === 'porcentagem' ||
    grandezaLower === 'percentagem'
  ) {
    return (
      valor.toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(minDecimals, 1),
        maximumFractionDigits: 2,
      }) + '%'
    );
  } else if (
    grandezaLower === 'número inteiro' ||
    grandezaLower === 'numero inteiro' ||
    grandezaLower === 'inteiro'
  ) {
    return Math.round(valor).toLocaleString('pt-BR');
  } else {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: 2,
    });
  }
};

// Formatar competência para exibição (01/03/2024 → mar/24 ou 03/2024 → mar/24)
const formatCompetencia = (comp: string): string => {
  if (!comp) return comp;
  const parts = comp.split('/');
  let mes: string, ano: string;
  
  if (parts.length === 3) {
    // Formato DD/MM/YYYY
    mes = parts[1];
    ano = parts[2];
  } else if (parts.length === 2) {
    // Formato MM/YYYY (fallback)
    mes = parts[0];
    ano = parts[1];
  } else {
    return comp;
  }
  
  const idx = parseInt(mes, 10) - 1;
  if (!isNaN(idx) && ano && mesesAbrev[idx]) {
    return `${mesesAbrev[idx]}/${ano.slice(-2)}`;
  }
  return comp;
};

export const KpiChartSection: React.FC<KpiChartSectionProps> = ({
  kpiName,
  data,
  accentColor,
  onEdit,
}) => {
  // Ref para o chart e state para o gradiente
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const [barGradient, setBarGradient] = useState<CanvasGradient | string>(accentColor);

  // Cores de degradê baseadas na cor de destaque
  const gradientColors = useMemo(() => createGradientColors(accentColor), [accentColor]);

  // Criar gradiente para barras quando o chart estiver pronto
  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
      gradient.addColorStop(0, gradientColors.light);
      gradient.addColorStop(1, gradientColors.dark);
      setBarGradient(gradient);
    }
  }, [gradientColors, chartRef.current]);

  // Ordenar dados por competência
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const parseComp = (s: string) => {
        if (!s) return 0;
        const parts = s.split('/').map((x) => parseInt(x));
        // Suporta DD/MM/YYYY e MM/YYYY
        if (parts.length === 3) {
          const [, mes, ano] = parts;
          return (ano || 0) * 100 + (mes || 0);
        } else if (parts.length === 2) {
          const [mes, ano] = parts;
          return (ano || 0) * 100 + (mes || 0);
        }
        return 0;
      };
      return parseComp(a.competencia) - parseComp(b.competencia);
    });
  }, [data]);

  const labels = sortedData.map((d) => d.competencia);
  const labelsFormatados = labels.map(formatCompetencia);
  const situacoes = sortedData.map((d) => (d.situacao || 'Ativo').toString().trim().toUpperCase());
  // Metas: null para meses inativos
  const metas = sortedData.map((d, idx) => {
    const situacao = (d.situacao || 'Ativo').toString().trim().toUpperCase();
    if (situacao === 'INATIVO') return null;
    return d.meta;
  });
  const resultados = sortedData.map((d) => d.resultado);
  const percentuais = sortedData.map((d) => d.percentual);
  const atingimentos = sortedData.map((d) => d.atingimento);  // Coluna G - MÉDIA NO ANO
  const grandezas = sortedData.map((d) => d.grandeza || '');
  const grandeza = grandezas[0] || '';
  const tendencia = sortedData[0]?.tendencia || '';
  const tipo = sortedData[0]?.tipo || '';

  // Detectar primeiro mês inativo
  const inativacaoInfo = useMemo(() => {
    const idx = situacoes.findIndex(s => s === 'INATIVO');
    if (idx === -1) return null;
    return labelsFormatados[idx];
  }, [situacoes, labelsFormatados]);

  // Calcular métricas para os cards laterais

  // 1. REALIZADO (ÚLTIMO MÊS) - último resultado não nulo
  const ultimoResultado = useMemo(() => {
    for (let i = resultados.length - 1; i >= 0; i--) {
      if (resultados[i] !== null && resultados[i] !== undefined && !isNaN(resultados[i]!)) {
        return resultados[i];
      }
    }
    return null;
  }, [resultados]);

  // 2. MÉDIA ANO - média dos atingimentos (coluna G)
  const mediaAtingimento = useMemo(() => {
    const validos = atingimentos.filter((p) => typeof p === 'number' && !isNaN(p)) as number[];
    if (validos.length === 0) return 0;
    return validos.reduce((acc, val) => acc + val, 0) / validos.length;
  }, [atingimentos]);

  // 3. RESULTADO NO ANO - baseado em TIPO (EVOLUÇÃO, MÉDIA NO ANO, ACUMULADO NO ANO)
  const resultadoAno = useMemo(() => {
    const validos = resultados.filter((r) => r !== null && r !== undefined && !isNaN(r!)) as number[];
    
    if (tipo.toUpperCase() === 'EVOLUÇÃO') {
      // Último resultado válido
      return ultimoResultado;
    } else if (tipo.toUpperCase() === 'MÉDIA NO ANO') {
      if (validos.length === 0) return 0;
      return validos.reduce((acc, val) => acc + val, 0) / validos.length;
    } else {
      // ACUMULADO NO ANO (default)
      return validos.reduce((acc, val) => acc + val, 0);
    }
  }, [resultados, tipo, ultimoResultado]);

  // Determinar nome do card de resultado baseado no TIPO
  let nomeCardAno = 'RESULTADO NO ANO';
  if (tipo.toUpperCase() === 'EVOLUÇÃO') {
    nomeCardAno = 'RESULTADO ATUAL';
  } else if (tipo.toUpperCase() === 'MÉDIA NO ANO') {
    nomeCardAno = 'MÉDIA NO ANO';
  } else if (tipo.toUpperCase() === 'ACUMULADO NO ANO') {
    nomeCardAno = 'ACUMULADO NO ANO';
  }

  // Helper para verificar tendência
  const isMenorMelhor = tendencia.toUpperCase().includes('MENOR');

  // 4. ATING. PARCIAL - Cálculo baseado no TIPO
  const atingParcial = useMemo(() => {
    const tipoUpper = tipo.toUpperCase();
    
    // Encontrar último índice com resultado
    let ultimoIdxComResultado = -1;
    for (let i = resultados.length - 1; i >= 0; i--) {
      if (resultados[i] !== null && resultados[i] !== undefined && !isNaN(resultados[i]!)) {
        ultimoIdxComResultado = i;
        break;
      }
    }
    
    if (ultimoIdxComResultado === -1) return null;
    
    if (tipoUpper === 'EVOLUÇÃO' || tipoUpper === 'MÉDIA NO ANO') {
      // EVOLUÇÃO / MÉDIA NO ANO: Último Resultado / Meta do mesmo mês
      const ultimoRes = resultados[ultimoIdxComResultado];
      const metaDoMes = metas[ultimoIdxComResultado];
      
      if (ultimoRes === null || metaDoMes === null || typeof metaDoMes !== 'number' || metaDoMes === 0) return null;
      
      if (isMenorMelhor) {
        return ultimoRes > 0 ? (metaDoMes / ultimoRes) * 100 : null;
      } else {
        return (ultimoRes / metaDoMes) * 100;
      }
    } else if (tipoUpper === 'ACUMULADO NO ANO') {
      // ACUMULADO: Soma Resultado até momento / Soma Meta até momento
      let somaResultado = 0;
      let somaMetaParcial = 0;
      for (let i = 0; i <= ultimoIdxComResultado; i++) {
        somaResultado += resultados[i] || 0;
        const metaVal = metas[i];
        if (typeof metaVal === 'number' && !isNaN(metaVal)) {
          somaMetaParcial += metaVal;
        }
      }
      
      if (somaMetaParcial === 0) return null;
      
      if (isMenorMelhor) {
        return somaResultado > 0 ? (somaMetaParcial / somaResultado) * 100 : null;
      } else {
        return (somaResultado / somaMetaParcial) * 100;
      }
    }
    
    return null;
  }, [resultados, metas, tipo, isMenorMelhor]);

  // 5. ATING. ANO - Cálculo baseado no TIPO
  const atingAno = useMemo(() => {
    const tipoUpper = tipo.toUpperCase();
    
    // Encontrar último índice com resultado
    let ultimoIdxComResultado = -1;
    for (let i = resultados.length - 1; i >= 0; i--) {
      if (resultados[i] !== null && resultados[i] !== undefined && !isNaN(resultados[i]!)) {
        ultimoIdxComResultado = i;
        break;
      }
    }
    
    if (ultimoIdxComResultado === -1) return null;
    
    if (tipoUpper === 'EVOLUÇÃO' || tipoUpper === 'MÉDIA NO ANO') {
      // EVOLUÇÃO / MÉDIA NO ANO: Último Resultado / Meta de dezembro (último mês)
      const ultimoRes = resultados[ultimoIdxComResultado];
      // Meta de dezembro é o último índice do array de metas
      const metaDezembro = metas[metas.length - 1];
      
      if (ultimoRes === null || metaDezembro === null || typeof metaDezembro !== 'number' || metaDezembro === 0) return null;
      
      if (isMenorMelhor) {
        return ultimoRes > 0 ? (metaDezembro / ultimoRes) * 100 : null;
      } else {
        return (ultimoRes / metaDezembro) * 100;
      }
    } else if (tipoUpper === 'ACUMULADO NO ANO') {
      // ACUMULADO: Soma Resultado até momento / Meta total do ano
      const somaResultado = resultados
        .filter((r) => r !== null && r !== undefined && !isNaN(r!))
        .reduce((acc, val) => acc + (val || 0), 0);
      
      const somaMetaTotal = metas
        .filter((m) => typeof m === 'number' && !isNaN(m))
        .reduce((acc, val) => acc + (val || 0), 0);
      
      if (somaMetaTotal === 0) return null;
      
      if (isMenorMelhor) {
        return somaResultado > 0 ? (somaMetaTotal / somaResultado) * 100 : null;
      } else {
        return (somaResultado / somaMetaTotal) * 100;
      }
    }
    
    return null;
  }, [resultados, metas, tipo, isMenorMelhor]);

  // Calcular limites do eixo Y
  const { minY, maxY } = useMemo(() => {
    const allValues = [...resultados, ...metas].filter(
      (v) => typeof v === 'number' && !isNaN(v)
    ) as number[];
    
    let min = Math.min(...allValues, 0);
    let max = Math.max(...allValues, 1);
    min = Math.floor(min);
    
    // Padding baseado na grandeza
    const grandezaLower = grandeza.toLowerCase();
    let yPadding = 0;
    if (grandezaLower === '%' || grandezaLower === 'percentual' || grandezaLower === 'porcentagem') {
      yPadding = Math.max(5, Math.ceil((max - min) * 0.08));
    } else {
      yPadding = Math.max(1, Math.ceil((max - min) * 0.08));
    }
    max = Math.ceil(max + yPadding);
    if (min > 0) min = 0;

    return { minY: min, maxY: max };
  }, [resultados, metas, grandeza]);

  // Helper para verificar se deve mostrar datalabel
  const showDataLabel = (v: number | null | undefined): boolean => {
    return v !== null && v !== undefined && !isNaN(v);
  };

  // Configuração do gráfico - Barra para Resultado + Linha para Meta
  const chartData = {
    labels: labelsFormatados,
    datasets: [
      // Dataset 1: Barras de Resultado com gradiente
      {
        type: 'bar' as const,
        label: 'Resultado',
        data: resultados,
        backgroundColor: barGradient,
        borderRadius: 0,
        borderSkipped: false as const,
        categoryPercentage: 0.8,
        barPercentage: 0.95,
        order: 2,
        datalabels: {
          color: '#fff',
          font: { size: 14, weight: 'bold' as const, family: 'Poppins, Arial, sans-serif' },
          display: (context: any) => {
            const val = context.dataset.data[context.dataIndex];
            return showDataLabel(val);
          },
          // Posicionamento: centralizado por padrão, mas ajusta quando valor está muito baixo
          anchor: (context: any) => {
            const idx = context.dataIndex;
            const resultadoVal = resultados[idx];
            const range = maxY - minY;
            
            // Se o valor é muito baixo (próximo do eixo X), colocar rótulo acima da barra
            if (resultadoVal !== null && resultadoVal !== undefined) {
              const heightPercent = (resultadoVal - minY) / range;
              if (heightPercent < 0.18) {
                return 'end' as const;
              }
            }
            return 'center' as const;
          },
          align: (context: any) => {
            const idx = context.dataIndex;
            const resultadoVal = resultados[idx];
            const range = maxY - minY;
            
            // Se o valor é muito baixo, posicionar acima
            if (resultadoVal !== null && resultadoVal !== undefined) {
              const heightPercent = (resultadoVal - minY) / range;
              if (heightPercent < 0.18) {
                return 'top' as const;
              }
            }
            return 'center' as const;
          },
          offset: (context: any) => {
            const idx = context.dataIndex;
            const resultadoVal = resultados[idx];
            const range = maxY - minY;
            
            if (resultadoVal !== null && resultadoVal !== undefined) {
              const heightPercent = (resultadoVal - minY) / range;
              if (heightPercent < 0.18) {
                return 6;
              }
            }
            return 0;
          },
          formatter: (v: any, context: any) => {
            if (!showDataLabel(v)) return '';
            const idx = context.dataIndex;
            const g = grandezas[idx] || grandeza;
            return formatValor(v, g, 1);
          },
        },
      },
      // Dataset 2: Linha de Meta
      {
        type: 'line' as const,
        label: 'Meta',
        data: metas,
        borderColor: '#fff',
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: '#fff',
        pointBorderColor: 'transparent',
        pointBorderWidth: 2,
        tension: 0,
        fill: false,
        order: 1,
        datalabels: {
          display: true,
          backgroundColor: '#1E1E1E',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          borderRadius: 6,
          color: '#FFFFFF',
          font: {
            weight: 'bold' as const,
            size: 13,
            family: 'Poppins, Arial, sans-serif',
          },
          padding: {
            top: 4,
            bottom: 4,
            left: 8,
            right: 8,
          },
          // Posicionamento padrão: acima. Quando próximo ao eixo X, vai para a direita
          anchor: 'end' as const,
          align: (context: any) => {
            const idx = context.dataIndex;
            const metaVal = metas[idx];
            const resultadoVal = resultados[idx];
            const range = maxY - minY;
            
            // Se meta está muito baixa (próxima do eixo X), posicionar à direita
            if (metaVal !== null && metaVal !== undefined) {
              const heightPercent = (metaVal - minY) / range;
              if (heightPercent < 0.18) {
                return 'right' as const;
              }
            }
            
            return 'top' as const;
          },
          offset: (context: any) => {
            const idx = context.dataIndex;
            const metaVal = metas[idx];
            const range = maxY - minY;
            
            if (metaVal !== null && metaVal !== undefined) {
              const heightPercent = (metaVal - minY) / range;
              if (heightPercent < 0.18) {
                return 12; // Offset maior quando próximo ao eixo X
              }
            }
            return 8;
          },
          formatter: (value: any, context: any) => {
            const g = grandezas[context.dataIndex] || grandeza;
            return formatValor(value, g);
          },
        },
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10,
        left: 10,
        right: 10,
        top: 10,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        displayColors: false,
        bodyFont: { size: 16 },
        callbacks: {
          label: (context: any) => {
            const idx = context.dataIndex;
            const resultado = resultados[idx];
            const meta = metas[idx];
            const ating = atingimentos[idx];  // Coluna G - ATINGIMENTO
            const g = grandezas[idx] || grandeza;

            const lines: string[] = [];
            
            if (context.dataset.label === 'Resultado') {
              if (typeof resultado === 'number' && !isNaN(resultado)) {
                lines.push(`Resultado: ${formatValor(resultado, g, 1)}`);
              }
              if (typeof meta === 'number' && !isNaN(meta)) {
                lines.push(`Meta: ${formatValor(meta, g, 1)}`);
              }
              if (typeof ating === 'number' && !isNaN(ating)) {
                lines.push(`Atingimento: ${ating.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);
              }
            } else if (context.dataset.label === 'Meta') {
              if (typeof meta === 'number' && !isNaN(meta)) {
                lines.push(`Meta: ${formatValor(meta, g, 1)}`);
              }
            }
            
            return lines;
          },
        },
      },
      datalabels: {
        display: true,
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#fff',
          font: { size: 14 },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        min: minY,
        max: maxY,
        ticks: {
          color: '#fff',
          font: { size: 14 },
          callback: function(value: any) {
            const numVal = typeof value === 'number' ? value : parseFloat(value);
            const grandezaLower = grandeza.toLowerCase();
            if (grandezaLower === 'moeda' || grandezaLower === 'r$' || grandezaLower === 'real') {
              return formatValor(numVal, grandeza, 1);
            } else if (
              grandezaLower === 'número inteiro' ||
              grandezaLower === 'numero inteiro' ||
              grandezaLower === 'inteiro'
            ) {
              return Math.round(numVal).toLocaleString('pt-BR');
            } else if (
              grandezaLower === '%' ||
              grandezaLower === 'percentual' ||
              grandezaLower === 'porcentagem' ||
              grandezaLower === 'percentagem'
            ) {
              return numVal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
            } else {
              return numVal.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            }
          },
        },
        grid: { color: 'rgba(255,255,255,0.08)' },
      },
    },
  };

  // Label de tendência para exibição
  const tendenciaLabel = isMenorMelhor ? 'MENOR, MELHOR' : 'MAIOR, MELHOR';

  // Converter cor hex para rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <section className="kpi-time-section">
      <div className="kpi-header">
        <div className="flex items-center gap-3">
          <h2>{kpiName}</h2>
          {inativacaoInfo && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{ 
                backgroundColor: 'rgba(239, 68, 68, 0.15)', 
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
              title={`KPI inativado a partir de ${inativacaoInfo}`}
            >
              Inativo a partir de {inativacaoInfo}
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Editar KPI"
              style={{ color: accentColor }}
            >
              <Pencil size={18} />
            </button>
          )}
        </div>
        <div 
          className="tendencia-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            backgroundColor: hexToRgba(accentColor, 0.15),
            color: accentColor,
            border: `1px solid ${hexToRgba(accentColor, 0.4)}`,
          }}
          title={`Para este KPI, ${isMenorMelhor ? 'valores menores são melhores' : 'valores maiores são melhores'}`}
        >
          {isMenorMelhor ? (
            <TrendingDown size={16} strokeWidth={2.5} />
          ) : (
            <TrendingUp size={16} strokeWidth={2.5} />
          )}
          <span>{tendenciaLabel}</span>
        </div>
      </div>

      <div className="chart-wrapper">
        {/* Cards laterais */}
        <aside className="kpi-sidebar">
          {/* 1º Card: Acumulado/Média/Último resultado baseado no TIPO */}
          <div className="kpi-card">
            <span className="kpi-label">{nomeCardAno}</span>
            <span className="kpi-value">{formatValor(resultadoAno, grandeza) || '-'}</span>
          </div>

          {/* 2º Card: Média de atingimento (%) */}
          <div className="kpi-card">
            <span className="kpi-label">MÉDIA ATING. (%)</span>
            <span className="kpi-value">
              {mediaAtingimento.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}%
            </span>
          </div>

          {/* 3º Card: Atingimento Parcial */}
          <div className="kpi-card">
            <span className="kpi-label">ATING. PARCIAL</span>
            <span className="kpi-value">
              {atingParcial !== null
                ? `${atingParcial.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                : '-'}
            </span>
          </div>

          {/* 4º Card: Atingimento ano */}
          <div className="kpi-card">
            <span className="kpi-label">ATING. ANO</span>
            <span className="kpi-value">
              {atingAno !== null
                ? `${atingAno.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
                : '-'}
            </span>
          </div>
        </aside>

        {/* Área do gráfico */}
        <div className="main-chart-area">
          <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
};

export default KpiChartSection;
