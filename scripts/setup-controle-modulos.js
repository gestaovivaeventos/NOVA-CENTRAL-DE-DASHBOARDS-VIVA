/**
 * Script para configurar a planilha BASE MODULOS
 * Cria os cabeçalhos e popula com os módulos existentes
 * 
 * Uso: node scripts/setup-controle-modulos.js
 * 
 * Requer: GOOGLE_SERVICE_ACCOUNT_BASE64 no .env
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

const SPREADSHEET_ID = '1QSiCHm-kgDTLnwhtJVdsPLD70CbYTexH3WUE5LuDxtE';
const SHEET_NAME = 'BASE MODULOS';

async function setup() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_BASE64 não encontrado no .env');
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
  ];

  // Dados iniciais - módulos existentes na central
  // nvl_acesso: 0 = rede (todos - franqueados + franqueadora), 1 = somente franqueadora
  const modulosIniciais = [
    ['kpi', 'Dashboard KPIs', '/kpi', '1', '', 'TRUE', 'gestao-resultados', '1', 'chart'],
    ['okr', 'Dashboard OKRs', '/okr', '1', '', 'TRUE', 'gestao-resultados', '2', 'target'],
    ['gerencial', 'Painel Gerencial', '/gerencial', '1', '', 'TRUE', 'gestao-resultados', '3', 'trophy'],
    ['gestao-rede', 'Gestão Rede', '/gestao-rede', '1', '', 'TRUE', 'gestao-resultados', '4', 'network'],
    ['pex', 'PEX', '/pex', '0', '', 'TRUE', 'gestao-resultados', '5', 'dashboard'],
    ['vendas', 'Dashboard Vendas', '/vendas', '1', '', 'TRUE', 'dashboards-gerais', '1', 'money'],
    ['carteira', 'Dashboard Carteira', '/carteira', '1', '', 'TRUE', 'dashboards-gerais', '2', 'wallet'],
    ['fluxo-projetado', 'Gestão de Caixa', '/fluxo-projetado', '1', '', 'TRUE', 'dashboards-gerais', '3', 'fluxo'],
    ['projetos', 'Painel de Projetos', '/projetos', '1', 'vitor,cris,gabriel.braz,marcos.castro,reis.igor,theo.diniz', 'TRUE', 'dashboards-gerais', '4', 'projetos'],
    ['branches', 'Gerenciar Branches', '/branches', '1', 'cris,gabriel.braz,marcos.castro,theo.diniz', 'TRUE', 'desenvolvimento', '1', 'branch'],
    ['controle-modulos', 'Controle de Módulos', '/controle-modulos', '1', 'cris,gabriel.braz,marcos.castro,theo.diniz', 'TRUE', 'desenvolvimento', '2', 'config'],
  ];

  const values = [headers, ...modulosIniciais];

  try {
    // Limpar e escrever dados
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:I`,
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
