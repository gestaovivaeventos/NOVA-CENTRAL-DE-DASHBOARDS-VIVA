// ============================================
// Helpers - Gestão Rede
// ============================================

import { Franquia, ResumoRede, TreeNode } from '../types';

/**
 * Calcula o resumo estatístico da rede
 */
export function calcularResumoRede(franquias: Franquia[]): ResumoRede {
  const ativas = franquias.filter(f => f.status === 'ATIVA');
  const inativas = franquias.filter(f => f.status === 'INATIVA');
  const emImplantacao = ativas.filter(f => f.statusOperacao === 'IMPLANTACAO');
  const emOperacao = ativas.filter(f => f.statusOperacao === 'OPERACAO');
  const emIncubacao = emOperacao.filter(f => f.maturidade === 'INCUBACAO');
  const maduras = emOperacao.filter(f => f.maturidade === 'MADURA');
  const incubacao1 = emIncubacao.filter(f => f.faseIncubacao === 1);
  const incubacao2 = emIncubacao.filter(f => f.faseIncubacao === 2);
  const incubacao3 = emIncubacao.filter(f => f.faseIncubacao === 3);

  return {
    totalFranquias: franquias.length,
    ativas: ativas.length,
    inativas: inativas.length,
    emImplantacao: emImplantacao.length,
    emOperacao: emOperacao.length,
    emIncubacao: emIncubacao.length,
    maduras: maduras.length,
    incubacao1: incubacao1.length,
    incubacao2: incubacao2.length,
    incubacao3: incubacao3.length,
  };
}

/**
 * Monta a estrutura de árvore hierárquica para visualização
 */
export function montarArvoreHierarquica(franquias: Franquia[]): TreeNode {
  const resumo = calcularResumoRede(franquias);
  const total = resumo.totalFranquias;

  // Separar franquias por categoria
  const ativas = franquias.filter(f => f.status === 'ATIVA');
  const inativas = franquias.filter(f => f.status === 'INATIVA');
  const emImplantacao = ativas.filter(f => f.statusOperacao === 'IMPLANTACAO');
  const emOperacao = ativas.filter(f => f.statusOperacao === 'OPERACAO');
  const emIncubacao = emOperacao.filter(f => f.maturidade === 'INCUBACAO');
  const maduras = emOperacao.filter(f => f.maturidade === 'MADURA');
  const incubacao1 = emIncubacao.filter(f => f.faseIncubacao === 1);
  const incubacao2 = emIncubacao.filter(f => f.faseIncubacao === 2);
  const incubacao3 = emIncubacao.filter(f => f.faseIncubacao === 3);

  return {
    id: 'root',
    nome: 'Total de Franquias',
    valor: total,
    porcentagem: 100,
    cor: '#FF6600',
    children: [
      {
        id: 'ativas',
        nome: 'Franquias Ativas',
        valor: resumo.ativas,
        porcentagem: (resumo.ativas / total) * 100,
        cor: '#28a745',
        franquias: ativas,
        children: [
          {
            id: 'implantacao',
            nome: 'Em Implantação',
            valor: resumo.emImplantacao,
            porcentagem: (resumo.emImplantacao / resumo.ativas) * 100,
            cor: '#17a2b8',
            franquias: emImplantacao,
          },
          {
            id: 'operacao',
            nome: 'Em Operação',
            valor: resumo.emOperacao,
            porcentagem: (resumo.emOperacao / resumo.ativas) * 100,
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
                    nome: 'Incubação 1',
                    valor: resumo.incubacao1,
                    porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao1 / resumo.emIncubacao) * 100 : 0,
                    cor: '#f8d568',
                    franquias: incubacao1,
                  },
                  {
                    id: 'incubacao2',
                    nome: 'Incubação 2',
                    valor: resumo.incubacao2,
                    porcentagem: resumo.emIncubacao > 0 ? (resumo.incubacao2 / resumo.emIncubacao) * 100 : 0,
                    cor: '#f0c040',
                    franquias: incubacao2,
                  },
                  {
                    id: 'incubacao3',
                    nome: 'Incubação 3',
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
        ],
      },
      {
        id: 'inativas',
        nome: 'Franquias Inativas',
        valor: resumo.inativas,
        porcentagem: (resumo.inativas / total) * 100,
        cor: '#dc3545',
        franquias: inativas,
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
};
