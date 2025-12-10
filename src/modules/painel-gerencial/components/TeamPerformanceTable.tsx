'use client';

import React from 'react';
import Card from './Card';
import SectionTitle from './SectionTitle';
import { TeamPerformance } from '../types';

interface TeamPerformanceTableProps {
  teams: TeamPerformance[];
  competencia: string;
}

const getStatusColor = (percent: number | null) => {
  if (percent === null) return '#94A3B8';
  if (percent >= 100) return '#22C55E'; // Verde
  if (percent >= 61) return '#FF6600';  // Laranja
  return '#EF4444';                      // Vermelho
};

const ProgressBar: React.FC<{ value: number | null; isBold?: boolean }> = ({ value, isBold }) => {
  if (value === null) {
    return <span className="text-slate-500">-</span>;
  }

  const color = getStatusColor(value);
  const width = Math.min(value, 100);

  return (
    <div className="flex flex-col gap-1">
      <span 
        className={`text-sm ${isBold ? 'font-bold' : 'font-medium'}`}
        style={{ color }}
      >
        {value.toFixed(1)}%
      </span>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${width}%`,
            backgroundColor: color,
            transitionDuration: '300ms'
          }}
        />
      </div>
    </div>
  );
};

export const TeamPerformanceTable: React.FC<TeamPerformanceTableProps> = ({ teams, competencia }) => {
  // Calcular métricas gerais
  const timesCom80Porcento = teams.filter(team => team.mediaGeral >= 80).length;
  const totalTimes = teams.length;
  const percentualTimes80 = totalTimes > 0 ? (timesCom80Porcento / totalTimes) * 100 : 0;
  
  const totalIndicadores = teams.reduce((acc, team) => acc + team.totalIndicadores, 0);
  const somaMedias = teams.reduce((acc, team) => acc + (team.mediaGeral * team.totalIndicadores), 0);
  const mediaGeralConsolidada = totalIndicadores > 0 ? somaMedias / totalIndicadores : 0;

  if (teams.length === 0) {
    return (
      <div className="mb-8">
        <SectionTitle 
          title="Performance dos Times" 
          icon=""
          subtitle={`Competência: ${competencia}`}
        />
        <Card>
          <p className="text-slate-400 text-center py-8">
            Nenhum dado disponível para a competência {competencia}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{timesCom80Porcento}</p>
            <p className="text-slate-400 text-sm">TIMES ACIMA DE 80%</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-white">{percentualTimes80.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm">% TIMES NA META</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p 
              className="text-3xl font-bold"
              style={{ color: getStatusColor(mediaGeralConsolidada) }}
            >
              {mediaGeralConsolidada.toFixed(1)}%
            </p>
            <p className="text-slate-400 text-sm">MÉDIA GERAL</p>
          </div>
        </Card>
      </div>

      {/* Container agrupando título e tabela */}
      <Card>
        <SectionTitle 
          title="PERFORMANCE DOS TIMES" 
          icon=""
          subtitle={`Competência: ${competencia}`}
        />
        
        {/* Tabela detalhada */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-orange-500">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">TIME</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">MÉDIA KPIS</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">MÉDIA OKRS</th>
                <th className="text-center py-3 px-4 text-slate-300 font-medium">MÉDIA GERAL</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr 
                  key={index}
                  className={`${index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/50'} hover:bg-slate-700/30 transition-colors`}
                >
                  <td className="py-3 px-4 text-white font-medium">{team.time}</td>
                  <td className="py-3 px-4">
                    <ProgressBar value={team.mediaKpis} />
                  </td>
                  <td className="py-3 px-4">
                    <ProgressBar value={team.mediaOkrs} />
                  </td>
                  <td className="py-3 px-4">
                    <ProgressBar value={team.mediaGeral} isBold />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TeamPerformanceTable;
