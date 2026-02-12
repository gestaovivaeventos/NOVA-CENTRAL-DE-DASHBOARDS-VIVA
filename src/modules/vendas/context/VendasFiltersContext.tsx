/**
 * Contexto para persistir filtros de período e unidades entre páginas do módulo de vendas
 * Os filtros são mantidos apenas em memória e resetam ao sair do módulo ou dar refresh
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import type { FiltrosState, PaginaAtiva } from '../types/filtros.types';

// Função para calcular datas do período "Este mês"
function getInitialDates(): { dataInicio: string; dataFim: string } {
  const hoje = new Date();
  const year = hoje.getFullYear();
  const month = hoje.getMonth();
  
  const inicioMes = new Date(year, month, 1);
  const fimMes = new Date(year, month + 1, 0);
  
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${day}`;
  };
  
  return {
    dataInicio: formatDate(inicioMes),
    dataFim: formatDate(fimMes),
  };
}

// Estado inicial dos filtros com datas do mês atual
const initialDates = getInitialDates();
export const INITIAL_FILTERS: FiltrosState = {
  periodoSelecionado: 'estemes',
  dataInicio: initialDates.dataInicio,
  dataFim: initialDates.dataFim,
  isMetaInterna: false,
  maturidade: [],
  unidades: [],
  regionais: [],
  ufs: [],
  cidades: [],
  consultores: [],
  supervisores: [],
  formasPagamento: [],
  cursos: [],
  fundos: [],
  origemLead: [],
  segmentacaoLead: [],
  etiquetas: [],
  tipoAdesao: [],
  tipoServico: [],
  tipoCliente: [],
  tipoCurso: [],
  consultorComercial: [],
  indicacaoAdesao: [],
  instituicao: [],
};

// Interface do contexto
interface VendasFiltersContextType {
  filtros: FiltrosState;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosState>>;
  updateFiltros: (parcial: Partial<FiltrosState>) => void;
  paginaAtiva: PaginaAtiva;
  setPaginaAtiva: (pagina: PaginaAtiva) => void;
  filtrosCarregados: boolean;
  resetFiltros: () => void;
}

const VendasFiltersContext = createContext<VendasFiltersContextType | null>(null);

export function VendasFiltersProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<FiltrosState>(INITIAL_FILTERS);
  const [paginaAtiva, setPaginaAtiva] = useState<PaginaAtiva>('metas');
  const [filtrosCarregados, setFiltrosCarregados] = useState(false);
  const previousPath = useRef<string>('');

  // Marcar filtros como carregados na montagem
  useEffect(() => {
    setFiltrosCarregados(true);
  }, []);

  // Resetar filtros quando sair do módulo de vendas
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const isInVendas = url.startsWith('/vendas');
      const wasInVendas = previousPath.current.startsWith('/vendas');
      
      // Se estava em vendas e agora não está mais, resetar filtros
      if (wasInVendas && !isInVendas) {
        setFiltros(INITIAL_FILTERS);
      }
      
      previousPath.current = url;
    };

    // Inicializar com a rota atual
    previousPath.current = router.asPath;

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Função para resetar filtros manualmente
  const resetFiltros = useCallback(() => {
    setFiltros(INITIAL_FILTERS);
  }, []);

  // Função helper para atualizar filtros parcialmente
  const updateFiltros = useCallback((parcial: Partial<FiltrosState>) => {
    setFiltros(prev => ({ ...prev, ...parcial }));
  }, []);

  return (
    <VendasFiltersContext.Provider 
      value={{ 
        filtros, 
        setFiltros, 
        updateFiltros, 
        paginaAtiva, 
        setPaginaAtiva,
        filtrosCarregados,
        resetFiltros
      }}
    >
      {children}
    </VendasFiltersContext.Provider>
  );
}

export function useVendasFilters() {
  const context = useContext(VendasFiltersContext);
  if (!context) {
    throw new Error('useVendasFilters deve ser usado dentro de VendasFiltersProvider');
  }
  return context;
}

export default VendasFiltersContext;
