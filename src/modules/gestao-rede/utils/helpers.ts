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
  const postosAvancados = franquias.filter(f => f.postoAvancado);

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
        cor: '#17a2b8',
        franquias: emImplantacao,
      },
      {
        id: 'operacao',
        nome: 'Em Operação',
        valor: resumo.emOperacao,
        porcentagem: total > 0 ? (resumo.emOperacao / total) * 100 : 0,
        cor: '#20c997',
        franquias: emOperacao,
        children: [
          {
            id: 'incubacao',
            nome: 'Em Incubação',
            valor: resumo.emIncubacao,
            porcentagem: resumo.emOperacao > 0 ? (resumo.emIncubacao / resumo.emOperacao) * 100 : 0,
            cor: '#ffc107',
            franquias: emIncubacao,
            children: [
              {
                id: 'incubacao1',
                nome: '1º Ano de Operação',
                valor: resumo.incubacao1,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao1 / resumo.emIncubacao) * 100 : 0,
                cor: '#f8d568',
                franquias: incubacao1,
              },
              {
                id: 'incubacao2',
                nome: '2º Ano de Operação',
                valor: resumo.incubacao2,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao2 / resumo.emIncubacao) * 100 : 0,
                cor: '#f0c040',
                franquias: incubacao2,
              },
              {
                id: 'incubacao3',
                nome: '3º Ano de Operação',
                valor: resumo.incubacao3,
                porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao3 / resumo.emIncubacao) * 100 : 0,
                cor: '#e8a800',
                franquias: incubacao3,
              },
            ],
          },
          {
            id: 'maduras',
            nome: 'Maduras',
            valor: resumo.maduras,
            porcentagem: resumo.emOperacao > 0 ? (resumo.maduras / resumo.emOperacao) * 100 : 0,
            cor: '#198754',
            franquias: maduras,
          },
        ],
      },
      {
        id: 'inativas',
        nome: 'Franquias Inativas',
        valor: resumo.inativas,
        porcentagem: resumo.totalFranquias > 0 ? (resumo.inativas / resumo.totalFranquias) * 100 : 0,
        cor: '#dc3545',
        franquias: inativas,
        children: [
          {
            id: 'encerradas-operacao',
            nome: 'Encerradas em Operação',
            valor: resumo.encerradasOperacao,
            porcentagem: resumo.inativas > 0 ? (resumo.encerradasOperacao / resumo.inativas) * 100 : 0,
            cor: '#c0392b',
            franquias: encerradasOperacao,
          },
          {
            id: 'encerradas-implantacao',
            nome: 'Encerradas em Implantação',
            valor: resumo.encerradasImplantacao,
            porcentagem: resumo.inativas > 0 ? (resumo.encerradasImplantacao / resumo.inativas) * 100 : 0,
            cor: '#e74c3c',
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
 * Cores do tema
 */
export const CORES = {
  ativas: '#28a745',
  inativas: '#dc3545',
  implantacao: '#17a2b8',
  operacao: '#20c997',
  incubacao: '#ffc107',
  incubacao1: '#f8d568',
  incubacao2: '#f0c040',
  incubacao3: '#e8a800',
  maduras: '#198754',
  primaria: '#FF6600',
  fundo: '#212529',
  card: '#343A40',
  texto: '#F8F9FA',
  textoSecundario: '#adb5bd',
  // Saúde PEX
  topPerformance: '#28a745',
  performando: '#20c997',
  atencao: '#ffc107',
  utiRecuperacao: '#fd7e14',
  utiRepasse: '#dc3545',
};
