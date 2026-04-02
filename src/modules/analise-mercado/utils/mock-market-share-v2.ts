/**
 * Mock Data — Market Share Reestruturado (3 Blocos)
 * Bloco 1: Matriculados (carteira ativa)
 * Bloco 2: Turmas (fictitious data)
 * Bloco 3: Target — Medicina
 */

import type {
  DadosMarketShareV2,
  BlocoMatriculados,
  BlocoTurmas,
  BlocoTarget,
} from '../types';

// ─── Bloco 1: Matriculados ──────────────────
const MATRICULADOS: BlocoMatriculados = {
  totalMatriculados: 86200,
  totalCarteiraAtiva: 4350,
  participacao: 5.0,
  comparativoAnual: [
    { ano: 2022, matriculados: 3080, mercadoTotal: 81200 },
    { ano: 2023, matriculados: 3720, mercadoTotal: 84600 },
    { ano: 2024, matriculados: 4350, mercadoTotal: 86200 },
  ],
  rankingFranquias: [
    { franquia: 'Belo Horizonte', matriculados: 1820, marketShare: 5.6 },
    { franquia: 'Curitiba', matriculados: 680, marketShare: 6.1 },
    { franquia: 'Fortaleza', matriculados: 520, marketShare: 5.3 },
    { franquia: 'Recife', matriculados: 340, marketShare: 8.1 },
    { franquia: 'Uberlândia', matriculados: 380, marketShare: 3.0 },
    { franquia: 'Salvador', matriculados: 210, marketShare: 4.1 },
    { franquia: 'Porto Alegre', matriculados: 150, marketShare: 5.4 },
    { franquia: 'Contagem', matriculados: 120, marketShare: 3.5 },
    { franquia: 'Juiz de Fora', matriculados: 80, marketShare: 3.6 },
    { franquia: 'Londrina', matriculados: 50, marketShare: 2.0 },
  ],
};

// ─── Bloco 2: Turmas ────────────────────────
const TURMAS: BlocoTurmas = {
  totalTurmas: 4120,
  totalTurmasCarteira: 218,
  participacao: 5.3,
  comparativoAnual: [
    { ano: 2022, matriculados: 152, mercadoTotal: 3680 },
    { ano: 2023, matriculados: 186, mercadoTotal: 3910 },
    { ano: 2024, matriculados: 218, mercadoTotal: 4120 },
  ],
  rankingFranquias: [
    { franquia: 'Belo Horizonte', matriculados: 72, marketShare: 6.8 },
    { franquia: 'Curitiba', matriculados: 34, marketShare: 7.2 },
    { franquia: 'Fortaleza', matriculados: 28, marketShare: 5.9 },
    { franquia: 'Recife', matriculados: 22, marketShare: 9.4 },
    { franquia: 'Uberlândia', matriculados: 20, marketShare: 3.5 },
    { franquia: 'Salvador', matriculados: 16, marketShare: 4.8 },
    { franquia: 'Porto Alegre', matriculados: 12, marketShare: 6.1 },
    { franquia: 'Contagem', matriculados: 8, marketShare: 3.9 },
    { franquia: 'Juiz de Fora', matriculados: 4, marketShare: 2.8 },
    { franquia: 'Londrina', matriculados: 2, marketShare: 1.5 },
  ],
  semDados: false,
};

// ─── Bloco 3: Target — Medicina ─────────────
const TARGET_ALUNOS_RANKING_FRANQUIAS = [
  { franquia: 'Belo Horizonte', alunosTarget: 820, alunosViva: 245, participacao: 29.9, matriculadosInep: 1100 },
  { franquia: 'Curitiba', alunosTarget: 380, alunosViva: 98, participacao: 25.8, matriculadosInep: 510 },
  { franquia: 'Fortaleza', alunosTarget: 310, alunosViva: 72, participacao: 23.2, matriculadosInep: 420 },
  { franquia: 'Uberlândia', alunosTarget: 280, alunosViva: 56, participacao: 20.0, matriculadosInep: 375 },
  { franquia: 'Salvador', alunosTarget: 220, alunosViva: 48, participacao: 21.8, matriculadosInep: 295 },
  { franquia: 'Recife', alunosTarget: 180, alunosViva: 52, participacao: 28.9, matriculadosInep: 240 },
  { franquia: 'Contagem', alunosTarget: 140, alunosViva: 30, participacao: 21.4, matriculadosInep: 185 },
  { franquia: 'Juiz de Fora', alunosTarget: 120, alunosViva: 24, participacao: 20.0, matriculadosInep: 155 },
];
const TARGET_ALUNOS_RANKING_IES = [
  { instituicao: 'UNAERP', matriculados: 1200, alunosViva: 310, participacao: 25.8 },
  { instituicao: 'UNIESP', matriculados: 860, alunosViva: 185, participacao: 21.5 },
  { instituicao: 'Barão de Mauá', matriculados: 640, alunosViva: 96, participacao: 15.0 },
  { instituicao: 'UNIFRAN', matriculados: 420, alunosViva: 42, participacao: 10.0 },
  { instituicao: 'UNIP', matriculados: 380, alunosViva: 52, participacao: 13.7 },
  { instituicao: 'USP - FMRP', matriculados: 300, alunosViva: 0, participacao: 0 },
];

