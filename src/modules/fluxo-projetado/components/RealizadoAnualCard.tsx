/**
 * Realizado Anual Card
 * Bloco 3 - Cards de compilado por ano (similar ao FluxoAnualCard mas para dados realizados)
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, CheckCircle } from 'lucide-react';

export interface DadosRealizadoAnual {
  ano: number;
  receitaTotal: number;             // Total de receitas do ano
  antecipacaoFee: number;           // Antecipação FEE
  ultimaParcelaFee: number;         // Última Parcela FEE
  demaisReceitas: number;           // Demais Receitas
  despesas: number;                 // Despesas do ano
  saldo: number;                    // Saldo final
  mesesComDados: number;            // Quantos meses têm dados
  isAnoCompleto: boolean;           // Se o ano está completo (12 meses)
}

interface RealizadoAnualCardProps {
  dados: DadosRealizadoAnual;
  isSelected?: boolean;
  onClick?: () => void;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

export default function RealizadoAnualCard({ dados, isSelected = false, onClick }: RealizadoAnualCardProps) {
  const [expandido, setExpandido] = useState(false);
  const saldoPositivo = dados.saldo >= 0;
  const anoAtual = new Date().getFullYear();
  const isAnoAtual = dados.ano === anoAtual;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300 hover:scale-[1.02]
        ${isSelected 
          ? 'ring-2 ring-orange-500' 
          : 'ring-1 ring-gray-700/50'
        }
      `}
      style={{
        background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)',
      }}
    >
      {/* Badge Ano Atual/Parcial */}
      {isAnoAtual && !dados.isAnoCompleto && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-full shadow-lg uppercase tracking-wide">
            Parcial ({dados.mesesComDados}/12 meses)
          </div>
        </div>
      )}
      
      {/* Badge Ano Completo */}
      {dados.isAnoCompleto && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full shadow-lg uppercase tracking-wide flex items-center gap-1">
            <CheckCircle size={10} />
            Completo
          </div>
        </div>
      )}

      {/* Header com Ano */}
      <div className={`relative px-3 py-2 ${
        isSelected 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
          : isAnoAtual
            ? 'bg-gradient-to-r from-blue-600 to-blue-700'
            : 'bg-gradient-to-r from-gray-700 to-gray-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white tracking-wide">
            {dados.ano}
          </span>
        </div>
        {/* Linha decorativa */}
        <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${
          isSelected 
            ? 'bg-gradient-to-r from-transparent via-white/40 to-transparent' 
            : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
        }`} />
      </div>

      {/* Conteúdo do card */}
      <div className="p-3 space-y-0">
        {/* Receita Total com expansão */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Receita Total Realizada</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatarMoeda(dados.receitaTotal)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandido(!expandido);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-all"
              title={expandido ? 'Recolher' : 'Expandir detalhes'}
            >
              {expandido ? (
                <ChevronDown size={16} className="text-orange-400" />
              ) : (
                <ChevronRight size={16} className="text-orange-400" />
              )}
            </button>
          </div>
          
          {/* Área expandida */}
          {expandido && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 space-y-2">
              <p className="text-[10px] text-orange-400 uppercase tracking-wide font-semibold border-b border-gray-700/50 pb-1">
                Detalhamento Receitas Realizadas
              </p>
              
              <div className="text-xs text-gray-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">ANTECIPAÇÃO FEE</span>
                  <span className="text-emerald-400 font-medium">
                    {formatarMoeda(dados.antecipacaoFee)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ÚLTIMA PARCELA FEE</span>
                  <span className="text-blue-400 font-medium">
                    {formatarMoeda(dados.ultimaParcelaFee)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">DEMAIS RECEITAS</span>
                  <span className="text-purple-400 font-medium">
                    {formatarMoeda(dados.demaisReceitas)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Despesas</span>
            <span className="text-sm font-semibold text-red-400 tabular-nums">
              {formatarMoeda(-Math.abs(dados.despesas))}
            </span>
          </div>
        </div>

        {/* Saldo do Ano */}
        <div className={`flex items-center justify-between p-2 mt-2 rounded-lg ${
          saldoPositivo 
            ? 'bg-emerald-500/10 border border-emerald-500/30' 
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          <span className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Saldo do Ano</span>
          <span className={`text-sm font-bold tabular-nums ${saldoPositivo ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatarMoeda(dados.saldo)}
          </span>
        </div>

        {/* Indicador de meses */}
        <div className="mt-3 pt-2 border-t border-gray-700/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">Meses com dados</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 12 }, (_, i) => (
                <div 
                  key={i}
                  className={`w-3 h-1.5 rounded-sm ${
                    i < dados.mesesComDados 
                      ? 'bg-emerald-500' 
                      : 'bg-gray-700'
                  }`}
                  title={`${i + 1}º mês`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
