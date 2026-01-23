/**
 * Card de Indicador - Exibe a pontuação do indicador
 * e compara com as melhores pontuações da rede e cluster
 * Com tooltip explicativo do indicador (abre ao clicar)
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Info, X } from 'lucide-react';

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
  tooltip?: string; // Explicação do indicador (legacy - será substituído por resumo/calculo)
  resumo?: string; // O que é o indicador
  calculo?: string; // Como é calculado
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
  tooltip,
  resumo,
  calculo
}: IndicadorCardProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Calcular posição do tooltip quando abre
  const handleOpenTooltip = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 300;
      const tooltipHeight = 280;
      const margin = 10;
      
      // Calcular posição inicial (abaixo e à esquerda do botão)
      let left = rect.right - tooltipWidth + 8;
      let top = rect.bottom + 8;
      
      // Se o tooltip sair da tela pela direita, ajustar
      if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin;
      }
      
      // Se o tooltip sair da tela pela esquerda, ajustar
      if (left < margin) {
        left = margin;
      }
      
      // Se o tooltip sair da tela por baixo, abrir acima do botão
      if (top + tooltipHeight > window.innerHeight - margin) {
        top = rect.top - tooltipHeight - 8;
      }
      
      // Se ainda sair por cima, centralizar verticalmente
      if (top < margin) {
        top = margin;
      }
      
      setTooltipPosition({ top, left });
    }
    setIsTooltipOpen(!isTooltipOpen);
  };

  // Fechar tooltip ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsTooltipOpen(false);
      }
    }

    if (isTooltipOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTooltipOpen]);

  // Fechar tooltip ao rolar a página (exceto se rolar dentro do tooltip)
  useEffect(() => {
    function handleScroll(event: Event) {
      // Ignorar scroll dentro do tooltip
      if (tooltipRef.current && tooltipRef.current.contains(event.target as Node)) {
        return;
      }
      if (isTooltipOpen) {
        setIsTooltipOpen(false);
      }
    }

    if (isTooltipOpen) {
      window.addEventListener('scroll', handleScroll, true); // true para capturar em qualquer elemento
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isTooltipOpen]);

  // Verificar se tem conteúdo para mostrar no tooltip
  const hasTooltipContent = resumo || calculo || tooltip;

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
      {/* Ícone de informação com tooltip (clique para abrir) */}
      {hasTooltipContent && (
        <div 
          className="absolute"
          style={{ top: '8px', right: '8px', zIndex: isTooltipOpen ? 1 : 10 }}
        >
          <button
            ref={buttonRef}
            onClick={handleOpenTooltip}
            className="flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '2px'
            }}
            title="Ver informações"
          >
            <Info 
              size={18} 
              style={{ 
                color: isTooltipOpen ? '#FF6600' : '#FFFFFF',
                transition: 'color 0.2s'
              }} 
            />
          </button>
        </div>
      )}
      
      {/* Tooltip renderizado via Portal para ficar sobre a sidebar */}
      {isTooltipOpen && hasTooltipContent && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div 
          ref={tooltipRef}
          style={{ 
            position: 'fixed',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            width: '300px',
            maxHeight: '280px',
            backgroundColor: '#1a1d21',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            border: '1px solid #FF6600',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header do tooltip */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid #3a3d41'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <span style={{ 
                color: '#FF6600', 
                fontSize: '0.9rem', 
                fontWeight: 700,
                textTransform: 'uppercase',
                lineHeight: 1.3
              }}>
                {titulo}
              </span>
            </div>
            <button
              onClick={() => setIsTooltipOpen(false)}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                padding: '2px',
                color: '#6c757d',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#FF6600'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6c757d'}
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo do tooltip com scroll */}
          <div 
            className="tooltip-scroll"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              paddingRight: '6px'
            }}
          >
            {/* O que é */}
            {(resumo || tooltip) && (
              <div>
                <p style={{ 
                  color: '#adb5bd', 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  O que é:
                </p>
                <p style={{ 
                  color: '#E0E0E0', 
                  fontSize: '0.75rem', 
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {resumo || tooltip}
                </p>
              </div>
            )}

            {/* Cálculo */}
            {calculo && (
              <div>
                <p style={{ 
                  color: '#adb5bd', 
                  fontSize: '0.7rem', 
                  fontWeight: 600, 
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  Cálculo:
                </p>
                <p style={{ 
                  color: '#E0E0E0', 
                  fontSize: '0.75rem', 
                  lineHeight: 1.6,
                  margin: 0,
                  fontStyle: 'italic',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {calculo}
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
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
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span 
              style={{ color: '#adb5bd', fontSize: '0.65rem', textTransform: 'uppercase' }}
            >
              Melhor Rede
            </span>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600 }}
            >
              {melhorPontuacaoRede.toFixed(1)}
            </span>
          </div>
          {unidadeMelhorRede && (
            <p 
              style={{ color: '#6c757d', fontSize: '0.6rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={unidadeMelhorRede}
            >
              {unidadeMelhorRede}
            </p>
          )}
        </div>

        {/* Melhor Pontuação - Cluster */}
        <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #495057', paddingLeft: '8px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '2px'
          }}>
            <span 
              style={{ color: '#adb5bd', fontSize: '0.65rem', textTransform: 'uppercase' }}
            >
              Melhor Cluster
            </span>
            <span 
              style={{ color: '#F8F9FA', fontSize: '0.8rem', fontWeight: 600 }}
            >
              {melhorPontuacaoCluster.toFixed(1)}
            </span>
          </div>
          {unidadeMelhorCluster && (
            <p 
              style={{ color: '#6c757d', fontSize: '0.6rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
