/**
 * Recebimento FEE por Fundo
 * Bloco 1 - Exibe o saldo disponível para requisição por fundo
 * Otimizado para lidar com 100+ fundos por franquia
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Wallet, AlertCircle, CheckCircle, 
  Building2, Search, Filter, ChevronLeft, ChevronRight,
  ArrowUpDown, X, Lock, Ban
} from 'lucide-react';

export interface FundoFee {
  id: string;
  nome: string;               // Nome do fundo/turma
  unidade: string;            // Unidade escolar
  // Dados principais
  feeTotal: number;           // FEE TOTAL CONTRATO
  feeRecebido: number;        // FEE JÁ RECEBIDO
  feeDisponivelAntecipacao: number; // FEE DISPONÍVEL P/ ANTECIPAÇÃO
  saldoFundo: number;         // SALDO DO FUNDO
  // Calculado: FEE BLOQUEADO = feeTotal - feeRecebido - feeDisponivelAntecipacao
}

// Status calculado dinamicamente
export type StatusFundo = 'saque-disponivel' | 'saldo-insuficiente' | 'finalizado';

interface RecebimentoFeeFundoProps {
  fundos: FundoFee[];
  loading?: boolean;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const formatarPercentual = (valor: number): string => {
  return `${valor.toFixed(0)}%`;
};

const ITENS_POR_PAGINA = 10;

type OrdenacaoCampo = 'nome' | 'feeTotal' | 'percentualRecebido' | 'saldoFundo' | 'status';
type OrdenacaoDirecao = 'asc' | 'desc';

// Função para calcular o status do fundo
const calcularStatus = (fundo: FundoFee): StatusFundo => {
  // FINALIZADO: quando todo o valor do FEE já tiver sido recebido
  if (fundo.feeRecebido >= fundo.feeTotal) {
    return 'finalizado';
  }
  
  // SALDO INSUFICIENTE: quando FEE disponível para antecipação for maior que o saldo do fundo
  if (fundo.feeDisponivelAntecipacao > 0 && fundo.feeDisponivelAntecipacao > fundo.saldoFundo) {
    return 'saldo-insuficiente';
  }
  
  // SAQUE DISPONÍVEL: quando FEE disponível > 0 e o fundo tiver esse saldo disponível
  if (fundo.feeDisponivelAntecipacao > 0 && fundo.saldoFundo >= fundo.feeDisponivelAntecipacao) {
    return 'saque-disponivel';
  }
  
  // Default: saldo insuficiente (não há fee disponível para antecipação)
  return 'saldo-insuficiente';
};

// Função para calcular o FEE Bloqueado (última parcela)
const calcularFeeBloqueado = (fundo: FundoFee): number => {
  return fundo.feeTotal - fundo.feeRecebido - fundo.feeDisponivelAntecipacao;
};

// Função para calcular % FEE Recebido
const calcularPercentualRecebido = (fundo: FundoFee): number => {
  if (fundo.feeTotal === 0) return 0;
  return (fundo.feeRecebido / fundo.feeTotal) * 100;
};

export default function RecebimentoFeeFundo({ fundos, loading = false }: RecebimentoFeeFundoProps) {
  const [expandido, setExpandido] = useState(true);
  const [fundoExpandido, setFundoExpandido] = useState<string | null>(null);
  
  // Estados para busca, filtro e paginação
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusFundo>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; direcao: OrdenacaoDirecao }>({ 
    campo: 'feeTotal', 
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
    
    // Aplica filtro de status
    if (filtroStatus !== 'todos') {
      resultado = resultado.filter(f => calcularStatus(f) === filtroStatus);
    }
    
    // Aplica ordenação
    resultado.sort((a, b) => {
      let comparacao = 0;
      
      switch (ordenacao.campo) {
        case 'nome':
          comparacao = a.nome.localeCompare(b.nome);
          break;
        case 'feeTotal':
          comparacao = a.feeTotal - b.feeTotal;
          break;
        case 'percentualRecebido':
          comparacao = calcularPercentualRecebido(a) - calcularPercentualRecebido(b);
          break;
        case 'saldoFundo':
          comparacao = a.saldoFundo - b.saldoFundo;
          break;
        case 'status':
          const ordemStatus = { 'saque-disponivel': 1, 'saldo-insuficiente': 2, 'finalizado': 3 };
          comparacao = ordemStatus[calcularStatus(a)] - ordemStatus[calcularStatus(b)];
          break;
      }
      
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
    
    return resultado;
  }, [fundos, busca, filtroStatus, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(fundosFiltrados.length / ITENS_POR_PAGINA);
  const fundosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return fundosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [fundosFiltrados, paginaAtual]);

  // Reset página quando filtros mudam
  useMemo(() => {
    setPaginaAtual(1);
  }, [busca, filtroStatus]);

  // Calcula totais
  const totalFeeContrato = fundos.reduce((acc, f) => acc + f.feeTotal, 0);
  const totalFeeRecebido = fundos.reduce((acc, f) => acc + f.feeRecebido, 0);
  const totalDisponivelAntecipacao = fundos.reduce((acc, f) => acc + f.feeDisponivelAntecipacao, 0);
  const totalFundos = fundos.length;

  // Contagem por status
  const contagemStatus = useMemo(() => ({
    'saque-disponivel': fundos.filter(f => calcularStatus(f) === 'saque-disponivel').length,
    'saldo-insuficiente': fundos.filter(f => calcularStatus(f) === 'saldo-insuficiente').length,
    'finalizado': fundos.filter(f => calcularStatus(f) === 'finalizado').length,
  }), [fundos]);

  const getStatusBadge = (status: StatusFundo, compact = false) => {
    const config = {
      'saque-disponivel': { 
        bg: 'bg-emerald-500/20', 
        bgSolid: 'bg-emerald-900',
        text: 'text-emerald-400', 
        border: 'border-emerald-500/30',
        icon: CheckCircle,
        label: 'Saque Disponível'
      },
      'saldo-insuficiente': { 
        bg: 'bg-yellow-500/20', 
        bgSolid: 'bg-yellow-900',
        text: 'text-yellow-400', 
        border: 'border-yellow-500/30',
        icon: Ban,
        label: 'Saldo Insuficiente'
      },
      'finalizado': { 
        bg: 'bg-blue-500/20', 
        bgSolid: 'bg-blue-900',
        text: 'text-blue-400', 
        border: 'border-blue-500/30',
        icon: Lock,
        label: 'Finalizado'
      },
    };
    
    const statusConfig = config[status];
    const Icon = statusConfig.icon;
    
    if (compact) {
      return (
        <span 
          className={`flex items-center justify-center w-6 h-6 rounded-full ${statusConfig.bgSolid} ${statusConfig.text} flex-shrink-0`} 
          title={statusConfig.label}
        >
          <Icon size={12} />
        </span>
      );
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        <Icon size={12} />
        {statusConfig.label}
      </span>
    );
  };

  const toggleFundo = (fundoId: string) => {
    setFundoExpandido(fundoExpandido === fundoId ? null : fundoId);
  };

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
        className="px-4 py-3 bg-gradient-to-r from-emerald-900/30 to-gray-900 border-b border-gray-700/50 cursor-pointer hover:from-emerald-900/40 transition-all"
        onClick={() => setExpandido(!expandido)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Recebimento FEE por Fundo
              </h3>
              <p className="text-xs text-gray-400">
                {totalFundos} fundos • {contagemStatus['saque-disponivel']} com saque disponível
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Disponível p/ Antecipação</p>
              <p className="text-lg font-bold text-emerald-400">{formatarMoeda(totalDisponivelAntecipacao)}</p>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
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
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Fundos</p>
                  <p className="text-2xl font-bold text-white">{totalFundos}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">FEE Total Contrato</p>
                  <p className="text-lg font-bold text-white">{formatarMoeda(totalFeeContrato)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">FEE Já Recebido</p>
                  <p className="text-lg font-bold text-blue-400">{formatarMoeda(totalFeeRecebido)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Por Status</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400" title="Saque Disponível">{contagemStatus['saque-disponivel']}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xs text-yellow-400" title="Saldo Insuficiente">{contagemStatus['saldo-insuficiente']}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xs text-blue-400" title="Finalizado">{contagemStatus['finalizado']}</span>
                  </div>
                </div>
              </div>

              {/* Barra de Busca e Filtros */}
              <div className="flex items-center gap-3">
                {/* Campo de busca */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do fundo ou unidade..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
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
                    mostrarFiltros || filtroStatus !== 'todos'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <Filter size={16} />
                  Filtros
                  {filtroStatus !== 'todos' && (
                    <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">1</span>
                  )}
                </button>
              </div>

              {/* Painel de Filtros Expandido */}
              {mostrarFiltros && (
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Status:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'todos', label: 'Todos' },
                      { value: 'saque-disponivel', label: 'Saque Disponível' },
                      { value: 'saldo-insuficiente', label: 'Saldo Insuficiente' },
                      { value: 'finalizado', label: 'Finalizado' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFiltroStatus(value as typeof filtroStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filtroStatus === value
                            ? value === 'saque-disponivel' ? 'bg-emerald-500 text-white'
                            : value === 'saldo-insuficiente' ? 'bg-yellow-500 text-white'
                            : value === 'finalizado' ? 'bg-blue-500 text-white'
                            : 'bg-gray-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {label}
                        {value !== 'todos' && (
                          <span className="ml-1 opacity-70">
                            ({contagemStatus[value as StatusFundo]})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  <div className="h-6 w-px bg-gray-700 mx-2" />
                  
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Ordenar por:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { campo: 'feeTotal' as OrdenacaoCampo, label: 'Valor FEE' },
                      { campo: 'percentualRecebido' as OrdenacaoCampo, label: '% Recebido' },
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
              {(busca || filtroStatus !== 'todos') && (
                <div className="text-xs text-gray-500">
                  Mostrando {fundosFiltrados.length} de {totalFundos} fundos
                  {busca && <span> para "{busca}"</span>}
                  {filtroStatus !== 'todos' && <span> com status "{filtroStatus.replace('-', ' ')}"</span>}
                </div>
              )}

              {/* Lista de Fundos */}
              {fundosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p>Nenhum fundo encontrado com os filtros aplicados</p>
                  <button 
                    onClick={() => { setBusca(''); setFiltroStatus('todos'); }}
                    className="mt-2 text-sm text-emerald-400 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {fundosPaginados.map((fundo) => {
                    const status = calcularStatus(fundo);
                    const percentualRecebido = calcularPercentualRecebido(fundo);
                    const feeBloqueado = calcularFeeBloqueado(fundo);
                    
                    return (
                      <div 
                        key={fundo.id}
                        className="bg-gray-900/30 rounded-lg border border-gray-700/30 overflow-hidden hover:border-gray-600/50 transition-colors"
                      >
                        {/* Linha principal do fundo */}
                        <div 
                          className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
                          onClick={() => toggleFundo(fundo.id)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getStatusBadge(status, true)}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-white truncate block">{fundo.nome}</span>
                              <span className="text-xs text-gray-500 truncate block">{fundo.unidade}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Valor FEE</p>
                              <p className="text-sm font-medium text-white">{formatarMoeda(fundo.feeTotal)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">% Recebido</p>
                              <p className={`text-sm font-bold ${percentualRecebido >= 100 ? 'text-blue-400' : percentualRecebido >= 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                {formatarPercentual(percentualRecebido)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-gray-500 uppercase">Saldo Fundo</p>
                              <p className="text-sm font-medium text-blue-400">{formatarMoeda(fundo.saldoFundo)}</p>
                            </div>
                            {fundoExpandido === fundo.id ? (
                              <ChevronUp size={16} className="text-gray-400" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Detalhes expandidos */}
                        {fundoExpandido === fundo.id && (
                          <div className="px-4 pb-4 border-t border-gray-700/30">
                            <div className="grid grid-cols-5 gap-3 mt-3">
                              <div className="p-2 bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">FEE Total Contrato</p>
                                <p className="text-sm font-semibold text-white">{formatarMoeda(fundo.feeTotal)}</p>
                              </div>
                              <div className="p-2 bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">FEE Já Recebido</p>
                                <p className="text-sm font-semibold text-emerald-400">{formatarMoeda(fundo.feeRecebido)}</p>
                              </div>
                              <div className="p-2 bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">FEE Disp. p/ Antecipação</p>
                                <p className="text-sm font-semibold text-orange-400">{formatarMoeda(fundo.feeDisponivelAntecipacao)}</p>
                              </div>
                              <div className="p-2 bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">FEE Bloqueado (Últ. Parcela)</p>
                                <p className="text-sm font-semibold text-red-400">{formatarMoeda(feeBloqueado)}</p>
                              </div>
                              <div className="p-2 bg-gray-800/50 rounded-lg">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Status</p>
                                <div className="mt-1">{getStatusBadge(status)}</div>
                              </div>
                            </div>
                            
                            {/* Barra de progresso */}
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Progresso de Recebimento do FEE</span>
                                <span className="text-gray-400">
                                  {formatarPercentual(percentualRecebido)}
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    percentualRecebido >= 100 
                                      ? 'bg-gradient-to-r from-blue-500 to-blue-400' 
                                      : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                  }`}
                                  style={{ width: `${Math.min(percentualRecebido, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
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
                                ? 'bg-emerald-500 text-white'
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
