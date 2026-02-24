/**
 * Receitas Realizadas por Fundo
 * Exibe o total de FEE e Margem realizado por fundo
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, DollarSign, 
  Building2, Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, X, Info
} from 'lucide-react';

export interface FundoReceita {
  id: string;
  nome: string;               // Nome do fundo/turma
  unidade: string;            // Unidade escolar
  valorFee: number;           // VALOR FEE do contrato (mesmo do bloco Recebimento FEE)
  feeRecebido: number;        // FEE RECEBIDO (antecipação + outros fees)
  margemTotal: number;        // MARGEM TOTAL do contrato
  margemRecebida: number;     // MARGEM JÁ RECEBIDA
  saldoFundo: number;         // SALDO disponível no fundo
}

// Função para calcular o valor total que falta receber (FEE + Margem)
const calcularFaltaReceber = (fundo: FundoReceita): number => {
  const feeFaltante = fundo.valorFee - fundo.feeRecebido;
  const margemFaltante = fundo.margemTotal - fundo.margemRecebida;
  return Math.max(0, feeFaltante) + Math.max(0, margemFaltante);
};

interface ReceitasRealizadasFundoProps {
  fundos: FundoReceita[];
  loading?: boolean;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const formatarPercentual = (valor: number): string => {
  return `${valor.toFixed(0)}%`;
};

const ITENS_POR_PAGINA = 10;

type OrdenacaoCampo = 'nome' | 'valorFee' | 'feeRecebido' | 'percentualFee' | 'margemTotal' | 'margemRecebida' | 'saldoFundo';
type OrdenacaoDirecao = 'asc' | 'desc';

// Função para calcular % FEE Recebido
const calcularPercentualFeeRecebido = (fundo: FundoReceita): number => {
  if (fundo.valorFee === 0) return 0;
  return (fundo.feeRecebido / fundo.valorFee) * 100;
};

export default function ReceitasRealizadasFundo({ fundos, loading = false }: ReceitasRealizadasFundoProps) {
  const [expandido, setExpandido] = useState(true);
  
  // Estados para busca, filtro e paginação
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; direcao: OrdenacaoDirecao }>({ 
    campo: 'valorFee', 
    direcao: 'desc' 
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Filtra e ordena os fundos
  const fundosFiltrados = useMemo(() => {
    let resultado = [...fundos];
    
    // Aplica busca
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim();
      resultado = resultado.filter(f => 
        f.nome.toLowerCase().includes(termoBusca) || 
        f.unidade.toLowerCase().includes(termoBusca)
      );
    }
    
    // Aplica ordenação
    resultado.sort((a, b) => {
      let comparacao = 0;
      
      switch (ordenacao.campo) {
        case 'nome':
          comparacao = a.nome.localeCompare(b.nome);
          break;
        case 'valorFee':
          comparacao = a.valorFee - b.valorFee;
          break;
        case 'feeRecebido':
          comparacao = a.feeRecebido - b.feeRecebido;
          break;
        case 'percentualFee':
          comparacao = calcularPercentualFeeRecebido(a) - calcularPercentualFeeRecebido(b);
          break;
        case 'margemTotal':
          comparacao = a.margemTotal - b.margemTotal;
          break;
        case 'margemRecebida':
          comparacao = a.margemRecebida - b.margemRecebida;
          break;
        case 'saldoFundo':
          comparacao = a.saldoFundo - b.saldoFundo;
          break;
      }
      
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
    
    return resultado;
  }, [fundos, busca, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(fundosFiltrados.length / ITENS_POR_PAGINA);
  const fundosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return fundosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [fundosFiltrados, paginaAtual]);

  // Reset página quando filtros mudam
  useMemo(() => {
    setPaginaAtual(1);
  }, [busca]);

  // Calcula totais
  const totalValorFee = fundos.reduce((acc, f) => acc + f.valorFee, 0);
  const totalFeeRecebido = fundos.reduce((acc, f) => acc + f.feeRecebido, 0);
  const totalMargemContrato = fundos.reduce((acc, f) => acc + f.margemTotal, 0);
  const totalMargemRecebida = fundos.reduce((acc, f) => acc + f.margemRecebida, 0);
  const totalSaldoFundo = fundos.reduce((acc, f) => acc + f.saldoFundo, 0);
  const totalFundos = fundos.length;
  const percentualFeeGeral = totalValorFee > 0 ? (totalFeeRecebido / totalValorFee) * 100 : 0;
  const percentualMargemGeral = totalMargemContrato > 0 ? (totalMargemRecebida / totalMargemContrato) * 100 : 0;

  const alternarOrdenacao = (campo: OrdenacaoCampo) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700/50" style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
      {/* Header */}
      <div 
        className="px-4 py-3 bg-gradient-to-r from-purple-900/30 to-gray-900 border-b border-gray-700/50 cursor-pointer hover:from-purple-900/40 transition-all"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Receitas Realizadas por Fundo
              </h3>
              <p className="text-xs text-gray-400">
                {totalFundos} fundos • {formatarPercentual(percentualFeeGeral)} FEE recebido
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Total FEE Recebido</p>
              <p className="text-lg font-bold text-purple-400">{formatarMoeda(totalFeeRecebido)}</p>
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
          {/* Aviso de dados mockados */}
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              <span className="font-semibold">Dados de exemplo:</span> Esta tabela está exibindo dados mockados para demonstração. A integração com a planilha real está pendente.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-gray-400">Carregando fundos...</span>
            </div>
          ) : fundos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Building2 className="w-12 h-12 mb-3 opacity-50" />
              <p>Nenhum fundo encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumo rápido em cards */}
              <div className="grid grid-cols-8 gap-2">
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Fundos</p>
                  <p className="text-xl font-bold text-white">{totalFundos}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Valor FEE</p>
                  <p className="text-sm font-bold text-white">{formatarMoeda(totalValorFee)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">FEE Recebido</p>
                  <p className="text-sm font-bold text-emerald-400">{formatarMoeda(totalFeeRecebido)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">% FEE Receb.</p>
                  <p className="text-sm font-bold text-blue-400">{formatarPercentual(percentualFeeGeral)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center relative group">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Margem Total</p>
                    <div className="relative">
                      <Info size={10} className="text-gray-500 cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-[10px] text-gray-300 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-gray-600">
                        FEE + Demais Receitas
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-purple-400">{formatarMoeda(totalMargemContrato)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Margem Receb.</p>
                  <p className="text-sm font-bold text-orange-400">{formatarMoeda(totalMargemRecebida)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">% Margem Receb.</p>
                  <p className="text-sm font-bold text-yellow-400">{formatarPercentual(percentualMargemGeral)}</p>
                </div>
                <div className="p-2 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Saldo Fundo</p>
                  <p className="text-sm font-bold text-cyan-400">{formatarMoeda(totalSaldoFundo)}</p>
                </div>
              </div>

              {/* Barra de Busca e Filtros */}
              <div className="flex items-center gap-3">
                {/* Campo de busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou código do fundo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                  {busca && (
                    <button 
                      onClick={() => setBusca('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Botão de filtros */}
                <button
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    mostrarFiltros
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <Filter size={16} />
                  Filtros
                </button>
              </div>

              {/* Painel de Filtros Expandido */}
              {mostrarFiltros && (
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Ordenar por:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { campo: 'valorFee' as OrdenacaoCampo, label: 'Valor FEE' },
                      { campo: 'feeRecebido' as OrdenacaoCampo, label: 'FEE Receb.' },
                      { campo: 'margemTotal' as OrdenacaoCampo, label: 'Margem Total' },
                      { campo: 'margemRecebida' as OrdenacaoCampo, label: 'Margem Receb.' },
                      { campo: 'saldoFundo' as OrdenacaoCampo, label: 'Saldo Fundo' },
                      { campo: 'nome' as OrdenacaoCampo, label: 'Nome' },
                    ].map(({ campo, label }) => (
                      <button
                        key={campo}
                        onClick={() => alternarOrdenacao(campo)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          ordenacao.campo === campo
                            ? 'bg-gray-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {label}
                        {ordenacao.campo === campo && (
                          <ArrowUpDown size={12} className={ordenacao.direcao === 'asc' ? 'rotate-180' : ''} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info de resultados */}
              {busca && (
                <div className="text-xs text-gray-500">
                  Mostrando {fundosFiltrados.length} de {totalFundos} fundos
                  {busca && <span> para "{busca}"</span>}
                </div>
              )}

              {/* Lista de Fundos */}
              {fundosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p>Nenhum fundo encontrado com os filtros aplicados</p>
                  <button 
                    onClick={() => setBusca('')}
                    className="mt-2 text-sm text-purple-400 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {fundosPaginados.map((fundo) => {
                    return (
                      <div 
                        key={fundo.id}
                        className="bg-gray-900/30 rounded-lg border border-gray-700/30 overflow-hidden hover:border-gray-600/50 transition-colors px-3 py-2.5"
                      >
                        {/* Layout em linha única com flex */}
                        <div className="flex items-center gap-3">
                          {/* Nome e unidade */}
                          <div className="flex items-center gap-2 min-w-0 w-[200px] flex-shrink-0">
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-white truncate block">{fundo.nome}</span>
                              <span className="text-xs text-gray-500 truncate block">{fundo.unidade}</span>
                            </div>
                          </div>
                          
                          {/* Colunas de valores */}
                          <div className="flex-1 grid grid-cols-6 gap-2">
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Valor FEE</p>
                              <p className="text-sm font-medium text-white">{formatarMoeda(fundo.valorFee)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">FEE Recebido</p>
                              <p className="text-sm font-medium text-emerald-400">{formatarMoeda(fundo.feeRecebido)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Margem Total</p>
                              <p className="text-sm font-medium text-purple-400">{formatarMoeda(fundo.margemTotal)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Margem Receb.</p>
                              <p className="text-sm font-medium text-orange-400">{formatarMoeda(fundo.margemRecebida)}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Falta Receber</p>
                              <p className="text-sm font-medium text-gray-300">{formatarMoeda(calcularFaltaReceber(fundo))}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Saldo Fundo</p>
                              <p className="text-sm font-medium text-cyan-400">{formatarMoeda(fundo.saldoFundo)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">
                    Página {paginaAtual} de {totalPaginas} • {fundosFiltrados.length} fundos
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                      disabled={paginaAtual === 1}
                      className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {/* Números de página */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pagina: number;
                        if (totalPaginas <= 5) {
                          pagina = i + 1;
                        } else if (paginaAtual <= 3) {
                          pagina = i + 1;
                        } else if (paginaAtual >= totalPaginas - 2) {
                          pagina = totalPaginas - 4 + i;
                        } else {
                          pagina = paginaAtual - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pagina}
                            onClick={() => setPaginaAtual(pagina)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                              paginaAtual === pagina
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {pagina}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
