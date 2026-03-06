/**
 * Script para criar os headers na planilha de metas Gestão Rede
 * Executar: node scripts/setup-metas-sheet.js
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

const SPREADSHEET_ID = envVars.GESTAO_REDE_METAS_SPREADSHEET_ID;
const SHEET_NAME = envVars.GESTAO_REDE_METAS_SHEET_NAME || 'BASE';
const SERVICE_ACCOUNT_BASE64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;

async function main() {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_BASE64) {
    console.error('Variáveis de ambiente não encontradas!');
    process.exit(1);
  }

  const credentials = JSON.parse(Buffer.from(SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8'));

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Headers para a aba BASE
  const headers = [
    'data',
    'nm_unidade',
    'vvr',
    'vvr_carteira',
    'endividamento',
    'nps',
    'mc_entrega',
    'enps',
    'conformidade',
    'reclame_aqui',
    'colab_1_ano',
    'estrutura_organizacional',
    'churn',
    'ativo_pex',
  ];

  console.log(`Escrevendo headers na planilha ${SPREADSHEET_ID}, aba "${SHEET_NAME}"...`);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET_NAME}'!A1:N1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [headers],
    },
  });

  console.log('Headers criados com sucesso!');
  console.log('Colunas:', headers.join(' | '));
  console.log('\nAgora preencha as linhas com: data, nm_unidade e ativo_pex (SIM/NÃO).');
  console.log('Os valores de meta podem ser editados pelo painel em /gestao-rede/metas');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
