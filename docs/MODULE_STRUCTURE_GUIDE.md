# Guia de Estruturação de Módulos - Projeto Central

## 1. Estrutura do Módulo PEX

### 1.1 Arquivos Principais

```
src/modules/pex/
├── index.ts                          # Barril export
├── PexModule.tsx                     # Wrapper/entrada do módulo
├── README.md                         # Documentação interna
├── pages/
│   ├── Dashboard.tsx                 # /pex/dashboard
│   ├── Ranking.tsx                   # /pex/ranking
│   ├── Resultados.tsx                # /pex/resultados
│   ├── Parametros.tsx                # /pex/parametros (requer level 1)
│   └── ResetPassword.tsx             # /pex/reset-password
├── components/
│   ├── Header.tsx                    # Header específico do PEX
│   ├── Sidebar.tsx                   # Sidebar específico do PEX (pode ficar vazio)
│   ├── Card.tsx
│   ├── IndicadorCard.tsx
│   ├── GraficoEvolucao.tsx
│   ├── TabelaRanking.tsx
│   ├── TabelaResumo.tsx
│   ├── ClusterBadge.tsx
│   ├── ResumoOnda.tsx
│   └── Footer.tsx
├── hooks/
│   ├── useSheetsData.ts              # Fetch dados Google Sheets
│   ├── usePexData.ts                 # Processa dados PEX
│   └── useModulePermissions.ts       # Permissões específicas PEX
├── utils/
│   ├── calculosPex.ts                # Lógica de cálculos (DRY!)
│   ├── formatacao.ts
│   ├── validacao.ts
│   ├── permissoes.ts                 # Adaptado para usar useAuth()
│   └── dadosMock.ts
├── types/
│   └── pex.types.ts                  # Tipos específicos do módulo
├── styles/
│   └── pex.module.css                # Estilos CSS modules
└── config/
    └── pex.config.ts                 # Constantes específicas
```

### 1.2 Barril Export

**`src/modules/pex/index.ts`**
```typescript
// Componentes
export { default as PexModule } from './PexModule';
export { default as DashboardPage } from './pages/Dashboard';
export { default as RankingPage } from './pages/Ranking';

// Hooks
export { useSheetsData } from './hooks/useSheetsData';
export { usePexData } from './hooks/usePexData';

// Utils
export * from './utils/calculosPex';
export * from './utils/permissoes';

// Types
export type * from './types/pex.types';

// Config
export { PEX_CONFIG } from './config/pex.config';
```

### 1.3 PexModule - Entrada do Módulo

**`src/modules/pex/PexModule.tsx`**
```tsx
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/common/ProtectedRoute';

// Pages
import DashboardPage from './pages/Dashboard';
import RankingPage from './pages/Ranking';
import ResultadosPage from './pages/Resultados';
import ParametrosPage from './pages/Parametros';
import ResetPasswordPage from './pages/ResetPassword';

interface PexModuleProps {
  slug?: string[];
}

export default function PexModule({ slug = [] }: PexModuleProps) {
  const { isAuthorized } = useAuth();
  const [page] = slug;

  // Renderizar página apropriada baseado na rota
  const renderPage = useMemo(() => {
    switch (page) {
      case 'ranking':
        return <RankingPage />;

      case 'resultados':
        return <ResultadosPage />;

      case 'parametros':
        return (
          <ProtectedRoute requiredLevel={1}>
            <ParametrosPage />
          </ProtectedRoute>
        );

      case 'reset-password':
        return <ResetPasswordPage />;

      case 'dashboard':
      default:
        return <DashboardPage />;
    }
  }, [page]);

  return (
    <div className="w-full">
      {renderPage}
    </div>
  );
}
```

### 1.4 Hook para Dados PEX

