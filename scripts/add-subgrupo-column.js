/**
 * Script utilitário: adiciona o cabeçalho "subgrupo" na coluna L da planilha BASE MODULOS
 * Executa apenas uma vez — não apaga dados existentes.
 *
 * Uso: node scripts/add-subgrupo-column.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

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

async function run() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64 || !SPREADSHEET_ID) {
    console.error('❌ Variáveis de ambiente ausentes');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Verificar se L1 já tem conteúdo
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!L1`,
  });

  const current = check.data.values?.[0]?.[0] || '';
  if (current.toLowerCase() === 'subgrupo') {
    console.log('✅ Coluna L1 já contém "subgrupo". Nada a fazer.');
    return;
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!L1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['subgrupo']] },
  });

  console.log('✅ Cabeçalho "subgrupo" adicionado na coluna L1 da planilha BASE MODULOS.');
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
