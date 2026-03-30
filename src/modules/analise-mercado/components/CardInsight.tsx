/**
 * CardInsight — Card expansível com KPI + conteúdo colapsável
 * Usado para agrupar breakdowns (modalidade, instituição, gênero, etc.)
 * no storytelling do dashboard de Análise de Mercado
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CardInsightProps {
  titulo: string;
  /** Valor principal exibido no header do card */
  valor?: string;
  /** Sub-label (ex: "vs ano anterior") */
  subtitulo?: string;
  /** Cor tema do card */
  cor?: string;
  /** Ícone (lucide-react component) */
  icone?: React.ReactNode;
  /** Items de resumo exibidos compactamente no header */
  resumo?: { label: string; valor: string; cor: string }[];
  /** Expande por padrão? */
  iniciaExpandido?: boolean;
  /** Modo controlado: se fornecido, ignora estado interno */
  expandido?: boolean;
  /** Esconde o chevron e torna o header não-clicável (usado em modo controlado) */
  semToggle?: boolean;
  /** Conteúdo completo (gráficos, tabelas) exibido quando expandido */
  children: React.ReactNode;
}

export default function CardInsight({
  titulo,
  valor,
  subtitulo,
  cor = '#FF6600',
  icone,
  resumo,
  iniciaExpandido = false,
  expandido: expandidoControlado,
  semToggle = false,
  children,
}: CardInsightProps) {
  const [expandidoInterno, setExpandidoInterno] = useState(iniciaExpandido);
  const expandido = expandidoControlado !== undefined ? expandidoControlado : expandidoInterno;

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: 12,
      border: `1px solid ${expandido ? cor + '50' : '#495057'}`,
      overflow: 'hidden',
      transition: 'border-color 0.25s',
    }}>
      {/* Header — sempre visível, clicável */}
      <div
        onClick={() => { if (!semToggle) setExpandidoInterno(p => !p); }}
        style={{
          padding: '14px 18px',
          cursor: semToggle ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'background-color 0.15s',
          backgroundColor: expandido ? `${cor}08` : 'transparent',
        }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${cor}10`; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = expandido ? `${cor}08` : 'transparent'; }}
      >
        {/* Chevron — oculto no modo controlado */}
        {!semToggle && (
          <span style={{ color: cor, display: 'flex', flexShrink: 0, transition: 'transform 0.2s' }}>
            {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}

        {/* Ícone opcional */}
        {icone && (
          <span style={{ color: cor, display: 'flex', flexShrink: 0 }}>
            {icone}
          </span>
        )}

        {/* Título + valor principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h4 style={{
              color: '#F8F9FA', fontSize: '0.82rem', fontWeight: 600, margin: 0,
              fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
            }}>
              {titulo}
            </h4>
            {valor && (
              <span style={{
                color: cor, fontSize: '1rem', fontWeight: 700,
                fontFamily: "'Orbitron', monospace",
              }}>
                {valor}
              </span>
            )}
            {subtitulo && (
              <span style={{ color: '#6C757D', fontSize: '0.65rem' }}>
                {subtitulo}
              </span>
            )}
          </div>
        </div>

        {/* Resumo compacto (badges) — visível quando colapsado */}
        {resumo && !expandido && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {resumo.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 10,
                backgroundColor: `${item.cor}12`,
                border: `1px solid ${item.cor}30`,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: item.cor, flexShrink: 0,
                }} />
                <span style={{ color: '#ADB5BD', fontSize: '0.64rem', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                <span style={{ color: item.cor, fontSize: '0.7rem', fontWeight: 700 }}>
                  {item.valor}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Indicador visual de clique */}
        {!semToggle && (
          <span style={{
            color: '#495057', fontSize: '0.6rem',
            flexShrink: 0,
          }}>
            {expandido ? 'RECOLHER' : 'DETALHAR'}
          </span>
        )}
      </div>

      {/* Conteúdo expandido */}
      {expandido && (
        <div style={{
          padding: '0 18px 18px',
          borderTop: `1px solid ${cor}20`,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
