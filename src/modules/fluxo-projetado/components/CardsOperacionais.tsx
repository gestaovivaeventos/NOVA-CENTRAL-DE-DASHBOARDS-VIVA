/**
 * Cards Operacionais
 * Exibe KPIs de quantidade de fundos
 */

import React from 'react';
import KPICard from './KPICard';
import { ResumoProjecao } from '../types';

interface CardsOperacionaisProps {
  resumo: ResumoProjecao;
  anoFiltro: number;
}

export default function CardsOperacionais({ resumo, anoFiltro }: CardsOperacionaisProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
        Indicadores Operacionais
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          titulo="Fundos Ativos"
          valor={resumo.fundosAtivos}
          formato="numero"
          icone="users"
          cor="cyan"
          descricao="Quantidade total de fundos em andamento"
          tamanho="lg"
        />
        
        <KPICard
          titulo={`Formaturas em ${anoFiltro}`}
          valor={resumo.fundosFechamentoAnoAtual}
          formato="numero"
          icone="calendar"
          cor="verde"
          descricao="Fundos com fechamento no ano selecionado"
          tamanho="lg"
        />
      </div>
    </div>
  );
}
