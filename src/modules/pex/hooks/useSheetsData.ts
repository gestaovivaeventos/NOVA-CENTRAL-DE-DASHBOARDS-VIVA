/**
 * Hook React para buscar dados do Google Sheets
 * AGORA USA CACHE GLOBAL via Context API
 * Os dados são buscados uma vez e compartilhados entre todas as páginas
 */

// Re-exporta o hook do contexto para manter compatibilidade
export { useSheetsData } from '../context/SheetsDataContext';
