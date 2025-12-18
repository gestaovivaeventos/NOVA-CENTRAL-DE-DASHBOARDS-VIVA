/**
 * Context para gerenciar filtros da Carteira entre páginas
 * Mantém os filtros sincronizados quando o usuário navega entre páginas
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { FiltrosCarteira } from '@/modules/carteira/types';

// Função auxiliar para obter datas do mês atual
function getDatasMesAtual() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  return {
    dataInicio: formatDate(primeiroDia),
    dataFim: formatDate(ultimoDia),
  };
}

// Estado inicial dos filtros
const getInitialFiltros = (): FiltrosCarteira => {
  const { dataInicio, dataFim } = getDatasMesAtual();
  return {
    periodoSelecionado: 'estemes',
    dataInicio,
    dataFim,
    unidades: [],
    consultorRelacionamento: [],
    consultorAtendimento: [],
    consultorProducao: [],
    cursos: [],
    fundos: [],
    saude: [],
  };
};

interface FiltrosCarteiraContextType {
  filtros: FiltrosCarteira;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosCarteira>>;
  updateFiltros: (novosFiltros: Partial<FiltrosCarteira>) => void;
  resetFiltros: () => void;
}

const FiltrosCarteiraContext = createContext<FiltrosCarteiraContextType | undefined>(undefined);

interface FiltrosCarteiraProviderProps {
  children: ReactNode;
}

export function FiltrosCarteiraProvider({ children }: FiltrosCarteiraProviderProps) {
  const [filtros, setFiltros] = useState<FiltrosCarteira>(getInitialFiltros);

  const updateFiltros = useCallback((novosFiltros: Partial<FiltrosCarteira>) => {
    setFiltros(prev => ({ ...prev, ...novosFiltros }));
  }, []);

  const resetFiltros = useCallback(() => {
    setFiltros(getInitialFiltros());
  }, []);

  return (
    <FiltrosCarteiraContext.Provider value={{ filtros, setFiltros, updateFiltros, resetFiltros }}>
      {children}
    </FiltrosCarteiraContext.Provider>
  );
}

export function useFiltrosCarteira() {
  const context = useContext(FiltrosCarteiraContext);
  if (context === undefined) {
    throw new Error('useFiltrosCarteira deve ser usado dentro de um FiltrosCarteiraProvider');
  }
  return context;
}

export default FiltrosCarteiraContext;
