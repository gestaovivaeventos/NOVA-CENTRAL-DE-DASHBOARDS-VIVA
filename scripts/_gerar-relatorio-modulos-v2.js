/* eslint-disable */
/**
 * Gera relatório Word (.docx) V2 — Análise de cobertura com contagem por páginas.
 * 
 * Metodologia de contagem:
 *  - Módulos com múltiplas páginas internas contam cada página como 1 entrega
 *  - Módulos de link externo com subdivisões conhecidas contam pelo número de entregas
 *  - O grupo "Relatórios Recorrentes" conta como 1 único item independente da qtd de módulos
 *  - Demais módulos contam como 1
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
  NumberFormat,
} = require('docx');

// ---------- ENV ----------
const envPath = path.join(__dirname, '..', '.env.local');
const envVars = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const i = t.indexOf('=');
    if (i > 0) envVars[t.substring(0, i)] = t.substring(i + 1);
  }
});

// ---------- READ SHEET ----------
async function readSheet() {
  const sa = JSON.parse(Buffer.from(envVars.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: sa.client_email, key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: envVars.CONTROLE_MODULOS_SPREADSHEET_ID,
    range: `${envVars.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS'}!A:P`,
  });
  const rows = res.data.values || [];
  return rows.slice(1).map(r => ({
    id: r[0] || '',
    nome: r[1] || '',
    path: r[2] || '',
    nvl: Number(r[3] || 1),
    users: (r[4] || '').split(',').map(s => s.trim()).filter(Boolean),
    ativo: String(r[5] || '').toLowerCase() === 'true' || r[5] === '1' || String(r[5]).toLowerCase() === 'sim',
    grupo: r[6] || 'Outros',
    ordem: Number(r[7] || 0),
    icone: r[8] || '',
    tipo: r[9] || 'interno',
    url: r[10] || '',
    subgrupo: r[11] || '',
    setores: (r[12] || '').split(',').map(s => s.trim()).filter(Boolean),
    grupos_permitidos: (r[13] || '').split(',').map(s => s.trim()).filter(Boolean),
    beta: String(r[14] || '').toLowerCase() === 'true' || r[14] === '1' || String(r[14]).toLowerCase() === 'sim',
  })).filter(r => r.id);
}

// =============================================
// CONTAGEM ESPECIAL POR PÁGINAS / ENTREGAS
// =============================================
const CONTAGEM_ESPECIAL = {
  'analise-mercado': {
    count: 4,
    motivo: 'Módulo interno com 4 páginas distintas: (1) Mercado Potencial — Aluno, (2) Mercado Potencial — Turma, (3) Market Share — Alunos, (4) Market Share — Turmas',
    paginas: [
      'Mercado Potencial — Aluno (com abas: Visão do Ano + Comparativo Anual)',
      'Mercado Potencial — Turma (com abas: Visão do Ano + Comparativo Anual)',
      'Market Share — Alunos',
      'Market Share — Turmas',
    ],
  },
  'funil-expansao': {
    count: 4,
    motivo: 'Módulo interno com 4 páginas distintas: Indicadores Principais, Indicadores Operacionais, Indicadores Composição, Indicadores de Campanhas',
    paginas: [
      'Indicadores Principais',
      'Indicadores Operacionais',
      'Indicadores Composição',
      'Indicadores de Campanhas',
    ],
  },
  'vendas': {
    count: 3,
    motivo: 'Módulo interno com 3 páginas distintas: Metas e Resultados, Indicadores Secundários, Funil de Vendas',
    paginas: [
      'Metas e Resultados',
      'Indicadores Secundários',
      'Funil de Vendas',
    ],
  },
  'fluxo-projetado': {
    count: 2,
    motivo: 'Módulo interno com 2 páginas distintas: Fluxo Projetado e Fluxo Realizado',
    paginas: [
      'Fluxo Projetado',
      'Fluxo Realizado',
    ],
  },
  'lancando-foguetes': {
    count: 2,
    motivo: 'Link externo com 2 entregas distintas: Acompanhamento semanal da puxada de vendas e o Programa de Medalhas',
    paginas: [
      'Acompanhamento Semanal — Puxada de Vendas',
      'Programa de Medalhas',
    ],
  },
  'nps-franqueadora': {
    count: 2,
    motivo: 'Link externo com 2 entregas distintas: NPS Semestral e NPS Pós-Eventos',
    paginas: [
      'NPS Semestral',
      'NPS Pós-Eventos',
    ],
  },
  'nps-franquias': {
    count: 2,
    motivo: 'Link externo com 2 entregas distintas: NPS Semestral e NPS Pós-Eventos (visão franquias)',
    paginas: [
      'NPS Semestral (Franquias)',
      'NPS Pós-Eventos (Franquias)',
    ],
  },
  'mestre-da-jornada': {
    count: 3,
    motivo: 'Link externo com 3 entregas distintas: Painel de acompanhamento da puxada, Selos (Medalhas) e PCS (Programa de Cargos e Salários)',
    paginas: [
      'Painel de Acompanhamento — Puxada',
      'Selos / Medalhas',
      'PCS — Programa de Cargos e Salários',
    ],
  },
};

// Relatórios Recorrentes = grupo inteiro conta como 1
const GRUPO_UNICO = 'Relatórios Recorrentes';

// ---------- ANALYSIS ----------
function analyze(mods) {
  const total = mods.length;
  const ativos = mods.filter(m => m.ativo);
  const beta = mods.filter(m => m.beta);
  const internos = mods.filter(m => m.tipo === 'interno');
  const externos = mods.filter(m => m.tipo === 'externo');

  // --- Contagem ponderada ---
  const relRecorrentes = mods.filter(m => m.grupo === GRUPO_UNICO);
  const outrosModulos = mods.filter(m => m.grupo !== GRUPO_UNICO);

  let totalEntregas = 0;
  const detalheEntregas = []; // { modulo, contagemNormal, contagemPonderada, motivo }

  // Relatórios Recorrentes como 1
  if (relRecorrentes.length > 0) {
    totalEntregas += 1;
    detalheEntregas.push({
      id: '__grupo_relatorios_recorrentes__',
      nome: `Relatórios Recorrentes (${relRecorrentes.length} módulos no grupo)`,
      contagemNormal: relRecorrentes.length,
      contagemPonderada: 1,
      motivo: `O grupo inteiro (${relRecorrentes.length} links) conta como 1 entrega por se tratar de relatórios operacionais recorrentes agrupados`,
      paginas: relRecorrentes.map(m => m.nome),
    });
  }

  outrosModulos.forEach(m => {
    const esp = CONTAGEM_ESPECIAL[m.id];
    if (esp) {
      totalEntregas += esp.count;
      detalheEntregas.push({
        id: m.id,
        nome: m.nome,
        contagemNormal: 1,
        contagemPonderada: esp.count,
        motivo: esp.motivo,
        paginas: esp.paginas,
      });
    } else {
      totalEntregas += 1;
      detalheEntregas.push({
        id: m.id,
        nome: m.nome,
        contagemNormal: 1,
        contagemPonderada: 1,
        motivo: 'Contagem padrão — 1 módulo = 1 entrega',
        paginas: null,
      });
    }
  });

  const hasUser = (m, u) => m.users.some(x => x.toLowerCase() === u.toLowerCase());

  // Contagem ponderada
  const contarEntregas = (lista) => {
    let count = 0;
    const relRec = lista.filter(m => m.grupo === GRUPO_UNICO);
    const outros = lista.filter(m => m.grupo !== GRUPO_UNICO);
    if (relRec.length > 0) count += 1;
    outros.forEach(m => {
      const esp = CONTAGEM_ESPECIAL[m.id];
      count += esp ? esp.count : 1;
    });
    return count;
  };

  // FRANQUEADORA
  // Alvo = módulos explicitamente planejados (franqueadora.central) + módulos abertos a todos (users vazio, nvl<=1)
  const alvoFr = mods.filter(m =>
    hasUser(m, 'franqueadora.central') || (m.users.length === 0 && m.nvl <= 1)
  );
  // Entregue = módulos efetivamente disponíveis: tem THOMAS OU está aberto a todos (users vazio, nvl<=1)
  const entregueFr = mods.filter(m =>
    (hasUser(m, 'THOMAS') || hasUser(m, 'thomas') || (m.users.length === 0 && m.nvl <= 1))
    && m.nvl <= 1  // apenas nível franqueadora ou rede
  );
  // Gap = está no alvo mas não no entregue
  const entregueIdsFr = new Set(entregueFr.map(m => m.id));
  const gapFr = alvoFr.filter(m => !entregueIdsFr.has(m.id));

  const alvoFrEntregas = contarEntregas(alvoFr);
  const entregueFrEntregas = contarEntregas(entregueFr);
  const gapFrEntregas = contarEntregas(gapFr);

  // FRANQUIA
  // Alvo = módulos planejados (franquias.central) + módulos abertos a todos nível rede (users vazio, nvl=0)
  const alvoFq = mods.filter(m =>
    hasUser(m, 'franquias.central') || (m.users.length === 0 && m.nvl === 0)
  );
  // Entregue = apenas PEX efetivamente em uso pelas franquias
  const entregueFq = mods.filter(m => m.id === 'pex');
  const entregueIdsFq = new Set(entregueFq.map(m => m.id));
  const gapFq = alvoFq.filter(m => !entregueIdsFq.has(m.id));

  const alvoFqEntregas = contarEntregas(alvoFq);
  const entregueFqEntregas = contarEntregas(entregueFq);
  const gapFqEntregas = contarEntregas(gapFq);

  // Grupos
  const porGrupo = {};
  mods.forEach(m => {
    porGrupo[m.grupo] = porGrupo[m.grupo] || [];
    porGrupo[m.grupo].push(m);
  });

  // TOTAL CONSOLIDADO (sem duplicatas entre franqueadora e franquia)
  const alvoTotalSet = new Set([...alvoFr.map(m => m.id), ...alvoFq.map(m => m.id)]);
  const alvoTotalMods = mods.filter(m => alvoTotalSet.has(m.id));
  const entregueTotalSet = new Set([...entregueFr.map(m => m.id), ...entregueFq.map(m => m.id)]);
  const entregueTotalMods = mods.filter(m => entregueTotalSet.has(m.id));
  const gapTotalMods = alvoTotalMods.filter(m => !entregueTotalSet.has(m.id));

  const alvoTotalEntregas = contarEntregas(alvoTotalMods);
  const entregueTotalEntregas = contarEntregas(entregueTotalMods);
  const gapTotalEntregas = contarEntregas(gapTotalMods);

  return {
    total, ativos, beta, internos, externos,
    totalEntregas, detalheEntregas,
    alvoFr, entregueFr, gapFr, alvoFrEntregas, entregueFrEntregas, gapFrEntregas,
    alvoFq, entregueFq, gapFq, alvoFqEntregas, entregueFqEntregas, gapFqEntregas,
    alvoTotalMods, entregueTotalMods, gapTotalMods,
    alvoTotalEntregas, entregueTotalEntregas, gapTotalEntregas,
    porGrupo, relRecorrentes,
  };
}

// ---------- DOCX HELPERS ----------
const COR_LARANJA = 'FF6600';
const COR_CINZA = '6C757D';
const COR_VERDE = '16A34A';
const COR_VERMELHO = 'DC2626';
const COR_AZUL = '2563EB';
const COR_ROXO = '7C3AED';

const t = (text, opts = {}) => new TextRun({ text: String(text ?? ''), ...opts });
const br = () => new TextRun({ break: 1 });

const p = (text, opts = {}) => new Paragraph({
  children: [t(text, opts.run || {})],
  ...opts.para,
});

const h = (text, level = HeadingLevel.HEADING_1, color = COR_LARANJA) => new Paragraph({
  heading: level,
  spacing: { before: 280, after: 160 },
  children: [new TextRun({ text, bold: true, color })],
});

const para = (runs, alignment = AlignmentType.LEFT) => new Paragraph({
  alignment,
  spacing: { after: 100 },
  children: Array.isArray(runs) ? runs : [runs],
});

const bullet = (text, level = 0) => new Paragraph({
  bullet: { level },
  spacing: { after: 40 },
  children: typeof text === 'string' ? [t(text)] : text,
});

const cell = (text, opts = {}) => {
  const runs = Array.isArray(text) ? text : [t(text, opts.run || {})];
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.bg ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.bg } : undefined,
    children: [new Paragraph({ alignment: opts.align || AlignmentType.LEFT, children: runs })],
  });
};

const headerRow = (cols, widths) => new TableRow({
  tableHeader: true,
  children: cols.map((c, i) => cell(c, {
    bg: COR_LARANJA,
    width: widths ? widths[i] : undefined,
    run: { bold: true, color: 'FFFFFF', size: 18 },
  })),
});

const makeTable = (headers, rows, widths) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    headerRow(headers, widths),
    ...rows.map((r, idx) => new TableRow({
      children: r.map((c, i) => cell(c, {
        width: widths ? widths[i] : undefined,
        bg: idx % 2 === 0 ? 'F5F5F5' : undefined,
        run: { size: 18 },
      })),
    })),
  ],
});

function pct(n, total) {
  if (!total) return '0%';
  return `${((n / total) * 100).toFixed(1)}%`;
}

// ---------- BUILD DOC ----------
function buildDoc(mods, a) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const children = [];

  // ======= CAPA =======
  children.push(new Paragraph({ spacing: { before: 2400, after: 400 }, alignment: AlignmentType.CENTER,
    children: [t('CENTRAL DE DASHBOARDS VIVA', { bold: true, size: 44, color: COR_LARANJA })],
  }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [t('Relatório de Cobertura e Análise de Entregas', { bold: true, size: 32 })],
  }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [t('Versão 2 — Contagem por Páginas e Entregas', { bold: true, size: 26, color: COR_ROXO })],
  }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 },
    children: [t('Consolidação das validações de líderes e sócios', { italics: true, size: 24, color: COR_CINZA })],
  }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER,
    children: [t(`Emitido em ${hoje}`, { size: 22, color: COR_CINZA })],
  }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 1: METODOLOGIA DE APURAÇÃO =======
  children.push(h('1. Metodologia de Apuração'));

  children.push(para([
    t('Este relatório adota uma ', { size: 22 }),
    t('metodologia de contagem por entregas', { bold: true, size: 22, color: COR_LARANJA }),
    t(', e não simplesmente por módulos cadastrados na plataforma. Essa abordagem foi adotada porque alguns módulos contêm múltiplas páginas com informações de alto valor gerencial que, se contadas como "1 módulo" apenas, subrepresentariam o volume real de entregas da Central.', { size: 22 }),
  ]));

  children.push(h('1.1 Regras de Contagem', HeadingLevel.HEADING_2, COR_CINZA));

  children.push(para([
    t('Definimos 3 regras para a contagem:', { bold: true, size: 22 }),
  ]));

  children.push(bullet([
    t('Regra 1 — Módulos com múltiplas páginas internas: ', { bold: true }),
    t('quando um módulo possui páginas distintas com navegação própria (ex: página de Metas, página de Funil, página de Indicadores), cada página é contada como 1 entrega. Isso se justifica porque cada página apresenta um conjunto autônomo de análises e informações estratégicas, muitas vezes consumido por públicos diferentes dentro da organização.'),
  ]));
  children.push(bullet([
    t('Regra 2 — Links externos com entregas múltiplas: ', { bold: true }),
    t('quando um link externo (Looker, planilha) abriga mais de uma visão/dashboard com finalidades distintas, contamos cada visão como 1 entrega. Exemplo: o módulo "NPS" contempla NPS Semestral e NPS Pós-Eventos — são duas análises independentes.'),
  ]));
  children.push(bullet([
    t('Regra 3 — Agrupamentos operacionais: ', { bold: true }),
    t('o grupo "Relatórios Recorrentes" contém múltiplos links de planilhas operacionais do dia a dia. Pela natureza operacional e repetitiva, o grupo inteiro conta como 1 entrega única, independente da quantidade de links.'),
  ]));

  children.push(h('1.2 Módulos com Contagem Diferenciada', HeadingLevel.HEADING_2, COR_CINZA));
  children.push(para(t('A tabela abaixo detalha cada módulo onde a contagem difere de "1 módulo = 1 entrega", com justificativa e o detalhamento das páginas/entregas computadas.')));

  const especiais = a.detalheEntregas.filter(d => d.contagemPonderada !== 1 || d.contagemNormal !== 1);
  children.push(makeTable(
    ['Módulo / Grupo', 'Contagem Padrão', 'Contagem Ponderada', 'Justificativa'],
    especiais.map(d => [
      d.nome,
      String(d.contagemNormal),
      String(d.contagemPonderada),
      d.motivo,
    ]),
    [28, 14, 14, 44],
  ));

  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Detalhe das páginas de cada módulo especial
  children.push(h('1.3 Detalhamento das Páginas por Módulo', HeadingLevel.HEADING_2, COR_CINZA));
  children.push(para(t('Para cada módulo com contagem diferenciada, listamos abaixo as páginas/entregas individuais:')));

  especiais.forEach(d => {
    if (d.paginas && d.paginas.length > 0) {
      children.push(para([t(`${d.nome}`, { bold: true, color: COR_AZUL }), t(` — ${d.contagemPonderada} entregas:`)]));
      d.paginas.forEach((pg, i) => {
        children.push(bullet(`${i + 1}. ${pg}`, 1));
      });
      children.push(new Paragraph({ spacing: { after: 80 } }));
    }
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 2: SUMÁRIO EXECUTIVO =======
  children.push(h('2. Sumário Executivo'));

  children.push(para([
    t('A Central de Dashboards VIVA conta com '),
    t(`${a.total} módulos`, { bold: true }),
    t(' cadastrados na base, que representam '),
    t(`${a.totalEntregas} entregas`, { bold: true, color: COR_LARANJA }),
    t(' quando contabilizadas pelo critério de páginas/visões distintas (metodologia descrita na Seção 1).'),
  ]));

  children.push(h('2.1 Indicadores-Chave', HeadingLevel.HEADING_2, COR_CINZA));

  children.push(makeTable(
    ['Indicador', 'Módulos', 'Entregas (ponderado)'],
    [
      ['Total cadastrado na plataforma', String(a.total), String(a.totalEntregas)],
      ['Módulos ativos', String(a.ativos.length), '—'],
      ['Em fase Beta', String(a.beta.length), '—'],
      ['Dashboards internos (desenvolvidos na Central)', String(a.internos.length), '—'],
      ['Links externos (Looker, planilhas, terceiros)', String(a.externos.length), '—'],
    ],
    [50, 25, 25],
  ));

  children.push(h('2.2 Comparativo: Contagem Simples vs Ponderada', HeadingLevel.HEADING_2, COR_CINZA));
  children.push(para(t('O quadro abaixo evidencia a diferença entre contar módulos (1 módulo = 1) e contar entregas (páginas/visões distintas):')));

  children.push(makeTable(
    ['Métrica', 'Contagem Simples (módulos)', 'Contagem Ponderada (entregas)', 'Diferença'],
    [
      ['Total geral', String(a.total), String(a.totalEntregas), `+${a.totalEntregas - a.total}`],
    ],
    [30, 25, 25, 20],
  ));

  children.push(h('2.3 Cobertura por Perfil de Usuário', HeadingLevel.HEADING_2, COR_CINZA));

  children.push(para([
    t('Metodologia de apuração: ', { bold: true }),
    t('O escopo-alvo para Franqueadora é definido pelos módulos liberados ao usuário '),
    t('franqueadora.central', { bold: true }),
    t('. O que já está disponível é o que foi liberado ao usuário '),
    t('THOMAS', { bold: true }),
    t(' ou disponibilizado a "Todos" do nível (sem restrição de usuário). Para Franquias, o escopo-alvo é definido pelos módulos liberados a '),
    t('franquias.central', { bold: true }),
    t(', sendo que atualmente apenas o módulo '),
    t('PEX', { bold: true }),
    t(' está efetivamente em uso pelas unidades.'),
  ]));

  children.push(makeTable(
    ['Perfil', 'Alvo (módulos)', 'Alvo (entregas)', 'Entregue (entregas)', 'Gap (entregas)', '% Cobertura'],
    [
      [
        'Franqueadora',
        String(a.alvoFr.length),
        String(a.alvoFrEntregas),
        String(a.entregueFrEntregas),
        String(a.gapFrEntregas),
        pct(a.entregueFrEntregas, a.alvoFrEntregas),
      ],
      [
        'Franquia',
        String(a.alvoFq.length),
        String(a.alvoFqEntregas),
        String(a.entregueFqEntregas),
        String(a.gapFqEntregas),
        pct(a.entregueFqEntregas, a.alvoFqEntregas),
      ],
    ],
    [15, 13, 14, 16, 14, 14],
  ));

  children.push(h('2.4 Cobertura Total Consolidada (Franqueadora + Franquia)', HeadingLevel.HEADING_2, COR_LARANJA));

  children.push(para([
    t('Além da análise separada por perfil, é fundamental observar a ', { size: 22 }),
    t('cobertura total da plataforma', { bold: true, size: 22, color: COR_LARANJA }),
    t('. Essa visão consolida todos os módulos que estão planejados para pelo menos um dos perfis (Franqueadora ou Franquia), eliminando duplicatas, e mostra o quanto já foi efetivamente entregue considerando a Central como um todo.', { size: 22 }),
  ]));

  children.push(makeTable(
    ['Métrica', 'Módulos', 'Entregas (ponderado)', '% do Total'],
    [
      [
        'Escopo total planejado (Franqueadora + Franquia)',
        String(a.alvoTotalMods.length),
        String(a.alvoTotalEntregas),
        '100%',
      ],
      [
        'Total entregue (disponível hoje)',
        String(a.entregueTotalMods.length),
        String(a.entregueTotalEntregas),
        pct(a.entregueTotalEntregas, a.alvoTotalEntregas),
      ],
      [
        'Gap total (pendente de liberação)',
        String(a.gapTotalMods.length),
        String(a.gapTotalEntregas),
        pct(a.gapTotalEntregas, a.alvoTotalEntregas),
      ],
    ],
    [45, 15, 22, 18],
  ));

  children.push(new Paragraph({ spacing: { before: 200 } }));
  children.push(para([
    t('Visão consolidada: ', { bold: true, color: COR_LARANJA, size: 24 }),
    t(`Dos ${a.alvoTotalEntregas} entregas planejadas para a Central como um todo, `, { size: 22 }),
    t(`${a.entregueTotalEntregas} (${pct(a.entregueTotalEntregas, a.alvoTotalEntregas)})`, { bold: true, color: COR_VERDE, size: 22 }),
    t(` já estão efetivamente disponíveis. Restam `, { size: 22 }),
    t(`${a.gapTotalEntregas} entregas (${pct(a.gapTotalEntregas, a.alvoTotalEntregas)})`, { bold: true, color: COR_VERMELHO, size: 22 }),
    t(` a serem liberadas.`, { size: 22 }),
  ]));

  children.push(new Paragraph({ spacing: { before: 120 } }));
  children.push(para([
    t('Detalhamento por perfil: ', { bold: true }),
    t(`Franqueadora: ${pct(a.entregueFrEntregas, a.alvoFrEntregas)} de cobertura (${a.entregueFrEntregas} de ${a.alvoFrEntregas} entregas). Franquia: ${pct(a.entregueFqEntregas, a.alvoFqEntregas)} de cobertura (${a.entregueFqEntregas} de ${a.alvoFqEntregas} entregas).`),
  ]));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 3: INVENTÁRIO COMPLETO =======
  children.push(h('3. Inventário Completo de Módulos'));
  children.push(para(t('Relação integral dos módulos cadastrados, agrupados por área funcional. A coluna "Entregas" reflete a contagem ponderada de acordo com a metodologia da Seção 1.')));

  const grupos = Object.keys(a.porGrupo).sort();
  grupos.forEach(g => {
    const lista = a.porGrupo[g].slice().sort((x, y) => x.ordem - y.ordem);
    const isRelRec = g === GRUPO_UNICO;
    const entregasGrupo = isRelRec ? 1 : lista.reduce((sum, m) => {
      const esp = CONTAGEM_ESPECIAL[m.id];
      return sum + (esp ? esp.count : 1);
    }, 0);

    children.push(h(`${g} — ${lista.length} módulos, ${entregasGrupo} entrega${entregasGrupo > 1 ? 's' : ''}`, HeadingLevel.HEADING_3, COR_AZUL));

    if (isRelRec) {
      children.push(para([t('⚠ Grupo contado como 1 entrega única (Regra 3 da metodologia).', { italics: true, color: COR_CINZA })]));
    }

    children.push(makeTable(
      ['#', 'Módulo', 'Tipo', 'Nível', 'Status', 'Entregas'],
      lista.map((m, i) => {
        const esp = CONTAGEM_ESPECIAL[m.id];
        const entregas = isRelRec ? (i === 0 ? '1 (grupo)' : '—') : (esp ? String(esp.count) : '1');
        return [
          String(i + 1),
          m.nome + (m.subgrupo ? ` [${m.subgrupo}]` : '') + (m.beta ? '  [BETA]' : ''),
          m.tipo === 'externo' ? 'Link Externo' : 'Interno',
          m.nvl === 0 ? 'Rede' : m.nvl === 2 ? 'Franquia' : 'Franqueadora',
          m.ativo ? 'Ativo' : 'Inativo',
          entregas,
        ];
      }),
      [5, 40, 13, 14, 10, 10],
    ));
    children.push(new Paragraph({ spacing: { after: 120 } }));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 4: COBERTURA FRANQUEADORA =======
  children.push(h('4. Análise de Cobertura — Visão Franqueadora'));
  children.push(para([
    t('Total planejado: ', { bold: true }),
    t(`${a.alvoFrEntregas} entregas (${a.alvoFr.length} módulos)`),
    t('   |   Entregue: ', { bold: true }),
    t(`${a.entregueFrEntregas} entregas (${pct(a.entregueFrEntregas, a.alvoFrEntregas)})`, { color: COR_VERDE, bold: true }),
    t('   |   Gap: ', { bold: true }),
    t(`${a.gapFrEntregas} entregas pendentes`, { color: COR_VERMELHO, bold: true }),
  ]));

  children.push(h('4.1 Módulos já disponíveis para toda a Franqueadora', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(para(t('Módulos liberados ao usuário THOMAS ou disponíveis a "Todos" do nível (sem restrição de usuário).')));

  if (a.entregueFr.length > 0) {
    children.push(makeTable(
      ['Módulo', 'Grupo', 'Tipo', 'Entregas'],
      a.entregueFr.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => {
        const esp = CONTAGEM_ESPECIAL[m.id];
        return [
          m.nome, m.grupo,
          m.tipo === 'externo' ? 'Externo' : 'Interno',
          String(esp ? esp.count : 1),
        ];
      }),
      [40, 30, 15, 15],
    ));
  }

  children.push(h('4.2 Módulos planejados mas ainda NÃO liberados para toda a Franqueadora', HeadingLevel.HEADING_2, COR_VERMELHO));
  children.push(para([
    t('Estes módulos já existem na plataforma e estão liberados para franqueadora.central, mas ainda não foram disponibilizados ao perfil geral (THOMAS / todos).', { italics: true, color: COR_CINZA }),
  ]));

  if (a.gapFr.length > 0) {
    children.push(makeTable(
      ['Módulo', 'Grupo', 'Tipo', 'Entregas', 'Quem já tem acesso'],
      a.gapFr.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => {
        const esp = CONTAGEM_ESPECIAL[m.id];
        return [
          m.nome, m.grupo,
          m.tipo === 'externo' ? 'Externo' : 'Interno',
          String(esp ? esp.count : 1),
          m.users.filter(u => u.toLowerCase() !== 'franqueadora.central').slice(0, 4).join(', ') + (m.users.length > 5 ? '…' : ''),
        ];
      }),
      [30, 22, 10, 10, 28],
    ));
  } else {
    children.push(para(t('Sem gaps — toda a franqueadora já tem acesso integral.', { color: COR_VERDE, bold: true })));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 5: COBERTURA FRANQUIA =======
  children.push(h('5. Análise de Cobertura — Visão Franquia'));
  children.push(para([
    t('Total planejado: ', { bold: true }),
    t(`${a.alvoFqEntregas} entregas (${a.alvoFq.length} módulos)`),
    t('   |   Entregue hoje: ', { bold: true }),
    t(`${a.entregueFqEntregas} entregas (${pct(a.entregueFqEntregas, a.alvoFqEntregas)})`, { color: COR_VERDE, bold: true }),
    t('   |   Gap: ', { bold: true }),
    t(`${a.gapFqEntregas} entregas pendentes`, { color: COR_VERMELHO, bold: true }),
  ]));

  children.push(para([
    t('Situação atual: ', { bold: true }),
    t(`Embora ${a.alvoFq.length} módulos (${a.alvoFqEntregas} entregas) já estejam mapeados e configurados com acesso a franquias.central, apenas o módulo `),
    t('Programa de Excelência (PEX)', { bold: true }),
    t(' está de fato em uso pelas unidades franqueadas. Os demais estão cadastrados mas não efetivamente acessíveis/divulgados à rede.'),
  ]));

  children.push(h('5.1 Escopo planejado para a Franquia', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(makeTable(
    ['Módulo', 'Grupo', 'Tipo', 'Entregas', 'Status'],
    a.alvoFq.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => {
      const esp = CONTAGEM_ESPECIAL[m.id];
      return [
        m.nome, m.grupo,
        m.tipo === 'externo' ? 'Externo' : 'Interno',
        String(esp ? esp.count : 1),
        m.id === 'pex' ? '✅ ENTREGUE' : '⏳ Pendente',
      ];
    }),
    [35, 25, 12, 12, 16],
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 6: SUGESTÕES DOS LÍDERES =======
  children.push(h('6. Consolidação das Sugestões dos Líderes e Sócios'));
  children.push(para(t('Abaixo, a consolidação integral dos pontos levantados durante a validação da Central. Cada item foi classificado quanto ao status e à prioridade sugerida.')));

  const sugestoes = [
    { autor: 'Everdan', item: 'Migrar frames do Miro sobre estrutura organizacional das franquias para a Central', status: 'Gap', prior: 'Média', grupo: 'Gestão Rede' },
    { autor: 'Everdan', item: 'Incluir DRE do Fundo de Marketing na Central', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira' },
    { autor: 'Renato Menezes', item: 'Relatórios de rentabilidade por franquia (margem, royalties, rendimento)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira / Rede' },
    { autor: 'Regis', item: 'Incluir Portal da Liderança no menu da Franqueadora (centralizar após atualização)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Franqueadora' },
    { autor: 'Regis', item: 'Criar agrupamento "Gestão de Colaboradores" na visão Rede (Lançando Foguetes, Mestres da Jornada, Viva Academy)', status: 'Parcial — reorganização', prior: 'Alta', grupo: 'Gente & Gestão' },
    { autor: 'Ronaldo Pires', item: 'Favoritos exibidos em ordem aleatória — aplicar ordenação alfabética', status: 'Bug UX', prior: 'Alta (Quick Win)', grupo: 'Central / Sidebar' },
    { autor: 'Ronaldo Pires', item: 'Desativar ícones antigos do SULTS e substituir por ícone único da CENTRAL', status: 'Decisão produto', prior: 'Média', grupo: 'Integração SULTS' },
    { autor: 'Thomas', item: 'Incluir no menu da franqueadora os links de puxadas de Vendas e Pós-Vendas', status: 'Gap', prior: 'Alta', grupo: 'Vendas / Pós-Vendas' },
    { autor: 'Thomas', item: 'Dash da Carteira validado — melhorias adicionais em 2ª fase', status: 'Concluído (fase 2)', prior: 'Baixa', grupo: 'Gestão Carteira' },
    { autor: 'Bruna Beltante', item: 'KPIs do CSC com desdobramento por franquia (churn, endividamento individualizados)', status: 'Gap', prior: 'Alta', grupo: 'KPIs Times / Carteira' },
    { autor: 'Bruna Beltante', item: 'Atualizar Sequoia Atendimento 3.0 com métricas operacionais (tempo 1º contato, resolução, interações, CSAT)', status: 'Gap', prior: 'Alta', grupo: 'Atendimento' },
    { autor: 'Bruna Beltante', item: 'Incluir controle de chargebacks Cielo e Zoop em Gestão Financeira', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira' },
    { autor: 'Bruna Beltante', item: 'Incluir CHURN no Dash de Clientes (hoje só há Desligamento; churn existe apenas no PEX)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Carteira' },
    { autor: 'Bruna Beltante', item: 'Criar agrupamento "Gestão Pós-Vendas" (realocar Mestres da Jornada, puxadas, Pipefy, histórico)', status: 'Gap estrutural', prior: 'Alta', grupo: 'Pós-Vendas' },
    { autor: 'Bruna Beltante', item: 'Criar Dashboard Huggy (tempo de resposta, CSAT por franquia, histórico de conversas)', status: 'Gap', prior: 'Média-Alta', grupo: 'Pós-Vendas / Atendimento' },
    { autor: 'Bruna Beltante', item: 'Definir política para "Relatórios Recorrentes" — há ~40 links adicionais que podem inflar o menu', status: 'Decisão produto', prior: 'Média', grupo: 'Relatórios Recorrentes' },
  ];

  children.push(makeTable(
    ['Autor', 'Sugestão / Ponto', 'Área', 'Status', 'Prioridade'],
    sugestoes.map(s => [s.autor, s.item, s.grupo, s.status, s.prior]),
    [13, 40, 17, 18, 12],
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ======= SEÇÃO 7: ROADMAP =======
  children.push(h('7. Roadmap Sugerido'));

  children.push(h('Sprint 1 — Quick Wins e Reorganização', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(bullet('Ordenação alfabética dos Favoritos.'));
  children.push(bullet('Reorganização do menu (criação de Gestão Pós-Vendas e Gestão de Colaboradores).'));
  children.push(bullet('Inclusão de Portal da Liderança e puxadas de Vendas/Pós-Vendas como links externos.'));
  children.push(bullet('Liberação de acessos já prontos à franqueadora em geral.'));

  children.push(h('Sprint 2 — Entregas de Alto Valor', HeadingLevel.HEADING_2, COR_AZUL));
  children.push(bullet('CHURN no Dash de Clientes.'));
  children.push(bullet('KPIs CSC desdobrados por franquia.'));
  children.push(bullet('Controle de chargebacks.'));
  children.push(bullet('DRE Fundo de Marketing.'));

  children.push(h('Sprint 3 — Rentabilidade e Atendimento', HeadingLevel.HEADING_2, COR_LARANJA));
  children.push(bullet('Relatório de rentabilidade por franquia.'));
  children.push(bullet('Sequoia Atendimento 3.0 reestruturado.'));

  children.push(h('Sprint 4+ — Rollout Franquias e Huggy', HeadingLevel.HEADING_2, COR_VERMELHO));
  children.push(bullet(`Plano de rollout para a rede — ativar gradualmente os ${a.gapFqEntregas} entregas já mapeadas para franquias.`));
  children.push(bullet('Dashboard Huggy completo.'));
  children.push(bullet('Migração da estrutura Miro.'));

  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(para([t('— Fim do Relatório —', { italics: true, color: COR_CINZA })], AlignmentType.CENTER));

  return new Document({
    creator: 'Central de Dashboards VIVA',
    title: 'Relatório de Cobertura V2 — Central de Dashboards VIVA',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections: [{ children }],
  });
}

// ---------- MAIN ----------
(async () => {
  const mods = await readSheet();
  const a = analyze(mods);
  const doc = buildDoc(mods, a);
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(process.env.USERPROFILE || __dirname, 'Desktop', `Relatorio_Central_V2_${new Date().toISOString().slice(0,10)}.docx`);
  fs.writeFileSync(outPath, buffer);
  console.log('OK — Arquivo gerado:', outPath);
  console.log('');
  console.log('=== RESUMO V2 ===');
  console.log(`Total módulos: ${a.total} | Total ENTREGAS (ponderado): ${a.totalEntregas}`);
  console.log(`Ativos: ${a.ativos.length} | Beta: ${a.beta.length}`);
  console.log(`Internos: ${a.internos.length} | Externos: ${a.externos.length}`);
  console.log(`Franqueadora -> Alvo: ${a.alvoFr.length} mods (${a.alvoFrEntregas} entregas) | Entregue: ${a.entregueFrEntregas} entregas (${pct(a.entregueFrEntregas, a.alvoFrEntregas)}) | Gap: ${a.gapFrEntregas}`);
  console.log(`Franquia -> Alvo: ${a.alvoFq.length} mods (${a.alvoFqEntregas} entregas) | Entregue: ${a.entregueFqEntregas} entregas (${pct(a.entregueFqEntregas, a.alvoFqEntregas)}) | Gap: ${a.gapFqEntregas}`);
  console.log(`TOTAL CONSOLIDADO -> Alvo: ${a.alvoTotalMods.length} mods (${a.alvoTotalEntregas} entregas) | Entregue: ${a.entregueTotalEntregas} (${pct(a.entregueTotalEntregas, a.alvoTotalEntregas)}) | Gap: ${a.gapTotalEntregas}`);
  console.log('');
  console.log('Módulos com contagem diferenciada:');
  a.detalheEntregas.filter(d => d.contagemPonderada !== 1).forEach(d => {
    console.log(`  ${d.nome}: ${d.contagemNormal} -> ${d.contagemPonderada} entregas`);
  });
})().catch(e => { console.error(e); process.exit(1); });
