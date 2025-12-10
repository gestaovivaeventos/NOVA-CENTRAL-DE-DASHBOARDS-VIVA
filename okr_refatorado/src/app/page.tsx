'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from './LayoutClient';
import { Header, FilterButtons, OkrKrCard, Loader } from '@/components';
import { fetchOkrData } from '@/hooks/useData';
import { OkrData } from '@/types';
import { Target } from 'lucide-react';

export default function OkrsPage() {
  const { selectedTeam, selectedQuarter, setIsLoading, accentColor } = useAppContext();
  const [okrData, setOkrData] = useState<OkrData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<string>('');

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
  // Similar ao projeto de referência: [...new Set(filteredData.map(d => d.INDICADOR))]
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

  if (!selectedTeam) {
    return (
      <div className="welcome-container">
        <Target className="welcome-icon" size={80} style={{ color: accentColor }} />
        <h1 className="welcome-title">Gestão de OKRs</h1>
        <p className="welcome-subtitle">
          Selecione um time no menu lateral para visualizar os OKRs e acompanhar o progresso das metas.
        </p>
      </div>
    );
  }

  return (
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
  );
}
