/**
 * Tabela de Fundos
 * Lista detalhada dos fundos com informações de projeção
 */

import React from 'react';
import { Fundo } from '../types';
import { formatarMoeda, formatarData, calcularFeeTotal, calcularFeeRecebido } from '../utils';
import { Eye, TrendingUp, Calendar } from 'lucide-react';

interface TabelaFundosProps {
  fundos: Fundo[];
  onVerDetalhes?: (fundo: Fundo) => void;
}

export default function TabelaFundos({ fundos, onVerDetalhes }: TabelaFundosProps) {
  const getStatusBadge = (status: Fundo['status']) => {
    const badges = {
      ativo: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      fechado: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cancelado: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    
    const labels = {
      ativo: 'Ativo',
      fechado: 'Fechado',
      cancelado: 'Cancelado',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getProgressBar = (parcelasRecebidas: number) => {
    const percent = (parcelasRecebidas / 6) * 60; // 60% do total em parcelas
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {parcelasRecebidas}/6
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
          Fundos em Acompanhamento
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="text-left text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Turma
              </th>
              <th className="text-left text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Unidade
              </th>
              <th className="text-right text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Prev. Arrecadação
              </th>
              <th className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                FEE %
              </th>
              <th className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Parcelas FEE
              </th>
              <th className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                Formatura
              </th>
              <th className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Status
              </th>
              <th className="text-center text-xs text-gray-400 font-medium uppercase tracking-wider px-4 py-3">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50">
            {fundos.map((fundo) => {
              const feeTotal = calcularFeeTotal(fundo.valorArrecadacaoPrevisao, fundo.percentualFee);
              const feeRecebido = calcularFeeRecebido(feeTotal, fundo.parcelasFeeRecebidas, fundo.feeRecebidoFechamento);
              
              return (
                <tr 
                  key={fundo.id} 
                  className="hover:bg-gray-700/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium text-sm">{fundo.nome}</p>
                      <p className="text-gray-500 text-xs">ID: {fundo.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">{fundo.unidade}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-white font-medium">
                      {formatarMoeda(fundo.valorArrecadacaoPrevisao)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-orange-400 font-semibold">
                      {fundo.percentualFee}%
                    </span>
                  </td>
                  <td className="px-4 py-3 w-36">
                    {getProgressBar(fundo.parcelasFeeRecebidas)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-300 text-sm">
                      {formatarData(fundo.dataFormatura)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(fundo.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onVerDetalhes?.(fundo)}
                      className="p-2 text-gray-400 hover:text-orange-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {fundos.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          Nenhum fundo encontrado com os filtros selecionados.
        </div>
      )}
    </div>
  );
}
