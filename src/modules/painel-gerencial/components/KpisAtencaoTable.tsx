'use client';

import React, { useState } from 'react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { KpiData } from '../types';

interface KpisAtencaoTableProps {
  kpis: KpiData[];
  competencia: string;
}

const getStatusColor = (percent: number) => {
  if (percent >= 100) return '#22C55E'; // Verde
  if (percent >= 61) return '#FF6600';  // Laranja
  return '#EF4444';                      // Vermelho
};

const formatNumber = (value: number, grandeza: string): string => {
  if (grandeza === '%') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (value >= 1000000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};

// Verifica se o KPI tem FCA preenchido
const hasFcaData = (kpi: KpiData): boolean => {
  return !!(kpi.fato && kpi.fato.trim() !== '');
};

// Interface para dados do formulário FCA
interface FcaFormData {
  fato: string;
  causa: string;
  efeito: string;
  acao: string;
  responsavel: string;
  terminoPrevisto: string;
}

// Modal de Criar FCA
interface FcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiData | null;
  competencia: string;
  onSave: (data: FcaFormData) => Promise<void>;
  saving: boolean;
}

const FcaModal: React.FC<FcaModalProps> = ({ isOpen, onClose, kpi, competencia, onSave, saving }) => {
  const [formData, setFormData] = useState<FcaFormData>({
    fato: '',
    causa: '',
    efeito: '',
    acao: '',
    responsavel: '',
    terminoPrevisto: ''
  });
  const [error, setError] = useState<string>('');

  // Reset form when modal opens with new KPI
  React.useEffect(() => {
    if (isOpen && kpi) {
      // Verificar se já existe FCA (se tem fato preenchido)
      const hasFca = !!(kpi.fato && kpi.fato.trim() !== '');
      
      setFormData({
        fato: kpi.fato || '',
        causa: kpi.causa || '',
        efeito: kpi.efeito || '',
        acao: hasFca ? (kpi.acao || '') : '', // Só preenche AÇÃO se já tem FCA
        responsavel: hasFca ? (kpi.responsavel || '') : '',
        terminoPrevisto: hasFca ? (kpi.terminoPrevisto || '') : ''
      });
      setError('');
    }
  }, [isOpen, kpi]);

  if (!isOpen || !kpi) return null;

  const handleInputChange = (field: keyof FcaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    if (!formData.fato.trim()) {
      setError('O campo FATO é obrigatório');
      return;
    }
    if (!formData.causa.trim()) {
      setError('O campo CAUSA é obrigatório');
      return;
    }
    
    try {
      await onSave(formData);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar FCA');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={!saving ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">CRIAR FCA</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">TIME</label>
              <input 
                type="text" 
                value={kpi.time} 
                disabled 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">KPI</label>
              <input 
                type="text" 
                value={kpi.kpi} 
                disabled 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">COMPETÊNCIA</label>
              <input 
                type="text" 
                value={competencia} 
                disabled 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">FATO *</label>
              <textarea 
                value={formData.fato}
                onChange={(e) => handleInputChange('fato', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white min-h-[80px] resize-y focus:border-orange-500 focus:outline-none"
                placeholder="Descreva o fato..."
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">CAUSA *</label>
              <textarea 
                value={formData.causa}
                onChange={(e) => handleInputChange('causa', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white min-h-[80px] resize-y focus:border-orange-500 focus:outline-none"
                placeholder="Descreva a causa..."
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">EFEITO</label>
              <textarea 
                value={formData.efeito}
                onChange={(e) => handleInputChange('efeito', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white min-h-[80px] resize-y focus:border-orange-500 focus:outline-none"
                placeholder="Descreva o efeito..."
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">AÇÃO OU LINK</label>
              <input 
                type="text"
                value={formData.acao}
                onChange={(e) => handleInputChange('acao', e.target.value)}
                placeholder="Descreva a ação ou insira um link..." 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">RESPONSÁVEL</label>
              <input 
                type="text"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                disabled={saving}
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">TÉRMINO PREVISTO</label>
              <input 
                type="date"
                value={formData.terminoPrevisto}
                onChange={(e) => handleInputChange('terminoPrevisto', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                disabled={saving}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500/10 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de Visualizar FCA
interface ViewFcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiData | null;
  competencia: string;
  onComplete: () => Promise<void>;
  completing: boolean;
}

const ViewFcaModal: React.FC<ViewFcaModalProps> = ({ isOpen, onClose, kpi, competencia, onComplete, completing }) => {
  if (!isOpen || !kpi) return null;

  const isCompleted = kpi.fcaRealizado?.toLowerCase() === 'sim';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={!completing ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Detalhes do FCA</h3>
          
          <div className="space-y-3">
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">CRIADO EM:</span>
              <span className="text-white">{kpi.criadoEm || 'N/A'}</span>
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">FATO:</span>
              <span className="text-white">{kpi.fato || 'N/A'}</span>
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">CAUSA:</span>
              <span className="text-white">{kpi.causa || 'N/A'}</span>
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">EFEITO:</span>
              <span className="text-white">{kpi.efeito || 'N/A'}</span>
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">AÇÃO OU LINK:</span>
              {kpi.acao ? (
                kpi.acao.startsWith('http://') || kpi.acao.startsWith('https://') ? (
                  <a href={kpi.acao} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline break-all">
                    {kpi.acao}
                  </a>
                ) : (
                  <span className="text-white">{kpi.acao}</span>
                )
              ) : (
                <span className="text-white">N/A</span>
              )}
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">RESPONSÁVEL:</span>
              <span className="text-white">{kpi.responsavel || 'N/A'}</span>
            </div>
            
            <div className="flex">
              <span className="text-slate-400 font-medium min-w-[140px]">TÉRMINO PREVISTO:</span>
              <span className="text-white">{kpi.terminoPrevisto || 'N/A'}</span>
            </div>

            {isCompleted && (
              <div className="flex items-center mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400 font-medium">FCA Concluído</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            {!isCompleted && (
              <button 
                onClick={onComplete}
                disabled={completing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {completing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Concluindo...
                  </>
                ) : (
                  'Concluir FCA'
                )}
              </button>
            )}
            <button 
              onClick={onClose}
              disabled={completing}
              className="px-4 py-2 border border-slate-500 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors font-medium disabled:opacity-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const KpisAtencaoTable: React.FC<KpisAtencaoTableProps> = ({ kpis, competencia }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<KpiData | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  const handleCriarFca = (kpi: KpiData) => {
    setSelectedKpi(kpi);
    setCreateModalOpen(true);
    setSaveSuccess(false);
  };

  const handleVisualizarFca = (kpi: KpiData) => {
    setSelectedKpi(kpi);
    setViewModalOpen(true);
  };

  const handleSaveFca = async (formData: FcaFormData) => {
    if (!selectedKpi) return;
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/gerencial/fca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: selectedKpi.time,
          kpi: selectedKpi.kpi,
          competencia: competencia,
          fato: formData.fato,
          causa: formData.causa,
          efeito: formData.efeito,
          acao: formData.acao,
          responsavel: formData.responsavel,
          terminoPrevisto: formData.terminoPrevisto,
          action: 'save'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao salvar FCA');
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        setCreateModalOpen(false);
        setSaveSuccess(false);
        // Recarregar a página para atualizar os dados
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteFca = async () => {
    if (!selectedKpi) return;
    
    setCompleting(true);
    
    try {
      const response = await fetch('/api/gerencial/fca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: selectedKpi.time,
          kpi: selectedKpi.kpi,
          competencia: competencia,
          fato: selectedKpi.fato,
          causa: selectedKpi.causa,
          efeito: selectedKpi.efeito,
          acao: selectedKpi.acao,
          responsavel: selectedKpi.responsavel,
          terminoPrevisto: selectedKpi.terminoPrevisto,
          action: 'complete'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao concluir FCA');
      }
      
      setCompleteSuccess(true);
      setTimeout(() => {
        setViewModalOpen(false);
        setCompleteSuccess(false);
        // Recarregar a página para atualizar os dados
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error('Erro ao concluir FCA:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (kpis.length === 0) {
    return (
      <div className="mb-8">
        <Card>
          <SectionTitle 
            title="KPIS QUE REQUEREM ATENÇÃO (FCA)" 
            icon=""
            subtitle={`Competência: ${competencia}`}
          />
          <p className="text-green-400 text-center py-8">
            Todos os KPIs estão acima de 60%!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card>
        <SectionTitle 
          title="KPIS QUE REQUEREM ATENÇÃO (FCA)" 
          icon=""
          subtitle={`Indicadores com os menores percentuais de atingimento no período selecionado.`}
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-orange-500">
                <th className="text-left py-3 px-4 text-slate-300 font-medium uppercase text-sm">Time</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium uppercase text-sm">KPI</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium uppercase text-sm">Meta</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium uppercase text-sm">Resultado</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium uppercase text-sm">Atingimento</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium uppercase text-sm"></th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi, index) => {
                const atingPercent = (kpi.metasReal ?? 0) * 100;
                const color = getStatusColor(atingPercent);
                const hasFca = hasFcaData(kpi);
                const isCompleted = kpi.fcaRealizado?.toLowerCase() === 'sim';
                
                return (
                  <tr 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/50'} hover:bg-slate-700/30 transition-colors`}
                  >
                    <td className="py-3 px-4 text-orange-500 font-medium">{kpi.time}</td>
                    <td className="py-3 px-4 text-slate-300">{kpi.kpi}</td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {formatNumber(kpi.meta, kpi.grandeza)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {formatNumber(kpi.resultado, kpi.grandeza)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold" style={{ color }}>
                        {atingPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasFca ? (
                        <button
                          onClick={() => handleVisualizarFca(kpi)}
                          className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                            isCompleted 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {isCompleted ? 'FCA Concluído' : 'Visualizar FCA'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCriarFca(kpi)}
                          className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all font-semibold text-sm whitespace-nowrap"
                        >
                          Criar FCA
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Criar FCA */}
      <FcaModal 
        isOpen={createModalOpen} 
        onClose={() => setCreateModalOpen(false)} 
        kpi={selectedKpi}
        competencia={competencia}
        onSave={handleSaveFca}
        saving={saving}
      />

      {/* Modal de Visualizar FCA */}
      <ViewFcaModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        kpi={selectedKpi}
        competencia={competencia}
        onComplete={handleCompleteFca}
        completing={completing}
      />
      
      {/* Toast de sucesso ao salvar */}
      {saveSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          FCA salvo com sucesso!
        </div>
      )}

      {/* Toast de sucesso ao concluir */}
      {completeSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          FCA concluído com sucesso!
        </div>
      )}
    </div>
  );
};

export default KpisAtencaoTable;
