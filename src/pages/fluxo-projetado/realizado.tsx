/**
 * Dashboard Fluxo Realizado
 * Página para visualização do fluxo de caixa realizado
 * 
 * Layout (leitura invertida em relação à projeção):
 * 1. Recebimento FEE por Fundo - saldo disponível para requisitar
 * 2. Receitas Recebidas Totais por Fundo - histórico mês a mês desde 2025
 * 3. Realizado por Ano - compilado anual (2025 e 2026 parcial)
 */

import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { Header, Sidebar, RecebimentoFeeFundo, ReceitasRecebidasFundo, RealizadoAnualCard } from '@/modules/fluxo-projetado';
import { FundoFee } from '@/modules/fluxo-projetado/components/RecebimentoFeeFundo';
import { FundoReceita } from '@/modules/fluxo-projetado/components/ReceitasRecebidasFundo';
import { DadosRealizadoAnual } from '@/modules/fluxo-projetado/components/RealizadoAnualCard';
import { Loader2, BarChart3 } from 'lucide-react';

// Função para gerar fundos mock em massa (simula 100+ fundos)
// Nova estrutura: feeTotal, feeRecebido, feeDisponivelAntecipacao, saldoFundo
const gerarFundosMockFee = (): FundoFee[] => {
  const unidades = [
    'Colégio São Paulo', 'Instituto Educacional', 'Escola Municipal', 'Centro de Ensino',
    'Colégio Estadual', 'Escola Particular', 'Instituto Federal', 'Escola Técnica',
    'Colégio Adventista', 'Escola Batista', 'Instituto Santa Maria', 'Colégio Dom Bosco',
    'Escola Integrada', 'Centro Educacional', 'Colégio Objetivo', 'Escola Positivo'
  ];
  
  const fundos: FundoFee[] = [];
  
  for (let i = 1; i <= 85; i++) {
    const unidade = unidades[i % unidades.length];
    const ano = 2024 + Math.floor(i / 40);
    
    // Gerar valores realistas
    const feeTotal = Math.floor(Math.random() * 40000) + 15000; // 15k a 55k
    
    // Determinar cenário: finalizado, saque disponível ou saldo insuficiente
    const cenario = i % 5; // 0,1,2 = saque disponível, 3 = saldo insuficiente, 4 = finalizado
    
    let feeRecebido: number;
    let feeDisponivelAntecipacao: number;
    let saldoFundo: number;
    
    if (cenario === 4) {
      // FINALIZADO: fee 100% recebido
      feeRecebido = feeTotal;
      feeDisponivelAntecipacao = 0;
      saldoFundo = Math.floor(Math.random() * 10000); // Saldo residual pequeno
    } else if (cenario === 3) {
      // SALDO INSUFICIENTE: fee disponível > saldo do fundo
      feeRecebido = Math.floor(feeTotal * (0.3 + Math.random() * 0.3)); // 30-60% recebido
      feeDisponivelAntecipacao = Math.floor(feeTotal * (0.1 + Math.random() * 0.2)); // 10-30% disponível
      saldoFundo = Math.floor(feeDisponivelAntecipacao * (0.3 + Math.random() * 0.5)); // Saldo menor que disponível
    } else {
      // SAQUE DISPONÍVEL: fee disponível > 0 e saldo >= fee disponível
      feeRecebido = Math.floor(feeTotal * (0.2 + Math.random() * 0.4)); // 20-60% recebido
      feeDisponivelAntecipacao = Math.floor(feeTotal * (0.1 + Math.random() * 0.25)); // 10-35% disponível
      saldoFundo = Math.floor(feeDisponivelAntecipacao * (1.2 + Math.random() * 2)); // Saldo maior que disponível
    }
    
    fundos.push({
      id: i.toString(),
      nome: `Turma ${String(i).padStart(3, '0')} - ${unidade} ${ano}`,
      unidade: unidade,
      feeTotal: feeTotal,
      feeRecebido: feeRecebido,
      feeDisponivelAntecipacao: feeDisponivelAntecipacao,
      saldoFundo: saldoFundo,
    });
  }
  
  return fundos;
};

const dadosMockFundosFee: FundoFee[] = gerarFundosMockFee();

