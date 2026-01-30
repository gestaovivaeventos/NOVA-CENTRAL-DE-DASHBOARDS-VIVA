/**
 * Dashboard Fluxo Realizado
 * Página para visualização do fluxo de caixa realizado
 */

import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { Header, Sidebar } from '@/modules/fluxo-projetado';
import { ParametrosFranquiaCard } from '@/modules/fluxo-projetado/components/FluxoAnualCard';
import { Construction } from 'lucide-react';

export default function FluxoRealizadoDashboard() {
  // Estado para controle da sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estado para a franquia selecionada
  const [franquiaSelecionada, setFranquiaSelecionada] = useState<string>('');

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

            {/* Conteúdo em construção */}
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
                <Construction className="w-12 h-12 text-orange-500" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Em Construção</h3>
              <p className="text-gray-400 text-center max-w-md">
                Esta página está sendo desenvolvida. Em breve você poderá visualizar o fluxo de caixa realizado da sua franquia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
