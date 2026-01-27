/**
 * Cards de Acompanhamento Financeiro
 * Exibe KPIs de acompanhamento de receitas
 */

import React from 'react';
import KPICard from './KPICard';
import { ResumoProjecao } from '../types';

interface CardsAcompanhamentoProps {
  resumo: ResumoProjecao;
}

export default function CardsAcompanhamento({ resumo }: CardsAcompanhamentoProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-cyan-500 rounded-full"></span>
        Acompanhamento Financeiro
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          titulo="FEE Já Recebido"
          valor={resumo.feeJaRecebido}
          formato="moeda"
          icone="check"
          cor="verde"
          descricao="Valor acumulado já faturado"
        />
        
        <KPICard
          titulo="FEE a Receber"
          valor={resumo.feeAReceber}
          formato="moeda"
          icone="clock"
          cor="laranja"
          descricao="Valor futuro conforme cronograma"
        />
        
        <KPICard
          titulo="Convites Extras Vendidos"
          valor={resumo.convitesExtrasVendidos}
          formato="moeda"
          icone="gift"
          cor="azul"
          descricao="Valor bruto de vendas realizadas"
        />
        
        <KPICard
          titulo="Margem Média Aplicada"
          valor={resumo.margemMediaAplicada}
          formato="percentual"
          icone="percent"
          cor="roxo"
          descricao="Média ponderada das margens"
        />
      </div>
    </div>
  );
}
