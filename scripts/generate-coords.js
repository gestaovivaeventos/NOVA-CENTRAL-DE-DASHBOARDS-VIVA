// Script para gerar coordenadas-municipios.ts a partir do CSV do IBGE
// Formato CSV: NOME,UF,LATITUDE,LONGITUDE (com dots como separadores de milhar)
const fs = require('fs');

const csvPath = 'c:/Users/theo/Downloads/localização municipio - Página1.csv';
const outPath = 'src/modules/analise-mercado/utils/coordenadas-municipios.ts';

// Ranges de latitude/longitude esperados por UF (com margem)
const UF_RANGES = {
  AC: { latMin: -12, latMax: -6, lngMin: -75, lngMax: -66 },
  AL: { latMin: -11, latMax: -8, lngMin: -38, lngMax: -35 },
  AM: { latMin: -10, latMax: 3, lngMin: -74, lngMax: -56 },
  AP: { latMin: -2, latMax: 5, lngMin: -55, lngMax: -49 },
  BA: { latMin: -19, latMax: -8, lngMin: -47, lngMax: -37 },
  CE: { latMin: -8, latMax: -2, lngMin: -42, lngMax: -37 },
  DF: { latMin: -17, latMax: -15, lngMin: -49, lngMax: -47 },
  ES: { latMin: -22, latMax: -17, lngMin: -42, lngMax: -39 },
  GO: { latMin: -20, latMax: -12, lngMin: -54, lngMax: -45 },
  MA: { latMin: -11, latMax: -1, lngMin: -49, lngMax: -41 },
  MG: { latMin: -23, latMax: -14, lngMin: -52, lngMax: -39 },
  MS: { latMin: -25, latMax: -17, lngMin: -58, lngMax: -53 },
  MT: { latMin: -18, latMax: -7, lngMin: -62, lngMax: -50 },
  PA: { latMin: -10, latMax: 3, lngMin: -59, lngMax: -46 },
  PB: { latMin: -9, latMax: -6, lngMin: -39, lngMax: -34 },
  PE: { latMin: -10, latMax: -7, lngMin: -42, lngMax: -34 },
  PI: { latMin: -11, latMax: -2, lngMin: -46, lngMax: -40 },
  PR: { latMin: -27, latMax: -22, lngMin: -55, lngMax: -48 },
  RJ: { latMin: -24, latMax: -20, lngMin: -45, lngMax: -40 },
  RN: { latMin: -7, latMax: -4, lngMin: -38, lngMax: -34 },
  RO: { latMin: -14, latMax: -7, lngMin: -67, lngMax: -59 },
  RR: { latMin: -1, latMax: 6, lngMin: -65, lngMax: -58 },
  RS: { latMin: -34, latMax: -27, lngMin: -58, lngMax: -49 },
  SC: { latMin: -30, latMax: -25, lngMin: -54, lngMax: -48 },
  SE: { latMin: -12, latMax: -9, lngMin: -39, lngMax: -36 },
  SP: { latMin: -26, latMax: -19, lngMin: -54, lngMax: -44 },
  TO: { latMin: -14, latMax: -5, lngMin: -51, lngMax: -45 },
};

function parseCoord(rawStr, uf, isLat) {
  const str = rawStr.trim();
  const negative = str.startsWith('-');
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return NaN;

  const range = UF_RANGES[uf];
  if (!range) return NaN;

  const minVal = isLat ? range.latMin : range.lngMin;
  const maxVal = isLat ? range.latMax : range.lngMax;

  // Try inserting decimal after 0, 1, 2, 3 digits for the integer part
  const candidates = [];
  for (let i = 0; i <= Math.min(3, digits.length - 1); i++) {
    let val;
    if (i === 0) {
      val = parseFloat('0.' + digits);
    } else {
      val = parseFloat(digits.substring(0, i) + '.' + digits.substring(i));
    }
    if (negative) val = -val;
    if (val >= minVal && val <= maxVal) {
      candidates.push(val);
    }
  }

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    // Pick the one closest to center of UF range
    const center = (minVal + maxVal) / 2;
    candidates.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
    return candidates[0];
  }

  // If no candidate in UF range, try with wider range
  for (let i = 0; i <= Math.min(3, digits.length - 1); i++) {
    let val;
    if (i === 0) {
      val = parseFloat('0.' + digits);
    } else {
      val = parseFloat(digits.substring(0, i) + '.' + digits.substring(i));
    }
    if (negative) val = -val;
    if (isLat && val >= -35 && val <= 7) return val;
    if (!isLat && val >= -75 && val <= -33) return val;
  }

  return NaN;
}

