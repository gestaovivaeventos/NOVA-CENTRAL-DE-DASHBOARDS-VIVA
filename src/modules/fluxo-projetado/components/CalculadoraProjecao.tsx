/**
 * Calculadora - Projetar Caixa
 * Componente com popup de parâmetros e cards de resultado estilo FluxoAnualCard
 */

import React, { useState, useMemo } from 'react';
import { Calculator, RotateCcw, Settings, X, Check, ChevronRight, ChevronDown } from 'lucide-react';

// Interface dos parâmetros da simulação
interface ParametrosSimulacao {
  vvr: number;
  tempoMedioFundosCarteira: number;
  feeMedioVenda: number;
  margemMediaFinal: number;
  despesaAnual: number;
}

// Parâmetros avançados para cálculos (associados à aba PARAMETROS - CALCULADORA FRANQUEADO)
interface ParametrosAvancados {
  diasParaInicioAntecipacao: number;    // Coluna G
  percentualAntecipacao: number;        // Coluna C
  nrParcelasAntecipacao: number;        // Coluna E
  quebraOrcamentoFinalInicial: number;  // Coluna F
  diasBaileUltimaParcela: number;       // Dias do Baile para Pagamento Última Parcela
  tempoMedioFundosCarteira: number;     // Coluna J
}

// Parâmetros padrão da franquia (vem dos cards de projeção)
interface ParametrosFranquiaCalculadora {
  feePercentual: number;
  percentualAntecipacao: number;
  numParcelasAntecipacao: number;
  quebraOrcamentoFinal: number;
  diasBaile: number;
  mesesPermanenciaCarteira?: number;
  margem?: number;
}

// Dados da projeção por ano (vem da planilha)
interface DadosProjecaoAno {
  ano: number;
  projCarteira: number;           // D + E + F
  projNovasVendas: number;        // G + H + I
  somaAntecipacaoCarteira: number;    // D
  somaExecucaoCarteira: number;       // E
  somaDemaisReceitasCarteira: number; // F
  somaAntecipacaoNovasVendas: number; // G
  somaExecucaoNovasVendas: number;    // H
  somaDemaisReceitasNovasVendas: number; // I
  somaVVR: number;
  // Dados calculadora franqueado (colunas J+K+L)
  somaAntecipacaoCalcFranqueado?: number;    // J
  somaFechamentoCalcFranqueado?: number;     // K
  somaDemaisReceitasCalcFranqueado?: number; // L
  receitaCalcFranqueado?: number;            // J + K + L
}

// Resultado por ano simulado
interface ResultadoAnoSimulado {
  ano: number;
  projCarteira: number;
  projNovasVendas: number;
  subtotal: number;
  despesas: number;
  saldo: number;
  // Dados para detalhamento CARTEIRA (da planilha)
  somaAntecipacaoCarteira: number;    // D
  somaExecucaoCarteira: number;       // E
  somaDemaisReceitasCarteira: number; // F
  somaVVR: number;
  // Dados para detalhamento NOVAS VENDAS (J+K+L da aba FLUXO PROJETADO)
  somaAntecipacaoNovasVendas?: number;    // J - Antecipação de Fee
  somaUltimaParcelaNovasVendas?: number;  // K - Última Parcela Fee
  somaDemaisReceitasNovasVendas?: number; // L - Demais Receitas
  // VVR da aba NOVAS VENDAS - CALCULADORA FRANQUEADO
  vvrCalculadoraFranqueado?: number;
  // Dados calculadora franqueado (J+K+L) - usado quando "DEFINIR PARÂMETROS" está selecionado
  somaAntecipacaoCalcFranqueado?: number;    // J
  somaFechamentoCalcFranqueado?: number;     // K
  somaDemaisReceitasCalcFranqueado?: number; // L
  receitaCalcFranqueado?: number;            // J + K + L
}

interface CalculadoraProjecaoProps {
  anoSelecionado?: number;
  parametrosFranquia?: ParametrosFranquiaCalculadora | null;
  vvrAnual?: number; // VVR total do ano (da aba NOVOS FUNDOS)
  franquia?: string;
  dadosProjecao?: DadosProjecaoAno[]; // Dados reais da planilha por ano
  onRefresh?: () => Promise<void>; // Função para recarregar dados da planilha
}

const formatarMoeda = (valor: number): string => {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
};

// Componente para card de simulação individual
interface CardSimulacaoProps {
  resultado: ResultadoAnoSimulado;
  isFirst: boolean;
  parametros: ParametrosSimulacao;
  parametrosEfetivos: ParametrosAvancados;
  parametrosFranquia?: ParametrosFranquiaCalculadora | null;
}

