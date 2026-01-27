/**
 * Cards de Visão Geral
 * Exibe os KPIs principais de projeção de receita
 */

import React from 'react';
import KPICard from './KPICard';
import { ResumoProjecao } from '../types';

interface CardsVisaoGeralProps {
  resumo: ResumoProjecao;
  corTema?: 'laranja' | 'verde';
}

export default function CardsVisaoGeral({ resumo, corTema = 'laranja' }: CardsVisaoGeralProps) {
  // Define cores baseado no tema
  const coresCards = corTema === 'verde' 
    ? {
        total: 'verde' as const,
        feeAntecipacao: 'cyan' as const,
        feeFechamento: 'cyan' as const,
        conviteExtra: 'azul' as const,
        margem: 'roxo' as const,
      }
    : {
        total: 'laranja' as const,
        feeAntecipacao: 'verde' as const,
        feeFechamento: 'verde' as const,
        conviteExtra: 'azul' as const,
        margem: 'roxo' as const,
      };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        titulo="Receita Total Projetada"
        valor={resumo.receitaTotalProjetada}
        formato="moeda"
        icone="trending"
        cor={coresCards.total}
        descricao="Soma de todas as fontes de receita futuras"
      />
      
      <KPICard
        titulo="Projeção FEE Antecipação"
        valor={resumo.receitaProjetadaFeeAntecipacao}
        formato="moeda"
        icone="dollar"
        cor={coresCards.feeAntecipacao}
        descricao="60% do FEE (6 parcelas de 10%)"
      />
      
      <KPICard
        titulo="Projeção FEE Fechamento"
        valor={resumo.receitaProjetadaFeeFechamento}
        formato="moeda"
        icone="calendar"
        cor={coresCards.feeFechamento}
        descricao="40% do FEE no fechamento do fundo"
      />
      
      <KPICard
        titulo="Projeção Margem Fechamento"
        valor={resumo.receitaProjetadaMargemFechamento}
        formato="moeda"
        icone="pie"
        cor={coresCards.margem}
        descricao="Valor esperado no fechamento"
      />
    </div>
  );
}
