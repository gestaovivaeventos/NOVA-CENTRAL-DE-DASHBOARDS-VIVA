/* eslint-disable */
/**
 * Gera relatório Word (.docx) de análise de cobertura dos módulos da Central.
 * Lê direto da planilha BASE MODULOS e consolida:
 *  - Inventário total
 *  - % interno vs externo, ativo, beta
 *  - Cobertura Franqueadora: alvo (users contém franqueadora.central) vs entregue (THOMAS ou users vazio)
 *  - Cobertura Franquia: alvo (users contém franquias.central) vs entregue (apenas PEX)
 *  - Gaps por módulo
 *  - Consolidação das sugestões dos líderes
 *  - Roadmap
 */
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, PageBreak,
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
  const header = rows[0];
  const data = rows.slice(1).map(r => ({
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
  return data;
}

// ---------- ANALYSIS ----------
function analyze(mods) {
  const total = mods.length;
  const ativos = mods.filter(m => m.ativo);
  const beta = mods.filter(m => m.beta);
  const internos = mods.filter(m => m.tipo === 'interno');
  const externos = mods.filter(m => m.tipo === 'externo');

  const hasUser = (m, u) => m.users.some(x => x.toLowerCase() === u.toLowerCase());

  // FRANQUEADORA
  // Alvo = módulos que DEVERIAM estar (têm franqueadora.central nos users)
  const alvoFr = mods.filter(m => hasUser(m, 'franqueadora.central'));
  // Entregue = tem THOMAS OU users vazio (todos do nivel) — aplicável a nivel 1
  const entregueFr = alvoFr.filter(m => hasUser(m, 'THOMAS') || hasUser(m, 'thomas') || m.users.length === 0);
  const gapFr = alvoFr.filter(m => !entregueFr.includes(m));

  // FRANQUIA
  const alvoFq = mods.filter(m => hasUser(m, 'franquias.central'));
  // Entregue = apenas PEX (segundo definido pelo usuário)
  const entregueFq = mods.filter(m => m.id === 'pex');
  const gapFq = alvoFq.filter(m => !entregueFq.includes(m));

  // Grupos
  const porGrupo = {};
  mods.forEach(m => {
    porGrupo[m.grupo] = porGrupo[m.grupo] || [];
    porGrupo[m.grupo].push(m);
  });

  return {
    total, ativos, beta, internos, externos,
    alvoFr, entregueFr, gapFr,
    alvoFq, entregueFq, gapFq,
    porGrupo,
  };
}

// ---------- DOCX HELPERS ----------
const COR_LARANJA = 'FF6600';
const COR_CINZA = '6C757D';
const COR_VERDE = '16A34A';
const COR_VERMELHO = 'DC2626';
const COR_AZUL = '2563EB';

const t = (text, opts = {}) => new TextRun({ text: String(text ?? ''), ...opts });

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

const bullet = (text) => new Paragraph({
  bullet: { level: 0 },
  children: [t(text)],
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

const table = (headers, rows, widths) => new Table({
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

  // CAPA
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 400 },
    children: [new TextRun({ text: 'CENTRAL DE DASHBOARDS VIVA', bold: true, size: 44, color: COR_LARANJA })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'Relatório de Cobertura e Análise de Gaps', bold: true, size: 32 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 1600 },
    children: [new TextRun({ text: 'Consolidação das validações de líderes e sócios', italics: true, size: 24, color: COR_CINZA })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `Emitido em ${hoje}`, size: 22, color: COR_CINZA })],
  }));
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 1. SUMÁRIO EXECUTIVO
  children.push(h('1. Sumário Executivo'));

  children.push(para([
    t('A Central de Dashboards VIVA conta atualmente com '),
    t(`${a.total} módulos`, { bold: true, color: COR_LARANJA }),
    t(' configurados na base, distribuídos em grupos funcionais que cobrem Gestão Franqueadora, Gestão Financeira, Vendas, Gestão da Carteira de Clientes, Gestão da Rede de Franquias, Gente & Gestão, Ferramentas & Apoio, Relatórios Recorrentes e Desenvolvedor.'),
  ]));

  children.push(h('1.1 Indicadores-Chave', HeadingLevel.HEADING_2, COR_CINZA));

  children.push(table(
    ['Indicador', 'Valor', '%'],
    [
      ['Total de módulos', String(a.total), '100%'],
      ['Módulos ativos', String(a.ativos.length), pct(a.ativos.length, a.total)],
      ['Módulos em beta', String(a.beta.length), pct(a.beta.length, a.total)],
      ['Internos (desenvolvidos na plataforma)', String(a.internos.length), pct(a.internos.length, a.total)],
      ['Links externos (Looker, planilhas, etc.)', String(a.externos.length), pct(a.externos.length, a.total)],
    ],
    [50, 25, 25],
  ));

  children.push(h('1.2 Cobertura por Perfil de Usuário', HeadingLevel.HEADING_2, COR_CINZA));

  children.push(para([
    t('Metodologia: ', { bold: true }),
    t('O escopo-alvo para cada perfil é definido pelos módulos liberados para os usuários '),
    t('franqueadora.central', { bold: true }),
    t(' e '),
    t('franquias.central', { bold: true }),
    t('. A cobertura atual (entregue) considera: para Franqueadora, módulos liberados ao usuário THOMAS ou disponíveis a todos do nível; para Franquia, apenas o módulo PEX já está efetivamente em uso pelas unidades.'),
  ]));

  children.push(table(
    ['Perfil', 'Alvo (planejado)', 'Entregue (disponível hoje)', 'Gap', '% Cobertura'],
    [
      ['Franqueadora', String(a.alvoFr.length), String(a.entregueFr.length), String(a.gapFr.length), pct(a.entregueFr.length, a.alvoFr.length)],
      ['Franquia', String(a.alvoFq.length), String(a.entregueFq.length), String(a.gapFq.length), pct(a.entregueFq.length, a.alvoFq.length)],
    ],
    [22, 20, 25, 13, 20],
  ));

  children.push(new Paragraph({ spacing: { before: 200 } }));
  children.push(para([
    t('Leitura: ', { bold: true }),
    t(`a visão Franqueadora apresenta cobertura de ${pct(a.entregueFr.length, a.alvoFr.length)} do escopo planejado — restam ${a.gapFr.length} módulos a liberar. A visão Franquia encontra-se em estágio inicial (${pct(a.entregueFq.length, a.alvoFq.length)}), com ${a.gapFq.length} módulos mapeados porém ainda não liberados para a rede.`, { bold: true }),
  ]));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 2. INVENTÁRIO COMPLETO
  children.push(h('2. Inventário Completo de Módulos'));
  children.push(para(t('Relação integral dos módulos cadastrados, agrupados por área funcional. A coluna "Tipo" distingue dashboards internos (desenvolvidos nativamente na Central) de links externos (Looker Studio, planilhas compartilhadas, sistemas de terceiros).')));

  const grupos = Object.keys(a.porGrupo).sort();
  grupos.forEach(g => {
    const lista = a.porGrupo[g].slice().sort((x, y) => x.ordem - y.ordem);
    children.push(h(`${g} (${lista.length})`, HeadingLevel.HEADING_3, COR_AZUL));
    children.push(table(
      ['#', 'Módulo', 'Tipo', 'Nível', 'Status'],
      lista.map((m, i) => [
        String(i + 1),
        m.nome + (m.subgrupo ? ` — ${m.subgrupo}` : '') + (m.beta ? '  [BETA]' : ''),
        m.tipo === 'externo' ? 'Link Externo' : 'Interno',
        m.nvl === 0 ? 'Rede' : m.nvl === 2 ? 'Franquia' : 'Franqueadora',
        m.ativo ? 'Ativo' : 'Inativo',
      ]),
      [6, 50, 15, 15, 14],
    ));
    children.push(new Paragraph({ spacing: { after: 120 } }));
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 3. COBERTURA FRANQUEADORA
  children.push(h('3. Análise de Cobertura — Visão Franqueadora'));
  children.push(para([
    t('Total planejado: ', { bold: true }), t(`${a.alvoFr.length} módulos`),
    t('   |   Entregue: ', { bold: true }), t(`${a.entregueFr.length} (${pct(a.entregueFr.length, a.alvoFr.length)})`, { color: COR_VERDE, bold: true }),
    t('   |   Gap: ', { bold: true }), t(`${a.gapFr.length} módulos pendentes`, { color: COR_VERMELHO, bold: true }),
  ]));

  children.push(h('3.1 Módulos já disponíveis para toda a Franqueadora', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(table(
    ['Módulo', 'Grupo', 'Tipo'],
    a.entregueFr.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => [
      m.nome, m.grupo, m.tipo === 'externo' ? 'Externo' : 'Interno',
    ]),
    [50, 35, 15],
  ));

  children.push(h('3.2 Módulos PLANEJADOS mas AINDA NÃO liberados para toda a Franqueadora', HeadingLevel.HEADING_2, COR_VERMELHO));
  children.push(para([
    t('Estes módulos estão no escopo da visão Franqueadora (liberados para franqueadora.central) mas ainda dependem de liberação ao usuário THOMAS / usuários gerais para serem considerados entregues.', { italics: true, color: COR_CINZA }),
  ]));
  if (a.gapFr.length > 0) {
    children.push(table(
      ['Módulo', 'Grupo', 'Tipo', 'Usuários que já têm acesso'],
      a.gapFr.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => [
        m.nome, m.grupo, m.tipo === 'externo' ? 'Externo' : 'Interno',
        m.users.filter(u => u !== 'franqueadora.central').slice(0, 5).join(', ') + (m.users.length > 5 ? '…' : ''),
      ]),
      [38, 25, 12, 25],
    ));
  } else {
    children.push(para(t('Sem gaps — toda a franqueadora já tem acesso integral.', { color: COR_VERDE, bold: true })));
  }

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 4. COBERTURA FRANQUIA
  children.push(h('4. Análise de Cobertura — Visão Franquia'));
  children.push(para([
    t('Total planejado: ', { bold: true }), t(`${a.alvoFq.length} módulos`),
    t('   |   Entregue hoje: ', { bold: true }), t(`${a.entregueFq.length} (${pct(a.entregueFq.length, a.alvoFq.length)})`, { color: COR_VERDE, bold: true }),
    t('   |   Gap: ', { bold: true }), t(`${a.gapFq.length} módulos pendentes`, { color: COR_VERMELHO, bold: true }),
  ]));

  children.push(para([
    t('Situação atual: ', { bold: true }),
    t('Apesar de '), t(`${a.alvoFq.length} módulos`, { bold: true }), t(' já estarem mapeados e configurados com acesso a franquias.central, apenas o módulo '), t('Programa de Excelência (PEX)', { bold: true }),
    t(' está de fato em uso pelas unidades franqueadas hoje. Os demais estão cadastrados mas não efetivamente acessíveis/divulgados à rede.'),
  ]));

  children.push(h('4.1 Escopo planejado para a Franquia', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(table(
    ['Módulo', 'Grupo', 'Tipo', 'Status de liberação'],
    a.alvoFq.slice().sort((x, y) => x.grupo.localeCompare(y.grupo)).map(m => [
      m.nome, m.grupo, m.tipo === 'externo' ? 'Externo' : 'Interno',
      m.id === 'pex' ? 'ENTREGUE' : 'Pendente',
    ]),
    [40, 28, 12, 20],
  ));

  children.push(h('4.2 Gap — Módulos a liberar para as Franquias', HeadingLevel.HEADING_2, COR_VERMELHO));
  children.push(para(t(`${a.gapFq.length} módulos cadastrados com acesso planejado a franquias.central ainda não foram efetivamente disponibilizados à rede de unidades. Recomenda-se plano de rollout gradual com comunicação estruturada.`, { italics: true, color: COR_CINZA })));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 5. SUGESTÕES DOS LÍDERES
  children.push(h('5. Consolidação das Sugestões dos Líderes e Sócios'));
  children.push(para(t('Abaixo, a consolidação integral dos pontos levantados pelos líderes e sócios durante a validação da Central. Cada item foi classificado quanto ao status (já existe, em desenvolvimento, gap confirmado, fora do escopo) e à prioridade sugerida.')));

  const sugestoes = [
    // Everdan
    { autor: 'Everdan', item: 'Migrar frames do Miro sobre estrutura organizacional das franquias para a Central', status: 'Gap', prior: 'Média', grupo: 'Gestão Rede' },
    { autor: 'Everdan', item: 'Incluir DRE do Fundo de Marketing na Central', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira' },
    // Renato Menezes
    { autor: 'Renato Menezes', item: 'Relatórios de rentabilidade por franquia (margem, royalties, rendimento)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira / Rede' },
    // Regis
    { autor: 'Regis', item: 'Incluir Portal da Liderança no menu da Franqueadora (centralizar após atualização)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Franqueadora' },
    { autor: 'Regis', item: 'Criar agrupamento "Gestão de Colaboradores" na visão Rede (Lançando Foguetes, Mestres da Jornada, Viva Academy)', status: 'Parcial — reorganização de grupo', prior: 'Alta', grupo: 'Gente & Gestão' },
    // Ronaldo Pires
    { autor: 'Ronaldo Pires', item: 'Favoritos exibidos em ordem aleatória — aplicar ordenação alfabética', status: 'Bug UX', prior: 'Alta (Quick Win)', grupo: 'Central / Sidebar' },
    { autor: 'Ronaldo Pires', item: 'Desativar ícones antigos do SULTS e substituir por um único ícone único da CENTRAL', status: 'Decisão produto', prior: 'Média', grupo: 'Integração SULTS' },
    // Thomas
    { autor: 'Thomas', item: 'Incluir no menu da franqueadora os links de puxadas de Vendas e Pós-Vendas', status: 'Gap', prior: 'Alta', grupo: 'Vendas / Pós-Vendas' },
    { autor: 'Thomas', item: 'Dash da Carteira validado — melhorias adicionais em 2ª fase', status: 'Concluído (com roadmap)', prior: 'Baixa (fase 2)', grupo: 'Gestão Carteira' },
    // Bruna Beltante
    { autor: 'Bruna Beltante', item: 'KPIs do CSC com desdobramento por franquia (churn, endividamento individualizados)', status: 'Gap', prior: 'Alta', grupo: 'KPIs Times / Carteira' },
    { autor: 'Bruna Beltante', item: 'Atualizar Sequoia Atendimento 3.0 com métricas operacionais (tempo 1º contato, resolução, interações, CSAT)', status: 'Gap', prior: 'Alta', grupo: 'Atendimento' },
    { autor: 'Bruna Beltante', item: 'Incluir controle de chargebacks Cielo e Zoop em Gestão Financeira', status: 'Gap', prior: 'Alta', grupo: 'Gestão Financeira' },
    { autor: 'Bruna Beltante', item: 'Incluir CHURN no Dash de Clientes (hoje só há Desligamento; churn existe apenas no PEX)', status: 'Gap', prior: 'Alta', grupo: 'Gestão Carteira' },
    { autor: 'Bruna Beltante', item: 'Criar agrupamento "Gestão Pós-Vendas" (realocar Mestres da Jornada, incluir puxadas, Pipefy, histórico de conversas)', status: 'Gap estrutural', prior: 'Alta', grupo: 'Pós-Vendas' },
    { autor: 'Bruna Beltante', item: 'Criar Dashboard Huggy (tempo de resposta, CSAT por franquia, histórico de conversas dos alunos)', status: 'Gap', prior: 'Média-Alta', grupo: 'Pós-Vendas / Atendimento' },
    { autor: 'Bruna Beltante', item: 'Definir política para "Relatórios Recorrentes" — há ~40 links adicionais que podem inflar o menu', status: 'Decisão produto', prior: 'Média', grupo: 'Relatórios Recorrentes' },
  ];

  children.push(table(
    ['Autor', 'Sugestão / Ponto', 'Área', 'Status', 'Prioridade'],
    sugestoes.map(s => [s.autor, s.item, s.grupo, s.status, s.prior]),
    [13, 40, 17, 18, 12],
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 6. MATRIZ DE PRIORIZAÇÃO
  children.push(h('6. Matriz de Priorização'));
  children.push(para(t('Classificação dos gaps identificados segundo esforço estimado x impacto, para orientar sequência de entregas.')));

  children.push(h('6.1 Quick Wins (baixo esforço, alto impacto)', HeadingLevel.HEADING_2, COR_VERDE));
  children.push(bullet('Favoritos em ordem alfabética (ajuste de UX na Sidebar).'));
  children.push(bullet('Liberação ao perfil "Todos/THOMAS" dos módulos já prontos que hoje só têm franqueadora.central como usuário teste.'));
  children.push(bullet('Reorganização de menus: criar grupo "Gestão Pós-Vendas" e mover Mestres da Jornada; criar agrupamento "Gestão de Colaboradores" na visão Rede.'));
  children.push(bullet('Incluir links de puxadas de Vendas e Pós-Vendas no menu Franqueadora.'));
  children.push(bullet('Inclusão do Portal da Liderança como link externo no menu.'));

  children.push(h('6.2 Entregas Estruturantes (médio esforço, alto impacto)', HeadingLevel.HEADING_2, COR_AZUL));
  children.push(bullet('CHURN integrado ao Dash de Clientes (hoje fragmentado entre PEX e Desligamento).'));
  children.push(bullet('KPIs CSC desdobrados por franquia.'));
  children.push(bullet('DRE Fundo de Marketing.'));
  children.push(bullet('Controle de chargebacks Cielo/Zoop.'));
  children.push(bullet('Relatórios de rentabilidade por franquia (margem, royalties, rendimento).'));
  children.push(bullet('Atualização estrutural do Sequoia Atendimento 3.0.'));

  children.push(h('6.3 Projetos de Longo Prazo (alto esforço, alto impacto)', HeadingLevel.HEADING_2, COR_LARANJA));
  children.push(bullet('Dashboard Huggy completo (tempo de resposta, CSAT por franquia, histórico de conversas).'));
  children.push(bullet('Rollout efetivo dos módulos para a rede de Franquias — hoje apenas PEX está em uso, existem ' + a.gapFq.length + ' módulos cadastrados mas não divulgados.'));
  children.push(bullet('Migração da estrutura organizacional do Miro para a Central.'));

  children.push(h('6.4 Decisões de Produto Pendentes', HeadingLevel.HEADING_2, COR_CINZA));
  children.push(bullet('Relatórios Recorrentes: definir se todos os ~40 links operacionais diários entram no menu, ou permanecem em planilha de controle paralela.'));
  children.push(bullet('Política de descontinuação dos ícones SULTS (substituição por ícone único da Central).'));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // 7. ROADMAP SUGERIDO
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
  children.push(bullet('Plano de rollout para a rede — ativar gradualmente os ' + a.gapFq.length + ' módulos já mapeados.'));
  children.push(bullet('Dashboard Huggy completo.'));
  children.push(bullet('Migração da estrutura Miro.'));

  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(para([t('— Fim do Relatório —', { italics: true, color: COR_CINZA })], AlignmentType.CENTER));

  return new Document({
    creator: 'Central de Dashboards VIVA',
    title: 'Relatório de Cobertura — Central de Dashboards VIVA',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [{ children }],
  });
}

// ---------- MAIN ----------
(async () => {
  const mods = await readSheet();
  const a = analyze(mods);
  const doc = buildDoc(mods, a);
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(process.env.USERPROFILE || __dirname, 'Desktop', `Relatorio_Central_Dashboards_${new Date().toISOString().slice(0,10)}.docx`);
  fs.writeFileSync(outPath, buffer);
  console.log('OK');
  console.log('Arquivo gerado:', outPath);
  console.log('');
  console.log('=== RESUMO ===');
  console.log(`Total: ${a.total} | Ativos: ${a.ativos.length} | Beta: ${a.beta.length}`);
  console.log(`Internos: ${a.internos.length} | Externos: ${a.externos.length}`);
  console.log(`Franqueadora -> Alvo: ${a.alvoFr.length} | Entregue: ${a.entregueFr.length} | Gap: ${a.gapFr.length}`);
  console.log(`Franquia -> Alvo: ${a.alvoFq.length} | Entregue: ${a.entregueFq.length} | Gap: ${a.gapFq.length}`);
})().catch(e => { console.error(e); process.exit(1); });
