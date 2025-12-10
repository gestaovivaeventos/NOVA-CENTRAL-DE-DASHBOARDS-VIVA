/**
 * Utilitários do módulo KPI
 */

// Meses abreviados para formatação
const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Formatar valor baseado na grandeza
 */
export const formatarValor = (valor: number | null, grandeza: string, minDecimals = 0): string => {
  if (valor === null || valor === undefined) return '';
  if (typeof valor !== 'number' || isNaN(valor)) return '';

  const grandezaLower = grandeza?.toLowerCase() || '';

  if (grandezaLower === 'moeda' || grandezaLower === 'r$' || grandezaLower === 'real') {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (
    grandezaLower === '%' ||
    grandezaLower === 'percentual' ||
    grandezaLower === 'porcentagem' ||
    grandezaLower === 'percentagem'
  ) {
    return (
      valor.toLocaleString('pt-BR', {
        minimumFractionDigits: Math.max(minDecimals, 1),
        maximumFractionDigits: 2,
      }) + '%'
    );
  } else if (
    grandezaLower === 'número inteiro' ||
    grandezaLower === 'numero inteiro' ||
    grandezaLower === 'inteiro'
  ) {
    return Math.round(valor).toLocaleString('pt-BR');
  } else {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: minDecimals,
      maximumFractionDigits: 2,
    });
  }
};

/**
 * Formatar competência para exibição (03/2024 → mar/24)
 */
export const formatarCompetencia = (comp: string): string => {
  if (!comp) return comp;
  const [mes, ano] = comp.split('/');
  const idx = parseInt(mes, 10) - 1;
  if (!isNaN(idx) && ano && mesesAbrev[idx]) {
    return `${mesesAbrev[idx]}/${ano.slice(-2)}`;
  }
  return comp;
};

/**
 * Ordenar dados por competência
 */
export const ordenarPorCompetencia = <T extends { competencia: string }>(dados: T[]): T[] => {
  return [...dados].sort((a, b) => {
    const parseComp = (s: string) => {
      if (!s) return 0;
      const [mes, ano] = s.split('/').map((x) => parseInt(x));
      return (ano || 0) * 100 + (mes || 0);
    };
    return parseComp(a.competencia) - parseComp(b.competencia);
  });
};

/**
 * Agrupar KPIs por nome
 */
export const agruparKpisPorNome = <T extends { kpi: string }>(dados: T[]): Record<string, T[]> => {
  const groups: Record<string, T[]> = {};
  
  dados.forEach((item) => {
    if (!groups[item.kpi]) {
      groups[item.kpi] = [];
    }
    groups[item.kpi].push(item);
  });
  
  return groups;
};

/**
 * Obter cor de destaque do time
 */
export const getTeamAccentColor = (team: string): string => {
  if (team === 'FEAT') return '#EA2B82';
  return '#FF6600';
};
