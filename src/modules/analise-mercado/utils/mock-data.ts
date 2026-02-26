/**
 * Mock Data — Análise de Mercado (Reestruturado)
 * Dados fictícios baseados em tendências do Censo da Educação Superior (INEP)
 */

import type {
  DadosAnaliseMercado,
  DadosEvolucaoAnual,
  DadosEstado,
  DadosCidade,
  DadosCurso,
  DadosTurma,
  GrupoEducacional,
  DadosDemografia,
  DadosInstituicao,
  IndicadorCard,
  Franquia,
} from '../types';

// ─── Indicadores (Cards — INEP 2024) ────────
const indicadores: IndicadorCard[] = [
  { id: 'mat', titulo: 'Matrículas Ativas', valor: 9_750_000, variacao: 1.8, tendencia: 'up', cor: '#3B82F6', subtitulo: 'Graduação + Tecnólogo' },
  { id: 'conc', titulo: 'Concluintes/Ano', valor: 1_480_000, variacao: 3.5, tendencia: 'up', cor: '#10B981', subtitulo: 'Potenciais Formandos' },
  { id: 'ing', titulo: 'Ingressantes/Ano', valor: 3_690_000, variacao: 1.1, tendencia: 'up', cor: '#8B5CF6', subtitulo: 'Novos alunos' },
  { id: 'turmas', titulo: 'Turmas Estimadas', valor: 46_800, variacao: 4.0, tendencia: 'up', cor: '#FF6600', subtitulo: 'TAM — Contratos potenciais' },
  { id: 'ies', titulo: 'Ensino Superior', valor: 2_574, variacao: -0.8, tendencia: 'down', cor: '#F59E0B', subtitulo: 'Instituições Ativas' },
  { id: 'cursos', titulo: 'Cursos Ativos', valor: 44_580, variacao: 1.9, tendencia: 'up', cor: '#EC4899', subtitulo: 'Graduação + Tecnólogo' },
];

