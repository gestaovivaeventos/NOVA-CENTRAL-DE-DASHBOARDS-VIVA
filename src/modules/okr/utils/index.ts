/**
 * Utilitários do módulo OKR
 */

/**
 * Parse data brasileira (DD/MM/YYYY)
 */
export const parsePtBrDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('/');
  return parts.length === 3 
    ? new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])) 
    : null;
};

/**
 * Parse número brasileiro
 */
export const parseNumBR = (numStr: string | undefined): number => {
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

/**
 * Formatar valor baseado na medida
 */
export const formatarValorOkr = (value: number | null | undefined, medida: string, short = false): string => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'number') return String(value);
  const medidaUpper = medida.toUpperCase();

  if (short && Math.abs(value) >= 1000000) {
    return (value / 1000000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'M';
  }
  if (short && Math.abs(value) >= 1000) {
    return (value / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + 'k';
  }
  if (medidaUpper.includes('MOEDA') || medidaUpper.includes('R$')) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  if (medidaUpper.includes('PORCENTAGEM')) {
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
};

/**
 * Obter cor de destaque do time
 */
export const getTeamAccentColor = (team: string): string => {
  if (team === 'FEAT' || team === 'FEAT | GROWTH') return '#EA2B82';
  return '#FF6600';
};

/**
 * Agrupar OKRs por objetivo
 */
export const agruparOkrsPorObjetivo = (dados: import('../types').OkrData[]): Record<string, import('../types').OkrData[]> => {
  const groups: Record<string, import('../types').OkrData[]> = {};
  
  dados.forEach((item) => {
    const key = item.idOkr || item.objetivo || 'Sem objetivo';
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });
  
  return groups;
};

/**
 * Obter quarters disponíveis
 */
export const getQuarters = (): { id: string; label: string }[] => {
  const now = new Date();
  const year = now.getFullYear();
  
  return [
    { id: `Q1-${year}`, label: `Q1 ${year}` },
    { id: `Q2-${year}`, label: `Q2 ${year}` },
    { id: `Q3-${year}`, label: `Q3 ${year}` },
    { id: `Q4-${year}`, label: `Q4 ${year}` },
  ];
};
