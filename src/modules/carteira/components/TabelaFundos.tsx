/**
 * Tabela Analítica por Fundo - Layout Compacto
 * Colunas unificadas com informações agrupadas
 */

import React, { useState, useMemo } from 'react';
import { DadosPorFundo, SaudeFundo } from '@/modules/carteira/types';
import { formatPercent, formatNumber } from '@/modules/carteira/utils/formatacao';
import { Download, Handshake, Headphones, Clapperboard } from 'lucide-react';

interface TabelaFundosProps {
  dados: DadosPorFundo[];
  loading?: boolean;
}

const PAGE_SIZE = 10;

// Cores para cada status de saúde
const SAUDE_COLORS: Record<SaudeFundo, { bg: string; text: string; bar: string }> = {
  'Crítico': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', bar: '#ef4444' },
  'Atenção': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', bar: '#f59e0b' },
  'Quase lá': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', bar: '#3b82f6' },
  'Alcançada': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', bar: '#22c55e' },
};

// Ordenação de saúde para sorting
const SAUDE_ORDER: Record<SaudeFundo, number> = {
  'Crítico': 1,
  'Atenção': 2,
  'Quase lá': 3,
  'Alcançada': 4,
};

// Formatação de data
const formatarData = (data: Date | null): string => {
  if (!data) return '-';
  return data.toLocaleDateString('pt-BR');
};

// Calcular meses até o baile
const calcularMesesAteBaile = (dataBaile: Date | null): string => {
  if (!dataBaile) return '';
  const hoje = new Date();
  const diffMs = dataBaile.getTime() - hoje.getTime();
  const diffMeses = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30));
  
  if (diffMeses < 0) return 'Passou';
  if (diffMeses === 0) return 'Este mês';
  if (diffMeses === 1) return '1 mês';
  if (diffMeses < 12) return `${diffMeses} meses`;
  const anos = Math.floor(diffMeses / 12);
  const mesesRestantes = diffMeses % 12;
  if (anos === 1 && mesesRestantes === 0) return '1 ano';
  if (anos === 1) return `1a ${mesesRestantes}m`;
  if (mesesRestantes === 0) return `${anos} anos`;
  return `${anos}a ${mesesRestantes}m`;
};

// Formatar nome do consultor (primeiro nome + segundo abreviado)
const formatarNomeConsultor = (nome: string | undefined): string => {
  if (!nome || nome.trim() === '') return '-';
  const partes = nome.trim().split(/[\s.]+/).filter(p => p.length > 0);
  if (partes.length === 0) return '-';
  if (partes.length === 1) return partes[0];
  return `${partes[0]} ${partes[1].charAt(0)}.`;
};

