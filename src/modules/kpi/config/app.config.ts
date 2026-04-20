/**
 * Configurações do módulo KPI - Exatamente igual ao kpi_refatorado
 */

// Configurações da API
export const config = {
  // Planilha de dados principal
  spreadsheetId: process.env.NEXT_PUBLIC_SPREADSHEET_GESTAO || '',
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  
  // Aba da planilha de KPIs
  sheetName: 'KPIS',
  
  // URLs
  centralUrl: 'https://central-dashs-viva-html.vercel.app/',
};

// Mapeamento de colunas (para uso nas APIs)
export const kpiColumns = {
  COMPETENCIA: 0,   // A - DATA (DD/MM/YYYY)
  TIME: 1,          // B
  KPI: 3,           // D
  META: 4,          // E
  RESULTADO: 5,     // F
  ATINGIMENTO: 6,   // G - % ATINGIMENTO
  GRANDEZA: 7,      // H
  TENDENCIA: 10,    // K
  PERCENTUAL: 11,   // L - % METAS REAL
  TIPO: 22,         // W
  SITUACAO_KPI: 24, // Y - SITUAÇÃO KPI (Ativo/Inativo)
};

// Mapeamento de times para logos
export const teamToLogoMap: Record<string, string> = {
  'CONSULTORIA PERFORMANCE': '/images/logo-viva.png',
  'EXPANSÃO': '/images/logo-viva.png',
  'SQUAD FORNECEDORES': '/images/logo-viva.png',
  'GESTÃO': '/images/logo-viva.png',
  'MARKETING': '/images/logo-viva.png',
  'PÓS VENDA - CAF': '/images/logo-viva.png',
  'ATENDIMENTO': '/images/logo-quokka.png',
  'GESTÃO DE PESSOAS': '/images/logo-quokka.png',
  'CASH OUT | CONTROLADORIA': '/images/logo-quokka.png',
  'FINANCEIRO (CSC)': '/images/logo-quokka.png',
  'TI': '/images/logo-quokka.png',
  'FEAT': '/images/logo-feat.png',
};

// Ícones para times
export const teamIcons: Record<string, string> = {
  'ATENDIMENTO': 'Headphones',
  'CONSULTORIA PERFORMANCE': 'Rocket',
  'EXPANSÃO': 'Flag',
  'FEAT': 'Star',
  'GESTÃO': 'TrendingUp',
  'PÓS VENDA - CAF': 'Gauge',
  'CASH OUT | CONTROLADORIA': 'DollarSign',
  'FINANCEIRO (CSC)': 'DollarSign',
  'TI': 'Monitor',
  'SQUAD FORNECEDORES': 'Package',
  'MARKETING': 'Megaphone',
  'GESTÃO DE PESSOAS': 'Users',
};
