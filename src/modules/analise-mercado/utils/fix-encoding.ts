/**
 * Correção de encoding para textos INEP com caracteres corrompidos.
 * Os dados do censo INEP foram importados com encoding Latin-1
 * mas o PostgreSQL esperava UTF-8, substituindo acentos por U+FFFD (�).
 * 
 * Esta função reconhece padrões do português e restaura os acentos.
 */

import { MUNICIPIOS_DICT } from './municipios-dict';

const R = '\uFFFD'; // Replacement character

// ─── Mapeamento de áreas CINE (exatas) ────────────────────────────────
const AREA_MAP: Record<string, string> = {};
const AREAS_CORRETAS = [
  'Educação',
  'Artes e humanidades',
  'Ciências sociais, comunicação e informação',
  'Ciências sociais, jornalismo e informação',
  'Negócios, administração e direito',
  'Ciências naturais, matemática e estatística',
  'Computação e Tecnologias da Informação e Comunicação (TIC)',
  'Engenharia, produção e construção',
  'Agricultura, silvicultura, pesca e veterinária',
  'Saúde e bem-estar',
  'Serviços',
  'Programas básicos',
  'Programas e qualificações interdisciplinares',
];

// Gera chaves "quebradas" removendo acentos e inserindo U+FFFD
function gerarChaveQuebrada(texto: string): string {
  const MAPA_ACENTO: Record<string, string> = {
    'à': R, 'á': R, 'â': R, 'ã': R, 'ä': R,
    'ç': R,
    'è': R, 'é': R, 'ê': R, 'ë': R,
    'ì': R, 'í': R, 'î': R, 'ï': R,
    'ò': R, 'ó': R, 'ô': R, 'õ': R, 'ö': R,
    'ù': R, 'ú': R, 'û': R, 'ü': R,
    'À': R, 'Á': R, 'Â': R, 'Ã': R, 'Ä': R,
    'Ç': R,
    'È': R, 'É': R, 'Ê': R, 'Ë': R,
    'Ì': R, 'Í': R, 'Î': R, 'Ï': R,
    'Ò': R, 'Ó': R, 'Ô': R, 'Õ': R, 'Ö': R,
    'Ù': R, 'Ú': R, 'Û': R, 'Ü': R,
  };
  return [...texto].map(c => MAPA_ACENTO[c] ?? c).join('');
}

// Pre-compute the area map
for (const area of AREAS_CORRETAS) {
  const quebrada = gerarChaveQuebrada(area);
  if (quebrada !== area) {
    AREA_MAP[quebrada] = area;
  }
}

