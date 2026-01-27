/**
 * Tabela de Parâmetros por Franquia
 * Exibe e permite edição dos parâmetros de cada franquia
 * Dados vem da planilha Google Sheets (aba PARAMETROS)
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

// Interface para os parâmetros de cada franquia
export interface ParametrosFranquia {
  franquia: string;
  inicioPgFee: number;
  percentualAntecipacao: number;
  percentualFechamento: number;
  numParcelasAntecipacao: number;
  quebraOrcamentoFinal: number;
  diasBaileAnteciparUltimaParcela: number;
  demaisReceitas: number;
  margem: number;
  mesesPermanenciaCarteira: number;
  feePercentual: number;
}

interface TabelaParametrosProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (dados: ParametrosFranquia[]) => void;
}

export default function TabelaParametros({ isOpen, onClose, onSave }: TabelaParametrosProps) {
  const [dados, setDados] = useState<ParametrosFranquia[]>([]);
  const [dadosOriginais, setDadosOriginais] = useState<ParametrosFranquia[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);
  
  // Estado para armazenar valores de texto enquanto o usuário digita (permite vírgula)
  const [valoresEdicao, setValoresEdicao] = useState<Record<string, string>>({});

  // Buscar parâmetros da API (sempre busca dados frescos, sem cache)
  const fetchParametros = async () => {
    setLoading(true);
    setError(null);

    try {
      // Adiciona timestamp para forçar busca sem cache
      const response = await fetch(`/api/fluxo-projetado/parametros?refresh=${Date.now()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar parâmetros');
      }

      setDados(result.data);
      setDadosOriginais(result.data);
      setAlteracoesPendentes(false);
      setValoresEdicao({}); // Limpa valores de edição ao carregar dados
    } catch (err) {
      console.error('[TabelaParametros] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar parâmetros');
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      fetchParametros();
    }
  }, [isOpen]);

  // Colunas da tabela - campos percentuais devem ter suffix '%'
  const colunas = [
    { key: 'inicioPgFee', label: 'INÍCIO PG FEE', suffix: '', isPercentual: false },
    { key: 'percentualAntecipacao', label: '% ANTECIPAÇÃO', suffix: '%', isPercentual: true },
    { key: 'percentualFechamento', label: '% FECHAMENTO', suffix: '%', isPercentual: true },
    { key: 'numParcelasAntecipacao', label: 'Nº PARCELAS ANTECIPAÇÃO', suffix: '', isPercentual: false },
    { key: 'quebraOrcamentoFinal', label: 'QUEBRA ORÇ. FINAL', suffix: '%', isPercentual: true },
    { key: 'diasBaileAnteciparUltimaParcela', label: 'DIAS BAILE', suffix: '', isPercentual: false },
    { key: 'demaisReceitas', label: 'DEMAIS RECEITAS', suffix: '%', isPercentual: true },
    { key: 'margem', label: 'MARGEM', suffix: '%', isPercentual: true },
    { key: 'mesesPermanenciaCarteira', label: 'MESES PERMANÊNCIA CARTEIRA', suffix: '', isPercentual: false },
    { key: 'feePercentual', label: 'FEE (%)', suffix: '%', isPercentual: true },
  ];

  // Formata número para exibição com vírgula como separador decimal
  const formatarNumero = (valor: number): string => {
    if (valor === 0) return '0';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Parseia valor digitado (aceita vírgula como decimal)
  const parsearValor = (valor: string): number => {
    const limpo = valor.replace(/\./g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
  };

  // Gera chave única para o estado de edição
  const getEditKey = (rowIndex: number, campo: string): string => {
    return `${rowIndex}-${campo}`;
  };

  // Obtém valor para exibição no input (prioriza texto digitado, senão formata o número)
  const getDisplayValue = (rowIndex: number, campo: string, valorNumerico: number): string => {
    const key = getEditKey(rowIndex, campo);
    if (valoresEdicao[key] !== undefined) {
      return valoresEdicao[key];
    }
    return formatarNumero(valorNumerico);
  };

  const handleChange = (index: number, campo: keyof ParametrosFranquia, valor: string) => {
    // Armazena o valor digitado como texto (preserva vírgula)
    const key = getEditKey(index, campo);
    setValoresEdicao(prev => ({ ...prev, [key]: valor }));
    
    // Atualiza o valor numérico nos dados
    const novosDados = [...dados];
    if (campo === 'franquia') {
      novosDados[index][campo] = valor;
    } else {
      novosDados[index][campo] = parsearValor(valor);
    }
    setDados(novosDados);
    setAlteracoesPendentes(true);
  };

  // Limpa o valor de edição quando o input perde o foco (formata o número)
  const handleBlur = (index: number, campo: string) => {
    const key = getEditKey(index, campo);
    setValoresEdicao(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const handleSave = async () => {
    setSalvando(true);
    setError(null);

    try {
      const response = await fetch('/api/fluxo-projetado/parametros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parametros: dados }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar parâmetros');
      }

      setDadosOriginais(dados);
      setAlteracoesPendentes(false);
      
      if (onSave) {
        onSave(dados);
      }
    } catch (err) {
      console.error('[TabelaParametros] Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setDados(dadosOriginais);
    setAlteracoesPendentes(false);
    setValoresEdicao({}); // Limpa valores de edição ao cancelar
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1c23] rounded-xl border border-gray-700 shadow-2xl w-full max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Parâmetros por Franquia</h2>
            <p className="text-xs text-gray-400">Configure os valores de projeção para cada franquia • Dados da planilha Google Sheets</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchParametros}
              disabled={loading}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Recarregar dados"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <span className="text-gray-400 text-sm">Carregando parâmetros da planilha...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
              <button 
                onClick={fetchParametros}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabela - Estilo escuro com franquias na coluna da esquerda */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse" style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
                <thead>
                  <tr className="bg-gray-800/80 border-b border-gray-700">
                    {/* Coluna Franquia - fixa à esquerda */}
                    <th className="sticky left-0 z-10 bg-gray-800 px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide border-r border-gray-700/50 min-w-[180px]">
                      Franquia
                    </th>
                    {/* Colunas de parâmetros */}
                    {colunas.map((col) => (
                      <th 
                        key={col.key} 
                        className="px-3 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap min-w-[110px]"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.map((franquia, rowIndex) => (
                    <tr 
                      key={franquia.franquia} 
                      className={`border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors ${
                        rowIndex % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-900/10'
                      }`}
                    >
                      {/* Nome da Franquia - fixo à esquerda */}
                      <td className="sticky left-0 z-10 px-4 py-3 text-sm font-bold text-white border-r border-gray-700/50" 
                          style={{ background: rowIndex % 2 === 0 ? '#1a1c23' : '#1e2028' }}>
                        {franquia.franquia}
                      </td>
                      
                      {/* Campos editáveis */}
                      {colunas.map((col) => (
                        <td key={col.key} className="px-2 py-2">
                          <div className="flex items-center justify-center">
                            <input
                              type="text"
                              value={getDisplayValue(rowIndex, col.key, franquia[col.key as keyof ParametrosFranquia] as number)}
                              onChange={(e) => handleChange(rowIndex, col.key as keyof ParametrosFranquia, e.target.value)}
                              onBlur={() => handleBlur(rowIndex, col.key)}
                              className={`px-2 py-2 text-sm text-center bg-gray-800/60 border border-gray-600/40 rounded text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 hover:bg-gray-700/50 transition-colors ${col.suffix ? 'w-[70%] rounded-r-none border-r-0' : 'w-full'}`}
                            />
                            {col.suffix && (
                              <span className="px-2 py-2 text-sm text-gray-400 bg-gray-700/60 border border-gray-600/40 border-l-0 rounded-r">
                                {col.suffix}
                              </span>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer do Modal */}
            <div className="flex items-center justify-between p-4 border-t border-gray-700 bg-gray-800/50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {dados.length} franquias
                </span>
                {alteracoesPendentes && (
                  <span className="text-orange-400 text-sm flex items-center gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                    Alterações pendentes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {alteracoesPendentes && (
                  <button
                    onClick={handleCancelar}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={salvando || !alteracoesPendentes}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    alteracoesPendentes 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {salvando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar na Planilha
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
