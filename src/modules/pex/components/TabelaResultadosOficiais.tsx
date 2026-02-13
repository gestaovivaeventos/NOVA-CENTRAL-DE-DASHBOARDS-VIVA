/**
 * TabelaResultadosOficiais - Tabela com Meta x Realizado por Indicador
 * Layout: Meta acima do Realizado (empilhado) em 1 coluna por indicador
 * Highlight de coluna ao passar o mouse
 * Filtro de mês interno
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';

interface MetaCluster {
  cluster: string;
  vvr: string;
  vvrCarteira: string;
  percentualEndividamento: string;
  nps: string;
  percentualMcEntrega: string;
  enps: string;
  conformidade: string;
  reclameAqui: string;
  colaboradoresMais1Ano: string;
  estruturaOrganizacional: string;
  churn: string;
}

interface TabelaResultadosOficiaisProps {
  dadosResultados: any[];
  metas: MetaCluster[];
  quarterSelecionado: string;
  franquiasFiltradas?: string[];
}

const INDICADORES = [
  { id: 'vvr', label: 'VVR (Novas Vendas)', colunaResultado: 'VVR no Período', campoMeta: 'vvr', formato: 'moeda', inverso: false },
  { id: 'vvrCarteira', label: 'VVR Carteira', colunaResultado: 'VVR Carteria no periodo', campoMeta: 'vvrCarteira', formato: 'moeda', inverso: false, metaCalculada: true },
  { id: 'endividamento', label: '% Endividamento', colunaResultado: '% Endividamento', campoMeta: 'percentualEndividamento', formato: 'percentual', inverso: true },
  { id: 'nps', label: 'NPS', colunaResultado: 'NPS GERAL', campoMeta: 'nps', formato: 'numero', inverso: false },
  { id: 'margem', label: '% Margem (MC)', colunaResultado: '% Margem por evento', campoMeta: 'percentualMcEntrega', formato: 'percentual', inverso: false },
  { id: 'enps', label: 'E-NPS', colunaResultado: 'E-NPS', campoMeta: 'enps', formato: 'numero', inverso: false },
  { id: 'conformidades', label: 'Conformidades', colunaResultado: 'conformidades', campoMeta: 'conformidade', formato: 'percentual', inverso: false },
  { id: 'reclameAqui', label: 'Reclame Aqui', colunaResultado: 'RECLAME AQUI', campoMeta: 'reclameAqui', formato: 'numero', inverso: false },
  { id: 'colaboradores', label: 'Retenção (> 1 ano)', colunaResultado: 'colab_1ano', campoMeta: 'colaboradoresMais1Ano', formato: 'percentual', inverso: false },
  { id: 'estrutura', label: 'Estrutura', colunaResultado: 'ESTRUTURA', campoMeta: 'estruturaOrganizacional', formato: 'percentual', inverso: false },
  { id: 'churn', label: 'Churn', colunaResultado: 'CHURN MEDIO 12 MESES', campoMeta: 'churn', formato: 'percentual', inverso: true },
];

const NOMES_MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const MESES_POR_QUARTER: Record<string, number[]> = {
  '1': [1, 2, 3],
  '2': [4, 5, 6],
  '3': [7, 8, 9],
  '4': [10, 11, 12]
};

function parseMoeda(valor: string): number {
  if (!valor) return 0;
  return parseFloat(valor.toString().replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

function parsePercentual(valor: string): number {
  if (!valor) return 0;
  return parseFloat(valor.toString().replace('%', '').replace(',', '.').trim()) || 0;
}

function parseNumero(valor: string): number {
  if (!valor) return 0;
  return parseFloat(valor.toString().replace(/R\$\s*/g, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

function parseValor(valor: string, formato: string): number {
  switch (formato) {
    case 'moeda': return parseMoeda(valor);
    case 'percentual': return parsePercentual(valor);
    case 'numero': return parseNumero(valor);
    default: return parseNumero(valor);
  }
}

function parseMetaValor(valor: string): number {
  if (!valor) return 0;
  return parseFloat(valor) || 0;
}

function formatarValor(valor: number, formato: string): string {
  if (isNaN(valor)) return '-';
  switch (formato) {
    case 'moeda':
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percentual':
      return `${valor.toFixed(2).replace('.', ',')}%`;
    case 'numero':
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    default:
      return valor.toString();
  }
}

