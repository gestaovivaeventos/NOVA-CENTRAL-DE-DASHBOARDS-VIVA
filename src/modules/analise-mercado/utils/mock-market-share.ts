/**
 * Mock Data — Clientes & Market Share
 * Dados simulados para validação de layout.
 * Cenário: Franquia "Ribeirão Preto" com ~10 municípios no território.
 */

import type {
  DadosMarketShare,
  MarketShareResumo,
  MarketShareEvolucao,
  MarketShareCurso,
  MarketShareMunicipio,
  MarketShareInstituicao,
  ComparativoNacional,
} from '../types';

// ─── Evolução Market Share (2020-2024) ──────
const EVOLUCAO: MarketShareEvolucao[] = [
  { ano: 2020, mercadoTotal: 72400, clientesAlunos: 1250, participacao: 1.7 },
  { ano: 2021, mercadoTotal: 76800, clientesAlunos: 2100, participacao: 2.7 },
  { ano: 2022, mercadoTotal: 81200, clientesAlunos: 3080, participacao: 3.8 },
  { ano: 2023, mercadoTotal: 84600, clientesAlunos: 3720, participacao: 4.4 },
  { ano: 2024, mercadoTotal: 86200, clientesAlunos: 4350, participacao: 5.0 },
];

// ─── Market Share por Curso/Área ────────────
const POR_CURSO: MarketShareCurso[] = [
  { nome: 'Administração', area: 'Ciências Sociais Aplicadas', mercadoTotal: 12400, clientesViva: 820, participacao: 6.6, oportunidade: 11580 },
  { nome: 'Direito', area: 'Ciências Sociais Aplicadas', mercadoTotal: 10800, clientesViva: 540, participacao: 5.0, oportunidade: 10260 },
  { nome: 'Pedagogia', area: 'Educação', mercadoTotal: 9200, clientesViva: 680, participacao: 7.4, oportunidade: 8520 },
  { nome: 'Engenharia Civil', area: 'Engenharias', mercadoTotal: 6800, clientesViva: 310, participacao: 4.6, oportunidade: 6490 },
  { nome: 'Enfermagem', area: 'Ciências da Saúde', mercadoTotal: 5600, clientesViva: 420, participacao: 7.5, oportunidade: 5180 },
  { nome: 'Psicologia', area: 'Ciências Humanas', mercadoTotal: 4900, clientesViva: 280, participacao: 5.7, oportunidade: 4620 },
  { nome: 'Ciências Contábeis', area: 'Ciências Sociais Aplicadas', mercadoTotal: 4200, clientesViva: 350, participacao: 8.3, oportunidade: 3850 },
  { nome: 'Medicina', area: 'Ciências da Saúde', mercadoTotal: 3800, clientesViva: 0, participacao: 0, oportunidade: 3800 },
  { nome: 'Sistemas de Informação', area: 'Ciências Exatas', mercadoTotal: 3600, clientesViva: 290, participacao: 8.1, oportunidade: 3310 },
  { nome: 'Educação Física', area: 'Ciências da Saúde', mercadoTotal: 3400, clientesViva: 180, participacao: 5.3, oportunidade: 3220 },
  { nome: 'Farmácia', area: 'Ciências da Saúde', mercadoTotal: 2800, clientesViva: 160, participacao: 5.7, oportunidade: 2640 },
  { nome: 'Arquitetura e Urbanismo', area: 'Engenharias', mercadoTotal: 2200, clientesViva: 120, participacao: 5.5, oportunidade: 2080 },
  { nome: 'Nutrição', area: 'Ciências da Saúde', mercadoTotal: 1800, clientesViva: 100, participacao: 5.6, oportunidade: 1700 },
  { nome: 'Fisioterapia', area: 'Ciências da Saúde', mercadoTotal: 1600, clientesViva: 60, participacao: 3.8, oportunidade: 1540 },
  { nome: 'Eng. de Produção', area: 'Engenharias', mercadoTotal: 1400, clientesViva: 40, participacao: 2.9, oportunidade: 1360 },
];

