/**
 * Script de BACKFILL: migra todos os módulos para o novo formato de 2 eixos.
 *
 * Lê a planilha BASE MODULOS (colunas A:X), detecta módulos cujos campos Q-X
 * estão vazios, deriva os valores a partir das colunas legado (D=nvl_acesso,
 * E=usuarios_permitidos, M=setores_permitidos, N=grupos_permitidos) usando
 * EXATAMENTE a mesma lógica aplicada em src/pages/api/controle-modulos/data.ts,
 * e grava os novos valores nas colunas Q:X.
 *
 * Regras de migração (idênticas à derivação da API):
 *   nvl_acesso = 0 (Rede)         → ambos eixos recebem a mesma política
 *                                   (geral se sem restrições; restrito com
 *                                   os mesmos filtros caso haja restrições)
 *   nvl_acesso = 1 (Franqueadora) → franqueadora = geral/restrito; franquia = sem_acesso
 *   nvl_acesso = 2 (Franquia)     → franqueadora = sem_acesso; franquia = geral/restrito
 *
 * IMPORTANTE: o script só grava nas linhas cujas 8 colunas Q-X estão TODAS
 * vazias. Módulos que já foram editados pela nova UI (e têm valores em Q-X)
 * são preservados sem alteração.
 *
 * Modo dry-run: por padrão o script apenas EXIBE o que faria. Para executar
 * as gravações passe o argumento --apply:
 *
 *   node scripts/backfill-eixos-acesso.js           # dry-run
 *   node scripts/backfill-eixos-acesso.js --apply   # grava na planilha
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
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

const csv = (v) => {
  const s = (v || '').toString().trim();
  return s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
};
const parseEixo = (v) => {
  const s = (v || '').toString().trim().toLowerCase();
  if (s === 'geral' || s === 'sem_acesso' || s === 'restrito') return s;
  return '';
};

function deriveEixos(row) {
  const nvlAcesso = parseInt(row[3] || '0', 10);
  const usuariosPermitidos = csv(row[4]);
  const setoresPermitidos = csv(row[12]);
  const gruposPermitidos = csv(row[13]);

  let acessoFranqueadora = parseEixo(row[16]);
  let franqueadoraSetores = csv(row[17]);
  let franqueadoraGrupos = csv(row[18]);
  let franqueadoraUsuarios = csv(row[19]);
  let acessoFranquia = parseEixo(row[20]);
  let franquiaSetores = csv(row[21]);
  let franquiaGrupos = csv(row[22]);
  let franquiaUsuarios = csv(row[23]);

  const hasRestricoes =
    usuariosPermitidos.length > 0 ||
    setoresPermitidos.length > 0 ||
    gruposPermitidos.length > 0;

  if (!acessoFranqueadora) {
    if (nvlAcesso === 0 || nvlAcesso === 1) {
      acessoFranqueadora = hasRestricoes ? 'restrito' : 'geral';
      if (hasRestricoes) {
        franqueadoraSetores = setoresPermitidos;
        franqueadoraGrupos = gruposPermitidos;
        franqueadoraUsuarios = usuariosPermitidos;
      }
    } else if (nvlAcesso === 2) {
      acessoFranqueadora = 'sem_acesso';
    }
  }

  if (!acessoFranquia) {
    if (nvlAcesso === 0 || nvlAcesso === 2) {
      acessoFranquia = hasRestricoes ? 'restrito' : 'geral';
      if (hasRestricoes) {
        franquiaSetores = setoresPermitidos;
        franquiaGrupos = gruposPermitidos;
        franquiaUsuarios = usuariosPermitidos;
      }
    } else if (nvlAcesso === 1) {
      acessoFranquia = 'sem_acesso';
    }
  }

  return {
    acessoFranqueadora: acessoFranqueadora || 'sem_acesso',
    franqueadoraSetores,
    franqueadoraGrupos,
    franqueadoraUsuarios,
    acessoFranquia: acessoFranquia || 'sem_acesso',
    franquiaSetores,
    franquiaGrupos,
    franquiaUsuarios,
  };
}

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

  console.log(`\n🔍 Lendo ${SHEET_NAME}!A:X ...`);
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:X`,
  });
  const rows = resp.data.values || [];
  console.log(`   ${rows.length} linhas (incl. header)\n`);

  const updates = [];
  const skipped = [];
  const empty = [];

  // começa em 1 (pula header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1; // 1-based
    const moduloId = (row[0] || '').trim();
    const moduloNome = (row[1] || '').trim();

    if (!moduloId) {
      empty.push(rowNum);
      continue;
    }

    // Já tem algum valor em Q-X? Pular para não sobrescrever edições manuais.
    const qaCells = row.slice(16, 24).map((c) => (c || '').toString().trim());
    const hasExisting = qaCells.some((c) => c !== '');
    if (hasExisting) {
      skipped.push({ rowNum, moduloId, moduloNome, existing: qaCells });
      continue;
    }

    const d = deriveEixos(row);
    updates.push({
      rowNum,
      moduloId,
      moduloNome,
      nvlAcesso: parseInt(row[3] || '0', 10),
      values: [
        d.acessoFranqueadora,
        d.franqueadoraSetores.join(','),
        d.franqueadoraGrupos.join(','),
        d.franqueadoraUsuarios.join(','),
        d.acessoFranquia,
        d.franquiaSetores.join(','),
        d.franquiaGrupos.join(','),
        d.franquiaUsuarios.join(','),
      ],
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Módulos a migrar:      ${updates.length}`);
  console.log(`⏭️  Módulos já migrados:   ${skipped.length}`);
  console.log(`   (linhas vazias:        ${empty.length})`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (skipped.length > 0) {
    console.log('⏭️  Já possuem valores em Q-X (serão preservados):');
    skipped.forEach((s) => {
      console.log(`   L${s.rowNum}  ${s.moduloId.padEnd(40)} ${s.moduloNome}`);
    });
    console.log('');
  }

  if (updates.length === 0) {
    console.log('✅ Nenhum módulo precisa de migração.');
    return;
  }

  console.log('📝 Preview da migração:\n');
  updates.forEach((u) => {
    const [af, fs_, fg, fu, aa, as_, ag, au] = u.values;
    console.log(`   L${u.rowNum}  ${u.moduloId.padEnd(40)} ${u.moduloNome}`);
    console.log(`         nvl_acesso legado = ${u.nvlAcesso}`);
    console.log(`         Q acesso_franqueadora   = ${af}`);
    if (fs_) console.log(`         R franqueadora_setores  = ${fs_}`);
    if (fg) console.log(`         S franqueadora_grupos   = ${fg}`);
    if (fu) console.log(`         T franqueadora_usuarios = ${fu}`);
    console.log(`         U acesso_franquia       = ${aa}`);
    if (as_) console.log(`         V franquia_setores      = ${as_}`);
    if (ag) console.log(`         W franquia_grupos       = ${ag}`);
    if (au) console.log(`         X franquia_usuarios     = ${au}`);
    console.log('');
  });

  if (!APPLY) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 DRY-RUN: nada foi alterado na planilha.');
    console.log('   Para aplicar a migração execute:');
    console.log('   node scripts/backfill-eixos-acesso.js --apply');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  console.log('🚀 Aplicando mudanças (batchUpdate) ...');
  const data = updates.map((u) => ({
    range: `${SHEET_NAME}!Q${u.rowNum}:X${u.rowNum}`,
    values: [u.values],
  }));

  const res = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });

  console.log(`✅ ${res.data.totalUpdatedCells} células atualizadas em ${res.data.totalUpdatedRows} linhas.`);
}

run().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
