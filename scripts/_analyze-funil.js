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

  // Ler colunas relevantes: Etapa do lead (G), Funil de vendas (H), Venda (I), Lead tags (N), Fechada em (P), [FASE QUE PERDEU] (AE)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `BASE!A:AE`,
  });

  const rows = res.data.values || [];
  const headers = rows[0];
  
  // Colunas de interesse
  const etapaIdx = headers.findIndex(h => h === 'Etapa do lead');
  const funilIdx = headers.findIndex(h => h === 'Funil de vendas');
  const vendaIdx = headers.findIndex(h => h === 'Venda');
  const tagsIdx = headers.findIndex(h => h === 'Lead tags');
  const fechadaIdx = headers.findIndex(h => h === 'Fechada em');
  const fasePerdiIdx = headers.findIndex(h => h === '[FASE QUE PERDEU]');
  const origemIdx = headers.findIndex(h => h === 'Origem do lead');
  
  console.log(`Indices: etapa=${etapaIdx}, funil=${funilIdx}, venda=${vendaIdx}, tags=${tagsIdx}, fechada=${fechadaIdx}, fasePerdeu=${fasePerdiIdx}, origem=${origemIdx}`);
  
  // Contar valores únicos de cada campo
  const etapas = new Map();
  const funis = new Map();
  const vendas = new Map();
  const origens = new Map();
  const fasesPerdeu = new Map();
  const fechados = new Map();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const etapa = row[etapaIdx] || '';
    const funil = row[funilIdx] || '';
    const venda = row[vendaIdx] || '';
    const origem = row[origemIdx] || '';
    const fasePerd = row[fasePerdiIdx] || '';
    const fechada = row[fechadaIdx] || '';
    
    etapas.set(etapa, (etapas.get(etapa) || 0) + 1);
    funis.set(funil, (funis.get(funil) || 0) + 1);
    vendas.set(venda, (vendas.get(venda) || 0) + 1);
    origens.set(origem, (origens.get(origem) || 0) + 1);
    if (fasePerd) fasesPerdeu.set(fasePerd, (fasesPerdeu.get(fasePerd) || 0) + 1);
    fechados.set(fechada, (fechados.get(fechada) || 0) + 1);
  }

  console.log('\n=== ETAPAS DO LEAD (valores únicos) ===');
  [...etapas.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));

  console.log('\n=== FUNIS DE VENDAS (valores únicos) ===');
  [...funis.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));

  console.log('\n=== VENDA (valores únicos) ===');
  [...vendas.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));
  
  console.log('\n=== ORIGENS (valores únicos) ===');
  [...origens.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));

  console.log('\n=== FASE QUE PERDEU (valores únicos, se preenchido) ===');
  [...fasesPerdeu.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));

  console.log('\n=== FECHADA EM (valores únicos, amostra) ===');
  [...fechados.entries()].sort((a,b) => b[1]-a[1]).slice(0,10).forEach(([k,v]) => console.log(`  [${v}x] "${k}"`));

  console.log(`\nTotal de leads: ${rows.length - 1}`);
}

read().catch(e => console.error('ERRO:', e.message));
