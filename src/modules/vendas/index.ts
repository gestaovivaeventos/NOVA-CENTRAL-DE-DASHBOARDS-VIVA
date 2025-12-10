/**
 * Módulo de Vendas
 * Exporta todos os componentes, hooks, types e utils do módulo
 */

// Re-exportar componentes principais
export { 
  Header,
  Sidebar,
  Loading,
  KPICard,
  IndicadoresOperacionais,
  Card,
  FunilHorizontal,
  Footer,
  IndicadorCard,
  SectionTitle,
  MetaToggle,
  MotivosPerdaDescarteTable,
  DataTable,
  ChartSelector
} from './components';

// Charts
export * from './components/charts';

// Tables - exportar apenas o que não conflita
export { CaptacoesTable, DadosDetalhadosTable, IndicadoresOperacionaisTable } from './components/tables';

// Filters
export * from './components/filters';

// Hooks
export * from './hooks';

// Types
export * from './types';

// Utils
export * from './utils';

// Config
export * from './config/app.config';
