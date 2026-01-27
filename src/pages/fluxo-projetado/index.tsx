/**
 * Dashboard Fluxo Projetado
 * Página principal do módulo de projeção de receita
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Header, FluxoAnualCard, DetalhamentoMensal, Sidebar, CalculadoraProjecao } from '@/modules/fluxo-projetado';
import { DadosFluxoAnual, ParametrosFranquiaCard } from '@/modules/fluxo-projetado/components/FluxoAnualCard';
import { Loader2 } from 'lucide-react';

export default function FluxoProjetadoDashboard() {
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para os dados de fluxo anual
  const [dadosFluxoAnual, setDadosFluxoAnual] = useState<DadosFluxoAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado separado para despesas por ano (preservado durante reloads)
  const [despesasPorAno, setDespesasPorAno] = useState<Record<number, number>>({});

  // Estado para parâmetros da franquia
  const [parametrosFranquia, setParametrosFranquia] = useState<ParametrosFranquiaCard | null>(null);

  // Estado para o ano selecionado (default: ano atual 2026)
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2026);

  // Estado para a franquia selecionada (inicia vazio para forçar seleção)
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

  // Buscar parâmetros da franquia
  const fetchParametros = useCallback(async (franquia: string) => {
    try {
      const response = await fetch(`/api/fluxo-projetado/parametros?refresh=${Date.now()}`);
      const result = await response.json();

      if (response.ok && result.success) {
        // Busca os parâmetros da franquia selecionada
        const params = result.data.find((p: any) => 
          p.franquia.toUpperCase() === franquia.toUpperCase()
        );
        
        if (params) {
          setParametrosFranquia({
            feePercentual: params.feePercentual || 0,
            percentualAntecipacao: params.percentualAntecipacao || 0,
            percentualFechamento: params.percentualFechamento || 0,
            numParcelasAntecipacao: params.numParcelasAntecipacao || 0,
            quebraOrcamentoFinal: params.quebraOrcamentoFinal || 0,
            diasBaile: params.diasBaileAnteciparUltimaParcela || 0,
            demaisReceitas: params.demaisReceitas || 0,
            margem: params.margem || 0,
            mesesPermanenciaCarteira: params.mesesPermanenciaCarteira || 0,
          });
        } else {
          setParametrosFranquia(null);
        }
      }
    } catch (err) {
      console.error('[FluxoProjetado] Erro ao buscar parâmetros:', err);
    }
  }, []);

  // Buscar dados da API
  const fetchDados = useCallback(async (franquia: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fluxo-projetado/projecao?franquia=${encodeURIComponent(franquia.toUpperCase())}&refresh=${Date.now()}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao buscar dados');
      }

      // Mapeia os dados da API para o formato do componente
      // DESPESAS: Não puxa da planilha - é campo editável manual, inicia em 0
      const anoAtualMap = new Date().getFullYear();
      const dados: DadosFluxoAnual[] = result.data.map((item: any) => {
        // Calcula saldo sem despesa (despesa inicia em 0)
        const receitaCarteira = item.receitaCarteira;
        const receitaNovosVendas = item.receitaNovosVendas;
        const saldoSemDespesa = receitaCarteira + receitaNovosVendas;
        
        // Soma dados de detalhamento Carteira de todos os semestres (D + E + F)
        const somaAntecipacaoCarteira = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaAntecipacaoCarteira || 0), 0) || 0;
        const somaExecucaoCarteira = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaExecucaoCarteira || 0), 0) || 0;
        const somaDemaisReceitasCarteira = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaDemaisReceitasCarteira || 0), 0) || 0;
        
        // Soma dados de detalhamento Novas Vendas de todos os semestres (G + H + I)
        const somaAntecipacaoNovasVendas = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaAntecipacaoNovasVendas || 0), 0) || 0;
        const somaExecucaoNovasVendas = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaExecucaoNovasVendas || 0), 0) || 0;
        const somaDemaisReceitasNovasVendas = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaDemaisReceitasNovasVendas || 0), 0) || 0;
        
        // VVR do Ano (da aba NOVOS FUNDOS)
        const somaVVR = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaVVR || 0), 0) || 0;
        
        // Dados da Calculadora Franqueado (J + K + L)
        const somaAntecipacaoCalcFranqueado = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaAntecipacaoCalcFranqueado || 0), 0) || 0;
        const somaFechamentoCalcFranqueado = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaFechamentoCalcFranqueado || 0), 0) || 0;
        const somaDemaisReceitasCalcFranqueado = item.semestres?.reduce((acc: number, sem: any) => acc + (sem.somaDemaisReceitasCalcFranqueado || 0), 0) || 0;
        const receitaCalcFranqueado = somaAntecipacaoCalcFranqueado + somaFechamentoCalcFranqueado + somaDemaisReceitasCalcFranqueado;
        
        // Preserva despesa existente ou inicia em 0
        const despesaExistente = despesasPorAno[item.ano] || 0;
        const saldoComDespesa = saldoSemDespesa + despesaExistente;
        
        return {
          ano: item.ano,
          receitaCarteira,
          receitaNovosVendas,
          subtotal: item.subtotal,
          custo: despesaExistente, // Usa despesa preservada
          saldo: saldoComDespesa, // Saldo com despesa preservada
          isAtual: item.ano === anoAtualMap,
          somaAntecipacaoCarteira,
          somaExecucaoCarteira,
          somaDemaisReceitasCarteira,
          somaAntecipacaoNovasVendas,
          somaExecucaoNovasVendas,
          somaDemaisReceitasNovasVendas,
          somaVVR,
          // Dados calculadora franqueado
          somaAntecipacaoCalcFranqueado,
          somaFechamentoCalcFranqueado,
          somaDemaisReceitasCalcFranqueado,
          receitaCalcFranqueado,
        };
      });

      // Garantir que 3 anos (ano atual + 2) sempre apareçam
      const anoAtual = new Date().getFullYear();
      const anosDesejados = [anoAtual, anoAtual + 1, anoAtual + 2];
      const dadosCompletos: DadosFluxoAnual[] = anosDesejados.map(ano => {
        const dadoExistente = dados.find((d: DadosFluxoAnual) => d.ano === ano);
        if (dadoExistente) return dadoExistente;
        
        // Preserva despesa existente ou inicia em 0
        const despesaExistente = despesasPorAno[ano] || 0;
        
        // Se não existe na base, cria registro zerado
        return {
          ano,
          receitaCarteira: 0,
          receitaNovosVendas: 0,
          subtotal: 0,
          custo: despesaExistente, // Usa despesa preservada
          saldo: despesaExistente, // Saldo com despesa preservada
          isAtual: ano === anoAtual,
          somaAntecipacaoCarteira: 0,
          somaExecucaoCarteira: 0,
          somaDemaisReceitasCarteira: 0,
          somaAntecipacaoNovasVendas: 0,
          somaExecucaoNovasVendas: 0,
          somaDemaisReceitasNovasVendas: 0,
          somaVVR: 0,
          // Dados calculadora franqueado
          somaAntecipacaoCalcFranqueado: 0,
          somaFechamentoCalcFranqueado: 0,
          somaDemaisReceitasCalcFranqueado: 0,
          receitaCalcFranqueado: 0,
        };
      });

      setDadosFluxoAnual(dadosCompletos);
      
      // Se o ano selecionado não existe nos dados, seleciona o primeiro
      if (dadosCompletos.length > 0 && !dadosCompletos.find(d => d.ano === anoSelecionado)) {
        setAnoSelecionado(dadosCompletos[0].ano);
      }
    } catch (err) {
      console.error('[FluxoProjetado] Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [anoSelecionado, despesasPorAno]);

  // Limpa despesas quando a franquia mudar (são específicas de cada franquia)
  useEffect(() => {
    setDespesasPorAno({});
  }, [franquiaSelecionada]);

  // Buscar dados quando a franquia mudar (só se tiver franquia selecionada)
  useEffect(() => {
    if (franquiaSelecionada) {
      setLoading(true);
      fetchDados(franquiaSelecionada);
      fetchParametros(franquiaSelecionada);
    } else {
      setLoading(false);
      setDadosFluxoAnual([]);
    }
  }, [franquiaSelecionada, fetchDados, fetchParametros]);

  // Handler para atualizar despesa (local e no estado separado)
  const handleDespesaChange = useCallback((ano: number, novoValor: number) => {
    // Atualiza o estado separado de despesas por ano (preservado durante reloads)
    setDespesasPorAno(prev => ({ ...prev, [ano]: novoValor }));
    
    // Atualiza também o estado dos dados para refletir imediatamente na UI
    setDadosFluxoAnual((prev) => 
      prev.map((dados) => {
        if (dados.ano !== ano) return dados;
        const novoSaldo = dados.receitaCarteira + dados.receitaNovosVendas + novoValor;
        return { ...dados, custo: novoValor, saldo: novoSaldo };
      })
    );
  }, []);

  // Callback para quando os parâmetros forem salvos
  const handleParametrosSaved = useCallback(() => {
    // Recarrega os parâmetros da franquia
    fetchParametros(franquiaSelecionada);
  }, [franquiaSelecionada, fetchParametros]);

  return (
    <>
      <Head>
        <title>Fluxo Projetado - Projeto Central</title>
        <meta name="description" content="Projeção de receita para franqueados" />
      </Head>

      <div className="min-h-screen bg-[#1e2128]">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          franquiaSelecionada={franquiaSelecionada}
          onFranquiaChange={setFranquiaSelecionada}
          onParametrosSaved={handleParametrosSaved}
        />

        {/* Main Content */}
        <div 
          className="min-h-screen bg-[#1e2128] transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '60px' : '280px' }}
        >
          <div className="px-6 py-4 flex flex-col">
            {/* Header */}
            <Header />

            {/* Título da Seção */}
            <div className="mb-6 mt-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></span>
                Projeção de Receita por Ano
              </h2>
            </div>

            {/* Grid de Cards Anuais */}
            {!franquiaSelecionada ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Selecione uma Franquia</h3>
                <p className="text-gray-400 text-center max-w-md">
                  Utilize o filtro na barra lateral para selecionar uma franquia e visualizar os dados de projeção.
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-gray-400">Carregando dados...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-400 text-center mb-4">{error}</div>
                <button
                  onClick={() => fetchDados(franquiaSelecionada)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : dadosFluxoAnual.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-gray-400">Nenhum dado encontrado para a franquia selecionada.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {dadosFluxoAnual.map((dados) => (
                  <FluxoAnualCard
                    key={dados.ano}
                    dados={dados}
                    isSelected={dados.ano === anoSelecionado}
                    onClick={() => setAnoSelecionado(dados.ano)}
                    onDespesaChange={handleDespesaChange}
                    parametros={parametrosFranquia || undefined}
                  />
                ))}
              </div>
            )}

            {/* Calculadora de Projeção - só aparece quando há franquia selecionada */}
            {franquiaSelecionada && (
              <div className="mt-8">
                <CalculadoraProjecao 
                  anoSelecionado={anoSelecionado} 
                  parametrosFranquia={parametrosFranquia}
                  vvrAnual={dadosFluxoAnual.find(d => d.ano === anoSelecionado)?.somaVVR || 0}
                  franquia={franquiaSelecionada}
                  dadosProjecao={dadosFluxoAnual.map(d => ({
                    ano: d.ano,
                    projCarteira: d.receitaCarteira,                                      // D + E + F
                    projNovasVendas: d.receitaNovosVendas,                                // G + H + I
                    somaAntecipacaoCarteira: d.somaAntecipacaoCarteira || 0,              // D
                    somaExecucaoCarteira: d.somaExecucaoCarteira || 0,                    // E
                    somaDemaisReceitasCarteira: d.somaDemaisReceitasCarteira || 0,        // F
                    somaAntecipacaoNovasVendas: d.somaAntecipacaoNovasVendas || 0,        // G
                    somaExecucaoNovasVendas: d.somaExecucaoNovasVendas || 0,              // H
                    somaDemaisReceitasNovasVendas: d.somaDemaisReceitasNovasVendas || 0,  // I
                    somaVVR: d.somaVVR || 0,
                    // Dados calculadora franqueado (J + K + L da aba FLUXO PROJETADO)
                    somaAntecipacaoCalcFranqueado: d.somaAntecipacaoCalcFranqueado || 0,    // J
                    somaFechamentoCalcFranqueado: d.somaFechamentoCalcFranqueado || 0,     // K
                    somaDemaisReceitasCalcFranqueado: d.somaDemaisReceitasCalcFranqueado || 0, // L
                    receitaCalcFranqueado: d.receitaCalcFranqueado || 0,                   // J + K + L
                  }))}
                  onRefresh={async () => {
                    // Recarrega os dados da planilha sem perder valores preenchidos
                    await fetchDados(franquiaSelecionada);
                    await fetchParametros(franquiaSelecionada);
                  }}
                />
              </div>
            )}

            {/* Detalhamento Mensal do Ano Selecionado - só aparece quando há franquia selecionada */}
            {franquiaSelecionada && (
              <div className="mt-6">
                <DetalhamentoMensal 
                  anoSelecionado={anoSelecionado}
                  franquia={franquiaSelecionada.toUpperCase()}
                  despesaAnual={dadosFluxoAnual.find(d => d.ano === anoSelecionado)?.custo || 0}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
