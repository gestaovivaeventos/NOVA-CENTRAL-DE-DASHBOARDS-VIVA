/**
 * TabelaFranquias - Tabela com lista de franquias
 * Padrão Viva Eventos
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Franquia } from '../types';

interface TabelaFranquiasProps {
  franquias: Franquia[];
  titulo?: string;
}

type CampoOrdenacao = 'nome' | 'cidade' | 'estado' | 'status' | 'maturidade' | 'dataAbertura';

export default function TabelaFranquias({ franquias, titulo }: TabelaFranquiasProps) {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({
    campo: 'nome',
    direcao: 'asc'
  });

  const getStatusLabel = (franquia: Franquia) => {
    if (franquia.status === 'INATIVA') return 'Inativa';
    if (franquia.statusOperacao === 'IMPLANTACAO') return 'Em Implantação';
    if (franquia.maturidade === 'INCUBACAO') return `Incubação ${franquia.faseIncubacao}`;
    return 'Madura';
  };

  const getStatusCor = (franquia: Franquia) => {
    if (franquia.status === 'INATIVA') return '#dc3545';
    if (franquia.statusOperacao === 'IMPLANTACAO') return '#17a2b8';
    if (franquia.maturidade === 'INCUBACAO') return '#ffc107';
    return '#28a745';
  };

  const franquiasFiltradas = franquias
    .filter(f => 
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.cidade.toLowerCase().includes(busca.toLowerCase()) ||
      f.estado.toLowerCase().includes(busca.toLowerCase()) ||
      f.responsavel.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a, b) => {
      let valorA: string | number = '';
      let valorB: string | number = '';

      switch (ordenacao.campo) {
        case 'nome':
          valorA = a.nome;
          valorB = b.nome;
          break;
        case 'cidade':
          valorA = a.cidade;
          valorB = b.cidade;
          break;
        case 'estado':
          valorA = a.estado;
          valorB = b.estado;
          break;
        case 'status':
          valorA = getStatusLabel(a);
          valorB = getStatusLabel(b);
          break;
        case 'maturidade':
          valorA = a.maturidade || '';
          valorB = b.maturidade || '';
          break;
        case 'dataAbertura':
          valorA = a.dataAbertura;
          valorB = b.dataAbertura;
          break;
      }

      if (ordenacao.direcao === 'asc') {
        return valorA > valorB ? 1 : -1;
      }
      return valorA < valorB ? 1 : -1;
    });

  const handleOrdenacao = (campo: CampoOrdenacao) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const IconeOrdenacao = ({ campo }: { campo: CampoOrdenacao }) => {
    if (ordenacao.campo !== campo) return null;
    return ordenacao.direcao === 'asc' 
      ? <ChevronUp size={14} style={{ marginLeft: '4px' }} />
      : <ChevronDown size={14} style={{ marginLeft: '4px' }} />;
  };

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}>
      {/* Cabeçalho com título e busca */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #555',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h3 style={{
          color: '#adb5bd',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: 'Poppins, sans-serif',
          margin: 0,
        }}>
          {titulo || 'Lista de Franquias'} ({franquiasFiltradas.length})
        </h3>

        <div style={{ position: 'relative' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6c757d'
            }} 
          />
          <input
            type="text"
            placeholder="Buscar franquia..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              backgroundColor: '#212529',
              border: '1px solid #555',
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: '#F8F9FA',
              fontSize: '0.9rem',
              width: '220px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                { campo: 'nome' as CampoOrdenacao, label: 'Franquia' },
                { campo: 'cidade' as CampoOrdenacao, label: 'Cidade' },
                { campo: 'estado' as CampoOrdenacao, label: 'UF' },
                { campo: 'status' as CampoOrdenacao, label: 'Status' },
                { campo: 'dataAbertura' as CampoOrdenacao, label: 'Abertura' },
              ].map(col => (
                <th 
                  key={col.campo}
                  onClick={() => handleOrdenacao(col.campo)}
                  style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    color: '#adb5bd',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '2px solid #555',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {col.label}
                    <IconeOrdenacao campo={col.campo} />
                  </span>
                </th>
              ))}
              <th style={{
                textAlign: 'left',
                padding: '12px 8px',
                color: '#adb5bd',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '2px solid #555',
              }}>
                Responsável
              </th>
            </tr>
          </thead>
          <tbody>
            {franquiasFiltradas.map((franquia) => (
              <tr 
                key={franquia.id}
                style={{
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#3d4248';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#F8F9FA',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #444',
                  fontWeight: 500,
                }}>
                  {franquia.nome}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#adb5bd',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #444',
                }}>
                  {franquia.cidade}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#adb5bd',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #444',
                }}>
                  {franquia.estado}
                </td>
                <td style={{ 
                  padding: '12px 8px',
                  borderBottom: '1px solid #444',
                }}>
                  <span style={{
                    backgroundColor: getStatusCor(franquia),
                    color: franquia.maturidade === 'INCUBACAO' ? '#000' : '#fff',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    {getStatusLabel(franquia)}
                  </span>
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#adb5bd',
                  fontSize: '0.85rem',
                  borderBottom: '1px solid #444',
                }}>
                  {new Date(franquia.dataAbertura).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ 
                  padding: '12px 8px', 
                  color: '#adb5bd',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #444',
                }}>
                  {franquia.responsavel}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {franquiasFiltradas.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
          }}>
            Nenhuma franquia encontrada
          </div>
        )}
      </div>
    </div>
  );
}
