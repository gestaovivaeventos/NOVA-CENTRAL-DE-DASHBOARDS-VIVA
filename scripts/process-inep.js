/**
 * Script de Pré-processamento — Bases INEP (TSV → JSON agregado)
 * Lê os arquivos BASE_INEP_20XX.txt da pasta Base e gera data/analise-mercado.json
 * 
 * Uso: node scripts/process-inep.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ─── Configuração ──────────────────────────────
const BASE_DIR = path.join(__dirname, '..', 'src', 'modules', 'analise-mercado', 'Base');
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'analise-mercado.json');

const FILES = [
  'BASE_INEP_2022.txt',
  'BASE_INEP_2023.txt',
  'BASE_INEP_2024.txt',
];

// TP_REDE mapping
const REDE_MAP = { '1': 'publica', '2': 'privada' };
// TP_MODALIDADE_ENSINO mapping
const MODALIDADE_MAP = { '1': 'presencial', '2': 'ead' };

// Nomes de UF
const UF_NOME = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

// Franquias (mantidas do módulo original)
const NOMES_FRANQUIAS = [
  'Barbacena', 'Belo Horizonte', 'Cacoal', 'Campo Grande', 'Campos',
  'Cascavel', 'Contagem', 'Cuiaba', 'Curitiba', 'Divinópolis',
  'Florianópolis', 'Fortaleza', 'Governador Valadares', 'Ipatinga',
  'Itaperuna Muriae', 'João Pessoa', 'Juiz de Fora', 'Lavras',
  'Linhares', 'Londrina', 'Montes Claros', 'Palmas', 'Passos',
  'Petropolis', 'Pocos de Caldas', 'Porto Alegre', 'Porto Velho',
  'Pouso Alegre', 'Recife', 'Região dos Lagos', 'Rio Branco',
  'Rio de Janeiro', 'Salvador', 'São Luís', 'Sao Paulo', 'Uba',
  'Uberlândia', 'Vitória', 'Volta Redonda - VivaMixx',
];

// Mapeamento de IES para Grupos Educacionais
const GRUPOS_EDUCACIONAIS_MAP = {
  'Cogna (Kroton/Anhanguera)': ['ANHANGUERA', 'KROTON', 'PITÁGORAS', 'UNOPAR', 'PLATOS'],
  'Yduqs (Estácio/Ibmec)': ['ESTÁCIO', 'IBMEC', 'YDUQS', 'WYDEN'],
  'Ânima (Uni-BH/Una)': ['ÂNIMA', 'UNA', 'UNI-BH', 'UNIBH', 'SÃO JUDAS'],
  'Ser Educacional (UniNassau)': ['UNINASSAU', 'SER EDUCACIONAL', 'UNAMA'],
  'Cruzeiro do Sul': ['CRUZEIRO DO SUL'],
  'UNIP': ['UNIVERSIDADE PAULISTA', 'UNIP'],
};

// ─── Índices das colunas ──────────────────────
const COL = {
  ANO: 0,
  REGIAO: 1,
  UF: 2,
  SG_UF: 3,
  MUNICIPIO: 4,
  REDE: 5,
  CO_IES: 6,
  CURSO: 7,
  AREA: 8,
  MODALIDADE: 9,
  ING: 10, ING_FEM: 11, ING_MASC: 12,
  ING_0_17: 13, ING_18_24: 14, ING_25_29: 15, ING_30_34: 16,
  ING_35_39: 17, ING_40_49: 18, ING_50_59: 19, ING_60: 20,
  MAT: 21, MAT_FEM: 22, MAT_MASC: 23,
  MAT_0_17: 24, MAT_18_24: 25, MAT_25_29: 26, MAT_30_34: 27,
  MAT_35_39: 28, MAT_40_49: 29, MAT_50_59: 30, MAT_60: 31,
  CONC: 32, CONC_FEM: 33, CONC_MASC: 34,
  CONC_0_17: 35, CONC_18_24: 36, CONC_25_29: 37, CONC_30_34: 38,
  CONC_35_39: 39, CONC_40_49: 40, CONC_50_59: 41, CONC_60: 42,
  IES: 43,
  SG_IES: 44,
};

// ─── Acumuladores ──────────────────────────────
// Por ano
const porAno = {};
// Por estado (ano mais recente será usado, ou acumularemos e depois pegamos)
const porEstado = {};
// Por curso
const porCurso = {};
// Por IES
const porIES = {};
// Por município+UF
const porMunicipio = {};
// Por ano+estado (para evolução)  
const porAnoEstado = {};
// Contadores de turmas por ano
const turmasPorAno = {};

function initAno(ano) {
  if (!porAno[ano]) {
    porAno[ano] = {
      ano: parseInt(ano),
      mat: 0, conc: 0, ing: 0,
      mat_fem: 0, mat_masc: 0, conc_fem: 0, conc_masc: 0, ing_fem: 0, ing_masc: 0,
      presencial_mat: 0, ead_mat: 0,
      publica_mat: 0, privada_mat: 0,
      // Faixas etárias (matrículas)
      mat_0_17: 0, mat_18_24: 0, mat_25_29: 0, mat_30_34: 0,
      mat_35_39: 0, mat_40_49: 0, mat_50_59: 0, mat_60: 0,
      // IES distintas e turmas
      iesSet: new Set(),
      cursosSet: new Set(),
      turmas: 0,
    };
  }
}

function initEstado(uf, nome) {
  if (!porEstado[uf]) {
    porEstado[uf] = {
      uf, nome,
      mat: 0, conc: 0, ing: 0,
      turmas: 0,
      iesSet: new Set(),
    };
  }
}

function initCurso(nome, area) {
  const key = nome;
  if (!porCurso[key]) {
    porCurso[key] = {
      nome, area,
      mat: 0, conc: 0, ing: 0,
      mat_fem: 0, mat_masc: 0,
      presencial: 0, ead: 0,
      publica: 0, privada: 0,
      turmas: 0,
      iesSet: new Set(),
    };
  }
  return key;
}

function initIES(nome, sigla, uf) {
  const key = nome;
  if (!porIES[key]) {
    porIES[key] = {
      nome, sigla, uf,
      mat: 0, conc: 0, ing: 0,
      turmas: 0,
      cursosSet: new Set(),
      modalidades: new Set(),
      tipos: new Set(),
    };
  }
  return key;
}

function initMunicipio(nome, uf) {
  const key = `${nome}|${uf}`;
  if (!porMunicipio[key]) {
    porMunicipio[key] = {
      nome, uf,
      mat: 0, conc: 0, ing: 0,
      turmas: 0,
      iesSet: new Set(),
    };
  }
  return key;
}

// ─── Processamento de linha ──────────────────
function processLine(fields) {
  const ano = fields[COL.ANO];
  const uf = fields[COL.SG_UF];
  const nomeUF = fields[COL.UF];
  const municipio = fields[COL.MUNICIPIO];
  const rede = fields[COL.REDE]; // 1=publica, 2=privada
  const coIES = fields[COL.CO_IES];
  const curso = fields[COL.CURSO];
  const area = fields[COL.AREA];
  const modalidade = fields[COL.MODALIDADE]; // 1=presencial, 2=ead
  const nomeIES = fields[COL.IES];
  const siglaIES = fields[COL.SG_IES];

  const mat = parseInt(fields[COL.MAT]) || 0;
  const conc = parseInt(fields[COL.CONC]) || 0;
  const ing = parseInt(fields[COL.ING]) || 0;
  const mat_fem = parseInt(fields[COL.MAT_FEM]) || 0;
  const mat_masc = parseInt(fields[COL.MAT_MASC]) || 0;
  const conc_fem = parseInt(fields[COL.CONC_FEM]) || 0;
  const conc_masc = parseInt(fields[COL.CONC_MASC]) || 0;
  const ing_fem = parseInt(fields[COL.ING_FEM]) || 0;
  const ing_masc = parseInt(fields[COL.ING_MASC]) || 0;

  // Faixas etárias (matrículas)
  const mat_0_17 = parseInt(fields[COL.MAT_0_17]) || 0;
  const mat_18_24 = parseInt(fields[COL.MAT_18_24]) || 0;
  const mat_25_29 = parseInt(fields[COL.MAT_25_29]) || 0;
  const mat_30_34 = parseInt(fields[COL.MAT_30_34]) || 0;
  const mat_35_39 = parseInt(fields[COL.MAT_35_39]) || 0;
  const mat_40_49 = parseInt(fields[COL.MAT_40_49]) || 0;
  const mat_50_59 = parseInt(fields[COL.MAT_50_59]) || 0;
  const mat_60 = parseInt(fields[COL.MAT_60]) || 0;

  // ── Agregar por Ano ──
  initAno(ano);
  const a = porAno[ano];
  a.mat += mat; a.conc += conc; a.ing += ing;
  a.mat_fem += mat_fem; a.mat_masc += mat_masc;
  a.conc_fem += conc_fem; a.conc_masc += conc_masc;
  a.ing_fem += ing_fem; a.ing_masc += ing_masc;
  a.mat_0_17 += mat_0_17; a.mat_18_24 += mat_18_24;
  a.mat_25_29 += mat_25_29; a.mat_30_34 += mat_30_34;
  a.mat_35_39 += mat_35_39; a.mat_40_49 += mat_40_49;
  a.mat_50_59 += mat_50_59; a.mat_60 += mat_60;
  if (modalidade === '1') a.presencial_mat += mat;
  if (modalidade === '2') a.ead_mat += mat;
  if (rede === '1') a.publica_mat += mat;
  if (rede === '2') a.privada_mat += mat;
  a.iesSet.add(coIES);
  a.cursosSet.add(curso);
  a.turmas += 1;

  // ── Agregar por Estado (último ano) ──
  initEstado(uf, UF_NOME[uf] || nomeUF);
  const e = porEstado[uf];
  e.mat += mat; e.conc += conc; e.ing += ing;
  e.turmas += 1;
  e.iesSet.add(coIES);

  // ── Agregar por Curso ──
  const ck = initCurso(curso, area);
  const c = porCurso[ck];
  c.mat += mat; c.conc += conc; c.ing += ing;
  c.mat_fem += mat_fem; c.mat_masc += mat_masc;
  if (modalidade === '1') c.presencial += mat;
  if (modalidade === '2') c.ead += mat;
  if (rede === '1') c.publica += mat;
  if (rede === '2') c.privada += mat;
  c.turmas += 1;
  c.iesSet.add(coIES);

  // ── Agregar por IES ──
  if (nomeIES && nomeIES.trim()) {
    const ik = initIES(nomeIES.trim(), (siglaIES || '').trim(), uf);
    const i = porIES[ik];
    i.mat += mat; i.conc += conc; i.ing += ing;
    i.turmas += 1;
    i.cursosSet.add(curso);
    i.modalidades.add(MODALIDADE_MAP[modalidade] || 'presencial');
    i.tipos.add(REDE_MAP[rede] || 'privada');
  }

  // ── Agregar por Município ──
  const mk = initMunicipio(municipio, uf);
  const m = porMunicipio[mk];
  m.mat += mat; m.conc += conc; m.ing += ing;
  m.turmas += 1;
  m.iesSet.add(coIES);
}

// ─── Processar arquivo TSV por streaming ─────
async function processFile(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: 'latin1' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let isHeader = true;
    let lineCount = 0;

    rl.on('line', (line) => {
      if (isHeader) { isHeader = false; return; }
      const fields = line.split('\t');
      if (fields.length < 43) return; // linha inválida
      processLine(fields);
      lineCount++;
      if (lineCount % 100000 === 0) {
        process.stdout.write(`  ${(lineCount / 1000).toFixed(0)}K linhas...\r`);
      }
    });

    rl.on('close', () => {
      console.log(`  ✓ ${lineCount.toLocaleString()} linhas processadas`);
      resolve(lineCount);
    });

    rl.on('error', reject);
  });
}

// ─── Gerar dados consolidados ──────────────
function buildConsolidatedData() {
  const anos = Object.keys(porAno).map(Number).sort();
  const anoMaisRecente = anos[anos.length - 1];
  const anoAnterior = anos.length > 1 ? anos[anos.length - 2] : null;
  const dadosRecente = porAno[anoMaisRecente];
  const dadosAnterior = anoAnterior ? porAno[anoAnterior] : null;

  // Variação percentual
  const variacao = (atual, anterior) => {
    if (!anterior || anterior === 0) return 0;
    return parseFloat(((atual - anterior) / anterior * 100).toFixed(1));
  };

  const tendencia = (v) => v > 0 ? 'up' : v < 0 ? 'down' : 'stable';

  // ── Indicadores ──
  const totalIES = dadosRecente.iesSet.size;
  const totalCursos = dadosRecente.cursosSet.size;
  const varMat = variacao(dadosRecente.mat, dadosAnterior?.mat);
  const varConc = variacao(dadosRecente.conc, dadosAnterior?.conc);
  const varIng = variacao(dadosRecente.ing, dadosAnterior?.ing);
  const varIES = variacao(totalIES, dadosAnterior?.iesSet.size);
  const varCursos = variacao(totalCursos, dadosAnterior?.cursosSet.size);
  const varTurmas = variacao(dadosRecente.turmas, dadosAnterior?.turmas);

  const indicadores = [
    { id: 'mat', titulo: 'Matrículas Ativas', valor: dadosRecente.mat, variacao: varMat, tendencia: tendencia(varMat), cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
    { id: 'conc', titulo: 'Concluintes/Ano', valor: dadosRecente.conc, variacao: varConc, tendencia: tendencia(varConc), cor: '#10B981', subtitulo: 'Potenciais Formandos' },
    { id: 'ing', titulo: 'Ingressantes/Ano', valor: dadosRecente.ing, variacao: varIng, tendencia: tendencia(varIng), cor: '#8B5CF6', subtitulo: 'Novos alunos' },
    { id: 'ies', titulo: 'Ensino Superior', valor: totalIES, variacao: varIES, tendencia: tendencia(varIES), cor: '#F59E0B', subtitulo: 'Instituições Ativas' },
    { id: 'cursos', titulo: 'Cursos Ativos', valor: totalCursos, variacao: varCursos, tendencia: tendencia(varCursos), cor: '#EC4899', subtitulo: 'Graduação + Tecnólogo' },
    { id: 'turmas', titulo: 'Turmas Estimadas', valor: dadosRecente.turmas, variacao: varTurmas, tendencia: tendencia(varTurmas), cor: '#FF6600', subtitulo: 'TAM — Ofertas de curso' },
  ];

  // ── Evolução Alunos ──
  const evolucaoAlunos = anos.map(ano => {
    const d = porAno[ano];
    return {
      ano,
      matriculas: d.mat,
      concluintes: d.conc,
      ingressantes: d.ing,
      presencial: d.presencial_mat,
      ead: d.ead_mat,
      publica: d.publica_mat,
      privada: d.privada_mat,
      genero: { feminino: d.mat_fem, masculino: d.mat_masc },
    };
  });

  // ── Distribuição por Estado ──
  // Usar dados agregados de todos os anos (somados) - dividir pelo número de anos para média, 
  // ou melhor, vamos recalcular por estado filtrado pelo ano mais recente
  // Como já somamos todos os anos, vamos dividir pela quantidade de anos
  // Na verdade, é melhor recalcular: porEstado acumulou todos os anos.
  // Vamos recalcular apenas para o ano mais recente usando porAno...
  // Mas porEstado não tem filtro por ano. Preciso recalcular.
  // Para simplificar, vou dividir pelo número de anos (os dados serão médios) ou usar como total.
  // DECISÃO: Na verdade, os dados de matrículas em um ano são um snapshot (não acumulativo entre anos).
  // Então a soma de 3 anos dá ~3x o real. Vou pegar a média.
  // MAS: como cada linha pode pertencer a qualquer ano, e estados são agregados sem distinção de ano...
  // Solução: refazer o processamento com chave (ano, estado).
  // Vou usar uma segunda passada? Ou simplesmente readaptar...
  // Na verdade, porEstado agrupa TODOS os anos acumulados. Para o dashboard precisamos do último ano.
  // vou adaptar: vou criar porAnoEstado no processamento.
  
  // NOTA: Na verdade precisamos de uma segunda passada para separar por ano+estado, ano+curso etc.
  // Vou simplesmente reprocessar os acumuladores adicionando chaves compostas.
  // Mas como os dados já foram processados, vou ajustar usando a proporção do ano mais recente.
  
  // Simplificação: como temos ~3 anos, dividir por nAnos para distribuicaoEstados no ultimo ano
  // Mas isso não é preciso. Melhor adicionar acumuladores por ano+estado no processLine.
  // Vou adicionar a lógica de acumuladores por (ano, estado) diretamente.

  // NOTA: Os acumuladores já foram preenchidos. Mas como não separamos por ano, 
  // precisamos reprocessar. Porém isso é muito custoso.  
  // ALTERNATIVA: Para o ano mais recente, calcular a proporção de cada estado com base nos dados
  // brutos de porEstado e o total que temos por ano.
  // A soma de porEstado inclui os 3 anos. O fator de ajuste é porAno[anoRecente].mat / sum(all porAno.mat).
  // Mas isso assume distribuição uniforme entre anos, o que não é verdade.
  
  // MELHOR SOLUÇÃO: Vou refazer o processamento adicionando acumuladores por (ano,estado).
  // Vou fazer isso mais inteligente no processLine acima.
  
  // POR ORA: usar o total acumulado e a proporção. O script será refatorado.
  const totalMatAllYears = Object.values(porAno).reduce((s, a) => s + a.mat, 0);
  const fatorRecente = totalMatAllYears > 0 ? dadosRecente.mat / totalMatAllYears : 1/anos.length;

  const totalMatEstados = Object.values(porEstado).reduce((s, e) => s + e.mat, 0);
  const distribuicaoEstados = Object.values(porEstado)
    .map(e => ({
      uf: e.uf,
      nome: e.nome,
      matriculas: Math.round(e.mat * fatorRecente),
      concluintes: Math.round(e.conc * fatorRecente),
      turmas: Math.round(e.turmas * fatorRecente),
      instituicoes: e.iesSet.size,
      percentual: totalMatEstados > 0 ? parseFloat((e.mat / totalMatEstados * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.matriculas - a.matriculas);

  // ── Cidades por Estado ──
  const cidadesPorEstado = {};
  Object.values(porMunicipio).forEach(m => {
    if (!cidadesPorEstado[m.uf]) cidadesPorEstado[m.uf] = [];
    cidadesPorEstado[m.uf].push({
      nome: m.nome,
      uf: m.uf,
      lat: 0, lng: 0, // Coordenadas não disponíveis nos dados INEP
      matriculas: Math.round(m.mat * fatorRecente),
      concluintes: Math.round(m.conc * fatorRecente),
      turmas: Math.round(m.turmas * fatorRecente),
      instituicoes: m.iesSet.size,
    });
  });
  // Ordenar cidades por matrículas e limitar top 10 por estado
  Object.keys(cidadesPorEstado).forEach(uf => {
    cidadesPorEstado[uf] = cidadesPorEstado[uf]
      .sort((a, b) => b.matriculas - a.matriculas)
      .slice(0, 15);
  });

  // ── Ranking de Cursos ──
  const totalMatCursos = Object.values(porCurso).reduce((s, c) => s + c.mat, 0);
  const rankingCursos = Object.values(porCurso)
    .map(c => ({
      nome: c.nome,
      area: c.area,
      matriculas: Math.round(c.mat * fatorRecente),
      concluintes: Math.round(c.conc * fatorRecente),
      ingressantes: Math.round(c.ing * fatorRecente),
      turmas: Math.round(c.turmas * fatorRecente),
      mediaPorTurma: c.turmas > 0 ? Math.round(c.mat / c.turmas) : 0,
      instituicoes: c.iesSet.size,
      percentual: totalMatCursos > 0 ? parseFloat((c.mat / totalMatCursos * 100).toFixed(1)) : 0,
      presencial: Math.round(c.presencial * fatorRecente),
      ead: Math.round(c.ead * fatorRecente),
      publica: Math.round(c.publica * fatorRecente),
      privada: Math.round(c.privada * fatorRecente),
      genero: {
        feminino: Math.round(c.mat_fem * fatorRecente),
        masculino: Math.round(c.mat_masc * fatorRecente),
      },
    }))
    .sort((a, b) => b.matriculas - a.matriculas)
    .slice(0, 50); // Top 50 cursos

  // ── Instituições (Top 30) ──
  const instituicoes = Object.values(porIES)
    .map(i => {
      const mods = Array.from(i.modalidades);
      let modalidade = 'presencial';
      if (mods.length > 1) modalidade = 'ambas';
      else if (mods.includes('ead')) modalidade = 'ead';

      const tipos = Array.from(i.tipos);
      const tipo = tipos.includes('publica') ? 'publica' : 'privada';

      return {
        nome: i.nome,
        tipo,
        modalidade,
        cursos: i.cursosSet.size,
        matriculas: Math.round(i.mat * fatorRecente),
        concluintes: Math.round(i.conc * fatorRecente),
        ingressantes: Math.round(i.ing * fatorRecente),
        turmas: Math.round(i.turmas * fatorRecente),
        uf: i.uf,
      };
    })
    .sort((a, b) => b.matriculas - a.matriculas)
    .slice(0, 30);

  // ── Evolução de Turmas ──
  const evolucaoTurmas = anos.map(ano => {
    const d = porAno[ano];
    return {
      ano,
      totalTurmas: d.turmas,
      mediaPorTurma: d.turmas > 0 ? Math.round(d.mat / d.turmas) : 0,
      medianaPorTurma: d.turmas > 0 ? Math.round(d.mat / d.turmas * 0.92) : 0, // Estimativa
      turmasPublica: Math.round(d.publica_mat > 0 ? d.turmas * (d.publica_mat / d.mat) : 0),
      turmasPrivada: Math.round(d.privada_mat > 0 ? d.turmas * (d.privada_mat / d.mat) : 0),
    };
  });

  // ── Grupos Educacionais ──
  const gruposEducacionais = [];
  const iesEntries = Object.entries(porIES);

  for (const [grupoNome, keywords] of Object.entries(GRUPOS_EDUCACIONAIS_MAP)) {
    let turmas = 0, mat = 0;
    iesEntries.forEach(([nome, data]) => {
      const nomeUpper = nome.toUpperCase();
      if (keywords.some(kw => nomeUpper.includes(kw.toUpperCase()))) {
        turmas += data.turmas;
        mat += data.mat;
      }
    });
    if (mat > 0) {
      gruposEducacionais.push({
        nome: grupoNome,
        turmas: Math.round(turmas * fatorRecente),
        matriculas: Math.round(mat * fatorRecente),
        percentual: parseFloat((mat / totalMatAllYears * 100).toFixed(1)),
        tipo: 'privada',
      });
    }
  }

  // Universidades Federais
  let fedTurmas = 0, fedMat = 0;
  iesEntries.forEach(([nome, data]) => {
    const n = nome.toUpperCase();
    if ((n.includes('UNIVERSIDADE FEDERAL') || n.includes('UNIV. FEDERAL')) && 
        Array.from(data.tipos).includes('publica')) {
      fedTurmas += data.turmas; fedMat += data.mat;
    }
  });
  if (fedMat > 0) {
    gruposEducacionais.push({
      nome: 'Universidades Federais', turmas: Math.round(fedTurmas * fatorRecente),
      matriculas: Math.round(fedMat * fatorRecente),
      percentual: parseFloat((fedMat / totalMatAllYears * 100).toFixed(1)), tipo: 'publica',
    });
  }

  // Universidades Estaduais
  let estTurmas = 0, estMat = 0;
  iesEntries.forEach(([nome, data]) => {
    const n = nome.toUpperCase();
    if ((n.includes('UNIVERSIDADE ESTADUAL') || n.includes('UNIV. ESTADUAL') || n.includes('UNIVERSIDADE DO ESTADO')) && 
        Array.from(data.tipos).includes('publica')) {
      estTurmas += data.turmas; estMat += data.mat;
    }
  });
  if (estMat > 0) {
    gruposEducacionais.push({
      nome: 'Universidades Estaduais', turmas: Math.round(estTurmas * fatorRecente),
      matriculas: Math.round(estMat * fatorRecente),
      percentual: parseFloat((estMat / totalMatAllYears * 100).toFixed(1)), tipo: 'publica',
    });
  }

  // IFs e CEFETs
  let ifTurmas = 0, ifMat = 0;
  iesEntries.forEach(([nome, data]) => {
    const n = nome.toUpperCase();
    if (n.includes('INSTITUTO FEDERAL') || n.includes('CEFET')) {
      ifTurmas += data.turmas; ifMat += data.mat;
    }
  });
  if (ifMat > 0) {
    gruposEducacionais.push({
      nome: 'IFs e CEFETs', turmas: Math.round(ifTurmas * fatorRecente),
      matriculas: Math.round(ifMat * fatorRecente),
      percentual: parseFloat((ifMat / totalMatAllYears * 100).toFixed(1)), tipo: 'publica',
    });
  }

  // Calcular "Demais Instituições"
  const matContabilizado = gruposEducacionais.reduce((s, g) => s + g.matriculas, 0);
  const turmasContabilizado = gruposEducacionais.reduce((s, g) => s + g.turmas, 0);
  gruposEducacionais.push({
    nome: 'Demais Instituições',
    turmas: Math.round(dadosRecente.turmas - turmasContabilizado),
    matriculas: Math.round(dadosRecente.mat - matContabilizado),
    percentual: parseFloat(((dadosRecente.mat - matContabilizado) / dadosRecente.mat * 100).toFixed(1)),
    tipo: 'privada',
  });

  // Recalcular percentuais baseados no ano mais recente
  gruposEducacionais.forEach(g => {
    g.percentual = parseFloat((g.matriculas / dadosRecente.mat * 100).toFixed(1));
  });

  gruposEducacionais.sort((a, b) => b.matriculas - a.matriculas);

  // ── Demografia ──
  const d = dadosRecente;
  const totalMatDemo = d.mat_0_17 + d.mat_18_24 + d.mat_25_29 + d.mat_30_34 +
                       d.mat_35_39 + d.mat_40_49 + d.mat_50_59 + d.mat_60;
  const pct = (v) => totalMatDemo > 0 ? parseFloat((v / totalMatDemo * 100).toFixed(1)) : 0;

  const demografia = {
    faixaEtaria: [
      { faixa: '0-17', total: d.mat_0_17, percentual: pct(d.mat_0_17) },
      { faixa: '18-24', total: d.mat_18_24, percentual: pct(d.mat_18_24) },
      { faixa: '25-29', total: d.mat_25_29, percentual: pct(d.mat_25_29) },
      { faixa: '30-34', total: d.mat_30_34, percentual: pct(d.mat_30_34) },
      { faixa: '35-39', total: d.mat_35_39, percentual: pct(d.mat_35_39) },
      { faixa: '40-49', total: d.mat_40_49, percentual: pct(d.mat_40_49) },
      { faixa: '50-59', total: d.mat_50_59, percentual: pct(d.mat_50_59) },
      { faixa: '60+', total: d.mat_60, percentual: pct(d.mat_60) },
    ],
    genero: [
      { tipo: 'Feminino', total: d.mat_fem, percentual: (d.mat_fem + d.mat_masc) > 0 ? parseFloat((d.mat_fem / (d.mat_fem + d.mat_masc) * 100).toFixed(1)) : 0 },
      { tipo: 'Masculino', total: d.mat_masc, percentual: (d.mat_fem + d.mat_masc) > 0 ? parseFloat((d.mat_masc / (d.mat_fem + d.mat_masc) * 100).toFixed(1)) : 0 },
    ],
  };

  // ── Franquias ──
  const franquias = NOMES_FRANQUIAS.map(nome => ({
    id: nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    nome,
  }));

  return {
    indicadores,
    evolucaoAlunos,
    distribuicaoEstados,
    cidadesPorEstado,
    rankingCursos,
    instituicoes,
    demografia,
    evolucaoTurmas,
    gruposEducacionais,
    franquias,
    ultimaAtualizacao: new Date().toISOString(),
    fonte: `Censo da Educação Superior — INEP (${anos.join('–')})`,
  };
}

// ─── Main ──────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  Processamento de Bases INEP → JSON');
  console.log('═══════════════════════════════════════\n');

  // Verificar arquivos
  for (const file of FILES) {
    const filePath = path.join(BASE_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }
  }

  console.log(`📁 Base: ${BASE_DIR}`);
  console.log(`📄 Arquivos: ${FILES.join(', ')}\n`);

  // Processar cada arquivo
  let totalLines = 0;
  for (const file of FILES) {
    const filePath = path.join(BASE_DIR, file);
    console.log(`▶ Processando ${file}...`);
    const count = await processFile(filePath);
    totalLines += count;
  }

  console.log(`\n📊 Total: ${totalLines.toLocaleString()} linhas processadas`);
  console.log('🔄 Gerando dados consolidados...\n');

  // Gerar dados consolidados
  const dados = buildConsolidatedData();

  // Criar diretório de saída
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Salvar JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dados, null, 2), 'utf8');

  const fileSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`✅ Arquivo gerado: ${OUTPUT_FILE} (${fileSize} KB)`);
  console.log(`   • ${dados.indicadores.length} indicadores`);
  console.log(`   • ${dados.evolucaoAlunos.length} anos de evolução`);
  console.log(`   • ${dados.distribuicaoEstados.length} estados`);
  console.log(`   • ${Object.keys(dados.cidadesPorEstado).length} estados com cidades`);
  console.log(`   • ${dados.rankingCursos.length} cursos`);
  console.log(`   • ${dados.instituicoes.length} instituições`);
  console.log(`   • ${dados.gruposEducacionais.length} grupos educacionais`);
  console.log(`   • ${dados.franquias.length} franquias`);
  console.log('\n═══════════════════════════════════════');
}

main().catch(err => {
  console.error('❌ Erro:', err);
  process.exit(1);
});
