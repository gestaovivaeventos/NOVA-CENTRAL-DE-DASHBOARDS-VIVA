/**
 * Script para corrigir o grupo/subgrupo do módulo funil-expansao na planilha BASE MODULOS
 * Corrige: "Gestão franqueadora" -> "Gestão Franqueadora" e "expansao" -> "EXPANSÃO"
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

async function fix() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const SPREADSHEET_ID = envVars.CONTROLE_MODULOS_SPREADSHEET_ID;
  const SHEET_NAME = envVars.CONTROLE_MODULOS_SHEET_NAME || 'BASE MODULOS';

  // Ler dados para encontrar a linha do funil-expansao
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:L`,
  });

  const rows = res.data.values || [];
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === 'funil-expansao') {
      rowIndex = i + 1; // 1-based para a API
      break;
    }
  }

  if (rowIndex === -1) {
    console.error('❌ Módulo funil-expansao não encontrado na planilha.');
    process.exit(1);
  }

  console.log(`📍 Encontrado na linha ${rowIndex}`);

  // Atualizar grupo (coluna G) e subgrupo (coluna L)
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SHEET_NAME}!G${rowIndex}`,
          values: [['Gestão Franqueadora']],
        },
        {
          range: `${SHEET_NAME}!L${rowIndex}`,
          values: [['EXPANSÃO']],
        },
      ],
    },
  });

  console.log('✅ Corrigido com sucesso!');
  console.log('   Grupo:    "Gestão Franqueadora" (F maiúsculo, igual aos outros)');
  console.log('   Subgrupo: "EXPANSÃO" (maiúsculo, padrão dos subgrupos)');
}

fix().catch(e => console.error('❌', e.message));