function parseData(data: string): { mes: number; ano: number } | null {
  if (!data) return null;
  const partes = data.split('/');
  if (partes.length < 3) return null;
  const mes = parseInt(partes[1], 10);
  const ano = parseInt(partes[2], 10);
  if (isNaN(mes) || isNaN(ano)) return null;
  return { mes, ano };
}

type OrdenacaoDir = 'asc' | 'desc' | null;

export default function TabelaResultadosOficiais({
  dadosResultados,
  metas,
  quarterSelecionado,
  franquiasFiltradas
}: TabelaResultadosOficiaisProps) {
  const [colunaOrdenada, setColunaOrdenada] = useState<string | null>(null);
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<OrdenacaoDir>(null);
  const [colunaHover, setColunaHover] = useState<string | null>(null);
  const [filtroMes, setFiltroMes] = useState<string>('');

  // Lista de meses disponíveis no quarter selecionado
  const listaMeses = useMemo(() => {
    if (!dadosResultados || dadosResultados.length === 0) return [];
    const mesesUnicos = new Set<string>();
    const mesesDoQuarter = MESES_POR_QUARTER[quarterSelecionado] || [];

    dadosResultados.forEach(item => {
      const parsed = parseData(item.data);
      if (parsed && mesesDoQuarter.includes(parsed.mes)) {
        mesesUnicos.add(`${NOMES_MESES[parsed.mes - 1]}/${parsed.ano}`);
      }
    });

    return Array.from(mesesUnicos).sort((a, b) => {
      const [mesA, anoA] = a.split('/');
      const [mesB, anoB] = b.split('/');
      if (anoA !== anoB) return parseInt(anoB) - parseInt(anoA);
      return NOMES_MESES.indexOf(mesB) - NOMES_MESES.indexOf(mesA);
    });
  }, [dadosResultados, quarterSelecionado]);

  // Auto-selecionar o mês mais recente quando muda o quarter
  useEffect(() => {
    if (listaMeses.length > 0) {
      setFiltroMes(listaMeses[0]);
    } else {
      setFiltroMes('');
    }
  }, [listaMeses]);

  // Parsear filtro de mês selecionado
  const filtroMesParsed = useMemo(() => {
    if (!filtroMes) return null;
    const [mesStr, anoStr] = filtroMes.split('/');
    const mesIdx = NOMES_MESES.indexOf(mesStr);
    if (mesIdx < 0) return null;
    return { mes: mesIdx + 1, ano: parseInt(anoStr) };
  }, [filtroMes]);

  // Filtrar registros pelo mês selecionado e pelas franquias filtradas
  const dadosFiltrados = useMemo(() => {
    if (!dadosResultados || dadosResultados.length === 0 || !filtroMesParsed) return [];
    return dadosResultados.filter(item => {
      const parsed = parseData(item.data);
      if (!parsed || parsed.mes !== filtroMesParsed.mes || parsed.ano !== filtroMesParsed.ano) return false;
      // Aplicar filtro de franquias (dos filtros laterais)
      if (franquiasFiltradas && franquiasFiltradas.length > 0) {
        const nomeFranquia = (item['Franquia'] || '').toString().trim();
        if (!franquiasFiltradas.includes(nomeFranquia)) return false;
      }
      return true;
    });
  }, [dadosResultados, filtroMesParsed, franquiasFiltradas]);

  // Construir dados tabulares
  const dadosTabela = useMemo(() => {
    return dadosFiltrados.map(item => {
      const franquia = item['Franquia'] || '';
      const cluster = (item['Grupo da franquia'] || '').toString().toUpperCase().trim();
      const tempoMedio = parseNumero(item['tempo_medio_carteira'] || '0');
      const metaCluster = metas.find(m => m.cluster.toUpperCase().trim() === cluster);
      const indicadoresResult: Record<string, { realizado: number; meta: number; formato: string }> = {};

      INDICADORES.forEach(ind => {
        const realizado = parseValor(item[ind.colunaResultado] || '', ind.formato);
        let meta = 0;
        if (metaCluster) {
          if (ind.metaCalculada && ind.id === 'vvrCarteira') {
            meta = (parseMetaValor(metaCluster.vvr) * tempoMedio) / 12;
          } else {
            meta = parseMetaValor((metaCluster as any)[ind.campoMeta] || '0');
          }
        }
        indicadoresResult[ind.id] = { realizado, meta, formato: ind.formato };
      });

      return { franquia, cluster, indicadores: indicadoresResult };
    });
  }, [dadosFiltrados, metas]);

  // Ordenar
  const dadosOrdenados = useMemo(() => {
    if (!colunaOrdenada || !direcaoOrdenacao) return dadosTabela;
    return [...dadosTabela].sort((a, b) => {
      if (colunaOrdenada === 'franquia') {
        return direcaoOrdenacao === 'asc' ? a.franquia.localeCompare(b.franquia) : b.franquia.localeCompare(a.franquia);
      }
      if (colunaOrdenada === 'cluster') {
        return direcaoOrdenacao === 'asc' ? a.cluster.localeCompare(b.cluster) : b.cluster.localeCompare(a.cluster);
      }
      const va = a.indicadores[colunaOrdenada]?.realizado || 0;
      const vb = b.indicadores[colunaOrdenada]?.realizado || 0;
      return direcaoOrdenacao === 'asc' ? va - vb : vb - va;
    });
  }, [dadosTabela, colunaOrdenada, direcaoOrdenacao]);

  const handleOrdenar = (coluna: string) => {
    if (colunaOrdenada === coluna) {
      if (direcaoOrdenacao === 'asc') setDirecaoOrdenacao('desc');
      else { setDirecaoOrdenacao(null); setColunaOrdenada(null); }
    } else {
      setColunaOrdenada(coluna);
      setDirecaoOrdenacao('asc');
    }
  };

  const IconeOrdenacao = ({ coluna }: { coluna: string }) => {
    if (colunaOrdenada !== coluna) return <span style={{ color: '#6c757d', marginLeft: '4px' }}>⇅</span>;
    if (direcaoOrdenacao === 'asc') return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↑</span>;
    return <span style={{ color: '#FF6600', marginLeft: '4px' }}>↓</span>;
  };

  // Highlight helpers
  const isHovered = useCallback((colId: string) => colunaHover === colId, [colunaHover]);
  const COL_HOVER_BG = '#2e3640';

  // Exportar
  const exportarParaExcel = () => {
    const linhas = dadosOrdenados.map(item => {
      const linha: any = { Franquia: item.franquia, Cluster: item.cluster };
      INDICADORES.forEach(ind => {
        const dados = item.indicadores[ind.id];
        if (dados) {
          linha[`${ind.label} - Meta`] = formatarValor(dados.meta, dados.formato);
          linha[`${ind.label} - Realizado`] = formatarValor(dados.realizado, dados.formato);
        }
      });
      return linha;
    });
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados Oficiais');
    XLSX.writeFile(wb, `PEX_Resultados_Oficiais_Q${quarterSelecionado}.xlsx`);
  };

  if (!filtroMes && listaMeses.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#adb5bd' }}>Nenhum dado de resultado oficial disponível para este quarter.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar: filtro de mês + exportar */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6c757d', fontSize: '0.85rem', fontWeight: 500 }}>Mês:</span>
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #495057',
              backgroundColor: '#1a1d21',
              color: '#FF6600',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
              minWidth: '160px'
            }}
          >
            {listaMeses.map(opcao => (
              <option key={opcao} value={opcao}>{opcao}</option>
            ))}
          </select>
        </div>
        <button
          onClick={exportarParaExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <Download size={16} />
          Exportar
        </button>
      </div>

      {dadosOrdenados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ color: '#adb5bd' }}>Nenhum dado disponível para o mês selecionado.</p>
        </div>
      ) : (
        <div style={{
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <table style={{ width: '100%', minWidth: '1100px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#1a1d21' }}>
                {/* Franquia */}
                <th
                  onClick={() => handleOrdenar('franquia')}
                  style={{
                    color: '#adb5bd', fontSize: '0.7rem', fontWeight: 600,
                    textTransform: 'uppercase', padding: '10px 6px', textAlign: 'center',
                    cursor: 'pointer', borderBottom: '2px solid #FF6600',
                    backgroundColor: '#1a1d21', minWidth: '130px',
                    position: 'sticky', left: 0, zIndex: 11
                  }}
                >
                  Franquia <IconeOrdenacao coluna="franquia" />
                </th>
                {/* Cluster */}
                <th
                  onClick={() => handleOrdenar('cluster')}
                  style={{
                    color: '#adb5bd', fontSize: '0.7rem', fontWeight: 600,
                    textTransform: 'uppercase', padding: '10px 4px', textAlign: 'center',
                    cursor: 'pointer', borderBottom: '2px solid #FF6600',
                    backgroundColor: '#1a1d21', minWidth: '80px'
                  }}
                >
                  Cluster <IconeOrdenacao coluna="cluster" />
                </th>
                {/* Indicadores: 1 coluna por indicador */}
                {INDICADORES.map(ind => (
                  <th
                    key={ind.id}
                    onClick={() => handleOrdenar(ind.id)}
                    onMouseEnter={() => setColunaHover(ind.id)}
                    onMouseLeave={() => setColunaHover(null)}
                    style={{
                      color: '#FF6600', fontSize: '0.63rem', fontWeight: 700,
                      textTransform: 'uppercase', padding: '10px 4px', textAlign: 'center',
                      cursor: 'pointer', borderBottom: '2px solid #FF6600',
                      backgroundColor: isHovered(ind.id) ? COL_HOVER_BG : '#1a1d21',
                      letterSpacing: '0.02em', minWidth: '110px',
                      borderRight: '1px solid #3a3d41',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {ind.label} <IconeOrdenacao coluna={ind.id} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dadosOrdenados.map((item, index) => {
                const isEven = index % 2 === 0;
                const bgBase = isEven ? '#343A40' : '#2c3136';

                return (
                  <tr
                    key={index}
                    style={{ transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.querySelectorAll<HTMLElement>('td').forEach(td => {
                        td.style.backgroundColor = '#3d4349';
                      });
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.querySelectorAll<HTMLElement>('td').forEach(td => {
                        td.style.backgroundColor = '';
                      });
                    }}
                  >
                    {/* Franquia */}
                    <td
                      style={{
                        padding: '5px 6px', fontSize: '0.75rem', color: '#F8F9FA',
                        borderBottom: '1px solid #444', fontWeight: 500, textAlign: 'left',
                        position: 'sticky', left: 0, zIndex: 1,
                        backgroundColor: bgBase
                      }}
                    >
                      {item.franquia}
                    </td>
                    {/* Cluster */}
                    <td
                      style={{
                        padding: '5px 4px', fontSize: '0.7rem', color: '#adb5bd',
                        borderBottom: '1px solid #444', textAlign: 'center',
                        backgroundColor: bgBase
                      }}
                    >
                      {item.cluster}
                    </td>
                    {/* Indicadores: Meta em cima / Real embaixo */}
                    {INDICADORES.map(ind => {
                      const dados = item.indicadores[ind.id];
                      const hovered = isHovered(ind.id);
                      const cellBg = hovered ? COL_HOVER_BG : bgBase;

                      if (!dados) {
                        return (
                          <td
                            key={ind.id}
                            onMouseEnter={() => setColunaHover(ind.id)}
                            onMouseLeave={() => setColunaHover(null)}
                            style={{
                              padding: '5px 4px', fontSize: '0.7rem', color: '#6c757d',
                              borderBottom: '1px solid #444', textAlign: 'center',
                              borderRight: '1px solid #3a3d41',
                              backgroundColor: cellBg,
                              transition: 'background-color 0.15s ease'
                            }}
                          >
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={ind.id}
                          onMouseEnter={() => setColunaHover(ind.id)}
                          onMouseLeave={() => setColunaHover(null)}
                          style={{
                            padding: '4px 5px',
                            borderBottom: '1px solid #444',
                            borderRight: '1px solid #3a3d41',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            backgroundColor: cellBg,
                            transition: 'background-color 0.15s ease'
                          }}
                        >
                          {/* Meta */}
                          <div style={{
                            fontSize: '0.72rem',
                            color: '#8a919a',
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            marginBottom: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '0.58rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Meta</span>
                            {formatarValor(dados.meta, dados.formato)}
                          </div>
                          {/* Realizado */}
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#F8F9FA',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontSize: '0.58rem', color: '#FF6600', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Real</span>
                            {formatarValor(dados.realizado, dados.formato)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