const TARGET_TURMAS_RANKING_FRANQUIAS = [
  { franquia: 'Belo Horizonte', alunosTarget: 38, alunosViva: 12, participacao: 31.6, matriculadosInep: 48 },
  { franquia: 'Curitiba', alunosTarget: 22, alunosViva: 6, participacao: 27.3, matriculadosInep: 28 },
  { franquia: 'Fortaleza', alunosTarget: 18, alunosViva: 4, participacao: 22.2, matriculadosInep: 23 },
  { franquia: 'Uberlândia', alunosTarget: 15, alunosViva: 3, participacao: 20.0, matriculadosInep: 19 },
  { franquia: 'Salvador', alunosTarget: 12, alunosViva: 3, participacao: 25.0, matriculadosInep: 15 },
  { franquia: 'Recife', alunosTarget: 10, alunosViva: 3, participacao: 30.0, matriculadosInep: 12 },
  { franquia: 'Contagem', alunosTarget: 7, alunosViva: 1, participacao: 14.3, matriculadosInep: 9 },
  { franquia: 'Juiz de Fora', alunosTarget: 5, alunosViva: 1, participacao: 20.0, matriculadosInep: 6 },
];
const TARGET_TURMAS_RANKING_IES = [
  { instituicao: 'UNAERP', matriculados: 42, alunosViva: 11, participacao: 26.2 },
  { instituicao: 'UNIESP', matriculados: 31, alunosViva: 7, participacao: 22.6 },
  { instituicao: 'Barão de Mauá', matriculados: 24, alunosViva: 5, participacao: 20.8 },
  { instituicao: 'UNIFRAN', matriculados: 16, alunosViva: 3, participacao: 18.8 },
  { instituicao: 'UNIP', matriculados: 9, alunosViva: 2, participacao: 22.2 },
  { instituicao: 'USP - FMRP', matriculados: 5, alunosViva: 0, participacao: 0 },
];

const TARGET: BlocoTarget = {
  curso: 'Medicina',
  // Legacy fields (backward compat)
  totalAlunos: 3800,
  totalAlunosTarget: 2450,
  totalAlunosViva: 625,
  participacaoDoTotal: 16.4,
  participacaoDoTarget: 25.5,
  rankingFranquias: TARGET_ALUNOS_RANKING_FRANQUIAS,
  rankingInstituicoes: TARGET_ALUNOS_RANKING_IES,
  // New structured views
  alunos: {
    totalMercado: 3800,
    totalTarget: 2450,
    totalViva: 625,
    participacaoDoTotal: 16.4,
    participacaoDoTarget: 25.5,
    rankingFranquias: TARGET_ALUNOS_RANKING_FRANQUIAS,
    rankingInstituicoes: TARGET_ALUNOS_RANKING_IES,
  },
  turmas: {
    totalMercado: 192,
    totalTarget: 127,
    totalViva: 33,
    participacaoDoTotal: 17.2,
    participacaoDoTarget: 26.0,
    rankingFranquias: TARGET_TURMAS_RANKING_FRANQUIAS,
    rankingInstituicoes: TARGET_TURMAS_RANKING_IES,
  },
};

// ─── Export ─────────────────────────────────
export const MOCK_MARKET_SHARE_V2: DadosMarketShareV2 = {
  matriculados: MATRICULADOS,
  turmas: TURMAS,
  target: TARGET,
};
