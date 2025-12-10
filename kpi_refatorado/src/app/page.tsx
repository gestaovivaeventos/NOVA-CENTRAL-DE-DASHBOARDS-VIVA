'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from './LayoutClient';
import { Header, KpiChartSection, Loader } from '@/components';
import { fetchKpiData } from '@/hooks/useData';
import { KpiData } from '@/types';
import { BarChart3 } from 'lucide-react';

export default function KpisPage() {
  const { selectedTeam, setIsLoading, accentColor } = useAppContext();
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados quando o time mudar
  useEffect(() => {
    if (!selectedTeam) return;

    const loadData = async () => {
      setLoading(true);
      setIsLoading(true);
      try {
        const data = await fetchKpiData();
        // Filtrar pelo time selecionado
        const filteredData = data.filter((item) => item.time === selectedTeam);
        setKpiData(filteredData);
      } catch (error) {
        console.error('Erro ao carregar dados de KPI:', error);
      } finally {
        setLoading(false);
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedTeam, setIsLoading]);

  // Agrupar KPIs por nome
  const kpiGroups = useMemo(() => {
    const groups: Record<string, KpiData[]> = {};
    
    kpiData.forEach((item) => {
      if (!groups[item.kpi]) {
        groups[item.kpi] = [];
      }
      groups[item.kpi].push(item);
    });
    
    // Ordenar dados dentro de cada grupo por competência (formato MM/YYYY)
    Object.keys(groups).forEach((kpi) => {
      groups[kpi].sort((a, b) => {
        const parseComp = (s: string) => {
          if (!s) return 0;
          const [mes, ano] = s.split('/').map((x) => parseInt(x));
          return (ano || 0) * 100 + (mes || 0);
        };
        return parseComp(a.competencia) - parseComp(b.competencia);
      });
    });
    
    return groups;
  }, [kpiData]);

  if (!selectedTeam) {
    return (
      <div className="welcome-container">
        <BarChart3 className="welcome-icon" size={80} style={{ color: accentColor }} />
        <h1 className="welcome-title">Gestão de KPIs</h1>
        <p className="welcome-subtitle">
          Selecione um time no menu lateral para visualizar os KPIs.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header team={selectedTeam} />

      {loading ? (
        <Loader message="Carregando KPIs..." />
      ) : Object.keys(kpiGroups).length === 0 ? (
        <div className="welcome-container">
          <p className="welcome-subtitle">Nenhum KPI encontrado para este time.</p>
        </div>
      ) : (
        <div className="kpis-grid">
          {Object.entries(kpiGroups).map(([kpiName, data]) => (
            <KpiChartSection
              key={kpiName}
              kpiName={kpiName}
              data={data}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
