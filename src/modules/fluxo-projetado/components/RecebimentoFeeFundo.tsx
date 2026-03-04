/**
 * Recebimento FEE por Fundo
 * Bloco 1 - Exibe o saldo disponível para requisição por fundo
 * Otimizado para lidar com 100+ fundos por franquia
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronUp, Wallet, AlertCircle, CheckCircle, 
  Building2, Search, Filter,
  ArrowUpDown, X, Lock, Ban, Download
} from 'lucide-react';

export interface FundoFee {
  id: string;
  nome: string;               // Nome do fundo/turma
  unidade: string;            // Unidade escolar
  // Dados principais
  feeTotal: number;           // FEE TOTAL DO CONTRATO
  feeAntecipacaoTotal: number;// FEE ANTECIPAÇÃO (valor total liberado para antecipação)
  feeAntecipacaoRecebido: number; // FEE ANTECIPAÇÃO JÁ RECEBIDO (M + N)
  saldoFundo: number;         // SALDO DO FUNDO (Coluna L)
  faltaReceber?: number;      // FALTA RECEBER (Coluna O - opcional, calculado se não existir)
  dataContrato?: string;      // DATA DO CONTRATO (Coluna G)
  dataBaile?: string;         // DATA DO BAILE (Coluna I)
  // Legado - manter para compatibilidade
  feeRecebido?: number;        
  feeDisponivelAntecipacao?: number;
}

// Status calculado dinamicamente
export type StatusFundo = 'saque-disponivel' | 'saldo-parcial' | 'saldo-insuficiente' | 'finalizado';

interface RecebimentoFeeFundoProps {
  fundos: FundoFee[];
  loading?: boolean;
  percentualAntecipacao?: number;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const formatarPercentual = (valor: number): string => {
  return `${valor.toFixed(0)}%`;
};

type OrdenacaoCampo = 'nome' | 'feeTotal' | 'percentualRecebido' | 'faltaReceber' | 'saldoFundo' | 'status';
type OrdenacaoDirecao = 'asc' | 'desc';

// Função para calcular o status do fundo (baseado em Saque Disponível e Falta Rec. Antec.)
const calcularStatus = (fundo: FundoFee, percentualAntecipacao: number = 0): StatusFundo => {
  const vlrAntecipacao = percentualAntecipacao > 0 ? fundo.feeTotal * (percentualAntecipacao / 100) : 0;
  const feeRecebidoLimitado = Math.min(fundo.feeAntecipacaoRecebido, vlrAntecipacao);
  const faltaRecAntec = Math.max(0, vlrAntecipacao - feeRecebidoLimitado);
  const saqueDisponivel = Math.min(faltaRecAntec, fundo.saldoFundo);
  
  // FINALIZADO: quando Falta Rec. Antec. = 0
  if (faltaRecAntec <= 0) {
    return 'finalizado';
  }
  
  // SAQUE DISPONÍVEL: quando Saque Disponível = Falta Rec. Antec.
  if (saqueDisponivel >= faltaRecAntec) {
    return 'saque-disponivel';
  }
  
  // SAQUE PARCIAL: quando Saque Disponível > 0, mas < Falta Rec. Antec.
  if (saqueDisponivel > 0 && saqueDisponivel < faltaRecAntec) {
    return 'saldo-parcial';
  }
  
  // SAQUE INDISPONÍVEL: quando Saque Disponível = 0 e Falta Receber > 0
  return 'saldo-insuficiente';
};

// Função para calcular % de antecipação recebido
const calcularPercentualAntecipacaoRecebido = (fundo: FundoFee): number => {
  if (fundo.feeAntecipacaoTotal === 0) return 0;
  return (fundo.feeAntecipacaoRecebido / fundo.feeAntecipacaoTotal) * 100;
};

// Função para obter valor faltando receber (usa coluna O se disponível)
const calcularFaltaReceber = (fundo: FundoFee): number => {
  // Prioriza o valor da planilha (coluna O), senão calcula
  if (fundo.faltaReceber !== undefined) {
    return fundo.faltaReceber;
  }
  return Math.max(0, fundo.feeAntecipacaoTotal - fundo.feeAntecipacaoRecebido);
};

export default function RecebimentoFeeFundo({ fundos, loading = false, percentualAntecipacao = 0 }: RecebimentoFeeFundoProps) {
  const [expandido, setExpandido] = useState(true);
  
  // Estados para busca e filtro
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusFundo>('todos');
  const [ordenacao, setOrdenacao] = useState<{ campo: OrdenacaoCampo; direcao: OrdenacaoDirecao }>({ 
    campo: 'feeTotal', 
    direcao: 'desc' 
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Filtros de data
  const [filtroBaileDe, setFiltroBaileDe] = useState('');
  const [filtroBalieAte, setFiltroBalieAte] = useState('');

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
      resultado = resultado.filter(f => calcularStatus(f, percentualAntecipacao) === filtroStatus);
    }
    
    // Helper para parsear data dd/mm/yyyy para Date
    const parseDataBR = (dataStr: string): Date | null => {
      if (!dataStr) return null;
      const partes = dataStr.split('/');
      if (partes.length !== 3) return null;
      const [dia, mes, ano] = partes.map(Number);
      return new Date(ano, mes - 1, dia);
    };
    
    // Aplica filtro de Dt. Baile
    if (filtroBaileDe || filtroBalieAte) {
      const de = filtroBaileDe ? new Date(filtroBaileDe + 'T00:00:00') : null;
      const ate = filtroBalieAte ? new Date(filtroBalieAte + 'T23:59:59') : null;
      resultado = resultado.filter(f => {
        if (!f.dataBaile) return false;
        const dataFundo = parseDataBR(f.dataBaile);
        if (!dataFundo) return false;
        if (de && dataFundo < de) return false;
        if (ate && dataFundo > ate) return false;
        return true;
      });
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
          comparacao = calcularPercentualAntecipacaoRecebido(a) - calcularPercentualAntecipacaoRecebido(b);
          break;
        case 'faltaReceber':
          comparacao = calcularFaltaReceber(a) - calcularFaltaReceber(b);
          break;
        case 'saldoFundo':
          comparacao = a.saldoFundo - b.saldoFundo;
          break;
        case 'status':
          const ordemStatus = { 'saque-disponivel': 1, 'saldo-parcial': 2, 'saldo-insuficiente': 3, 'finalizado': 4 };
          comparacao = ordemStatus[calcularStatus(a, percentualAntecipacao)] - ordemStatus[calcularStatus(b, percentualAntecipacao)];
          break;
      }
      
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
    
    return resultado;
  }, [fundos, busca, filtroStatus, ordenacao, filtroBaileDe, filtroBalieAte]);

  // Calcula totais
  const totalFeeContrato = fundos.reduce((acc, f) => acc + f.feeTotal, 0);
  const totalFeeAntecipacao = fundos.reduce((acc, f) => acc + f.feeAntecipacaoTotal, 0);
  const totalAntecipacaoRecebido = fundos.reduce((acc, f) => acc + f.feeAntecipacaoRecebido, 0);
  const totalFaltaReceber = fundos.reduce((acc, f) => acc + calcularFaltaReceber(f), 0);
  const totalFundos = fundos.length;

  // Contagem por status
  const contagemStatus = useMemo(() => ({
    'saque-disponivel': fundos.filter(f => calcularStatus(f, percentualAntecipacao) === 'saque-disponivel').length,
    'saldo-parcial': fundos.filter(f => calcularStatus(f, percentualAntecipacao) === 'saldo-parcial').length,
    'saldo-insuficiente': fundos.filter(f => calcularStatus(f, percentualAntecipacao) === 'saldo-insuficiente').length,
    'finalizado': fundos.filter(f => calcularStatus(f, percentualAntecipacao) === 'finalizado').length,
  }), [fundos, percentualAntecipacao]);

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
      'saldo-parcial': { 
        bg: 'bg-orange-500/20', 
        bgSolid: 'bg-orange-900',
        text: 'text-orange-400', 
        border: 'border-orange-500/30',
        icon: AlertCircle,
        label: 'Saque Parcial'
      },
      'saldo-insuficiente': { 
        bg: 'bg-red-500/20', 
        bgSolid: 'bg-red-900',
        text: 'text-red-400', 
        border: 'border-red-500/30',
        icon: Ban,
        label: 'Saque Indisponível'
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
              <p className="text-xs text-cyan-400 mt-0.5 font-medium">
                ⚠️ Dados apenas de fundos SPDX
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-orange-400">Falta Receber Antecipação</p>
              <p className="text-lg font-bold text-orange-400">{formatarMoeda(totalFaltaReceber)}</p>
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
              <div className="grid grid-cols-5 gap-3">
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total Fundos</p>
                  <p className="text-2xl font-bold text-white">{totalFundos}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Valor FEE</p>
                  <p className="text-lg font-bold text-white">{formatarMoeda(totalFeeContrato)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Antecip. Recebido</p>
                  <p className="text-lg font-bold text-emerald-400">{formatarMoeda(totalAntecipacaoRecebido)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Falta Receber</p>
                  <p className="text-lg font-bold text-orange-400">{formatarMoeda(totalFaltaReceber)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Por Status</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400" title="Saque Disponível">{contagemStatus['saque-disponivel']}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xs text-orange-400" title="Saldo Parcial">{contagemStatus['saldo-parcial']}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xs text-red-400" title="Saldo Insuficiente">{contagemStatus['saldo-insuficiente']}</span>
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
                    placeholder="Buscar por nome ou código do fundo..."
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
                  {(() => {
                    const count = (filtroStatus !== 'todos' ? 1 : 0) + (filtroBaileDe || filtroBalieAte ? 1 : 0);
                    return count > 0 ? <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] rounded-full">{count}</span> : null;
                  })()}
                </button>
              </div>

              {/* Painel de Filtros Expandido */}
              {mostrarFiltros && (
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 space-y-3">
                  {/* Filtro de Data do Baile */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">Dt. Baile:</span>
                      <input
                        type="date"
                        value={filtroBaileDe}
                        onChange={(e) => setFiltroBaileDe(e.target.value)}
                        className="px-2 py-1.5 bg-gray-800 border border-gray-700/50 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 [color-scheme:dark]"
                        title="De"
                      />
                      <span className="text-xs text-gray-500">até</span>
                      <input
                        type="date"
                        value={filtroBalieAte}
                        onChange={(e) => setFiltroBalieAte(e.target.value)}
                        className="px-2 py-1.5 bg-gray-800 border border-gray-700/50 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 [color-scheme:dark]"
                        title="Até"
                      />
                      {(filtroBaileDe || filtroBalieAte) && (
                        <button
                          onClick={() => { setFiltroBaileDe(''); setFiltroBalieAte(''); }}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Limpar filtro Dt. Baile"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Status e Ordenação */}
                  <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Status:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'todos', label: 'Todos' },
                      { value: 'saque-disponivel', label: 'Saque Disponível' },
                      { value: 'saldo-parcial', label: 'Saque Parcial' },
                      { value: 'saldo-insuficiente', label: 'Saque Indisponível' },
                      { value: 'finalizado', label: 'Finalizado' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => setFiltroStatus(value as typeof filtroStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          filtroStatus === value
                            ? value === 'saque-disponivel' ? 'bg-emerald-500 text-white'
                            : value === 'saldo-parcial' ? 'bg-orange-500 text-white'
                            : value === 'saldo-insuficiente' ? 'bg-red-500 text-white'
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
                      { campo: 'faltaReceber' as OrdenacaoCampo, label: 'Falta Receber' },
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
                </div>
              )}

              {/* Info de resultados */}
              {(busca || filtroStatus !== 'todos' || filtroBaileDe || filtroBalieAte) && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Mostrando {fundosFiltrados.length} de {totalFundos} fundos
                    {busca && <span> para "{busca}"</span>}
                    {filtroStatus !== 'todos' && <span> com status "{filtroStatus.replace('-', ' ')}"</span>}
                  </div>
                </div>
              )}

              {/* Botão Exportar */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const linhas = fundosFiltrados.map(fundo => {
                      const vlrAntecipacao = percentualAntecipacao > 0 ? fundo.feeTotal * (percentualAntecipacao / 100) : 0;
                      const feeRecebidoLimitado = Math.min(fundo.feeAntecipacaoRecebido, vlrAntecipacao);
                      const faltaRecAntec = Math.max(0, vlrAntecipacao - feeRecebidoLimitado);
                      const saqueDisp = Math.min(faltaRecAntec, fundo.saldoFundo);
                      const percentReceb = fundo.feeAntecipacaoTotal === 0 ? 0 : (fundo.feeAntecipacaoRecebido / fundo.feeAntecipacaoTotal) * 100;
                      const faltaRecTotal = fundo.faltaReceber ?? Math.max(0, fundo.feeAntecipacaoTotal - fundo.feeAntecipacaoRecebido);
                      const status = calcularStatus(fundo, percentualAntecipacao);
                      const statusLabel = {
                        'saque-disponivel': 'Saque Disponível',
                        'saldo-parcial': 'Saque Parcial',
                        'saldo-insuficiente': 'Saque Indisponível',
                        'finalizado': 'Finalizado'
                      }[status];
                      return [
                        fundo.id,
                        fundo.nome,
                        fundo.dataContrato || '',
                        fundo.dataBaile || '',
                        fundo.feeTotal,
                        fundo.feeAntecipacaoRecebido,
                        `${percentReceb.toFixed(0)}%`,
                        faltaRecTotal,
                        vlrAntecipacao,
                        feeRecebidoLimitado,
                        faltaRecAntec,
                        fundo.saldoFundo,
                        saqueDisp,
                        statusLabel
                      ];
                    });
                    const cabecalho = ['Cód. Fundo','Nome','Dt. Cadastro','Dt. Baile','Valor FEE','FEE Recebido','% Receb.','Falta Receber','Vlr. Antecipação','Antec. Recebida','Falta Rec. Antec.','Saldo Fundo','Saque Disponível','Status'];
                    let csv = '\uFEFF';
                    csv += cabecalho.join(';') + '\n';
                    linhas.forEach(linha => {
                      csv += linha.map(v => {
                        if (typeof v === 'number') return v.toFixed(2).replace('.', ',');
                        return `"${String(v).replace(/"/g, '""')}"`;
                      }).join(';') + '\n';
                    });
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `recebimento-fee-fundos.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>

              {/* Lista de Fundos */}
              {fundosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p>Nenhum fundo encontrado com os filtros aplicados</p>
                  <button 
                    onClick={() => { setBusca(''); setFiltroStatus('todos'); setFiltroBaileDe(''); setFiltroBalieAte(''); }}
                    className="mt-2 text-sm text-emerald-400 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
                  {fundosFiltrados.map((fundo) => {
                    const status = calcularStatus(fundo, percentualAntecipacao);
                    const percentualRecebido = calcularPercentualAntecipacaoRecebido(fundo);
                    const faltaReceber = calcularFaltaReceber(fundo);
                    
                    return (
                      <div 
                        key={fundo.id}
                        className="bg-gray-900/30 rounded-lg border border-gray-700/30 overflow-hidden hover:border-gray-600/50 transition-colors px-3 py-2.5"
                      >
                        {/* Layout em linha única com flex */}
                        <div className="flex items-center gap-3">
                          {/* Nome e unidade */}
                          <div className="flex items-center gap-2 min-w-0 w-[200px] flex-shrink-0" title={fundo.nome}>
                            {getStatusBadge(status, true)}
                            <div className="min-w-0 flex-1 cursor-help">
                              <span className="text-sm font-medium text-white truncate block" title={fundo.nome}>{fundo.nome}</span>
                              <span className="text-xs text-gray-500 truncate block">Cód: {fundo.id}</span>
                            </div>
                          </div>
                          
                          {/* Colunas de valores */}
                          <div className="flex-1 flex items-center gap-0">
                            {/* Datas (empilhadas) */}
                            <div className="w-[100px] flex-shrink-0 text-left">
                              <p className="text-[10px] text-gray-500 uppercase">Dt.Cadastro</p>
                              <p className="text-xs font-medium text-gray-300">{fundo.dataContrato || '-'}</p>
                              <p className="text-[10px] text-gray-500 uppercase mt-0.5">Dt. Baile</p>
                              <p className="text-xs font-medium text-gray-300">{fundo.dataBaile || '-'}</p>
                            </div>
                            
                            {/* Separador discreto */}
                            <div className="w-px self-stretch bg-gray-700/40 mx-3" />
                            
                            {/* Bloco TOTAL */}
                            <div className="grid grid-cols-4 gap-2 flex-1">
                              <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase">Valor FEE</p>
                                <p className="text-sm font-medium text-white">{formatarMoeda(fundo.feeTotal)}</p>
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase">FEE Recebido</p>
                                <p className="text-sm font-medium text-emerald-400">{formatarMoeda(fundo.feeAntecipacaoRecebido)}</p>
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase">% Receb.</p>
                                <p className={`text-sm font-bold ${percentualRecebido >= 100 ? 'text-blue-400' : percentualRecebido >= 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                  {formatarPercentual(percentualRecebido)}
                                </p>
                              </div>
                              <div className="text-left">
                                <p className="text-[10px] text-gray-500 uppercase">Falta Receber</p>
                                <p className="text-sm font-medium text-orange-400">{formatarMoeda(faltaReceber)}</p>
                              </div>
                            </div>
                            
                            {/* Separador discreto entre blocos TOTAL e ANTECIPAÇÃO */}
                            <div className="w-px self-stretch bg-gray-700/40 mx-3" />
                            
                            {/* Bloco ANTECIPAÇÃO */}
                            {(() => {
                              const vlrAntecipacao = percentualAntecipacao > 0 ? fundo.feeTotal * (percentualAntecipacao / 100) : 0;
                              const feeRecebidoLimitado = Math.min(fundo.feeAntecipacaoRecebido, vlrAntecipacao);
                              const faltaRecAntec = Math.max(0, vlrAntecipacao - feeRecebidoLimitado);
                              const saqueDisponivel = Math.min(faltaRecAntec, fundo.saldoFundo);
                              return (
                                <div className="grid grid-cols-5 gap-2 w-[600px] flex-shrink-0">
                                  <div className="text-left">
                                    <p className="text-[10px] text-gray-500 uppercase">Vlr. Antecipação</p>
                                    <p className="text-sm font-medium text-cyan-400">
                                      {percentualAntecipacao > 0 ? formatarMoeda(vlrAntecipacao) : '-'}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[10px] text-gray-500 uppercase">Antec. Recebida</p>
                                    <p className="text-sm font-medium text-emerald-400">
                                      {percentualAntecipacao > 0 ? formatarMoeda(feeRecebidoLimitado) : '-'}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[10px] text-gray-500 uppercase">Falta Rec. Antec.</p>
                                    <p className="text-sm font-medium text-red-400">
                                      {percentualAntecipacao > 0 ? formatarMoeda(faltaRecAntec) : '-'}
                                    </p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[10px] text-gray-500 uppercase">Saldo Fundo</p>
                                    <p className="text-sm font-medium text-blue-400">{formatarMoeda(fundo.saldoFundo)}</p>
                                  </div>
                                  <div className="text-left">
                                    <p className="text-[10px] text-gray-500 uppercase">Saque Disponível</p>
                                    <p className={`text-sm font-bold ${saqueDisponivel > 0 ? 'text-emerald-300' : 'text-gray-500'}`}>
                                      {percentualAntecipacao > 0 ? formatarMoeda(saqueDisponivel) : '-'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          {/* Status Badge */}
                          <div className="w-[150px] flex-shrink-0 flex justify-center">
                            {getStatusBadge(status)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Info de total */}
              {fundosFiltrados.length > 0 && (
                <div className="flex items-center justify-center pt-3 border-t border-gray-700/30">
                  <span className="text-xs text-gray-500">
                    {fundosFiltrados.length} fundos exibidos
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
