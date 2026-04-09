import { useState, useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface DadoInfo {
  label: string;
  tipo: 'real' | 'mockado' | 'desenvolvimento';
}

interface PopupDadosInfoProps {
  dados: DadoInfo[];
  storageKey: string; // para lembrar que o usuário já viu
}

export default function PopupDadosInfo({ dados, storageKey }: PopupDadosInfoProps) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(`popup_${storageKey}`);
    if (!dismissed) {
      const timer = setTimeout(() => setVisivel(true), 400);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const fechar = () => {
    setVisivel(false);
    sessionStorage.setItem(`popup_${storageKey}`, '1');
  };

  if (!visivel) return null;

  const iconMap = {
    real: <CheckCircle size={13} color="#10B981" />,
    mockado: <AlertTriangle size={13} color="#F59E0B" />,
    desenvolvimento: <Info size={13} color="#6C757D" />,
  };

  const labelMap = {
    real: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    mockado: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    desenvolvimento: { color: '#6C757D', bg: 'rgba(108,117,125,0.1)' },
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={fechar}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          animation: 'popupFadeIn 0.2s ease',
        }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 10001,
        backgroundColor: '#2D3238', border: '1px solid #495057',
        borderRadius: 12, padding: '20px 24px',
        width: 'min(420px, 90vw)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'popupSlideIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} color="#FF6600" />
            <span style={{
              color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
            }}>
              Status dos Dados
            </span>
          </div>
          <button
            onClick={fechar}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6C757D', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dados.map((d, i) => {
            const style = labelMap[d.tipo];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 6,
                backgroundColor: style.bg,
                border: `1px solid ${style.color}30`,
              }}>
                {iconMap[d.tipo]}
                <span style={{
                  color: '#F8F9FA', fontSize: '0.75rem',
                  fontFamily: "'Poppins', sans-serif", flex: 1,
                }}>
                  {d.label}
                </span>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
                  color: style.color, letterSpacing: '0.04em',
                }}>
                  {d.tipo === 'real' ? 'Dados Reais' : d.tipo === 'mockado' ? 'Demonstração' : 'Em Desenvolvimento'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <button
          onClick={fechar}
          style={{
            width: '100%', marginTop: 16, padding: '8px 16px',
            backgroundColor: 'rgba(255,102,0,0.15)',
            border: '1px solid rgba(255,102,0,0.3)',
            borderRadius: 6, color: '#FF6600',
            fontSize: '0.75rem', fontWeight: 600,
            fontFamily: "'Poppins', sans-serif",
            cursor: 'pointer', textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Entendi
        </button>
      </div>

      <style jsx>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popupSlideIn {
          from { opacity: 0; transform: translate(-50%, -48%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
