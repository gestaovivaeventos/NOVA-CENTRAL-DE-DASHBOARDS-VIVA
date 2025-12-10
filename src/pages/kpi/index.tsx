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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<string[]>([]);
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

  // Carregar times disponíveis
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const data = await fetchKpiData();
        const uniqueTeams = [...new Set(data.map((d) => d.time))].filter(Boolean).sort();
        setTeams(uniqueTeams);
      } catch (error) {
        console.error('Erro ao carregar times:', error);
      }
    };
    if (user) {
      loadTeams();
    }
  }, [user]);

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
  }, [selectedTeam]);

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
            teams={teams}
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
