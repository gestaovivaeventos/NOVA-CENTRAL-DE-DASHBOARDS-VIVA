/**
 * Fluxo Anual Card
 * Exibe o fluxo financeiro de um ano específico
 */

import React, { useState } from 'react';
import { Pencil, Check, X, ChevronRight, ChevronDown } from 'lucide-react';

export interface DadosFluxoAnual {
  ano: number;
  receitaCarteira: number;
  receitaNovosVendas: number;
  subtotal: number;
  custo: number;
  saldo: number;
  isAtual: boolean;
  // Dados para detalhamento Carteira (D + E + F)
  somaAntecipacaoCarteira?: number;    // D - Antecipação Carteira
  somaExecucaoCarteira?: number;       // E - Fechamento/Ultima Parc Carteira
  somaDemaisReceitasCarteira?: number; // F - Demais Receitas Carteira
  // Dados para detalhamento Novas Vendas (G + H + I)
  somaAntecipacaoNovasVendas?: number;    // G - Antecipação Novas Vendas
  somaExecucaoNovasVendas?: number;       // H - Fechamento Novas Vendas
  somaDemaisReceitasNovasVendas?: number; // I - Demais Receitas Novas Vendas
  // VVR do Ano
  somaVVR?: number; // VVR do ano (da aba NOVOS FUNDOS)
  // Dados Calculadora Franqueado (J + K + L da aba FLUXO PROJETADO)
  somaAntecipacaoCalcFranqueado?: number;    // J - Antecipação Novas Vendas CALCULADORA FRANQUEADO
  somaFechamentoCalcFranqueado?: number;     // K - Ultima parcela FEE Novas Vendas CALCULADORA FRANQUEADO
  somaDemaisReceitasCalcFranqueado?: number; // L - Demais Receitas Novas Vendas CALCULADORA FRANQUEADO
  receitaCalcFranqueado?: number;            // J + K + L
}

// Interface para parâmetros da franquia (usado no detalhamento)
export interface ParametrosFranquiaCard {
  feePercentual: number; // Coluna K - Fee percentual
  percentualAntecipacao: number; // Coluna C - Percentual de antecipação
  percentualFechamento: number; // Coluna D - Percentual de fechamento (parcela final)
  numParcelasAntecipacao: number; // Coluna E - Número de parcelas
  quebraOrcamentoFinal: number; // Coluna F - Quebra Orçamento Final / MAF Inicial
  diasBaile: number; // Coluna G - Dias antes do evento para pagar parcela final
  demaisReceitas: number; // Coluna H - Demais receitas (outras receitas)
  margem: number; // Coluna I - Margem
  mesesPermanenciaCarteira?: number; // Coluna J - Tempo Médio que fundos ficam na carteira
}

