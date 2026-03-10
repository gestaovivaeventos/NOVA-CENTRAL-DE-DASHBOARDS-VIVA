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
  percentualAtingMac?: number; // % ATINGIMENTO MAC (Coluna T)
  situacao?: string;          // SITUAÇÃO (Coluna U)
  feeInicialV?: number;       // FEE INICIAL (Coluna V)
  feeReplanejado?: number;    // FEE REPLANEJADO (Coluna W)
  // Legado - manter para compatibilidade
  feeRecebido?: number;        
  feeDisponivelAntecipacao?: number;
}

// Status calculado dinamicamente
export type StatusFundo = 'saque-disponivel' | 'saldo-parcial' | 'saldo-insuficiente' | 'finalizado' | 'antecipacao-concluida';

interface RecebimentoFeeFundoProps {
  fundos: FundoFee[];
  loading?: boolean;
  percentualAntecipacao?: number;
  diasBaileAntecipar?: number;
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const formatarPercentual = (valor: number): string => {
  return `${valor.toFixed(2)}%`;
};

function FeeTooltip({ feeInicialV, feeReplanejado, children }: { feeInicialV?: number; feeReplanejado?: number; children: React.ReactNode }) {
  const [show, setShow] = React.useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block', cursor: 'help' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1d24',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '10px 14px',
          zIndex: 100,
          whiteSpace: 'nowrap',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Composição do FEE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>FEE Inicial</span>
              <span style={{ color: feeInicialV ? '#f1f5f9' : '#4b5563', fontSize: '0.75rem', fontWeight: 600 }}>{feeInicialV ? formatarMoeda(feeInicialV) : '—'}</span>
            </div>
            <div style={{ borderTop: '1px solid #2d3748', paddingTop: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>FEE Replanejado</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: (feeReplanejado && feeReplanejado > 0) ? '#fb923c' : '#4b5563' }}>
                {(feeReplanejado && feeReplanejado > 0) ? formatarMoeda(feeReplanejado) : '—'}
              </span>
            </div>
          </div>
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid #374151',
          }} />
        </div>
      )}
    </div>
  );
}

type OrdenacaoCampo = 'nome' | 'feeTotal' | 'percentualRecebido' | 'faltaReceber' | 'saldoFundo' | 'status' | 'dataCadastro' | 'dataBaile' | 'vlrAntecipacao' | 'antecRecebida' | 'faltaRecAntec' | 'saqueDisponivel';
type OrdenacaoDirecao = 'asc' | 'desc';

// Helper para parsear data dd/mm/yyyy
const parseDataBR = (dataStr: string): Date | null => {
  if (!dataStr) return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes.map(Number);
  if (!dia || !mes || !ano) return null;
  return new Date(ano, mes - 1, dia);
};

// Verifica se estamos dentro de X dias antes do baile
const isProximoBaile = (fundo: FundoFee, diasBaileAntecipar: number): boolean => {
  if (diasBaileAntecipar <= 0 || !fundo.dataBaile) return false;
  const dataBaile = parseDataBR(fundo.dataBaile);
  if (!dataBaile) return false;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataBaile.setHours(0, 0, 0, 0);
  const diffMs = dataBaile.getTime() - hoje.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  // Próximo do baile: faltam X dias ou menos (inclusive bailes já passados)
  return diffDias <= diasBaileAntecipar;
};

// Calcula o saque disponível considerando proximidade do baile
const calcularSaqueDisponivel = (fundo: FundoFee, percentualAntecipacao: number, diasBaileAntecipar: number): number => {
  const proximoBaile = isProximoBaile(fundo, diasBaileAntecipar);
  
  if (proximoBaile) {
    // Próximo ao baile: libera o restante total do FEE para saque
    const faltaRecTotal = calcularFaltaReceber(fundo);
    return Math.min(faltaRecTotal, fundo.saldoFundo);
  }
  
  // Regra normal: apenas a parcela de antecipação
  const vlrAntecipacao = percentualAntecipacao > 0 ? fundo.feeTotal * (percentualAntecipacao / 100) : 0;
  const feeRecebidoLimitado = Math.min(fundo.feeAntecipacaoRecebido, vlrAntecipacao);
  const faltaRecAntec = Math.max(0, vlrAntecipacao - feeRecebidoLimitado);
  return Math.min(faltaRecAntec, fundo.saldoFundo);
};

