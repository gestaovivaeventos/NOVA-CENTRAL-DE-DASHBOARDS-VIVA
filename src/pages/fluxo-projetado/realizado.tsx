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
import { useFluxoRealizado, useReceitasMensais } from '@/modules/fluxo-projetado/hooks';
import { FundoReceita } from '@/modules/fluxo-projetado/components/ReceitasRealizadasFundo';
import { DadosRealizadoAnual } from '@/modules/fluxo-projetado/components/RealizadoAnualCard';
import { Loader2, BarChart3 } from 'lucide-react';
import { withAuthAndFranchiser } from '@/utils/auth';

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
const dadosMockFundosReceita: FundoReceita[] = [
  {
    id: '001',
    nome: 'TURMA 9º ANO A - COLÉGIO VIVA',
    unidade: 'Barbacena',
    valorFee: 45000.00,        // VALOR FEE do contrato
    feeRecebido: 28500.00,     // FEE RECEBIDO (antecipação)
    margemTotal: 8500.00,      // MARGEM TOTAL do contrato
    margemRecebida: 4200.00,   // MARGEM JÁ RECEBIDA
    saldoFundo: 52300.00,      // SALDO disponível no fundo
  },
  {
    id: '002',
    nome: 'TURMA 3º ANO EM - ESCOLA NOVA',
    unidade: 'Barbacena',
    valorFee: 38000.00,
    feeRecebido: 38000.00,     // 100% recebido
    margemTotal: 7200.00,
    margemRecebida: 7200.00,   // 100% recebida
    saldoFundo: 15800.00,
  },
  {
    id: '003',
    nome: 'TURMA 8º ANO B - COLÉGIO CENTRAL',
    unidade: 'Barbacena',
    valorFee: 52000.00,
    feeRecebido: 31200.00,     // 60% recebido
    margemTotal: 9800.00,
    margemRecebida: 0,         // Margem pendente
    saldoFundo: 78500.00,
  },
  {
    id: '004',
    nome: 'TURMA 7º ANO - ESCOLA ESPERANÇA',
    unidade: 'Barbacena',
    valorFee: 29500.00,
    feeRecebido: 14750.00,     // 50% recebido
    margemTotal: 5600.00,
    margemRecebida: 2800.00,   // 50% recebida
    saldoFundo: 33200.00,
  },
  {
    id: '005',
    nome: 'TURMA FORMANDOS 2025 - COLÉGIO ABC',
    unidade: 'Barbacena',
    valorFee: 67500.00,
    feeRecebido: 54000.00,     // 80% recebido
    margemTotal: 12500.00,
    margemRecebida: 10000.00,  // 80% recebida
    saldoFundo: 125000.00,
  },
];

function FluxoRealizadoDashboard() {
  const router = useRouter();
  
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para a franquia selecionada
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

  // Hook para buscar dados reais de FEE por fundo
  const { fundos: fundosFee, loading: loadingFee, error: errorFee } = useFluxoRealizado(franquiaSelecionada);

  // Hook para buscar dados reais de receitas mensais (aba RPS FEE E MARGEM)
  const { receitas: receitasMensais, loading: loadingReceitas } = useReceitasMensais(franquiaSelecionada);

  // Estados para dados ainda mockados (outros blocos)
  const [fundosReceita, setFundosReceita] = useState<FundoReceita[]>([]);
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
      setDadosAnuais(dadosMockRealizadoAnual);
    } else {
      setFundosReceita([]);
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
                  loading={loadingReceitas}
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

                  {/* Aviso de dados mockados */}
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-300">
                      <span className="font-semibold">Dados de exemplo:</span> Esta seção está exibindo dados mockados para demonstração. A integração com a planilha real está pendente.
                    </p>
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
