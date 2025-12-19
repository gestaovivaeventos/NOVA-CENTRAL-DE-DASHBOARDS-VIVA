'use client';

import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { 
  Sidebar, 
  Header, 
  KpiChartSection, 
  Loader 
} from '@/modules/kpi/components';
import { fetchKpiData } from '@/modules/kpi/hooks';
import { KpiData } from '@/modules/kpi/types';
import { BarChart3 } from 'lucide-react';

// Context para gerenciar estado global
interface AppContextType {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  accentColor: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  teams: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default function KpiPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Estado do módulo KPI
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [allKpiData, setAllKpiData] = useState<KpiData[]>([]);
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // FEAT usa rosa, outros usam laranja
  const accentColor = selectedTeam === 'FEAT' ? '#EA2B82' : '#ff6600';

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Extrair ano da competência (formato MM/YYYY)
  const extractYear = (competencia: string): string | null => {
    if (!competencia) return null;
    const parts = competencia.split('/');
    if (parts.length === 2) {
      return parts[1]; // Retorna o ano (YYYY)
    }
    return null;
  };

  // Carregar todos os dados e extrair anos e times
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const data = await fetchKpiData();
        setAllKpiData(data);
        
        // Extrair anos únicos (ordenados crescente)
        const uniqueYears = [...new Set(
          data.map(d => extractYear(d.competencia)).filter((y): y is string => y !== null)
        )].sort((a, b) => parseInt(a) - parseInt(b));
        setYears(uniqueYears);
        
        // Selecionar ano vigente por padrão
        if (uniqueYears.length > 0) {
          const currentYear = new Date().getFullYear().toString();
          if (uniqueYears.includes(currentYear)) {
            setSelectedYear(currentYear);
          } else {
            setSelectedYear(uniqueYears[uniqueYears.length - 1]); // Mais recente
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Atualizar lista de times quando ano muda
  useEffect(() => {
    if (!selectedYear || allKpiData.length === 0) return;
    
    // Filtrar dados pelo ano selecionado
    const dataForYear = allKpiData.filter(d => extractYear(d.competencia) === selectedYear);
    
    // Extrair times únicos para o ano
    const uniqueTeams = [...new Set(dataForYear.map(d => d.time))].filter(Boolean).sort();
    setTeams(uniqueTeams);
    
    // Reset time se não existir no ano selecionado
    if (selectedTeam && !uniqueTeams.includes(selectedTeam)) {
      setSelectedTeam('');
    }
  }, [selectedYear, allKpiData]);

  // Carregar dados filtrados quando time ou ano mudar
  useEffect(() => {
    if (!selectedTeam || !selectedYear) {
      setKpiData([]);
      return;
    }

    setLoading(true);
    setIsLoading(true);
    
    // Filtrar pelo time e ano selecionados
    const filteredData = allKpiData.filter(
      (item) => item.time === selectedTeam && extractYear(item.competencia) === selectedYear
    );
    setKpiData(filteredData);
    
    setLoading(false);
    setIsLoading(false);
  }, [selectedTeam, selectedYear, allKpiData]);

  // Atualizar variável CSS de cor de destaque
  useEffect(() => {
    document.documentElement.style.setProperty('--current-accent-color', accentColor);
  }, [accentColor]);

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

  // Loading de autenticação
  if (authLoading) {
    return (
      <div className="dashboard-wrapper">
        <div className="main-content flex items-center justify-center" style={{ marginLeft: 0 }}>
          <Loader message="Carregando..." />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{selectedTeam ? `KPIs - ${selectedTeam}` : 'Gestão de KPIs'} | Central de Dashboards</title>
        <meta name="description" content="Painel de gestão de KPIs com acompanhamento de indicadores de performance" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <AppContext.Provider value={{
        selectedTeam,
        setSelectedTeam,
        accentColor,
        isLoading,
        setIsLoading,
        teams
      }}>
        <div className="dashboard-wrapper">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onCollapseChange={setSidebarCollapsed}
            selectedTeam={selectedTeam}
            onTeamSelect={setSelectedTeam}
            selectedYear={selectedYear}
            onYearSelect={setSelectedYear}
            teams={teams}
            years={years}
          />
          <main 
            className="main-content transition-all duration-300"
            style={{
              marginLeft: sidebarCollapsed ? '80px' : '300px',
            }}
          >
            {isLoading && <Loader />}
            
            {/* Tela inicial - nenhum time selecionado */}
            {!selectedTeam && (
              <div className="welcome-container">
                <BarChart3 className="welcome-icon" size={80} style={{ color: accentColor }} />
                <h1 className="welcome-title">Gestão de KPIs</h1>
                <p className="welcome-subtitle">
                  Selecione um time no menu lateral para visualizar os KPIs.
                </p>
              </div>
            )}

            {/* Time selecionado - mostrar KPIs */}
            {selectedTeam && (
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
            )}
          </main>
        </div>
      </AppContext.Provider>
    </>
  );
}
