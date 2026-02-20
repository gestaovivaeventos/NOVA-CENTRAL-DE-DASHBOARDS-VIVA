/**
 * Dashboard Fluxo Realizado
 * Página para visualização do fluxo de caixa realizado
 * 
 * Layout (leitura invertida em relação à projeção):
 * 1. Recebimento FEE por Fundo - saldo disponível para requisitar
 * 2. Receitas Recebidas Totais por Fundo - histórico mês a mês desde 2025
 * 3. Realizado por Ano - compilado anual (2025 e 2026 parcial)
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header, Sidebar, RecebimentoFeeFundo, ReceitasMensaisAgrupadas, RealizadoAnualCard, ReceitasRealizadasFundo } from '@/modules/fluxo-projetado';
import { useFluxoRealizado } from '@/modules/fluxo-projetado/hooks';
import { FundoReceita } from '@/modules/fluxo-projetado/components/ReceitasRealizadasFundo';
import { ReceitaMensalAgrupada } from '@/modules/fluxo-projetado/components/ReceitasMensaisAgrupadas';
import { DadosRealizadoAnual } from '@/modules/fluxo-projetado/components/RealizadoAnualCard';
import { Loader2, BarChart3 } from 'lucide-react';
import { withAuthAndFranchiser } from '@/utils/auth';

// Mock de receitas mensais agrupadas (consolidado da franquia, não por fundo)
// TODO: Conectar com dados reais da planilha
const dadosMockReceitasMensais: ReceitaMensalAgrupada[] = [
  // 2025
  { mes: '01/2025', mesNome: 'Janeiro', ano: 2025, valorTotal: 18500.00, antecipacaoFee: 9200.00, ultimaParcelaFee: 0, demaisReceitas: 9300.00 },
  { mes: '02/2025', mesNome: 'Fevereiro', ano: 2025, valorTotal: 22800.00, antecipacaoFee: 11400.00, ultimaParcelaFee: 0, demaisReceitas: 11400.00 },
  { mes: '03/2025', mesNome: 'Março', ano: 2025, valorTotal: 19600.00, antecipacaoFee: 9800.00, ultimaParcelaFee: 0, demaisReceitas: 9800.00 },
  { mes: '04/2025', mesNome: 'Abril', ano: 2025, valorTotal: 24300.00, antecipacaoFee: 12150.00, ultimaParcelaFee: 0, demaisReceitas: 12150.00 },
  { mes: '05/2025', mesNome: 'Maio', ano: 2025, valorTotal: 21500.00, antecipacaoFee: 10750.00, ultimaParcelaFee: 0, demaisReceitas: 10750.00 },
  { mes: '06/2025', mesNome: 'Junho', ano: 2025, valorTotal: 26100.00, antecipacaoFee: 13050.00, ultimaParcelaFee: 0, demaisReceitas: 13050.00 },
  { mes: '07/2025', mesNome: 'Julho', ano: 2025, valorTotal: 18900.00, antecipacaoFee: 9450.00, ultimaParcelaFee: 0, demaisReceitas: 9450.00 },
  { mes: '08/2025', mesNome: 'Agosto', ano: 2025, valorTotal: 23400.00, antecipacaoFee: 11700.00, ultimaParcelaFee: 0, demaisReceitas: 11700.00 },
  { mes: '09/2025', mesNome: 'Setembro', ano: 2025, valorTotal: 20100.00, antecipacaoFee: 10050.00, ultimaParcelaFee: 0, demaisReceitas: 10050.00 },
  { mes: '10/2025', mesNome: 'Outubro', ano: 2025, valorTotal: 25600.00, antecipacaoFee: 12800.00, ultimaParcelaFee: 0, demaisReceitas: 12800.00 },
  { mes: '11/2025', mesNome: 'Novembro', ano: 2025, valorTotal: 48000.00, antecipacaoFee: 8000.00, ultimaParcelaFee: 32000.00, demaisReceitas: 8000.00 },
  { mes: '12/2025', mesNome: 'Dezembro', ano: 2025, valorTotal: 31200.00, antecipacaoFee: 5200.00, ultimaParcelaFee: 20800.00, demaisReceitas: 5200.00 },
  // 2026
  { mes: '01/2026', mesNome: 'Janeiro', ano: 2026, valorTotal: 28400.00, antecipacaoFee: 14200.00, ultimaParcelaFee: 0, demaisReceitas: 14200.00 },
];

// Mock de dados anuais
// TODO: Conectar com dados reais da planilha
const dadosMockRealizadoAnual: DadosRealizadoAnual[] = [
  {
    ano: 2025,
    receitaTotal: 85600.00,
    antecipacaoFee: 45360.00,
    ultimaParcelaFee: 26000.00,
    demaisReceitas: 14240.00,
    despesas: 42000.00,
    saldo: 43600.00,
    mesesComDados: 12,
    isAnoCompleto: true
  },
  {
    ano: 2026,
    receitaTotal: 5000.00,
    antecipacaoFee: 3000.00,
    ultimaParcelaFee: 0,
    demaisReceitas: 2000.00,
    despesas: 3500.00,
    saldo: 1500.00,
    mesesComDados: 1, // Só janeiro foi realizado
    isAnoCompleto: false
  },
];

// Mock de receitas por fundo (até integrar com a planilha)
// TODO: Conectar com dados reais da planilha
const gerarFundosMockReceita = (): FundoReceita[] => {
  return []; // Retorna vazio por enquanto
};

const dadosMockFundosReceita: FundoReceita[] = gerarFundosMockReceita();

function FluxoRealizadoDashboard() {
  const router = useRouter();
  
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para a franquia selecionada
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

  // Hook para buscar dados reais de FEE por fundo
  const { fundos: fundosFee, loading: loadingFee, error: errorFee } = useFluxoRealizado(franquiaSelecionada);

  // Estados para dados ainda mockados (outros blocos)
  const [fundosReceita, setFundosReceita] = useState<FundoReceita[]>([]);
  const [receitasMensais, setReceitasMensais] = useState<ReceitaMensalAgrupada[]>([]);
  const [dadosAnuais, setDadosAnuais] = useState<DadosRealizadoAnual[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  // Ler franquia da URL quando a página carrega
  useEffect(() => {
    if (router.isReady && router.query.franquia) {
      const franquiaFromUrl = decodeURIComponent(router.query.franquia as string);
      setFranquiaSelecionada(franquiaFromUrl);
    }
  }, [router.isReady, router.query.franquia]);

  // Carrega dados mock para os outros blocos quando franquia é selecionada
  // TODO: Substituir por dados reais quando integrar as outras seções
  useEffect(() => {
    if (franquiaSelecionada) {
      setFundosReceita(dadosMockFundosReceita);
      setReceitasMensais(dadosMockReceitasMensais);
      setDadosAnuais(dadosMockRealizadoAnual);
    } else {
      setFundosReceita([]);
      setReceitasMensais([]);
      setDadosAnuais([]);
    }
  }, [franquiaSelecionada]);

  return (
    <>
      <Head>
        <title>Fluxo Realizado - Gestão de Caixa</title>
        <meta name="description" content="Fluxo de caixa realizado para franqueados" />
      </Head>

      <div className="min-h-screen bg-[#1e2128]">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
          franquiaSelecionada={franquiaSelecionada}
          onFranquiaChange={setFranquiaSelecionada}
          paginaAtiva="realizado"
        />

        {/* Main Content */}
        <div 
          className="min-h-screen bg-[#1e2128] transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '60px' : '280px' }}
        >
          <div className="px-6 py-4 flex flex-col">
            {/* Header */}
            <Header titulo="FLUXO REALIZADO" />

            {/* Conteúdo Principal */}
            {!franquiaSelecionada ? (
              // Mensagem para selecionar franquia
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-24 h-24 rounded-full bg-gray-700/30 flex items-center justify-center mb-6">
                  <BarChart3 className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Selecione uma Franquia</h3>
                <p className="text-gray-400 text-center max-w-md">
                  Utilize o filtro na barra lateral para selecionar sua franquia e visualizar o fluxo de caixa realizado.
                </p>
              </div>
            ) : loadingFee ? (
              // Loading
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <span className="ml-3 text-gray-400">Carregando dados...</span>
              </div>
            ) : (
              // Conteúdo com dados
              <div className="space-y-6 pb-8">
                {/* BLOCO 1: Recebimento FEE por Fundo */}
                <RecebimentoFeeFundo 
                  fundos={fundosFee}
                  loading={loadingFee}
                />

                {/* BLOCO 2: Receitas Mensais Agrupadas (consolidado da franquia) */}
                <ReceitasMensaisAgrupadas 
                  receitas={receitasMensais}
                  loading={false}
                />

                {/* BLOCO 3: Receitas Realizadas por Fundo */}
                <ReceitasRealizadasFundo 
                  fundos={fundosReceita}
                  loading={false}
                />

                {/* BLOCO 4: Realizado por Ano */}
                <div className="rounded-xl overflow-hidden border border-gray-700/50 p-4" style={{ background: 'linear-gradient(180deg, #1e2028 0%, #181a20 100%)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Realizado por Ano
                      </h3>
                      <p className="text-xs text-gray-400">
                        Compilado anual do fluxo de caixa realizado
                      </p>
                    </div>
                  </div>
                  
                  {/* Cards de Anos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dadosAnuais.map((dados) => (
                      <RealizadoAnualCard
                        key={dados.ano}
                        dados={dados}
                        isSelected={anoSelecionado === dados.ano}
                        onClick={() => setAnoSelecionado(anoSelecionado === dados.ano ? null : dados.ano)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Exporta com proteção de rota - apenas franqueadoras (accessLevel = 1) podem acessar
export default withAuthAndFranchiser(FluxoRealizadoDashboard);
