/**
 * Hooks do módulo KPI - Exatamente igual ao kpi_refatorado
 */

import { useState, useEffect, useCallback } from 'react';
import { config, kpiColumns } from '../config/app.config';
import { KpiData } from '../types';

const buildApiUrl = () =>
  `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetName)}?key=${config.apiKey}`;

// Função para parsear valores numéricos (incluindo moeda)
const parseNumericValue = (value: string | null | undefined): number => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return 0;
  }
  
  let cleanValue = String(value)
    .replace(/R\$\s*/gi, '')    // Remove "R$" e espaços
    .replace(/\./g, '')         // Remove pontos de milhar
    .replace(',', '.')          // Troca vírgula decimal por ponto
    .trim();
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
};

// Função para parsear resultado (pode ser null)
const parseResultado = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  
  let cleanValue = String(value)
    .replace(/R\$\s*/gi, '')    // Remove "R$" e espaços
    .replace(/\./g, '')         // Remove pontos de milhar
    .replace(',', '.')          // Troca vírgula decimal por ponto
    .trim();
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
};

export function useKpiData() {
  const [data, setData] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl());
      if (!response.ok) throw new Error('Falha ao buscar dados de KPIs');

      const result = await response.json();
      const rows = result.values || [];

      if (rows.length < 2) throw new Error('Planilha de KPIs vazia');

      const processedData: KpiData[] = rows
        .slice(1)
        .filter((row: string[]) => {
          const nivelAcesso = row[kpiColumns.NIVEL_ACESSO]?.toString().trim().toUpperCase() || '';
          return nivelAcesso !== 'GESTORES';
        })
        .map((row: string[]) => {
          return {
            competencia: row[kpiColumns.COMPETENCIA] || '',
            time: row[kpiColumns.TIME] || '',
            kpi: row[kpiColumns.KPI] || '',
            meta: parseNumericValue(row[kpiColumns.META]),
            resultado: parseResultado(row[kpiColumns.RESULTADO]),
            percentual: parseNumericValue(row[kpiColumns.PERCENTUAL]),
            grandeza: (row[kpiColumns.GRANDEZA] || '').trim().toLowerCase(),
            tendencia: (row[kpiColumns.TENDENCIA] || '').toString().toUpperCase().trim(),
            tipo: (row[kpiColumns.TIPO] || '').toString().toUpperCase().trim(),
          };
        })
        .filter((d: KpiData) => d.time && d.kpi && d.competencia);

      setData(processedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Função standalone para buscar dados de KPI (usada no contexto)
export async function fetchKpiData(): Promise<KpiData[]> {
  const response = await fetch(buildApiUrl());
  if (!response.ok) throw new Error('Falha ao buscar dados de KPIs');

  const result = await response.json();
  const rows = result.values || [];

  if (rows.length < 2) throw new Error('Planilha de KPIs vazia');

  const processedData: KpiData[] = rows
    .slice(1)
    .filter((row: string[]) => {
      const nivelAcesso = row[kpiColumns.NIVEL_ACESSO]?.toString().trim().toUpperCase() || '';
      return nivelAcesso !== 'GESTORES';
    })
    .map((row: string[]) => {
      return {
        competencia: row[kpiColumns.COMPETENCIA] || '',
        time: row[kpiColumns.TIME] || '',
        kpi: row[kpiColumns.KPI] || '',
        meta: parseNumericValue(row[kpiColumns.META]),
        resultado: parseResultado(row[kpiColumns.RESULTADO]),
        percentual: parseNumericValue(row[kpiColumns.PERCENTUAL]),
        grandeza: (row[kpiColumns.GRANDEZA] || '').trim().toLowerCase(),
        tendencia: (row[kpiColumns.TENDENCIA] || '').toString().toUpperCase().trim(),
        tipo: (row[kpiColumns.TIPO] || '').toString().toUpperCase().trim(),
      };
    })
    .filter((d: KpiData) => d.time && d.kpi && d.competencia);

  return processedData;
}

// Hook para extrair times únicos
export function useTeams(kpiData: KpiData[]) {
  return [...new Set(kpiData.map((d) => d.time))].filter(Boolean).sort();
}

export default useKpiData;
