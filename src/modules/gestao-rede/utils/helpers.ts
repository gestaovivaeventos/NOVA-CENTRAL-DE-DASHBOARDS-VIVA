// ============================================
// Helpers - Gestão Rede
// Atualizado para novos tipos da planilha BASE GESTAO REDE
// ============================================

import { Franquia, ResumoRede, TreeNode } from '../types';

/**
 * Calcula o resumo estatístico da rede
 */
export function calcularResumoRede(franquias: Franquia[]): ResumoRede {
  const ativas = franquias.filter(f => f.status === 'ATIVA');
  const inativas = franquias.filter(f => f.status === 'INATIVA');
  const encerradasOperacao = inativas.filter(f => f.statusInativacao === 'ENCERRADA_OPERACAO');
  const encerradasImplantacao = inativas.filter(f => f.statusInativacao === 'ENCERRADA_IMPLANTACAO');
  
  // Baseado na maturidade
  const emImplantacao = ativas.filter(f => f.maturidade === 'IMPLANTACAO');
  const emOperacao = ativas.filter(f => f.maturidade !== 'IMPLANTACAO');
  
  // Incubação = 1º, 2º ou 3º ano de operação
  const incubacao1 = ativas.filter(f => f.maturidade === '1º ANO OP.');
  const incubacao2 = ativas.filter(f => f.maturidade === '2º ANO OP.');
  const incubacao3 = ativas.filter(f => f.maturidade === '3º ANO OP.');
  const emIncubacao = [...incubacao1, ...incubacao2, ...incubacao3];
  
  const maduras = ativas.filter(f => f.maturidade === 'MADURA');
  const postosAvancados = franquias.filter(f => f.postosAvancados && f.postosAvancados.length > 0);

  return {
    totalFranquias: franquias.length,
    ativas: ativas.length,
    inativas: inativas.length,
    encerradasOperacao: encerradasOperacao.length,
    encerradasImplantacao: encerradasImplantacao.length,
    emImplantacao: emImplantacao.length,
    emOperacao: emOperacao.length,
    emIncubacao: emIncubacao.length,
    maduras: maduras.length,
    incubacao1: incubacao1.length,
    incubacao2: incubacao2.length,
    incubacao3: incubacao3.length,
    postosAvancados: postosAvancados.length,
  };
}

/**
 * Monta a estrutura de árvore hierárquica para visualização
 */
