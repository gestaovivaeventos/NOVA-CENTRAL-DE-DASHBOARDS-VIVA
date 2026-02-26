/**
 * Modal de Parâmetros da Franquia
 * Permite edição dos parâmetros editáveis da franquia selecionada
 * Os dados são salvos na aba PARAMETROS PAINEL da planilha
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Check } from 'lucide-react';

// Interface para os parâmetros editáveis da franquia
export interface ParametrosEditaveis {
  franquia: string;
  inicioPgFee: number;                    // B - INÍCIO PG FEE
  percentualAntecipacao: number;          // C - % ANTECIPAÇÃO
  percentualFechamento: number;           // D - % FECHAMENTO
  numParcelasAntecipacao: number;         // E - Nº PARCELAS ANTECIPAÇÃO
  quebraOrcamentoFinal: number;           // F - DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE
  diasBaileAnteciparUltimaParcela: number;// G - DEMAIS RECEITAS
  demaisReceitas: number;                 // H - MARGEM
  margem: number;                         // I - MESES PERMANENCIA NA CARTEIRA
  mesesPermanenciaCarteira: number;       // J - FEE (%)
  feePercentual: number;                  // K - META VVR VENDAS
}

interface ModalParametrosFranquiaProps {
  isOpen: boolean;
  onClose: () => void;
  franquiaSelecionada: string;
  onSaved?: () => void;
}

export default function ModalParametrosFranquia({ 
  isOpen, 
  onClose, 
  franquiaSelecionada,
  onSaved 
}: ModalParametrosFranquiaProps) {
  const [parametros, setParametros] = useState<ParametrosEditaveis | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Buscar parâmetros da franquia
  const fetchParametros = async () => {
    setLoading(true);
    setError(null);
    setSucesso(false);

    try {
      const response = await fetch(`/api/fluxo-projetado/parametros?refresh=${Date.now()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar parâmetros');
      }

      // Encontra os parâmetros da franquia selecionada
      const params = result.data.find((p: any) => 
        p.franquia.toUpperCase() === franquiaSelecionada.toUpperCase()
      );

      if (params) {
        setParametros(params);
      } else {
        // Se não encontrar, cria um objeto vazio
        setParametros({
          franquia: franquiaSelecionada.toUpperCase(),
          inicioPgFee: 0,
          percentualAntecipacao: 0,
          percentualFechamento: 0,
          numParcelasAntecipacao: 0,
          quebraOrcamentoFinal: 0,
          diasBaileAnteciparUltimaParcela: 0,
          demaisReceitas: 0,
          margem: 0,
          mesesPermanenciaCarteira: 0,
          feePercentual: 0,
        });
      }
    } catch (err) {
      console.error('[ModalParametrosFranquia] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar parâmetros');
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados quando o modal abre ou franquia muda
  useEffect(() => {
    if (isOpen && franquiaSelecionada) {
      fetchParametros();
    }
  }, [isOpen, franquiaSelecionada]);

  // Atualiza um campo
  const handleChange = (campo: keyof ParametrosEditaveis, valor: string) => {
    if (!parametros) return;
    
    setParametros({
      ...parametros,
      [campo]: campo === 'franquia' ? valor : (parseFloat(valor.replace(',', '.')) || 0)
    });
  };

  // Salva os parâmetros
  const handleSave = async () => {
    if (!parametros) return;
    
    setSalvando(true);
    setError(null);
    setSucesso(false);

    try {
      const response = await fetch('/api/fluxo-projetado/parametros', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          franquia: parametros.franquia,
          parametros 
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao salvar parâmetros');
      }

      setSucesso(true);
      
      // Callback para atualizar dados no componente pai
      if (onSaved) {
        onSaved();
      }

      // Fecha o modal após 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[ModalParametrosFranquia] Erro ao salvar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1c23] rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-white">Parâmetros da Franquia</h2>
            <p className="text-xs text-gray-400">
              Editando: <span className="text-orange-400 font-medium">{franquiaSelecionada.toUpperCase()}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <span className="ml-3 text-gray-400">Carregando parâmetros...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={fetchParametros}
                className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : sucesso ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-green-400 text-lg font-medium">Parâmetros salvos com sucesso!</p>
            </div>
          ) : parametros ? (
            <div className="grid grid-cols-2 gap-4">
              {/* B - INÍCIO PG FEE */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Início PG FEE (Dias Após Venc. 1º Boleto)
                </label>
                <input
                  type="text"
                  value={parametros.inicioPgFee || ''}
                  onChange={(e) => handleChange('inicioPgFee', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>

              {/* C - % ANTECIPAÇÃO DO FEE */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  % Antecipação do FEE
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.percentualAntecipacao || ''}
                    onChange={(e) => handleChange('percentualAntecipacao', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>

              {/* D - % FECHAMENTO DO FEE */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  % Fechamento do FEE
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.percentualFechamento || ''}
                    onChange={(e) => handleChange('percentualFechamento', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>

              {/* E - Nº PARCELAS ANTECIPAÇÃO */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Nº Parcelas Antecipação
                </label>
                <input
                  type="text"
                  value={parametros.numParcelasAntecipacao || ''}
                  onChange={(e) => handleChange('numParcelasAntecipacao', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>

              {/* F - QUEBRA ORÇAMENTO FINAL / MAF INICIAL */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Quebra Orçamento Final / MAF Inicial
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.quebraOrcamentoFinal || ''}
                    onChange={(e) => handleChange('quebraOrcamentoFinal', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>

              {/* G - DIAS DO BAILE P/ ANTECIPAR ULTIMA PARCELA DO FEE */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Dias do Baile P/ Antecipar Última Parcela do FEE
                </label>
                <input
                  type="text"
                  value={parametros.diasBaileAnteciparUltimaParcela || ''}
                  onChange={(e) => handleChange('diasBaileAnteciparUltimaParcela', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>

              {/* H - DEMAIS RECEITAS */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Demais Receitas
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.demaisReceitas || ''}
                    onChange={(e) => handleChange('demaisReceitas', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>

              {/* I - MARGEM */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Margem
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.margem || ''}
                    onChange={(e) => handleChange('margem', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>

              {/* J - MESES PERMANENCIA NA CARTEIRA */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  Meses Permanência na Carteira
                </label>
                <input
                  type="text"
                  value={parametros.mesesPermanenciaCarteira || ''}
                  onChange={(e) => handleChange('mesesPermanenciaCarteira', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>

              {/* K - FEE (%) */}
              <div className="space-y-1">
                <label className="text-xs text-gray-400 uppercase tracking-wide">
                  FEE (%)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={parametros.feePercentual || ''}
                    onChange={(e) => handleChange('feePercentual', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                  <span className="text-gray-500 text-sm px-3 py-2 bg-gray-700 border border-gray-600 border-l-0 rounded-r-lg">%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && !sucesso && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={salvando}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar na Planilha
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
