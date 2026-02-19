'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Save, AlertCircle } from 'lucide-react';

// Tipos para o formulário
interface KpiFormData {
  nome: string;
  inicioMes: string;
  inicioAno: string;
  terminoMes: string;
  terminoAno: string;
  tendencia: 'MAIOR, MELHOR' | 'MENOR, MELHOR' | '';
  grandeza: 'Moeda' | '%' | 'Número inteiro' | '';
  metas: Record<string, string>;
}

interface KpiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: KpiFormData) => Promise<void>;
  accentColor?: string;
  selectedTeam: string;
}

// Obter mês atual (formato '01', '02', etc)
const getMesAtual = (): string => {
  return (new Date().getMonth() + 1).toString().padStart(2, '0');
};

// Lista de meses
const MESES = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

// Formato curto dos meses para exibição
const MESES_CURTO: Record<string, string> = {
  '01': 'jan',
  '02': 'fev',
  '03': 'mar',
  '04': 'abr',
  '05': 'mai',
  '06': 'jun',
  '07': 'jul',
  '08': 'ago',
  '09': 'set',
  '10': 'out',
  '11': 'nov',
  '12': 'dez',
};

// Gerar lista de anos (2 anos anteriores até 10 anos à frente)
const gerarAnos = (): string[] => {
  const anoAtual = new Date().getFullYear();
  const anos: string[] = [];
  for (let i = -2; i <= 10; i++) {
    anos.push((anoAtual + i).toString());
  }
  return anos;
};

