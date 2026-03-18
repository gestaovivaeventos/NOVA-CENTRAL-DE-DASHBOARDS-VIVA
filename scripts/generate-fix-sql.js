/**
 * Gera SQL de UPDATE para corrigir encoding quebrado no Supabase.
 * 
 * Lê o CSV com nomes corretos (no_curso, no_cine_area_geral, no_ies),
 * gera a versão "quebrada" (acentos → U+FFFD) e produz UPDATEs.
 * 
 * Uso: node scripts/generate-fix-sql.js
 */

const fs = require('fs');

const csvPath = 'C:/Users/theo/Downloads/dicionario final.csv';
const outPath = 'scripts/fix-encoding-dict.sql';

// Mapa de acentos → U+FFFD
const ACCENT_MAP = {
  'à': '\uFFFD', 'á': '\uFFFD', 'â': '\uFFFD', 'ã': '\uFFFD', 'ä': '\uFFFD',
  'ç': '\uFFFD',
  'è': '\uFFFD', 'é': '\uFFFD', 'ê': '\uFFFD', 'ë': '\uFFFD',
  'ì': '\uFFFD', 'í': '\uFFFD', 'î': '\uFFFD', 'ï': '\uFFFD',
  'ò': '\uFFFD', 'ó': '\uFFFD', 'ô': '\uFFFD', 'õ': '\uFFFD', 'ö': '\uFFFD',
  'ù': '\uFFFD', 'ú': '\uFFFD', 'û': '\uFFFD', 'ü': '\uFFFD',
  'À': '\uFFFD', 'Á': '\uFFFD', 'Â': '\uFFFD', 'Ã': '\uFFFD', 'Ä': '\uFFFD',
  'Ç': '\uFFFD',
  'È': '\uFFFD', 'É': '\uFFFD', 'Ê': '\uFFFD', 'Ë': '\uFFFD',
  'Ì': '\uFFFD', 'Í': '\uFFFD', 'Î': '\uFFFD', 'Ï': '\uFFFD',
  'Ò': '\uFFFD', 'Ó': '\uFFFD', 'Ô': '\uFFFD', 'Õ': '\uFFFD', 'Ö': '\uFFFD',
  'Ù': '\uFFFD', 'Ú': '\uFFFD', 'Û': '\uFFFD', 'Ü': '\uFFFD',
};

function quebrar(texto) {
  return [...texto].map(c => ACCENT_MAP[c] ?? c).join('');
}

function escapeSql(text) {
  return text.replace(/'/g, "''");
}

// Lê CSV
const data = fs.readFileSync(csvPath, 'utf8');
const lines = data.split('\n').slice(1).filter(l => l.trim());

// Extrai valores únicos
const iesSet = new Set();
const cursosSet = new Set();
const areasSet = new Set();

for (const line of lines) {
  const parts = line.split(';');
  if (parts.length >= 3) {
    const curso = parts[0].trim();
    const area = parts[1].trim();
    const ies = parts[2].trim();
    if (curso) cursosSet.add(curso);
    if (area) areasSet.add(area);
    if (ies) iesSet.add(ies);
  }
}

// Gera UPDATEs apenas para nomes que têm acentos
function gerarUpdates(nomes, coluna, tabela) {
  const updates = [];
  for (const correto of nomes) {
    const quebrado = quebrar(correto);
    // Só gera UPDATE se o nome mudou (tinha acento)
    if (quebrado !== correto) {
      updates.push(
        `UPDATE ${tabela} SET ${coluna} = '${escapeSql(correto)}' WHERE ${coluna} = '${escapeSql(quebrado)}';`
      );
    }
  }
  return updates;
}

let sql = `-- ============================================================
-- SCRIPT GERADO AUTOMATICAMENTE — Corrige encoding via dicionário
-- 
-- Gerado a partir de: dicionario final.csv
-- Data: ${new Date().toISOString().slice(0, 10)}
-- 
-- Total de nomes únicos:
--   IES: ${iesSet.size} (${[...iesSet].filter(n => quebrar(n) !== n).length} com acentos)
--   Cursos: ${cursosSet.size} (${[...cursosSet].filter(n => quebrar(n) !== n).length} com acentos)
--   Áreas: ${areasSet.size} (${[...areasSet].filter(n => quebrar(n) !== n).length} com acentos)
--
-- INSTRUCOES:
--   1. Cole este script no SQL Editor do Supabase
--   2. Execute (pode demorar alguns minutos)
--   3. Rode: SELECT fn_refresh_views();
-- ============================================================

BEGIN;

`;

const tabelas = ['inep_2024', 'inep_2023', 'inep_2022'];

for (const tabela of tabelas) {
  sql += `-- ═══════════════ ${tabela.toUpperCase()} ═══════════════\n\n`;
  
  // IES
  const iesUpdates = gerarUpdates([...iesSet], 'no_ies', tabela);
  if (iesUpdates.length > 0) {
    sql += `-- no_ies (${iesUpdates.length} correções)\n`;
    sql += iesUpdates.join('\n') + '\n\n';
  }

  // Cursos
  const cursosUpdates = gerarUpdates([...cursosSet], 'no_curso', tabela);
  if (cursosUpdates.length > 0) {
    sql += `-- no_curso (${cursosUpdates.length} correções)\n`;
    sql += cursosUpdates.join('\n') + '\n\n';
  }

  // Áreas
  const areasUpdates = gerarUpdates([...areasSet], 'no_cine_area_geral', tabela);
  if (areasUpdates.length > 0) {
    sql += `-- no_cine_area_geral (${areasUpdates.length} correções)\n`;
    sql += areasUpdates.join('\n') + '\n\n';
  }
}

sql += `COMMIT;\n\n`;
sql += `-- Atualizar materialized views\nSELECT fn_refresh_views();\n\n`;
sql += `-- Verificar se sobrou algum U+FFFD\n`;
sql += `-- SELECT count(*) FROM inep_2024 WHERE no_ies LIKE '%' || chr(65533) || '%';\n`;
sql += `-- SELECT count(*) FROM inep_2024 WHERE no_curso LIKE '%' || chr(65533) || '%';\n`;
sql += `-- SELECT count(*) FROM inep_2024 WHERE no_municipio LIKE '%' || chr(65533) || '%';\n`;

fs.writeFileSync(outPath, sql, 'utf8');

const totalUpdates = tabelas.length * (
  [...iesSet].filter(n => quebrar(n) !== n).length +
  [...cursosSet].filter(n => quebrar(n) !== n).length +
  [...areasSet].filter(n => quebrar(n) !== n).length
);
console.log(`\nGerado: ${outPath}`);
console.log(`Total de UPDATEs: ${totalUpdates}`);
console.log(`  IES: ${[...iesSet].filter(n => quebrar(n) !== n).length} x 3 tabelas`);
console.log(`  Cursos: ${[...cursosSet].filter(n => quebrar(n) !== n).length} x 3 tabelas`);
console.log(`  Áreas: ${[...areasSet].filter(n => quebrar(n) !== n).length} x 3 tabelas`);