const dadosMockFundosReceita: FundoReceita[] = [
  {
    id: '1',
    nome: 'Turma Colégio Exemplo 2024',
    unidade: 'Colégio Exemplo',
    ativo: true,
    totalRecebido: 21000.00,
    receitasMensais: [
      { mes: '01/2025', mesNome: 'Janeiro', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '02/2025', mesNome: 'Fevereiro', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '03/2025', mesNome: 'Março', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '04/2025', mesNome: 'Abril', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '05/2025', mesNome: 'Maio', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '06/2025', mesNome: 'Junho', ano: 2025, valorTotal: 3500.00, antecipacaoFee: 2100.00, ultimaParcelaFee: 0, demaisReceitas: 1400.00 },
      { mes: '07/2025', mesNome: 'Julho', ano: 2025, valorTotal: 0, antecipacaoFee: 0, ultimaParcelaFee: 0, demaisReceitas: 0 },
      { mes: '08/2025', mesNome: 'Agosto', ano: 2025, valorTotal: 0, antecipacaoFee: 0, ultimaParcelaFee: 0, demaisReceitas: 0 },
      { mes: '09/2025', mesNome: 'Setembro', ano: 2025, valorTotal: 0, antecipacaoFee: 0, ultimaParcelaFee: 0, demaisReceitas: 0 },
      { mes: '10/2025', mesNome: 'Outubro', ano: 2025, valorTotal: 0, antecipacaoFee: 0, ultimaParcelaFee: 0, demaisReceitas: 0 },
      { mes: '11/2025', mesNome: 'Novembro', ano: 2025, valorTotal: 14000.00, antecipacaoFee: 0, ultimaParcelaFee: 14000.00, demaisReceitas: 0 },
      { mes: '12/2025', mesNome: 'Dezembro', ano: 2025, valorTotal: 0, antecipacaoFee: 0, ultimaParcelaFee: 0, demaisReceitas: 0 },
      { mes: '01/2026', mesNome: 'Janeiro', ano: 2026, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
    ]
  },
  {
    id: '2',
    nome: 'Turma Instituto ABC 2024',
    unidade: 'Instituto ABC',
    ativo: true,
    totalRecebido: 16800.00,
    receitasMensais: [
      { mes: '01/2025', mesNome: 'Janeiro', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '02/2025', mesNome: 'Fevereiro', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '03/2025', mesNome: 'Março', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '04/2025', mesNome: 'Abril', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '05/2025', mesNome: 'Maio', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '06/2025', mesNome: 'Junho', ano: 2025, valorTotal: 2800.00, antecipacaoFee: 1680.00, ultimaParcelaFee: 0, demaisReceitas: 1120.00 },
      { mes: '01/2026', mesNome: 'Janeiro', ano: 2026, valorTotal: 2200.00, antecipacaoFee: 1320.00, ultimaParcelaFee: 0, demaisReceitas: 880.00 },
    ]
  },
  {
    id: '5',
    nome: 'Turma Escola Antiga 2024',
    unidade: 'Escola Antiga',
    ativo: false, // Fundo inativo de 2025
    totalRecebido: 18000.00,
    receitasMensais: [
      { mes: '01/2025', mesNome: 'Janeiro', ano: 2025, valorTotal: 3000.00, antecipacaoFee: 1800.00, ultimaParcelaFee: 0, demaisReceitas: 1200.00 },
      { mes: '02/2025', mesNome: 'Fevereiro', ano: 2025, valorTotal: 3000.00, antecipacaoFee: 1800.00, ultimaParcelaFee: 0, demaisReceitas: 1200.00 },
      { mes: '03/2025', mesNome: 'Março', ano: 2025, valorTotal: 12000.00, antecipacaoFee: 0, ultimaParcelaFee: 12000.00, demaisReceitas: 0 },
    ]
  },
];

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

export default function FluxoRealizadoDashboard() {
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para a franquia selecionada
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

  // Estados para dados (atualmente usando mocks)
  const [fundosFee, setFundosFee] = useState<FundoFee[]>([]);
  const [fundosReceita, setFundosReceita] = useState<FundoReceita[]>([]);
  const [dadosAnuais, setDadosAnuais] = useState<DadosRealizadoAnual[]>([]);
  const [loading, setLoading] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);

  // Carrega dados mock quando franquia é selecionada
  useEffect(() => {
    if (franquiaSelecionada) {
      setLoading(true);
      // Simula carregamento de API
      setTimeout(() => {
        setFundosFee(dadosMockFundosFee);
        setFundosReceita(dadosMockFundosReceita);
        setDadosAnuais(dadosMockRealizadoAnual);
        setLoading(false);
      }, 500);
    } else {
      setFundosFee([]);
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
            ) : loading ? (
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
                  loading={false}
                />

                {/* BLOCO 2: Receitas Recebidas Totais por Fundo */}
                <ReceitasRecebidasFundo 
                  fundos={fundosReceita}
                  loading={false}
                />

                {/* BLOCO 3: Realizado por Ano */}
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
