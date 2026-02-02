/**
 * Receitas Recebidas por Fundo - Histórico Mensal
 * Bloco 2 - Exibe o histórico de receitas recebidas mês a mês por fundo desde 2025
 * Com detalhamento expansível: Antecipação FEE, Última Parcela FEE, Demais Receitas
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight, Calendar, TrendingUp, Building2 } from 'lucide-react';

// Interface para receita mensal com detalhamento
export interface ReceitaMensal {
  mes: string;          // ex: "01/2025", "02/2025"
  mesNome: string;      // ex: "Janeiro", "Fevereiro"
  ano: number;
  valorTotal: number;
  antecipacaoFee: number;       // Antecipação FEE
  ultimaParcelaFee: number;     // Última Parcela FEE
  demaisReceitas: number;       // Demais Receitas
}

export interface FundoReceita {
  id: string;
  nome: string;                 // Nome do fundo/turma
  unidade: string;              // Unidade escolar
  ativo: boolean;               // Se o fundo ainda está ativo
  totalRecebido: number;        // Total recebido desde 2025
  receitasMensais: ReceitaMensal[];
}

interface ReceitasRecebidasFundoProps {
  fundos: FundoReceita[];
  loading?: boolean;
  anoFiltro?: number;           // Filtrar por ano específico (opcional)
}

const formatarMoeda = (valor: number): string => {
  if (valor === 0) return '-';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function ReceitasRecebidasFundo({ fundos, loading = false, anoFiltro }: ReceitasRecebidasFundoProps) {
  const [expandido, setExpandido] = useState(true);
  const [fundoExpandido, setFundoExpandido] = useState<string | null>(null);
  const [mesExpandido, setMesExpandido] = useState<string | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoFiltro || new Date().getFullYear());

  // Anos disponíveis (2025 em diante)
  const anosDisponiveis = [2025, 2026];

  // Filtra receitas por ano selecionado
  const fundosFiltrados = fundos.map(fundo => ({
    ...fundo,
    receitasMensais: fundo.receitasMensais.filter(r => r.ano === anoSelecionado)
  }));

  // Calcula totais
  const totalGeralAno = fundosFiltrados.reduce(
    (acc, f) => acc + f.receitasMensais.reduce((sum, r) => sum + r.valorTotal, 0), 
    0
  );

  const toggleFundo = (fundoId: string) => {
    setFundoExpandido(fundoExpandido === fundoId ? null : fundoId);
    setMesExpandido(null);
  };

  const toggleMes = (mesKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
                Receitas Recebidas Totais por Fundo
              </h3>
              <p className="text-xs text-gray-400">
                Histórico mês a mês • Desde 2025
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
              <p className="text-lg font-bold text-blue-400">{formatarMoeda(totalGeralAno)}</p>
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
          ) : fundosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Building2 className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhum fundo encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Lista de Fundos */}
              {fundosFiltrados.map((fundo) => {
                const totalFundoAno = fundo.receitasMensais.reduce((sum, r) => sum + r.valorTotal, 0);
                
                return (
                  <div 
                    key={fundo.id}
                    className="bg-gray-900/30 rounded-lg border border-gray-700/30 overflow-hidden"
                  >
                    {/* Linha principal do fundo */}
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
                      onClick={() => toggleFundo(fundo.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{fundo.nome}</span>
                            {!fundo.ativo && (
                              <span className="px-2 py-0.5 bg-gray-600/30 text-gray-400 text-[10px] rounded-full border border-gray-600/30">
                                Inativo
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{fundo.unidade}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total Recebido {anoSelecionado}</p>
                          <p className="text-sm font-bold text-blue-400">{formatarMoeda(totalFundoAno)}</p>
                        </div>
                        {fundoExpandido === fundo.id ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Histórico Mensal Expandido */}
                    {fundoExpandido === fundo.id && (
                      <div className="px-4 pb-4 border-t border-gray-700/30">
                        <div className="mt-3 space-y-2">
                          {fundo.receitasMensais.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                              Sem receitas registradas em {anoSelecionado}
                            </p>
                          ) : (
                            fundo.receitasMensais.map((receita, idx) => {
                              const mesKey = `${fundo.id}-${receita.mes}`;
                              const isExpanded = mesExpandido === mesKey;
                              
                              return (
                                <div key={mesKey} className="bg-gray-800/30 rounded-lg overflow-hidden">
                                  {/* Linha do mês */}
                                  <div 
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-700/30 transition-colors"
                                    onClick={(e) => toggleMes(mesKey, e)}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs text-gray-500 w-20">{receita.mesNome}</span>
                                      <span className="text-sm font-semibold text-white">
                                        {formatarMoeda(receita.valorTotal)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Ver detalhes</span>
                                      {isExpanded ? (
                                        <ChevronDown size={14} className="text-orange-400" />
                                      ) : (
                                        <ChevronRight size={14} className="text-orange-400" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Detalhamento do mês */}
                                  {isExpanded && (
                                    <div className="px-4 pb-3 border-t border-gray-700/30">
                                      <div className="mt-3 space-y-2">
                                        <div className="flex justify-between items-center py-1.5 border-b border-gray-700/20">
                                          <span className="text-xs text-gray-500">ANTECIPAÇÃO FEE</span>
                                          <span className="text-sm font-medium text-emerald-400">
                                            {formatarMoeda(receita.antecipacaoFee)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5 border-b border-gray-700/20">
                                          <span className="text-xs text-gray-500">ÚLTIMA PARCELA FEE</span>
                                          <span className="text-sm font-medium text-blue-400">
                                            {formatarMoeda(receita.ultimaParcelaFee)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center py-1.5">
                                          <span className="text-xs text-gray-500">DEMAIS RECEITAS</span>
                                          <span className="text-sm font-medium text-purple-400">
                                            {formatarMoeda(receita.demaisReceitas)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
