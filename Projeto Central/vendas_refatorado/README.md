# Dashboard de Vendas - VIVA Eventos

> Interface para visualização e análise de dados de vendas com métricas, metas e funil comercial.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação e Execução](#-instalação-e-execução)
- [Configuração](#-configuração)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Segurança](#-segurança)
- [Troubleshooting](#-troubleshooting)
- [Contribuidores / Suporte](#-contribuidores--suporte)

## 🎯 Visão Geral

Dashboard de vendas desenvolvido em Next.js/React com TypeScript, seguindo os padrões do projeto PEX e as diretrizes de desenvolvimento da empresa.

O sistema permite o acompanhamento em tempo real de métricas de vendas, comparativo com metas e análise do funil comercial, integrando dados de planilhas Google Sheets.

**Principais características:**
- ✅ Integração com Google Sheets API para dados em tempo real
- ✅ 3 visualizações: Metas, Indicadores e Funil de Vendas
- ✅ Sistema de filtros avançados (período, unidade, consultor)
- ✅ Gráficos interativos e responsivos
- ✅ Variáveis de ambiente para proteção de credenciais
- ✅ Arquitetura modular e componentizada

## ✨ Funcionalidades

### 1. Metas e Resultados
- KPIs principais: VVR, QAV, Ticket Médio, Taxa de Conversão
- Gráficos de barras comparativos (realizado x meta)
- Evolução acumulada por período
- Ranking de unidades e consultores

### 2. Indicadores Secundários
- Leads gerados vs meta
- Reuniões realizadas vs meta
- Contratos fechados vs meta
- Adesões vs meta

### 3. Funil de Vendas
- Visualização do funil por fase
- Análise de perdas por motivo
- Taxa de conversão entre etapas

### 4. Filtros Avançados
- Período pré-definido (hoje, ontem, este mês, etc.)
- Período personalizado com date picker
- Multi-seleção de unidades
- Multi-seleção de consultores
- Toggle Meta Interna (85%) / Super Meta (100%)

## 🛠 Tecnologias

- **Frontend:** Next.js 14, React 18, TypeScript 5
- **Estilização:** Tailwind CSS 3.3
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Datas:** date-fns
- **API:** Google Sheets API v4
- **Ferramentas:** Git, npm, PostCSS

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js v18 ou superior
- npm ou yarn
- Acesso às planilhas Google Sheets configuradas
- Chave de API do Google Cloud Console

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/gestaovivaeventos/refatorado_vendas.git
   cd refatorado_vendas/vendas-refatorado
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env.local
   # Edite .env.local com suas credenciais
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

A aplicação estará disponível em `http://localhost:3000`

### Scripts disponíveis
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm start` - Iniciar em produção
- `npm run lint` - Verificar código

## 🔧 Configuração

Crie um arquivo `.env.local` na raiz do projeto e adicione as seguintes variáveis.
Para uma lista completa de variáveis, consulte o arquivo `.env.example`.

```env
# Chave de API do Google Sheets
NEXT_PUBLIC_GOOGLE_API_KEY=sua_api_key_aqui

# IDs das planilhas
NEXT_PUBLIC_SPREADSHEET_SALES=id_planilha_vendas
NEXT_PUBLIC_SPREADSHEET_METAS=id_planilha_metas
NEXT_PUBLIC_SPREADSHEET_FUNIL=id_planilha_funil
```

**⚠️ Importante:** O arquivo `.env.local` está no `.gitignore` e **nunca** deve ser commitado no repositório.

## 📁 Estrutura do Projeto

```
vendas-refatorado/
├── public/                   # Arquivos estáticos
│   └── images/               # Imagens (logo, favicon)
├── src/
│   ├── components/           # Componentes React reutilizáveis
│   │   ├── charts/           # Gráficos (VVRChart, PieChart, FunnelChart)
│   │   ├── filters/          # Filtros (DateRangePicker, MultiSelect)
│   │   ├── tables/           # Tabelas (DataTable, RankingTable)
│   │   ├── Header.tsx        # Cabeçalho da aplicação
│   │   ├── Sidebar.tsx       # Menu lateral de navegação
│   │   ├── KPICard.tsx       # Cards de indicadores
│   │   └── ...
│   ├── config/
│   │   └── app.config.ts     # Módulo central de configuração
│   ├── hooks/                # Hooks customizados
│   │   ├── useSalesData.ts   # Dados de vendas
│   │   ├── useMetasData.ts   # Dados de metas
│   │   ├── useFundosData.ts  # Dados de fundos
│   │   └── useFunilData.ts   # Dados do funil
│   ├── pages/                # Páginas Next.js
│   │   ├── _app.tsx          # App wrapper
│   │   ├── _document.tsx     # HTML base
│   │   └── index.tsx         # Dashboard principal
│   ├── styles/
│   │   └── globals.css       # Estilos globais + Tailwind
│   ├── types/                # Definições de tipos TypeScript
│   │   ├── vendas.types.ts   # Tipos de vendas/adesões
│   │   ├── funil.types.ts    # Tipos do funil
│   │   └── filtros.types.ts  # Tipos de filtros
│   └── utils/                # Funções utilitárias
│       ├── calculos.ts       # Cálculos de KPIs
│       ├── formatacao.ts     # Formatação de valores
│       └── periodo.ts        # Manipulação de datas
├── .env.local                # Variáveis de ambiente (ignorado pelo Git)
├── .env.example              # Template de variáveis de ambiente
├── .gitignore                # Arquivos ignorados pelo Git
├── next.config.js            # Configuração do Next.js
├── tailwind.config.js        # Configuração do Tailwind CSS
├── tsconfig.json             # Configuração do TypeScript
├── package.json              # Dependências do projeto
└── README.md                 # Este arquivo
```

## 🔐 Segurança

- **Chaves de API:** Todas as chaves são gerenciadas via variáveis de ambiente (`.env.local`). O código fonte não contém credenciais hardcoded.
- **Configuração Centralizada:** O arquivo `src/config/app.config.ts` é o único ponto de acesso às variáveis de ambiente, seguindo o princípio de referência centralizada.
- **Git:** O arquivo `.env.local` está listado no `.gitignore` e nunca é enviado ao repositório.
- **API Google Sheets:** A API Key possui restrições de domínio configuradas no Google Cloud Console.

**⚠️ Nota sobre segurança client-side:** Por ser uma aplicação frontend (Next.js client-side), as variáveis `NEXT_PUBLIC_*` ficam expostas no bundle JavaScript. Para máxima segurança em produção, recomenda-se:
1. Restringir a API Key por domínio/IP no Google Cloud Console
2. Implementar um backend intermediário para chamadas sensíveis
3. Utilizar variáveis de ambiente no servidor (não `NEXT_PUBLIC_`)

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| "Erro ao conectar com API" | Verifique se o arquivo `.env.local` está configurado corretamente e reinicie o servidor (`npm run dev`) |
| "Colunas essenciais não encontradas" | Verifique se os nomes das abas nas planilhas correspondem aos configurados em `.env.local` |
| "Port 3000 is in use" | O Next.js tentará automaticamente a porta 3001. Ou encerre o processo na porta 3000 |
| Dados não carregam | Limpe o cache do navegador ou verifique se a API Key tem permissão para a planilha |
| Erro de CORS | Configure as permissões da API Key no Google Cloud Console |

## 👥 Contribuidores / Suporte

- **VIVA Eventos Brasil** - Desenvolvimento e Manutenção
- **Comitê Técnico de IA** - Governança e Diretrizes

---

*Desenvolvido seguindo as Diretrizes e Boas Práticas para Desenvolvimento de Ferramentas de IA - VIVA Eventos Brasil © 2025*