export const KpiFormModal: React.FC<KpiFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  accentColor = '#ff6600',
  selectedTeam,
}) => {
  const [formData, setFormData] = useState<KpiFormData>({
    nome: '',
    inicioMes: getMesAtual(),
    inicioAno: new Date().getFullYear().toString(),
    terminoMes: '12',
    terminoAno: new Date().getFullYear().toString(),
    tendencia: '',
    grandeza: '',
    metas: {},
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metasFilter, setMetasFilter] = useState<{ anoFiltro: string }>({ anoFiltro: new Date().getFullYear().toString() });

  const anos = useMemo(() => gerarAnos(), []);

  // Limpar formulário quando o modal for fechado
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        nome: '',
        inicioMes: getMesAtual(),
        inicioAno: new Date().getFullYear().toString(),
        terminoMes: '12',
        terminoAno: new Date().getFullYear().toString(),
        tendencia: '',
        grandeza: '',
        metas: {},
      });
      setError(null);
      setMetasFilter({ anoFiltro: new Date().getFullYear().toString() });
    }
  }, [isOpen]);

  // Filtrar meses disponíveis - todos os meses disponíveis para qualquer ano
  const mesesDisponiveis = useMemo(() => {
    // Todos os meses disponíveis para seleção
    return MESES;
  }, [formData.inicioAno]);

  // Meses disponíveis para término (baseado no início selecionado)
  const mesesTerminoDisponiveis = useMemo(() => {
    // Se mesmo ano do início, mostrar apenas meses >= mês de início
    if (formData.terminoAno === formData.inicioAno) {
      const inicioMes = parseInt(formData.inicioMes);
      return MESES.filter((m) => parseInt(m.value) >= inicioMes);
    }
    return MESES;
  }, [formData.inicioAno, formData.inicioMes, formData.terminoAno]);

  // Anos disponíveis para término (>= ano de início)
  const anosTerminoDisponiveis = useMemo(() => {
    const inicioAno = parseInt(formData.inicioAno);
    return anos.filter((ano) => parseInt(ano) >= inicioAno);
  }, [anos, formData.inicioAno]);

  // Ajustar término quando início mudar (garantir consistência)
  useEffect(() => {
    const inicioAno = parseInt(formData.inicioAno);
    const terminoAno = parseInt(formData.terminoAno);
    const inicioMes = parseInt(formData.inicioMes);
    const terminoMes = parseInt(formData.terminoMes);
    
    // Se término ficar antes do início, ajustar
    if (terminoAno < inicioAno || (terminoAno === inicioAno && terminoMes < inicioMes)) {
      setFormData((prev) => ({ 
        ...prev, 
        terminoAno: formData.inicioAno, 
        terminoMes: '12' 
      }));
    }
  }, [formData.inicioAno, formData.inicioMes]);

  // Gerar lista de meses para as metas baseado no início e término
  const mesesMetas = useMemo(() => {
    if (!formData.inicioMes || !formData.inicioAno || !formData.terminoMes || !formData.terminoAno) {
      return [];
    }

    const meses: { mes: string; ano: string; label: string }[] = [];
    
    const inicioAno = parseInt(formData.inicioAno);
    const terminoAno = parseInt(formData.terminoAno);
    const inicioMes = parseInt(formData.inicioMes);
    const terminoMes = parseInt(formData.terminoMes);
    
    // Validação: término não pode ser antes do início
    if (terminoAno < inicioAno || (terminoAno === inicioAno && terminoMes < inicioMes)) {
      return [];
    }

    for (let ano = inicioAno; ano <= terminoAno; ano++) {
      const mesInicio = ano === inicioAno ? inicioMes : 1;
      const mesFim = ano === terminoAno ? terminoMes : 12;
      
      for (let mes = mesInicio; mes <= mesFim; mes++) {
        const mesStr = mes.toString().padStart(2, '0');
        const anoStr = ano.toString().slice(-2);
        meses.push({
          mes: mesStr,
          ano: ano.toString(),
          label: `${MESES_CURTO[mesStr]}/${anoStr}`,
        });
      }
    }

    return meses;
  }, [formData.inicioMes, formData.inicioAno, formData.terminoMes, formData.terminoAno]);

  // Anos disponíveis para filtro das metas (limitado até ano atual + 1)
  const anosParaFiltro = useMemo(() => {
    const anoLimite = new Date().getFullYear() + 1; // Ano seguinte ao atual
    const anosUnicos = new Set(mesesMetas.map((m) => m.ano));
    return Array.from(anosUnicos)
      .filter((ano) => parseInt(ano) <= anoLimite)
      .sort();
  }, [mesesMetas]);

  // Meses filtrados para exibição
  const mesesMetasFiltrados = useMemo(() => {
    // Se o filtro está vazio ou o ano filtrado não está nos anos disponíveis, mostrar primeiro ano
    if (!metasFilter.anoFiltro || !anosParaFiltro.includes(metasFilter.anoFiltro)) {
      // Mostrar meses do primeiro ano disponível
      if (anosParaFiltro.length > 0) {
        return mesesMetas.filter((m) => m.ano === anosParaFiltro[0]);
      }
      return mesesMetas;
    }
    return mesesMetas.filter((m) => m.ano === metasFilter.anoFiltro);
  }, [mesesMetas, metasFilter.anoFiltro, anosParaFiltro]);

  // Ajustar filtro de ano quando os anos disponíveis mudarem
  useEffect(() => {
    if (anosParaFiltro.length > 0 && !anosParaFiltro.includes(metasFilter.anoFiltro)) {
      // Priorizar ano atual se disponível, senão primeiro ano
      const anoAtual = new Date().getFullYear().toString();
      if (anosParaFiltro.includes(anoAtual)) {
        setMetasFilter({ anoFiltro: anoAtual });
      } else {
        setMetasFilter({ anoFiltro: anosParaFiltro[0] });
      }
    }
  }, [anosParaFiltro]);

  // Atualizar metas quando os meses mudarem
  useEffect(() => {
    const novasMetas: Record<string, string> = {};
    mesesMetas.forEach(({ mes, ano }) => {
      const key = `${mes}/${ano}`;
      novasMetas[key] = formData.metas[key] || '';
    });
    setFormData((prev) => ({ ...prev, metas: novasMetas }));
  }, [mesesMetas.length]);

  // Handler para mudança nos campos
  const handleChange = (field: keyof KpiFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handler para mudança nas metas
  const handleMetaChange = (key: string, value: string) => {
    // Permitir apenas números e ponto/vírgula para decimais
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setFormData((prev) => ({
      ...prev,
      metas: { ...prev.metas, [key]: cleanValue },
    }));
    setError(null);
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      setError('Por favor, informe o nome do KPI.');
      return false;
    }
    if (!formData.inicioMes) {
      setError('Por favor, selecione o mês de início do KPI.');
      return false;
    }
    if (!formData.tendencia) {
      setError('Por favor, selecione a tendência do KPI.');
      return false;
    }
    if (!formData.grandeza) {
      setError('Por favor, selecione a grandeza do KPI.');
      return false;
    }
    
    // Verificar se pelo menos uma meta foi preenchida
    const metasPreenchidas = Object.values(formData.metas).filter((v) => v.trim() !== '');
    if (metasPreenchidas.length === 0) {
      setError('Por favor, preencha pelo menos uma meta.');
      return false;
    }

    return true;
  };

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      // Limpar formulário após sucesso
      setFormData({
        nome: '',
        inicioMes: getMesAtual(),
        inicioAno: new Date().getFullYear().toString(),
        terminoMes: '12',
        terminoAno: new Date().getFullYear().toString(),
        tendencia: '',
        grandeza: '',
        metas: {},
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar KPI. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-dark-secondary rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700"
        style={{ borderTop: `4px solid ${accentColor}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Plus size={24} style={{ color: accentColor }} />
            <h2 className="text-xl font-semibold text-white">Criar Novo KPI</h2>
            {selectedTeam && (
              <span 
                className="text-sm px-3 py-1 rounded-full"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                {selectedTeam}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Erro */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Nome do KPI */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome do KPI <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Taxa de Conversão, Faturamento Mensal..."
              className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Período - Início e Término */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Início do KPI <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.inicioMes}
                  onChange={(e) => handleChange('inicioMes', e.target.value)}
                  className="flex-1 px-3 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Mês</option>
                  {mesesDisponiveis.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.inicioAno}
                  onChange={(e) => handleChange('inicioAno', e.target.value)}
                  className="w-24 px-3 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
                >
                  {anos.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Término do KPI <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.terminoMes}
                  onChange={(e) => handleChange('terminoMes', e.target.value)}
                  className="flex-1 px-3 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Mês</option>
                  {mesesTerminoDisponiveis.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.terminoAno}
                  onChange={(e) => handleChange('terminoAno', e.target.value)}
                  className="w-24 px-3 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
                >
                  {anosTerminoDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tendência e Grandeza */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tendência <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.tendencia}
                onChange={(e) => handleChange('tendencia', e.target.value as KpiFormData['tendencia'])}
                className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione...</option>
                <option value="MAIOR, MELHOR">MAIOR, MELHOR</option>
                <option value="MENOR, MELHOR">MENOR, MELHOR</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Define se valores maiores ou menores são melhores
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grandeza <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.grandeza}
                onChange={(e) => handleChange('grandeza', e.target.value as KpiFormData['grandeza'])}
                className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione...</option>
                <option value="Moeda">Moeda (R$)</option>
                <option value="%">Percentual (%)</option>
                <option value="Número inteiro">Número inteiro</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Formato de exibição dos valores
              </p>
            </div>
          </div>

          {/* Metas por mês */}
          {mesesMetas.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  Metas Mensais <span className="text-red-400">*</span>
                  <span className="text-xs text-gray-500 ml-2">({mesesMetas.length} meses)</span>
                </label>
                {anosParaFiltro.length > 1 && (
                  <select
                    value={metasFilter.anoFiltro || anosParaFiltro[0]}
                    onChange={(e) => setMetasFilter({ anoFiltro: e.target.value })}
                    className="px-3 py-1.5 rounded-lg bg-dark-primary border border-gray-600 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {anosParaFiltro.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {mesesMetasFiltrados.map(({ mes, ano, label }) => {
                  const key = `${mes}/${ano}`;
                  return (
                    <div key={key}>
                      <label className="block text-xs text-gray-400 mb-1 text-center">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={formData.metas[key] || ''}
                        onChange={(e) => handleMetaChange(key, e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 rounded-lg bg-dark-primary border border-gray-600 text-white text-center text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.grandeza === 'Moeda' && 'Informe os valores em reais (ex: 10000)'}
                {formData.grandeza === '%' && 'Informe os valores em porcentagem (ex: 85)'}
                {formData.grandeza === 'Número inteiro' && 'Informe valores inteiros (ex: 100)'}
              </p>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mesesMetas.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Criar KPI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiFormModal;
