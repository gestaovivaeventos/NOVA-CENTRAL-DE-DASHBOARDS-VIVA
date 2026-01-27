/**
 * Resumo Totais Card
 * Exibe o resumo consolidado de todos os anos
 */

import React from 'react';
import { TrendingUp, Wallet, ShoppingCart, Calculator, TrendingDown, DollarSign } from 'lucide-react';
import { DadosFluxoAnual } from './FluxoAnualCard';

interface ResumoTotaisCardProps {
  dados: DadosFluxoAnual[];
}

const formatarMoeda = (valor: number): string => {
  const absValor = Math.abs(valor);
  if (absValor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(2).replace('.', ',')}M`;
  }
  if (absValor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1).replace('.', ',')}K`;
  }
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
};

export default function ResumoTotaisCard({ dados }: ResumoTotaisCardProps) {
  // Calcular totais
  const totais = dados.reduce(
    (acc, item) => ({
      receitaCarteira: acc.receitaCarteira + item.receitaCarteira,
      receitaNovosVendas: acc.receitaNovosVendas + item.receitaNovosVendas,
      subtotal: acc.subtotal + item.subtotal,
      custo: acc.custo + item.custo,
      saldo: acc.saldo + item.saldo,
    }),
    { receitaCarteira: 0, receitaNovosVendas: 0, subtotal: 0, custo: 0, saldo: 0 }
  );

  const saldoPositivo = totais.saldo >= 0;

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Total Acumulado</h3>
          <p className="text-xs text-gray-400">{dados.length} anos projetados</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Receita Carteira */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Receita Carteira</span>
          </div>
          <p className="text-xl font-bold text-emerald-400">{formatarMoeda(totais.receitaCarteira)}</p>
        </div>

        {/* Receita Novos */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Receita Novos</span>
          </div>
          <p className="text-xl font-bold text-blue-400">{formatarMoeda(totais.receitaNovosVendas)}</p>
        </div>

        {/* Subtotal */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Subtotal</span>
          </div>
          <p className="text-xl font-bold text-purple-400">{formatarMoeda(totais.subtotal)}</p>
        </div>

        {/* Custo */}
        <div className="bg-gray-800/50 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-400">Custo Total</span>
          </div>
          <p className="text-xl font-bold text-red-400">{formatarMoeda(totais.custo)}</p>
        </div>

        {/* Saldo */}
        <div className={`rounded-xl p-4 border ${saldoPositivo ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`w-4 h-4 ${saldoPositivo ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className="text-xs text-gray-400">Saldo Total</span>
          </div>
          <p className={`text-xl font-bold ${saldoPositivo ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatarMoeda(totais.saldo)}
          </p>
        </div>
      </div>
    </div>
  );
}