// ─── Padrões de substituição (regex) ──────────────────────────────────
// Dois U+FFFD consecutivos: quase sempre ç + ã (padrão -ção)
const PATTERNS: [RegExp, string][] = [
  // Dois consecutivos: ção / ções
  [new RegExp(`${R}${R}o\\b`, 'g'), 'ção'],
  [new RegExp(`${R}${R}O\\b`, 'g'), 'ÇÃO'],
  [new RegExp(`${R}${R}es\\b`, 'g'), 'ções'],
  [new RegExp(`${R}${R}ES\\b`, 'g'), 'ÇÕES'],

  // ─── Nomes de IES / termos institucionais ────────────────────
  [new RegExp(`UNIVERSIT${R}RIO`, 'g'), 'UNIVERSITÁRIO'],
  [new RegExp(`Universit${R}rio`, 'g'), 'Universitário'],
  [new RegExp(`universit${R}rio`, 'g'), 'universitário'],
  [new RegExp(`UNIVERSIT${R}RIA`, 'g'), 'UNIVERSITÁRIA'],

  [new RegExp(`PIT${R}GORAS`, 'g'), 'PITÁGORAS'],
  [new RegExp(`Pit${R}goras`, 'g'), 'Pitágoras'],

  [new RegExp(`EST${R}CIO`, 'g'), 'ESTÁCIO'],
  [new RegExp(`Est${R}cio`, 'g'), 'Estácio'],

  [new RegExp(`\\bS${R}\\b`, 'g'), 'SÁ'],
  [new RegExp(`\\bs${R}\\b`, 'g'), 'sá'],

  [new RegExp(`TECNOL${R}GIC`, 'g'), 'TECNOLÓGIC'],
  [new RegExp(`Tecnol${R}gic`, 'g'), 'Tecnológic'],
  [new RegExp(`tecnol${R}gic`, 'g'), 'tecnológic'],

  [new RegExp(`PEDAG${R}GIC`, 'g'), 'PEDAGÓGIC'],
  [new RegExp(`Pedag${R}gic`, 'g'), 'Pedagógic'],

  [new RegExp(`CAT${R}LIC`, 'g'), 'CATÓLIC'],
  [new RegExp(`Cat${R}lic`, 'g'), 'Católic'],

  [new RegExp(`EVANG${R}LIC`, 'g'), 'EVANGÉLIC'],
  [new RegExp(`Evang${R}lic`, 'g'), 'Evangélic'],

  [new RegExp(`PRESBIT${R}RIAN`, 'g'), 'PRESBITERIAN'],
  [new RegExp(`Presbit${R}rian`, 'g'), 'Presbiterian'],

  [new RegExp(`METODIST${R}`, 'g'), 'METODISTÁ'],

  [new RegExp(`POLIT${R}CNIC`, 'g'), 'POLITÉCNIC'],
  [new RegExp(`Polit${R}cnic`, 'g'), 'Politécnic'],

  [new RegExp(`ACAD${R}MIC`, 'g'), 'ACADÊMIC'],
  [new RegExp(`Acad${R}mic`, 'g'), 'Acadêmic'],
  [new RegExp(`acad${R}mic`, 'g'), 'acadêmic'],

  [new RegExp(`COM${R}RCIO`, 'g'), 'COMÉRCIO'],
  [new RegExp(`IND${R}STRI`, 'g'), 'INDÚSTRI'],
  [new RegExp(`ind${R}stri`, 'g'), 'indústri'],

  [new RegExp(`AGR${R}COLA`, 'g'), 'AGRÍCOLA'],
  [new RegExp(`Agr${R}cola`, 'g'), 'Agrícola'],
  [new RegExp(`agr${R}cola`, 'g'), 'agrícola'],

  [new RegExp(`AGR${R}RIA`, 'g'), 'AGRÁRIA'],
  [new RegExp(`Agr${R}ria`, 'g'), 'Agrária'],

  [new RegExp(`T${R}CNIC`, 'g'), 'TÉCNIC'],
  [new RegExp(`T${R}cnic`, 'g'), 'Técnic'],
  [new RegExp(`t${R}cnic`, 'g'), 'técnic'],

  [new RegExp(`SUPERIOR${R}`, 'g'), 'SUPERIORÉ'],

  [new RegExp(`\\bAM${R}RICA\\b`, 'g'), 'AMÉRICA'],
  [new RegExp(`\\bAm${R}rica\\b`, 'g'), 'América'],
  [new RegExp(`\\bam${R}rica\\b`, 'g'), 'américa'],

  [new RegExp(`INTEGR${R}D`, 'g'), 'INTEGRAD'],

  [new RegExp(`PAR${R}`, 'g'), 'PARÁ'],
  [new RegExp(`MARANH${R}O`, 'g'), 'MARANHÃO'],
  [new RegExp(`CEAR${R}`, 'g'), 'CEARÁ'],
  [new RegExp(`GOI${R}S`, 'g'), 'GOIÁS'],
  [new RegExp(`PIAU${R}`, 'g'), 'PIAUÍ'],
  [new RegExp(`AMAP${R}`, 'g'), 'AMAPÁ'],
  [new RegExp(`ROND${R}NIA`, 'g'), 'RONDÔNIA'],
  [new RegExp(`PAR${R}NA`, 'g'), 'PARANÁ'],
  [new RegExp(`PARA${R}BA`, 'g'), 'PARAÍBA'],

  [new RegExp(`MUNIC${R}PIO`, 'g'), 'MUNICÍPIO'],
  [new RegExp(`Munic${R}pio`, 'g'), 'Município'],

  [new RegExp(`NEG${R}CIO`, 'g'), 'NEGÓCIO'],

  [new RegExp(`EDU${R}`, 'g'), 'EDUCAÇ'],

  // ─── Palavras específicas originais ──────────────────────────
  [new RegExp(`Sa${R}de`, 'g'), 'Saúde'],
  [new RegExp(`sa${R}de`, 'g'), 'saúde'],
  [new RegExp(`SA${R}DE`, 'g'), 'SAÚDE'],

  [new RegExp(`Ci${R}nci`, 'g'), 'Ciênci'],
  [new RegExp(`ci${R}nci`, 'g'), 'ciênci'],
  [new RegExp(`CI${R}NCI`, 'g'), 'CIÊNCI'],

  [new RegExp(`Neg${R}cio`, 'g'), 'Negócio'],
  [new RegExp(`neg${R}cio`, 'g'), 'negócio'],

  [new RegExp(`Matem${R}tica`, 'g'), 'Matemática'],
  [new RegExp(`matem${R}tica`, 'g'), 'matemática'],

  [new RegExp(`Estat${R}stica`, 'g'), 'Estatística'],
  [new RegExp(`estat${R}stica`, 'g'), 'estatística'],

  [new RegExp(`Veterin${R}ria`, 'g'), 'Veterinária'],
  [new RegExp(`veterin${R}ria`, 'g'), 'veterinária'],

  [new RegExp(`B${R}sic`, 'g'), 'Básic'],
  [new RegExp(`b${R}sic`, 'g'), 'básic'],

  [new RegExp(`F${R}sic`, 'g'), 'Físic'],
  [new RegExp(`f${R}sic`, 'g'), 'físic'],

  [new RegExp(`An${R}lise`, 'g'), 'Análise'],
  [new RegExp(`an${R}lise`, 'g'), 'análise'],

  [new RegExp(`Cont${R}bei`, 'g'), 'Contábei'],
  [new RegExp(`cont${R}bei`, 'g'), 'contábei'],

  [new RegExp(`Ger${R}nci`, 'g'), 'Gerênci'],
  [new RegExp(`ger${R}nci`, 'g'), 'gerênci'],

  [new RegExp(`Log${R}stic`, 'g'), 'Logístic'],
  [new RegExp(`log${R}stic`, 'g'), 'logístic'],

  [new RegExp(`Mec${R}nic`, 'g'), 'Mecânic'],
  [new RegExp(`mec${R}nic`, 'g'), 'mecânic'],

  [new RegExp(`Qu${R}mic`, 'g'), 'Químic'],
  [new RegExp(`qu${R}mic`, 'g'), 'químic'],

  [new RegExp(`Biol${R}gi`, 'g'), 'Biológi'],  
  [new RegExp(`biol${R}gi`, 'g'), 'biológi'],

  [new RegExp(`Hist${R}ri`, 'g'), 'Históri'],
  [new RegExp(`hist${R}ri`, 'g'), 'históri'],

  [new RegExp(`Geogr${R}fi`, 'g'), 'Geográfi'],
  [new RegExp(`geogr${R}fi`, 'g'), 'geográfi'],

  [new RegExp(`Farm${R}ci`, 'g'), 'Farmáci'],
  [new RegExp(`farm${R}ci`, 'g'), 'farmáci'],

  [new RegExp(`Nutri${R}`, 'g'), 'Nutriç'],
  [new RegExp(`nutri${R}`, 'g'), 'nutriç'],

  [new RegExp(`Est${R}tic`, 'g'), 'Estétic'],
  [new RegExp(`est${R}tic`, 'g'), 'estétic'],

  [new RegExp(`Agron${R}mi`, 'g'), 'Agronômi'],
  [new RegExp(`agron${R}mi`, 'g'), 'agronômi'],

  [new RegExp(`Econ${R}mi`, 'g'), 'Econômi'],
  [new RegExp(`econ${R}mi`, 'g'), 'econômi'],

  [new RegExp(`Com${R}rcio`, 'g'), 'Comércio'],
  [new RegExp(`com${R}rcio`, 'g'), 'comércio'],

  [new RegExp(`Pedag${R}gi`, 'g'), 'Pedagógi'],
  [new RegExp(`pedag${R}gi`, 'g'), 'pedagógi'],

  [new RegExp(`Tecnol${R}gi`, 'g'), 'Tecnológi'],
  [new RegExp(`tecnol${R}gi`, 'g'), 'tecnológi'],

  [new RegExp(`Odontol${R}gi`, 'g'), 'Odontológi'],
  [new RegExp(`odontol${R}gi`, 'g'), 'odontológi'],

  [new RegExp(`Sociol${R}gi`, 'g'), 'Sociológi'],
  [new RegExp(`sociol${R}gi`, 'g'), 'sociológi'],

  [new RegExp(`Filos${R}fi`, 'g'), 'Filosófi'],
  [new RegExp(`filos${R}fi`, 'g'), 'filosófi'],

  [new RegExp(`Matem${R}ti`, 'g'), 'Matemáti'],
  [new RegExp(`matem${R}ti`, 'g'), 'matemáti'],

  [new RegExp(`Tur${R}sm`, 'g'), 'Turísm'],
  [new RegExp(`tur${R}sm`, 'g'), 'turísm'],

  [new RegExp(`Rel${R}gi`, 'g'), 'Relógi'],
  
  [new RegExp(`M${R}sic`, 'g'), 'Músic'],
  [new RegExp(`m${R}sic`, 'g'), 'músic'],

  [new RegExp(`Jur${R}dic`, 'g'), 'Jurídic'],
  [new RegExp(`jur${R}dic`, 'g'), 'jurídic'],

  [new RegExp(`El${R}tric`, 'g'), 'Elétric'],
  [new RegExp(`el${R}tric`, 'g'), 'elétric'],

  [new RegExp(`Eletr${R}nic`, 'g'), 'Eletrônic'],
  [new RegExp(`eletr${R}nic`, 'g'), 'eletrônic'],

  [new RegExp(`Rob${R}tic`, 'g'), 'Robótic'],
  [new RegExp(`rob${R}tic`, 'g'), 'robótic'],

  [new RegExp(`Aer${R}n`, 'g'), 'Aerón'],
  [new RegExp(`aer${R}n`, 'g'), 'aerón'],

  [new RegExp(`Pecu${R}ri`, 'g'), 'Pecuári'],
  [new RegExp(`pecu${R}ri`, 'g'), 'pecuári'],

  [new RegExp(`Sanit${R}ri`, 'g'), 'Sanitári'],
  [new RegExp(`sanit${R}ri`, 'g'), 'sanitári'],

  [new RegExp(`Secr${R}ri`, 'g'), 'Secretári'],
  
  // Padrões genéricos para nomes de municípios
  [new RegExp(`${R}ndia`, 'g'), 'ândia'],    // Uberlândia, Fernandópolis → Uberlândia
  [new RegExp(`${R}polis`, 'g'), 'ópolis'],   // Florianópolis
  [new RegExp(`${R}nia`, 'g'), 'ônia'],       // Rondônia  
  [new RegExp(`${R}lia`, 'g'), 'ália'],       // Itália, Brasília → ália
  [new RegExp(`Bras${R}lia`, 'g'), 'Brasília'],
  [new RegExp(`Goi${R}nia`, 'g'), 'Goiânia'],
  [new RegExp(`Curi${R}iba`, 'g'), 'Curitiba'], // just in case
  [new RegExp(`Maring${R}`, 'g'), 'Maringá'],
  [new RegExp(`Maca${R}`, 'g'), 'Macaé'],
  [new RegExp(`S${R}o\\b`, 'g'), 'São'],
  [new RegExp(`Jo${R}o\\b`, 'g'), 'João'],
  [new RegExp(`Cear${R}`, 'g'), 'Ceará'],  
  [new RegExp(`Paran${R}`, 'g'), 'Paraná'],
  [new RegExp(`Maranh${R}o`, 'g'), 'Maranhão'],
  [new RegExp(`Te${R}filo`, 'g'), 'Teófilo'],
  [new RegExp(`Ribeir${R}o`, 'g'), 'Ribeirão'],
  [new RegExp(`Rond${R}nia`, 'g'), 'Rondônia'],
  [new RegExp(`${R}guas`, 'g'), 'Águas'],  
  [new RegExp(`Itajub${R}`, 'g'), 'Itajubá'],
  [new RegExp(`Lon${R}ncia`, 'g'), 'Lonência'],
  [new RegExp(`Po${R}os`, 'g'), 'Poços'],
  [new RegExp(`po${R}os`, 'g'), 'poços'],
  [new RegExp(`A${R}ail`, 'g'), 'Açail'],       // Açailândia
  [new RegExp(`Ira${R}`, 'g'), 'Iraç'],          // Iracemápolis etc
  [new RegExp(`Cama${R}ari`, 'g'), 'Camaçari'],
  [new RegExp(`Balne${R}rio`, 'g'), 'Balneário'],
  [new RegExp(`Jabo${R}t`, 'g'), 'Jabotá'],      // Jaboatão → Não; depende
  [new RegExp(`Ima${R}a`, 'g'), 'Imaçã'],        // raro
  [new RegExp(`Gua${R}u`, 'g'), 'Guaçu'],        // Mogi Guaçu
  [new RegExp(`A${R}u`, 'g'), 'Açu'],             // Mossoró do Açu, Açu
  [new RegExp(`La${R}e`, 'g'), 'Lage'],           // Lage... raro 
  [new RegExp(`Cru${R}eiro`, 'g'), 'Cruzeiro'],   // raro mas safe
  [new RegExp(`Jundi${R}`, 'g'), 'Jundiaí'],      // hmm, could be Jundiaí
  [new RegExp(`Itape${R}`, 'g'), 'Itapecé'],      // hmm
  [new RegExp(`Gua${R}ba`, 'g'), 'Guaíba'],
  [new RegExp(`Para${R}ba`, 'g'), 'Paraíba'],
  [new RegExp(`Tatu${R}`, 'g'), 'Tatuí'],
  [new RegExp(`Ja${R}`, 'g'), 'Jaú'],
  [new RegExp(`Bag${R}`, 'g'), 'Bagé'],
  [new RegExp(`Ub${R}`, 'g'), 'Ubá'],
  [new RegExp(`Grav${R}ta`, 'g'), 'Gravata'],     // Gravataí → Grav + at + á
  [new RegExp(`Igua${R}u`, 'g'), 'Iguaçu'],
  [new RegExp(`Pal${R}cia`, 'g'), 'Palência'],
  [new RegExp(`Parna${R}ba`, 'g'), 'Parnaíba'],
  [new RegExp(`Niter${R}i`, 'g'), 'Niterói'],
  [new RegExp(`Itabora${R}`, 'g'), 'Itaboraí'],
  [new RegExp(`Sapuca${R}`, 'g'), 'Sapucaí'],
  [new RegExp(`Ara${R}atuba`, 'g'), 'Araçatuba'],
  [new RegExp(`Cara${R}as`, 'g'), 'Caraças'],
  [new RegExp(`Teres${R}polis`, 'g'), 'Teresópolis'],
  [new RegExp(`Petr${R}polis`, 'g'), 'Petrópolis'],
  [new RegExp(`Heli${R}polis`, 'g'), 'Heliópolis'],
  [new RegExp(`Cosm${R}polis`, 'g'), 'Cosmópolis'],
  [new RegExp(`Ita${R}na`, 'g'), 'Itaúna'],
  [new RegExp(`Arax${R}`, 'g'), 'Araxá'],
  [new RegExp(`Par${R} `, 'g'), 'Pará '],
  [new RegExp(`Par${R}$`, 'g'), 'Pará'],
  [new RegExp(`Amap${R}`, 'g'), 'Amapá'],
  [new RegExp(`Cuiab${R}`, 'g'), 'Cuiabá'],
  [new RegExp(`Macap${R}`, 'g'), 'Macapá'],
  [new RegExp(`Curi${R}ba`, 'g'), 'Curitiba'],  
  [new RegExp(`Florian${R}polis`, 'g'), 'Florianópolis'],
  [new RegExp(`Vit${R}ria`, 'g'), 'Vitória'],
  [new RegExp(`Aracaj${R}`, 'g'), 'Aracajú'],
  [new RegExp(`Manau${R}`, 'g'), 'Manaus'],       // raro
  [new RegExp(`Bel${R}m`, 'g'), 'Belém'],
  [new RegExp(`Santar${R}m`, 'g'), 'Santarém'],
  [new RegExp(`Maring${R}`, 'g'), 'Maringá'],
  [new RegExp(`Londrin${R}`, 'g'), 'Londrin'],     // raro, Londrina is fine
  [new RegExp(`Joa${R}aba`, 'g'), 'Joaçaba'],
  [new RegExp(`Ara${R}aj${R}`, 'g'), 'Aracajú'],
  [new RegExp(`Crate${R}s`, 'g'), 'Crateús'],
  [new RegExp(`Campi${R}as`, 'g'), 'Campinas'],   // raro — usually fine
  [new RegExp(`Parana${R}ba`, 'g'), 'Paranaíba'],
  [new RegExp(`Pra${R}a`, 'g'), 'Praça'],
  [new RegExp(`In${R}cio`, 'g'), 'Inácio'],
  [new RegExp(`Gon${R}alves`, 'g'), 'Gonçalves'],
  [new RegExp(`Conce${R}`, 'g'), 'Conceiç'],      // Conceição → Conce + ição
  [new RegExp(`Pal${R}o`, 'g'), 'Palço'],          // raro
  [new RegExp(`Jequi${R}`, 'g'), 'Jequié'],
  [new RegExp(`Ilh${R}us`, 'g'), 'Ilhéus'],
  [new RegExp(`Nazar${R}`, 'g'), 'Nazaré'],
  [new RegExp(`V${R}rzea`, 'g'), 'Várzea'],
  [new RegExp(`v${R}rzea`, 'g'), 'várzea'],
  [new RegExp(`Tup${R}`, 'g'), 'Tupã'],
  [new RegExp(`Ga${R}cho`, 'g'), 'Gaúcho'],
  [new RegExp(`Gua${R}ra`, 'g'), 'Guaíra'],       // Guaíra, etc
  [new RegExp(`\\bI${R}\\b`, 'g'), 'Içá'],         // raro
  [new RegExp(`Ja${R}ar`, 'g'), 'Jaçar'],          // Jacarepaguá etc
  [new RegExp(`Camb${R}`, 'g'), 'Cambé'],
  [new RegExp(`Cascav${R}l`, 'g'), 'Cascavél'],    // usually Cascavel, but in case
  [new RegExp(`Pati${R}`, 'g'), 'Patiç'],          // raro

  // Padrões genéricos: ç antes de vogal
  [new RegExp(`${R}os\\b`, 'g'), 'ços'],     // Poços, Paços, etc
  [new RegExp(`${R}as\\b`, 'g'), 'ças'],     // Praças, Forças
  [new RegExp(`${R}a\\b`, 'g'), 'ça'],       // Praça, Força
  [new RegExp(`${R}o\\b`, 'g'), 'ço'],       // Palço, Aço
  [new RegExp(`${R}u\\b`, 'g'), 'çu'],       // Açu, Iguaçu  

  // Padrões genéricos restantes (último recurso)
  [new RegExp(`${R}vel\\b`, 'g'), 'ável'],
  [new RegExp(`${R}rio\\b`, 'g'), 'ário'],
  [new RegExp(`${R}ria\\b`, 'g'), 'ária'],
  [new RegExp(`${R}rios\\b`, 'g'), 'ários'],
  [new RegExp(`${R}rias\\b`, 'g'), 'árias'],
  [new RegExp(`${R}tico\\b`, 'g'), 'ático'],
  [new RegExp(`${R}tica\\b`, 'g'), 'ática'],
  [new RegExp(`${R}ticos\\b`, 'g'), 'áticos'],
  [new RegExp(`${R}ticas\\b`, 'g'), 'áticas'],
];

/**
 * Corrige texto com encoding quebrado do INEP.
 * Substitui U+FFFD por caracteres acentuados corretos.
 */
export function fixText(text: string): string {
  if (!text || !text.includes(R)) return text;

  // 1. Dicionário exato de municípios (2282 entradas IBGE)
  if (MUNICIPIOS_DICT[text]) return MUNICIPIOS_DICT[text];

  // 2. Mapeamento exato de áreas CINE
  if (AREA_MAP[text]) return AREA_MAP[text];

  // 3. Aplicar padrões regex em sequência
  let fixed = text;
  for (const [pattern, replacement] of PATTERNS) {
    fixed = fixed.replace(pattern, replacement);
  }

  return fixed;
}