function normalize(nome) {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Read CSV
const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split('\n').filter(l => l.trim());

const entries = []; // { nome, uf, lat, lng }
let bad = 0;
const badList = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].replace(/\r/g, '');
  const parts = line.split(',');
  if (parts.length < 4) continue;

  const nome = parts[0].trim();
  const uf = parts[1].trim();
  const latRaw = parts[2];
  const lngRaw = parts[3];

  const lat = parseCoord(latRaw, uf, true);
  const lng = parseCoord(lngRaw, uf, false);

  if (isNaN(lat) || isNaN(lng)) {
    bad++;
    if (bad <= 20) badList.push({ nome, uf, latRaw, lngRaw, lat, lng });
    continue;
  }

  entries.push({ nome, uf, lat: Math.round(lat * 1000000) / 1000000, lng: Math.round(lng * 1000000) / 1000000 });
}

console.log(`Parsed: ${entries.length} OK, ${bad} failed`);
if (badList.length > 0) {
  console.log('Failed entries:');
  badList.forEach(b => console.log(`  ${b.nome} (${b.uf}): lat=${b.latRaw} lng=${b.lngRaw} → ${b.lat}, ${b.lng}`));
}

// Group by UF for organized output
const byUF = {};
for (const e of entries) {
  if (!byUF[e.uf]) byUF[e.uf] = [];
  byUF[e.uf].push(e);
}

// Sort UFs
const ufOrder = Object.keys(byUF).sort();

// Generate TypeScript
let ts = `// ============================================================
// Coordenadas geográficas de todos os municípios brasileiros
// Fonte: IBGE — latitude / longitude das sedes municipais
// Gerado automaticamente a partir de CSV com ${entries.length} municípios
// ============================================================

export interface CoordenadaMunicipio {
  lat: number;
  lng: number;
}

/**
 * Mapa: "NOME_MUNICIPIO|UF" → { lat, lng }
 * A chave usa uppercase sem acentos + UF para desambiguar homônimos
 */
const COORDENADAS_MUNICIPIOS: Record<string, CoordenadaMunicipio> = {\n`;

for (const uf of ufOrder) {
  const cities = byUF[uf].sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  ts += `  // ── ${uf} (${cities.length} municípios) ──\n`;
  for (const c of cities) {
    const key = `${normalize(c.nome)}|${c.uf}`;
    ts += `  '${key.replace(/'/g, "\\'")}': { lat: ${c.lat}, lng: ${c.lng} },\n`;
  }
}

ts += `};

/**
 * Busca coordenadas para um município.
 * Tenta match exato "NOME|UF". Como temos ~5500 municípios, o fallback é raro.
 */
export function getCoordenadaMunicipio(
  nome: string,
  uf: string,
  fallbackCapitais: Record<string, { lat: number; lng: number }>
): CoordenadaMunicipio {
  const nomeNorm = nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '');

  const chave = \`\${nomeNorm}|\${uf.toUpperCase()}\`;

  if (COORDENADAS_MUNICIPIOS[chave]) {
    return COORDENADAS_MUNICIPIOS[chave];
  }

  // Fallback: capital do estado (raro — cobertura >99%)
  const capital = fallbackCapitais[uf] || { lat: -15.79, lng: -47.88 };
  return { lat: capital.lat, lng: capital.lng };
}

export default COORDENADAS_MUNICIPIOS;
`;

fs.writeFileSync(outPath, ts, 'utf8');
console.log(`\nGenerated ${outPath} (${(ts.length / 1024).toFixed(0)} KB) with ${entries.length} municipalities across ${ufOrder.length} UFs`);

// Verify some known cities
const checks = [
  { nome: 'São Paulo', uf: 'SP', lat: -23.55, lng: -46.63 },
  { nome: 'Belo Horizonte', uf: 'MG', lat: -19.92, lng: -43.94 },
  { nome: 'Porto Velho', uf: 'RO', lat: -8.76, lng: -63.83 },
  { nome: 'Boa Vista', uf: 'RR', lat: 2.82, lng: -60.67 },
  { nome: 'Manaus', uf: 'AM', lat: -3.12, lng: -60.02 },
];
console.log('\nVerification:');
for (const ch of checks) {
  const key = `${normalize(ch.nome)}|${ch.uf}`;
  const found = entries.find(e => normalize(e.nome) === normalize(ch.nome) && e.uf === ch.uf);
  if (found) {
    const latOK = Math.abs(found.lat - ch.lat) < 0.5;
    const lngOK = Math.abs(found.lng - ch.lng) < 0.5;
    console.log(`  ${ch.nome}/${ch.uf}: ${found.lat}, ${found.lng} ${latOK && lngOK ? '✓' : '✗ WRONG!'}`);
  } else {
    console.log(`  ${ch.nome}/${ch.uf}: NOT FOUND`);
  }
}
