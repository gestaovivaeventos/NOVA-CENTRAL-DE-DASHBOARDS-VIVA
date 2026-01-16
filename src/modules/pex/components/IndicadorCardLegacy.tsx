/**
 * Card de Indicador - Exibe a pontuação do indicador
 * e compara com as melhores pontuações da rede e cluster
 */

import React from 'react';

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
  unidadeMelhorCluster
}: IndicadorCardProps) {
  return (
    <div 
      className="p-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
      style={{ 
        backgroundColor: '#343A40',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Título do Indicador */}
      <h3 
        className="text-sm font-bold mb-0.5 uppercase tracking-wide"
        style={{ color: '#F8F9FA', fontSize: '0.8rem', lineHeight: '1.2' }}
      >
        {titulo}
      </h3>

      {/* Nota Geral (subtítulo) */}
      <p 
        className="text-xs mb-1"
        style={{ color: '#adb5bd', fontSize: '0.65rem', minHeight: '20px' }}
      >
        {notaGeral}
      </p>

      {/* Pontuação da Unidade com Percentual */}
      <div className="mb-1" style={{ flex: 1 }}>
        <div className="flex items-center justify-between gap-2">
          {/* Percentual de Atingimento */}
          {tetoMaximo !== undefined && tetoMaximo > 0 && percentualAtingimento !== undefined ? (
            <div className="flex items-baseline gap-1">
              <span 
                className="text-2xl font-bold"
                style={{ 
                  color: percentualAtingimento >= 80 ? '#00C853' : 
                         percentualAtingimento >= 50 ? '#FFC107' : '#FF4444'
                }}
              >
                {percentualAtingimento.toFixed(1)}%
              </span>
              <span 
                className="text-xs"
                style={{ color: '#6c757d' }}
              >
                do resultado
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span 
                className="text-2xl font-bold"
                style={{ color: '#FF6600' }}
              >
                {pontuacao.toFixed(1)}
              </span>
              <span 
                className="text-xs"
                style={{ color: '#6c757d' }}
              >
                pontos
              </span>
            </div>
          )}
          
          {/* Pontuação */}
          {tetoMaximo !== undefined && tetoMaximo > 0 && (
            <div className="flex items-baseline gap-1">
              <span 
                className="text-lg font-semibold"
                style={{ color: '#FF6600' }}
              >
                {pontuacao.toFixed(1)}
              </span>
              <span 
                className="text-xs"
                style={{ color: '#6c757d' }}
              >
                pts
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Melhor Pontuação - Rede */}
      <div className="pb-1" style={{ borderBottom: '1px solid #495057' }}>
        <div className="flex justify-between items-center">
          <span 
            className="text-xs uppercase tracking-wide"
            style={{ color: '#F8F9FA', fontSize: '0.6rem' }}
          >
            Melhor Pont. - Rede
          </span>
          <span 
            className="text-xs font-semibold"
            style={{ color: '#F8F9FA', fontSize: '0.7rem' }}
          >
            {melhorPontuacaoRede.toFixed(1)}
          </span>
        </div>
        {unidadeMelhorRede && (
          <p 
            className="text-xs"
            style={{ color: '#adb5bd', fontSize: '0.55rem', marginTop: '1px' }}
          >
            {unidadeMelhorRede}
          </p>
        )}
      </div>

      {/* Melhor Pontuação - Cluster */}
      <div style={{ marginTop: '4px' }}>
        <div className="flex justify-between items-center">
          <span 
            className="text-xs uppercase tracking-wide"
            style={{ color: '#F8F9FA', fontSize: '0.6rem' }}
          >
            Melhor Pont. - Cluster
          </span>
          <span 
            className="text-xs font-semibold"
            style={{ color: '#F8F9FA', fontSize: '0.7rem' }}
          >
            {melhorPontuacaoCluster.toFixed(1)}
          </span>
        </div>
        {unidadeMelhorCluster && (
          <p 
            className="text-xs"
            style={{ color: '#adb5bd', fontSize: '0.55rem', marginTop: '1px' }}
          >
            {unidadeMelhorCluster}
          </p>
        )}
      </div>
    </div>
  );
}
