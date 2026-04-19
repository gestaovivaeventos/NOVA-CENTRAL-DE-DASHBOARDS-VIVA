/**
 * Script utilitário: grava os cabeçalhos das novas colunas Q–X (2 eixos de acesso)
 * na planilha BASE MODULOS. Não toca em dados abaixo da linha 1.
 *
 * Colunas:
 *   Q acesso_franqueadora
 *   R franqueadora_setores
 *   S franqueadora_grupos
 *   T franqueadora_usuarios
 *   U acesso_franquia
 *   V franquia_setores
 *   W franquia_grupos
 *   X franquia_usuarios
 *
 * Uso: node scripts/add-eixos-headers.js
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

const HEADERS = [
  'acesso_franqueadora',
  'franqueadora_setores',
  'franqueadora_grupos',
  'franqueadora_usuarios',
  'acesso_franquia',
  'franquia_setores',
  'franquia_grupos',
  'franquia_usuarios',
];

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

  // Ler conteúdo atual de Q1:X1 para preservar o que já estiver correto
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!Q1:X1`,
  });

  const current = check.data.values?.[0] || [];
  console.log('📋 Headers atuais Q1:X1:', current);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!Q1:X1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [HEADERS] },
  });

  console.log('✅ Headers Q1:X1 atualizados:');
  HEADERS.forEach((h, i) => {
    const col = String.fromCharCode(81 + i); // Q=81
    console.log(`   ${col}1 = ${h}`);
  });
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
