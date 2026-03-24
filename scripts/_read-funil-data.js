/**
 * Script para ler os headers e primeiras linhas da planilha BASE do Funil Expansão
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

async function read() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SPREADSHEET_ID = envVars.FUNIL_EXPANSAO_SPREADSHEET_ID;
  const SHEET_NAME = envVars.FUNIL_EXPANSAO_SHEET_NAME || 'BASE';

  // Ler todas as colunas, primeiras 5 linhas
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!1:5`,
  });

  const rows = res.data.values || [];
  console.log(`=== PLANILHA FUNIL EXPANSÃO - ABA "${SHEET_NAME}" ===`);
  console.log(`Total de linhas retornadas: ${rows.length}`);
  console.log('');

  if (rows[0]) {
    console.log('=== HEADERS (linha 1) ===');
    rows[0].forEach((h, i) => {
      const col = String.fromCharCode(65 + Math.floor(i/26)).replace('@','') + String.fromCharCode(65 + (i % 26));
      const colLetter = i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i/26)) + String.fromCharCode(65 + (i % 26));
      console.log(`  Col ${colLetter} [${i}]: "${h}"`);
    });
    console.log(`\nTotal de colunas: ${rows[0].length}`);
  }

  console.log('\n=== PRIMEIRAS LINHAS DE DADOS ===');
  for (let i = 1; i < rows.length; i++) {
    console.log(`\n--- Linha ${i + 1} ---`);
    rows[i].forEach((val, j) => {
      const header = rows[0] ? rows[0][j] || `col_${j}` : `col_${j}`;
      if (val && val.trim()) {
        console.log(`  ${header}: "${val}"`);
      }
    });
  }

  // Agora ler contagem total
  const countRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  });
  const totalRows = (countRes.data.values || []).length;
  console.log(`\n=== TOTAL DE LINHAS NA ABA: ${totalRows} (incluindo header) ===`);
}

read().catch(e => console.error('ERRO:', e.message));
