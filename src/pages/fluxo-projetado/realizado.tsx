/**
 * Dashboard Fluxo Realizado
 * Página para visualização do fluxo de caixa realizado
 * 
 * Layout:
 * 1. Recebimento FEE por Fundo - saldo disponível para requisitar
 * 2. Receitas Mensais Agrupadas - histórico mês a mês desde 2025
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header, Sidebar, RecebimentoFeeFundo, ReceitasMensaisAgrupadas } from '@/modules/fluxo-projetado';
import { useFluxoRealizado, useReceitasMensais } from '@/modules/fluxo-projetado/hooks';
import { Loader2, BarChart3 } from 'lucide-react';
import { withAuthAndFranchiser } from '@/utils/auth';

function FluxoRealizadoDashboard() {
  const router = useRouter();
  
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para a franquia selecionada
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

  // Hook para buscar dados reais de FEE por fundo
  const { fundos: fundosFee, loading: loadingFee } = useFluxoRealizado(franquiaSelecionada);

  // Hook para buscar dados reais de receitas mensais (aba RPS FEE E MARGEM)
  const { receitas: receitasMensais, loading: loadingReceitas } = useReceitasMensais(franquiaSelecionada);

  // Ler franquia da URL quando a página carrega
  useEffect(() => {
    if (router.isReady && router.query.franquia) {
      const franquiaFromUrl = decodeURIComponent(router.query.franquia as string);
      setFranquiaSelecionada(franquiaFromUrl);
    }
  }, [router.isReady, router.query.franquia]);

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
