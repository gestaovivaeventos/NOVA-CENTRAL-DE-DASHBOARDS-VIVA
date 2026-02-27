/**
 * TabelaComparativa — Tabela comparativa com linhas expansíveis
 * Exibe Matriculados, Concluintes, Ingressantes com quebra por:
 *   → Pública / Privada
 *   → Presencial / EAD
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import type { DadosEvolucaoAnual, MetricaAtiva } from '../types';
import { fmtNum, fmtInteiro, CORES } from '../utils/formatters';

type TipoMetrica = 'matriculas' | 'concluintes' | 'ingressantes';

interface MetricaRow {
  key: TipoMetrica;
  label: string;
  cor: string;
}

const METRICAS: MetricaRow[] = [
  { key: 'matriculas', label: 'Matriculados', cor: CORES.azul },
  { key: 'concluintes', label: 'Concluintes', cor: CORES.verde },
  { key: 'ingressantes', label: 'Ingressantes', cor: CORES.roxo },
];

interface TabelaComparativaProps {
  dados: DadosEvolucaoAnual[];
  metricasAtivas?: MetricaAtiva[];
}

export default function TabelaComparativa({ dados, metricasAtivas = [] }: TabelaComparativaProps) {
  const [expandido, setExpandido] = useState<Set<TipoMetrica>>(new Set());

  const toggleExpandir = (key: TipoMetrica) => {
    setExpandido(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const anos = dados.map(e => e.ano);

  // Calcular variação ano a ano
  const variacao = (valores: number[], idx: number) => {
    if (idx === 0) return null;
    const diff = ((valores[idx] - valores[idx - 1]) / valores[idx - 1]) * 100;
    return diff;
  };

  const renderCell = (value: number, var_: number | null, cor: string, isSubRow = false) => (
    <td style={{
      padding: '9px 10px', textAlign: 'right',
      color: isSubRow ? '#ADB5BD' : cor,
      fontWeight: isSubRow ? 400 : 600,
      fontSize: isSubRow ? '0.72rem' : '0.76rem',
      whiteSpace: 'nowrap',
    }}>
      <div>{fmtNum(value)}</div>
      {var_ !== null && (
        <div style={{
          fontSize: '0.6rem',
          color: var_ >= 0 ? '#10B981' : '#EF4444',
          marginTop: 1,
        }}>
          {var_ >= 0 ? '▲' : '▼'} {Math.abs(var_).toFixed(1)}%
        </div>
      )}
    </td>
  );

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #495057' }}>
        <h3 style={{
          color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, margin: 0,
          fontFamily: "'Poppins', sans-serif",
        }}>
          Tabela Comparativa — Evolução Anual
        </h3>
        <p style={{ color: '#6C757D', fontSize: '0.68rem', margin: '4px 0 0' }}>
          Clique na seta para expandir as quebras por tipo de instituição e modalidade
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2D3238' }}>
              <th style={{
                color: '#6C757D', fontWeight: 600, padding: '10px 14px',
                textAlign: 'left', fontSize: '0.7rem', textTransform: 'uppercase',
                letterSpacing: '0.04em', borderBottom: '2px solid #495057',
                position: 'sticky', left: 0, backgroundColor: '#2D3238', zIndex: 1,
                minWidth: 180,
              }}>
                Métrica
              </th>
              {anos.map(ano => (
                <th key={ano} style={{
                  color: '#6C757D', fontWeight: 600, padding: '10px 10px',
                  textAlign: 'right', fontSize: '0.7rem', textTransform: 'uppercase',
                  letterSpacing: '0.04em', borderBottom: '2px solid #495057',
                  minWidth: 90,
                }}>
                  {ano}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICAS.map(metrica => {
              const isOpen = expandido.has(metrica.key);
              const isActive = metricasAtivas.includes(metrica.key);
              const valores = dados.map(e => e[metrica.key]);

              return (
                <React.Fragment key={metrica.key}>
                  {/* Linha principal */}
                  <tr
                    onClick={() => toggleExpandir(metrica.key)}
                    style={{
                      borderBottom: isOpen ? 'none' : '1px solid #3D4349',
                      backgroundColor: isActive ? `${metrica.cor}10` : isOpen ? 'rgba(255,102,0,0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                      borderLeft: isActive ? `3px solid ${metrica.cor}` : '3px solid transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = isActive ? `${metrica.cor}18` : isOpen ? 'rgba(255,102,0,0.06)' : 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? `${metrica.cor}10` : isOpen ? 'rgba(255,102,0,0.04)' : 'transparent'; }}
                  >
                    <td style={{
                      padding: '10px 14px',
                      position: 'sticky', left: 0, zIndex: 1,
                      backgroundColor: isOpen ? '#363b42' : '#343A40',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ color: metrica.cor, transition: 'transform 0.2s', display: 'flex' }}>
                        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: metrica.cor, flexShrink: 0,
                      }} />
                      <span style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.8rem' }}>
                        {metrica.label}
                      </span>
                    </td>
                    {valores.map((v, i) => renderCell(v, variacao(valores, i), metrica.cor))}
                  </tr>

                  {/* Sub-linhas expandidas */}
                  {isOpen && (
                    <>
                      {/* Pública */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '7px 14px 7px 48px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.azul, fontSize: '0.72rem', fontWeight: 500,
                        }}>
                          ├ Pública
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.publica);
                          return renderCell(e.publica, variacao(vals, i), CORES.azul, true);
                        })}
                      </tr>

                      {/* Pública → Presencial */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '5px 14px 5px 72px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                        }}>
                          ├ Presencial
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.presencial);
                          return renderCell(e.presencial, variacao(vals, i), CORES.verde, true);
                        })}
                      </tr>

                      {/* Pública → EAD */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '5px 14px 5px 72px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                        }}>
                          └ EAD
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.ead);
                          return renderCell(e.ead, variacao(vals, i), CORES.roxo, true);
                        })}
                      </tr>

                      {/* Privada */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '7px 14px 7px 48px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.laranja, fontSize: '0.72rem', fontWeight: 500,
                        }}>
                          ├ Privada
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.privada);
                          return renderCell(e.privada, variacao(vals, i), CORES.laranja, true);
                        })}
                      </tr>

                      {/* Privada → Presencial */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '5px 14px 5px 72px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                        }}>
                          ├ Presencial
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.presencial);
                          return renderCell(e.presencial, variacao(vals, i), CORES.verde, true);
                        })}
                      </tr>

                      {/* Privada → EAD */}
                      <tr style={{ borderBottom: '1px solid #3D4349', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td style={{
                          padding: '5px 14px 5px 72px',
                          position: 'sticky', left: 0, zIndex: 1,
                          backgroundColor: '#343A40',
                          color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                        }}>
                          └ EAD
                        </td>
                        {dados.map((e, i) => {
                          const vals = dados.map(d => d.ead);
                          return renderCell(e.ead, variacao(vals, i), CORES.roxo, true);
                        })}
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
