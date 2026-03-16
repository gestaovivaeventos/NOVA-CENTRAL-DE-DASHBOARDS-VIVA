/**
 * TabelaIndicadoresPEX - Tabela de Meta x Resultado dos indicadores PEX
 * Para franquias ativas no programa PEX dentro do módulo Gestão Rede
 * Mostra meta (da planilha de metas) e resultado (do HISTORICO RESULTADOS do PEX)
 * VVR vem da planilha de Vendas (ADESOES), demais indicadores do PEX
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MetaIndicadorUnidade, IndicadorConfig, Franquia } from '../types';
import { exportToExcel } from '../../vendas/utils/exportExcel';

interface TabelaIndicadoresPEXProps {
  resultados: any[];
  metas: MetaIndicadorUnidade[];
  vendasVVR?: Record<string, number>;
  franquias?: Franquia[];
}

const INDICADORES: IndicadorConfig[] = [
  { id: 'vvr', label: 'VVR', colunaResultado: 'VVR no Período', campoMeta: 'vvr', formato: 'moeda', inverso: false },
  { id: 'vvr_carteira', label: 'VVR Carteira', colunaResultado: 'VVR Carteria no periodo', campoMeta: 'vvr_carteira', formato: 'moeda', inverso: false },
  { id: 'endividamento', label: '% Endivid.', colunaResultado: '% Endividamento', campoMeta: 'endividamento', formato: 'percentual', inverso: true },
  { id: 'nps', label: 'NPS', colunaResultado: 'NPS GERAL', campoMeta: 'nps', formato: 'numero', inverso: false },
  { id: 'mc_entrega', label: '% MC Entrega', colunaResultado: '% Margem por evento', campoMeta: 'mc_entrega', formato: 'percentual', inverso: false },
  { id: 'enps', label: 'E-NPS', colunaResultado: 'E-NPS', campoMeta: 'enps', formato: 'numero', inverso: false },
  { id: 'conformidade', label: 'Conformid.', colunaResultado: 'conformidades', campoMeta: 'conformidade', formato: 'percentual', inverso: false },
  { id: 'reclame_aqui', label: 'Reclame Aqui', colunaResultado: 'RECLAME AQUI', campoMeta: 'reclame_aqui', formato: 'numero', inverso: false },
  { id: 'colab_1_ano', label: 'Colab. +1 Ano', colunaResultado: 'colab_1ano', campoMeta: 'colab_1_ano', formato: 'percentual', inverso: false },
  { id: 'estrutura', label: 'Estrutura Org.', colunaResultado: 'ESTRUTURA', campoMeta: 'estrutura_organizacional', formato: 'percentual', inverso: false },
  { id: 'churn', label: 'Churn', colunaResultado: 'CHURN MEDIO 12 MESES', campoMeta: 'churn', formato: 'percentual', inverso: true },
];

const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** Extrai mes/ano de uma data DD/MM/YYYY ou similar */
function parseData(data: string): { mes: number; ano: number } | null {
  if (!data) return null;
  const partes = data.split('/');
  if (partes.length >= 3) {
    // DD/MM/YYYY
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);
    if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) return { mes, ano };
  }
  if (partes.length === 2) {
    // MM/YYYY
    const mes = parseInt(partes[0], 10);
    const ano = parseInt(partes[1], 10);
    if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) return { mes, ano };
  }
  return null;
}

