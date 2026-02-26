/**
 * TabelaRanking — Tabela de ranking com dados ordenáveis
 * Usada para ranking de estados, cursos, grupos educacionais etc.
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { fmtNum, fmtInteiro, fmtPct } from '../utils/formatters';

interface Coluna<T> {
  key: keyof T & string;
  label: string;
  tipo: 'texto' | 'numero' | 'percentual';
  largura?: string;
}

interface TabelaRankingProps<T extends Record<string, any>> {
  titulo: string;
  dados: T[];
  colunas: Coluna<T>[];
  linhasVisiveis?: number;
  destaqueCor?: string;
}

export default function TabelaRanking<T extends Record<string, any>>({
  titulo,
  dados,
  colunas,
  linhasVisiveis = 10,
  destaqueCor = '#FF6600',
}: TabelaRankingProps<T>) {
  const [sortKey, setSortKey] = useState<string>(colunas[1]?.key || colunas[0]?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const dadosOrdenados = [...dados].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (typeof va === 'number' && typeof vb === 'number') {
      return sortDir === 'asc' ? va - vb : vb - va;
    }
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const formatarValor = (valor: any, tipo: string) => {
    if (tipo === 'percentual') return fmtPct(valor);
    if (tipo === 'numero') return typeof valor === 'number' && valor >= 1000 ? fmtInteiro(valor) : String(valor);
    return String(valor);
  };

  // Altura máxima do corpo da tabela (linhasVisiveis * ~40px por linha)
  const maxBodyHeight = linhasVisiveis * 40;

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057', overflow: 'hidden' }}>
      {titulo && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #495057' }}>
          <h3 style={{
            color: '#F8F9FA', fontSize: '1rem', fontWeight: 600, margin: 0,
            fontFamily: "'Poppins', sans-serif",
          }}>
            {titulo}
          </h3>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2D3238' }}>
              <th style={{
                color: '#6C757D', fontWeight: 600, padding: '10px 12px', textAlign: 'center',
                fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                borderBottom: '2px solid #495057', width: '40px',
              }}>
                #
              </th>
              {colunas.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  style={{
                    color: sortKey === col.key ? '#FF6600' : '#6C757D',
                    fontWeight: 600, padding: '10px 12px',
                    textAlign: col.tipo === 'texto' ? 'left' : 'right',
                    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em',
                    borderBottom: '2px solid #495057', cursor: 'pointer',
                    whiteSpace: 'nowrap', width: col.largura,
                    transition: 'color 0.15s',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div style={{
          maxHeight: maxBodyHeight,
          overflowY: dadosOrdenados.length > linhasVisiveis ? 'auto' : 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <tbody>
              {dadosOrdenados.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid #3D4349',
                  backgroundColor: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent'; }}
              >
                <td style={{
                  padding: '10px 12px', textAlign: 'center',
                  color: i < 3 ? destaqueCor : '#6C757D', fontWeight: i < 3 ? 700 : 400,
                  fontSize: '0.8rem',
                }}>
                  {i + 1}
                </td>
                {colunas.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '10px 12px',
                      textAlign: col.tipo === 'texto' ? 'left' : 'right',
                      color: col.tipo === 'texto' ? '#F8F9FA' : '#ADB5BD',
                      fontWeight: col.tipo === 'texto' ? 500 : 400,
                    }}
                  >
                    {formatarValor(row[col.key], col.tipo)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