// ─── Market Share por Município ─────────────
const POR_MUNICIPIO: MarketShareMunicipio[] = [
  { nome: 'Ribeirão Preto', uf: 'SP', mercadoTotal: 32400, clientesViva: 1820, participacao: 5.6, oportunidade: 30580, instituicoes: 18 },
  { nome: 'Franca', uf: 'SP', mercadoTotal: 11200, clientesViva: 680, participacao: 6.1, oportunidade: 10520, instituicoes: 8 },
  { nome: 'Araraquara', uf: 'SP', mercadoTotal: 9800, clientesViva: 520, participacao: 5.3, oportunidade: 9280, instituicoes: 7 },
  { nome: 'São Carlos', uf: 'SP', mercadoTotal: 12600, clientesViva: 380, participacao: 3.0, oportunidade: 12220, instituicoes: 6 },
  { nome: 'Sertãozinho', uf: 'SP', mercadoTotal: 4200, clientesViva: 340, participacao: 8.1, oportunidade: 3860, instituicoes: 3 },
  { nome: 'Barretos', uf: 'SP', mercadoTotal: 5100, clientesViva: 210, participacao: 4.1, oportunidade: 4890, instituicoes: 4 },
  { nome: 'Bebedouro', uf: 'SP', mercadoTotal: 2800, clientesViva: 150, participacao: 5.4, oportunidade: 2650, instituicoes: 2 },
  { nome: 'Jaboticabal', uf: 'SP', mercadoTotal: 3400, clientesViva: 120, participacao: 3.5, oportunidade: 3280, instituicoes: 3 },
  { nome: 'Batatais', uf: 'SP', mercadoTotal: 2200, clientesViva: 80, participacao: 3.6, oportunidade: 2120, instituicoes: 2 },
  { nome: 'Orlândia', uf: 'SP', mercadoTotal: 2500, clientesViva: 50, participacao: 2.0, oportunidade: 2450, instituicoes: 2 },
];

// ─── Market Share por Instituição ───────────
const POR_INSTITUICAO: MarketShareInstituicao[] = [
  { nome: 'UNAERP', tipo: 'privada', municipio: 'Ribeirão Preto', uf: 'SP', totalAlunos: 8200, alunosClientes: 620, participacao: 7.6, cursos: 42 },
  { nome: 'USP Ribeirão Preto', tipo: 'publica', municipio: 'Ribeirão Preto', uf: 'SP', totalAlunos: 6800, alunosClientes: 0, participacao: 0, cursos: 28 },
  { nome: 'Barão de Mauá', tipo: 'privada', municipio: 'Ribeirão Preto', uf: 'SP', totalAlunos: 5400, alunosClientes: 480, participacao: 8.9, cursos: 35 },
  { nome: 'UNIFRAN', tipo: 'privada', municipio: 'Franca', uf: 'SP', totalAlunos: 4600, alunosClientes: 380, participacao: 8.3, cursos: 30 },
  { nome: 'Moura Lacerda', tipo: 'privada', municipio: 'Ribeirão Preto', uf: 'SP', totalAlunos: 3800, alunosClientes: 320, participacao: 8.4, cursos: 22 },
  { nome: 'UNIARA', tipo: 'privada', municipio: 'Araraquara', uf: 'SP', totalAlunos: 3400, alunosClientes: 280, participacao: 8.2, cursos: 25 },
  { nome: 'USP São Carlos', tipo: 'publica', municipio: 'São Carlos', uf: 'SP', totalAlunos: 5200, alunosClientes: 0, participacao: 0, cursos: 18 },
  { nome: 'UFSCar', tipo: 'publica', municipio: 'São Carlos', uf: 'SP', totalAlunos: 4800, alunosClientes: 180, participacao: 3.8, cursos: 38 },
  { nome: 'UNESP Araraquara', tipo: 'publica', municipio: 'Araraquara', uf: 'SP', totalAlunos: 3200, alunosClientes: 120, participacao: 3.8, cursos: 15 },
  { nome: 'FATEC Franca', tipo: 'publica', municipio: 'Franca', uf: 'SP', totalAlunos: 1800, alunosClientes: 140, participacao: 7.8, cursos: 6 },
  { nome: 'COC Ribeirão', tipo: 'privada', municipio: 'Ribeirão Preto', uf: 'SP', totalAlunos: 4200, alunosClientes: 360, participacao: 8.6, cursos: 28 },
  { nome: 'UNIFEB', tipo: 'privada', municipio: 'Barretos', uf: 'SP', totalAlunos: 2600, alunosClientes: 210, participacao: 8.1, cursos: 18 },
  { nome: 'Claretiano', tipo: 'privada', municipio: 'Batatais', uf: 'SP', totalAlunos: 3600, alunosClientes: 140, participacao: 3.9, cursos: 20 },
  { nome: 'UNESP Jaboticabal', tipo: 'publica', municipio: 'Jaboticabal', uf: 'SP', totalAlunos: 2100, alunosClientes: 60, participacao: 2.9, cursos: 8 },
  { nome: 'IFSP Sertãozinho', tipo: 'publica', municipio: 'Sertãozinho', uf: 'SP', totalAlunos: 1200, alunosClientes: 160, participacao: 13.3, cursos: 5 },
];

