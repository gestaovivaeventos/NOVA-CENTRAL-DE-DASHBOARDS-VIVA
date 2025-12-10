/**
 * Configurações do módulo KPI - Exatamente igual ao kpi_refatorado
 */

// Configurações da API
export const config = {
  // Planilha de dados principal
  spreadsheetId: '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs',
  apiKey: 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs',
  
  // Aba da planilha de KPIs
  sheetName: 'KPIS',
  
  // URLs
  centralUrl: 'https://central-dashs-viva-html.vercel.app/',
};

// Mapeamento de colunas (para uso nas APIs)
export const kpiColumns = {
  COMPETENCIA: 18,  // S
  TIME: 1,          // B
  KPI: 3,           // D
  META: 4,          // E
  RESULTADO: 5,     // F
  PERCENTUAL: 16,   // Q
  GRANDEZA: 9,      // J
  TENDENCIA: 15,    // P
  TIPO: 29,         // AD
  NIVEL_ACESSO: 7,  // H
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
