/**
 * Tabela Analítica por Fundo
 * Estilo idêntico à DadosDetalhadosTable do módulo de vendas
 */

import React, { useState, useMemo } from 'react';
import { DadosPorFundo, SaudeFundo } from '@/modules/carteira/types';
import { formatPercent, formatNumber } from '@/modules/carteira/utils/formatacao';
import { Download } from 'lucide-react';

interface TabelaFundosProps {
  dados: DadosPorFundo[];
  loading?: boolean;
}

const PAGE_SIZE = 10;

// Cores para cada status de saúde
const SAUDE_COLORS: Record<SaudeFundo, { bg: string; text: string }> = {
  'Crítico': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  'Atenção': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  'Quase lá': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  'Alcançada': { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
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

export default function TabelaFundos({ dados, loading = false }: TabelaFundosProps) {
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; direcao: 'asc' | 'desc' }>({
    coluna: 'atingimento',
    direcao: 'asc',
  });
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Calcular totais gerais - CORRIGIDO: atingimento = alunosAtivos / macMeta
  const totais = useMemo(() => {
    const totalAlunosAtivos = dados.reduce((sum, item) => sum + item.alunosAtivos, 0);
    const totalMacMeta = dados.reduce((sum, item) => sum + item.macMeta, 0);
    const totalEventoPrincipal = dados.reduce((sum, item) => sum + item.alunosEventoPrincipal, 0);
    const totalInadimplentes = dados.reduce((sum, item) => sum + item.inadimplentes, 0);
    const totalNuncaPagaram = dados.reduce((sum, item) => sum + item.nuncaPagaram, 0);
    // CORREÇÃO: Atingimento = Alunos Ativos / MAC Meta (igual ao card)
    const atingimentoGeral = totalMacMeta > 0 ? totalAlunosAtivos / totalMacMeta : 0;
    const percInadimplentes = totalAlunosAtivos > 0 ? totalInadimplentes / totalAlunosAtivos : 0;
    const percNuncaPagaram = totalAlunosAtivos > 0 ? totalNuncaPagaram / totalAlunosAtivos : 0;
    
    return {
      totalFundos: dados.length,
      totalAlunosAtivos,
      totalMacMeta,
      atingimentoGeral,
      totalEventoPrincipal,
      totalInadimplentes,
      percInadimplentes,
      totalNuncaPagaram,
      percNuncaPagaram,
    };
  }, [dados]);

  // Filtrar por busca
  const dadosFiltrados = useMemo(() => {
    if (!busca) return dados;
    const termoBusca = busca.toLowerCase();
    return dados.filter(item => 
      item.fundo.toLowerCase().includes(termoBusca) ||
      item.franquia.toLowerCase().includes(termoBusca) ||
      item.idFundo.toLowerCase().includes(termoBusca)
    );
  }, [dados, busca]);

  // Ordenar dados
  const dadosOrdenados = useMemo(() => {
    return [...dadosFiltrados].sort((a, b) => {
      let valorA: any, valorB: any;
      
      switch (ordenacao.coluna) {
        case 'franquia':
          valorA = a.franquia;
          valorB = b.franquia;
          break;
        case 'idFundo':
          valorA = a.idFundo;
          valorB = b.idFundo;
          break;
        case 'fundo':
          valorA = a.fundo;
          valorB = b.fundo;
          break;
        case 'dataBaile':
          valorA = a.dataBaile ? a.dataBaile.getTime() : 0;
          valorB = b.dataBaile ? b.dataBaile.getTime() : 0;
          break;
        case 'saude':
          valorA = SAUDE_ORDER[a.saude];
          valorB = SAUDE_ORDER[b.saude];
          break;
        case 'atingimento':
          valorA = a.atingimento;
          valorB = b.atingimento;
          break;
        case 'alunosAtivos':
          valorA = a.alunosAtivos;
          valorB = b.alunosAtivos;
          break;
        case 'macMeta':
          valorA = a.macMeta;
          valorB = b.macMeta;
          break;
        case 'alunosEventoPrincipal':
          valorA = a.alunosEventoPrincipal;
          valorB = b.alunosEventoPrincipal;
          break;
        case 'inadimplentes':
          valorA = a.inadimplentes;
          valorB = b.inadimplentes;
          break;
        case 'percInadimplentes':
          valorA = a.alunosAtivos > 0 ? a.inadimplentes / a.alunosAtivos : 0;
          valorB = b.alunosAtivos > 0 ? b.inadimplentes / b.alunosAtivos : 0;
          break;
        case 'nuncaPagaram':
          valorA = a.nuncaPagaram;
          valorB = b.nuncaPagaram;
          break;
        case 'percNuncaPagaram':
          valorA = a.alunosAtivos > 0 ? a.nuncaPagaram / a.alunosAtivos : 0;
          valorB = b.alunosAtivos > 0 ? b.nuncaPagaram / b.alunosAtivos : 0;
          break;
        case 'consultorRelacionamento':
          valorA = a.consultorRelacionamento || '';
          valorB = b.consultorRelacionamento || '';
          break;
        case 'consultorAtendimento':
          valorA = a.consultorAtendimento || '';
          valorB = b.consultorAtendimento || '';
          break;
        case 'consultorProducao':
          valorA = a.consultorProducao || '';
          valorB = b.consultorProducao || '';
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
      'Unidade', 'ID Fundo', 'Nome Fundo', 'Data Baile', 'Saúde', '% Ating. MAC', 'Alunos Ativos', 'MAC Atual',
      'Evento Principal', 'Inadimplentes', '% Inadimplentes', 'Nunca Pagaram', '% Nunca Pagaram',
      'Consultor Atendimento', 'Consultor Relacionamento', 'Consultor Produção'
    ];
    const linhas = dadosFiltrados.map(item => {
      const percInad = item.alunosAtivos > 0 ? (item.inadimplentes / item.alunosAtivos * 100).toFixed(1) + '%' : '0,0%';
      const percNunca = item.alunosAtivos > 0 ? (item.nuncaPagaram / item.alunosAtivos * 100).toFixed(1) + '%' : '0,0%';
      return [
        item.franquia,
        item.idFundo,
        item.fundo,
        formatarData(item.dataBaile),
        item.saude,
        formatPercent(item.atingimento),
        formatNumber(item.alunosAtivos),
        formatNumber(item.macMeta),
        formatNumber(item.alunosEventoPrincipal),
        formatNumber(item.inadimplentes),
        percInad,
        formatNumber(item.nuncaPagaram),
        percNunca,
        item.consultorAtendimento || '-',
        item.consultorRelacionamento || '-',
        item.consultorProducao || '-',
      ];
    });
    
    // Adicionar linha de total
    linhas.push([
      'TOTAL GERAL',
      '-',
      `${totais.totalFundos} fundos`,
      '-',
      '-',
      formatPercent(totais.atingimentoGeral),
      formatNumber(totais.totalAlunosAtivos),
      formatNumber(totais.totalMacMeta),
      formatNumber(totais.totalEventoPrincipal),
      formatNumber(totais.totalInadimplentes),
      (totais.percInadimplentes * 100).toFixed(1) + '%',
      formatNumber(totais.totalNuncaPagaram),
      (totais.percNuncaPagaram * 100).toFixed(1) + '%',
      '-',
      '-',
      '-',
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
                onClick={() => handleOrdenacao('franquia')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '10%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Unidade {renderIconeOrdenacao('franquia')}
              </th>
              <th
                onClick={() => handleOrdenacao('idFundo')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                ID Fundo {renderIconeOrdenacao('idFundo')}
              </th>
              <th
                onClick={() => handleOrdenacao('fundo')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '12%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Nome Fundo {renderIconeOrdenacao('fundo')}
              </th>
              <th
                onClick={() => handleOrdenacao('dataBaile')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Dt Baile {renderIconeOrdenacao('dataBaile')}
              </th>
              <th
                onClick={() => handleOrdenacao('saude')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '8%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Saúde {renderIconeOrdenacao('saude')}
              </th>
              <th
                onClick={() => handleOrdenacao('atingimento')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '8%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % Ating. {renderIconeOrdenacao('atingimento')}
              </th>
              <th
                onClick={() => handleOrdenacao('alunosAtivos')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Alunos {renderIconeOrdenacao('alunosAtivos')}
              </th>
              <th
                onClick={() => handleOrdenacao('macMeta')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                MAC {renderIconeOrdenacao('macMeta')}
              </th>
              <th
                onClick={() => handleOrdenacao('alunosEventoPrincipal')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '8%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Evento P. {renderIconeOrdenacao('alunosEventoPrincipal')}
              </th>
              <th
                onClick={() => handleOrdenacao('inadimplentes')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Inadimp. {renderIconeOrdenacao('inadimplentes')}
              </th>
              <th
                onClick={() => handleOrdenacao('percInadimplentes')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % Inad. {renderIconeOrdenacao('percInadimplentes')}
              </th>
              <th
                onClick={() => handleOrdenacao('nuncaPagaram')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                N. Pag. {renderIconeOrdenacao('nuncaPagaram')}
              </th>
              <th
                onClick={() => handleOrdenacao('percNuncaPagaram')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '7%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                % N.P. {renderIconeOrdenacao('percNuncaPagaram')}
              </th>
              <th
                onClick={() => handleOrdenacao('consultorAtendimento')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '6%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Atend. {renderIconeOrdenacao('consultorAtendimento')}
              </th>
              <th
                onClick={() => handleOrdenacao('consultorRelacionamento')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '6%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Relac. {renderIconeOrdenacao('consultorRelacionamento')}
              </th>
              <th
                onClick={() => handleOrdenacao('consultorProducao')}
                className="cursor-pointer"
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  borderBottom: '2px solid #FF6600',
                  color: '#adb5bd',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s ease',
                  width: '6%',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d4349'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2f36'}
              >
                Prod. {renderIconeOrdenacao('consultorProducao')}
              </th>
            </tr>
          </thead>
        </table>

        {/* Corpo da tabela com scroll */}
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', tableLayout: 'fixed' }}>
            <tbody>
              {dadosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                dadosPaginados.map((item, index) => {
                  const percInad = item.alunosAtivos > 0 ? item.inadimplentes / item.alunosAtivos : 0;
                  const percNunca = item.alunosAtivos > 0 ? item.nuncaPagaram / item.alunosAtivos : 0;
                  
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
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '10%', fontSize: '0.8rem' }}>{item.franquia}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#9ca3af', width: '7%', fontSize: '0.75rem' }}>{item.idFundo}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '12%', fontSize: '0.8rem' }}>{item.fundo}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#9ca3af', width: '7%', fontSize: '0.75rem' }}>{formatarData(item.dataBaile)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', width: '8%' }}>
                        <span 
                          style={{ 
                            padding: '4px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: SAUDE_COLORS[item.saude].bg,
                            color: SAUDE_COLORS[item.saude].text,
                          }}
                        >
                          {item.saude}
                        </span>
                      </td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '8%' }}>{formatPercent(item.atingimento)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '7%' }}>{formatNumber(item.alunosAtivos)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '7%' }}>{formatNumber(item.macMeta)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#F8F9FA', width: '8%' }}>{formatNumber(item.alunosEventoPrincipal)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: item.inadimplentes > 0 ? '#ef4444' : '#F8F9FA', width: '7%' }}>{formatNumber(item.inadimplentes)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: percInad > 0.15 ? '#ef4444' : '#FF6600', width: '7%', fontWeight: 300, fontSize: '0.8rem' }}>{(percInad * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: item.nuncaPagaram > 0 ? '#ef4444' : '#F8F9FA', width: '7%' }}>{formatNumber(item.nuncaPagaram)}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: percNunca > 0.05 ? '#ef4444' : '#FF6600', width: '7%', fontWeight: 300, fontSize: '0.8rem' }}>{(percNunca * 100).toFixed(1)}%</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#9ca3af', width: '6%', fontSize: '0.7rem' }}>{item.consultorAtendimento || '-'}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#9ca3af', width: '6%', fontSize: '0.7rem' }}>{item.consultorRelacionamento || '-'}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#9ca3af', width: '6%', fontSize: '0.7rem' }}>{item.consultorProducao || '-'}</td>
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
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '10%' }}>TOTAL GERAL</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>-</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '12%' }}>{totais.totalFundos} fundos</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>-</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '8%' }}>-</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '8%' }}>{formatPercent(totais.atingimentoGeral)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{formatNumber(totais.totalAlunosAtivos)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{formatNumber(totais.totalMacMeta)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '8%' }}>{formatNumber(totais.totalEventoPrincipal)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{formatNumber(totais.totalInadimplentes)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{(totais.percInadimplentes * 100).toFixed(1)}%</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{formatNumber(totais.totalNuncaPagaram)}</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '7%' }}>{(totais.percNuncaPagaram * 100).toFixed(1)}%</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '6%' }}>-</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '6%' }}>-</td>
                <td style={{ padding: '12px 6px', textAlign: 'center', fontWeight: 700, color: '#ff6600', width: '6%' }}>-</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          fontSize: '0.875rem',
          color: '#ADB5BD',
          fontFamily: 'Poppins, sans-serif',
        }}>
          <span>
            Mostrando {dadosFiltrados.length > 0 ? startIndex + 1 : 0} a {Math.min(endIndex, dadosFiltrados.length)} de {dadosFiltrados.length} registros
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
      )}
    </div>
  );
}