/** Normaliza nome de franquia para comparação */
function normalizarNome(nome: string): string {
  return (nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function parseValor(valor: string, formato: string): number {
  if (!valor) return 0;
  const clean = valor.toString().replace(/R\$\s*/g, '').replace(/%/g, '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(clean) || 0;
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

function getCor(resultado: number, meta: number, inverso: boolean): string {
  if (meta === 0 || isNaN(resultado)) return '#6c757d';
  const atingimento = inverso ? (meta / resultado) * 100 : (resultado / meta) * 100;
  if (atingimento >= 100) return '#27ae60';
  if (atingimento >= 85) return '#f39c12';
  return '#c0392b';
}

function getAtingimento(resultado: number, meta: number, inverso: boolean): number {
  if (meta === 0 || isNaN(resultado)) return 0;
  return inverso ? (meta / resultado) * 100 : (resultado / meta) * 100;
}

/** Formata mes/ano como "jan/2026" */
function formatMesAno(mes: number, ano: number): string {
  return `${ABREV_MESES[mes - 1]}/${ano}`;
}

/** Label para o dropdown: "Janeiro/2026" */
function labelMesAno(mes: number, ano: number): string {
  const nome = NOMES_MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase() + nome.slice(1)}/${ano}`;
}

export default function TabelaIndicadoresPEX({ resultados, metas, vendasVVR = {}, franquias = [] }: TabelaIndicadoresPEXProps) {
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [colunaHover, setColunaHover] = useState<string | null>(null);
  const tabelaRef = useRef<HTMLDivElement>(null);

  // Map de cluster por unidade (normalizado) para verificar incubação 0
  const clusterPorUnidade = useMemo(() => {
    const map = new Map<string, string>();
    franquias.forEach(f => {
      map.set(normalizarNome(f.nome), f.cluster || '');
    });
    return map;
  }, [franquias]);

  const isIncubacao0 = (unidade: string): boolean => {
    const cluster = clusterPorUnidade.get(normalizarNome(unidade)) || '';
    return cluster.toUpperCase().includes('INCUBA') && cluster.includes('0');
  };

  // Unidades ativas no PEX (da planilha de metas)
  // Considera ativa toda unidade que NÃO esteja explicitamente marcada como "NÃO"
  const unidadesAtivas = useMemo(() => {
    return metas
      .filter(m => {
        const v = (m.ativo_pex || '').trim().toUpperCase();
        return v !== 'NÃO' && v !== 'NAO' && v !== 'FALSE' && v !== '0';
      })
      .map(m => m.nm_unidade?.trim())
      .filter(Boolean);
  }, [metas]);

  // Unidades únicas (deduplica)
  const unidadesUnicas = useMemo(() => {
    return [...new Set(unidadesAtivas)];
  }, [unidadesAtivas]);

  // Meses disponíveis: combina meses de resultados PEX + meses de metas
  const mesesDisponiveis = useMemo(() => {
    const mesesSet = new Map<string, { mes: number; ano: number }>();

    // Meses dos resultados PEX
    resultados.forEach((item: any) => {
      const parsed = parseData(item.data || item.Data || '');
      if (parsed) {
        const key = `${parsed.mes}/${parsed.ano}`;
        mesesSet.set(key, parsed);
      }
    });

    // Meses das metas
    metas.forEach((item) => {
      const parsed = parseData(item.data || '');
      if (parsed) {
        const key = `${parsed.mes}/${parsed.ano}`;
        mesesSet.set(key, parsed);
      }
    });

    const arr = Array.from(mesesSet.values());
    // Ordenar cronologicamente (mais antigo primeiro: jan → dez)
    arr.sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    return arr;
  }, [resultados, metas]);

  // Auto-selecionar o mês anterior ao mês vigente
  useEffect(() => {
    if (mesesDisponiveis.length > 0 && !filtroMes) {
      const hoje = new Date();
      let mesAnterior = hoje.getMonth(); // getMonth() é 0-based, então março=2 → mesAnterior=2 = fevereiro
      let anoAnterior = hoje.getFullYear();
      if (mesAnterior === 0) {
        mesAnterior = 12;
        anoAnterior--;
      }
      // Tentar encontrar o mês anterior ao vigente
      const encontrado = mesesDisponiveis.find(p => p.mes === mesAnterior && p.ano === anoAnterior);
      if (encontrado) {
        setFiltroMes(`${encontrado.mes}/${encontrado.ano}`);
      } else {
        // Fallback: último mês disponível
        const p = mesesDisponiveis[mesesDisponiveis.length - 1];
        setFiltroMes(`${p.mes}/${p.ano}`);
      }
    }
  }, [mesesDisponiveis, filtroMes]);

  // Dados processados por unidade
  const dadosPorUnidade = useMemo(() => {
    if (!filtroMes || unidadesUnicas.length === 0) return [];

    const [mesStr, anoStr] = filtroMes.split('/');
    const mesNum = parseInt(mesStr);
    const anoNum = parseInt(anoStr);

    // Filtrar resultados PEX do mês selecionado
    const resultadosMes = resultados.filter((item: any) => {
      const parsed = parseData(item.data || item.Data || '');
      return parsed && parsed.mes === mesNum && parsed.ano === anoNum;
    });

    // Indexar resultados por nome normalizado para matching
    const resultadosMap = new Map<string, any>();
    resultadosMes.forEach((r: any) => {
      const nome = normalizarNome(r['Franquia'] || r['franquia'] || r['nm_unidade'] || '');
      if (nome) resultadosMap.set(nome, r);
    });

    // Metas por unidade (mais recente ou do mês)
    const metasPorUnidade: Record<string, MetaIndicadorUnidade> = {};
    metas.forEach(m => {
      const key = m.nm_unidade?.trim();
      if (!key) return;
      const parsed = parseData(m.data || '');
      // Preferir meta do mês selecionado, senão pegar qualquer uma
      if (parsed && parsed.mes === mesNum && parsed.ano === anoNum) {
        metasPorUnidade[key] = m;
      } else if (!metasPorUnidade[key]) {
        metasPorUnidade[key] = m;
      }
    });

    // Montar dados por unidade ativa
    return unidadesUnicas
      .filter(u => u.toLowerCase().includes(busca.toLowerCase()))
      .map(unidade => {
        const nomeNorm = normalizarNome(unidade);
        const resultado = resultadosMap.get(nomeNorm);
        const meta = metasPorUnidade[unidade.trim()];

        // VVR de vendas: chave = "unidade_lower|MM/YYYY"
        const mesKey = `${unidade.toLowerCase().trim()}|${String(mesNum).padStart(2, '0')}/${anoNum}`;
        const vvrVendas = vendasVVR[mesKey] || 0;

        const indicadoresData = INDICADORES.map(ind => {
          let valorResultado = 0;
          let temResultado = false;

          if (ind.id === 'vvr') {
            // VVR vem da planilha de vendas
            valorResultado = vvrVendas;
            temResultado = vvrVendas > 0;
          } else if (resultado) {
            valorResultado = parseValor(resultado[ind.colunaResultado] || '', ind.formato);
            temResultado = !!(resultado[ind.colunaResultado]);
          }

          const valorMeta = meta ? parseValor((meta as unknown as Record<string, string>)[ind.campoMeta] || '', ind.formato) : 0;

          return {
            ...ind,
            resultado: valorResultado,
            meta: valorMeta,
            temResultado,
            temMeta: !!meta && !!(meta as unknown as Record<string, string>)[ind.campoMeta],
          };
        });

        return {
          unidade,
          indicadores: indicadoresData,
        };
      });
  }, [filtroMes, resultados, metas, unidadesUnicas, busca, vendasVVR]);

  // Evitar que scroll da tabela propague
  useEffect(() => {
    const el = tabelaRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if ((e.deltaY < 0 && scrollTop <= 0) || (e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight - 1)) {
        e.preventDefault();
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  if (metas.length === 0 && resultados.length === 0) {
    return (
      <div style={{
        backgroundColor: '#343A40',
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#adb5bd', fontFamily: 'Poppins, sans-serif' }}>
          Sem dados de indicadores disponíveis. Configure as metas na página de Metas.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '2px solid #FF6600',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <h3 style={{
          color: '#adb5bd',
          fontSize: '1rem',
          fontWeight: 600,
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          margin: 0,
        }}>
          Indicadores Rede — Meta x Resultado
        </h3>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar unidade..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#212529',
              color: '#F8F9FA',
              border: '1px solid #555',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
              width: '180px',
            }}
          />
          {/* Exportar Excel */}
          <button
            onClick={() => {
              if (!dadosPorUnidade.length) return;
              const [mesStr, anoStr] = filtroMes.split('/');
              const mesLabel = labelMesAno(parseInt(mesStr), parseInt(anoStr));
              const headers = ['Unidade', ...INDICADORES.flatMap(ind => [`${ind.label} (Meta)`, `${ind.label} (Real)`, `${ind.label} (% Ating.)`])];
              const rows = dadosPorUnidade.map(item => [
                item.unidade,
                ...item.indicadores.flatMap(ind => {
                  const ating = ind.temResultado && ind.temMeta && ind.meta > 0
                    ? getAtingimento(ind.resultado, ind.meta, ind.inverso)
                    : 0;
                  return [
                    ind.temMeta ? formatarValor(ind.meta, ind.formato) : '-',
                    ind.temResultado ? formatarValor(ind.resultado, ind.formato) : '-',
                    ind.temResultado && ind.temMeta && ind.meta > 0 ? `${ating.toFixed(1)}%` : '-',
                  ];
                }),
              ]);
              exportToExcel({
                filename: `indicadores_pex_${mesLabel.replace('/', '_')}`,
                sheetName: `PEX ${mesLabel.replace('/', '-')}`,
                headers,
                data: rows,
              });
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: 'transparent',
              border: '1px solid #555',
              borderRadius: '6px',
              color: '#adb5bd',
              fontSize: '0.78rem',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FF6600';
              e.currentTarget.style.color = '#FF6600';
              e.currentTarget.style.backgroundColor = 'rgba(255,102,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.color = '#adb5bd';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar
          </button>
          {/* Filtro de mês */}
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#212529',
              color: '#F8F9FA',
              border: '1px solid #555',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontFamily: 'Poppins, sans-serif',
              outline: 'none',
            }}
          >
            {mesesDisponiveis.map(p => (
              <option key={`${p.mes}/${p.ano}`} value={`${p.mes}/${p.ano}`}>
                {labelMesAno(p.mes, p.ano)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div
        ref={tabelaRef}
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          maxHeight: '600px',
        }}
      >
        <table style={{
          width: '100%',
          minWidth: '1400px',
          borderCollapse: 'collapse',
          fontFamily: 'Poppins, sans-serif',
        }}>
          <thead>
            <tr>
              <th style={{
                position: 'sticky',
                top: 0,
                left: 0,
                zIndex: 3,
                backgroundColor: '#2a2f36',
                padding: '10px 16px',
                textAlign: 'left',
                color: '#FF6600',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid #555',
                minWidth: '180px',
              }}>
                Unidade
              </th>
              <th style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                backgroundColor: '#2a2f36',
                padding: '10px 4px',
                textAlign: 'center',
                color: '#adb5bd',
                fontSize: '0.65rem',
                fontWeight: 600,
                borderBottom: '1px solid #555',
                width: '40px',
              }}>
                {/* M/R label */}
              </th>
              {INDICADORES.map(ind => (
                <th
                  key={ind.id}
                  onMouseEnter={() => setColunaHover(ind.id)}
                  onMouseLeave={() => setColunaHover(null)}
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    backgroundColor: colunaHover === ind.id ? '#3a4047' : '#2a2f36',
                    padding: '10px 8px',
                    textAlign: 'center',
                    color: '#FF6600',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    borderBottom: '1px solid #555',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {ind.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosPorUnidade.length === 0 ? (
              <tr>
                <td
                  colSpan={INDICADORES.length + 2}
                  style={{ padding: '40px', textAlign: 'center', color: '#adb5bd' }}
                >
                  Nenhuma unidade ativa no PEX encontrada para o período selecionado.
                </td>
              </tr>
            ) : (
              dadosPorUnidade.map((item, idx) => (
                <React.Fragment key={item.unidade}>
                  {/* Linha META */}
                  <tr style={{
                    backgroundColor: idx % 2 === 0 ? '#23272d' : '#2a2f36',
                  }}>
                    <td
                      rowSpan={2}
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 1,
                        backgroundColor: idx % 2 === 0 ? '#23272d' : '#2a2f36',
                        padding: '8px 16px',
                        color: '#F8F9FA',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderBottom: '2px solid #343A40',
                        verticalAlign: 'middle',
                      }}
                    >
                      <div>
                        {item.unidade}
                        {isIncubacao0(item.unidade) && (
                          <div style={{
                            color: '#e67e22',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                          }}>
                            Não participa do PEX
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{
                      padding: '4px 8px',
                      textAlign: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: '#3498db',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Meta
                    </td>
                    {item.indicadores.map(ind => (
                      <td
                        key={`meta-${ind.id}`}
                        onMouseEnter={() => setColunaHover(ind.id)}
                        onMouseLeave={() => setColunaHover(null)}
                        style={{
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '0.72rem',
                          color: '#3498db',
                          backgroundColor: colunaHover === ind.id ? 'rgba(52,152,219,0.08)' : 'transparent',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        {ind.temMeta ? formatarValor(ind.meta, ind.formato) : '-'}
                      </td>
                    ))}
                  </tr>
                  {/* Linha RESULTADO */}
                  <tr style={{
                    backgroundColor: idx % 2 === 0 ? '#23272d' : '#2a2f36',
                    borderBottom: '2px solid #343A40',
                  }}>
                    <td style={{
                      padding: '4px 8px',
                      textAlign: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      color: '#adb5bd',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Real
                    </td>
                    {item.indicadores.map(ind => {
                      const cor = ind.temResultado && ind.temMeta
                        ? getCor(ind.resultado, ind.meta, ind.inverso)
                        : '#6c757d';
                      const atingimento = ind.temResultado && ind.temMeta
                        ? getAtingimento(ind.resultado, ind.meta, ind.inverso)
                        : 0;
                      const showTooltip = ind.temResultado && ind.temMeta && ind.meta > 0;
                      return (
                        <td
                          key={`result-${ind.id}`}
                          onMouseEnter={() => setColunaHover(ind.id)}
                          onMouseLeave={() => setColunaHover(null)}
                          title={showTooltip ? `Atingimento: ${atingimento.toFixed(1)}%` : undefined}
                          style={{
                            padding: '4px 8px',
                            textAlign: 'center',
                            fontSize: '0.72rem',
                            color: cor,
                            fontWeight: 600,
                            backgroundColor: colunaHover === ind.id ? 'rgba(52,152,219,0.08)' : 'transparent',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          {ind.temResultado ? formatarValor(ind.resultado, ind.formato) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