function CardSimulacao({ resultado, isFirst, parametros, parametrosEfetivos, parametrosFranquia }: CardSimulacaoProps) {
  const [expandidoCarteira, setExpandidoCarteira] = useState(false);
  const [expandidoVendas, setExpandidoVendas] = useState(false);
  const saldoPositivo = resultado.saldo >= 0;

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden
        transition-all duration-300 hover:scale-[1.02]
        ring-2 ring-orange-400/60
      `}
      style={{
        background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)',
      }}
    >
      {/* Badge Simulação */}
      <div className="absolute top-1.5 right-1.5 z-10">
        <div className="px-2 py-0.5 bg-orange-500/80 text-white text-[8px] font-bold rounded-full uppercase tracking-wide">
          Simulação
        </div>
      </div>

      {/* Header com Ano */}
      <div className={`relative px-3 py-2 ${
        isFirst 
          ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
          : 'bg-gradient-to-r from-orange-500/80 to-orange-600/80'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white tracking-wide">
            {resultado.ano}
          </span>
        </div>
        {/* Linha decorativa */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {/* Conteúdo do card */}
      <div className="p-3 space-y-0">
        {/* Proj. Carteira com expansão */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Proj. Receita Carteira</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatarMoeda(resultado.projCarteira)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandidoCarteira(!expandidoCarteira);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-all"
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
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaAntecipacaoCarteira || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ULTIMA PARC FEE</span>
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaExecucaoCarteira || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">DEMAIS RECEITAS</span>
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaDemaisReceitasCarteira || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proj. Novas Vendas com expansão */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex items-center justify-between">
            <div className="flex flex-col flex-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Proj. Receita Novas Vendas</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatarMoeda(resultado.projNovasVendas)}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandidoVendas(!expandidoVendas);
              }}
              className="p-1 hover:bg-gray-700 rounded transition-all"
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
                  <span className="text-gray-500">VVR DO ANO</span>
                  <span className="text-white font-medium">
                    {formatarMoeda(resultado.vvrCalculadoraFranqueado || resultado.somaVVR || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ANTECIPAÇÃO DE FEE</span>
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaAntecipacaoNovasVendas || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">ÚLTIMA PARC. FEE</span>
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaUltimaParcelaNovasVendas || 0)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">DEMAIS RECEITAS</span>
                  <span className="text-orange-400 font-medium">
                    {formatarMoeda(resultado.somaDemaisReceitasNovasVendas || 0)}
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
              {formatarMoeda(resultado.subtotal)}
            </span>
          </div>
        </div>

        {/* Despesas Anual */}
        <div className="py-2 border-b border-gray-700/30">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Despesas Anual</span>
            <span className="text-sm font-semibold text-red-400 tabular-nums">
              {formatarMoeda(resultado.despesas)}
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
            {formatarMoeda(resultado.saldo)}
          </span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CalculadoraProjecao({ anoSelecionado = 2026, parametrosFranquia, vvrAnual = 0, franquia, dadosProjecao = [], onRefresh }: CalculadoraProjecaoProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [usandoParametrosPadrao, setUsandoParametrosPadrao] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [simulacaoVisivel, setSimulacaoVisivel] = useState(false);
  const [parametrosExpandidos, setParametrosExpandidos] = useState(true);
  const [copiandoPadrao, setCopiandoPadrao] = useState(false);
  
  // Estado para VVR por ano da aba NOVAS VENDAS - CALCULADORA FRANQUEADO
  const [vvrPorAno, setVvrPorAno] = useState<{ ano: number; vvr: number }[]>([]);
  
  // Estados de texto para inputs (permite digitação com vírgula)
  const [inputValues, setInputValues] = useState({
    vvr: '',
    despesaAnual: '',
    feeMedioVenda: '',
    margemMediaFinal: '',
    diasParaInicioAntecipacao: '',
    percentualAntecipacao: '',
    nrParcelasAntecipacao: '',
    quebraOrcamentoFinalInicial: '',
    diasBaileUltimaParcela: '',
    tempoMedioFundosCarteira: '',
  });
  
  // Estado dos parâmetros da simulação
  const [parametros, setParametros] = useState<ParametrosSimulacao>({
    vvr: 0,
    tempoMedioFundosCarteira: 0,
    feeMedioVenda: 0,
    margemMediaFinal: 0,
    despesaAnual: 0,
  });

  // Função para buscar VVR da aba NOVAS VENDAS - CALCULADORA FRANQUEADO
  const fetchVvrCalculadora = React.useCallback(async () => {
    if (!franquia) return;
    try {
      const res = await fetch(`/api/fluxo-projetado/vvr-calculadora?franquia=${encodeURIComponent(franquia.toUpperCase())}&refresh=${Date.now()}`);
      const result = await res.json();
      if (result.success && result.data) {
        setVvrPorAno(result.data.map((d: { ano: number; vvr: number }) => ({ ano: d.ano, vvr: d.vvr })));
      }
    } catch (err) {
      console.error('[Calculadora] Erro ao buscar VVR:', err);
    }
  }, [franquia]);

  // Busca VVR quando franquia muda
  React.useEffect(() => {
    fetchVvrCalculadora();
  }, [fetchVvrCalculadora]);

  // Atualiza parâmetros quando "Usar Parâmetros Padrão" está selecionado
  React.useEffect(() => {
    if (usandoParametrosPadrao && parametrosFranquia) {
      setParametros(prev => ({
        ...prev,
        vvr: vvrAnual || prev.vvr,
        tempoMedioFundosCarteira: parametrosFranquia.mesesPermanenciaCarteira || prev.tempoMedioFundosCarteira,
        feeMedioVenda: parametrosFranquia.feePercentual || prev.feeMedioVenda,
        margemMediaFinal: parametrosFranquia.margem || prev.margemMediaFinal,
        // Despesa continua sendo preenchida manualmente
      }));
    }
  }, [usandoParametrosPadrao, parametrosFranquia, vvrAnual]);

  // Estado dos parâmetros avançados (associados à aba PARAMETROS - CALCULADORA FRANQUEADO)
  const [parametrosAvancados, setParametrosAvancados] = useState<ParametrosAvancados>({
    diasParaInicioAntecipacao: 90,
    percentualAntecipacao: 50,
    nrParcelasAntecipacao: 6,
    quebraOrcamentoFinalInicial: 15,
    diasBaileUltimaParcela: 30,
    tempoMedioFundosCarteira: 36.2,
  });

  // Estado de salvamento
  const [salvando, setSalvando] = useState(false);
  
  // Estado para mensagem de status
  const [mensagemStatus, setMensagemStatus] = useState<{ tipo: 'salvando' | 'sucesso' | 'erro'; texto: string } | null>(null);

  // Busca parâmetros da calculadora franqueado quando a franquia muda
  React.useEffect(() => {
    if (franquia) {
      fetch(`/api/fluxo-projetado/parametros-calculadora?franquia=${encodeURIComponent(franquia.toUpperCase())}&refresh=${Date.now()}`)
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data && result.data.length > 0) {
            const params = result.data[0];
            // Carrega parâmetros avançados
            setParametrosAvancados({
              diasParaInicioAntecipacao: params.inicioPgFee || 90,
              percentualAntecipacao: params.percentualAntecipacao || 50,
              nrParcelasAntecipacao: params.nrParcelasAntecipacao || 6,
              quebraOrcamentoFinalInicial: params.quebraOrcamentoFinal || 15,
              diasBaileUltimaParcela: params.diasBaileUltimaParcela || 30,
              tempoMedioFundosCarteira: params.tempoMedioFundosCarteira || 36.2,
            });
            // Carrega valores base da aba PARAMETROS - CALCULADORA FRANQUEADO
            setParametros(prev => ({
              ...prev,
              vvr: params.vvr || prev.vvr,                                    // L - META VVR VENDAS
              tempoMedioFundosCarteira: params.tempoMedioFundosCarteira || prev.tempoMedioFundosCarteira, // J
              feeMedioVenda: params.feePercentual || prev.feeMedioVenda,      // K - FEE (%)
              margemMediaFinal: params.margem || prev.margemMediaFinal,       // I - MARGEM
              despesaAnual: params.despesaAnual || prev.despesaAnual,         // AK - DESPESA ANUAL
            }));
          }
        })
        .catch(err => console.error('[Calculadora] Erro ao buscar parâmetros:', err));
    }
  }, [franquia]);

  // Salva parâmetros na aba PARAMETROS - CALCULADORA FRANQUEADO
  const handleSalvarParametros = async () => {
    if (!franquia) return;
    
    setSalvando(true);
    try {
      const response = await fetch('/api/fluxo-projetado/parametros-calculadora', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franquia: franquia.toUpperCase(),
          // Valores Base
          vvr: parametros.vvr,                                          // L - META VVR VENDAS
          feePercentual: parametros.feeMedioVenda,                      // K - FEE (%)
          margem: parametros.margemMediaFinal,                          // I - MARGEM
          despesaAnual: parametros.despesaAnual,                        // AK - DESPESA ANUAL
          // Parâmetros Avançados
          inicioPgFee: parametrosAvancados.diasParaInicioAntecipacao,   // B - INÍCIO PG FEE
          percentualAntecipacao: parametrosAvancados.percentualAntecipacao, // C - % ANTECIPAÇÃO (D é calculado automaticamente)
          nrParcelasAntecipacao: parametrosAvancados.nrParcelasAntecipacao, // E - Nº PARCELAS ANTECIPAÇÃO
          quebraOrcamentoFinal: parametrosAvancados.quebraOrcamentoFinalInicial, // F - QUEBRA ORÇAMENTO FINAL
          diasBaileUltimaParcela: parametrosAvancados.diasBaileUltimaParcela,    // G - DIAS DO BAILE P/ ULTIMA PARCELA
          tempoMedioFundosCarteira: parametrosAvancados.tempoMedioFundosCarteira, // J - MESES PERMANÊNCIA NA CARTEIRA
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao salvar parâmetros');
      }
      
      console.log('[Calculadora] Parâmetros salvos com sucesso');
    } catch (err) {
      console.error('[Calculadora] Erro ao salvar parâmetros:', err);
    } finally {
      setSalvando(false);
    }
  };

  // Copia parâmetros da aba PARAMETROS PAINEL para PARAMETROS - CALCULADORA FRANQUEADO
  const handleCopiarParametrosPadrao = async () => {
    if (!franquia) return;
    
    setCopiandoPadrao(true);
    try {
      const response = await fetch('/api/fluxo-projetado/copiar-parametros-padrao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franquia: franquia.toUpperCase(),
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao copiar parâmetros');
      }
      
      console.log('[Calculadora] Parâmetros padrão copiados com sucesso');
      
      // Recarrega os parâmetros da calculadora após copiar
      const refreshResponse = await fetch(`/api/fluxo-projetado/parametros-calculadora?franquia=${encodeURIComponent(franquia.toUpperCase())}&refresh=${Date.now()}`);
      const refreshResult = await refreshResponse.json();
      
      if (refreshResult.success && refreshResult.data && refreshResult.data.length > 0) {
        const params = refreshResult.data[0];
        // Atualiza os estados locais com os novos valores
        setParametrosAvancados({
          diasParaInicioAntecipacao: params.inicioPgFee || 90,
          percentualAntecipacao: params.percentualAntecipacao || 50,
          nrParcelasAntecipacao: params.nrParcelasAntecipacao || 6,
          quebraOrcamentoFinalInicial: params.quebraOrcamentoFinal || 15,
          diasBaileUltimaParcela: params.diasBaileUltimaParcela || 30,
          tempoMedioFundosCarteira: params.tempoMedioFundosCarteira || 36.2,
        });
        setParametros(prev => ({
          ...prev,
          tempoMedioFundosCarteira: params.tempoMedioFundosCarteira || prev.tempoMedioFundosCarteira,
          feeMedioVenda: params.feePercentual || prev.feeMedioVenda,
          margemMediaFinal: params.margem || prev.margemMediaFinal,
        }));
      }
      
      alert('Parâmetros padrão aplicados com sucesso!');
    } catch (err) {
      console.error('[Calculadora] Erro ao copiar parâmetros padrão:', err);
      alert('Erro ao copiar parâmetros padrão. Tente novamente.');
    } finally {
      setCopiandoPadrao(false);
    }
  };

  // Parâmetros padrão baseados na franquia
  const parametrosPadrao: ParametrosAvancados = useMemo(() => ({
    diasParaInicioAntecipacao: parametrosFranquia?.diasBaile || 90,
    percentualAntecipacao: parametrosFranquia?.percentualAntecipacao || 50,
    nrParcelasAntecipacao: parametrosFranquia?.numParcelasAntecipacao || 6,
    quebraOrcamentoFinalInicial: parametrosFranquia?.quebraOrcamentoFinal || 15,
    diasBaileUltimaParcela: parametrosFranquia?.diasBaile || 30,
    tempoMedioFundosCarteira: parametrosFranquia?.mesesPermanenciaCarteira || 36.2,
  }), [parametrosFranquia]);

  // Parâmetros efetivos (padrão ou customizados)
  const parametrosEfetivos = usandoParametrosPadrao ? parametrosPadrao : parametrosAvancados;

  // Verifica se algum campo foi preenchido
  const temDadosPreenchidos = useMemo(() => {
    return parametros.vvr > 0 || 
           parametros.tempoMedioFundosCarteira > 0 || 
           parametros.feeMedioVenda > 0 || 
           parametros.margemMediaFinal > 0 ||
           parametros.despesaAnual > 0;
  }, [parametros]);

  // Gera resultados simulados para múltiplos anos (ano atual + 2 anos)
  // PROJ. RECEITA CARTEIRA: SEMPRE usa colunas D+E+F da aba FLUXO PROJETADO
  // PROJ. RECEITA NOVAS VENDAS: SEMPRE usa colunas J+K+L da aba FLUXO PROJETADO
  // VVR DO ANO: Puxa da aba NOVAS VENDAS - CALCULADORA FRANQUEADO (soma da coluna G por ano)
  const resultadosSimulados = useMemo<ResultadoAnoSimulado[]>(() => {
    if (!temDadosPreenchidos) return [];

    const anos: ResultadoAnoSimulado[] = [];
    const anoAtual = new Date().getFullYear();
    
    // Gera projeção para 3 anos (ano atual + 2 anos)
    for (let i = 0; i < 3; i++) {
      const ano = anoAtual + i;
      
      // Busca dados reais da planilha para este ano
      const dadosAno = dadosProjecao.find(d => d.ano === ano);
      
      // VVR DO ANO: Soma da coluna G da aba NOVAS VENDAS - CALCULADORA FRANQUEADO filtrada pelo ano
      const vvrDoAno = vvrPorAno.find(v => v.ano === ano)?.vvr || 0;
      
      // PROJ. RECEITA CARTEIRA - SEMPRE D+E+F (independente do modo)
      const projCarteira = dadosAno?.projCarteira || 0;
      const somaAntecipacaoCarteira = dadosAno?.somaAntecipacaoCarteira || 0;  // D
      const somaExecucaoCarteira = dadosAno?.somaExecucaoCarteira || 0;        // E
      const somaDemaisReceitasCarteira = dadosAno?.somaDemaisReceitasCarteira || 0; // F
      
      // PROJ. RECEITA NOVAS VENDAS - SEMPRE J+K+L da aba FLUXO PROJETADO
      const somaAntecipacaoNovasVendas = dadosAno?.somaAntecipacaoCalcFranqueado || 0;    // J
      const somaUltimaParcelaNovasVendas = dadosAno?.somaFechamentoCalcFranqueado || 0;  // K
      const somaDemaisReceitasNovasVendas = dadosAno?.somaDemaisReceitasCalcFranqueado || 0; // L
      const projNovasVendas = somaAntecipacaoNovasVendas + somaUltimaParcelaNovasVendas + somaDemaisReceitasNovasVendas;
      
      // VVR do ano - da planilha (fallback)
      const somaVVR = dadosAno?.somaVVR || 0;
      
      // Subtotal e Saldo usando despesa informada pelo usuário
      const subtotal = projCarteira + projNovasVendas;
      const despesas = -Math.abs(parametros.despesaAnual);
      const saldo = subtotal + despesas;

      anos.push({
        ano,
        projCarteira,
        projNovasVendas,
        subtotal,
        despesas,
        saldo,
        // Detalhamento Carteira (D+E+F)
        somaAntecipacaoCarteira,
        somaExecucaoCarteira,
        somaDemaisReceitasCarteira,
        somaVVR,
        // Detalhamento Novas Vendas (J+K+L)
        somaAntecipacaoNovasVendas,     // J
        somaUltimaParcelaNovasVendas,   // K
        somaDemaisReceitasNovasVendas,  // L
        // VVR do ano da aba NOVAS VENDAS - CALCULADORA FRANQUEADO
        vvrCalculadoraFranqueado: vvrDoAno,
        // Dados calculadora franqueado
        somaAntecipacaoCalcFranqueado: dadosAno?.somaAntecipacaoCalcFranqueado,
        somaFechamentoCalcFranqueado: dadosAno?.somaFechamentoCalcFranqueado,
        somaDemaisReceitasCalcFranqueado: dadosAno?.somaDemaisReceitasCalcFranqueado,
        receitaCalcFranqueado: dadosAno?.receitaCalcFranqueado,
      });
    }

    return anos;
  }, [parametros, temDadosPreenchidos, dadosProjecao, vvrPorAno]);

  // Limpa os campos
  const handleLimpar = () => {
    setParametros({
      vvr: 0,
      tempoMedioFundosCarteira: 0,
      feeMedioVenda: 0,
      margemMediaFinal: 0,
      despesaAnual: 0,
    });
    // Limpa também os valores de input
    setInputValues({
      vvr: '',
      despesaAnual: '',
      feeMedioVenda: '',
      margemMediaFinal: '',
      diasParaInicioAntecipacao: '',
      percentualAntecipacao: '',
      nrParcelasAntecipacao: '',
      quebraOrcamentoFinalInicial: '',
      diasBaileUltimaParcela: '',
      tempoMedioFundosCarteira: '',
    });
    setSimulacaoVisivel(false);
  };

  // Formata número para exibição com vírgula (padrão brasileiro)
  const formatarParaExibicao = (valor: number): string => {
    if (valor === 0 || valor === null || valor === undefined) return '';
    // Converte para string e troca ponto por vírgula
    return String(valor).replace('.', ',');
  };

  // Formata número para exibição com separador de milhar (padrão brasileiro) - para campos R$
  const formatarMoedaInput = (valor: number): string => {
    if (valor === 0 || valor === null || valor === undefined) return '';
    // Formata com separadores de milhar brasileiro (1.234.567)
    return valor.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  // Remove formatação de moeda e converte para número
  const parseMoedaInput = (valor: string): number => {
    // Remove pontos de milhar e troca vírgula decimal por ponto
    const cleaned = valor.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Atualiza um parâmetro (aceita vírgula ou ponto)
  const handleChange = (campo: keyof ParametrosSimulacao, valor: string) => {
    // Armazena o valor digitado como string (com vírgula)
    setInputValues(prev => ({ ...prev, [campo]: valor }));
    // Converte para número internamente
    const numValue = parseFloat(valor.replace(',', '.')) || 0;
    setParametros(prev => ({ ...prev, [campo]: numValue }));
  };

  // Atualiza parâmetro monetário com formatação de milhar
  const handleChangeMoeda = (campo: keyof ParametrosSimulacao, valor: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const valorLimpo = valor.replace(/[^\d.,]/g, '');
    // Armazena o valor digitado
    setInputValues(prev => ({ ...prev, [campo]: valorLimpo }));
    // Converte para número
    const numValue = parseMoedaInput(valorLimpo);
    setParametros(prev => ({ ...prev, [campo]: numValue }));
  };

  // Atualiza parâmetro avançado (aceita vírgula ou ponto)
  const handleChangeAvancado = (campo: keyof ParametrosAvancados, valor: string) => {
    // Armazena o valor digitado como string (com vírgula)
    setInputValues(prev => ({ ...prev, [campo]: valor }));
    // Converte para número internamente
    const numValue = parseFloat(valor.replace(',', '.')) || 0;
    setParametrosAvancados(prev => ({ ...prev, [campo]: numValue }));
  };
  
  // Obtém o valor do input (prioriza o texto digitado, senão formata o número)
  const getInputValue = (campo: string, valorNumerico: number): string => {
    const valorTexto = inputValues[campo as keyof typeof inputValues];
    if (valorTexto !== undefined && valorTexto !== '') return valorTexto;
    return formatarParaExibicao(valorNumerico);
  };

  // Obtém valor do input para campos monetários com formatação de milhar
  const getInputValueMoeda = (campo: string, valorNumerico: number): string => {
    const valorTexto = inputValues[campo as keyof typeof inputValues];
    if (valorTexto !== undefined && valorTexto !== '') return valorTexto;
    return formatarMoedaInput(valorNumerico);
  };

  return (
    <div className="space-y-4">
      {/* Título da Seção com Botões */}
      <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
          Calculadora - Projetar Caixa
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Botões só aparecem quando expandido */}
          {expandido && (
            <>
              {temDadosPreenchidos && (
                <button
                  onClick={handleLimpar}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors border border-gray-700/50"
                >
                  <RotateCcw size={14} />
                  Limpar
                </button>
              )}
              <button
                onClick={() => setModalAberto(true)}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg shadow-orange-500/30 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/50 hover:scale-105"
              >
                <Calculator size={16} />
                Simular Projeção
              </button>
            </>
          )}
          
          {/* Botão de expandir/colapsar */}
          <button
            onClick={() => setExpandido(!expandido)}
            className={`p-1.5 rounded-lg transition-all ${expandido ? 'bg-orange-500/20' : 'bg-gray-700/50 hover:bg-orange-500/20'}`}
          >
            {expandido ? (
              <ChevronDown size={18} className="text-orange-400" />
            ) : (
              <ChevronRight size={18} className="text-orange-400" />
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo expansível */}
      {expandido && (
        <>
          {/* Cards de Resultado - Estilo igual FluxoAnualCard */}
          {simulacaoVisivel && temDadosPreenchidos ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {resultadosSimulados.map((resultado, index) => (
                <CardSimulacao
                  key={resultado.ano}
                  resultado={resultado}
                  isFirst={index === 0}
                  parametros={parametros}
                  parametrosEfetivos={parametrosEfetivos}
                  parametrosFranquia={parametrosFranquia}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/30 rounded-xl border border-dashed border-gray-700/50 p-8 flex flex-col items-center justify-center text-center">
              <Calculator size={40} className="text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma simulação ativa</p>
              <p className="text-xs text-gray-500 mt-1">Clique em "Parâmetros" para configurar uma simulação</p>
            </div>
          )}
        </>
      )}

      {/* Modal de Parâmetros */}
      {modalAberto && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setModalAberto(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Calculator size={18} className="text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Parâmetros da Simulação</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Configure os valores para projetar</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalAberto(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Aviso de Simulação */}
              <div className="mx-5 mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-2">
                <div className="text-orange-400 text-xs mt-0.5">💾</div>
                <p className="text-xs text-orange-300">
                  <strong>Atenção:</strong> As alterações nos parâmetros serão <strong>salvas na planilha</strong> ao clicar em "Aparecer Simulação".
                </p>
              </div>
              
              {/* Conteúdo do Modal */}
              <div className="p-5 space-y-5">
                {/* Parâmetros Principais */}
                <div className="space-y-4">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wide font-medium flex items-center gap-2">
                    <span className="w-1 h-3 bg-orange-500 rounded-full"></span>
                    Valores Base
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* VVR Novas Vendas */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">VVR Novas Vendas</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-r-0 rounded-l-lg">R$</span>
                        <input
                          type="text"
                          value={getInputValueMoeda('vvr', parametros.vvr)}
                          onChange={(e) => handleChangeMoeda('vvr', e.target.value)}
                          onBlur={() => {
                            // Ao sair do campo, formata com separador de milhar
                            if (parametros.vvr > 0) {
                              setInputValues(prev => ({ ...prev, vvr: formatarMoedaInput(parametros.vvr) }));
                            }
                          }}
                          placeholder="0"
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-r-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>

                    {/* Despesa Anual */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Despesa Anual</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-r-0 rounded-l-lg">R$</span>
                        <input
                          type="text"
                          value={getInputValueMoeda('despesaAnual', parametros.despesaAnual)}
                          onChange={(e) => handleChangeMoeda('despesaAnual', e.target.value)}
                          onBlur={() => {
                            // Ao sair do campo, formata com separador de milhar
                            if (parametros.despesaAnual > 0) {
                              setInputValues(prev => ({ ...prev, despesaAnual: formatarMoedaInput(parametros.despesaAnual) }));
                            }
                          }}
                          placeholder="0"
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-r-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                      </div>
                    </div>

                    {/* Fee Médio de Venda */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Fee Médio de Venda</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={getInputValue('feeMedioVenda', parametros.feeMedioVenda)}
                          onChange={(e) => handleChange('feeMedioVenda', e.target.value)}
                          placeholder=""
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-l-0 rounded-r-lg">%</span>
                      </div>
                    </div>

                    {/* Margem Média Final */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Margem Média Final</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={getInputValue('margemMediaFinal', parametros.margemMediaFinal)}
                          onChange={(e) => handleChange('margemMediaFinal', e.target.value)}
                          placeholder=""
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-l-0 rounded-r-lg">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-gray-700/50" />

                {/* Seleção de Modo: Parâmetros Padrão ou Definir Parâmetros */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Botão Utilizar Parâmetros Padrão - apenas ação, não fica selecionado */}
                    <button
                      onClick={async () => {
                        // Executa a cópia dos parâmetros padrão
                        await handleCopiarParametrosPadrao();
                        // Mantém "Definir Parâmetros" selecionado
                        setUsandoParametrosPadrao(false);
                        setParametrosExpandidos(true);
                      }}
                      disabled={copiandoPadrao}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border transition-all bg-gray-900/30 border-gray-700/50 text-gray-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 disabled:opacity-50"
                    >
                      {copiandoPadrao ? (
                        <RotateCcw size={14} className="animate-spin" />
                      ) : null}
                      <span className="text-xs uppercase tracking-wide font-medium">
                        {copiandoPadrao ? 'Aplicando...' : 'Utilizar Parâmetros Padrão'}
                      </span>
                    </button>

                    {/* Botão Definir Parâmetros para Calculadora - sempre selecionado */}
                    <button
                      onClick={() => {
                        setParametrosExpandidos(!parametrosExpandidos);
                      }}
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border transition-all bg-orange-500/20 border-orange-500/50 text-orange-400"
                    >
                      <Check size={14} />
                      <span className="text-xs uppercase tracking-wide font-medium">Definir Parâmetros para Calculadora</span>
                    </button>
                  </div>

                  {/* Campos de Parâmetros - aparecem quando expandidos */}
                  {parametrosExpandidos && (
                  <div className="grid grid-cols-2 gap-4 pt-2 p-4 bg-gray-900/30 rounded-lg border border-gray-700/30">
                    {/* Dias para Início Antecipação */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Dias para Início Antecipação</label>
                      <input
                        type="text"
                        value={getInputValue('diasParaInicioAntecipacao', parametrosAvancados.diasParaInicioAntecipacao)}
                        onChange={(e) => handleChangeAvancado('diasParaInicioAntecipacao', e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                    
                    {/* Percentual Antecipação */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Percentual Antecipação</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={getInputValue('percentualAntecipacao', parametrosAvancados.percentualAntecipacao)}
                          onChange={(e) => handleChangeAvancado('percentualAntecipacao', e.target.value)}
                          placeholder=""
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-l-0 rounded-r-lg">%</span>
                      </div>
                    </div>
                    
                    {/* Nr Parcelas Antecipação */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Nr Parcelas Antecipação</label>
                      <input
                        type="text"
                        value={getInputValue('nrParcelasAntecipacao', parametrosAvancados.nrParcelasAntecipacao)}
                        onChange={(e) => handleChangeAvancado('nrParcelasAntecipacao', e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                    
                    {/* Quebra Orçamento Final/Inicial */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Quebra Orçamento Final/Inicial</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={getInputValue('quebraOrcamentoFinalInicial', parametrosAvancados.quebraOrcamentoFinalInicial)}
                          onChange={(e) => handleChangeAvancado('quebraOrcamentoFinalInicial', e.target.value)}
                          placeholder=""
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-l-0 rounded-r-lg">%</span>
                      </div>
                    </div>
                    
                    {/* Dias do Baile para Pagamento Última Parcela */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Dias do Baile p/ Pag. Última Parcela</label>
                      <input
                        type="text"
                        value={getInputValue('diasBaileUltimaParcela', parametrosAvancados.diasBaileUltimaParcela)}
                        onChange={(e) => handleChangeAvancado('diasBaileUltimaParcela', e.target.value)}
                        placeholder=""
                        className="w-full px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>
                    
                    {/* Tempo Médio Fundos Fica na Carteira */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Tempo Médio Fundos Fica na Carteira</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={getInputValue('tempoMedioFundosCarteira', parametrosAvancados.tempoMedioFundosCarteira)}
                          onChange={(e) => handleChangeAvancado('tempoMedioFundosCarteira', e.target.value)}
                          placeholder=""
                          className="flex-1 px-3 py-2.5 text-sm bg-gray-900/50 border border-gray-600/50 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                        />
                        <span className="text-gray-500 text-sm px-3 py-2.5 bg-gray-900/50 border border-gray-600/50 border-l-0 rounded-r-lg">meses</span>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>

              {/* Footer do Modal */}
              <div className="flex flex-col gap-3 px-5 py-4 border-t border-gray-700 sticky bottom-0 bg-gray-800">
                {/* Mensagem de Status */}
                {mensagemStatus && (
                  <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium ${
                    mensagemStatus.tipo === 'salvando' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                      : mensagemStatus.tipo === 'sucesso'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {mensagemStatus.tipo === 'salvando' && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {mensagemStatus.tipo === 'sucesso' && (
                      <Check size={16} />
                    )}
                    {mensagemStatus.texto}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLimpar}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <RotateCcw size={14} />
                      Limpar
                    </button>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        // Mostra mensagem de salvando
                        setMensagemStatus({ tipo: 'salvando', texto: 'Salvando parâmetros na planilha...' });
                        
                        // Sempre salva os parâmetros personalizados (Definir Parâmetros está sempre selecionado)
                        await handleSalvarParametros();
                        
                        // Atualiza mensagem
                        setMensagemStatus({ tipo: 'salvando', texto: 'Aguardando recálculo da planilha...' });
                        
                        // Delay para permitir que as fórmulas da planilha recalculem
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // Atualiza mensagem
                        setMensagemStatus({ tipo: 'salvando', texto: 'Carregando dados atualizados...' });
                        
                        // Recarrega os dados da planilha (sem perder os valores preenchidos)
                        if (onRefresh) {
                          await onRefresh();
                        }
                        
                        // Recarrega o VVR da calculadora
                        await fetchVvrCalculadora();
                        
                        // Mostra mensagem de sucesso
                        setMensagemStatus({ tipo: 'sucesso', texto: 'Parâmetros salvos com sucesso!' });
                        
                        // Aguarda 1.5s para mostrar mensagem de sucesso
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        
                        setMensagemStatus(null);
                        setSimulacaoVisivel(true);
                        setModalAberto(false);
                      } catch (error) {
                        setMensagemStatus({ tipo: 'erro', texto: 'Erro ao salvar. Tente novamente.' });
                        setTimeout(() => setMensagemStatus(null), 3000);
                      }
                    }}
                    disabled={salvando || copiandoPadrao || mensagemStatus?.tipo === 'salvando'}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {mensagemStatus?.tipo === 'salvando' ? 'Processando...' : 'Aparecer Simulação'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CalculadoraProjecao;
