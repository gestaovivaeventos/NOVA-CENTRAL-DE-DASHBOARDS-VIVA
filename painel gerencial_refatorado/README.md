# Dashboard Gerencial - VIVA Company

Dashboard de KPIs refatorado em React/Next.js, seguindo os padrões do projeto Vendas Refatorado.

## Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Chart.js** - Gráficos
- **Google Sheets API** - Fonte de dados

## Estrutura do Projeto

```
src/
├── components/        # Componentes React
│   ├── charts/        # Componentes de gráficos
│   └── ...
├── config/            # Configurações da aplicação
├── hooks/             # Custom hooks
├── pages/             # Páginas Next.js
├── styles/            # Estilos globais
├── types/             # Definições de tipos TypeScript
└── utils/             # Funções utilitárias
```

## Funcionalidades

- **EBITDA Franqueadora** - Visão anual com meta, resultado e atingimento
- **Objetivos Estratégicos (OKRs)** - Gauges de velocímetro e tabela detalhada
- **Desempenho Trimestral** - Cards e tabela consolidada por time
- **Performance dos Times** - Tabela expansível com evolução mensal
- **KPIs de Atenção (FCA)** - Indicadores abaixo de 60% com sistema de FCA

## Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Construir para produção
npm run build

# Iniciar servidor de produção
npm start
```

## Configuração

As configurações da API do Google Sheets estão em `src/config/app.config.ts`:

- `API_KEY` - Chave da API do Google
- `SPREADSHEET_ID` - ID da planilha
- Nomes das abas: KPIS, OKRS VC, NOVO PAINEL OKR

## Estilo Visual

O dashboard segue o padrão visual do projeto original:

- **Cores**: Laranja primário (#FF6600), fundo escuro (#181818, #232323)
- **Fontes**: Roboto, Montserrat, Russo One
- **Status**: Verde (≥100%), Laranja (61-99%), Vermelho (<60%)

## Deploy

O projeto está configurado para deploy na Vercel:

```bash
# Deploy via CLI
vercel

# Ou conecte o repositório diretamente na Vercel
```
