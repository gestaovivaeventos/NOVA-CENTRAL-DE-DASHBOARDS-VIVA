import { useState, useEffect, useCallback } from 'react';
import { config } from '../config/app.config';
import { OkrData } from '../types';

const buildApiUrl = () =>
  `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(config.sheetName)}?key=${config.apiKey}`;

// Parse data brasileira
const parsePtBrDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('/');
  return parts.length === 3 ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])) : null;
};

// Parse número brasileiro
const parseNumBR = (numStr: string | undefined): number => {
  if (!numStr) return 0;
  let cleanStr = String(numStr).replace(/[R$\s]/g, '');

  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
  } else if (cleanStr.includes(',') && !cleanStr.includes('.')) {
    cleanStr = cleanStr.replace(',', '.');
  } else if (cleanStr.includes('.') && !cleanStr.includes(',')) {
    const dotCount = (cleanStr.match(/\./g) || []).length;
    const lastDotIndex = cleanStr.lastIndexOf('.');
    const afterLastDot = cleanStr.length - lastDotIndex - 1;

    if (dotCount > 1 || afterLastDot !== 2) {
      cleanStr = cleanStr.replace(/\./g, '');
    }
  }

  return parseFloat(cleanStr) || 0;
};

export function useOkrData() {
  const [data, setData] = useState<OkrData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl());
      if (!response.ok) throw new Error('Falha ao buscar dados');

      const result = await response.json();
      const rows = result.values || [];

      if (rows.length < 2) throw new Error('Planilha vazia');

      const headers = rows[0].map((h: string) => h.trim().toLowerCase());

      const processedData: OkrData[] = rows.slice(1).map((row: string[], index: number) => {
        const rowData: Record<string, string> = {};
        headers.forEach((header: string, i: number) => {
          rowData[header] = row[i] || '';
        });

        const medida = (rowData['medida'] || '').toUpperCase();
        let meta: number | null = null;
        let realizado: number | null = null;
        let atingimento: number | null = null;

        // Verificar se meta está vazia
        const metaStr = (rowData['meta'] || '').trim();
        if (metaStr !== '') {
          if (medida.includes('PORCENTAGEM')) {
            meta = parseFloat(metaStr.replace('%', '').replace(',', '.')) / 100;
            if (isNaN(meta)) meta = null;
          } else {
            meta = parseNumBR(metaStr);
          }
        }

        // Verificar se realizado está vazio
        const realizadoStr = (rowData['realizado'] || '').trim();
        if (realizadoStr !== '') {
          if (medida.includes('PORCENTAGEM')) {
            realizado = parseFloat(realizadoStr.replace('%', '').replace(',', '.')) / 100;
            if (isNaN(realizado)) realizado = null;
          } else {
            realizado = parseNumBR(realizadoStr);
          }
        }

        const atingimentoStr = String(rowData['atingimento'] || '');
        if (atingimentoStr !== '' && atingimentoStr !== 'undefined' && atingimentoStr !== 'null') {
          let cleanValue = atingimentoStr.replace('%', '').trim();
          if (cleanValue.includes(',')) {
            cleanValue = cleanValue.replace(',', '.');
          }
          atingimento = parseFloat(cleanValue) || 0;
        }

        return {
          data: parsePtBrDate(rowData['data']),
          time: rowData['time'],
          idOkr: rowData['id_okr'],
          objetivo: rowData['objetivos estratégicos'],
          idKr: rowData['id_kr'],
          indicador: (rowData['indicadores'] || '').trim(),
          meta,
          realizado,
          atingimento,
          atingMetaMes: rowData['ating meta mes'] || rowData['ating_meta_mes'] || rowData['q'] || '',
          quarter: rowData['quarter'],
          tendencia: rowData['tendencia'],
          medida: rowData['medida'],
          formaDeMedir: rowData['forma de medir'] || 'ACUMULADO',
          responsavel: rowData['responsável'] || 'N/A',
          rowIndex: index + 2,
        };
      }).filter((item: OkrData) => item.indicador && item.data);

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

// Função standalone para buscar dados de OKR
export async function fetchOkrData(): Promise<OkrData[]> {
  const response = await fetch(buildApiUrl());
  if (!response.ok) throw new Error('Falha ao buscar dados');

  const result = await response.json();
  const rows = result.values || [];

  if (rows.length < 2) throw new Error('Planilha vazia');

  const headers = rows[0].map((h: string) => h.trim().toLowerCase());

  const processedData: OkrData[] = rows.slice(1).map((row: string[], index: number) => {
    const rowData: Record<string, string> = {};
    headers.forEach((header: string, i: number) => {
      rowData[header] = row[i] || '';
    });

    const medida = (rowData['medida'] || '').toUpperCase();
    let atingimento: number | null = null;

    // Parse META - null se vazio, 0 se for "0"
    const metaStr = rowData['meta']?.trim() || '';
    let meta: number | null = null;
    if (metaStr !== '') {
      if (medida.includes('PORCENTAGEM')) {
        meta = parseFloat(metaStr.replace('%', '').replace(',', '.')) / 100;
      } else {
        meta = parseNumBR(metaStr);
      }
    }

    // Parse REALIZADO - null se vazio, 0 se for "0"
    const realizadoStr = rowData['realizado']?.trim() || '';
    let realizado: number | null = null;
    if (realizadoStr !== '') {
      if (medida.includes('PORCENTAGEM')) {
        realizado = parseFloat(realizadoStr.replace('%', '').replace(',', '.')) / 100;
      } else {
        realizado = parseNumBR(realizadoStr);
      }
    }

    const atingimentoStr = String(rowData['atingimento'] || '');
    if (atingimentoStr !== '' && atingimentoStr !== 'undefined' && atingimentoStr !== 'null') {
      let cleanValue = atingimentoStr.replace('%', '').trim();
      if (cleanValue.includes(',')) {
        cleanValue = cleanValue.replace(',', '.');
      }
      atingimento = parseFloat(cleanValue) || 0;
    }

    return {
      data: parsePtBrDate(rowData['data']),
      time: rowData['time'],
      idOkr: rowData['id_okr'],
      objetivo: rowData['objetivos estratégicos'],
      idKr: rowData['id_kr'],
      indicador: (rowData['indicadores'] || '').trim(),
      meta,
      realizado,
      atingimento,
      atingMetaMes: rowData['ating meta mes'] || rowData['ating_meta_mes'] || rowData['q'] || '',
      quarter: rowData['quarter'],
      tendencia: rowData['tendencia'],
      medida: rowData['medida'],
      formaDeMedir: rowData['forma de medir'] || 'ACUMULADO',
      responsavel: rowData['responsável'] || 'N/A',
      rowIndex: index + 2,
    };
  }).filter((item: OkrData) => item.indicador && item.data);

  return processedData;
}

// Hook para extrair times únicos
export function useTeams(okrData: OkrData[]) {
  return [...new Set(okrData.map((d) => d.time))].filter(Boolean).sort();
}

// Hook para extrair quarters únicos
export function useQuarters(okrData: OkrData[]) {
  return [...new Set(okrData.map((d) => d.quarter))].filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
}

// Hook para extrair objetivos por time e quarter
export function useObjetivos(okrData: OkrData[], team: string, quarter: string) {
  const filtered = okrData.filter((d) => d.time === team && d.quarter === quarter);
  return new Map(filtered.map((d) => [d.idOkr, d.objetivo]));
}

export default useOkrData;
