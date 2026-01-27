/**
 * Detalhamento Mensal
 * Exibe os dados mensais do ano selecionado
 * Dados vêm da mesma fonte que os cards (aba FLUXO PROJETADO)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Loader2 } from 'lucide-react';

// Interface para os dados mensais (mesma estrutura da API)
export interface DadosMensal {
  mes: string; // ex: "01/01/2026"
  franquia: string;
  ano: number;
  // Carteira (D + E + F)
  antecipacaoCarteira: number;      // D - Antecipação Carteira
  fechamentoCarteira: number;       // E - Ultima Parc Fee Carteira
  demaisReceitasCarteira: number;   // F - Demais Receitas Carteira
  // Novas Vendas (G + H + I)
  antecipacaoNovasVendas: number;   // G - Antecipação Novas Vendas
  fechamentoNovasVendas: number;    // H - Ultima Parc Fee Novas Vendas
  demaisReceitasNovasVendas: number;// I - Demais Receitas Novas Vendas
  // Calculados
  subtotal: number;
  despesa: number;
  total: number;
}

interface DetalhamentoMensalProps {
  anoSelecionado: number;
  franquia?: string;
  despesaAnual?: number;
}

const formatarMoeda = (valor: number): string => {
  if (valor === 0) return '-';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

const formatarMes = (mesCompleto: string): string => {
  const partes = mesCompleto.split('/');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const mesIndex = parseInt(partes[1]) - 1;
  return meses[mesIndex] || partes[1];
};

export default function DetalhamentoMensal({ 
  anoSelecionado, 
  franquia = 'JUIZ DE FORA',
  despesaAnual = 0
}: DetalhamentoMensalProps) {
  const [dadosMensais, setDadosMensais] = useState<DadosMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar dados mensais da API
  const fetchDadosMensais = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fluxo-projetado/detalhamento?franquia=${encodeURIComponent(franquia.toUpperCase())}&ano=${anoSelecionado}&refresh=${Date.now()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar dados');
      }

      // Calcular despesa mensal (despesa anual dividida por 12 meses)
      // Usar valor absoluto pois despesa pode vir com sinal negativo
      const despesaMensal = Math.abs(despesaAnual) / 12;

      // Adiciona despesa e total aos dados
      // Total = Subtotal - Despesas Mensais
      const dadosComDespesa = result.data.map((m: any) => {
        const subtotal = (m.antecipacaoCarteira || 0) + 
                        (m.fechamentoCarteira || 0) + 
                        (m.demaisReceitasCarteira || 0) +
                        (m.antecipacaoNovasVendas || 0) + 
                        (m.fechamentoNovasVendas || 0) + 
                        (m.demaisReceitasNovasVendas || 0);
        return {
          ...m,
          subtotal,
          despesa: despesaMensal,
          total: subtotal - despesaMensal, // Total = Subtotal - Despesas
        };
      });

      setDadosMensais(dadosComDespesa);
    } catch (err) {
      console.error('[DetalhamentoMensal] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [franquia, anoSelecionado, despesaAnual]);

  useEffect(() => {
    fetchDadosMensais();
  }, [fetchDadosMensais]);
  
  // Calcular totais
  // Total = Subtotal - Despesas Mensais
  const totais = dadosMensais.reduce((acc, m) => {
    const subtotal = acc.subtotal + (m.subtotal || 0);
    const despesa = acc.despesa + (m.despesa || 0);
    return {
      antecipacaoCarteira: acc.antecipacaoCarteira + (m.antecipacaoCarteira || 0),
      fechamentoCarteira: acc.fechamentoCarteira + (m.fechamentoCarteira || 0),
      demaisReceitasCarteira: acc.demaisReceitasCarteira + (m.demaisReceitasCarteira || 0),
      antecipacaoNovasVendas: acc.antecipacaoNovasVendas + (m.antecipacaoNovasVendas || 0),
      fechamentoNovasVendas: acc.fechamentoNovasVendas + (m.fechamentoNovasVendas || 0),
      demaisReceitasNovasVendas: acc.demaisReceitasNovasVendas + (m.demaisReceitasNovasVendas || 0),
      subtotal,
      despesa,
      total: subtotal - despesa,
    };
  }, {
    antecipacaoCarteira: 0,
    fechamentoCarteira: 0,
    demaisReceitasCarteira: 0,
    antecipacaoNovasVendas: 0,
    fechamentoNovasVendas: 0,
    demaisReceitasNovasVendas: 0,
    subtotal: 0,
    despesa: 0,
    total: 0,
  });

  return (
    <div className="mt-6 rounded-xl overflow-hidden border border-gray-700/50" style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Detalhamento Mensal - {anoSelecionado}
              </h3>
              <p className="text-xs text-gray-400">{franquia}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-gray-400">Carteira</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-gray-400">Novas Vendas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
          <span className="ml-3 text-gray-400">Carregando dados...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button
            onClick={fetchDadosMensais}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : dadosMensais.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <span className="text-gray-400">Nenhum dado encontrado para {anoSelecionado}.</span>
        </div>
      ) : (
      /* Tabela */
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="w-[50px] px-2 py-3 text-center text-[9px] font-semibold text-orange-400 uppercase tracking-wider">
                Mês
              </th>
              <th className="w-[110px] px-2 py-3 text-center text-[9px] font-semibold text-emerald-400 uppercase tracking-wider leading-tight">
                Proj. Receita Antecipação de Fee da Carteira
              </th>
              <th className="w-[110px] px-2 py-3 text-center text-[9px] font-semibold text-emerald-400 uppercase tracking-wider leading-tight">
                Proj. Receita Ultima Parcela Fee da Carteira
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-[9px] font-semibold text-emerald-400 uppercase tracking-wider leading-tight">
                Proj. Demais Receitas da Carteira
              </th>
              <th className="w-[110px] px-2 py-3 text-center text-[9px] font-semibold text-blue-400 uppercase tracking-wider leading-tight">
                Proj. Receita Antecipação de Fee de Novas Vendas
              </th>
              <th className="w-[110px] px-2 py-3 text-center text-[9px] font-semibold text-blue-400 uppercase tracking-wider leading-tight">
                Proj. Receita Ultima Parcela Fee de Novas Vendas
              </th>
              <th className="w-[100px] px-2 py-3 text-center text-[9px] font-semibold text-blue-400 uppercase tracking-wider leading-tight">
                Proj. Demais Receitas de Novas Vendas
              </th>
              <th className="w-[90px] px-2 py-3 text-center text-[9px] font-semibold text-gray-300 uppercase tracking-wider">
                Subtotal
              </th>
              <th className="w-[90px] px-2 py-3 text-center text-[9px] font-semibold text-red-400 uppercase tracking-wider leading-tight">
                Despesas Mensais
              </th>
              <th className="w-[90px] px-2 py-3 text-center text-[9px] font-semibold text-white uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {dadosMensais.map((dado, index) => (
              <tr 
                key={dado.mes} 
                className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${index % 2 === 0 ? 'bg-gray-900/20' : ''}`}
              >
                <td className="px-2 py-2.5 text-sm font-medium text-white text-center">
                  {formatarMes(dado.mes)}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-emerald-400">
                  {dado.antecipacaoCarteira > 0 ? formatarMoeda(dado.antecipacaoCarteira) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-emerald-400">
                  {dado.fechamentoCarteira > 0 ? formatarMoeda(dado.fechamentoCarteira) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-emerald-400">
                  {dado.demaisReceitasCarteira > 0 ? formatarMoeda(dado.demaisReceitasCarteira) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-blue-400">
                  {dado.antecipacaoNovasVendas > 0 ? formatarMoeda(dado.antecipacaoNovasVendas) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-blue-400">
                  {dado.fechamentoNovasVendas > 0 ? formatarMoeda(dado.fechamentoNovasVendas) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-blue-400">
                  {dado.demaisReceitasNovasVendas > 0 ? formatarMoeda(dado.demaisReceitasNovasVendas) : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-gray-300 font-medium">
                  {formatarMoeda(dado.subtotal)}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-red-400">
                  {dado.despesa !== 0 ? `-${formatarMoeda(dado.despesa)}` : '-'}
                </td>
                <td className="px-2 py-2.5 text-xs text-center tabular-nums text-white font-semibold">
                  {formatarMoeda(dado.total)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 border-t-2 border-orange-500/50">
              <td className="px-2 py-3 text-xs font-bold text-orange-400 uppercase text-center">
                Total {anoSelecionado}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-emerald-400 font-bold">
                {formatarMoeda(totais.antecipacaoCarteira)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-emerald-400 font-bold">
                {formatarMoeda(totais.fechamentoCarteira)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-emerald-400 font-bold">
                {formatarMoeda(totais.demaisReceitasCarteira)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-blue-400 font-bold">
                {formatarMoeda(totais.antecipacaoNovasVendas)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-blue-400 font-bold">
                {formatarMoeda(totais.fechamentoNovasVendas)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-blue-400 font-bold">
                {formatarMoeda(totais.demaisReceitasNovasVendas)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-gray-200 font-bold">
                {formatarMoeda(totais.subtotal)}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-red-400 font-bold">
                {totais.despesa !== 0 ? `-${formatarMoeda(totais.despesa)}` : '-'}
              </td>
              <td className="px-2 py-3 text-xs text-center tabular-nums text-white font-bold">
                {formatarMoeda(totais.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}
    </div>
  );
}
