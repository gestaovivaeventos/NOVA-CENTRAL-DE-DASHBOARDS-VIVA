// Configurações da API
export const config = {
  // Planilha de dados principal
  spreadsheetId: '1saWDiU5tILtSheGgykJEz-xR0pmemz29256Y7pfZvSs',
  apiKey: 'AIzaSyBuGRH91CnRuDtN5RGsb5DvHEfhTxJnWSs',

  // Aba da planilha de OKRs
  sheetName: 'NOVO PAINEL OKR',

  // URLs
  centralUrl: '/',
};

// Mapeamento de times para logos
export const teamToLogoMap: Record<string, string> = {
  'CONSULTORIA': '/images/logo-viva.png',
  'EXPANSÃO': '/images/logo-viva.png',
  'FORNECEDORES': '/images/logo-viva.png',
  'GESTÃO': '/images/logo-viva.png',
  'INOVAÇÃO': '/images/logo-viva.png',
  'MARKETING': '/images/logo-viva.png',
  'POS VENDA': '/images/logo-viva.png',
  'ATENDIMENTO': '/images/logo-quokka.png',
  'GP': '/images/logo-quokka.png',
  'QUOKKA': '/images/logo-quokka.png',
  'TI': '/images/logo-quokka.png',
  'FEAT | GROWTH': '/images/logo-feat.png',
  'FEAT': '/images/logo-feat.png',
};

// Cores de destaque por time
export const teamAccentColors: Record<string, string> = {
  'FEAT': '#EA2B82',
  'FEAT | GROWTH': '#EA2B82',
  'default': '#FF6600',
};

// Ícones para times
export const teamIcons: Record<string, string> = {
  'ATENDIMENTO': 'Headphones',
  'CONSULTORIA': 'Rocket',
  'EXPANSÃO': 'Flag',
  'FEAT | GROWTH': 'Star',
  'FEAT': 'Star',
  'GESTÃO': 'TrendingUp',
  'POS VENDA': 'Gauge',
  'QUOKKA': 'DollarSign',
  'TI': 'Monitor',
  'FORNECEDORES': 'Package',
  'INOVAÇÃO': 'Lightbulb',
  'MARKETING': 'Megaphone',
  'GP': 'Users',
};

// Textos de ajuda para o modal
export const helpTexts: Record<string, { title: string; body: string }> = {
  'AUMENTAR_DEGRAU': {
    title: 'Métrica de Variação (Aumentar)',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica de Variação (ou Percentual / Taxa)</p>
      <p><strong>OBJETIVO:</strong> Crescer um percentual ou taxa (margem, NPS, conversão).</p>
      <p><strong>CÁLCULO:</strong> Compara o MELHOR RESULTADO obtido vs a META do período.</p>
      <p><strong>Exemplo:</strong> Meta de NPS 75%, melhor mês foi 80% → Atingimento = 80% / 75% = 106%</p>`,
  },
  'DIMINUIR_DEGRAU': {
    title: 'Métrica de Variação (Diminuir)',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica de Variação (ou Percentual / Taxa)</p>
      <p><strong>OBJETIVO:</strong> Reduzir um percentual ou taxa (churn, inadimplência).</p>
      <p><strong>CÁLCULO:</strong> Compara a META vs o MELHOR (menor) RESULTADO obtido.</p>
      <p><strong>Exemplo:</strong> Meta de churn 5%, melhor mês foi 3% → Atingimento = 5% / 3% = 166%</p>`,
  },
  'AUMENTAR_PONTUAL': {
    title: 'Métrica Pontual (Aumentar)',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica Pontual ou de Valor Absoluto</p>
      <p><strong>OBJETIVO:</strong> Atingir um valor específico crescente.</p>
      <p><strong>CÁLCULO:</strong> Compara o ÚLTIMO RESULTADO vs a META.</p>
      <p><strong>Exemplo:</strong> Meta de 100 clientes, último mês tinha 90 → Atingimento = 90%</p>`,
  },
  'DIMINUIR_PONTUAL': {
    title: 'Métrica Pontual (Diminuir)',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica Pontual ou de Valor Absoluto</p>
      <p><strong>OBJETIVO:</strong> Atingir um valor específico decrescente.</p>
      <p><strong>CÁLCULO:</strong> Compara a META vs o ÚLTIMO RESULTADO.</p>
      <p><strong>Exemplo:</strong> Meta de 10 reclamações, último mês tinha 8 → Atingimento = 125%</p>`,
  },
  'ACUMULADO': {
    title: 'Métrica Acumulada',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica Acumulada (soma dos períodos)</p>
      <p><strong>OBJETIVO:</strong> Acumular um valor ao longo do período (faturamento, vendas).</p>
      <p><strong>CÁLCULO:</strong> Soma de todos os REALIZADOS vs Soma de todas as METAS.</p>
      <p><strong>Exemplo:</strong> Meta acumulada R$100k, realizado acumulado R$85k → Atingimento = 85%</p>`,
  },
  'MÉDIA': {
    title: 'Métrica de Média',
    body: `<p><strong>DESCRIÇÃO:</strong> Métrica de Média dos períodos</p>
      <p><strong>OBJETIVO:</strong> Manter uma média ao longo do período.</p>
      <p><strong>CÁLCULO:</strong> Média dos REALIZADOS vs Média das METAS.</p>
      <p><strong>Exemplo:</strong> Meta média 80%, média realizada 75% → Atingimento = 93.75%</p>`,
  },
  'PADRÃO': {
    title: 'Métrica Padrão',
    body: `<p><strong>DESCRIÇÃO:</strong> Cálculo padrão de atingimento</p>
      <p><strong>CÁLCULO:</strong> Realizado / Meta × 100</p>`,
  },
};
