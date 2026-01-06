import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Info, Edit, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { OkrData } from '../types';
import { HelpModal } from './Modal';
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
  ArcElement,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartDataLabels
);

// Função para criar cor degradê (do claro para escuro)
const createGradientColors = (baseColor: string): { light: string; dark: string } => {
  // Converter hex para RGB
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

interface OkrKrCardProps {
  kr: OkrData;
  allData: OkrData[];
  accentColor: string;
  onDataSaved?: () => void;
}

// Formatar valor baseado na medida
const formatValue = (value: number | null | undefined, medida: string, short = false): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'number') return String(value);
  const medidaUpper = medida.toUpperCase();

  if (short && Math.abs(value) >= 1000000) {
    return (value / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  }
  if (short && Math.abs(value) >= 1000) {
    return (value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'k';
  }
  if (medidaUpper.includes('MOEDA') || medidaUpper.includes('R$')) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  if (medidaUpper.includes('PORCENTAGEM')) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
};

export const OkrKrCard: React.FC<OkrKrCardProps> = ({
  kr,
  allData,
  accentColor,
  onDataSaved,
}) => {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [showDataEntry, setShowDataEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [barGradient, setBarGradient] = useState<CanvasGradient | string>(accentColor);
  const [doughnutGradient, setDoughnutGradient] = useState<CanvasGradient | string>(accentColor);

  // Refs para os inputs
  const metaInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const realizadoInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const formaDeMedirRef = useRef<HTMLSelectElement | null>(null);
  const responsavelRef = useRef<HTMLInputElement | null>(null);
  const medidaRef = useRef<HTMLSelectElement | null>(null);
  const chartRef = useRef<ChartJS<'bar'>>(null);
  const doughnutRef = useRef<ChartJS<'doughnut'>>(null);

  const indicator = kr.indicador;
  const medida = kr.medida || '';
  const formaDeMedir = (kr.formaDeMedir || '').toUpperCase();
  const tendencia = (kr.tendencia || '').toUpperCase();
  const responsavel = kr.responsavel || 'N/A';

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

  // Criar gradiente para doughnut quando o chart estiver pronto
  useEffect(() => {
    const chart = doughnutRef.current;
    if (chart) {
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
      gradient.addColorStop(0, gradientColors.light);
      gradient.addColorStop(1, gradientColors.dark);
      setDoughnutGradient(gradient);
    }
  }, [gradientColors, doughnutRef.current]);

  // Função para salvar dados na planilha
  const handleSaveData = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Obter valores selecionados
      const formaDeMedirValue = formaDeMedirRef.current?.value || '';
      const responsavelValue = responsavelRef.current?.value || '';
      const medidaValue = medidaRef.current?.value || '';

      // Coletar dados dos inputs
      const updates = sortedData.map((entry, idx) => {
        const metaInput = metaInputsRef.current[idx];
        const realizadoInput = realizadoInputsRef.current[idx];

        return {
          rowIndex: entry.rowIndex,
          meta: metaInput?.value || '',
          realizado: realizadoInput?.value || '',
          formaDeMedir: formaDeMedirValue,
          responsavel: responsavelValue,
          medida: medidaValue,
        };
      });

      const response = await fetch('/api/okr/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updates,
          sheetName: 'NOVO PAINEL OKR',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'Dados salvos com sucesso!' });
        // Fechar área de entrada após 2 segundos em caso de sucesso
        // e chamar callback para recarregar dados
        setTimeout(() => {
          setShowDataEntry(false);
          setSaveMessage(null);
          // Chamar callback para atualizar os dados na página
          if (onDataSaved) {
            onDataSaved();
          }
        }, 1500);
      } else {
        setSaveMessage({ type: 'error', text: result.error || 'Erro ao salvar dados' });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setSaveMessage({ type: 'error', text: 'Erro de conexão ao salvar dados' });
    } finally {
      setIsSaving(false);
    }
  };

  // Formatar valor para exibição nos inputs
  const formatForInput = (value: number | null | undefined, medidaStr: string): string => {
    if (value === null || value === undefined) return '';
    if (value === 0) return '0';
    const medidaUpper = medidaStr.toUpperCase();

    if (medidaUpper.includes('PORCENTAGEM')) {
      return (value * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
    } else if (medidaUpper.includes('MOEDA') || medidaUpper.includes('R$')) {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Ordenar dados por data
  const sortedData = useMemo(() => {
    return [...allData].sort((a, b) => {
      if (!a.data || !b.data) return 0;
      return a.data.getTime() - b.data.getTime();
    });
  }, [allData]);

  // Preparar dados do gráfico
  const chartData = useMemo(() => {
    const labels = sortedData.map(d =>
      d.data ? d.data.toLocaleDateString('pt-BR', { month: 'long' }) : ''
    );
    const realizadoData = sortedData.map(d => d.realizado);
    const metaData = sortedData.map(d => d.meta);
    const atingMetaMesData = sortedData.map(d => d.atingMetaMes);

    return { labels, realizadoData, metaData, atingMetaMesData };
  }, [sortedData]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const metas = sortedData.map(d => d.meta).filter(m => m !== null) as number[];
    const realizados = sortedData.map(d => d.realizado).filter(r => r !== null) as number[];
    const atingimentos = sortedData.map(d => d.atingimento).filter(a => a !== null) as number[];

    const somaRealizado = realizados.reduce((acc, val) => acc + val, 0);
    const somaMeta = metas.reduce((acc, val) => acc + val, 0);

    // Último atingimento válido
    let atingimentoFinal = 0;
    const ultimoRegistro = sortedData[sortedData.length - 1];
    if (ultimoRegistro && ultimoRegistro.atingimento !== null) {
      atingimentoFinal = ultimoRegistro.atingimento;
    } else {
      const dataWithAtingimento = sortedData.filter(d => d.atingimento !== null);
      if (dataWithAtingimento.length > 0) {
        atingimentoFinal = dataWithAtingimento[dataWithAtingimento.length - 1].atingimento || 0;
      }
    }

    // Último realizado válido (incluindo 0 como valor válido)
    const entradasComDados = sortedData.filter(d =>
      d.realizado !== null &&
      d.realizado !== undefined
    );
    const lastMonthEntry = entradasComDados.length > 0
      ? entradasComDados[entradasComDados.length - 1]
      : (sortedData.length > 0 ? sortedData[sortedData.length - 1] : null);
    const realizadoUltimoMes = lastMonthEntry ? (lastMonthEntry.realizado ?? 0) : 0;

    return {
      somaRealizado,
      somaMeta,
      realizadoUltimoMes,
      atingimentoFinal,
    };
  }, [sortedData]);

  // Determinar key de ajuda
  const getHelpKey = (): string => {
    if (formaDeMedir === 'ACUMULADO') return 'ACUMULADO';
    if (formaDeMedir === 'MÉDIA') return 'MÉDIA';
    if (tendencia.includes('AUMENTAR')) {
      if (formaDeMedir.includes('DEGRAU')) return 'AUMENTAR_DEGRAU';
      return 'AUMENTAR_PONTUAL';
    }
    if (tendencia.includes('DIMINUIR')) {
      if (formaDeMedir.includes('DEGRAU')) return 'DIMINUIR_DEGRAU';
      return 'DIMINUIR_PONTUAL';
    }
    return 'PADRÃO';
  };

  // Helper para verificar se deve mostrar datalabel
  const showDataLabel = (v: number | null | undefined): boolean => {
    return v !== null && v !== undefined && (typeof v !== 'number' || !isNaN(v));
  };

  // Configuração do gráfico principal (barras + linha)
  const mainChartConfig = useMemo(() => {
    // Calcular min e max para detectar valores baixos
    const allValues = [...chartData.realizadoData, ...chartData.metaData].filter(
      (v) => typeof v === 'number' && !isNaN(v)
    ) as number[];
    const minY = Math.min(...allValues, 0);
    const maxY = Math.max(...allValues, 1);
    const range = maxY - minY;

    return {
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: 'REALIZADO',
          data: chartData.realizadoData,
          backgroundColor: barGradient,
          borderRadius: 0,
          borderSkipped: false as const,
          categoryPercentage: 0.8,
          barPercentage: 0.95,
          order: 2,
          datalabels: {
            color: '#FFFFFF',
            font: { family: 'Poppins, sans-serif', weight: 'bold' as const, size: 13 },
            display: (context: any) => {
              const val = context.dataset.data[context.dataIndex];
              return showDataLabel(val);
            },
            // Posicionamento: centralizado por padrão, mas ajusta quando valor está muito baixo
            anchor: (context: any) => {
              const idx = context.dataIndex;
              const resultadoVal = chartData.realizadoData[idx];
              
              // Se o valor é muito baixo (próximo do eixo X), colocar rótulo acima da barra
              if (resultadoVal !== null && resultadoVal !== undefined && range > 0) {
                const heightPercent = (resultadoVal - minY) / range;
                if (heightPercent < 0.18) {
                  return 'end' as const;
                }
              }
              return 'center' as const;
            },
            align: (context: any) => {
              const idx = context.dataIndex;
              const resultadoVal = chartData.realizadoData[idx];
              
              // Se o valor é muito baixo, posicionar acima
              if (resultadoVal !== null && resultadoVal !== undefined && range > 0) {
                const heightPercent = (resultadoVal - minY) / range;
                if (heightPercent < 0.18) {
                  return 'top' as const;
                }
              }
              return 'center' as const;
            },
            offset: (context: any) => {
              const idx = context.dataIndex;
              const resultadoVal = chartData.realizadoData[idx];
              
              if (resultadoVal !== null && resultadoVal !== undefined && range > 0) {
                const heightPercent = (resultadoVal - minY) / range;
                if (heightPercent < 0.18) {
                  return 6;
                }
              }
              return 0;
            },
            formatter: (v: number | null) => {
              if (!showDataLabel(v)) return '';
              return formatValue(v, medida, true);
            },
          },
        },
        {
          label: 'META',
          data: chartData.metaData,
          type: 'line' as const,
          borderColor: '#E0E0E0',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 5,
          pointBackgroundColor: '#E0E0E0',
          pointBorderColor: 'transparent',
          pointBorderWidth: 2,
          tension: 0,
          fill: false,
          order: 1,
          datalabels: {
            display: (context: any) => {
              const val = context.dataset.data[context.dataIndex];
              return showDataLabel(val);
            },
            backgroundColor: '#1E1E1E',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            borderRadius: 6,
            color: '#FFFFFF',
            font: { family: 'Poppins, sans-serif', weight: 'bold' as const, size: 12 },
            padding: { top: 4, bottom: 4, left: 8, right: 8 },
            // Posicionamento padrão: acima. Quando próximo ao eixo X, vai para a direita
            anchor: 'end' as const,
            align: (context: any) => {
              const idx = context.dataIndex;
              const metaVal = chartData.metaData[idx];
              
              // Se meta está muito baixa (próxima do eixo X), posicionar à direita
              if (metaVal !== null && metaVal !== undefined && range > 0) {
                const heightPercent = (metaVal - minY) / range;
                if (heightPercent < 0.18) {
                  return 'right' as const;
                }
              }
              
              return 'top' as const;
            },
            offset: (context: any) => {
              const idx = context.dataIndex;
              const metaVal = chartData.metaData[idx];
              
              if (metaVal !== null && metaVal !== undefined && range > 0) {
                const heightPercent = (metaVal - minY) / range;
                if (heightPercent < 0.18) {
                  return 12; // Offset maior quando próximo ao eixo X
                }
              }
              return 8;
            },
            formatter: (v: number | null) => {
              if (!showDataLabel(v)) return '';
              return formatValue(v, medida, true);
            },
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 40, right: 20, left: 10, bottom: 10 },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#2c2c2c' },
          ticks: {
            font: { size: 12 },
            callback: function(value: number | string) {
              return formatValue(Number(value), medida, true);
            },
          },
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 13 } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          displayColors: false,
          callbacks: {
            label: (context: any) => {
              const idx = context.dataIndex;
              if (context.dataset.label === 'REALIZADO') {
                const meta = chartData.metaData[idx];
                const realizado = context.raw as number | null;
                const ating = chartData.atingMetaMesData[idx] || '';

                const metaStr = meta !== null && meta !== undefined ? formatValue(meta, medida) : 'Não informado';
                const realizadoStr = realizado !== null && realizado !== undefined ? formatValue(realizado, medida) : 'Não informado';

                return [
                  `META: ${metaStr}`,
                  `REALIZADO: ${realizadoStr}`,
                  `% ATING. META MÊS: ${ating}`,
                ];
              }
              return '';
            },
          },
        },
        datalabels: {
          display: true,
        },
      },
    },
  };
  }, [chartData, barGradient, medida]);

  // Configuração do gráfico de atingimento (doughnut)
  const atingimentoPercent = metrics.atingimentoFinal;
  const doughnutConfig = {
    data: {
      datasets: [{
        data: [atingimentoPercent, Math.max(100 - atingimentoPercent, 0)],
        backgroundColor: [doughnutGradient, '#2a2a2a'],
        borderWidth: 0,
        borderRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '75%',
      rotation: 270,
      circumference: 360,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: { display: false },
      },
    },
  };

  // Determinar se menor ou maior é melhor (baseado na coluna TENDENCIA)
  const isMenorMelhor = tendencia.includes('DIMINUIR');
  const tendenciaLabel = isMenorMelhor ? 'MENOR, MELHOR' : 'MAIOR, MELHOR';

  // Converter cor hex para rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <>
      <div className="kr-display-container">
        {/* Header do card */}
        <div className="kr-card-header">
          <div className="kr-title-row">
            <h3>{indicator}</h3>
            <div
              className="tendencia-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                backgroundColor: hexToRgba(accentColor, 0.15),
                color: accentColor,
                border: `1px solid ${hexToRgba(accentColor, 0.4)}`,
                marginLeft: '12px',
                whiteSpace: 'nowrap',
              }}
              title={`Para este indicador, ${isMenorMelhor ? 'valores menores são melhores' : 'valores maiores são melhores'}`}
            >
              {isMenorMelhor ? (
                <TrendingDown size={14} strokeWidth={2.5} />
              ) : (
                <TrendingUp size={14} strokeWidth={2.5} />
              )}
              <span>{tendenciaLabel}</span>
            </div>
          </div>
          <div className="kr-header-buttons">
            <button
              onClick={() => setHelpModalOpen(true)}
              className="info-btn"
              title="Entenda como medir este KR"
            >
              i
            </button>
            <button
              onClick={() => setShowDataEntry(!showDataEntry)}
              className="fill-data-btn"
            >
              <Edit size={16} />
              Preencher Meta | Resultado
            </button>
          </div>
        </div>

        {/* Área de entrada de dados */}
        {showDataEntry && (
          <div className="data-entry-wrapper">
            <div className="responsavel-section">
              <div className="forma-resp-row">
                <div className="forma-de-medir-block">
                  <label>Forma de Medir:</label>
                  <div className="select-row">
                    <select
                      className="forma-de-medir-select"
                      defaultValue={formaDeMedir || 'ACUMULADO'}
                      ref={formaDeMedirRef}
                    >
                      <option value="ACUMULADO">Métrica Acumulativa</option>
                      <option value="PONTUAL">Métrica de Valor Pontual</option>
                      <option value="DEGRAU">Métrica de Variação</option>
                    </select>
                    <button
                      type="button"
                      className="info-btn-small"
                      title="Explicação da forma de medir"
                      onClick={() => setHelpModalOpen(true)}
                    >
                      i
                    </button>
                  </div>
                </div>
                <div className="responsavel-block">
                  <label>Responsável:</label>
                  <input
                    type="text"
                    className="responsavel-input"
                    defaultValue={responsavel}
                    placeholder="Digite o nome do responsável"
                    ref={responsavelRef}
                  />
                </div>
                <div className="medida-block">
                  <label>Medida:</label>
                  <select
                    className="medida-select"
                    defaultValue={
                      medida.toUpperCase().includes('MOEDA') || medida.toUpperCase().includes('R$')
                        ? 'MOEDA'
                        : medida.toUpperCase().includes('PORCENTAGEM') || medida.toUpperCase().includes('%')
                          ? 'PORCENTAGEM'
                          : 'NÚMERO INTEIRO'
                    }
                    ref={medidaRef}
                  >
                    <option value="MOEDA">MOEDA</option>
                    <option value="NÚMERO INTEIRO">NÚMERO INTEIRO</option>
                    <option value="PORCENTAGEM">PORCENTAGEM</option>
                  </select>
                </div>
              </div>
            </div>

            <table className="data-entry-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Meta</th>
                  <th>Realizado</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((entry, idx) => {
                  const month = entry.data
                    ? entry.data.toLocaleDateString('pt-BR', { month: 'long' })
                    : '';
                  return (
                    <tr key={idx}>
                      <td>{month.charAt(0).toUpperCase() + month.slice(1)}</td>
                      <td>
                        <input
                          type="text"
                          className="meta-input"
                          ref={(el) => { metaInputsRef.current[idx] = el; }}
                          defaultValue={formatForInput(entry.meta, medida)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="realizado-input"
                          ref={(el) => { realizadoInputsRef.current[idx] = el; }}
                          defaultValue={formatForInput(entry.realizado, medida)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="save-all-section">
              {saveMessage && (
                <span className={`save-message ${saveMessage.type}`}>
                  {saveMessage.text}
                </span>
              )}
              <button
                className="save-all-btn"
                onClick={handleSaveData}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : (
                  'Salvar alterações'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Layout: sidebar + gráfico principal */}
        {!showDataEntry && (
          <div className="chart-wrapper">
            {/* Sidebar com KPIs */}
            <aside className="kpi-sidebar">
              {/* Card de Atingimento com gráfico doughnut */}
              <div className="kpi-card kpi-card-atingimento">
                <span className="kpi-label atingimento-label">ATINGIMENTO DA META</span>
                <div className="atingimento-chart-container">
                  <Doughnut ref={doughnutRef} data={doughnutConfig.data} options={doughnutConfig.options} />
                  <div className="atingimento-center-text">
                    {Math.round(atingimentoPercent)}%
                  </div>
                </div>
              </div>

              {/* Card de Realizado Acumulado - apenas para forma ACUMULADO */}
              {formaDeMedir === 'ACUMULADO' && (
                <div className="kpi-card">
                  <span className="kpi-label">REALIZADO ACUMULADO</span>
                  <span className="kpi-value highlight" style={{ color: accentColor }}>
                    {formatValue(metrics.somaRealizado, medida)}
                  </span>
                </div>
              )}

              {/* Card de Realizado Último Mês */}
              <div className="kpi-card">
                <span className="kpi-label">REALIZADO (ÚLTIMO MÊS)</span>
                <span className="kpi-value">{formatValue(metrics.realizadoUltimoMes, medida)}</span>
              </div>

              {/* Card de Responsável */}
              <div className="kpi-card">
                <span className="kpi-label">RESPONSÁVEL</span>
                <span className="kpi-value kpi-responsavel">{responsavel}</span>
              </div>
            </aside>

            {/* Área do gráfico principal */}
            <div className="main-chart-area">
              <Chart ref={chartRef} type="bar" data={mainChartConfig.data as any} options={mainChartConfig.options as any} />
            </div>
          </div>
        )}
      </div>

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        helpKey={getHelpKey()}
      />
    </>
  );
};

export default OkrKrCard;