export function montarArvoreHierarquica(franquias: Franquia[]): TreeNode {
  const resumo = calcularResumoRede(franquias);
  const total = resumo.ativas; // Apenas ativas no total principal

  // Separar franquias por categoria
  const ativas = franquias.filter(f => f.status === 'ATIVA');
  const inativas = franquias.filter(f => f.status === 'INATIVA');
  const encerradasOperacao = inativas.filter(f => f.statusInativacao === 'ENCERRADA_OPERACAO');
  const encerradasImplantacao = inativas.filter(f => f.statusInativacao === 'ENCERRADA_IMPLANTACAO');
  
  const emImplantacao = ativas.filter(f => f.maturidade === 'IMPLANTACAO');
  const emOperacao = ativas.filter(f => f.maturidade !== 'IMPLANTACAO');
  
  const incubacao1 = ativas.filter(f => f.maturidade === '1º ANO OP.');
  const incubacao2 = ativas.filter(f => f.maturidade === '2º ANO OP.');
  const incubacao3 = ativas.filter(f => f.maturidade === '3º ANO OP.');
  const emIncubacao = [...incubacao1, ...incubacao2, ...incubacao3];
  const maduras = ativas.filter(f => f.maturidade === 'MADURA');

  return {
    id: 'root',
    nome: 'Franquias Ativas',
    valor: total,
    porcentagem: 100,
    cor: '#FF6600',
    children: [
      {
        id: 'implantacao',
        nome: 'Em Implantação',
        valor: resumo.emImplantacao,
        porcentagem: total > 0 ? (resumo.emImplantacao / total) * 100 : 0,
        cor: '#FF6600',
        franquias: emImplantacao,
      },
      {
        id: 'operacao',
        nome: 'Em Operação',
        valor: resumo.emOperacao,
        porcentagem: total > 0 ? (resumo.emOperacao / total) * 100 : 0,
        cor: '#FF6600',
        franquias: emOperacao,
        children: [
          {
            id: 'incubacao',
            nome: 'Em Incubação',
            valor: resumo.emIncubacao,
            porcentagem: resumo.emOperacao > 0 ? (resumo.emIncubacao / resumo.emOperacao) * 100 : 0,
            cor: '#FF6600',
            franquias: emIncubacao,
            children: [
              {
                id: 'incubacao1',
                nome: '1º Ano de Operação',
                valor: resumo.incubacao1,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao1 / resumo.emIncubacao) * 100 : 0,
                cor: '#FF6600',
                franquias: incubacao1,
              },
              {
                id: 'incubacao2',
                nome: '2º Ano de Operação',
                valor: resumo.incubacao2,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao2 / resumo.emIncubacao) * 100 : 0,
                cor: '#FF6600',
                franquias: incubacao2,
              },
              {
                id: 'incubacao3',
                nome: '3º Ano de Operação',
                valor: resumo.incubacao3,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao3 / resumo.emIncubacao) * 100 : 0,
                cor: '#FF6600',
                franquias: incubacao3,
              },
            ],
          },
          {
            id: 'maduras',
            nome: 'Maduras',
            valor: resumo.maduras,
            porcentagem: resumo.emOperacao > 0 ? (resumo.maduras / resumo.emOperacao) * 100 : 0,
            cor: '#FF6600',
            franquias: maduras,
          },
        ],
      },
      {
        id: 'inativas',
        nome: 'Franquias Inativas',
        valor: resumo.inativas,
        porcentagem: resumo.totalFranquias > 0 ? (resumo.inativas / resumo.totalFranquias) * 100 : 0,
        cor: '#c0392b',
        franquias: inativas,
        children: [
          {
            id: 'encerradas-operacao',
            nome: 'Encerradas em Operação',
            valor: resumo.encerradasOperacao,
            porcentagem: resumo.inativas > 0 ? (resumo.encerradasOperacao / resumo.inativas) * 100 : 0,
            cor: '#943126',
            franquias: encerradasOperacao,
          },
          {
            id: 'encerradas-implantacao',
            nome: 'Encerradas em Implantação',
            valor: resumo.encerradasImplantacao,
            porcentagem: resumo.inativas > 0 ? (resumo.encerradasImplantacao / resumo.inativas) * 100 : 0,
            cor: '#6c2134',
            franquias: encerradasImplantacao,
          },
        ],
      },
    ],
  };
}

/**
 * Formata número como porcentagem
 */
export function formatarPorcentagem(valor: number): string {
  return `${valor.toFixed(1)}%`;
}

/**
 * Cores do tema - Cores de saúde definidas pelo usuário
 * TOP Performance = azul, Performando = verde, Em Consolidação = laranja
 * Atenção = amarelo, UTI = vermelho
 */
export const CORES = {
  // Status - usar laranja como cor principal
  ativas: '#27ae60',        // verde
  inativas: '#c0392b',      // vermelho
  implantacao: '#FF6600',   // laranja Viva
  operacao: '#FF6600',      // laranja Viva
  incubacao: '#FF6600',     // laranja Viva
  incubacao1: '#FF6600',    // laranja Viva
  incubacao2: '#FF6600',    // laranja Viva
  incubacao3: '#FF6600',    // laranja Viva
  maduras: '#FF6600',       // laranja Viva
  
  // Cores principais
  primaria: '#FF6600',      // laranja Viva
  fundo: '#212529',
  card: '#343A40',
  cardInterno: '#2a2d31',
  borda: '#3a3d41',
  texto: '#F8F9FA',
  textoSecundario: '#adb5bd',
  textoTerciario: '#6c757d',
  
  // Saúde PEX - cores definidas pelo usuário
  topPerformance: '#2980b9',   // azul
  performando: '#27ae60',      // verde
  emConsolidacao: '#e67e22',   // laranja
  atencao: '#f1c40f',          // amarelo
  uti: '#c0392b',              // vermelho
  utiRecuperacao: '#943126',   // vermelho escuro
  utiRepasse: '#6c2134',       // vermelho muito escuro
};
