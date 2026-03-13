// Script para gerar dicionário de correção de encoding para municípios
// Lê o CSV com nomes corretos e gera um mapa: nomeQuebrado → nomeCorreto
const fs = require('fs');

const R = '\uFFFD'; // Replacement character
const csvPath = 'c:/Users/theo/Downloads/localização municipio - Página1.csv';
const outPath = 'src/modules/analise-mercado/utils/municipios-dict.ts';

// Gera versão "quebrada" de um texto (acento → U+FFFD)
function quebrar(texto) {
  const ACENTOS = /[\u00C0-\u00FF]/g; // Latin-1 Supplement (accented chars)
  return texto.replace(ACENTOS, R);
}

// Read CSV
const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

// Skip header
const header = lines[0];
console.log('Header:', header);

const dict = {};
let total = 0;
let comAcento = 0;

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(',');
  if (cols.length < 4) continue;
  
  const nome = cols[0].trim();
  if (!nome) continue;
  total++;
  
  const quebrado = quebrar(nome);
  if (quebrado !== nome) {
    dict[quebrado] = nome;
    comAcento++;
  }
}

console.log(`Total municípios: ${total}`);
console.log(`Com acentos (precisam correção): ${comAcento}`);
console.log(`Sem acentos (OK): ${total - comAcento}`);

// Gerar arquivo TS
let ts = `/**
 * Dicionário de correção de encoding para municípios brasileiros.
 * Gerado automaticamente a partir de dados IBGE.
 * Mapeia nomes com U+FFFD (encoding quebrado) → nomes corretos com acentos.
 */

const R = '\\uFFFD';

export const MUNICIPIOS_DICT: Record<string, string> = {\n`;

const entries = Object.entries(dict).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
for (const [quebrado, correto] of entries) {
  // Escape the key for TS
  const key = JSON.stringify(quebrado);
  ts += `  ${key}: ${JSON.stringify(correto)},\n`;
}

ts += `};\n`;

fs.writeFileSync(outPath, ts, 'utf8');
console.log(`\nArquivo gerado: ${outPath}`);
console.log(`Entradas no dicionário: ${entries.length}`);
