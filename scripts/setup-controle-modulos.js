/**
 * Script para configurar a planilha BASE MODULOS
 * Cria os cabeçalhos e popula com os módulos existentes
 * 
 * Uso: node scripts/setup-controle-modulos.js
 * 
 * Requer: GOOGLE_SERVICE_ACCOUNT_BASE64 e CONTROLE_MODULOS_SPREADSHEET_ID no .env.local
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      envVars[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
    }
  }
});

const SPREADSHEET_ID = envVars.CONTROLE_MODULOS_SPREADSHEET_ID;
const SHEET_NAME = envVars.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

async function setup() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_BASE64 não encontrado no .env');
    process.exit(1);
  }

  if (!SPREADSHEET_ID) {
    console.error('❌ CONTROLE_MODULOS_SPREADSHEET_ID não encontrado no .env.local');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Cabeçalhos da planilha
  const headers = [
    'modulo_id',
    'modulo_nome',
    'modulo_path',
    'nvl_acesso',
    'usuarios_permitidos',
    'ativo',
    'grupo',
    'ordem',
    'icone',
    'tipo',
    'url_externa',
    'subgrupo',
  ];

  // Dados iniciais - módulos existentes + links externos
  // nvl_acesso: 0 = rede (todos - franqueados + franqueadora), 1 = somente franqueadora
  // tipo: 'interno' = rota Next.js na central, 'externo' = abre link em nova aba
  // NOTA: Módulos novos (externos) restritos aos 4 usuários até liberação oficial
  const USERS_PREVIEW = 'cris,gabriel.braz,marcos.castro,theo.diniz';

  const modulosIniciais = [
    // ═══ 🎯 DIRECIONAMENTO ESTRATÉGICO ═══
    ['kpi', 'Dashboard KPIs', '/kpi', '1', '', 'TRUE', 'Direcionamento Estratégico', '1', 'chart', 'interno', '', ''],
    ['okr', 'Dashboard OKRs', '/okr', '1', '', 'TRUE', 'Direcionamento Estratégico', '2', 'target', 'interno', '', ''],
    ['gerencial', 'Painel Gerencial', '/gerencial', '1', '', 'TRUE', 'Direcionamento Estratégico', '3', 'trophy', 'interno', '', ''],

    // ═══ 💰 SAÚDE FINANCEIRA & TESOURARIA ═══
    ['fluxo-projetado', 'Gestão de Caixa', '/fluxo-projetado', '1', '', 'TRUE', 'Saúde Financeira & Tesouraria', '1', 'fluxo', 'interno', '', ''],
    ['markup-cielo', 'Acompanhamento Markup - CIELO', '/ext/markup-cielo', '1', USERS_PREVIEW, 'TRUE', 'Saúde Financeira & Tesouraria', '2', 'creditcard', 'externo', 'https://lookerstudio.google.com/u/0/reporting/c89edab0-20ae-492a-8c73-d39281df3dd9/page/muWWE', ''],
    ['transacoes-cartao', 'Transações Cartão', '/ext/transacoes-cartao', '1', USERS_PREVIEW, 'TRUE', 'Saúde Financeira & Tesouraria', '3', 'wallet', 'externo', 'https://lookerstudio.google.com/u/0/reporting/2b6c3dbd-0d07-4b29-832b-7b8dbe42a4e9/page/p_vtmknmd0bd', ''],

    // ═══ 📈 PERFORMANCE & VENDAS ═══
    ['vendas', 'Dashboard Vendas', '/vendas', '1', '', 'TRUE', 'Performance & Vendas', '1', 'money', 'interno', '', ''],
    ['carteira', 'Dashboard Carteira', '/carteira', '1', '', 'TRUE', 'Performance & Vendas', '2', 'wallet', 'interno', '', ''],
    ['dash-clientes-franqueadora', 'Dash Clientes (Franqueadora)', '/ext/clientes-franqueadora', '1', USERS_PREVIEW, 'TRUE', 'Performance & Vendas', '3', 'users', 'externo', 'https://lookerstudio.google.com/u/0/reporting/5e31734c-7040-4514-8902-238cb49a6b6f/page/KiYRD', ''],
    ['dash-clientes-franquias', 'Dash Clientes (Franquias)', '/ext/clientes-franquias', '1', USERS_PREVIEW, 'TRUE', 'Performance & Vendas', '4', 'users', 'externo', 'https://lookerstudio.google.com/u/0/reporting/82592549-10d6-491a-ae80-033f7d551217/page/KiYRD', ''],

    // ═══ 🤝 OPERAÇÕES & SUCESSO DO ALUNO ═══
    ['gestao-rede', 'Gestão Rede', '/gestao-rede', '1', '', 'TRUE', 'Operações & Sucesso do Aluno', '1', 'network', 'interno', '', ''],
    ['pex', 'PEX', '/pex', '0', '', 'TRUE', 'Operações & Sucesso do Aluno', '2', 'dashboard', 'interno', '', ''],

    // ═══ 👥 GENTE, CULTURA & TIME ═══
    ['indicadores-gente', 'Indicadores de Gente & Cultura', '/ext/indicadores-gente', '1', USERS_PREVIEW, 'TRUE', 'Gente, Cultura & Time', '1', 'people', 'externo', '', ''],

    // ═══ 🛠️ FERRAMENTAS & APOIO ═══
    ['projetos', 'Painel de Projetos', '/projetos', '1', 'vitor,cris,gabriel.braz,marcos.castro,reis.igor,theo.diniz', 'TRUE', 'Ferramentas & Apoio', '1', 'projetos', 'interno', '', ''],
    ['demandas-trafego', 'Demandas Tráfego - Marketing', '/ext/demandas-trafego', '1', USERS_PREVIEW, 'TRUE', 'Ferramentas & Apoio', '2', 'marketing', 'externo', 'https://lookerstudio.google.com/u/0/reporting/256f08c9-5c10-4853-b6be-4e2c1d637a3b/page/o_a3sxz1exd', ''],

    // ═══ 📑 RELATÓRIOS RECORRENTES ═══
    // (Reservado — planilhas Google Sheets serão adicionadas via painel de controle)

    // ═══ DESENVOLVIMENTO (mantido) ═══
    ['branches', 'Gerenciar Branches', '/branches', '1', 'cris,gabriel.braz,marcos.castro,theo.diniz', 'TRUE', 'Desenvolvimento', '1', 'branch', 'interno', '', ''],
    ['controle-modulos', 'Controle de Módulos', '/controle-modulos', '1', 'cris,gabriel.braz,marcos.castro,theo.diniz', 'TRUE', 'Desenvolvimento', '2', 'config', 'interno', '', ''],
  ];

  const values = [headers, ...modulosIniciais];

  try {
    // Limpar e escrever dados
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    console.log('✅ Planilha BASE MODULOS configurada com sucesso!');
    console.log(`📊 ${modulosIniciais.length} módulos cadastrados`);
    console.log('\nColunas criadas:');
    headers.forEach((h, i) => console.log(`  ${String.fromCharCode(65 + i)}: ${h}`));
    console.log('\nMódulos:');
    modulosIniciais.forEach(m => console.log(`  - ${m[0]} (${m[1]}) | nvl: ${m[3]} | grupo: ${m[6]}`));
  } catch (error) {
    console.error('❌ Erro ao configurar planilha:', error.message);
    process.exit(1);
  }
}

setup();
