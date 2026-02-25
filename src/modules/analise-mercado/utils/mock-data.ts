/**
 * Mock Data — Análise de Mercado (Reestruturado)
 * Dados fictícios baseados em tendências do Censo da Educação Superior (INEP)
 */

import type {
  DadosAnaliseMercado,
  DadosEvolucaoAnual,
  DadosEstado,
  DadosCurso,
  DadosTurma,
  TurmaPorSemestre,
  GrupoEducacional,
  DadosDemografia,
  IndicadorCard,
  Franquia,
} from '../types';

// ─── Indicadores (Cards) ────────────────────
const indicadores: IndicadorCard[] = [
  { id: 'mat', titulo: 'Matrículas Ativas', valor: 9_950_000, variacao: 3.6, tendencia: 'up', cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
  { id: 'conc', titulo: 'Concluintes/Ano', valor: 1_520_000, variacao: 5.3, tendencia: 'up', cor: '#10B981', subtitulo: 'Potenciais Formandos' },
  { id: 'ing', titulo: 'Ingressantes/Ano', valor: 3_720_000, variacao: 2.1, tendencia: 'up', cor: '#8B5CF6', subtitulo: 'Novos alunos' },
  { id: 'turmas', titulo: 'Turmas Estimadas', valor: 48_200, variacao: 4.8, tendencia: 'up', cor: '#FF6600', subtitulo: 'TAM — Contratos potenciais' },
  { id: 'ies', titulo: 'IES Ativas', valor: 2_574, variacao: -0.8, tendencia: 'down', cor: '#F59E0B', subtitulo: 'Instituições de Ensino' },
  { id: 'media-turma', titulo: 'Média Alunos/Turma', valor: 32, variacao: 1.2, tendencia: 'stable', cor: '#EC4899', subtitulo: 'Tamanho médio' },
];

// ─── Evolução Alunos (2019–2025) ────────────
const evolucaoAlunos: DadosEvolucaoAnual[] = [
  { ano: 2019, matriculas: 8_604_000, concluintes: 1_250_000, ingressantes: 3_450_000, presencial: 3_800_000, ead: 4_804_000, publica: 1_980_000, privada: 6_624_000 },
  { ano: 2020, matriculas: 8_680_000, concluintes: 1_278_000, ingressantes: 3_500_000, presencial: 3_700_000, ead: 4_980_000, publica: 1_960_000, privada: 6_720_000 },
  { ano: 2021, matriculas: 8_970_000, concluintes: 1_320_000, ingressantes: 3_560_000, presencial: 3_550_000, ead: 5_420_000, publica: 1_950_000, privada: 7_020_000 },
  { ano: 2022, matriculas: 9_350_000, concluintes: 1_380_000, ingressantes: 3_620_000, presencial: 3_450_000, ead: 5_900_000, publica: 1_940_000, privada: 7_410_000 },
  { ano: 2023, matriculas: 9_580_000, concluintes: 1_430_000, ingressantes: 3_650_000, presencial: 3_380_000, ead: 6_200_000, publica: 1_935_000, privada: 7_645_000 },
  { ano: 2024, matriculas: 9_750_000, concluintes: 1_480_000, ingressantes: 3_690_000, presencial: 3_300_000, ead: 6_450_000, publica: 1_925_000, privada: 7_825_000 },
  { ano: 2025, matriculas: 9_950_000, concluintes: 1_520_000, ingressantes: 3_720_000, presencial: 3_220_000, ead: 6_730_000, publica: 1_920_000, privada: 8_030_000 },
];

// ─── Distribuição por Estado ────────────────
const distribuicaoEstados: DadosEstado[] = [
  { uf: 'SP', nome: 'São Paulo', matriculas: 2_450_000, concluintes: 380_000, turmas: 12_200, instituicoes: 620, percentual: 24.6 },
  { uf: 'MG', nome: 'Minas Gerais', matriculas: 1_100_000, concluintes: 168_000, turmas: 5_300, instituicoes: 340, percentual: 11.1 },
  { uf: 'RJ', nome: 'Rio de Janeiro', matriculas: 890_000, concluintes: 135_000, turmas: 4_100, instituicoes: 260, percentual: 8.9 },
  { uf: 'PR', nome: 'Paraná', matriculas: 650_000, concluintes: 100_000, turmas: 3_200, instituicoes: 210, percentual: 6.5 },
  { uf: 'RS', nome: 'Rio Grande do Sul', matriculas: 580_000, concluintes: 88_000, turmas: 2_800, instituicoes: 195, percentual: 5.8 },
  { uf: 'BA', nome: 'Bahia', matriculas: 520_000, concluintes: 78_000, turmas: 2_500, instituicoes: 170, percentual: 5.2 },
  { uf: 'SC', nome: 'Santa Catarina', matriculas: 470_000, concluintes: 72_000, turmas: 2_300, instituicoes: 150, percentual: 4.7 },
  { uf: 'GO', nome: 'Goiás', matriculas: 420_000, concluintes: 64_000, turmas: 2_000, instituicoes: 130, percentual: 4.2 },
  { uf: 'PE', nome: 'Pernambuco', matriculas: 380_000, concluintes: 58_000, turmas: 1_800, instituicoes: 120, percentual: 3.8 },
  { uf: 'CE', nome: 'Ceará', matriculas: 340_000, concluintes: 52_000, turmas: 1_600, instituicoes: 110, percentual: 3.4 },
  { uf: 'PA', nome: 'Pará', matriculas: 300_000, concluintes: 45_000, turmas: 1_400, instituicoes: 90, percentual: 3.0 },
  { uf: 'DF', nome: 'Distrito Federal', matriculas: 280_000, concluintes: 43_000, turmas: 1_350, instituicoes: 85, percentual: 2.8 },
  { uf: 'MA', nome: 'Maranhão', matriculas: 250_000, concluintes: 38_000, turmas: 1_200, instituicoes: 75, percentual: 2.5 },
  { uf: 'MT', nome: 'Mato Grosso', matriculas: 210_000, concluintes: 32_000, turmas: 1_000, instituicoes: 65, percentual: 2.1 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', matriculas: 190_000, concluintes: 29_000, turmas: 900, instituicoes: 55, percentual: 1.9 },
  { uf: 'ES', nome: 'Espírito Santo', matriculas: 180_000, concluintes: 27_000, turmas: 850, instituicoes: 50, percentual: 1.8 },
  { uf: 'PB', nome: 'Paraíba', matriculas: 160_000, concluintes: 24_000, turmas: 750, instituicoes: 45, percentual: 1.6 },
  { uf: 'RN', nome: 'Rio Grande do Norte', matriculas: 140_000, concluintes: 21_000, turmas: 660, instituicoes: 40, percentual: 1.4 },
  { uf: 'PI', nome: 'Piauí', matriculas: 120_000, concluintes: 18_000, turmas: 560, instituicoes: 35, percentual: 1.2 },
  { uf: 'AL', nome: 'Alagoas', matriculas: 100_000, concluintes: 15_000, turmas: 470, instituicoes: 30, percentual: 1.0 },
  { uf: 'SE', nome: 'Sergipe', matriculas: 85_000, concluintes: 13_000, turmas: 400, instituicoes: 25, percentual: 0.9 },
  { uf: 'TO', nome: 'Tocantins', matriculas: 65_000, concluintes: 10_000, turmas: 300, instituicoes: 20, percentual: 0.7 },
  { uf: 'AM', nome: 'Amazonas', matriculas: 60_000, concluintes: 9_000, turmas: 280, instituicoes: 18, percentual: 0.6 },
  { uf: 'RO', nome: 'Rondônia', matriculas: 50_000, concluintes: 7_500, turmas: 230, instituicoes: 15, percentual: 0.5 },
  { uf: 'AC', nome: 'Acre', matriculas: 25_000, concluintes: 3_800, turmas: 120, instituicoes: 8, percentual: 0.3 },
  { uf: 'AP', nome: 'Amapá', matriculas: 20_000, concluintes: 3_000, turmas: 95, instituicoes: 6, percentual: 0.2 },
  { uf: 'RR', nome: 'Roraima', matriculas: 15_000, concluintes: 2_200, turmas: 70, instituicoes: 5, percentual: 0.2 },
];

// ─── Ranking de Cursos ──────────────────────
const rankingCursos: DadosCurso[] = [
  { nome: 'Pedagogia', area: 'Educação', matriculas: 920_000, concluintes: 185_000, turmas: 5_100, percentual: 9.2 },
  { nome: 'Direito', area: 'Ciências Sociais', matriculas: 870_000, concluintes: 130_000, turmas: 4_800, percentual: 8.7 },
  { nome: 'Administração', area: 'Negócios', matriculas: 810_000, concluintes: 125_000, turmas: 4_500, percentual: 8.1 },
  { nome: 'Enfermagem', area: 'Saúde', matriculas: 540_000, concluintes: 82_000, turmas: 3_000, percentual: 5.4 },
  { nome: 'Contabilidade', area: 'Negócios', matriculas: 480_000, concluintes: 73_000, turmas: 2_700, percentual: 4.8 },
  { nome: 'Psicologia', area: 'Saúde', matriculas: 420_000, concluintes: 55_000, turmas: 2_300, percentual: 4.2 },
  { nome: 'Engenharia Civil', area: 'Engenharia', matriculas: 380_000, concluintes: 48_000, turmas: 2_100, percentual: 3.8 },
  { nome: 'Gestão de RH', area: 'Negócios', matriculas: 350_000, concluintes: 65_000, turmas: 1_950, percentual: 3.5 },
  { nome: 'Educação Física', area: 'Saúde', matriculas: 310_000, concluintes: 47_000, turmas: 1_700, percentual: 3.1 },
  { nome: 'Medicina', area: 'Saúde', matriculas: 265_000, concluintes: 35_000, turmas: 1_500, percentual: 2.7 },
  { nome: 'Farmácia', area: 'Saúde', matriculas: 220_000, concluintes: 33_000, turmas: 1_200, percentual: 2.2 },
  { nome: 'Arquitetura', area: 'Engenharia', matriculas: 180_000, concluintes: 25_000, turmas: 1_000, percentual: 1.8 },
  { nome: 'Sistemas de Informação', area: 'TI', matriculas: 170_000, concluintes: 22_000, turmas: 950, percentual: 1.7 },
  { nome: 'Fisioterapia', area: 'Saúde', matriculas: 160_000, concluintes: 24_000, turmas: 880, percentual: 1.6 },
  { nome: 'Odontologia', area: 'Saúde', matriculas: 140_000, concluintes: 20_000, turmas: 780, percentual: 1.4 },
];

// ─── Evolução de Turmas ─────────────────────
const evolucaoTurmas: DadosTurma[] = [
  { ano: 2019, totalTurmas: 38_500, mediaPorTurma: 30, medianaPorTurma: 28, turmasPresencial: 22_000, turmasEad: 16_500, turmasPublica: 9_600, turmasPrivada: 28_900 },
  { ano: 2020, totalTurmas: 39_200, mediaPorTurma: 30, medianaPorTurma: 28, turmasPresencial: 21_500, turmasEad: 17_700, turmasPublica: 9_500, turmasPrivada: 29_700 },
  { ano: 2021, totalTurmas: 41_000, mediaPorTurma: 31, medianaPorTurma: 28, turmasPresencial: 20_800, turmasEad: 20_200, turmasPublica: 9_450, turmasPrivada: 31_550 },
  { ano: 2022, totalTurmas: 43_200, mediaPorTurma: 31, medianaPorTurma: 29, turmasPresencial: 20_200, turmasEad: 23_000, turmasPublica: 9_400, turmasPrivada: 33_800 },
  { ano: 2023, totalTurmas: 45_000, mediaPorTurma: 32, medianaPorTurma: 29, turmasPresencial: 19_500, turmasEad: 25_500, turmasPublica: 9_350, turmasPrivada: 35_650 },
  { ano: 2024, totalTurmas: 46_800, mediaPorTurma: 32, medianaPorTurma: 30, turmasPresencial: 19_000, turmasEad: 27_800, turmasPublica: 9_300, turmasPrivada: 37_500 },
  { ano: 2025, totalTurmas: 48_200, mediaPorTurma: 32, medianaPorTurma: 30, turmasPresencial: 18_500, turmasEad: 29_700, turmasPublica: 9_250, turmasPrivada: 38_950 },
];

// ─── Turmas por Semestre ────────────────────
const turmasPorSemestre: TurmaPorSemestre[] = [
  { periodo: '2023.1', total: 21_500 },
  { periodo: '2023.2', total: 23_500 },
  { periodo: '2024.1', total: 22_200 },
  { periodo: '2024.2', total: 24_600 },
  { periodo: '2025.1', total: 23_000 },
  { periodo: '2025.2', total: 25_200 },
];

// ─── Grupos Educacionais ────────────────────
const gruposEducacionais: GrupoEducacional[] = [
  { nome: 'Cogna (Kroton/Anhanguera)', turmas: 6_200, matriculas: 1_500_000, percentual: 12.9, tipo: 'privada' },
  { nome: 'Yduqs (Estácio/Ibmec)', turmas: 4_800, matriculas: 1_200_000, percentual: 10.0, tipo: 'privada' },
  { nome: 'Ânima (Uni-BH/Una)', turmas: 3_200, matriculas: 800_000, percentual: 6.6, tipo: 'privada' },
  { nome: 'Ser Educacional (UniNassau)', turmas: 2_800, matriculas: 650_000, percentual: 5.8, tipo: 'privada' },
  { nome: 'Cruzeiro do Sul', turmas: 2_400, matriculas: 550_000, percentual: 5.0, tipo: 'privada' },
  { nome: 'UNIP', turmas: 2_200, matriculas: 520_000, percentual: 4.6, tipo: 'privada' },
  { nome: 'Universidades Federais', turmas: 5_800, matriculas: 1_300_000, percentual: 12.0, tipo: 'publica' },
  { nome: 'Universidades Estaduais', turmas: 2_600, matriculas: 580_000, percentual: 5.4, tipo: 'publica' },
  { nome: 'IFs e CEFETs', turmas: 950, matriculas: 240_000, percentual: 2.0, tipo: 'publica' },
  { nome: 'Demais Instituições', turmas: 17_200, matriculas: 2_560_000, percentual: 35.7, tipo: 'privada' },
];

// ─── Demografia ─────────────────────────────
const demografia: DadosDemografia = {
  faixaEtaria: [
    { faixa: '18-20', total: 1_790_000, percentual: 18.0 },
    { faixa: '21-24', total: 3_280_000, percentual: 33.0 },
    { faixa: '25-29', total: 2_090_000, percentual: 21.0 },
    { faixa: '30-34', total: 1_190_000, percentual: 12.0 },
    { faixa: '35-39', total: 800_000, percentual: 8.0 },
    { faixa: '40+', total: 800_000, percentual: 8.0 },
  ],
  genero: [
    { tipo: 'Feminino', total: 5_770_000, percentual: 58.0 },
    { tipo: 'Masculino', total: 4_180_000, percentual: 42.0 },
  ],
};

// ─── Franquias (mesma lista do módulo Fluxo Projetado) ───
const NOMES_FRANQUIAS = [
  'Barbacena',
  'Belo Horizonte',
  'Cacoal',
  'Campo Grande',
  'Campos',
  'Cascavel',
  'Contagem',
  'Cuiaba',
  'Curitiba',
  'Divinópolis',
  'Florianópolis',
  'Fortaleza',
  'Governador Valadares',
  'Ipatinga',
  'Itaperuna Muriae',
  'João Pessoa',
  'Juiz de Fora',
  'Lavras',
  'Linhares',
  'Londrina',
  'Montes Claros',
  'Palmas',
  'Passos',
  'Petropolis',
  'Pocos de Caldas',
  'Porto Alegre',
  'Porto Velho',
  'Pouso Alegre',
  'Recife',
  'Região dos Lagos',
  'Rio Branco',
  'Rio de Janeiro',
  'Salvador',
  'São Luís',
  'Sao Paulo',
  'Uba',
  'Uberlândia',
  'Vitória',
  'Volta Redonda - VivaMixx',
];

const franquias: Franquia[] = NOMES_FRANQUIAS.map(nome => ({
  id: nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  nome,
}));

// ─── Export consolidado ─────────────────────
export const mockAnaliseMercado: DadosAnaliseMercado = {
  indicadores,
  evolucaoAlunos,
  distribuicaoEstados,
  rankingCursos,
  demografia,
  evolucaoTurmas,
  turmasPorSemestre,
  gruposEducacionais,
  franquias,
  ultimaAtualizacao: '2025-02-25T10:00:00Z',
  fonte: 'Censo da Educação Superior — INEP (dados fictícios para validação)',
};
