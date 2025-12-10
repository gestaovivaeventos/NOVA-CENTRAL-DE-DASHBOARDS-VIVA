'use client';

import React, { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Sidebar, Loader } from '@/components';
import { fetchKpiData } from '@/hooks/useData';
import { KpiData } from '@/types';
import '@/styles/globals.css';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [teams, setTeams] = useState<string[]>([]);

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
    loadTeams();
  }, []);

  // FEAT usa rosa, outros usam laranja
  const accentColor = selectedTeam === 'FEAT' ? '#EA2B82' : '#ff6600';

  return (
    <AppContext.Provider value={{
      selectedTeam,
      setSelectedTeam,
      accentColor,
      isLoading,
      setIsLoading,
      teams
    }}>
      {children}
    </AppContext.Provider>
  );
};

interface LayoutClientProps {
  children: ReactNode;
}

const LayoutClient: React.FC<LayoutClientProps> = ({ children }) => {
  const { selectedTeam, setSelectedTeam, isLoading, teams, accentColor } = useAppContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Atualizar variável CSS de cor de destaque
  useEffect(() => {
    document.documentElement.style.setProperty('--current-accent-color', accentColor);
  }, [accentColor]);

  return (
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
