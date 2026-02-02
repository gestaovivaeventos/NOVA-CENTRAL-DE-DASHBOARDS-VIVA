/**
 * Receitas Mensais Agrupadas
 * Bloco 2 - Exibe o histórico de receitas recebidas mês a mês (agrupado da franquia, não por fundo)
 * Com detalhamento expansível: Antecipação FEE, Última Parcela FEE, Demais Receitas
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Calendar } from 'lucide-react';

// Interface para receita mensal com detalhamento
export interface ReceitaMensalAgrupada {
  mes: string;                  // ex: "01/2025", "02/2025"
  mesNome: string;              // ex: "Janeiro", "Fevereiro"
  ano: number;
  valorTotal: number;
  antecipacaoFee: number;       // Antecipação FEE
  ultimaParcelaFee: number;     // Última Parcela FEE
  demaisReceitas: number;       // Demais Receitas
}

interface ReceitasMensaisAgrupadasProps {
  receitas: ReceitaMensalAgrupada[];
  loading?: boolean;
}

const formatarMoeda = (valor: number): string => {
  if (valor === 0) return '-';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

export default function ReceitasMensaisAgrupadas({ receitas, loading = false }: ReceitasMensaisAgrupadasProps) {
  const [expandido, setExpandido] = useState(true);
  const [mesExpandido, setMesExpandido] = useState<string | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());

  // Anos disponíveis (2025 em diante)
  const anosDisponiveis = [2025, 2026];

  // Filtra receitas por ano selecionado
  const receitasFiltradas = receitas.filter(r => r.ano === anoSelecionado);

  // Calcula totais do ano
  const totalAno = receitasFiltradas.reduce((acc, r) => acc + r.valorTotal, 0);
  const totalAntecipacao = receitasFiltradas.reduce((acc, r) => acc + r.antecipacaoFee, 0);
  const totalUltimaParcela = receitasFiltradas.reduce((acc, r) => acc + r.ultimaParcelaFee, 0);
  const totalDemaisReceitas = receitasFiltradas.reduce((acc, r) => acc + r.demaisReceitas, 0);

  const toggleMes = (mesKey: string) => {
    setMesExpandido(mesExpandido === mesKey ? null : mesKey);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/50" style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
      {/* Header */}
      <div 
        className="px-4 py-3 bg-gradient-to-r from-blue-900/30 to-gray-900 border-b border-gray-700/50 cursor-pointer hover:from-blue-900/40 transition-all"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Receitas Recebidas Mensais
              </h3>
              <p className="text-xs text-gray-400">
                Histórico mês a mês da franquia • Desde 2025
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Seletor de Ano */}
            <div 
              className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1"
              onClick={(e) => e.stopPropagation()}
            >
              {anosDisponiveis.map(ano => (
                <button
                  key={ano}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnoSelecionado(ano);
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    anoSelecionado === ano 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {ano}
                </button>
              ))}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total {anoSelecionado}</p>
              <p className="text-lg font-bold text-blue-400">{formatarMoeda(totalAno)}</p>
            </div>
            {expandido ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {expandido && (
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Carregando histórico...</span>
            </div>
          ) : receitasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Calendar className="w-12 h-12 mb-3 opacity-50" />
              <p>Sem receitas registradas em {anoSelecionado}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cabeçalho da tabela com totais */}
              <div className="grid grid-cols-5 gap-3 p-3 bg-gray-900/50 rounded-lg">
                <div className="text-left">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Mês</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Recebido</p>
                  <p className="text-lg font-bold text-white">{formatarMoeda(totalAno)}</p>
                </div>
                <div className="text-center border-l border-gray-700/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Antecipação FEE</p>
                  <p className="text-lg font-bold text-emerald-400">{formatarMoeda(totalAntecipacao)}</p>
                </div>
                <div className="text-center border-l border-gray-700/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Última Parcela FEE</p>
                  <p className="text-lg font-bold text-blue-400">{formatarMoeda(totalUltimaParcela)}</p>
                </div>
                <div className="text-center border-l border-gray-700/50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Demais Receitas</p>
                  <p className="text-lg font-bold text-purple-400">{formatarMoeda(totalDemaisReceitas)}</p>
                </div>
              </div>

              {/* Lista de meses em formato tabela */}
              <div className="space-y-1">
                {receitasFiltradas.map((receita) => {
                  const mesKey = receita.mes;
                  
                  return (
                    <div key={mesKey} className="grid grid-cols-5 gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/30 transition-colors">
                      {/* Mês */}
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-white">{receita.mesNome}</span>
                      </div>
                      
                      {/* Total Recebido */}
                      <div className="flex items-center justify-center">
                        <span className="text-base font-bold text-white">
                          {formatarMoeda(receita.valorTotal)}
                        </span>
                      </div>
                      
                      {/* Antecipação FEE */}
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-emerald-400">
                          {formatarMoeda(receita.antecipacaoFee)}
                        </span>
                      </div>
                      
                      {/* Última Parcela FEE */}
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-400">
                          {formatarMoeda(receita.ultimaParcelaFee)}
                        </span>
                      </div>
                      
                      {/* Demais Receitas */}
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold text-purple-400">
                          {formatarMoeda(receita.demaisReceitas)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
