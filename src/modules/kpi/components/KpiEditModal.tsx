'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Save, AlertCircle, Pencil } from 'lucide-react';
import { KpiData } from '../types';

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
  '01': 'jan', '02': 'fev', '03': 'mar', '04': 'abr',
  '05': 'mai', '06': 'jun', '07': 'jul', '08': 'ago',
  '09': 'set', '10': 'out', '11': 'nov', '12': 'dez',
};

interface KpiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  kpiData: KpiData[];
  kpiName: string;
  accentColor?: string;
  selectedTeam: string;
  username?: string;
}

export const KpiEditModal: React.FC<KpiEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  kpiData,
  kpiName,
  accentColor = '#ff6600',
  selectedTeam,
  username = '',
}) => {
  const [nome, setNome] = useState(kpiName);
  const [tendencia, setTendencia] = useState<'MAIOR, MELHOR' | 'MENOR, MELHOR' | ''>('');
  const [grandeza, setGrandeza] = useState<'Moeda' | '%' | 'Número inteiro' | ''>('');
  const [metas, setMetas] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extrair dados do KPI existente
  useEffect(() => {
    if (kpiData.length > 0 && isOpen) {
      const first = kpiData[0];
      
      // Nome
      setNome(kpiName);
      
      // Tendência
      const tend = first.tendencia?.toUpperCase() || '';
      if (tend.includes('MENOR')) {
        setTendencia('MENOR, MELHOR');
      } else {
        setTendencia('MAIOR, MELHOR');
      }
      
      // Grandeza
      const grand = first.grandeza?.toLowerCase() || '';
      if (grand.includes('moeda') || grand.includes('r$')) {
        setGrandeza('Moeda');
      } else if (grand.includes('%') || grand.includes('percent')) {
        setGrandeza('%');
      } else {
        setGrandeza('Número inteiro');
      }
      
      // Metas por competência
      const metasMap: Record<string, string> = {};
      kpiData.forEach((d) => {
        if (d.competencia) {
          // Formatar valor da meta baseado na grandeza
          let metaStr = '';
          if (d.meta !== null && d.meta !== undefined) {
            if (grand.includes('%') || grand.includes('percent')) {
              // Multiplicar por 100 para exibir (0.10 -> 10)
              metaStr = (d.meta * 100).toString().replace('.', ',');
            } else {
              metaStr = d.meta.toString().replace('.', ',');
            }
          }
          metasMap[d.competencia] = metaStr;
        }
      });
      setMetas(metasMap);
    }
  }, [kpiData, kpiName, isOpen]);

  // Lista de competências ordenadas
  const competencias = useMemo(() => {
    return kpiData
      .map((d) => d.competencia)
      .filter(Boolean)
      .sort((a, b) => {
        const parseComp = (s: string) => {
          const parts = s.split('/').map((x) => parseInt(x));
          if (parts.length === 3) {
            return parts[2] * 100 + parts[1];
          } else if (parts.length === 2) {
            return parts[1] * 100 + parts[0];
          }
          return 0;
        };
        return parseComp(a) - parseComp(b);
      });
  }, [kpiData]);

  // Formatar label da competência
  const formatLabel = (comp: string): string => {
    const parts = comp.split('/');
    if (parts.length === 3) {
      const mes = parts[1];
      const ano = parts[2].slice(-2);
      return `${MESES_CURTO[mes] || mes}/${ano}`;
    } else if (parts.length === 2) {
      const mes = parts[0];
      const ano = parts[1].slice(-2);
      return `${MESES_CURTO[mes] || mes}/${ano}`;
    }
    return comp;
  };

  // Handler para mudança nas metas
  const handleMetaChange = (competencia: string, value: string) => {
    const cleanValue = value.replace(/[^0-9.,]/g, '');
    setMetas((prev) => ({ ...prev, [competencia]: cleanValue }));
    setError(null);
  };

  // Validação
  const validateForm = (): boolean => {
    if (!nome.trim()) {
      setError('Por favor, informe o nome do KPI.');
      return false;
    }
    if (!tendencia) {
      setError('Por favor, selecione a tendência.');
      return false;
    }
    if (!grandeza) {
      setError('Por favor, selecione a grandeza.');
      return false;
    }
    return true;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kpi/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team: selectedTeam,
          oldName: kpiName,
          newName: nome,
          tendencia,
          grandeza,
          metas,
          competencias,
          username,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar KPI');
      }

      await onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar KPI. Tente novamente.');
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
            <Pencil size={24} style={{ color: accentColor }} />
            <h2 className="text-xl font-semibold text-white">Editar KPI</h2>
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
              value={nome}
              onChange={(e) => { setNome(e.target.value); setError(null); }}
              placeholder="Nome do KPI"
              className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Tendência e Grandeza */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tendência <span className="text-red-400">*</span>
              </label>
              <select
                value={tendencia}
                onChange={(e) => { setTendencia(e.target.value as any); setError(null); }}
                className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione...</option>
                <option value="MAIOR, MELHOR">MAIOR, MELHOR</option>
                <option value="MENOR, MELHOR">MENOR, MELHOR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Grandeza <span className="text-red-400">*</span>
              </label>
              <select
                value={grandeza}
                onChange={(e) => { setGrandeza(e.target.value as any); setError(null); }}
                className="w-full px-4 py-3 rounded-lg bg-dark-primary border border-gray-600 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="">Selecione...</option>
                <option value="Moeda">Moeda (R$)</option>
                <option value="%">Percentual (%)</option>
                <option value="Número inteiro">Número inteiro</option>
              </select>
            </div>
          </div>

          {/* Metas por mês */}
          {competencias.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Metas Mensais
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {competencias.map((comp) => (
                  <div key={comp}>
                    <label className="block text-xs text-gray-400 mb-1 text-center">
                      {formatLabel(comp)}
                    </label>
                    <input
                      type="text"
                      value={metas[comp] || ''}
                      onChange={(e) => handleMetaChange(comp, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg bg-dark-primary border border-gray-600 text-white text-center text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {grandeza === 'Moeda' && 'Informe os valores em reais (ex: 10000)'}
                {grandeza === '%' && 'Informe os valores em porcentagem (ex: 85)'}
                {grandeza === 'Número inteiro' && 'Informe valores inteiros (ex: 100)'}
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KpiEditModal;
