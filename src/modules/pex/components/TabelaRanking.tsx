'use client';

import React from 'react';
import { Franquia } from '../types';
import { ClusterBadge } from './ClusterBadge';

interface TabelaRankingProps {
  franquias: Franquia[];
  showCluster?: boolean;
  limit?: number;
}

// Componente de Medalha Minimalista
const PositionBadge = ({ position }: { position: number }) => {
  if (position > 3) return <span>{position}</span>;
  
  const colors = {
    1: '#FFD700', // Ouro
    2: '#A8A8A8', // Prata
    3: '#CD7F32', // Bronze
  };
  
  const color = colors[position as 1 | 2 | 3];
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span>{position}</span>
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        style={{ marginLeft: '4px' }}
      >
        <circle cx="12" cy="9" r="7" fill={color} />
        <path d="M8 15L6 22L12 19L18 22L16 15" fill={color} opacity="0.8" />
        <text x="12" y="12" textAnchor="middle" fill="#1a1a1a" fontSize="9" fontWeight="700" fontFamily="Arial">{position}</text>
      </svg>
    </span>
  );
};

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
    return <PositionBadge position={ranking} />;
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
