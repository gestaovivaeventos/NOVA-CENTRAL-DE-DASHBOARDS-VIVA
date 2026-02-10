/**
 * PresentationTimer - Temporizador para apresentações de OKR
 * 
 * Cada time tem 3 minutos por OKR (Objetivo).
 * O tempo é acumulado e não reinicia ao trocar de objetivo.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, AlertTriangle } from 'lucide-react';

interface PresentationTimerProps {
  totalObjectives: number;
  teamName: string;
  accentColor: string;
}

const MINUTES_PER_OBJECTIVE = 3;

export default function PresentationTimer({ 
  totalObjectives, 
  teamName, 
  accentColor 
}: PresentationTimerProps) {
  // Tempo total em segundos (3 min por OKR)
  const totalTimeSeconds = totalObjectives * MINUTES_PER_OBJECTIVE * 60;
  
  // Estado do temporizador
  const [timeRemaining, setTimeRemaining] = useState(totalTimeSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset quando mudar o número de objetivos ou time
  useEffect(() => {
    setTimeRemaining(totalObjectives * MINUTES_PER_OBJECTIVE * 60);
    setIsRunning(false);
    setHasStarted(false);
  }, [totalObjectives, teamName]);

  // Contador regressivo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining]);

  // Handlers
  const handleStart = useCallback(() => {
    setIsRunning(true);
    setHasStarted(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setTimeRemaining(totalTimeSeconds);
    setIsRunning(false);
    setHasStarted(false);
  }, [totalTimeSeconds]);

  // Formatar tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular porcentagem do tempo restante
  const percentageRemaining = (timeRemaining / totalTimeSeconds) * 100;
  
  // Determinar cor baseado no tempo restante
  const getTimerColor = (): string => {
    if (percentageRemaining > 50) return '#10b981'; // Verde
    if (percentageRemaining > 25) return '#f59e0b'; // Amarelo
    if (percentageRemaining > 10) return '#f97316'; // Laranja
    return '#ef4444'; // Vermelho
  };

  // Determinar se está em estado crítico
  const isCritical = percentageRemaining <= 10;
  const isTimeUp = timeRemaining === 0;

  if (totalObjectives === 0) return null;

  return (
    <>
      {/* Overlay vermelho na página inteira quando crítico */}
      {hasStarted && (isCritical || isTimeUp) && (
        <div 
          className="critical-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 9998,
            border: `4px solid ${isTimeUp ? '#ef4444' : 'rgba(239, 68, 68, 0.6)'}`,
            boxShadow: `inset 0 0 100px ${isTimeUp ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)'}`,
            animation: isTimeUp ? 'criticalPulse 1s ease-in-out infinite' : 'none',
          }}
        />
      )}

      {/* Timer fixo quando iniciado */}
      <div 
        className="presentation-timer"
        style={{
          position: hasStarted ? 'fixed' : 'relative',
          top: hasStarted ? '24px' : 'auto',
          left: hasStarted ? '332px' : 'auto',
          right: hasStarted ? '32px' : 'auto',
          zIndex: hasStarted ? 9999 : 1,
          background: 'linear-gradient(135deg, rgba(30, 32, 40, 0.98) 0%, rgba(24, 26, 32, 0.98) 100%)',
          borderRadius: '12px',
          border: `1px solid ${hasStarted && isRunning ? getTimerColor() : 'rgba(107, 114, 128, 0.3)'}`,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: isCritical && isRunning 
            ? `0 0 20px ${getTimerColor()}40, 0 4px 20px rgba(0,0,0,0.5)` 
            : hasStarted 
              ? '0 4px 20px rgba(0,0,0,0.5)' 
              : '0 2px 10px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          marginBottom: hasStarted ? '0' : '16px',
        }}
      >
        {/* Ícone e Info */}
        <div className="flex items-center gap-2">
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: `${accentColor}20`,
            }}
          >
            <Clock size={18} style={{ color: accentColor }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">
              Tempo de Apresentação
            </span>
            <span className="text-xs text-gray-400">
              {totalObjectives} OKR{totalObjectives > 1 ? 's' : ''} × {MINUTES_PER_OBJECTIVE} min = {totalObjectives * MINUTES_PER_OBJECTIVE} min
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden min-w-[100px]">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ 
              width: `${percentageRemaining}%`,
              backgroundColor: hasStarted ? getTimerColor() : 'rgba(107, 114, 128, 0.5)',
            }}
          />
        </div>

        {/* Display do Tempo */}
        <div 
          className={`font-mono text-2xl font-bold tracking-wider ${isCritical && isRunning ? 'animate-pulse' : ''}`}
          style={{ 
            color: hasStarted ? getTimerColor() : '#9ca3af',
            minWidth: '80px',
            textAlign: 'center',
          }}
        >
          {formatTime(timeRemaining)}
        </div>

        {/* Alerta de tempo crítico */}
        {isCritical && hasStarted && timeRemaining > 0 && (
          <AlertTriangle 
            size={20} 
            className="text-red-500 animate-bounce"
          />
        )}

        {/* Botões de Controle */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={timeRemaining === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
              title={hasStarted ? "Continuar" : "Iniciar apresentação"}
            >
              <Play size={14} />
              {hasStarted ? 'Continuar' : 'Iniciar'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.4)',
              }}
              title="Pausar"
            >
              <Pause size={14} />
              Pausar
            </button>
          )}

          {hasStarted && (
            <button
              onClick={handleReset}
              className="flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all"
              title="Reiniciar tempo"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>

        {/* Indicador de tempo esgotado */}
        {timeRemaining === 0 && (
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-lg"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
            }}
          >
            <span className="text-red-500 font-bold text-sm animate-pulse">
              ⏰ TEMPO ESGOTADO
            </span>
          </div>
        )}
      </div>

      {/* Placeholder para manter o espaço quando timer está fixed */}
      {hasStarted && (
        <div style={{ height: '60px', marginBottom: '16px' }} />
      )}

      {/* Estilos de animação */}
      <style jsx>{`
        @keyframes criticalPulse {
          0%, 100% { 
            box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.8);
          }
          50% { 
            box-shadow: inset 0 0 150px rgba(239, 68, 68, 0.5);
            border-color: rgba(239, 68, 68, 1);
          }
        }
      `}</style>
    </>
  );
}