// ─── Comparativo Nacional ───────────────────
const COMPARATIVO: ComparativoNacional[] = [
  { metrica: 'Matrículas por 1.000 hab.', valorTerritorio: 48.2, valorNacional: 41.6, razao: 1.16 },
  { metrica: 'Concluintes por 1.000 hab.', valorTerritorio: 12.8, valorNacional: 10.4, razao: 1.23 },
  { metrica: 'IES por 100.000 hab.', valorTerritorio: 3.2, valorNacional: 2.1, razao: 1.52 },
  { metrica: 'Taxa de conclusão (%)', valorTerritorio: 26.5, valorNacional: 24.8, razao: 1.07 },
  { metrica: 'Alunos/IES (média)', valorTerritorio: 1580, valorNacional: 1920, razao: 0.82 },
];

// ─── Resumo ─────────────────────────────────
const totalClientes = POR_INSTITUICAO.reduce((s, i) => s + i.alunosClientes, 0);
const mercadoTotal = POR_MUNICIPIO.reduce((s, m) => s + m.mercadoTotal, 0);
const totalTurmas = Math.round(mercadoTotal / 28);
const turmasClientes = Math.round(totalClientes / 28);

const RESUMO: MarketShareResumo = {
  mercadoTotalAlunos: mercadoTotal,
  alunosClientes: totalClientes,
  participacaoAlunos: Number(((totalClientes / mercadoTotal) * 100).toFixed(1)),
  mercadoTotalTurmas: totalTurmas,
  turmasClientes: turmasClientes,
  participacaoTurmas: Number(((turmasClientes / totalTurmas) * 100).toFixed(1)),
  totalInstituicoes: POR_INSTITUICAO.length,
  instituicoesClientes: POR_INSTITUICAO.filter(i => i.alunosClientes > 0).length,
  receitaPotencial: mercadoTotal * 82,
  receitaAtual: totalClientes * 82,
  gapReceita: (mercadoTotal - totalClientes) * 82,
  ticketMedio: 82,
};

// ─── Top Oportunidades ──────────────────────
const TOP_OPORTUNIDADES = [...POR_CURSO]
  .sort((a, b) => b.oportunidade - a.oportunidade)
  .slice(0, 8);

// ─── Export ─────────────────────────────────
export const MOCK_MARKET_SHARE: DadosMarketShare = {
  resumo: RESUMO,
  evolucao: EVOLUCAO,
  porCurso: POR_CURSO,
  porMunicipio: POR_MUNICIPIO,
  porInstituicao: POR_INSTITUICAO,
  comparativoNacional: COMPARATIVO,
  topOportunidades: TOP_OPORTUNIDADES,
};
