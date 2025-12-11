'use client';

import React from 'react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { OkrData } from '../types';

interface OkrsSectionProps {
  okrs: OkrData[];
  competencia: string;
}

const getStatusColor = (percent: number) => {
  if (percent >= 100) return '#22C55E'; // Verde
  if (percent >= 61) return '#FF6600';  // Laranja
  return '#EF4444';                      // Vermelho
};

const getStatusClass = (percent: number) => {
  if (percent >= 100) return 'bg-gradient-to-r from-green-400 to-green-600';
  if (percent >= 61) return 'bg-gradient-to-r from-orange-400 to-orange-600';
  return 'bg-gradient-to-r from-red-400 to-red-600';
};

// Componente de barra de progresso inline
const ProgressBarCell: React.FC<{ value: number }> = ({ value }) => {
  const color = getStatusColor(value);
  const statusClass = getStatusClass(value);
  const width = Math.min(value, 100);
  
  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <span className="font-semibold text-sm min-w-[55px] text-left" style={{ color }}>
        {value.toFixed(1)}%
      </span>
      <div className="flex-grow h-3.5 bg-slate-800/60 rounded-lg shadow-inner overflow-hidden">
        <div 
          className={`h-full rounded-lg transition-all duration-500 ${statusClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

// Função para extrair valor numérico de meta
const parseMetaValue = (meta: string): number => {
  if (!meta) return 0;
  // Remove símbolos de moeda, pontos de milhar, e converte vírgula para ponto
  const cleaned = meta.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  return parseFloat(cleaned) || 0;
};

export const OkrsSection: React.FC<OkrsSectionProps> = ({ okrs, competencia }) => {
  // Extrair mês e ano da competência selecionada
  const [mesCompetencia, anoCompetencia] = competencia.split('/').map(Number);
  
  // Função para pegar o quarter de um mês
  const getQuarter = (mes: number): number => {
    if (mes >= 1 && mes <= 3) return 1;
    if (mes >= 4 && mes <= 6) return 2;
    if (mes >= 7 && mes <= 9) return 3;
    return 4;
  };
  
  const quarterCompetencia = getQuarter(mesCompetencia);
  
  // Função para buscar o último resultado de um KR específico
  const findLastResultForKR = (indicator: string): OkrData | null => {
    const indicatorOkrs = okrs.filter(okr => okr.indicator === indicator);
    if (indicatorOkrs.length === 0) return null;
    
    const exactMatch = indicatorOkrs.find(okr => {
      if (!okr.data) return false;
      const parts = okr.data.split('/');
      if (parts.length !== 3) return false;
      const mes = parts[1].padStart(2, '0');
      const ano = parts[2];
      return `${mes}/${ano}` === competencia;
    });
    
    if (exactMatch) return exactMatch;
    
    const previousOkrs = indicatorOkrs.filter(okr => {
      if (!okr.data) return false;
      const parts = okr.data.split('/');
      if (parts.length !== 3) return false;
      const mes = parseInt(parts[1], 10);
      const ano = parseInt(parts[2], 10);
      
      if (ano < anoCompetencia) return true;
      if (ano === anoCompetencia && mes <= mesCompetencia) return true;
      return false;
    });
    
    if (previousOkrs.length === 0) return null;
    
    const sorted = previousOkrs.sort((a, b) => {
      const dateA = a.data ? a.data.split('/').reverse().join('') : '0';
      const dateB = b.data ? b.data.split('/').reverse().join('') : '0';
      return dateB.localeCompare(dateA);
    });
    
    return sorted[0];
  };
  
  const indicadoresUnicos = [...new Set(okrs.map(okr => okr.indicator))];
  const filteredOkrs = indicadoresUnicos
    .map(indicator => findLastResultForKR(indicator))
    .filter((okr): okr is OkrData => okr !== null);

  // Agrupar por objetivo
  const groupedByObjective = filteredOkrs.reduce((acc, item) => {
    const key = item.objective;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, OkrData[]>);

  const objectives = Object.keys(groupedByObjective);

  if (objectives.length === 0) {
    return (
      <div className="mb-8">
        <SectionTitle title="OKRS - OBJETIVOS E RESULTADOS CHAVE" icon="" />
        <Card>
          <p className="text-slate-400 text-center py-8">Nenhum OKR cadastrado para a competência {competencia}</p>
        </Card>
      </div>
    );
  }

  // Encontrar a meta mais recente para cada indicador
  const findLatestMeta = (indicator: string): number => {
    const allIndicatorOkrs = okrs.filter(okr => okr.indicator === indicator && okr.meta);
    if (allIndicatorOkrs.length === 0) return 0;
    
    const sorted = allIndicatorOkrs.sort((a, b) => {
      const dateA = a.data ? a.data.split('/').reverse().join('') : '0';
      const dateB = b.data ? b.data.split('/').reverse().join('') : '0';
      return dateB.localeCompare(dateA);
    });
    
    return parseMetaValue(sorted[0].meta);
  };

  // Calcular atingimento do ano
  const calcAtingimentoAno = (kr: OkrData): number => {
    const realizadoVal = parseMetaValue(kr.realizado);
    const metaAnual = findLatestMeta(kr.indicator);
    
    if (metaAnual === 0) return 0;
    const percent = (realizadoVal / metaAnual) * 100;
    return Math.max(0, Math.min(percent, 100));
  };

  // Calcular média por objetivo
  const objectiveMetrics = objectives.map((objective, index) => {
    const krs = groupedByObjective[objective];
    const mediaAtingimento = krs.reduce((acc, kr) => acc + kr.atingimento, 0) / krs.length * 100;
    const mediaAtingimentoAno = krs.reduce((acc, kr) => acc + calcAtingimentoAno(kr), 0) / krs.length;
    
    return {
      objective,
      label: `OBJETIVO ${index + 1}`,
      krs,
      mediaAtingimento,
      mediaAtingimentoAno
    };
  });

  return (
    <div className="mb-8">
      {/* Cards de rosca para cada objetivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {objectiveMetrics.slice(0, 2).map((obj) => {
          const percent = obj.mediaAtingimentoAno;
          const color = getStatusColor(percent);
          
          let gradientColors = { start: '#EF4444', end: '#DC2626' }; // Vermelho
          if (percent >= 100) {
            gradientColors = { start: '#22C55E', end: '#16A34A' }; // Verde
          } else if (percent >= 61) {
            gradientColors = { start: '#FF6600', end: '#FF8533' }; // Laranja
          }
          
          const angle = (Math.min(percent, 100) / 100) * 360;
          const radius = 80;
          const strokeWidth = 20;
          const normalizedRadius = radius - strokeWidth / 2;
          const circumference = normalizedRadius * 2 * Math.PI;
          const strokeDashoffset = circumference - (angle / 360) * circumference;
          
          return (
            <Card key={obj.objective}>
              <div>
                {/* Título com estilo section-title */}
                <h4 
                  style={{
                    margin: '0 0 12px 0',
                    color: '#adb5bd',
                    fontSize: '0.9rem',
                    letterSpacing: '0.06em',
                    fontFamily: "'Poppins', Arial, sans-serif",
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #ff6600',
                    paddingBottom: '2px',
                    lineHeight: '1.4',
                  }}
                >
                  {obj.objective}
                </h4>
                
                {/* Donut Chart */}
                <div className="text-center">
                <div className="relative w-48 h-48 mx-auto">
                  <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90">
                    <defs>
                      <linearGradient id={`gradient-${obj.objective.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: gradientColors.start, stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: gradientColors.end, stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r={normalizedRadius}
                      fill="none"
                      stroke="#1E293B"
                      strokeWidth={strokeWidth}
                    />
                    
                    {/* Progress circle with gradient */}
                    <circle
                      cx="96"
                      cy="96"
                      r={normalizedRadius}
                      fill="none"
                      stroke={`url(#gradient-${obj.objective.replace(/\s+/g, '-')})`}
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${circumference} ${circumference}`}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  </svg>
                  
                  {/* Centered text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold" style={{ color }}>
                      {percent.toFixed(1)}
                    </p>
                  </div>
                </div>
                
                <p className="text-slate-400 text-xs mt-4">{obj.krs.length} INDICADORES</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Container agrupando título e tabela */}
      <Card>
        <SectionTitle 
          title="OKRS - OBJETIVOS E RESULTADOS CHAVE" 
          icon=""
          subtitle={`Competência: ${competencia}`}
        />
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-orange-500">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">OBJETIVO ESTRATÉGICO</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">INDICADOR (KR)</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">META PARCIAL</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">REALIZADO PARCIAL</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">ATINGIMENTO PARCIAL</th>
                <th className="text-left py-3 px-4 text-slate-300 font-medium">ATINGIMENTO NO ANO</th>
              </tr>
            </thead>
            <tbody>
              {objectiveMetrics.map((obj, objIndex) => (
                obj.krs.map((kr, index) => {
                  const atingParcial = kr.atingimento * 100;
                  const atingAno = calcAtingimentoAno(kr);
                  const rowIndex = objectiveMetrics.slice(0, objIndex).reduce((acc, o) => acc + o.krs.length, 0) + index;
                  
                  return (
                    <tr 
                      key={`${obj.objective}-${index}`}
                      className={`${rowIndex % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/50'} hover:bg-slate-700/30 transition-colors`}
                    >
                      {index === 0 && (
                        <td 
                          rowSpan={obj.krs.length} 
                          className="py-3 px-4 text-orange-500 font-medium align-top"
                        >
                          {obj.label}
                        </td>
                      )}
                      <td className="py-3 px-4 text-slate-300">{kr.indicator}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{kr.meta || '-'}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{kr.realizado || '-'}</td>
                      <td className="py-3 px-4">
                        <ProgressBarCell value={atingParcial} />
                      </td>
                      <td className="py-3 px-4">
                        <ProgressBarCell value={atingAno} />
                      </td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OkrsSection;
