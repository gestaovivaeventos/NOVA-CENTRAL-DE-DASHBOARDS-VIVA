import React, { useState, useEffect, useMemo, useCallback, createContext, useContext, ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Target } from 'lucide-react';
import { Sidebar, Header, OkrKrCard, Loader } from '@/modules/okr/components';
import { fetchOkrData } from '@/modules/okr/hooks/useOkrData';
import { OkrData } from '@/modules/okr/types';

// Lista de todos os times possíveis (para mapeamento de ícones)
const ALL_TEAMS = [
  'ATENDIMENTO',
  'CONSULTORIA',
  'EXPANSÃO',
  'FEAT | GROWTH',
  'GESTÃO',
  'POS VENDA',
  'QUOKKA',
  'TI',
  'FORNECEDORES',
  'INOVAÇÃO',
  'MARKETING',
  'GP',
];

// Context para gerenciar estado global
interface AppContextType {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (quarter: string) => void;
  accentColor: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  allQuarters: string[];
  teamsForQuarter: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [allOkrData, setAllOkrData] = useState<OkrData[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Carregar todos os dados de OKR uma vez ao iniciar
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const data = await fetchOkrData();
        setAllOkrData(data);
        setDataLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar dados de OKR:', error);
      }
    };
    loadAllData();
  }, []);

  // Obter todos os quarters únicos
  const allQuarters = useMemo(() => {
    const quarters = [...new Set(allOkrData.map(item => item.quarter).filter(Boolean))];
    return quarters.sort();
  }, [allOkrData]);

  // Selecionar o maior quarter por padrão quando os dados carregarem
  useEffect(() => {
    if (allQuarters.length > 0 && !selectedQuarter) {
      // Pegar o último quarter (maior)
      const highestQuarter = allQuarters[allQuarters.length - 1];
      setSelectedQuarter(highestQuarter);
    }
  }, [allQuarters, selectedQuarter]);

  // Obter times que possuem objetivos no quarter selecionado
  const teamsForQuarter = useMemo(() => {
    if (!selectedQuarter) return [];
    const dataForQuarter = allOkrData.filter(item => item.quarter === selectedQuarter);
    const teams = [...new Set(dataForQuarter.map(item => item.time).filter(Boolean))];
    // Ordenar pela ordem do ALL_TEAMS
    return teams.sort((a, b) => {
      const indexA = ALL_TEAMS.indexOf(a);
      const indexB = ALL_TEAMS.indexOf(b);
      return indexA - indexB;
    });
  }, [allOkrData, selectedQuarter]);

  // Reset do time selecionado quando mudar de quarter (se o time não existir no novo quarter)
  useEffect(() => {
    if (selectedTeam && teamsForQuarter.length > 0 && !teamsForQuarter.includes(selectedTeam)) {
      setSelectedTeam('');
    }
  }, [teamsForQuarter, selectedTeam]);

  // FEAT e FEAT | GROWTH usam rosa, outros usam laranja
  const isFeatTeam = selectedTeam === 'FEAT | GROWTH' || selectedTeam === 'FEAT';
  const accentColor = isFeatTeam ? '#EA2B82' : '#ff6600';

  return (
    <AppContext.Provider value={{
      selectedTeam,
      setSelectedTeam,
      selectedQuarter,
      setSelectedQuarter,
      accentColor,
      isLoading,
      setIsLoading,
      allQuarters,
      teamsForQuarter
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Componente de conteúdo da página
const OkrPageContent: React.FC = () => {
  const { selectedTeam, selectedQuarter, setSelectedTeam, setSelectedQuarter, setIsLoading, accentColor, allQuarters, teamsForQuarter } = useAppContext();
  const [okrData, setOkrData] = useState<OkrData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Atualizar variável CSS de cor de destaque dinamicamente
  useEffect(() => {
    document.documentElement.style.setProperty('--current-accent-color', accentColor);
  }, [accentColor]);

  // Função para carregar dados
  const loadData = useCallback(async () => {
    if (!selectedTeam) return;

    setLoading(true);
    setIsLoading(true);
    try {
      const data = await fetchOkrData();
      // Filtrar pelo time selecionado
      const filteredData = data.filter((item) => item.time === selectedTeam);
      setOkrData(filteredData);
    } catch (error) {
      console.error('Erro ao carregar dados de OKR:', error);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [selectedTeam, setIsLoading]);

  // Carregar dados quando o time mudar
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Obter objetivos únicos (com ID) - filtrados pelo quarter selecionado
  const objectivesMap = useMemo(() => {
    let filteredData = okrData;
    if (selectedQuarter) {
      filteredData = okrData.filter((item) => item.quarter === selectedQuarter);
    }

    // Criar mapa de idOkr -> objetivo (nome)
    const objMap = new Map<string, string>();
    filteredData.forEach((item) => {
      if (item.idOkr && item.objetivo) {
        objMap.set(item.idOkr, item.objetivo);
      }
    });

    return objMap;
  }, [okrData, selectedQuarter]);

  // Lista de IDs de objetivos ordenados
  const objectiveIds = useMemo(() => {
    return Array.from(objectivesMap.keys()).sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  }, [objectivesMap]);

  // Selecionar primeiro objetivo automaticamente quando mudar quarter
  useEffect(() => {
    if (objectiveIds.length > 0) {
      setSelectedObjective(objectiveIds[0]);
    } else {
      setSelectedObjective('');
    }
  }, [objectiveIds]);

  // Filtrar dados
  const filteredData = useMemo(() => {
    let data = okrData;

    if (selectedQuarter) {
      data = data.filter((item) => item.quarter === selectedQuarter);
    }

    if (selectedObjective) {
      data = data.filter((item) => item.idOkr === selectedObjective);
    }

    return data;
  }, [okrData, selectedQuarter, selectedObjective]);

  // Agrupar dados por INDICADOR único (nome do indicador)
  const groupedByIndicator = useMemo(() => {
    // Primeiro, obter lista de indicadores únicos
    const uniqueIndicators = [...new Set(filteredData.map(d => d.indicador))];

    // Criar mapa com dados de cada indicador
    const indicators = new Map<string, OkrData[]>();

    uniqueIndicators.forEach((indicadorName) => {
      if (indicadorName) {
        const dataForIndicator = filteredData.filter(d => d.indicador === indicadorName);
        indicators.set(indicadorName, dataForIndicator);
      }
    });

    return indicators;
  }, [filteredData]);

  return (
    <div className="app-container okr-module">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
        selectedTeam={selectedTeam}
        onTeamSelect={setSelectedTeam}
        selectedQuarter={selectedQuarter}
        onQuarterSelect={setSelectedQuarter}
        quarters={allQuarters}
        teams={teamsForQuarter}
      />
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {!selectedTeam ? (
          <div className="welcome-container">
            <Target className="welcome-icon" size={80} style={{ color: accentColor }} />
            <h1 className="welcome-title">Gestão de OKRs</h1>
            <p className="welcome-subtitle">
              Selecione um time no menu lateral para visualizar os OKRs e acompanhar o progresso das metas.
            </p>
          </div>
        ) : (
          <div className="page-container">
            <Header team={selectedTeam} />

            <div className="filters-section">
              <div className="filter-group filter-group-objetivo">
                <span className="filter-label">Objetivo</span>
                <div className="objetivo-filter-content">
                  <div className="flex gap-2 flex-wrap">
                    {objectiveIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => setSelectedObjective(id)}
                        className={`filter-btn ${selectedObjective === id ? 'active' : ''}`}
                        title={objectivesMap.get(id)}
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                  {selectedObjective && objectivesMap.get(selectedObjective) && (
                    <span
                      className="objetivo-name"
                      style={{ color: accentColor }}
                    >
                      {objectivesMap.get(selectedObjective)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <Loader message="Carregando OKRs..." />
            ) : groupedByIndicator.size === 0 ? (
              <div className="welcome-container">
                <p className="welcome-subtitle">Nenhum OKR encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              Array.from(groupedByIndicator.entries()).map(([idKr, dataForIndicador]) => {
                const kr = dataForIndicador[0];
                return (
                  <div key={idKr} className="kr-display-wrapper">
                    <OkrKrCard
                      kr={kr}
                      allData={dataForIndicador}
                      accentColor={accentColor}
                      onDataSaved={loadData}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
};

// Página principal
export default function OkrPage() {
  return (
    <>
      <Head>
        <title>Gestão de OKRs | Central de Dashboards</title>
        <meta name="description" content="Painel de gestão de OKRs com acompanhamento de objetivos e resultados-chave" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <AppProvider>
        <OkrPageContent />
      </AppProvider>
    </>
  );
}
