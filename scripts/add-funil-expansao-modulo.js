/**
 * Script para adicionar o módulo funil-expansao na planilha BASE MODULOS
 * Apenas faz APPEND (adiciona linha), não sobrescreve dados existentes.
 * 
 * Uso: node scripts/add-funil-expansao-modulo.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Ler .env.local
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

async function addModulo() {
  const base64 = envVars.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (!base64 || !SPREADSHEET_ID) {
    console.error('❌ Variáveis de ambiente não encontradas.');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  const auth = new google.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Primeiro, verificar se já existe
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  });

  const rows = existing.data.values || [];
  const alreadyExists = rows.some(row => row[0] === 'funil-expansao');

  if (alreadyExists) {
    console.log('⚠️  Módulo funil-expansao já existe na planilha. Nenhuma alteração feita.');
    return;
  }

  // Dados do módulo: colunas A-L
  // modulo_id, modulo_nome, modulo_path, nvl_acesso, usuarios_permitidos, ativo, grupo, ordem, icone, tipo, url_externa, subgrupo
  const novaLinha = [
    'funil-expansao',
    'Funil de Expansão',
    '/funil-expansao',
    '1',                          // nvl_acesso = 1 (franqueadora)
    'cris,gabriel.braz',          // usuarios permitidos
    'TRUE',
    'Gestão franqueadora',
    '1',                          // ordem dentro do grupo
    'chart',                      // ícone
    'interno',
    '',                           // url_externa (vazio, é interno)
    'expansao',                   // subgrupo
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [novaLinha] },
    });

    console.log('✅ Módulo funil-expansao adicionado com sucesso na planilha BASE MODULOS!');
    console.log('');
    console.log('   ID:           funil-expansao');
    console.log('   Nome:         Funil de Expansão');
    console.log('   Path:         /funil-expansao');
    console.log('   Nível acesso: 1 (Franqueadora)');
    console.log('   Usuários:     cris, gabriel.braz');
    console.log('   Grupo:        Gestão franqueadora');
    console.log('   Subgrupo:     expansao');
    console.log('');
    console.log('🔄 Recarregue o dashboard para ver o módulo no menu.');
  } catch (error) {
    console.error('❌ Erro ao adicionar módulo:', error.message);
    process.exit(1);
  }
}

addModulo();
