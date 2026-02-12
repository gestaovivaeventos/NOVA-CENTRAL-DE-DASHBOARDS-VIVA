'use client';

import React, { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { 
  Sidebar, 
  Header, 
  KpiChartSection, 
  Loader,
  KpiFormModal,
  KpiEditModal,
  KpiTableView
} from '@/modules/kpi/components';
import { fetchKpiData } from '@/modules/kpi/hooks';
import { KpiData } from '@/modules/kpi/types';
import { BarChart3, Plus, LayoutGrid, Table2 } from 'lucide-react';

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
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<{ name: string; data: KpiData[] } | null>(null);
  const [viewMode, setViewMode] = useState<'apresentacao' | 'gerenciamento'>('apresentacao');

  // FEAT usa rosa, outros usam laranja
  const accentColor = selectedTeam === 'FEAT' ? '#EA2B82' : '#ff6600';

  // Verificar autenticação e nível de acesso
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    // Franqueados (accessLevel = 0) só podem acessar o PEX
    if (!authLoading && user && user.accessLevel === 0) {
      router.push('/pex');
    }
  }, [user, authLoading, router]);

  // Extrair ano da competência (formato DD/MM/YYYY)
  const extractYear = (competencia: string): string | null => {
    if (!competencia) return null;
    const parts = competencia.split('/');
    if (parts.length === 3) {
      return parts[2]; // Retorna o ano (YYYY)
    } else if (parts.length === 2) {
      return parts[1]; // Fallback para formato antigo MM/YYYY
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

  // Handler para criação de novo KPI
  const handleCreateKpi = async (formData: {
    nome: string;
    inicioMes: string;
    inicioAno: string;
    terminoMes: string;
    terminoAno: string;
    tendencia: string;
    grandeza: string;
    metas: Record<string, string>;
  }) => {
    // Enviar para API
    const response = await fetch('/api/kpi/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        team: selectedTeam,
        ...formData,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro ao criar KPI');
    }

    // Recarregar dados após criação bem-sucedida
    const data = await fetchKpiData();
    setAllKpiData(data);
    
    console.log(`KPI criado com sucesso! ID: ${result.kpiId}, Linhas: ${result.rowsInserted}`);
  };

  // Handler para abrir modal de edição
  const handleOpenEditModal = (kpiName: string, kpiDataList: KpiData[]) => {
    setEditingKpi({ name: kpiName, data: kpiDataList });
    setIsEditModalOpen(true);
  };

  // Handler para recarregar dados após edição
  const handleAfterEdit = async () => {
    const data = await fetchKpiData();
    setAllKpiData(data);
  };

  // Handler para inativar KPI
  const handleInactivateKpi = async (kpiName: string, kpiDataList: KpiData[]) => {
    if (!selectedTeam) {
      alert('Selecione um time primeiro.');
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza que deseja inativar o KPI "${kpiName}"?\n\nIsso marcará como "Inativo" todos os meses que ainda não possuem resultado.`
    );

    if (!confirmar) return;

    try {
      const response = await fetch('/api/kpi/inactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: selectedTeam,
          kpiName: kpiName
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(result.message || 'KPI inativado com sucesso!');
        // Recarregar dados
        const data = await fetchKpiData();
        setAllKpiData(data);
      } else {
        alert(`Erro ao inativar KPI: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Erro ao inativar KPI:', error);
      alert('Erro ao inativar KPI. Tente novamente.');
    }
  };

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
    
    // Ordenar dados dentro de cada grupo por competência (formato DD/MM/YYYY)
    Object.keys(groups).forEach((kpi) => {
      groups[kpi].sort((a, b) => {
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

                {/* Tabs de visualização + Botão Criar KPI */}
                <div className="flex items-center justify-between mb-4">
                  {/* Tabs */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('apresentacao')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        viewMode === 'apresentacao'
                          ? 'text-white border-2'
                          : 'text-gray-400 border border-gray-600 hover:border-gray-500'
                      }`}
                      style={viewMode === 'apresentacao' ? { borderColor: accentColor, color: accentColor } : {}}
                    >
                      <LayoutGrid size={18} />
                      APRESENTAÇÃO
                    </button>
                    <button
                      onClick={() => setViewMode('gerenciamento')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        viewMode === 'gerenciamento'
                          ? 'text-white border-2'
                          : 'text-gray-400 border border-gray-600 hover:border-gray-500'
                      }`}
                      style={viewMode === 'gerenciamento' ? { borderColor: accentColor, color: accentColor } : {}}
                    >
                      <Table2 size={18} />
                      GERENCIAMENTO
                    </button>
                  </div>

                  {/* Botão Criar KPI */}
                  <button
                    onClick={() => setIsFormModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 hover:scale-105"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus size={20} />
                    Criar KPI
                  </button>
                </div>

                {loading ? (
                  <Loader message="Carregando KPIs..." />
                ) : Object.keys(kpiGroups).length === 0 ? (
                  <div className="welcome-container">
                    <p className="welcome-subtitle">Nenhum KPI encontrado para este time.</p>
                    <button
                      onClick={() => setIsFormModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 mt-4 rounded-lg text-white font-medium transition-all hover:opacity-90"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Plus size={20} />
                      Criar seu primeiro KPI
                    </button>
                  </div>
                ) : viewMode === 'apresentacao' ? (
                  <div className="kpis-grid">
                    {Object.entries(kpiGroups).map(([kpiName, data]) => (
                      <KpiChartSection
                        key={kpiName}
                        kpiName={kpiName}
                        data={data}
                        accentColor={accentColor}
                        onEdit={() => handleOpenEditModal(kpiName, data)}
                      />
                    ))}
                  </div>
                ) : (
                  <KpiTableView
                    kpiGroups={kpiGroups}
                    accentColor={accentColor}
                    onEdit={handleOpenEditModal}
                    onInactivate={handleInactivateKpi}
                  />
                )}
              </div>
            )}
          </main>

          {/* Modal de criação de KPI */}
          <KpiFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleCreateKpi}
            accentColor={accentColor}
            selectedTeam={selectedTeam}
          />

          {/* Modal de edição de KPI */}
          {editingKpi && (
            <KpiEditModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingKpi(null);
              }}
              onSave={handleAfterEdit}
              kpiData={editingKpi.data}
              kpiName={editingKpi.name}
              accentColor={accentColor}
              selectedTeam={selectedTeam}
            />
          )}
        </div>
      </AppContext.Provider>
    </>
  );
}
