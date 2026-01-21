/**
 * Card de Indicador - Exibe a pontuação do indicador
 * e compara com as melhores pontuações da rede e cluster
 * Com tooltip explicativo do indicador
 */

import React from 'react';
import { Info } from 'lucide-react';

interface IndicadorCardProps {
  titulo: string;
  notaGeral: string;
  pontuacao: number;
  percentualAtingimento?: number;
  tetoMaximo?: number;
  melhorPontuacaoRede: number;
  melhorPontuacaoCluster: number;
  unidadeMelhorRede?: string;
  unidadeMelhorCluster?: string;
  tooltip?: string; // Explicação do indicador
}

export default function IndicadorCard({
  titulo,
  notaGeral,
  pontuacao,
  percentualAtingimento,
  tetoMaximo,
  melhorPontuacaoRede,
  melhorPontuacaoCluster,
  unidadeMelhorRede,
  unidadeMelhorCluster,
  tooltip
}: IndicadorCardProps) {
  return (
    <div 
      className="p-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
      style={{ 
        backgroundColor: '#343A40',
        minHeight: '160px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minWidth: 0
      }}
    >
      {/* Ícone de informação com tooltip */}
      {tooltip && (
        <div 
          className="absolute group"
          style={{ top: '8px', right: '8px', zIndex: 10 }}
        >
          <Info 
            size={16} 
            style={{ color: '#6b7280', cursor: 'help' }} 
          />
          <div 
            className="absolute right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none"
            style={{ 
              minWidth: '220px', 
              whiteSpace: 'normal', 
              textAlign: 'left',
              bottom: '100%',
              zIndex: 100,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
            }}
          >
            {tooltip}
            <div className="absolute top-full right-2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Título do Indicador */}
      <h3 
        className="text-sm font-bold mb-2 uppercase tracking-wide"
        style={{ color: '#F8F9FA', fontSize: '0.8rem', lineHeight: '1.2', paddingRight: '20px' }}
      >
        {titulo}
      </h3>

      {/* Percentual de Atingimento */}
      <div className="mb-2">
        <span 
          className="text-2xl font-bold"
          style={{ 
            color: percentualAtingimento !== undefined && percentualAtingimento >= 80 ? '#00C853' : 
                   percentualAtingimento !== undefined && percentualAtingimento >= 50 ? '#FFC107' : '#FF4444'
          }}
        >
          {percentualAtingimento !== undefined ? `${percentualAtingimento.toFixed(1)}%` : `${pontuacao.toFixed(1)}%`}
        </span>
      </div>

      {/* Pontuação / Teto */}
      <div className="mb-3">
        <span 
          className="text-base font-semibold"
          style={{ color: '#FF6600' }}
        >
          {pontuacao.toFixed(1)}
        </span>
        <span style={{ color: '#6c757d', fontSize: '0.85rem' }}> / </span>
        <span style={{ color: '#adb5bd', fontSize: '0.85rem' }}>
          {tetoMaximo !== undefined ? tetoMaximo.toFixed(1) : '0'} ptos
        </span>
      </div>

      {/* Comparações lado a lado */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '8px',
          borderTop: '1px solid #495057',
          paddingTop: '8px',
          marginTop: 'auto'
        }}
      >
        {/* Melhor Pontuação - Rede */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
            >
              Melhor Rede
            </span>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.7rem', fontWeight: 600 }}
            >
              {melhorPontuacaoRede.toFixed(1)}
            </span>
          </div>
          {unidadeMelhorRede && (
            <p 
              style={{ color: '#adb5bd', fontSize: '0.5rem', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={unidadeMelhorRede}
            >
              {unidadeMelhorRede}
            </p>
          )}
        </div>

        {/* Melhor Pontuação - Cluster */}
        <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #495057', paddingLeft: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
            >
              Melhor Cluster
            </span>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.7rem', fontWeight: 600 }}
            >
              {melhorPontuacaoCluster.toFixed(1)}
            </span>
          </div>
          {unidadeMelhorCluster && (
            <p 
              style={{ color: '#adb5bd', fontSize: '0.5rem', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={unidadeMelhorCluster}
            >
              {unidadeMelhorCluster}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
