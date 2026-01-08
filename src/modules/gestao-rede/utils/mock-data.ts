// ============================================
// Dados Mockados - Gestão Rede
// ============================================

import { Franquia } from '../types';

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
 * Gera dados mockados de franquias
 * Total: 49 franquias (45 ativas + 4 inativas)
 * - 8 em implantação
 * - 5 em incubação (distribuídas em fase 1, 2 e 3)
 * - 32 maduras
 */
export function gerarDadosMockados(): Franquia[] {
  const franquias: Franquia[] = [];
  let id = 1;

  // 32 Franquias Maduras (ativas, em operação, maduras)
  for (let i = 0; i < 32; i++) {
    const cidadeInfo = cidades[i % cidades.length];
    const dataAbertura = new Date(2020, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const dataOperacao = new Date(dataAbertura.getTime() + (90 * 24 * 60 * 60 * 1000)); // +90 dias
    
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
    });
    id++;
  }

  // 5 Franquias em Incubação (2 fase 1, 2 fase 2, 1 fase 3)
  const incubacaoDistribuicao = [1, 1, 2, 2, 3];
  for (let i = 0; i < 5; i++) {
    const cidadeInfo = cidades[(32 + i) % cidades.length];
    const dataAbertura = new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1);
    const dataOperacao = new Date(dataAbertura.getTime() + (60 * 24 * 60 * 60 * 1000)); // +60 dias
    
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
    });
    id++;
  }

  // 4 Franquias Inativas
  for (let i = 0; i < 4; i++) {
    const cidadeInfo = cidades[(45 + i) % cidades.length];
    const dataAbertura = new Date(2019, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    
    franquias.push({
      id: `FR${String(id).padStart(3, '0')}`,
      nome: `Viva ${cidadeInfo.cidade}`,
      cidade: cidadeInfo.cidade,
      estado: cidadeInfo.estado,
      regiao: cidadeInfo.regiao,
      status: 'INATIVA',
      dataAbertura: dataAbertura.toISOString().split('T')[0],
      responsavel: nomes[(45 + i) % nomes.length],
      email: `${nomes[(45 + i) % nomes.length].toLowerCase().replace(' ', '.')}@vivaeventos.com.br`,
      telefone: `(${Math.floor(Math.random() * 90) + 10}) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
    });
    id++;
  }

  return franquias;
}

/**
 * Dados mockados pré-gerados para uso direto
 */
export const FRANQUIAS_MOCK = gerarDadosMockados();
