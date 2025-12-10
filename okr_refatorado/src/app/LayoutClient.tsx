'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { Sidebar, Loader } from '@/components';
import { fetchOkrData } from '@/hooks/useData';
import { OkrData } from '@/types';
import '@/styles/globals.css';

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

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
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

interface LayoutClientProps {
  children: ReactNode;
}

const LayoutClient: React.FC<LayoutClientProps> = ({ children }) => {
  const { selectedTeam, setSelectedTeam, selectedQuarter, setSelectedQuarter, isLoading, allQuarters, teamsForQuarter, accentColor } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Atualizar variável CSS de cor de destaque dinamicamente
  useEffect(() => {
    document.documentElement.style.setProperty('--current-accent-color', accentColor);
  }, [accentColor]);

  return (
    <div className="app-container">
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
        {isLoading && <Loader />}
        {children}
      </main>
    </div>
  );
};

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <LayoutClient>{children}</LayoutClient>
    </AppProvider>
  );
}
