'use client';

import React from 'react';
import { Franquia } from '../types';
import { ClusterBadge } from './ClusterBadge';

interface TabelaRankingProps {
  franquias: Franquia[];
  showCluster?: boolean;
  limit?: number;
}

export function TabelaRanking({ 
  franquias, 
  showCluster = true,
  limit 
}: TabelaRankingProps) {
  const displayData = limit ? franquias.slice(0, limit) : franquias;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) return '🥇';
    if (ranking === 2) return '🥈';
    if (ranking === 3) return '🥉';
    return ranking.toString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-border">
            <th className="text-left py-3 px-4 text-dark-text-muted text-sm font-medium">
              #
            </th>
            <th className="text-left py-3 px-4 text-dark-text-muted text-sm font-medium">
              Franquia
            </th>
            {showCluster && (
              <th className="text-left py-3 px-4 text-dark-text-muted text-sm font-medium">
                Cluster
              </th>
            )}
            <th className="text-right py-3 px-4 text-dark-text-muted text-sm font-medium">
              Pontuação
            </th>
            <th className="text-center py-3 px-4 text-dark-text-muted text-sm font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {displayData.map((franquia, index) => (
            <tr 
              key={franquia.id}
              className="border-b border-dark-border/50 hover:bg-dark-bg-secondary/50 transition-colors"
            >
              <td className="py-3 px-4">
                <span className="text-lg font-semibold text-dark-text">
                  {getRankingBadge(franquia.rankingGeral || index + 1)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium text-dark-text">{franquia.nome}</p>
                  {franquia.consultor && (
                    <p className="text-xs text-dark-text-muted mt-0.5">
                      {franquia.consultor}
                    </p>
                  )}
                </div>
              </td>
              {showCluster && (
                <td className="py-3 px-4">
                  <ClusterBadge cluster={franquia.cluster} size="sm" />
                </td>
              )}
              <td className="py-3 px-4 text-right">
                <span className="text-lg font-bold text-viva-primary">
                  {franquia.pontuacaoTotal.toFixed(1)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center">
                  <div 
                    className={`w-3 h-3 rounded-full ${getStatusColor(franquia.status)}`}
                    title={franquia.status}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {displayData.length === 0 && (
        <div className="text-center py-8 text-dark-text-muted">
          Nenhuma franquia encontrada
        </div>
      )}
    </div>
  );
}

export default TabelaRanking;
