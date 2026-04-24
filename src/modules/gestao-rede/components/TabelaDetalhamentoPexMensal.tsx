/**
 * TabelaDetalhamentoPexMensal
 * Seção colapsável com evolução mensal da nota PEX por franquia.
 * - Filtro de ano exclusivo desta tabela
 * - Linha principal: nota simples + etiqueta de saúde + % evolução
 * - Clique na linha da franquia expande TODOS os indicadores do ano em formato matriz:
 *     linhas = indicadores do HISTORICO RESULTADOS
 *     colunas = Jan..Dez com valor + % evolução vs mês anterior
 *
 * Fontes:
 *  - Nota PEX + Saúde mensal: BASE GESTAO REDE (via /api/gestao-rede/historico-mensal)
 *  - Indicadores do drilldown: HISTORICO RESULTADOS
 */

import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { Franquia, SaudeFranquia, FiltrosGestaoRede } from '../types';
import type { HistoricoMensalItem } from '../hooks/useHistoricoMensalPex';

interface Props {
  resultados: any[];
  franquias: Franquia[];
  historicoMensal: HistoricoMensalItem[];
  filtros?: Partial<FiltrosGestaoRede>;
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const INDICADORES_DRILL: { id: string; label: string; coluna: string; formato: 'moeda' | 'percentual' | 'numero'; inverso: boolean }[] = [
  { id: 'vvr',           label: 'VVR',              coluna: 'VVR no Período',         formato: 'moeda',      inverso: false },
  { id: 'vvr_carteira',  label: 'VVR Carteira',     coluna: 'VVR Carteria no periodo',formato: 'moeda',      inverso: false },
  { id: 'endividamento', label: '% Endividamento',  coluna: '% Endividamento',        formato: 'percentual', inverso: true  },
  { id: 'nps',           label: 'NPS',              coluna: 'NPS GERAL',              formato: 'numero',     inverso: false },
  { id: 'mc_entrega',    label: '% MC Entrega',     coluna: '% Margem por evento',    formato: 'percentual', inverso: false },
  { id: 'enps',          label: 'E-NPS',            coluna: 'E-NPS',                  formato: 'numero',     inverso: false },
  { id: 'conformidade',  label: 'Conformidade',     coluna: 'conformidades',          formato: 'percentual', inverso: false },
  { id: 'reclame_aqui',  label: 'Reclame Aqui',     coluna: 'RECLAME AQUI',           formato: 'numero',     inverso: false },
  { id: 'colab_1_ano',   label: 'Colab. +1 Ano',    coluna: 'colab_1ano',             formato: 'percentual', inverso: false },
  { id: 'estrutura',     label: 'Estrutura Org.',   coluna: 'ESTRUTURA',              formato: 'percentual', inverso: false },
  { id: 'churn',         label: 'Churn',            coluna: 'CHURN MEDIO 12 MESES',   formato: 'percentual', inverso: true  },
];

function parseDataResultado(data: string): { mes: number; ano: number } | null {
  if (!data) return null;
  const partes = String(data).split('/');
  if (partes.length >= 3) {
    const mes = parseInt(partes[1], 10);
    const ano = parseInt(partes[2], 10);
    if (!isNaN(mes) && !isNaN(ano) && mes >= 1 && mes <= 12) return { mes, ano };
  }
  return null;
}

function parseValor(valor: any): number {
  if (valor === undefined || valor === null || valor === '') return NaN;
  const clean = valor.toString()
    .replace(/R\$\s*/g, '')
    .replace(/%/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const n = parseFloat(clean);
  return isNaN(n) ? NaN : n;
}

function formatarValor(valor: number, formato: string): string {
  if (isNaN(valor)) return '-';
  switch (formato) {
    case 'moeda':
      if (Math.abs(valor) >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(2).replace('.', ',')}M`;
      if (Math.abs(valor) >= 1_000)     return `R$ ${(valor / 1_000).toFixed(1).replace('.', ',')}k`;
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    case 'percentual':
      return `${valor.toFixed(1).replace('.', ',')}%`;
    case 'numero':
      return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    default:
      return String(valor);
  }
}

function valorCompleto(valor: number, formato: string): string {
  if (isNaN(valor)) return '';
  switch (formato) {
    case 'moeda':
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
    case 'percentual':
      return `${valor.toFixed(2).replace('.', ',')}%`;
    case 'numero':
      return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    default:
      return String(valor);
  }
}

function normalizar(nome: string): string {
  return (nome || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

const CORES_SAUDE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  TOP_PERFORMANCE: { bg: '#1a4b6e', border: '#2980b9', text: '#FFFFFF', label: 'Top Performance' },
  PERFORMANDO:     { bg: '#1e5631', border: '#27ae60', text: '#FFFFFF', label: 'Performando' },
  EM_CONSOLIDACAO: { bg: '#7a4a0a', border: '#e67e22', text: '#FFFFFF', label: 'Em Consolidação' },
  ATENCAO:         { bg: '#9a8a1a', border: '#f1c40f', text: '#1a1a1a', label: 'Atenção' },
  UTI_RECUPERACAO: { bg: '#5a2a2a', border: '#cb4335', text: '#FFFFFF', label: 'UTI Recuperação' },
  UTI_REPASSE:     { bg: '#4a1a2a', border: '#a93253', text: '#FFFFFF', label: 'UTI Repasse' },
};

function classificarSaudePorNota(nota: number): SaudeFranquia | null {
  if (isNaN(nota) || nota <= 0) return null;
  if (nota >= 95) return 'TOP_PERFORMANCE';
  if (nota >= 85) return 'PERFORMANDO';
  if (nota >= 75) return 'EM_CONSOLIDACAO';
  if (nota >= 60) return 'ATENCAO';
  return 'UTI_RECUPERACAO';
}

function corNota(nota: number): string {
  if (isNaN(nota) || nota <= 0) return '#6c757d';
  if (nota >= 95) return '#3498db';
  if (nota >= 85) return '#27ae60';
  if (nota >= 75) return '#e67e22';
  if (nota >= 60) return '#f1c40f';
  return '#cb4335';
}

function calcularEvolucao(atual: number, anterior: number, inverso = false): number | null {
  if (isNaN(atual) || isNaN(anterior) || anterior === 0) return null;
  const variacao = ((atual - anterior) / Math.abs(anterior)) * 100;
  return inverso ? -variacao : variacao;
}

function corEvolucao(variacao: number | null): string {
  if (variacao === null) return '#6c757d';
  if (variacao > 0.5) return '#27ae60';
  if (variacao < -0.5) return '#c0392b';
  return '#adb5bd';
}

function IconeEvolucao({ variacao, size = 10 }: { variacao: number | null; size?: number }) {
  if (variacao === null) return <Minus size={size} />;
  if (variacao > 0.5) return <TrendingUp size={size} />;
  if (variacao < -0.5) return <TrendingDown size={size} />;
  return <Minus size={size} />;
}

export default function TabelaDetalhamentoPexMensal({ resultados, franquias, historicoMensal, filtros }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [franquiasExpandidas, setFranquiasExpandidas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState('');

  const anosDisponiveis = useMemo(() => {
    const set = new Set<number>();
    historicoMensal.forEach(h => set.add(h.ano));
    resultados.forEach(r => {
      const p = parseDataResultado(r.data || r.Data || '');
      if (p) set.add(p.ano);
    });
    const arr = Array.from(set).sort((a, b) => b - a);
    if (arr.length === 0) arr.push(new Date().getFullYear());
    return arr;
  }, [historicoMensal, resultados]);

  const [anoSelecionado, setAnoSelecionado] = useState<number>(() => new Date().getFullYear());

  React.useEffect(() => {
    if (anosDisponiveis.length > 0 && !anosDisponiveis.includes(anoSelecionado)) {
      setAnoSelecionado(anosDisponiveis[0]);
    }
  }, [anosDisponiveis, anoSelecionado]);

  const pexPorChave = useMemo(() => {
    const map = new Map<string, HistoricoMensalItem>();
    historicoMensal.forEach(h => {
      const nome = normalizar(h.nm_unidade);
      if (!nome) return;
      map.set(`${nome}|${h.mes}|${h.ano}`, h);
    });
    return map;
  }, [historicoMensal]);

  const resultadosPorChave = useMemo(() => {
    const map = new Map<string, any>();
    resultados.forEach(r => {
      const p = parseDataResultado(r.data || r.Data || '');
      if (!p) return;
      const nome = normalizar(r['Franquia'] || r['franquia'] || r['nm_unidade'] || '');
      if (!nome) return;
      map.set(`${nome}|${p.mes}|${p.ano}`, r);
    });
    return map;
  }, [resultados]);

  const franquiasOperacao = useMemo(() => {
    const isIncubacao0 = (f: Franquia) => {
      const c = (f.cluster || '').toUpperCase().trim();
      return c.includes('INCUBA') && c.includes('0');
    };
    return franquias
      .filter(f => f.status === 'ATIVA'
        && f.statusInativacao !== 'EM_ENCERRAMENTO'
        && f.maturidade !== 'IMPLANTACAO'
        && !isIncubacao0(f))
      // Filtros avançados da sidebar (mesma lógica de TabelaFranquias)
      .filter(f => {
        if (filtros?.maturidade && filtros.maturidade.length > 0) {
          if (!filtros.maturidade.includes(f.maturidade)) return false;
        }
        if (filtros?.classificacao && filtros.classificacao.length > 0) {
          if (!filtros.classificacao.includes(f.saude)) return false;
        }
        if (filtros?.flags && filtros.flags.length > 0) {
          const temFlag = filtros.flags.some(flag => {
            if (flag === 'socioOperador') return f.flags?.socioOperador;
            if (flag === 'timeCritico')   return f.flags?.timeCritico;
            if (flag === 'governanca')    return f.flags?.governanca;
            if (flag === 'semFlags')      return !f.flags?.socioOperador && !f.flags?.timeCritico && !f.flags?.governanca;
            return false;
          });
          if (!temFlag) return false;
        }
        if (filtros?.consultorResponsavel && filtros.consultorResponsavel.length > 0) {
          if (!f.consultorResponsavel || !filtros.consultorResponsavel.includes(f.consultorResponsavel)) return false;
        }
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [franquias, filtros]);

  const dados = useMemo(() => {
    return franquiasOperacao.map(f => {
      const nomeNorm = normalizar(f.nome);
      const meses = Array.from({ length: 12 }, (_, i) => {
        const mes = i + 1;
        const mesAnt = mes === 1 ? 12 : mes - 1;
        const anoAnt = mes === 1 ? anoSelecionado - 1 : anoSelecionado;

        const pexAtual = pexPorChave.get(`${nomeNorm}|${mes}|${anoSelecionado}`);
        const pexAnt = pexPorChave.get(`${nomeNorm}|${mesAnt}|${anoAnt}`);

        const notaRaw = pexAtual?.pontuacao_pex ?? NaN;
        const notaAnt = pexAnt?.pontuacao_pex ?? NaN;

        const saude = pexAtual?.saude && pexAtual.saude !== 'SEM_AVALIACAO'
          ? pexAtual.saude
          : classificarSaudePorNota(notaRaw);

        const evolucao = calcularEvolucao(notaRaw, notaAnt);

        const regResultado = resultadosPorChave.get(`${nomeNorm}|${mes}|${anoSelecionado}`);
        const regResultadoAnt = resultadosPorChave.get(`${nomeNorm}|${mesAnt}|${anoAnt}`);

        return {
          mes,
          mesAnt,
          anoAnt,
          registro: regResultado,
          registroAnterior: regResultadoAnt,
          nota: notaRaw,
          notaAnterior: notaAnt,
          evolucao,
          saude,
        };
      });
      return { franquia: f, meses };
    }).filter(d => busca.trim() === '' || d.franquia.nome.toLowerCase().includes(busca.trim().toLowerCase()));
  }, [franquiasOperacao, pexPorChave, resultadosPorChave, anoSelecionado, busca]);

  const toggleFranquia = (id: string) => {
    setFranquiasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  return (
    <div style={{
      backgroundColor: '#343A40',
      borderRadius: '12px',
      marginBottom: '24px',
      overflow: 'hidden',
    }}>
      {/* Header colapsável */}
      <button
        onClick={() => setExpandido(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderBottom: expandido ? '1px solid #3a3d41' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={20} color="#FF6600" />
          <span style={{
            color: '#adb5bd',
            fontSize: '0.85rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'Poppins, sans-serif',
          }}>
            Detalhamento PEX Mensal por Franquia
          </span>
        </div>
        <div style={{ color: '#6c757d' }}>
          {expandido ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {expandido && (
        <div style={{ padding: '16px 20px' }}>
          {/* Filtros */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#6c757d', fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif' }}>
                Filtro de ano (exclusivo desta tabela)
              </span>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value, 10))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#212529',
                  color: '#F8F9FA',
                  border: '1px solid #FF6600',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {anosDisponiveis.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Buscar franquia..."
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
                width: '220px',
              }}
            />
          </div>

          {/* Tabela */}
          <div style={{ overflowX: 'auto', maxHeight: '700px', overflowY: 'auto' }}>
            <table style={{
              width: '100%',
              minWidth: '1700px',
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
                    minWidth: '200px',
                  }}>
                    Franquia
                  </th>
                  {MESES_ABREV.map((m) => (
                    <th key={m} style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      backgroundColor: '#2a2f36',
                      padding: '10px 4px',
                      textAlign: 'center',
                      color: '#adb5bd',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #555',
                      minWidth: '125px',
                    }}>
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dados.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#adb5bd',
                    }}>
                      Nenhuma franquia encontrada.
                    </td>
                  </tr>
                ) : (
                  dados.map((d, idx) => {
                    const chave = d.franquia.id;
                    const estaExpandido = franquiasExpandidas.has(chave);
                    const rowBg = idx % 2 === 0 ? '#23272d' : '#2a2f36';
                    return (
                      <React.Fragment key={chave}>
                        {/* LINHA PRINCIPAL — nota simples + etiqueta saúde + evolução */}
                        <tr
                          onClick={() => toggleFranquia(chave)}
                          style={{ backgroundColor: rowBg, cursor: 'pointer' }}
                        >
                          <td style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 1,
                            backgroundColor: rowBg,
                            padding: '10px 16px',
                            color: '#F8F9FA',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            borderBottom: '1px solid #343A40',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {estaExpandido
                                ? <ChevronDown size={14} color="#FF6600" />
                                : <ChevronRight size={14} color="#6c757d" />}
                              <span>{d.franquia.nome}</span>
                            </div>
                          </td>
                          {d.meses.map((m) => {
                            const saudeKey = m.saude as string | null;
                            const cor = saudeKey ? CORES_SAUDE[saudeKey] : null;
                            const temNota = !isNaN(m.nota) && m.nota > 0;
                            return (
                              <td
                                key={m.mes}
                                style={{
                                  padding: '8px 4px',
                                  textAlign: 'center',
                                  borderBottom: '1px solid #343A40',
                                  verticalAlign: 'top',
                                  fontFamily: 'Poppins, sans-serif',
                                }}
                              >
                                {!temNota ? (
                                  <div style={{
                                    minHeight: '56px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    paddingTop: '4px',
                                  }}>
                                    <span style={{ color: '#495057', fontSize: '0.78rem' }}>—</span>
                                  </div>
                                ) : (
                                  <div style={{
                                    minHeight: '56px',
                                    display: 'grid',
                                    gridTemplateRows: '18px 20px 14px',
                                    rowGap: '2px',
                                    justifyItems: 'center',
                                    alignContent: 'start',
                                  }}>
                                    {/* Linha 1: nota simples */}
                                    <span style={{
                                      color: corNota(m.nota),
                                      fontSize: '0.85rem',
                                      fontWeight: 700,
                                      fontFamily: 'Poppins, sans-serif',
                                      lineHeight: '18px',
                                    }}>
                                      {m.nota.toFixed(2)}
                                    </span>
                                    {/* Linha 2: etiqueta saúde (nome completo) */}
                                    {cor ? (
                                      <span style={{
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        backgroundColor: cor.bg,
                                        border: `1px solid ${cor.border}`,
                                        color: cor.text,
                                        fontSize: '0.62rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.02em',
                                        whiteSpace: 'nowrap',
                                        lineHeight: '14px',
                                      }}>
                                        {cor.label}
                                      </span>
                                    ) : <span />}
                                    {/* Linha 3: evolução */}
                                    {m.evolucao !== null ? (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '2px',
                                        color: corEvolucao(m.evolucao),
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        lineHeight: '14px',
                                      }}>
                                        <IconeEvolucao variacao={m.evolucao} size={9} />
                                        {m.evolucao > 0 ? '+' : ''}{m.evolucao.toFixed(1)}%
                                      </span>
                                    ) : <span />}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>

                        {/* LINHAS EXPANDIDAS — uma linha por indicador, alinhadas ao header principal */}
                        {estaExpandido && INDICADORES_DRILL.map((ind, iIdx) => {
                          const bg = iIdx % 2 === 0 ? '#1a1d21' : '#1f2328';
                          return (
                            <tr key={`${chave}-${ind.id}`} style={{ backgroundColor: bg }}>
                              <td style={{
                                position: 'sticky',
                                left: 0,
                                zIndex: 1,
                                backgroundColor: bg,
                                padding: '6px 16px 6px 40px',
                                color: '#adb5bd',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderBottom: '1px solid #23272d',
                              }}>
                                {ind.label}
                              </td>
                              {d.meses.map(m => {
                                const atual = m.registro ? parseValor(m.registro[ind.coluna]) : NaN;
                                const anterior = m.registroAnterior ? parseValor(m.registroAnterior[ind.coluna]) : NaN;
                                const evol = calcularEvolucao(atual, anterior, ind.inverso);
                                const cor = corEvolucao(evol);
                                return (
                                  <td
                                    key={m.mes}
                                    style={{
                                      padding: '6px 4px',
                                      textAlign: 'center',
                                      borderBottom: '1px solid #23272d',
                                      verticalAlign: 'middle',
                                      fontFamily: 'Poppins, sans-serif',
                                    }}
                                  >
                                    {isNaN(atual) ? (
                                      <span style={{ color: '#495057', fontSize: '0.75rem' }}>—</span>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', lineHeight: 1.15 }}>
                                        <span
                                          title={valorCompleto(atual, ind.formato)}
                                          style={{
                                            color: '#F8F9FA',
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            fontFamily: 'Poppins, sans-serif',
                                            cursor: 'help',
                                          }}
                                        >
                                          {formatarValor(atual, ind.formato)}
                                        </span>
                                        {evol !== null && (
                                          <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '1px',
                                            color: cor,
                                            fontSize: '0.62rem',
                                            fontWeight: 600,
                                          }}>
                                            <IconeEvolucao variacao={evol} size={9} />
                                            {evol > 0 ? '+' : ''}{evol.toFixed(1)}%
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>


        </div>
      )}
    </div>
  );
}
