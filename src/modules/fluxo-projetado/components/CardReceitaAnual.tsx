/**
 * Card de Receita Total Anual
 * Exibe a receita projetada do ano atual e dos próximos 4 anos
 */

import React from 'react';

interface ReceitaAnual {
  ano: number;
  valor: number;
  isAtual: boolean;
}

interface CardReceitaAnualProps {
  receitasPorAno: ReceitaAnual[];
  anoSelecionado: number;
  onAnoClick: (ano: number) => void;
}

const formatarMoeda = (valor: number): string => {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(2).replace('.', ',')}M`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)}K`;
  }
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function CardReceitaAnual({ receitasPorAno, anoSelecionado, onAnoClick }: CardReceitaAnualProps) {
  const totalGeral = receitasPorAno.reduce((sum, item) => sum + item.valor, 0);
  const maiorValor = Math.max(...receitasPorAno.map(r => r.valor));

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Receita Total Projetada</h3>
            <p className="text-sm text-gray-400">Visão de 5 anos</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Acumulado</p>
          <p className="text-2xl font-bold text-orange-500">{formatarMoeda(totalGeral)}</p>
        </div>
      </div>

      {/* Cards por Ano */}
      <div className="grid grid-cols-5 gap-3">
        {receitasPorAno.map((item, index) => {
          const percentualBarra = (item.valor / maiorValor) * 100;
          const isAtual = item.isAtual;
          const isSelecionado = item.ano === anoSelecionado;
          
          return (
            <div
              key={item.ano}
              onClick={() => onAnoClick(item.ano)}
              className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 cursor-pointer ${
                isSelecionado 
                  ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500 ring-2 ring-orange-500/30' 
                  : isAtual
                    ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 hover:border-orange-500/50'
                    : 'bg-gray-700/30 border border-gray-600/30 hover:border-gray-500/50'
              }`}
            >
              {/* Badge Ano Atual */}
              {isAtual && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded-full uppercase">
                    Atual
                  </span>
                </div>
              )}

              {/* Badge Selecionado */}
              {isSelecionado && !isAtual && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full uppercase">
                    Visualizando
                  </span>
                </div>
              )}

              {/* Ano */}
              <div className="mb-3">
                <span className={`text-2xl font-bold ${isSelecionado ? 'text-orange-400' : isAtual ? 'text-orange-300' : 'text-gray-300'}`}>
                  {item.ano}
                </span>
              </div>

              {/* Valor */}
              <div className="mb-3">
                <p className={`text-xl font-bold ${isSelecionado ? 'text-white' : 'text-gray-200'}`}>
                  {formatarMoeda(item.valor)}
                </p>
              </div>

              {/* Barra de Progresso */}
              <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSelecionado 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-400' 
                      : 'bg-gradient-to-r from-gray-500 to-gray-400'
                  }`}
                  style={{ width: `${percentualBarra}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Linha do Tempo Visual */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between relative">
          {/* Linha conectora */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-600/50" />
          
          {receitasPorAno.map((item, index) => {
            const isSelecionado = item.ano === anoSelecionado;
            return (
              <div 
                key={item.ano} 
                className="relative flex flex-col items-center z-10 cursor-pointer"
                onClick={() => onAnoClick(item.ano)}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isSelecionado 
                      ? 'bg-orange-500 ring-4 ring-orange-500/30' 
                      : item.isAtual
                        ? 'bg-orange-400/50 ring-2 ring-orange-400/20'
                        : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                >
                  {isSelecionado && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  isSelecionado ? 'text-orange-400' : item.isAtual ? 'text-orange-300' : 'text-gray-500'
                }`}>
                  {item.ano}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