interface FluxoAnualCardProps {
  dados: DadosFluxoAnual;
  isSelected?: boolean;
  onClick?: () => void;
  onDespesaChange?: (ano: number, novoValor: number) => void;
  parametros?: ParametrosFranquiaCard;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

// Componente para campo de despesa editável
interface DespesaEditavelProps {
  valor: number;
  onSave: (novoValor: number) => void;
}

function DespesaEditavel({ valor, onSave }: DespesaEditavelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [valorTemp, setValorTemp] = useState(valor === 0 ? '' : Math.abs(valor).toString());

  const handleSave = () => {
    const novoValor = parseFloat(valorTemp.replace(',', '.')) || 0;
    onSave(-Math.abs(novoValor)); // Sempre negativo
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValorTemp(valor === 0 ? '' : Math.abs(valor).toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center">
          <span className="text-red-400 text-sm mr-1">R$</span>
          <input
            type="text"
            value={valorTemp}
            onChange={(e) => setValorTemp(e.target.value)}
            className="w-16 px-2 py-0.5 text-sm bg-gray-800/80 rounded text-red-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
        </div>
        <button
          onClick={handleSave}
          className="p-1 hover:bg-green-500/20 rounded-full transition-colors"
        >
          <Check size={14} className="text-green-400" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
        >
          <X size={14} className="text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      <span className="text-sm font-semibold text-red-400 tabular-nums">
        {formatarMoeda(valor)}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="p-1 hover:bg-gray-700 rounded transition-all ml-2"
        title="Editar despesa"
      >
        <Pencil size={14} className="text-orange-400 hover:text-orange-300" />
      </button>
    </div>
  );
}

export default function FluxoAnualCard({ dados, isSelected = false, onClick, onDespesaChange, parametros }: FluxoAnualCardProps) {
  const [expandidoCarteira, setExpandidoCarteira] = useState(false);
  const [expandidoVendas, setExpandidoVendas] = useState(false);
  const saldoPositivo = dados.saldo >= 0;

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
      {/* Badge Selecionado */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full shadow-lg uppercase tracking-wide animate-pulse">
            Selecionado
          </div>
        </div>
      )}

      {/* Header com Ano */}
      <div className={`relative px-3 py-2 ${
        isSelected 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
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
        {/* Proj. Receita Carteira com expansão */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Proj. Receita Carteira</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatarMoeda(dados.receitaCarteira)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandidoCarteira(!expandidoCarteira);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-all"
              title={expandidoCarteira ? 'Recolher' : 'Expandir detalhes'}
            >
              {expandidoCarteira ? (
                <ChevronDown size={16} className="text-orange-400" />
              ) : (
                <ChevronRight size={16} className="text-orange-400" />
              )}
            </button>
          </div>
          
          {/* Área expandida Carteira */}
          {expandidoCarteira && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 space-y-2">
              <p className="text-[10px] text-orange-400 uppercase tracking-wide font-semibold border-b border-gray-700/50 pb-1">
                Detalhes Proj. Receita Carteira
              </p>
              
              <div className="text-xs text-gray-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">ANTECIPAÇÃO DE FEE</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaAntecipacaoCarteira || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ULTIMA PARC FEE</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaExecucaoCarteira || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">DEMAIS RECEITAS</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaDemaisReceitasCarteira || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proj. Receita Novas Vendas com expansão */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Proj. Receita Novas Vendas</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatarMoeda(dados.receitaNovosVendas)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandidoVendas(!expandidoVendas);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-all"
              title={expandidoVendas ? 'Recolher' : 'Expandir detalhes'}
            >
              {expandidoVendas ? (
                <ChevronDown size={16} className="text-orange-400" />
              ) : (
                <ChevronRight size={16} className="text-orange-400" />
              )}
            </button>
          </div>
          
          {/* Área expandida Novas Vendas */}
          {expandidoVendas && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 space-y-2">
              <p className="text-[10px] text-orange-400 uppercase tracking-wide font-semibold border-b border-gray-700/50 pb-1">
                Detalhes Proj. Receita Novas Vendas
              </p>
              
              <div className="text-xs text-gray-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">ANTECIPAÇÃO DE FEE</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaAntecipacaoNovasVendas || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ULTIMA PARC FEE</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaExecucaoNovasVendas || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">DEMAIS RECEITAS</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaDemaisReceitasNovasVendas || 0)}
                  </span>
                </div>

                {/* Divisor */}
                <div className="border-t border-gray-700/50 my-1" />
                
                <div className="flex justify-between">
                  <span className="text-gray-500">VVR VENDAS (ANO)</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(dados.somaVVR || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">PROJEÇÃO DE FEE</span>
                  <span className="text-orange-400 font-medium">
                    {parametros ? `${parametros.feePercentual}%` : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Subtotal */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Subtotal</span>
            <span className="text-sm font-semibold text-white tabular-nums">
              {formatarMoeda(dados.subtotal)}
            </span>
          </div>
        </div>

        {/* Despesas */}
        <div className="py-2 border-b border-gray-700/30">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Despesas</span>
          {onDespesaChange ? (
            <DespesaEditavel 
              valor={dados.custo} 
              onSave={(novoValor) => onDespesaChange(dados.ano, novoValor)} 
            />
          ) : (
            <div className="text-sm font-semibold text-red-400 tabular-nums">
              {formatarMoeda(dados.custo)}
            </div>
          )}
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
      </div>
    </div>
  );
}