export default function TabelaFundos({ dados, loading = false }: TabelaFundosProps) {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({
    coluna: 'atingimento',
    direcao: 'asc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Calcular totais gerais
  const totais = useMemo(() => {
    const totalAlunosAtivos = dados.reduce((sum, item) => sum + item.alunosAtivos, 0);
    const totalMacMeta = dados.reduce((sum, item) => sum + item.macMeta, 0);
    const totalEventoPrincipal = dados.reduce((sum, item) => sum + item.alunosEventoPrincipal, 0);
    const totalInadimplentes = dados.reduce((sum, item) => sum + item.inadimplentes, 0);
    const atingimentoGeral = totalMacMeta > 0 ? totalAlunosAtivos / totalMacMeta : 0;
    
    return {
      totalFundos: dados.length,
      totalAlunosAtivos,
      totalMacMeta,
      atingimentoGeral,
      totalEventoPrincipal,
      totalInadimplentes,
    };
  }, [dados]);

  // Filtrar por busca
  const dadosFiltrados = useMemo(() => {
    if (!busca) return dados;
    const termoBusca = busca.toLowerCase();
    return dados.filter(item => 
      item.fundo.toLowerCase().includes(termoBusca) ||
      item.franquia.toLowerCase().includes(termoBusca) ||
      item.idFundo.toLowerCase().includes(termoBusca) ||
      (item.consultorRelacionamento || '').toLowerCase().includes(termoBusca) ||
      (item.consultorAtendimento || '').toLowerCase().includes(termoBusca) ||
      (item.consultorProducao || '').toLowerCase().includes(termoBusca)
    );
  }, [dados, busca]);

  // Ordenar dados
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (ordenacao.coluna) {
        case 'fundo':
          valorA = a.fundo;
          valorB = b.fundo;
          break;
        case 'franquia':
          valorA = a.franquia;
          valorB = b.franquia;
          break;
        case 'saude':
          valorA = SAUDE_ORDER[a.saude];
          valorB = SAUDE_ORDER[b.saude];
          break;
        case 'dataBaile':
          valorA = a.dataBaile ? a.dataBaile.getTime() : 0;
          valorB = b.dataBaile ? b.dataBaile.getTime() : 0;
          break;
        case 'atingimento':
          valorA = a.atingimento;
          valorB = b.atingimento;
          break;
        case 'alunosMac':
          valorA = a.alunosAtivos;
          valorB = b.alunosAtivos;
          break;
        case 'eventoPrincipal':
          valorA = a.alunosEventoPrincipal;
          valorB = b.alunosEventoPrincipal;
          break;
        case 'inadimplentes':
          valorA = a.inadimplentes;
          valorB = b.inadimplentes;
          break;
        default:
          return 0;
      }

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return ordenacao.direcao === 'asc' 
          ? valorA.localeCompare(valorB) 
          : valorB.localeCompare(valorA);
      }

      return ordenacao.direcao === 'asc' ? valorA - valorB : valorB - valorA;
    });
  }, [dadosFiltrados, ordenacao]);

  // Paginação
  const totalPaginas = Math.ceil(dadosOrdenados.length / PAGE_SIZE) || 1;
  const startIndex = (paginaAtual - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const dadosPaginados = dadosOrdenados.slice(startIndex, endIndex);

  // Alterar ordenação
  const handleOrdenacao = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc',
    }));
    setPaginaAtual(1);
  };

  // Renderizar ícone de ordenação
  const renderIconeOrdenacao = (coluna: string) => {
    if (ordenacao.coluna !== coluna) {
      return <span className="ml-1 text-gray-500">↕</span>;
    }
    return ordenacao.direcao === 'asc' ? (
      <span className="ml-1" style={{ color: '#FF6600' }}>↑</span>
    ) : (
      <span className="ml-1" style={{ color: '#FF6600' }}>↓</span>
    );
  };

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = [
      'Fundo', 'ID Fundo', 'Tipo Serviço', 'Curso', 'Unidade', 'Data Baile', 'Meses até Baile',
      'Saúde', '% Atingimento', 'Alunos Ativos', 'MAC', 'Evento Principal', 'Inadimplentes',
      'Consultor Relacionamento', 'Consultor Atendimento', 'Consultor Produção'
    ];
    const linhas = dadosFiltrados.map(item => {
      return [
        item.fundo,
        item.idFundo,
        item.tipoServico || '-',
        item.curso || '-',
        item.franquia,
        formatarData(item.dataBaile),
        calcularMesesAteBaile(item.dataBaile),
        item.saude,
        formatPercent(item.atingimento),
        formatNumber(item.alunosAtivos),
        formatNumber(item.macMeta),
        formatNumber(item.alunosEventoPrincipal),
        formatNumber(item.inadimplentes),
        item.consultorRelacionamento || '-',
        item.consultorAtendimento || '-',
        item.consultorProducao || '-',
      ];
    });
    
    // Adicionar linha de total
    linhas.push([
      'TOTAL GERAL',
      `${totais.totalFundos} fundos`,
      '-', '-', '-', '-', '-', '-',
      formatPercent(totais.atingimentoGeral),
      formatNumber(totais.totalAlunosAtivos),
      formatNumber(totais.totalMacMeta),
      formatNumber(totais.totalEventoPrincipal),
      formatNumber(totais.totalInadimplentes),
      '-', '-', '-',
    ]);

    const csv = [headers.join(';'), ...linhas.map(l => l.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `carteira_fundos_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Renderizar barra de progresso
  const renderBarraProgresso = (percentual: number, saude: SaudeFundo) => {
    const percentualLimitado = Math.min(percentual * 100, 100);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.85rem' }}>
          {formatPercent(percentual)}
        </span>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: '#374151', 
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{ 
            width: `${percentualLimitado}%`, 
            height: '100%', 
            backgroundColor: SAUDE_COLORS[saude].bar,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    );
  };

  // Renderizar coluna de consultores
  const renderConsultores = (item: DadosPorFundo) => {
    const rel = formatarNomeConsultor(item.consultorRelacionamento);
    const atd = formatarNomeConsultor(item.consultorAtendimento);
    const prod = formatarNomeConsultor(item.consultorProducao);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.75rem' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}
          title={`Relacionamento: ${item.consultorRelacionamento || 'Não atribuído'}`}
        >
          <Handshake size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
          <span style={{ color: rel === '-' ? '#4b5563' : '#9ca3af' }}>{rel}</span>
        </div>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}
          title={`Atendimento: ${item.consultorAtendimento || 'Não atribuído'}`}
        >
          <Headphones size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
          <span style={{ color: atd === '-' ? '#4b5563' : '#9ca3af' }}>{atd}</span>
        </div>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'default' }}
          title={`Produção: ${item.consultorProducao || 'Não atribuído'}`}
        >
          <Clapperboard size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
          <span style={{ color: prod === '-' ? '#4b5563' : '#9ca3af' }}>{prod}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
        <div className="p-6 text-center">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Estilos do cabeçalho
  const headerStyle: React.CSSProperties = {
    padding: '12px 8px',
    textAlign: 'center',
    borderBottom: '2px solid #FF6600',
    color: '#adb5bd',
    fontWeight: 600,
    textTransform: 'uppercase',
    fontSize: '0.7rem',
    letterSpacing: '0.05em',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
    verticalAlign: 'middle',
  };

  return (
    <div className="space-y-4">
      {/* Título */}
      <h2 className="section-title">
        Análise por Fundo
      </h2>

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-dark-tertiary border border-gray-600 text-gray-400 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-500"
          style={{ fontFamily: 'Poppins, sans-serif', backgroundColor: '#2a2f36' }}
        >
          <Download size={16} />
          Exportar
        </button>

        <div className="flex items-center">
          <span className="text-[#adb5bd] text-sm mr-2">Pesquisar:</span>
          <input
            type="text"
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            className="px-2 py-1 rounded text-sm"
            style={{
              backgroundColor: '#212529',
              color: '#F8F9FA',
              border: '1px solid #495057',
              borderRadius: '6px',
              minWidth: '180px',
            }}
          />
        </div>
      </div>

      {/* Tabela */}
      <div style={{ borderRadius: '8px', border: '1px solid #444', overflow: 'hidden' }}>
        {/* Cabeçalho */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: '#2a2f36' }}>
              <th
                onClick={() => handleOrdenacao('fundo')}
                style={{ ...headerStyle, width: '22%', textAlign: 'left', paddingLeft: '12px' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Fundo {renderIconeOrdenacao('fundo')}
              </th>
              <th
                onClick={() => handleOrdenacao('franquia')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Unidade {renderIconeOrdenacao('franquia')}
              </th>
              <th
                onClick={() => handleOrdenacao('saude')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Saúde {renderIconeOrdenacao('saude')}
              </th>
              <th
                onClick={() => handleOrdenacao('dataBaile')}
                style={{ ...headerStyle, width: '11%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Data Baile {renderIconeOrdenacao('dataBaile')}
              </th>
              <th
                onClick={() => handleOrdenacao('atingimento')}
                style={{ ...headerStyle, width: '11%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Atingimento {renderIconeOrdenacao('atingimento')}
              </th>
              <th
                onClick={() => handleOrdenacao('alunosMac')}
                style={{ ...headerStyle, width: '10%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Alunos / MAC {renderIconeOrdenacao('alunosMac')}
              </th>
              <th
                onClick={() => handleOrdenacao('eventoPrincipal')}
                style={{ ...headerStyle, width: '9%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Evento Princ. {renderIconeOrdenacao('eventoPrincipal')}
              </th>
              <th
                onClick={() => handleOrdenacao('inadimplentes')}
                style={{ ...headerStyle, width: '9%' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Inadimpl. {renderIconeOrdenacao('inadimplentes')}
              </th>
              <th
                style={{ ...headerStyle, width: '12%', cursor: 'default' }}
              >
                Consultores
              </th>
            </tr>
          </thead>
        </table>

        {/* Corpo da tabela com scroll */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <tbody>
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                dadosPaginados.map((item, index) => {
                  return (
                    <tr
                      key={`${item.idFundo}-${index}`}
                      style={{
                        backgroundColor: index % 2 === 0 ? '#343A40' : '#2c3136',
                        borderBottom: '1px solid #444',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#343A40' : '#2c3136'}
                    >
                      {/* Coluna Fundo (Nome + ID + Tipo Serviço + Curso) */}
                      <td style={{ padding: '12px', width: '22%', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#F8F9FA', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
                            {item.fundo}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                            #{item.idFundo} • {item.tipoServico || 'N/A'} • {item.curso || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Coluna Unidade */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '10%', verticalAlign: 'middle' }}>
                        <span style={{ color: '#F8F9FA', fontSize: '0.8rem' }}>{item.franquia}</span>
                      </td>

                      {/* Coluna Saúde */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '10%', verticalAlign: 'middle' }}>
                        <span 
                          style={{ 
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            backgroundColor: SAUDE_COLORS[item.saude].bg,
                            color: SAUDE_COLORS[item.saude].text,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.saude}
                        </span>
                      </td>

                      {/* Coluna Data Baile (Data + Meses) */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '11%', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#F8F9FA', fontSize: '0.8rem' }}>
                            {formatarData(item.dataBaile)}
                          </span>
                          <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                            {calcularMesesAteBaile(item.dataBaile)}
                          </span>
                        </div>
                      </td>

                      {/* Coluna Atingimento (Barra de Progresso) */}
                      <td style={{ padding: '10px 8px', width: '11%', verticalAlign: 'middle' }}>
                        {renderBarraProgresso(item.atingimento, item.saude)}
                      </td>

                      {/* Coluna Alunos / MAC */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '10%', verticalAlign: 'middle' }}>
                        <span style={{ color: '#F8F9FA', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 600 }}>{formatNumber(item.alunosAtivos)}</span>
                          <span style={{ color: '#6b7280' }}> / </span>
                          <span style={{ color: '#9ca3af' }}>{formatNumber(item.macMeta)}</span>
                        </span>
                      </td>

                      {/* Coluna Evento Principal */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '9%', verticalAlign: 'middle' }}>
                        <span style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 500 }}>
                          {formatNumber(item.alunosEventoPrincipal)}
                        </span>
                      </td>

                      {/* Coluna Inadimplentes */}
                      <td style={{ padding: '10px 8px', textAlign: 'center', width: '9%', verticalAlign: 'middle' }}>
                        <span style={{ 
                          color: item.inadimplentes > 0 ? '#ef4444' : '#F8F9FA', 
                          fontSize: '0.85rem', 
                          fontWeight: 500 
                        }}>
                          {formatNumber(item.inadimplentes)}
                        </span>
                      </td>

                      {/* Coluna Consultores */}
                      <td style={{ padding: '10px 8px', width: '12%', verticalAlign: 'middle' }}>
                        {renderConsultores(item)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Linha de Total Geral */}
        {dadosPaginados.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <tfoot>
              <tr style={{ backgroundColor: '#2a2f36', borderTop: '2px solid #ff6600' }}>
                <td style={{ padding: '12px', width: '22%', fontWeight: 700, color: '#ff6600' }}>
                  TOTAL GERAL
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '10%', fontWeight: 700, color: '#ff6600' }}>
                  {totais.totalFundos} fundos
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '10%', fontWeight: 700, color: '#ff6600' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '11%', fontWeight: 700, color: '#ff6600' }}>
                  -
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '11%', fontWeight: 700, color: '#ff6600' }}>
                  {formatPercent(totais.atingimentoGeral)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '10%', fontWeight: 700, color: '#ff6600' }}>
                  {formatNumber(totais.totalAlunosAtivos)} / {formatNumber(totais.totalMacMeta)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '9%', fontWeight: 700, color: '#ff6600' }}>
                  {formatNumber(totais.totalEventoPrincipal)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '9%', fontWeight: 700, color: '#ff6600' }}>
                  {formatNumber(totais.totalInadimplentes)}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center', width: '12%', fontWeight: 700, color: '#ff6600' }}>
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Paginação */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
        <span style={{ color: '#ADB5BD', fontSize: '0.875rem', fontFamily: 'Poppins, sans-serif' }}>
          Mostrando {dadosOrdenados.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, dadosOrdenados.length)} de {dadosOrdenados.length} registros
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: paginaAtual === 1 ? '#333' : '#495057',
              color: paginaAtual === 1 ? '#6c757d' : '#F8F9FA',
              border: 'none',
              cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              opacity: paginaAtual === 1 ? 0.5 : 1,
            }}
          >
            Anterior
          </button>
          <button
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: paginaAtual === totalPaginas ? '#333' : '#495057',
              color: paginaAtual === totalPaginas ? '#6c757d' : '#F8F9FA',
              border: 'none',
              cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer',
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              opacity: paginaAtual === totalPaginas ? 0.5 : 1,
            }}
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}
