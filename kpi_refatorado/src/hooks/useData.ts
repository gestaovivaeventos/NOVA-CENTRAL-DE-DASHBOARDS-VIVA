'use client';

import { useState, useEffect, useCallback } from 'react';
import { config } from '@/config/app.config';
import { KpiData } from '@/types';

const buildApiUrl = () =>
  `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetName)}?key=${config.apiKey}`;

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

      // Colunas: S=18(COMPETÊNCIA), B=1(TIME), D=3(KPI), E=4(META), F=5(RESULTADO), Q=16(% METAS REAL), J=9(GRANDEZA), P=15(TENDÊNCIA), AD=29(TIPO)
      const COL_MAP = {
        COMPETENCIA: 18,
        TIME: 1,
        KPI: 3,
        META: 4,
        RESULTADO: 5,
        PERCENTUAL: 16,
        GRANDEZA: 9,
        TENDENCIA: 15,
        TIPO: 29,
        NIVEL_ACESSO: 7,
      };

      const processedData: KpiData[] = rows
        .slice(1)
        .filter((row: string[]) => {
          const nivelAcesso = row[COL_MAP.NIVEL_ACESSO]?.toString().trim().toUpperCase() || '';
          return nivelAcesso !== 'GESTORES';
        })
        .map((row: string[]) => {
          const resultadoCell = row[COL_MAP.RESULTADO];
          return {
            competencia: row[COL_MAP.COMPETENCIA] || '',
            time: row[COL_MAP.TIME] || '',
            kpi: row[COL_MAP.KPI] || '',
            meta: parseFloat((row[COL_MAP.META] || '0').replace(',', '.')),
            resultado:
              resultadoCell !== null && resultadoCell !== undefined && String(resultadoCell).trim() !== ''
                ? parseFloat(String(resultadoCell).replace(',', '.'))
                : null,
            percentual: parseFloat((row[COL_MAP.PERCENTUAL] || '0').replace(',', '.')),
            grandeza: (row[COL_MAP.GRANDEZA] || '').trim().toLowerCase(),
            tendencia: (row[COL_MAP.TENDENCIA] || '').toString().toUpperCase().trim(),
            tipo: (row[COL_MAP.TIPO] || '').toString().toUpperCase().trim(),
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

// Função standalone para buscar dados de KPI
export async function fetchKpiData(): Promise<KpiData[]> {
  const response = await fetch(buildApiUrl());
  if (!response.ok) throw new Error('Falha ao buscar dados de KPIs');

  const result = await response.json();
  const rows = result.values || [];

  if (rows.length < 2) throw new Error('Planilha de KPIs vazia');

  const COL_MAP = {
    COMPETENCIA: 18,
    TIME: 1,
    KPI: 3,
    META: 4,
    RESULTADO: 5,
    PERCENTUAL: 16,
    GRANDEZA: 9,
    TENDENCIA: 15,
    TIPO: 29,
    NIVEL_ACESSO: 7,
  };

  const processedData: KpiData[] = rows
    .slice(1)
    .filter((row: string[]) => {
      const nivelAcesso = row[COL_MAP.NIVEL_ACESSO]?.toString().trim().toUpperCase() || '';
      return nivelAcesso !== 'GESTORES';
    })
    .map((row: string[]) => {
      const resultadoCell = row[COL_MAP.RESULTADO];
      return {
        competencia: row[COL_MAP.COMPETENCIA] || '',
        time: row[COL_MAP.TIME] || '',
        kpi: row[COL_MAP.KPI] || '',
        meta: parseFloat((row[COL_MAP.META] || '0').replace(',', '.')),
        resultado:
          resultadoCell !== null && resultadoCell !== undefined && String(resultadoCell).trim() !== ''
            ? parseFloat(String(resultadoCell).replace(',', '.'))
            : null,
        percentual: parseFloat((row[COL_MAP.PERCENTUAL] || '0').replace(',', '.')),
        grandeza: (row[COL_MAP.GRANDEZA] || '').trim().toLowerCase(),
        tendencia: (row[COL_MAP.TENDENCIA] || '').toString().toUpperCase().trim(),
        tipo: (row[COL_MAP.TIPO] || '').toString().toUpperCase().trim(),
      };
    })
    .filter((d: KpiData) => d.time && d.kpi && d.competencia);

  return processedData;
}

// Hook para extrair times únicos
export function useTeams(kpiData: KpiData[]) {
  return [...new Set(kpiData.map((d) => d.time))].filter(Boolean).sort();
}
