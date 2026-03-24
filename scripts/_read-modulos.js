/**
 * Script temporário para ler os dados atuais da planilha BASE MODULOS
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
  const SPREADSHEET_ID = envVars.CONTROLE_MODULOS_SPREADSHEET_ID;
  const SHEET_NAME = envVars.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:L`,
  });

  const rows = res.data.values || [];
  console.log('=== PLANILHA BASE MODULOS ===');
  console.log(`Total de linhas: ${rows.length}`);
  console.log('');
  
  // Header
  if (rows[0]) {
    console.log('HEADER:', rows[0].join(' | '));
    console.log('---');
  }
  
  // Data rows
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const id = r[0] || '';
    const nome = r[1] || '';
    const path = r[2] || '';
    const nvl = r[3] || '';
    const users = r[4] || '';
    const ativo = r[5] || '';
    const grupo = r[6] || '';
    const ordem = r[7] || '';
    const icone = r[8] || '';
    const tipo = r[9] || '';
    const url = r[10] || '';
    const subgrupo = r[11] || '';
    console.log(`Linha ${i+1}: id=${id} | grupo="${grupo}" | subgrupo="${subgrupo}" | nome="${nome}" | nvl=${nvl} | users="${users}"`);
  }
}

read().catch(e => console.error(e.message));