**`src/modules/pex/hooks/usePexData.ts`**
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSheetsData } from './useSheetsData';
import { useAuth } from '@/hooks/useAuth';
import { Franquia } from '../types/pex.types';
import { 
  calcularDistribuicaoClusters,
  calcularPontuacaoFinal 
} from '../utils/calculosPex';
import { filterDataByPermission } from '../utils/permissoes';

interface UsePexDataReturn {
  franquias: Franquia[];
  clusters: Record<string, Franquia[]>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePexData(): UsePexDataReturn {
  const { state: authState } = useAuth();
  const { dados: rawData, loading: sheetsLoading, error: sheetsError, refetch: refetchSheets } = useSheetsData();
  const [franquias, setFranquias] = useState<Franquia[]>([]);
  const [clusters, setClusters] = useState<Record<string, Franquia[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Processar dados do Google Sheets
  useEffect(() => {
    try {
      if (rawData.length === 0) {
        setFranquias([]);
        setClusters({});
        return;
      }

      // 1. Filtrar dados por permissão
      const dadosFiltrados = filterDataByPermission(rawData, {
        username: authState.user?.username || '',
        firstName: authState.user?.firstName || '',
        accessLevel: authState.user?.accessLevel || 0,
        unitNames: authState.user?.unitNames,
      });

      // 2. Transformar dados brutos em objetos Franquia
      const franquiasProcessadas = dadosFiltrados.map(row => ({
        id: row.nm_unidade || '',
        nome: row.nm_unidade || '',
        cluster: row.cluster as any || 'CALOURO',
        vvrUltimos12Meses: parseNumbers(row.vvr_ultimos_12_meses),
        macUltimos12Meses: parseNumbers(row.mac_ultimos_12_meses),
        // ... outros campos
      })) as Franquia[];

      setFranquias(franquiasProcessadas);
      
      // 3. Agrupar por clusters
      const clusterAgg = calcularDistribuicaoClusters(franquiasProcessadas);
      setClusters(clusterAgg);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao processar dados PEX:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar dados');
    }
  }, [rawData, authState.user]);

  const refetch = useCallback(async () => {
    await refetchSheets();
  }, [refetchSheets]);

  return {
    franquias,
    clusters,
    loading: sheetsLoading,
    error: error || sheetsError,
    refetch,
  };
}

// Helper
function parseNumbers(str: string): number[] {
  if (!str) return [];
  return str.split(',').map(s => parseFloat(s) || 0);
}
```

### 1.5 Página Dashboard Adaptada

**`src/modules/pex/pages/Dashboard.tsx`**
```tsx
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePexData } from '../hooks/usePexData';
import Card from '../components/Card';
import TabelaRanking from '../components/TabelaRanking';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  CALOURO_INICIANTE: '#3b82f6',
  CALOURO: '#22c55e',
  GRADUADO: '#eab308',
  POS_GRADUADO: '#a855f7',
};

