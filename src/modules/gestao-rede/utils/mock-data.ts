// ============================================
// Dados Mockados - Gestão Rede
// ============================================

import { Franquia, ClassificacaoPEX, FlagsEstruturais, SegmentoMercado } from '../types';

/**
 * Lista de cidades para geração de dados mockados
 */
const cidades = [
  { cidade: 'São Paulo', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Rio de Janeiro', estado: 'RJ', regiao: 'Sudeste' },
  { cidade: 'Belo Horizonte', estado: 'MG', regiao: 'Sudeste' },
  { cidade: 'Curitiba', estado: 'PR', regiao: 'Sul' },
  { cidade: 'Porto Alegre', estado: 'RS', regiao: 'Sul' },
  { cidade: 'Florianópolis', estado: 'SC', regiao: 'Sul' },
  { cidade: 'Salvador', estado: 'BA', regiao: 'Nordeste' },
  { cidade: 'Recife', estado: 'PE', regiao: 'Nordeste' },
  { cidade: 'Fortaleza', estado: 'CE', regiao: 'Nordeste' },
  { cidade: 'Brasília', estado: 'DF', regiao: 'Centro-Oeste' },
  { cidade: 'Goiânia', estado: 'GO', regiao: 'Centro-Oeste' },
  { cidade: 'Campo Grande', estado: 'MS', regiao: 'Centro-Oeste' },
  { cidade: 'Manaus', estado: 'AM', regiao: 'Norte' },
  { cidade: 'Belém', estado: 'PA', regiao: 'Norte' },
  { cidade: 'Campinas', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Ribeirão Preto', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Santos', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Joinville', estado: 'SC', regiao: 'Sul' },
  { cidade: 'Londrina', estado: 'PR', regiao: 'Sul' },
  { cidade: 'Natal', estado: 'RN', regiao: 'Nordeste' },
  { cidade: 'João Pessoa', estado: 'PB', regiao: 'Nordeste' },
  { cidade: 'Maceió', estado: 'AL', regiao: 'Nordeste' },
  { cidade: 'Vitória', estado: 'ES', regiao: 'Sudeste' },
  { cidade: 'Niterói', estado: 'RJ', regiao: 'Sudeste' },
  { cidade: 'Uberlândia', estado: 'MG', regiao: 'Sudeste' },
  { cidade: 'Maringá', estado: 'PR', regiao: 'Sul' },
  { cidade: 'Blumenau', estado: 'SC', regiao: 'Sul' },
  { cidade: 'Caxias do Sul', estado: 'RS', regiao: 'Sul' },
  { cidade: 'Aracaju', estado: 'SE', regiao: 'Nordeste' },
  { cidade: 'Teresina', estado: 'PI', regiao: 'Nordeste' },
  { cidade: 'Cuiabá', estado: 'MT', regiao: 'Centro-Oeste' },
  { cidade: 'Porto Velho', estado: 'RO', regiao: 'Norte' },
  { cidade: 'São Luís', estado: 'MA', regiao: 'Nordeste' },
  { cidade: 'Palmas', estado: 'TO', regiao: 'Norte' },
  { cidade: 'Boa Vista', estado: 'RR', regiao: 'Norte' },
  { cidade: 'Macapá', estado: 'AP', regiao: 'Norte' },
  { cidade: 'Rio Branco', estado: 'AC', regiao: 'Norte' },
  { cidade: 'Juiz de Fora', estado: 'MG', regiao: 'Sudeste' },
  { cidade: 'Sorocaba', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'São José dos Campos', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Bauru', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Piracicaba', estado: 'SP', regiao: 'Sudeste' },
  { cidade: 'Cascavel', estado: 'PR', regiao: 'Sul' },
  { cidade: 'Ponta Grossa', estado: 'PR', regiao: 'Sul' },
  { cidade: 'Pelotas', estado: 'RS', regiao: 'Sul' },
  { cidade: 'Chapecó', estado: 'SC', regiao: 'Sul' },
  { cidade: 'Feira de Santana', estado: 'BA', regiao: 'Nordeste' },
  { cidade: 'Petrolina', estado: 'PE', regiao: 'Nordeste' },
  { cidade: 'Caruaru', estado: 'PE', regiao: 'Nordeste' },
];

const nomes = [
  'Maria Silva', 'João Santos', 'Ana Oliveira', 'Pedro Costa', 'Carla Souza',
  'Lucas Ferreira', 'Juliana Lima', 'Rafael Almeida', 'Fernanda Rodrigues', 'Bruno Pereira',
  'Patricia Gomes', 'Marcelo Ribeiro', 'Camila Martins', 'Diego Nascimento', 'Amanda Carvalho',
  'Thiago Araújo', 'Letícia Barbosa', 'Felipe Cardoso', 'Daniela Moreira', 'Gustavo Correia',
  'Vanessa Dias', 'Ricardo Nunes', 'Aline Castro', 'Eduardo Rocha', 'Mariana Mendes',
  'Paulo Freitas', 'Tatiana Vieira', 'Leonardo Teixeira', 'Renata Campos', 'Alexandre Pinto',
  'Claudia Monteiro', 'Roberto Azevedo', 'Simone Barros', 'Fabio Cavalcanti', 'Sandra Melo',
  'Rodrigo Andrade', 'Monica Xavier', 'Carlos Fonseca', 'Adriana Machado', 'Marcos Duarte',
  'Lucia Santos', 'Jose Oliveira', 'Teresa Costa', 'Antonio Souza', 'Helena Ferreira',
  'Francisco Lima', 'Rosa Almeida', 'Luis Rodrigues', 'Beatriz Pereira', 'Manuel Gomes',
];

const consultores = [
  'Carlos Mendes', 'Ana Paula Silva', 'Roberto Oliveira', 'Mariana Costa', 'Fernando Lima'
];

/**
 * Gera score PEX aleatório baseado na maturidade
 */
function gerarScorePEX(maturidade?: string, statusOperacao?: string): number {
  if (statusOperacao === 'IMPLANTACAO') {
    return 0; // Sem score durante implantação
  }
  
  if (maturidade === 'MADURA') {
    return Math.floor(Math.random() * 40) + 60; // 60-100
  }
  
  return Math.floor(Math.random() * 70) + 30; // 30-100
}

/**
 * Classifica franquia baseado no score PEX
 */
function classificarPEX(score: number): ClassificacaoPEX {
  if (score > 95) return 'TOP_PERFORMANCE';
  if (score >= 70) return 'PERFORMANDO';
  if (score >= 50) return 'ATENCAO';
  return Math.random() > 0.5 ? 'UTI_RECUPERACAO' : 'UTI_REPASSE';
}

/**
 * Gera flags estruturais aleatórias
 */
function gerarFlags(score: number): FlagsEstruturais {
  const chanceFlag = score < 50 ? 0.4 : score < 70 ? 0.2 : 0.05;
  
  return {
    socioOperador: Math.random() < chanceFlag,
    timeCritico: Math.random() < chanceFlag,
    governanca: Math.random() < chanceFlag * 0.5,
  };
}

/**
 * Gera segmento de mercado aleatório com distribuição realista
 */
function gerarSegmentoMercado(): SegmentoMercado {
  const rand = Math.random();
  if (rand < 0.55) return 'PADRAO';  // 55%
  if (rand < 0.80) return 'MASTER';  // 25%
  if (rand < 0.95) return 'MEGA';    // 15%
  return 'GIGA';                      // 5%
}

/**
 * Gera classificação PEX do mês anterior com base no score atual
 * Simula variação de -15 a +15 pontos
 */
function gerarClassificacaoPEXAnterior(scorePEXAtual: number): ClassificacaoPEX {
  const variacao = (Math.random() - 0.5) * 30;
  const scoreAnterior = Math.max(0, Math.min(100, scorePEXAtual + variacao));
  return classificarPEX(scoreAnterior);
}

/**
 * Gera dados mockados de franquias
 * Total: 49 franquias (45 ativas + 4 inativas)
 */
export function gerarDadosMockados(): Franquia[] {
  const franquias: Franquia[] = [];
  let id = 1;

  // 32 Franquias Maduras (ativas, em operação, maduras)
  for (let i = 0; i < 32; i++) {
    const cidadeInfo = cidades[i % cidades.length];
    const dataAbertura = new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const dataOperacao = new Date(dataAbertura.getTime() + (90 * 24 * 60 * 60 * 1000)); // +90 dias
    const scorePEX = gerarScorePEX('MADURA', 'OPERACAO');
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'ATIVA',
      statusOperacao: 'OPERACAO',
      maturidade: 'MADURA',
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      dataInicioOperacao: dataOperacao.toISOString().split('T')[0],
      responsavel: nomes[i % nomes.length],
      email: `${nomes[i % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      consultor: consultores[i % consultores.length],
      segmentoMercado: gerarSegmentoMercado(),
      scorePEX,
      classificacaoPEX: classificarPEX(scorePEX),
      classificacaoPEXAnterior: gerarClassificacaoPEXAnterior(scorePEX),
      flags: gerarFlags(scorePEX),
    });
    id++;
  }

  // 5 Franquias em Incubação (2 no 1º ano, 2 no 2º ano, 1 no 3º ano)
  const incubacaoDistribuicao = [1, 1, 2, 2, 3];
  for (let i = 0; i < 5; i++) {
    const cidadeInfo = cidades[(32 + i) % cidades.length];
    const dataAbertura = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    const dataOperacao = new Date(dataAbertura.getTime() + (60 * 24 * 60 * 60 * 1000)); // +60 dias
    const scorePEX = gerarScorePEX('INCUBACAO', 'OPERACAO');
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'ATIVA',
      statusOperacao: 'OPERACAO',
      maturidade: 'INCUBACAO',
      faseIncubacao: incubacaoDistribuicao[i] as 1 | 2 | 3,
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      dataInicioOperacao: dataOperacao.toISOString().split('T')[0],
      responsavel: nomes[(32 + i) % nomes.length],
      email: `${nomes[(32 + i) % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      consultor: consultores[(32 + i) % consultores.length],
      segmentoMercado: gerarSegmentoMercado(),
      scorePEX,
      classificacaoPEX: classificarPEX(scorePEX),
      classificacaoPEXAnterior: gerarClassificacaoPEXAnterior(scorePEX),
      flags: gerarFlags(scorePEX),
    });
    id++;
  }

  // 8 Franquias em Implantação
  for (let i = 0; i < 8; i++) {
    const cidadeInfo = cidades[(37 + i) % cidades.length];
    const dataAbertura = new Date(2025, Math.floor(Math.random() * 6) + 6, Math.floor(Math.random() * 28) + 1);
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'ATIVA',
      statusOperacao: 'IMPLANTACAO',
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      responsavel: nomes[(37 + i) % nomes.length],
      email: `${nomes[(37 + i) % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      consultor: consultores[(37 + i) % consultores.length],
      segmentoMercado: gerarSegmentoMercado(),
      scorePEX: 0,
      classificacaoPEX: 'ATENCAO',
      classificacaoPEXAnterior: 'ATENCAO',
      flags: { socioOperador: false, timeCritico: false, governanca: false },
    });
    id++;
  }

  // 2 Franquias Inativas - Encerradas em Operação
  for (let i = 0; i < 2; i++) {
    const cidadeInfo = cidades[(45 + i) % cidades.length];
    const dataAbertura = new Date(2019, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const dataOperacao = new Date(dataAbertura.getTime() + (90 * 24 * 60 * 60 * 1000));
    const dataEncerramento = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'INATIVA',
      motivoEncerramento: 'ENCERRADA_OPERACAO',
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      dataInicioOperacao: dataOperacao.toISOString().split('T')[0],
      dataEncerramento: dataEncerramento.toISOString().split('T')[0],
      responsavel: nomes[(45 + i) % nomes.length],
      email: `${nomes[(45 + i) % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      segmentoMercado: gerarSegmentoMercado(),
      scorePEX: 0,
      classificacaoPEX: 'UTI_REPASSE',
      classificacaoPEXAnterior: 'UTI_REPASSE',
      flags: { socioOperador: false, timeCritico: false, governanca: false },
    });
    id++;
  }

  // 2 Franquias Inativas - Encerradas em Implantação
  for (let i = 0; i < 2; i++) {
    const cidadeInfo = cidades[(47 + i) % cidades.length];
    const dataAbertura = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const dataEncerramento = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'INATIVA',
      motivoEncerramento: 'ENCERRADA_IMPLANTACAO',
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      dataEncerramento: dataEncerramento.toISOString().split('T')[0],
      responsavel: nomes[(47 + i) % nomes.length],
      email: `${nomes[(47 + i) % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
      segmentoMercado: gerarSegmentoMercado(),
      scorePEX: 0,
      classificacaoPEX: 'UTI_REPASSE',
      classificacaoPEXAnterior: 'UTI_REPASSE',
      flags: { socioOperador: false, timeCritico: false, governanca: false },
    });
    id++;
  }

  return franquias;
}

/**
 * Dados mockados pré-gerados para uso direto
 */
export const FRANQUIAS_MOCK = gerarDadosMockados();