// ─── Evolução Alunos (INEP 2022–2024) ──────
const evolucaoAlunos: DadosEvolucaoAnual[] = [
  { ano: 2022, matriculas: 9_350_000, concluintes: 1_380_000, ingressantes: 3_620_000, presencial: 3_450_000, ead: 5_900_000, publica: 1_940_000, privada: 7_410_000, genero: { feminino: 5_423_000, masculino: 3_927_000 } },
  { ano: 2023, matriculas: 9_580_000, concluintes: 1_430_000, ingressantes: 3_650_000, presencial: 3_380_000, ead: 6_200_000, publica: 1_935_000, privada: 7_645_000, genero: { feminino: 5_556_000, masculino: 4_024_000 } },
  { ano: 2024, matriculas: 9_750_000, concluintes: 1_480_000, ingressantes: 3_690_000, presencial: 3_300_000, ead: 6_450_000, publica: 1_925_000, privada: 7_825_000, genero: { feminino: 5_655_000, masculino: 4_095_000 } },
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

// ─── Ranking de Cursos (detalhado) ──────────
const rankingCursos: DadosCurso[] = [
  { nome: 'Pedagogia', area: 'Educação', matriculas: 920_000, concluintes: 185_000, ingressantes: 280_000, turmas: 5_100, mediaPorTurma: 180, instituicoes: 1_420, percentual: 9.2, presencial: 220_000, ead: 700_000, publica: 230_000, privada: 690_000, genero: { feminino: 828_000, masculino: 92_000 } },
  { nome: 'Direito', area: 'Ciências Sociais', matriculas: 870_000, concluintes: 130_000, ingressantes: 260_000, turmas: 4_800, mediaPorTurma: 181, instituicoes: 1_850, percentual: 8.7, presencial: 680_000, ead: 190_000, publica: 78_000, privada: 792_000, genero: { feminino: 470_000, masculino: 400_000 } },
  { nome: 'Administração', area: 'Negócios', matriculas: 810_000, concluintes: 125_000, ingressantes: 240_000, turmas: 4_500, mediaPorTurma: 180, instituicoes: 2_100, percentual: 8.1, presencial: 290_000, ead: 520_000, publica: 73_000, privada: 737_000, genero: { feminino: 413_000, masculino: 397_000 } },
  { nome: 'Enfermagem', area: 'Saúde', matriculas: 540_000, concluintes: 82_000, ingressantes: 165_000, turmas: 3_000, mediaPorTurma: 180, instituicoes: 1_100, percentual: 5.4, presencial: 380_000, ead: 160_000, publica: 81_000, privada: 459_000, genero: { feminino: 459_000, masculino: 81_000 } },
  { nome: 'Contabilidade', area: 'Negócios', matriculas: 480_000, concluintes: 73_000, ingressantes: 142_000, turmas: 2_700, mediaPorTurma: 178, instituicoes: 1_350, percentual: 4.8, presencial: 168_000, ead: 312_000, publica: 43_000, privada: 437_000, genero: { feminino: 264_000, masculino: 216_000 } },
  { nome: 'Psicologia', area: 'Saúde', matriculas: 420_000, concluintes: 55_000, ingressantes: 130_000, turmas: 2_300, mediaPorTurma: 183, instituicoes: 980, percentual: 4.2, presencial: 340_000, ead: 80_000, publica: 42_000, privada: 378_000, genero: { feminino: 357_000, masculino: 63_000 } },
  { nome: 'Engenharia Civil', area: 'Engenharia', matriculas: 380_000, concluintes: 48_000, ingressantes: 110_000, turmas: 2_100, mediaPorTurma: 181, instituicoes: 820, percentual: 3.8, presencial: 310_000, ead: 70_000, publica: 57_000, privada: 323_000, genero: { feminino: 114_000, masculino: 266_000 } },
  { nome: 'Gestão de RH', area: 'Negócios', matriculas: 350_000, concluintes: 65_000, ingressantes: 115_000, turmas: 1_950, mediaPorTurma: 179, instituicoes: 1_200, percentual: 3.5, presencial: 105_000, ead: 245_000, publica: 18_000, privada: 332_000, genero: { feminino: 245_000, masculino: 105_000 } },
  { nome: 'Educação Física', area: 'Saúde', matriculas: 310_000, concluintes: 47_000, ingressantes: 95_000, turmas: 1_700, mediaPorTurma: 182, instituicoes: 750, percentual: 3.1, presencial: 210_000, ead: 100_000, publica: 47_000, privada: 263_000, genero: { feminino: 140_000, masculino: 170_000 } },
  { nome: 'Medicina', area: 'Saúde', matriculas: 265_000, concluintes: 35_000, ingressantes: 42_000, turmas: 1_500, mediaPorTurma: 177, instituicoes: 390, percentual: 2.7, presencial: 265_000, ead: 0, publica: 80_000, privada: 185_000, genero: { feminino: 159_000, masculino: 106_000 } },
  { nome: 'Farmácia', area: 'Saúde', matriculas: 220_000, concluintes: 33_000, ingressantes: 68_000, turmas: 1_200, mediaPorTurma: 183, instituicoes: 620, percentual: 2.2, presencial: 165_000, ead: 55_000, publica: 33_000, privada: 187_000, genero: { feminino: 154_000, masculino: 66_000 } },
  { nome: 'Arquitetura', area: 'Engenharia', matriculas: 180_000, concluintes: 25_000, ingressantes: 52_000, turmas: 1_000, mediaPorTurma: 180, instituicoes: 480, percentual: 1.8, presencial: 155_000, ead: 25_000, publica: 27_000, privada: 153_000, genero: { feminino: 113_000, masculino: 67_000 } },
  { nome: 'Sistemas de Informação', area: 'TI', matriculas: 170_000, concluintes: 22_000, ingressantes: 55_000, turmas: 950, mediaPorTurma: 179, instituicoes: 560, percentual: 1.7, presencial: 85_000, ead: 85_000, publica: 25_000, privada: 145_000, genero: { feminino: 27_000, masculino: 143_000 } },
  { nome: 'Fisioterapia', area: 'Saúde', matriculas: 160_000, concluintes: 24_000, ingressantes: 50_000, turmas: 880, mediaPorTurma: 182, instituicoes: 520, percentual: 1.6, presencial: 130_000, ead: 30_000, publica: 24_000, privada: 136_000, genero: { feminino: 120_000, masculino: 40_000 } },
  { nome: 'Odontologia', area: 'Saúde', matriculas: 140_000, concluintes: 20_000, ingressantes: 38_000, turmas: 780, mediaPorTurma: 179, instituicoes: 380, percentual: 1.4, presencial: 140_000, ead: 0, publica: 21_000, privada: 119_000, genero: { feminino: 91_000, masculino: 49_000 } },
  { nome: 'Ciência da Computação', area: 'TI', matriculas: 135_000, concluintes: 18_000, ingressantes: 45_000, turmas: 720, mediaPorTurma: 188, instituicoes: 440, percentual: 1.4, presencial: 95_000, ead: 40_000, publica: 34_000, privada: 101_000, genero: { feminino: 19_000, masculino: 116_000 } },
  { nome: 'Engenharia de Produção', area: 'Engenharia', matriculas: 125_000, concluintes: 16_000, ingressantes: 38_000, turmas: 680, mediaPorTurma: 184, instituicoes: 410, percentual: 1.3, presencial: 90_000, ead: 35_000, publica: 19_000, privada: 106_000, genero: { feminino: 44_000, masculino: 81_000 } },
  { nome: 'Serviço Social', area: 'Ciências Sociais', matriculas: 115_000, concluintes: 19_000, ingressantes: 35_000, turmas: 640, mediaPorTurma: 180, instituicoes: 480, percentual: 1.2, presencial: 60_000, ead: 55_000, publica: 23_000, privada: 92_000, genero: { feminino: 103_000, masculino: 12_000 } },
  { nome: 'Nutrição', area: 'Saúde', matriculas: 110_000, concluintes: 15_000, ingressantes: 34_000, turmas: 600, mediaPorTurma: 183, instituicoes: 450, percentual: 1.1, presencial: 85_000, ead: 25_000, publica: 17_000, privada: 93_000, genero: { feminino: 94_000, masculino: 16_000 } },
  { nome: 'Eng. Elétrica/Eletrônica', area: 'Engenharia', matriculas: 100_000, concluintes: 12_000, ingressantes: 30_000, turmas: 550, mediaPorTurma: 182, instituicoes: 350, percentual: 1.0, presencial: 80_000, ead: 20_000, publica: 20_000, privada: 80_000, genero: { feminino: 13_000, masculino: 87_000 } },
];

// ─── Nº de Cursos por Instituição ───────────
const instituicoes: DadosInstituicao[] = [
  { nome: 'Universidade Estácio de Sá', tipo: 'privada', modalidade: 'ambas', cursos: 182, matriculas: 480_000, concluintes: 72_000, ingressantes: 145_000, turmas: 2_400, uf: 'RJ' },
  { nome: 'Universidade Paulista (UNIP)', tipo: 'privada', modalidade: 'ambas', cursos: 168, matriculas: 520_000, concluintes: 78_000, ingressantes: 156_000, turmas: 2_200, uf: 'SP' },
  { nome: 'Anhanguera', tipo: 'privada', modalidade: 'ambas', cursos: 155, matriculas: 750_000, concluintes: 112_000, ingressantes: 225_000, turmas: 3_100, uf: 'SP' },
  { nome: 'Universidade Federal de MG', tipo: 'publica', modalidade: 'presencial', cursos: 148, matriculas: 52_000, concluintes: 8_500, ingressantes: 10_400, turmas: 680, uf: 'MG' },
  { nome: 'Universidade de São Paulo', tipo: 'publica', modalidade: 'presencial', cursos: 310, matriculas: 95_000, concluintes: 14_200, ingressantes: 11_300, turmas: 1_200, uf: 'SP' },
  { nome: 'Pitágoras / Unopar', tipo: 'privada', modalidade: 'ead', cursos: 120, matriculas: 680_000, concluintes: 102_000, ingressantes: 204_000, turmas: 2_800, uf: 'MG' },
  { nome: 'Universidade Federal do RJ', tipo: 'publica', modalidade: 'presencial', cursos: 175, matriculas: 68_000, concluintes: 10_200, ingressantes: 10_800, turmas: 850, uf: 'RJ' },
  { nome: 'Cruzeiro do Sul Virtual', tipo: 'privada', modalidade: 'ead', cursos: 95, matriculas: 350_000, concluintes: 52_500, ingressantes: 105_000, turmas: 1_400, uf: 'SP' },
  { nome: 'PUC Minas', tipo: 'privada', modalidade: 'ambas', cursos: 92, matriculas: 85_000, concluintes: 12_800, ingressantes: 25_500, turmas: 620, uf: 'MG' },
  { nome: 'Universidade Federal do PR', tipo: 'publica', modalidade: 'presencial', cursos: 130, matriculas: 42_000, concluintes: 6_800, ingressantes: 7_500, turmas: 520, uf: 'PR' },
  { nome: 'Uninassau', tipo: 'privada', modalidade: 'ambas', cursos: 110, matriculas: 320_000, concluintes: 48_000, ingressantes: 96_000, turmas: 1_600, uf: 'PE' },
  { nome: 'Universidade Federal da BA', tipo: 'publica', modalidade: 'presencial', cursos: 112, matriculas: 40_000, concluintes: 6_400, ingressantes: 7_200, turmas: 480, uf: 'BA' },
  { nome: 'UniCesumar', tipo: 'privada', modalidade: 'ead', cursos: 85, matriculas: 420_000, concluintes: 63_000, ingressantes: 126_000, turmas: 1_750, uf: 'PR' },
  { nome: 'Universidade Federal de SC', tipo: 'publica', modalidade: 'presencial', cursos: 108, matriculas: 38_000, concluintes: 6_100, ingressantes: 6_800, turmas: 460, uf: 'SC' },
  { nome: 'Universidade Federal do RS', tipo: 'publica', modalidade: 'presencial', cursos: 125, matriculas: 45_000, concluintes: 7_200, ingressantes: 8_000, turmas: 560, uf: 'RS' },
];

// ─── Evolução de Turmas (INEP 2022–2024) ───
const evolucaoTurmas: DadosTurma[] = [
  { ano: 2022, totalTurmas: 43_200, mediaPorTurma: 31, medianaPorTurma: 29, turmasPresencial: 20_200, turmasPublica: 9_400, turmasPrivada: 33_800 },
  { ano: 2023, totalTurmas: 45_000, mediaPorTurma: 32, medianaPorTurma: 29, turmasPresencial: 19_500, turmasPublica: 9_350, turmasPrivada: 35_650 },
  { ano: 2024, totalTurmas: 46_800, mediaPorTurma: 32, medianaPorTurma: 30, turmasPresencial: 19_000, turmasPublica: 9_300, turmasPrivada: 37_500 },
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

// ─── Dados por Cidade (drill-down do mapa) ──
const cd = (nome: string, uf: string, lat: number, lng: number, mat: number): DadosCidade => ({
  nome, uf, lat, lng,
  matriculas: mat,
  concluintes: Math.round(mat * 0.153),
  turmas: Math.round(mat / 200),
  instituicoes: Math.max(1, Math.round(mat / 4000)),
});

const cidadesPorEstado: Record<string, DadosCidade[]> = {
  SP: [cd('São Paulo', 'SP', -23.55, -46.63, 1_100_000), cd('Campinas', 'SP', -22.91, -47.06, 310_000), cd('Ribeirão Preto', 'SP', -21.18, -47.81, 180_000), cd('São José dos Campos', 'SP', -23.18, -45.88, 140_000), cd('Sorocaba', 'SP', -23.50, -47.47, 120_000)],
  MG: [cd('Belo Horizonte', 'MG', -19.92, -43.94, 480_000), cd('Uberlândia', 'MG', -18.92, -48.28, 145_000), cd('Juiz de Fora', 'MG', -21.76, -43.35, 85_000), cd('Contagem', 'MG', -19.93, -44.05, 65_000), cd('Montes Claros', 'MG', -16.73, -43.86, 55_000)],
  RJ: [cd('Rio de Janeiro', 'RJ', -22.91, -43.17, 420_000), cd('Niterói', 'RJ', -22.88, -43.10, 85_000), cd('São Gonçalo', 'RJ', -22.83, -43.07, 70_000), cd('Duque de Caxias', 'RJ', -22.79, -43.31, 55_000), cd('Nova Iguaçu', 'RJ', -22.76, -43.45, 45_000)],
  PR: [cd('Curitiba', 'PR', -25.43, -49.27, 280_000), cd('Londrina', 'PR', -23.31, -51.16, 82_000), cd('Maringá', 'PR', -23.42, -51.94, 68_000), cd('Cascavel', 'PR', -24.96, -53.46, 42_000), cd('Ponta Grossa', 'PR', -25.09, -50.16, 38_000)],
  RS: [cd('Porto Alegre', 'RS', -30.03, -51.23, 250_000), cd('Caxias do Sul', 'RS', -29.17, -51.18, 68_000), cd('Pelotas', 'RS', -31.77, -52.34, 45_000), cd('Canoas', 'RS', -29.92, -51.18, 40_000), cd('Santa Maria', 'RS', -29.68, -53.81, 35_000)],
  BA: [cd('Salvador', 'BA', -12.97, -38.51, 245_000), cd('Feira de Santana', 'BA', -12.27, -38.97, 58_000), cd('Vitória da Conquista', 'BA', -14.87, -40.84, 38_000), cd('Ilhéus', 'BA', -14.79, -39.05, 28_000), cd('Camaçari', 'BA', -12.70, -38.32, 25_000)],
  SC: [cd('Florianópolis', 'SC', -27.60, -48.55, 150_000), cd('Joinville', 'SC', -26.30, -48.85, 90_000), cd('Blumenau', 'SC', -26.92, -49.07, 62_000), cd('Chapecó', 'SC', -27.10, -52.62, 42_000), cd('Criciúma', 'SC', -28.68, -49.37, 32_000)],
  GO: [cd('Goiânia', 'GO', -16.68, -49.25, 210_000), cd('Anápolis', 'GO', -16.33, -48.95, 48_000), cd('Aparecida de Goiânia', 'GO', -16.82, -49.25, 42_000), cd('Rio Verde', 'GO', -17.79, -50.92, 28_000)],
  PE: [cd('Recife', 'PE', -8.05, -34.87, 185_000), cd('Olinda', 'PE', -8.01, -34.86, 35_000), cd('Caruaru', 'PE', -8.28, -35.98, 32_000), cd('Petrolina', 'PE', -9.39, -40.50, 25_000)],
  CE: [cd('Fortaleza', 'CE', -3.72, -38.53, 180_000), cd('Juazeiro do Norte', 'CE', -7.21, -39.31, 30_000), cd('Sobral', 'CE', -3.69, -40.35, 22_000), cd('Maracanaú', 'CE', -3.88, -38.63, 20_000)],
  PA: [cd('Belém', 'PA', -1.46, -48.50, 155_000), cd('Ananindeua', 'PA', -1.37, -48.39, 32_000), cd('Santarém', 'PA', -2.44, -54.71, 22_000), cd('Marabá', 'PA', -5.37, -49.12, 18_000)],
  DF: [cd('Brasília', 'DF', -15.79, -47.88, 280_000)],
  MA: [cd('São Luís', 'MA', -2.53, -44.28, 130_000), cd('Imperatriz', 'MA', -5.52, -47.47, 28_000), cd('Timon', 'MA', -5.09, -42.84, 15_000)],
  MT: [cd('Cuiabá', 'MT', -15.60, -56.10, 98_000), cd('Rondonópolis', 'MT', -16.47, -54.64, 28_000), cd('Sinop', 'MT', -11.86, -55.51, 22_000), cd('Várzea Grande', 'MT', -15.65, -56.13, 18_000)],
  MS: [cd('Campo Grande', 'MS', -20.44, -54.65, 105_000), cd('Dourados', 'MS', -22.22, -54.81, 25_000), cd('Três Lagoas', 'MS', -20.75, -51.68, 12_000)],
  ES: [cd('Vitória', 'ES', -20.32, -40.34, 58_000), cd('Vila Velha', 'ES', -20.33, -40.29, 38_000), cd('Serra', 'ES', -20.12, -40.31, 32_000), cd('Cariacica', 'ES', -20.26, -40.42, 18_000)],
  PB: [cd('João Pessoa', 'PB', -7.12, -34.84, 88_000), cd('Campina Grande', 'PB', -7.23, -35.88, 32_000), cd('Santa Rita', 'PB', -7.12, -34.98, 10_000)],
  RN: [cd('Natal', 'RN', -5.79, -35.21, 78_000), cd('Mossoró', 'RN', -5.19, -37.34, 22_000), cd('Parnamirim', 'RN', -5.91, -35.26, 12_000)],
  PI: [cd('Teresina', 'PI', -5.09, -42.80, 72_000), cd('Parnaíba', 'PI', -2.91, -41.78, 10_000), cd('Picos', 'PI', -7.08, -41.47, 8_000)],
  AL: [cd('Maceió', 'AL', -9.67, -35.74, 62_000), cd('Arapiraca', 'AL', -9.75, -36.66, 14_000), cd('Rio Largo', 'AL', -9.48, -35.84, 6_000)],
  SE: [cd('Aracaju', 'SE', -10.91, -37.07, 52_000), cd('N. Sra. do Socorro', 'SE', -10.86, -37.13, 10_000), cd('Lagarto', 'SE', -10.92, -37.65, 5_000)],
  TO: [cd('Palmas', 'TO', -10.18, -48.33, 35_000), cd('Araguaína', 'TO', -7.19, -48.21, 12_000), cd('Gurupi', 'TO', -11.73, -49.07, 6_000)],
  AM: [cd('Manaus', 'AM', -3.12, -60.02, 48_000), cd('Parintins', 'AM', -2.63, -56.74, 4_000), cd('Manacapuru', 'AM', -3.29, -60.62, 2_500)],
  RO: [cd('Porto Velho', 'RO', -8.76, -63.90, 32_000), cd('Ji-Paraná', 'RO', -10.88, -61.95, 8_000), cd('Vilhena', 'RO', -12.74, -60.15, 4_000)],
  AC: [cd('Rio Branco', 'AC', -9.97, -67.81, 18_000), cd('Cruzeiro do Sul', 'AC', -7.63, -72.67, 3_000)],
  AP: [cd('Macapá', 'AP', 0.03, -51.05, 15_000), cd('Santana', 'AP', -0.06, -51.17, 3_000)],
  RR: [cd('Boa Vista', 'RR', 2.82, -60.67, 12_000)],
};

// ─── Export consolidado ─────────────────────
export const mockAnaliseMercado: DadosAnaliseMercado = {
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
  ultimaAtualizacao: '2024-12-31T23:59:59Z',
  fonte: 'Censo da Educação Superior — INEP (2022–2024)',
};
