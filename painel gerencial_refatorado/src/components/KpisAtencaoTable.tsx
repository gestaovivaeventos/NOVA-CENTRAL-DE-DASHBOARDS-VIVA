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

// Modal de FCA
interface FcaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kpi: KpiData | null;
  competencia: string;
}

const FcaModal: React.FC<FcaModalProps> = ({ isOpen, onClose, kpi, competencia }) => {
  if (!isOpen || !kpi) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">CRIAR FCA</h3>
          
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
              <label className="block text-slate-400 text-sm font-medium mb-1">CRIADO EM</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">FATO</label>
              <textarea 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white min-h-[80px] resize-y"
                placeholder="Descreva o fato..."
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">CAUSA</label>
              <textarea 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white min-h-[80px] resize-y"
                placeholder="Descreva a causa..."
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">AÇÃO (LINK DO CARD)</label>
              <input 
                type="url" 
                placeholder="https://..." 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">RESPONSÁVEL</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
            
            <div>
              <label className="block text-slate-400 text-sm font-medium mb-1">TÉRMINO PREVISTO</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500/10 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const KpisAtencaoTable: React.FC<KpisAtencaoTableProps> = ({ kpis, competencia }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<KpiData | null>(null);

  const handleCriarFca = (kpi: KpiData) => {
    setSelectedKpi(kpi);
    setModalOpen(true);
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
                const atingPercent = kpi.metasReal * 100;
                const color = getStatusColor(atingPercent);
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
                      <button
                        onClick={() => handleCriarFca(kpi)}
                        className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all font-semibold text-sm whitespace-nowrap"
                      >
                        CRIAR FCA
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de FCA */}
      <FcaModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        kpi={selectedKpi}
        competencia={competencia}
      />
    </div>
  );
};

export default KpisAtencaoTable;