export default function DashboardPage() {
  const { state: authState } = useAuth();
  const { franquias, clusters, loading, error, refetch } = usePexData();

  const clusterChartData = useMemo(() => {
    return Object.entries(clusters).map(([cluster, franquias]) => ({
      name: cluster.replace(/_/g, ' '),
      value: franquias.length,
    }));
  }, [clusters]);

  const topFranquias = useMemo(() => {
    return [...franquias]
      .sort((a, b) => b.vvrUltimos12Meses[0] - a.vvrUltimos12Meses[0])
      .slice(0, 10);
  }, [franquias]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viva-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do PEX...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8 border-red-500">
        <h2 className="text-xl font-bold text-red-600">Erro ao Carregar Dados</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          onClick={refetch}
          className="mt-4 px-4 py-2 bg-viva-primary text-white rounded hover:bg-orange-600 transition"
        >
          Tentar Novamente
        </button>
      </Card>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-title">Dashboard PEX</h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo, {authState.user?.firstName}! 
          {authState.user?.accessLevel === 1 ? ' (Franqueadora)' : ' (Franqueado)'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Total de Franquias</h3>
          <p className="text-3xl font-bold text-viva-primary mt-2">{franquias.length}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Pós-Graduados</h3>
          <p className="text-3xl font-bold text-purple-500 mt-2">{clusters.POS_GRADUADO?.length || 0}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Graduados</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">{clusters.GRADUADO?.length || 0}</p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Calouros</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">
            {(clusters.CALOURO?.length || 0) + (clusters.CALOURO_INICIANTE?.length || 0)}
          </p>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cluster Distribution */}
        <Card className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Cluster</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clusterChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {clusterChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Top 10 Franquias */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Top 10 Franquias (VVR)</h2>
          <TabelaRanking dados={topFranquias} />
        </Card>
      </div>
    </div>
  );
}
```

---

## 2. Estrutura do Módulo Vendas

### 2.1 Estratégia de Conversão

O módulo Vendas é muito maior (9832 linhas de JavaScript). Estratégia de migração:

```
dashboard-vendas-html/script.js (9832 linhas)
├── Análise e decomposição em componentes React
├── Migração de lógica JS → TypeScript
└── Estruturação em módulo Vendas

Resultado:
src/modules/vendas/
├── pages/          (4-5 páginas principais)
├── components/     (10-15 componentes reutilizáveis)
├── hooks/          (2-3 hooks de dados)
├── utils/          (3-4 arquivos de lógica)
└── types/          (tipos específicos)
```

### 2.2 Estrutura do Módulo Vendas

```
src/modules/vendas/
├── index.ts
├── VendasModule.tsx
├── pages/
│   ├── DashboardVendas.tsx       # Dashboard principal
│   ├── AnaliseFiltros.tsx        # Análise com filtros
│   └── RelatorioDetalhado.tsx    # Relatório detalhado
├── components/
│   ├── FiltroMultiselect.tsx     # Componente de filtro
│   ├── GraficoVendas.tsx         # Gráficos customizados
│   ├── TabelaVendas.tsx
│   ├── MapaUnidades.tsx
│   ├── PeriodoSelector.tsx
│   └── ExportButtons.tsx
├── hooks/
│   ├── useSalesData.ts           # Busca dados Sheets
│   └── useVendasFilters.ts       # Gestão de filtros
├── utils/
│   ├── salesCalculations.ts      # Cálculos de vendas
│   ├── filterLogic.ts            # Lógica de filtros
│   ├── formatting.ts             # Formatação de dados
│   └── chartHelpers.ts           # Helpers para gráficos
├── types/
│   └── vendas.types.ts
└── styles/
    └── vendas.module.css
```

### 2.3 VendasModule - Wrapper

**`src/modules/vendas/VendasModule.tsx`**
```tsx
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

import DashboardVendas from './pages/DashboardVendas';
import AnaliseFiltros from './pages/AnaliseFiltros';
import RelatorioDetalhado from './pages/RelatorioDetalhado';

interface VendasModuleProps {
  slug?: string[];
}

export default function VendasModule({ slug = [] }: VendasModuleProps) {
  const [page] = slug;

  const renderPage = useMemo(() => {
    switch (page) {
      case 'analise':
        return <AnaliseFiltros />;

      case 'relatorio':
        return <RelatorioDetalhado />;

      case 'dashboard':
      default:
        return <DashboardVendas />;
    }
  }, [page]);

  return <>{renderPage}</>;
}
```

### 2.4 Hook para Dados de Vendas

**`src/modules/vendas/hooks/useSalesData.ts`**
```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SalesData {
  periodo: string;
  unidade: string;
  vendas: number;
  meta: number;
  // ... mais campos
}

interface UseSalesDataReturn {
  data: SalesData[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSalesData(filters?: any): UseSalesDataReturn {
  const { state: authState } = useAuth();
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construir URL com filtros
      const params = new URLSearchParams();
      if (filters?.periodo) params.append('periodo', filters.periodo);
      if (filters?.unidade) params.append('unidade', filters.unidade);

      const response = await fetch(`/api/vendas/data?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Erro ao buscar dados de vendas');
      }

      const salesData = await response.json();
      
      // Filtrar por permissões do usuário
      const filtered = filterDataByUserPermissions(salesData, authState.user);
      setData(filtered);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [filters, authState.user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

function filterDataByUserPermissions(data: SalesData[], user: any): SalesData[] {
  if (!user) return [];
  if (user.accessLevel === 1) return data; // Franqueadora vê tudo
  if (user.unitNames) {
    return data.filter(row => user.unitNames.includes(row.unidade));
  }
  return [];
}
```

### 2.5 Página de Dashboard Vendas

**`src/modules/vendas/pages/DashboardVendas.tsx`**
```tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useSalesData } from '../hooks/useSalesData';
import { useVendasFilters } from '../hooks/useVendasFilters';
import FiltroMultiselect from '../components/FiltroMultiselect';
import GraficoVendas from '../components/GraficoVendas';
import TabelaVendas from '../components/TabelaVendas';
import ExportButtons from '../components/ExportButtons';
import Card from '@/components/common/Card';

export default function DashboardVendas() {
  const { filters, updateFilter } = useVendasFilters();
  const { data, loading, error, refetch } = useSalesData(filters);

  const summary = useMemo(() => {
    if (!data.length) return { total: 0, atingimento: 0, ranking: [] };

    const total = data.reduce((sum, row) => sum + row.vendas, 0);
    const metaTotal = data.reduce((sum, row) => sum + row.meta, 0);
    const atingimento = metaTotal > 0 ? (total / metaTotal) * 100 : 0;

    const ranking = [...data]
      .sort((a, b) => (b.vendas / b.meta) - (a.vendas / a.meta))
      .slice(0, 5);

    return { total, atingimento, ranking };
  }, [data]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Vendas</h1>
        <p className="text-gray-600 mt-2">Acompanhamento de performance por período</p>
      </div>

      {/* Filtros */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FiltroMultiselect
            label="Período"
            options={['2025-01', '2025-02', '2025-03']}
            value={filters.periodo}
            onChange={(v) => updateFilter('periodo', v)}
          />
          <FiltroMultiselect
            label="Unidades"
            options={['UNI-001', 'UNI-002', 'UNI-003']}
            value={filters.unidade}
            onChange={(v) => updateFilter('unidade', v)}
          />
          <div className="flex items-end gap-2">
            <button
              onClick={refetch}
              className="flex-1 px-4 py-2 bg-viva-primary text-white rounded hover:bg-orange-600 transition"
            >
              Atualizar
            </button>
            <ExportButtons data={data} />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-gray-500">VENDAS TOTAIS</h3>
          <p className="text-3xl font-bold text-viva-primary mt-2">
            R$ {summary.total.toLocaleString('pt-BR')}
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500">ATINGIMENTO META</h3>
          <p className={`text-3xl font-bold mt-2 ${summary.atingimento >= 100 ? 'text-green-500' : 'text-red-500'}`}>
            {summary.atingimento.toFixed(1)}%
          </p>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500">UNIDADES ATIVAS</h3>
          <p className="text-3xl font-bold text-blue-500 mt-2">
            {new Set(data.map(d => d.unidade)).size}
          </p>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <GraficoVendas data={data} />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Top 5 Unidades</h2>
          <div className="space-y-2">
            {summary.ranking.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="font-semibold">{idx + 1}. {item.unidade}</span>
                <span className="text-viva-primary font-bold">
                  {((item.vendas / item.meta) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <TabelaVendas data={data} loading={loading} />
      </Card>
    </div>
  );
}
```

---

## 3. Registro Central de Módulos

**`src/config/modules.config.ts`**
```typescript
/**
 * Registro centralizado de todos os módulos disponíveis
 * Permite fácil adição/remoção de módulos
 */

export interface ModuleConfig {
  id: string;
  name: string;
  displayName: string;
  path: string;
  icon: string;
  component: () => Promise<any>;
  requiredLevel?: 0 | 1;
  enabled: boolean;
  description?: string;
}

export const MODULE_REGISTRY: Record<string, ModuleConfig> = {
  pex: {
    id: 'pex',
    name: 'PEX',
    displayName: 'Dashboard PEX',
    path: '/pex',
    icon: 'BarChart3',
    component: () => import('@/modules/pex').then(m => m.PexModule),
    enabled: true,
    description: 'Programa de Excelência',
  },
  vendas: {
    id: 'vendas',
    name: 'VENDAS',
    displayName: 'Dashboard Vendas',
    path: '/vendas',
    icon: 'TrendingUp',
    component: () => import('@/modules/vendas').then(m => m.VendasModule),
    enabled: true,
    description: 'Performance de vendas',
  },
  // Adicione novos módulos aqui no futuro
  // academy: { ... },
  // eventos: { ... },
};

export function getAvailableModules(userAccessLevel?: 0 | 1): ModuleConfig[] {
  return Object.values(MODULE_REGISTRY).filter(
    module => module.enabled && 
              (!module.requiredLevel || module.requiredLevel <= (userAccessLevel || 0))
  );
}

export function getModuleConfig(moduleId: string): ModuleConfig | undefined {
  return MODULE_REGISTRY[moduleId];
}
```

---

## 4. Componentes Comuns Reutilizáveis

**`src/components/common/LoadingSpinner.tsx`**
```tsx
'use client';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ fullScreen = false, message = 'Carregando...' }: LoadingSpinnerProps) {
  const content = (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-viva-primary mx-auto"></div>
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-viva-dark">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center h-96">{content}</div>;
}
```

**`src/components/common/ErrorBoundary.tsx`**
```tsx
'use client';

import React, { ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-900 bg-opacity-20 border border-red-500 rounded">
          <div className="flex gap-4 items-start">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-600">Algo deu errado</h2>
              <p className="text-red-700 mt-2">{this.state.error?.message}</p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 5. Checklist de Migração por Módulo

### Módulo PEX
- [ ] Copiar todos os componentes de `novo_pex/src/components/`
- [ ] Adaptar imports (de `@/` para `../`)
- [ ] Integrar `useSheetsData` hook
- [ ] Testar permissões (franqueado vs franqueadora)
- [ ] Testes E2E para roteamento interno
- [ ] Performance: verificar re-renders desnecessários

### Módulo Vendas
- [ ] Analisar `script.js` (9832 linhas) e decomp em componentes
- [ ] Converter HTML em componentes React
- [ ] Migrar lógica JS para TypeScript
- [ ] Criar hooks para dados e filtros
- [ ] Integrar com sistema de permissões
- [ ] Testes de filtros multisselect
- [ ] Performance: lazy load de gráficos

---

## 6. Exemplo: Adicionar Novo Módulo

Para adicionar novo módulo (ex: Academy):

1. **Criar estrutura**
```bash
mkdir -p src/modules/academy/{pages,components,hooks,utils,types}
```

2. **Criar `AcademyModule.tsx`**
```tsx
export default function AcademyModule({ slug = [] }: { slug?: string[] }) {
  // ... roteamento interno
}
```

3. **Criar `src/modules/academy/index.ts`**
```typescript
export { default as AcademyModule } from './AcademyModule';
```

4. **Registrar em `modules.config.ts`**
```typescript
academy: {
  id: 'academy',
  name: 'ACADEMY',
  displayName: 'Viva Academy',
  path: '/academy',
  icon: 'BookOpen',
  component: () => import('@/modules/academy').then(m => m.AcademyModule),
  enabled: true,
},
```

5. **Sistema de roteamento automático detecta!**
   - Sidebar atualiza automaticamente
   - `/academy/**` rotas funcionam

