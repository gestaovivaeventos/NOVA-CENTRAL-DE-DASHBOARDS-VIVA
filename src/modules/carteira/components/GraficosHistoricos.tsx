/**
 * Gráficos Históricos para o módulo Carteira
 * Usando Chart.js (mesmo padrão do módulo de vendas)
 */

import React, { useMemo, useState } from 'react';
import { DadosHistorico } from '@/modules/carteira/types';
import { FundosAtivosAnualChart, FundosMensalChart } from './charts';

interface GraficosHistoricosProps {
  dados: DadosHistorico[];
  loading?: boolean;
}

// Skeleton para loading
const ChartSkeleton = () => (
  <div className="h-80 animate-pulse bg-gray-700/30 rounded-lg" />
);

export default function GraficosHistoricos({ dados, loading = false }: GraficosHistoricosProps) {
  // ========== FUNDOS ATIVOS ==========
  // Processar dados para gráfico anual (último mês de cada ano)
  const dadosFundosAnuais = useMemo(() => {
    const porAno: Record<string, { periodo: string; valor: number }> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      // Guardar sempre o último mês (maior período) de cada ano
      if (!porAno[year] || item.periodo > porAno[year].periodo) {
        porAno[year] = { periodo: item.periodo, valor: item.fundosAtivos };
      }
    });

    return Object.entries(porAno)
      .map(([year, data]) => ({
        ano: year,
        valor: data.valor,
      }))
      .sort((a, b) => a.ano.localeCompare(b.ano));
  }, [dados]);

  // Processar dados para gráfico mensal de fundos
  const dadosFundosMensais = useMemo(() => {
    const porAnoMes: Record<string, Record<number, number>> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      const month = parseInt(item.periodo.substring(5, 7), 10) - 1;
      
      if (!porAnoMes[year]) {
        porAnoMes[year] = {};
      }
      porAnoMes[year][month] = item.fundosAtivos;
    });

    return Object.entries(porAnoMes)
      .map(([year, months]) => {
        const monthlyData = Array(12).fill(0);
        Object.entries(months).forEach(([month, value]) => {
          monthlyData[parseInt(month, 10)] = value;
        });
        return {
          year: parseInt(year, 10),
          monthlyData,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [dados]);

  // ========== INTEGRANTES ATIVOS ==========
  // Processar dados para gráfico anual de integrantes (último mês de cada ano)
  const dadosIntegrantesAnuais = useMemo(() => {
    const porAno: Record<string, { periodo: string; valor: number }> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      // Guardar sempre o último mês (maior período) de cada ano
      if (!porAno[year] || item.periodo > porAno[year].periodo) {
        porAno[year] = { periodo: item.periodo, valor: item.alunosAtivos };
      }
    });

    return Object.entries(porAno)
      .map(([year, data]) => ({
        ano: year,
        valor: data.valor,
      }))
      .sort((a, b) => a.ano.localeCompare(b.ano));
  }, [dados]);

  // Processar dados para gráfico mensal de integrantes
  const dadosIntegrantesMensais = useMemo(() => {
    const porAnoMes: Record<string, Record<number, number>> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      const month = parseInt(item.periodo.substring(5, 7), 10) - 1;
      
      if (!porAnoMes[year]) {
        porAnoMes[year] = {};
      }
      porAnoMes[year][month] = item.alunosAtivos;
    });

    return Object.entries(porAnoMes)
      .map(([year, months]) => {
        const monthlyData = Array(12).fill(0);
        Object.entries(months).forEach(([month, value]) => {
          monthlyData[parseInt(month, 10)] = value;
        });
        return {
          year: parseInt(year, 10),
          monthlyData,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [dados]);

  // ========== % ATINGIMENTO MAC (apenas 2024 e 2025) ==========
  // Fórmula: alunosAtivos / macMeta (mesma fórmula da página de análise)
  // Processar dados para gráfico anual de atingimento (último mês de cada ano)
  const dadosAtingimentoAnuais = useMemo(() => {
    const porAno: Record<string, { periodo: string; alunosAtivos: number; meta: number }> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      // Filtrar apenas 2024 e 2025
      if (year !== '2024' && year !== '2025') return;
      
      // Acumular alunosAtivos e meta para calcular atingimento
      if (!porAno[year]) {
        porAno[year] = { periodo: item.periodo, alunosAtivos: 0, meta: 0 };
      }
      if (item.periodo >= porAno[year].periodo) {
        porAno[year].periodo = item.periodo;
      }
      porAno[year].alunosAtivos += item.alunosAtivos;
      porAno[year].meta += item.macMeta;
    });

    return Object.entries(porAno)
      .map(([year, data]) => ({
        ano: year,
        valor: data.meta > 0 ? Math.round((data.alunosAtivos / data.meta) * 100) : 0,
      }))
      .sort((a, b) => a.ano.localeCompare(b.ano));
  }, [dados]);

  // Processar dados para gráfico mensal de atingimento
  const dadosAtingimentoMensais = useMemo(() => {
    const porAnoMes: Record<string, Record<number, { alunosAtivos: number; meta: number }>> = {};
    
    dados.forEach(item => {
      const year = item.periodo.substring(0, 4);
      // Filtrar apenas 2024 e 2025
      if (year !== '2024' && year !== '2025') return;
      
      const month = parseInt(item.periodo.substring(5, 7), 10) - 1;
      
      if (!porAnoMes[year]) {
        porAnoMes[year] = {};
      }
      if (!porAnoMes[year][month]) {
        porAnoMes[year][month] = { alunosAtivos: 0, meta: 0 };
      }
      porAnoMes[year][month].alunosAtivos += item.alunosAtivos;
      porAnoMes[year][month].meta += item.macMeta;
    });

    return Object.entries(porAnoMes)
      .map(([year, months]) => {
        const monthlyData = Array(12).fill(0);
        Object.entries(months).forEach(([month, data]) => {
          const atingimento = data.meta > 0 ? Math.round((data.alunosAtivos / data.meta) * 100) : 0;
          monthlyData[parseInt(month, 10)] = atingimento;
        });
        return {
          year: parseInt(year, 10),
          monthlyData,
        };
      })
      .sort((a, b) => a.year - b.year);
  }, [dados]);

  // Estado para anos ativos no gráfico mensal de fundos
  const [activeYearsFundos, setActiveYearsFundos] = useState<number[]>(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const availableYears = dadosFundosMensais.map(d => d.year);
    return [previousYear, currentYear].filter(y => availableYears.includes(y));
  });

  // Estado para anos ativos no gráfico mensal de integrantes
  const [activeYearsIntegrantes, setActiveYearsIntegrantes] = useState<number[]>(() => {
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    const availableYears = dadosIntegrantesMensais.map(d => d.year);
    return [previousYear, currentYear].filter(y => availableYears.includes(y));
  });

  // Estado para anos ativos no gráfico mensal de atingimento
  // Como filtramos apenas 2024 e 2025, já definimos esses anos diretamente
  const [activeYearsAtingimento, setActiveYearsAtingimento] = useState<number[]>([2024, 2025]);

  // Handler para toggle de anos (fundos)
  const handleYearToggleFundos = (year: number) => {
    setActiveYearsFundos(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  // Handler para toggle de anos (integrantes)
  const handleYearToggleIntegrantes = (year: number) => {
    setActiveYearsIntegrantes(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  // Handler para toggle de anos (atingimento)
  const handleYearToggleAtingimento = (year: number) => {
    setActiveYearsAtingimento(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => a - b);
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-dark-secondary rounded-xl p-6">
            <ChartSkeleton />
          </div>
          <div className="lg:col-span-2 bg-dark-secondary rounded-xl p-6">
            <ChartSkeleton />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-dark-secondary rounded-xl p-6">
            <ChartSkeleton />
          </div>
          <div className="lg:col-span-2 bg-dark-secondary rounded-xl p-6">
            <ChartSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========== FUNDOS ATIVOS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Fundos Ativos Total Anual (Barras Horizontais) - 1/3 */}
        <div className="bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            FUNDOS ATIVOS TOTAL ANUAL
          </h3>
          <div style={{ height: '350px' }}>
            <FundosAtivosAnualChart 
              data={dadosFundosAnuais}
              suffix=" fundos"
              onBarClick={(item) => console.log('Clicou em:', item)}
            />
          </div>
        </div>

        {/* Gráfico de Fundos Ativos Total Mensal - 2/3 */}
        <div className="lg:col-span-2 bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            FUNDOS ATIVOS TOTAL MENSAL
          </h3>
          <div style={{ minHeight: '350px' }}>
            <FundosMensalChart 
              data={dadosFundosMensais}
              activeYears={activeYearsFundos}
              onYearToggle={handleYearToggleFundos}
              suffix=" fundos"
            />
          </div>
        </div>
      </div>

      {/* ========== INTEGRANTES ATIVOS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Integrantes Ativos Total Anual (Barras Horizontais) - 1/3 */}
        <div className="bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            INTEGRANTES ATIVOS TOTAL ANUAL
          </h3>
          <div style={{ height: '350px' }}>
            <FundosAtivosAnualChart 
              data={dadosIntegrantesAnuais}
              suffix=" integrantes"
              onBarClick={(item) => console.log('Clicou em:', item)}
            />
          </div>
        </div>

        {/* Gráfico de Integrantes Ativos Total Mensal - 2/3 */}
        <div className="lg:col-span-2 bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            INTEGRANTES ATIVOS TOTAL MENSAL
          </h3>
          <div style={{ minHeight: '350px' }}>
            <FundosMensalChart 
              data={dadosIntegrantesMensais}
              activeYears={activeYearsIntegrantes}
              onYearToggle={handleYearToggleIntegrantes}
              suffix=" integrantes"
            />
          </div>
        </div>
      </div>

      {/* ========== % ATINGIMENTO MAC ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de % Atingimento MAC Total Anual (Barras Horizontais) - 1/3 */}
        <div className="bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            % ATINGIMENTO MAC TOTAL ANUAL
          </h3>
          <div style={{ height: '350px' }}>
            <FundosAtivosAnualChart 
              data={dadosAtingimentoAnuais}
              suffix="%"
              showSuffixOnScale={true}
              onBarClick={(item) => console.log('Clicou em:', item)}
            />
          </div>
        </div>

        {/* Gráfico de % Atingimento MAC Total Mensal - 2/3 */}
        <div className="lg:col-span-2 bg-dark-secondary rounded-xl p-6">
          <h3 className="section-title">
            % ATINGIMENTO MAC TOTAL MENSAL
          </h3>
          <div style={{ minHeight: '350px' }}>
            <FundosMensalChart 
              data={dadosAtingimentoMensais}
              activeYears={activeYearsAtingimento}
              onYearToggle={handleYearToggleAtingimento}
              suffix="%"
              showSuffixOnScale={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
