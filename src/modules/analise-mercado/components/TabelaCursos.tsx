/**
 * TabelaCursos — Análise por Curso (estilo RecebimentoFeeFundo)
 * Cards de resumo no topo + busca + tabela expansível com detalhamento
 */

import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Search, Filter, ChevronLeft, ArrowUpDown } from 'lucide-react';
import type { DadosCurso, MetricaAtiva } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';

const ITENS_POR_PAGINA = 10;

interface TabelaCursosProps {
  dados: DadosCurso[];
  areaFiltro?: string | null;
  metricasAtivas?: MetricaAtiva[];
}

type SortKey = keyof DadosCurso;

export default function TabelaCursos({ dados, areaFiltro, metricasAtivas = ['matriculas'] }: TabelaCursosProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('matriculas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [filtroArea, setFiltroArea] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const toggleExpandir = (nome: string) => {
    setExpandido(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Áreas disponíveis
  const areasUnicas = useMemo(() => {
    return Array.from(new Set(dados.map(c => c.area))).sort();
  }, [dados]);

  // Filtrar e ordenar
  const cursosFiltrados = useMemo(() => {
    let resultado = [...dados];
    if (areaFiltro) resultado = resultado.filter(c => c.area === areaFiltro);
    if (filtroArea) resultado = resultado.filter(c => c.area === filtroArea);
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter(c =>
        c.nome.toLowerCase().includes(termo) || c.area.toLowerCase().includes(termo)
      );
    }
    resultado.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return resultado;
  }, [dados, areaFiltro, filtroArea, busca, sortKey, sortDir]);

  // Paginação
  const totalPaginas = Math.ceil(cursosFiltrados.length / ITENS_POR_PAGINA);
  const cursosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return cursosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [cursosFiltrados, paginaAtual]);

  // Totais para KPI cards (sobre dados filtrados)
  const totais = useMemo(() => {
    const t = cursosFiltrados.reduce(
      (acc, c) => ({
        matriculas: acc.matriculas + c.matriculas,
        concluintes: acc.concluintes + c.concluintes,
        ingressantes: acc.ingressantes + c.ingressantes,
        turmas: acc.turmas + c.turmas,
        ies: acc.ies + c.instituicoes,
      }),
      { matriculas: 0, concluintes: 0, ingressantes: 0, turmas: 0, ies: 0 }
    );
    return {
      ...t,
      mediaPorTurma: t.turmas > 0 ? Math.round(t.matriculas / t.turmas) : 0,
    };
  }, [cursosFiltrados]);

  // Areas count
  const areasCounts = useMemo(() => {
    const map: Record<string, number> = {};
    cursosFiltrados.forEach(c => { map[c.area] = (map[c.area] || 0) + 1; });
    return map;
  }, [cursosFiltrados]);

  // Reset pagination on filter change
  const handleBuscaChange = (v: string) => { setBusca(v); setPaginaAtual(1); };
  const handleFiltroArea = (a: string | null) => { setFiltroArea(a); setPaginaAtual(1); };

  const thStyle = (key: string): React.CSSProperties => ({
    color: sortKey === key ? '#FF6600' : '#6C757D',
    fontWeight: 600, padding: '10px 8px',
    textAlign: 'right', fontSize: '0.66rem',
    textTransform: 'uppercase', letterSpacing: '0.03em',
    borderBottom: '2px solid #495057',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'color 0.15s',
    userSelect: 'none',
  });

  return (
    <div style={{ backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057', overflow: 'hidden' }}>

      {/* ═══ KPI Cards (resumo) ═══ */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid #495057',
      }}>
        {[
          { label: 'TOTAL CURSOS', valor: fmtInteiro(cursosFiltrados.length), cor: '#F8F9FA', destaque: false },
          { label: 'MATRICULADOS', valor: fmtNum(totais.matriculas), cor: CORES.azul, destaque: metricasAtivas.includes('matriculas') },
          { label: 'CONCLUINTES', valor: fmtNum(totais.concluintes), cor: CORES.verde, destaque: metricasAtivas.includes('concluintes') },
          { label: 'INGRESSANTES', valor: fmtNum(totais.ingressantes), cor: CORES.roxo, destaque: metricasAtivas.includes('ingressantes') },
        ].map((card, i) => (
          <div key={i} style={{
            padding: '14px 16px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid #495057' : 'none',
            backgroundColor: card.destaque ? `${card.cor}08` : 'transparent',
          }}>
            <p style={{
              color: '#6C757D', fontSize: '0.6rem', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px',
              fontFamily: "'Poppins', sans-serif",
            }}>
              {card.label}
            </p>
            <p style={{
              color: card.cor, fontWeight: 700, margin: 0,
              fontSize: i === 0 ? '1.3rem' : '0.95rem',
              fontFamily: i === 0 ? "'Orbitron', monospace" : "'Poppins', sans-serif",
            }}>
              {card.valor}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ Barra de Busca + Filtros ═══ */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid #495057',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#6C757D' }} />
          <input
            type="text"
            placeholder="Buscar por nome ou código do curso..."
            value={busca}
            onChange={e => handleBuscaChange(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 30px',
              backgroundColor: '#2D3238', border: '1px solid #495057',
              borderRadius: 6, color: '#F8F9FA', fontSize: '0.75rem',
              outline: 'none', fontFamily: "'Poppins', sans-serif",
            }}
          />
        </div>
        <button
          onClick={() => setMostrarFiltros(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6,
            backgroundColor: mostrarFiltros || filtroArea ? '#FF660020' : '#2D3238',
            border: `1px solid ${mostrarFiltros || filtroArea ? '#FF6600' : '#495057'}`,
            color: mostrarFiltros || filtroArea ? '#FF6600' : '#ADB5BD',
            fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          <Filter size={14} />
          Filtros
        </button>
      </div>

      {/* Painel de Filtros (colapsável) */}
      {mostrarFiltros && (
        <div style={{
          padding: '10px 20px', borderBottom: '1px solid #495057',
          backgroundColor: '#2D3238',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ color: '#6C757D', fontSize: '0.68rem', fontWeight: 600 }}>Área:</span>
          <button
            onClick={() => handleFiltroArea(null)}
            style={{
              padding: '4px 10px', borderRadius: 12, fontSize: '0.68rem', cursor: 'pointer',
              backgroundColor: !filtroArea ? '#FF660025' : 'transparent',
              border: `1px solid ${!filtroArea ? '#FF6600' : '#495057'}`,
              color: !filtroArea ? '#FF6600' : '#6C757D',
            }}
          >
            Todas ({dados.length})
          </button>
          {areasUnicas.map(area => (
            <button
              key={area}
              onClick={() => handleFiltroArea(filtroArea === area ? null : area)}
              style={{
                padding: '4px 10px', borderRadius: 12, fontSize: '0.68rem', cursor: 'pointer',
                backgroundColor: filtroArea === area ? '#FF660025' : 'transparent',
                border: `1px solid ${filtroArea === area ? '#FF6600' : '#495057'}`,
                color: filtroArea === area ? '#FF6600' : '#6C757D',
                whiteSpace: 'nowrap',
              }}
            >
              {area} ({areasCounts[area] || 0})
            </button>
          ))}
        </div>
      )}

      {/* ═══ Tabela ═══ */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2D3238' }}>
              <th
                onClick={() => handleSort('nome')}
                style={{
                  ...thStyle('nome'), textAlign: 'left',
                  position: 'sticky', left: 0, backgroundColor: '#2D3238', zIndex: 1,
                  minWidth: 200, paddingLeft: 14,
                }}
              >
                Curso {sortKey === 'nome' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th onClick={() => handleSort('area')} style={{ ...thStyle('area'), textAlign: 'left', minWidth: 90 }}>
                Área {sortKey === 'area' && (sortDir === 'asc' ? '▲' : '▼')}
              </th>
              {[
                { key: 'matriculas' as SortKey, label: 'MATRICULADOS', cor: CORES.azul },
                { key: 'concluintes' as SortKey, label: 'CONCLUINTES', cor: CORES.verde },
                { key: 'ingressantes' as SortKey, label: 'INGRESSANTES', cor: CORES.roxo },
                { key: 'instituicoes' as SortKey, label: 'Nº Ensino Superior', cor: '#ADB5BD' },
              ].map(col => (
                <th key={col.key} onClick={() => handleSort(col.key)} style={thStyle(col.key)}>
                  {col.label} {sortKey === col.key && (sortDir === 'asc' ? '▲' : '▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cursosPaginados.map((curso, i) => {
              const isOpen = expandido.has(curso.nome);
              const globalIdx = (paginaAtual - 1) * ITENS_POR_PAGINA + i;
              const bgEven = globalIdx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent';

              return (
                <React.Fragment key={`${curso.nome}-${curso.area}`}>
                  {/* ─── Linha principal ─── */}
                  <tr
                    onClick={() => toggleExpandir(curso.nome)}
                    style={{
                      borderBottom: isOpen ? 'none' : '1px solid #3D4349',
                      backgroundColor: isOpen ? 'rgba(255,102,0,0.04)' : bgEven,
                      cursor: 'pointer', transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.05)'; }}
                    onMouseLeave={e => { if (!isOpen) e.currentTarget.style.backgroundColor = isOpen ? 'rgba(255,102,0,0.04)' : bgEven; }}
                  >
                    <td style={{
                      padding: '10px 14px',
                      position: 'sticky', left: 0, zIndex: 1,
                      backgroundColor: isOpen ? '#363b42' : (globalIdx % 2 === 1 ? '#353a40' : '#343A40'),
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ color: CORES.laranja, display: 'flex' }}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <div>
                        <span style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.8rem' }}>
                          {curso.nome}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '10px 8px', textAlign: 'left',
                      fontSize: '0.68rem', color: '#6C757D',
                    }}>
                      <span style={{
                        backgroundColor: '#495057', padding: '2px 8px', borderRadius: 8,
                        fontSize: '0.64rem', color: '#ADB5BD', whiteSpace: 'nowrap',
                      }}>
                        {curso.area}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.azul, fontWeight: 600, fontSize: '0.78rem' }}>{fmtNum(curso.matriculas)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.verde, fontWeight: 600, fontSize: '0.78rem' }}>{fmtNum(curso.concluintes)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.roxo, fontWeight: 600, fontSize: '0.78rem' }}>{fmtNum(curso.ingressantes)}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.78rem' }}>{fmtInteiro(curso.instituicoes)}</td>
                  </tr>

                  {/* ─── Detalhe expandido ─── */}
                  {isOpen && (
                    <>
                      {/* BLOCO: Distribuição por Tipo de Instituição + Modalidade aninhada */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                        <td colSpan={2} style={{
                          padding: '8px 14px 4px 48px', color: '#6C757D',
                          fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          Por Tipo de Instituição
                        </td>
                        <td colSpan={4}></td>
                      </tr>

                      {/* ── Pública ── */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '4px 14px 4px 60px', color: CORES.azul, fontSize: '0.72rem', fontWeight: 500,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          ├ Pública
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.72rem' }}>
                          {fmtNum(curso.publica)}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.68rem' }}>
                          {fmtPct((curso.publica / (curso.matriculas || 1)) * 100)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                      {/* Pública → Presencial */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '3px 14px 3px 82px', color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          ├ Presencial
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.68rem' }}>
                          {fmtNum(curso.presencial)}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.64rem' }}>
                          {curso.presencial > 0 ? fmtPct((curso.presencial / (curso.matriculas || 1)) * 100) : '—'}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                      {/* Pública → EAD */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '3px 14px 3px 82px', color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          └ EAD
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.68rem' }}>
                          {fmtNum(curso.ead)}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.64rem' }}>
                          {curso.ead > 0 ? fmtPct((curso.ead / (curso.matriculas || 1)) * 100) : '—'}
                        </td>
                        <td colSpan={2}></td>
                      </tr>

                      {/* ── Privada ── */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '4px 14px 4px 60px', color: CORES.laranja, fontSize: '0.72rem', fontWeight: 500,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          ├ Privada
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.72rem' }}>
                          {fmtNum(curso.privada)}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.68rem' }}>
                          {fmtPct((curso.privada / (curso.matriculas || 1)) * 100)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                      {/* Privada → Presencial */}
                      <tr style={{ borderBottom: 'none', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '3px 14px 3px 82px', color: CORES.verde, fontSize: '0.68rem', fontWeight: 400,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          ├ Presencial
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.68rem' }}>
                          {fmtNum(curso.presencial)}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.64rem' }}>
                          {curso.presencial > 0 ? fmtPct((curso.presencial / (curso.matriculas || 1)) * 100) : '—'}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                      {/* Privada → EAD */}
                      <tr style={{ borderBottom: '1px solid #3D4349', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <td colSpan={2} style={{
                          padding: '3px 14px 3px 82px', color: CORES.roxo, fontSize: '0.68rem', fontWeight: 400,
                          position: 'sticky', left: 0, zIndex: 1, backgroundColor: '#343A40',
                        }}>
                          └ EAD
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.68rem' }}>
                          {fmtNum(curso.ead)}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: '#6C757D', fontSize: '0.64rem' }}>
                          {curso.ead > 0 ? fmtPct((curso.ead / (curso.matriculas || 1)) * 100) : '—'}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ═══ Paginação + rodapé ═══ */}
      <div style={{
        padding: '10px 20px', borderTop: '1px solid #495057',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: '#6C757D', fontSize: '0.72rem' }}>
          {cursosFiltrados.length} cursos listados
        </span>

        {totalPaginas > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              style={{
                padding: '4px 8px', borderRadius: 4,
                backgroundColor: 'transparent', border: '1px solid #495057',
                color: paginaAtual === 1 ? '#495057' : '#ADB5BD',
                cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
                fontSize: '0.72rem',
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem' }}>
              {paginaAtual} / {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              style={{
                padding: '4px 8px', borderRadius: 4,
                backgroundColor: 'transparent', border: '1px solid #495057',
                color: paginaAtual === totalPaginas ? '#495057' : '#ADB5BD',
                cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
                fontSize: '0.72rem',
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <span style={{ color: '#6C757D', fontSize: '0.72rem' }}>
          Total matrículas: <strong style={{ color: CORES.azul }}>{fmtNum(totais.matriculas)}</strong>
        </span>
      </div>
    </div>
  );
}