// Função para calcular o status do fundo
const calcularStatus = (fundo: FundoFee, percentualAntecipacao: number = 0, diasBaileAntecipar: number = 0): StatusFundo => {
  // Calcular % recebido total
  const percentRecebido = fundo.feeAntecipacaoTotal === 0 ? 0 : (fundo.feeAntecipacaoRecebido / fundo.feeAntecipacaoTotal) * 100;
  
  // FINALIZADO: quando % RECEB. = 100%
  if (percentRecebido >= 100) {
    return 'finalizado';
  }
  
  const proximoBaile = isProximoBaile(fundo, diasBaileAntecipar);
  
  if (proximoBaile) {
    // Próximo ao baile: usa o total faltando (não só antecipação)
    const faltaRecTotal = calcularFaltaReceber(fundo);
    if (faltaRecTotal <= 0) return 'finalizado';
    const saqueDisp = Math.min(faltaRecTotal, fundo.saldoFundo);
    if (saqueDisp >= faltaRecTotal) return 'saque-disponivel';
    if (saqueDisp > 0) return 'saldo-parcial';
    return 'saldo-insuficiente';
  }
  
  // Regra normal (sem proximidade do baile)
  const vlrAntecipacao = percentualAntecipacao > 0 ? fundo.feeTotal * (percentualAntecipacao / 100) : 0;
  const feeRecebidoLimitado = Math.min(fundo.feeAntecipacaoRecebido, vlrAntecipacao);
  const faltaRecAntec = Math.max(0, vlrAntecipacao - feeRecebidoLimitado);
  const saqueDisponivel = Math.min(faltaRecAntec, fundo.saldoFundo);
  
  // ANTECIPAÇÃO CONCLUÍDA: quando % RECEB. >= % ANTECIPAÇÃO parâmetro, mas < 100%
  if (percentualAntecipacao > 0 && percentRecebido >= percentualAntecipacao) {
    return 'antecipacao-concluida';
  }
  
  // FINALIZADO (antecipação): quando Falta Rec. Antec. = 0
  if (faltaRecAntec <= 0) {
    return 'finalizado';
  }
  
  // SAQUE DISPONÍVEL
  if (saqueDisponivel >= faltaRecAntec) {
    return 'saque-disponivel';
  }
  
  // SAQUE PARCIAL
  if (saqueDisponivel > 0 && saqueDisponivel < faltaRecAntec) {
    return 'saldo-parcial';
  }
  
  // SAQUE INDISPONÍVEL
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

export default function RecebimentoFeeFundo({ fundos, loading = false, percentualAntecipacao = 0, diasBaileAntecipar = 0 }: RecebimentoFeeFundoProps) {
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

  // Filtro de situação
  const [filtroSituacao, setFiltroSituacao] = useState<string>('todos');

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
      resultado = resultado.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === filtroStatus);
    }
    
    // Aplica filtro de situação
    if (filtroSituacao !== 'todos') {
      resultado = resultado.filter(f => {
        const val = (f.situacao || '').trim().toLowerCase();
        if (filtroSituacao === 'outros') {
          return !['comum', 'formado', 'rescindindo', 'junção', 'juncao'].includes(val);
        }
        return val === filtroSituacao.toLowerCase();
      });
    }

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
        case 'dataCadastro':
          comparacao = (a.dataContrato || '').localeCompare(b.dataContrato || '');
          break;
        case 'dataBaile':
          comparacao = (a.dataBaile || '').localeCompare(b.dataBaile || '');
          break;
        case 'vlrAntecipacao': {
          const vlrA = percentualAntecipacao > 0 ? a.feeTotal * (percentualAntecipacao / 100) : 0;
          const vlrB = percentualAntecipacao > 0 ? b.feeTotal * (percentualAntecipacao / 100) : 0;
          comparacao = vlrA - vlrB;
          break;
        }
        case 'antecRecebida': {
          const vlrAA = percentualAntecipacao > 0 ? a.feeTotal * (percentualAntecipacao / 100) : 0;
          const vlrBA = percentualAntecipacao > 0 ? b.feeTotal * (percentualAntecipacao / 100) : 0;
          comparacao = Math.min(a.feeAntecipacaoRecebido, vlrAA) - Math.min(b.feeAntecipacaoRecebido, vlrBA);
          break;
        }
        case 'faltaRecAntec': {
          const vA = percentualAntecipacao > 0 ? a.feeTotal * (percentualAntecipacao / 100) : 0;
          const vB = percentualAntecipacao > 0 ? b.feeTotal * (percentualAntecipacao / 100) : 0;
          const fA = Math.max(0, vA - Math.min(a.feeAntecipacaoRecebido, vA));
          const fB = Math.max(0, vB - Math.min(b.feeAntecipacaoRecebido, vB));
          comparacao = fA - fB;
          break;
        }
        case 'saqueDisponivel': {
          comparacao = calcularSaqueDisponivel(a, percentualAntecipacao, diasBaileAntecipar) - calcularSaqueDisponivel(b, percentualAntecipacao, diasBaileAntecipar);
          break;
        }
        case 'status':
          const ordemStatus = { 'saque-disponivel': 1, 'saldo-parcial': 2, 'saldo-insuficiente': 3, 'antecipacao-concluida': 4, 'finalizado': 5 };
          comparacao = ordemStatus[calcularStatus(a, percentualAntecipacao, diasBaileAntecipar)] - ordemStatus[calcularStatus(b, percentualAntecipacao, diasBaileAntecipar)];
          break;
      }
      
      return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
    });
    
    return resultado;
  }, [fundos, busca, filtroStatus, filtroSituacao, ordenacao, filtroBaileDe, filtroBalieAte, diasBaileAntecipar]);

  // Calcula totais
  const totalFeeContrato = fundos.reduce((acc, f) => acc + f.feeTotal, 0);
  const totalFeeAntecipacao = fundos.reduce((acc, f) => acc + f.feeAntecipacaoTotal, 0);
  const totalAntecipacaoRecebido = fundos.reduce((acc, f) => acc + f.feeAntecipacaoRecebido, 0);
  const totalFaltaReceber = fundos.reduce((acc, f) => acc + calcularFaltaReceber(f), 0);
  const totalFundos = fundos.length;

  // Totais calculados para antecipação
  const totalVlrAntecipacao = fundos.reduce((acc, f) => {
    return acc + (percentualAntecipacao > 0 ? f.feeTotal * (percentualAntecipacao / 100) : 0);
  }, 0);
  const totalAntecRecebida = fundos.reduce((acc, f) => {
    const vlr = percentualAntecipacao > 0 ? f.feeTotal * (percentualAntecipacao / 100) : 0;
    return acc + Math.min(f.feeAntecipacaoRecebido, vlr);
  }, 0);
  const totalFaltaRecAntec = fundos.reduce((acc, f) => {
    const vlr = percentualAntecipacao > 0 ? f.feeTotal * (percentualAntecipacao / 100) : 0;
    const recLim = Math.min(f.feeAntecipacaoRecebido, vlr);
    return acc + Math.max(0, vlr - recLim);
  }, 0);
  const totalSaqueDisponivel = fundos.reduce((acc, f) => {
    return acc + calcularSaqueDisponivel(f, percentualAntecipacao, diasBaileAntecipar);
  }, 0);

  // Contagem por status
  const contagemStatus = useMemo(() => ({
    'saque-disponivel': fundos.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === 'saque-disponivel').length,
    'saldo-parcial': fundos.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === 'saldo-parcial').length,
    'saldo-insuficiente': fundos.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === 'saldo-insuficiente').length,
    'antecipacao-concluida': fundos.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === 'antecipacao-concluida').length,
    'finalizado': fundos.filter(f => calcularStatus(f, percentualAntecipacao, diasBaileAntecipar) === 'finalizado').length,
  }), [fundos, percentualAntecipacao, diasBaileAntecipar]);

  const getSituacaoDot = (situacao?: string) => {
    const val = (situacao || '').trim().toLowerCase();
    if (val === 'comum') {
      return (
        <span
          className="flex-shrink-0 rounded-full border-2 border-white bg-white"
          style={{ width: 14, height: 14, display: 'inline-block' }}
          title="Situação: Comum"
        />
      );
    }
    if (val === 'formado') {
      return (
        <span
          className="flex-shrink-0 rounded-full border-2 border-gray-500 bg-black"
          style={{ width: 14, height: 14, display: 'inline-block' }}
          title="Situação: Formado"
        />
      );
    }
    if (val === 'rescindindo') {
      return (
        <span
          className="flex-shrink-0 rounded-full border-2 border-yellow-400 bg-yellow-400"
          style={{ width: 14, height: 14, display: 'inline-block' }}
          title="Situação: Rescindindo"
        />
      );
    }
    if (val === 'junção' || val === 'juncao') {
      return (
        <span
          className="flex-shrink-0 rounded-full border-2 border-gray-400 bg-gray-500"
          style={{ width: 14, height: 14, display: 'inline-block' }}
          title="Situação: Junção"
        />
      );
    }
    // Qualquer outro valor: transparente
    return (
      <span
        className="flex-shrink-0 rounded-full"
        style={{ width: 14, height: 14, display: 'inline-block', background: 'transparent' }}
        title={situacao ? `Situação: ${situacao}` : 'Situação não informada'}
      />
    );
  };

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
      'antecipacao-concluida': { 
        bg: 'bg-purple-500/20', 
        bgSolid: 'bg-purple-900',
        text: 'text-purple-400', 
        border: 'border-purple-500/30',
        icon: CheckCircle,
        label: 'Antecipação Concluída'
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
              <p className="text-xs text-orange-400">Falta Receber</p>
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
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total FEE</p>
                  <p className="text-lg font-bold text-white">{formatarMoeda(totalFeeContrato)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total FEE Recebido</p>
                  <p className="text-lg font-bold text-emerald-400">{formatarMoeda(totalAntecipacaoRecebido)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Falta Receber</p>
                  <p className="text-lg font-bold text-orange-400">{formatarMoeda(totalFaltaReceber)}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Saque Disponível</p>
                  <p className="text-lg font-bold text-emerald-300">{formatarMoeda(totalSaqueDisponivel)}</p>
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
                    const count = (filtroStatus !== 'todos' ? 1 : 0) + (filtroBaileDe || filtroBalieAte ? 1 : 0) + (filtroSituacao !== 'todos' ? 1 : 0);
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
                  
                  {/* Filtro de Situação */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">Situação:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { value: 'todos', label: 'Todos', dot: null },
                        { value: 'comum', label: 'Comum', dot: 'bg-white border-white' },
                        { value: 'formado', label: 'Formado', dot: 'bg-black border-gray-500' },
                        { value: 'rescindindo', label: 'Rescindindo', dot: 'bg-yellow-400 border-yellow-400' },
                        { value: 'junção', label: 'Junção', dot: 'bg-gray-500 border-gray-400' },
                      ].map(({ value, label, dot }) => (
                        <button
                          key={value}
                          onClick={() => setFiltroSituacao(value)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filtroSituacao === value
                              ? 'bg-gray-500 text-white border border-gray-400'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                          }`}
                        >
                          {dot && (
                            <span
                              className={`rounded-full border-2 flex-shrink-0 ${dot}`}
                              style={{ width: 10, height: 10, display: 'inline-block' }}
                            />
                          )}
                          {label}
                        </button>
                      ))}
                      {filtroSituacao !== 'todos' && (
                        <button
                          onClick={() => setFiltroSituacao('todos')}
                          className="text-gray-500 hover:text-gray-300 transition-colors"
                          title="Limpar filtro Situação"
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
                      { value: 'antecipacao-concluida', label: 'Antecip. Concluída' },
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
                            : value === 'antecipacao-concluida' ? 'bg-purple-500 text-white'
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
                  </div>
                </div>
              )}

              {/* Info de resultados */}
              {(busca || filtroStatus !== 'todos' || filtroBaileDe || filtroBalieAte || filtroSituacao !== 'todos') && (
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
                      const saqueDisp = calcularSaqueDisponivel(fundo, percentualAntecipacao, diasBaileAntecipar);
                      const percentReceb = fundo.feeAntecipacaoTotal === 0 ? 0 : (fundo.feeAntecipacaoRecebido / fundo.feeAntecipacaoTotal) * 100;
                      const faltaRecTotal = fundo.faltaReceber ?? Math.max(0, fundo.feeAntecipacaoTotal - fundo.feeAntecipacaoRecebido);
                      const status = calcularStatus(fundo, percentualAntecipacao, diasBaileAntecipar);
                      const statusLabel = {
                        'saque-disponivel': 'Saque Disponível',
                        'saldo-parcial': 'Saque Parcial',
                        'saldo-insuficiente': 'Saque Indisponível',
                        'antecipacao-concluida': 'Antecipação Concluída',
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
                        fundo.percentualAtingMac != null ? `${fundo.percentualAtingMac.toFixed(2)}%` : '-',
                        faltaRecTotal,
                        vlrAntecipacao,
                        feeRecebidoLimitado,
                        faltaRecAntec,
                        fundo.saldoFundo,
                        saqueDisp,
                        statusLabel
                      ];
                    });
                    const cabecalho = ['Cód. Fundo','Nome','Dt. Cadastro','Dt. Baile','Valor FEE','FEE Recebido','% Receb.','% Ating. MAC','Falta Receber','Vlr. Antecipação','Antec. Recebida','Falta Rec. Antec.','Saldo Fundo','Saque Disponível','Status'];
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

              {/* Tabela de Fundos */}
              {fundosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Search className="w-10 h-10 mb-3 opacity-50" />
                  <p>Nenhum fundo encontrado com os filtros aplicados</p>
                  <button 
                    onClick={() => { setBusca(''); setFiltroStatus('todos'); setFiltroBaileDe(''); setFiltroBalieAte(''); setFiltroSituacao('todos'); }}
                    className="mt-2 text-sm text-emerald-400 hover:underline"
                  >
                    Limpar filtros
                  </button>
                </div>
              ) : (
                <div style={{ maxHeight: '550px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.8125rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                      {/* Linha de grupo: TOTAL e ANTECIPAÇÃO */}
                      <tr style={{ backgroundColor: '#1e2028' }}>
                        <th colSpan={2} style={{ padding: '6px 8px', borderBottom: 'none' }} />
                        <th style={{ padding: '6px 8px', borderBottom: 'none' }} />
                        <th colSpan={4} style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          color: '#22d3ee',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          backgroundColor: 'rgba(34,211,238,0.06)',
                          borderBottom: '2px solid rgba(34,211,238,0.3)',
                        }}>
                          TOTAL
                        </th>
                        <th colSpan={2} style={{
                          padding: '6px 8px',
                          textAlign: 'center',
                          color: '#fb923c',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          backgroundColor: 'rgba(251,146,60,0.06)',
                          borderBottom: '2px solid rgba(251,146,60,0.3)',
                        }}>
                          ANTECIPAÇÃO
                        </th>
                        <th style={{ padding: '6px 8px', borderBottom: 'none' }} />
                      </tr>
                      {/* Linha de colunas */}
                      <tr style={{ backgroundColor: '#2a2f36' }}>
                        {[
                          { key: 'nome' as OrdenacaoCampo, label: 'FUNDO', align: 'left' },
                          { key: 'dataBaile' as OrdenacaoCampo, label: 'DATAS', align: 'center' },
                          { key: 'faltaReceber' as OrdenacaoCampo, label: '% ATING. MAC', align: 'center' },
                          { key: 'feeTotal' as OrdenacaoCampo, label: 'VALOR FEE', align: 'center' },
                          { key: 'percentualRecebido' as OrdenacaoCampo, label: 'FEE RECEBIDO', align: 'center' },
                          { key: 'percentualRecebido' as OrdenacaoCampo, label: '% RECEB.', align: 'center' },
                          { key: 'faltaReceber' as OrdenacaoCampo, label: 'FALTA RECEBER', align: 'center' },
                          { key: 'saldoFundo' as OrdenacaoCampo, label: 'SALDO FUNDO', align: 'center' },
                          { key: 'saqueDisponivel' as OrdenacaoCampo, label: 'SAQUE DISPONÍVEL', align: 'center' },
                          { key: 'status' as OrdenacaoCampo, label: 'STATUS', align: 'center' },
                        ].map((col, i) => (
                          <th
                            key={`${col.key}-${i}`}
                            onClick={() => alternarOrdenacao(col.key)}
                            style={{
                              color: '#adb5bd',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              padding: '10px 8px',
                              textAlign: col.align as any,
                              cursor: 'pointer',
                              userSelect: 'none',
                              borderBottom: '2px solid #10b981',
                              whiteSpace: 'nowrap',
                              transition: 'background-color 0.2s',
                              backgroundColor: '#2a2f36',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#343a40'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
                          >
                            {col.label}
                            {ordenacao.campo === col.key ? (
                              <span style={{ color: '#10b981', marginLeft: '4px' }}>
                                {ordenacao.direcao === 'asc' ? '↑' : '↓'}
                              </span>
                            ) : (
                              <span style={{ color: '#6c757d', marginLeft: '4px' }}>⇅</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fundosFiltrados.map((fundo, rowIndex) => {
                        const status = calcularStatus(fundo, percentualAntecipacao, diasBaileAntecipar);
                        const percentualRecebido = calcularPercentualAntecipacaoRecebido(fundo);
                        const faltaReceber = calcularFaltaReceber(fundo);
                        const saqueDisponivel = calcularSaqueDisponivel(fundo, percentualAntecipacao, diasBaileAntecipar);
                        const bgColor = rowIndex % 2 === 0 ? '#343A40' : '#2c3136';
                        
                        return (
                          <tr
                            key={fundo.id}
                            style={{ backgroundColor: bgColor, transition: 'background-color 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgColor}
                          >
                            {/* FUNDO */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'left', minWidth: '180px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getSituacaoDot(fundo.situacao)}
                                <div>
                                  <span className="text-sm font-medium text-white block truncate" style={{ maxWidth: '200px' }} title={fundo.nome}>{fundo.nome}</span>
                                  <span className="text-xs text-gray-500 block">Cód: {fundo.id}</span>
                                </div>
                              </div>
                            </td>
                            {/* DATAS */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase block">Cadastro</span>
                                <span className="text-xs text-gray-300 block">{fundo.dataContrato || '-'}</span>
                                <span className="text-[10px] text-gray-500 uppercase block mt-0.5">Baile</span>
                                <span className="text-xs text-gray-300 block">{fundo.dataBaile || '-'}</span>
                              </div>
                            </td>
                            {/* % ATING. MAC */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', color: '#F8F9FA', fontWeight: 400, whiteSpace: 'nowrap' }}>
                              {fundo.percentualAtingMac != null && fundo.percentualAtingMac > 0
                                ? formatarPercentual(fundo.percentualAtingMac)
                                : '-'}
                            </td>
                            {/* VALOR FEE */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', color: '#F8F9FA', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              <FeeTooltip feeInicialV={fundo.feeInicialV} feeReplanejado={fundo.feeReplanejado}>
                                {formatarMoeda(fundo.feeTotal)}
                              </FeeTooltip>
                            </td>
                            {/* FEE RECEBIDO */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', color: '#34d399', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {formatarMoeda(fundo.feeAntecipacaoRecebido)}
                            </td>
                            {/* % RECEB. */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', whiteSpace: 'nowrap', minWidth: '90px' }}>
                              <span style={{ fontWeight: 700, color: percentualRecebido > 80 ? '#f87171' : percentualRecebido > 60 ? '#facc15' : '#34d399' }}>
                                {formatarPercentual(percentualRecebido)}
                              </span>
                              <div style={{ marginTop: '4px', height: '4px', borderRadius: '9999px', background: '#374151', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  borderRadius: '9999px',
                                  width: `${Math.min(percentualRecebido, 100)}%`,
                                  background: percentualRecebido > 80 ? '#f87171' : percentualRecebido > 60 ? '#facc15' : '#34d399',
                                  transition: 'width 0.3s ease',
                                }} />
                              </div>
                            </td>
                            {/* FALTA RECEBER */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', color: '#fb923c', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {formatarMoeda(faltaReceber)}
                            </td>
                            {/* SALDO FUNDO */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', color: '#60a5fa', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {formatarMoeda(fundo.saldoFundo)}
                            </td>
                            {/* SAQUE DISPONÍVEL */}
                            <td style={{ 
                              padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center', fontWeight: 700, whiteSpace: 'nowrap',
                              color: saqueDisponivel > 0 ? '#6ee7b7' : '#6b7280'
                            }}>
                              {(percentualAntecipacao > 0 || diasBaileAntecipar > 0) ? formatarMoeda(saqueDisponivel) : '-'}
                            </td>
                            {/* STATUS */}
                            <td style={{ padding: '10px 8px', borderBottom: '1px solid #444', textAlign: 'center' }}>
                              {getStatusBadge(status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
