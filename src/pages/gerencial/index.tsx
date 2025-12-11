'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import {
  Header,
  Sidebar,
  Footer,
  Loading,
  FilterPanel,
  EbitdaCard,
  OkrsSection,
  KpisAtencaoTable,
  TeamPerformanceTable,
  Card
} from '../../modules/painel-gerencial/components';
import { useDashboardData } from '../../modules/painel-gerencial/hooks';

export default function GerencialPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { 
    data, 
    loading, 
    error, 
    refetch,
    selectedCompetencia,
    changeCompetencia 
  } = useDashboardData();

  if (loading) {
    return (
      <>
        <Head>
          <title>Painel Gerencial | Carregando...</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex items-center justify-center">
          <Loading mensagem="Carregando dados do painel..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Painel Gerencial | Erro</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex flex-col items-center justify-center">
          <div className="text-red-400 text-center">
            <p className="text-4xl mb-4">❌</p>
            <p className="text-xl font-semibold mb-2">Erro ao carregar dados</p>
            <p className="text-text-secondary mb-4">{error}</p>
            <button
              onClick={refetch}
              className="btn-primary"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>Painel Gerencial | Sem dados</title>
        </Head>
        <div className="min-h-screen bg-dark-primary flex items-center justify-center">
          <p className="text-text-secondary">Nenhum dado disponível</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Painel Gerencial | Viva Eventos</title>
        <meta name="description" content="Painel Gerencial - Visão consolidada de KPIs e OKRs" />
      </Head>
      
      <div className="dashboard-wrapper">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        >
          {/* Filtros dentro da Sidebar */}
          <FilterPanel
            competencias={data.competencias}
            selectedCompetencia={selectedCompetencia}
            onCompetenciaChange={changeCompetencia}
            onRefresh={refetch}
          />
        </Sidebar>

        {/* Main Content */}
        <div 
          className="flex-1 min-h-screen bg-dark-primary transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '60px' : '300px' }}
        >
          <Header sidebarCollapsed={sidebarCollapsed} />
          
          <main className="p-5 pb-12">
            {/* EBITDA Section */}
            <div className="mb-6">
              <EbitdaCard ebitdaByYear={data.ebitdaByYear} />
            </div>

            {/* OKRs Section */}
            <OkrsSection okrs={data.okrs} competencia={selectedCompetencia} />

            {/* Team Performance Table */}
            <TeamPerformanceTable 
              teams={data.teamPerformance} 
              competencia={selectedCompetencia} 
            />

            {/* KPIs que precisam de atenção */}
            <KpisAtencaoTable 
              kpis={data.kpisAtencao} 
              competencia={selectedCompetencia} 
            />
          </main>

          <Footer />
        </div>
      </div>
    </>
  );
}
