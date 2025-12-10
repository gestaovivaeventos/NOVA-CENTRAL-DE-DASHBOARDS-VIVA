'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import {
  GerencialHeader,
  GerencialLoader,
  GerencialSidebar,
  EbitdaCard,
  OkrsSection,
  KpisAtencaoTable,
  TeamPerformanceTable,
} from '../../modules/painel-gerencial/components';
import { COLORS, TRIMESTRES } from '../../modules/painel-gerencial/config/app.config';
import { GerencialKpiData, ProcessedOkrData, TeamPerformance } from '../../modules/painel-gerencial/types';

interface DashboardData {
  kpis: GerencialKpiData[];
  okrs: ProcessedOkrData[];
  ebitda: { valor: number; meta: number; percentual: number };
  teamPerformance: TeamPerformance[];
  kpisAtencao: GerencialKpiData[];
  equipes: string[];
}

export default function GerencialPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [equipeSelecionada, setEquipeSelecionada] = useState('Todas');
  const [trimestreSelecionado, setTrimestreSelecionado] = useState('Todos');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (equipeSelecionada !== 'Todas') {
          params.append('equipe', equipeSelecionada);
        }
        if (trimestreSelecionado !== 'Todos') {
          params.append('trimestre', trimestreSelecionado);
        }
        
        const response = await fetch(`/api/gerencial/data?${params}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Erro ao carregar dados');
        }
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao conectar com a API');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, equipeSelecionada, trimestreSelecionado]);

  if (authLoading || loading) {
    return (
      <div style={{ backgroundColor: COLORS.background, minHeight: '100vh' }}>
        <GerencialHeader />
        <GerencialLoader message="Carregando painel gerencial..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: COLORS.background, minHeight: '100vh' }}>
        <GerencialHeader />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            color: COLORS.danger,
          }}
        >
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Painel Gerencial | Viva Eventos</title>
        <meta name="description" content="Painel Gerencial - Visão consolidada de KPIs e OKRs" />
      </Head>

      <div style={{ backgroundColor: COLORS.background, minHeight: '100vh' }}>
        <GerencialHeader />
        
        <div style={{ display: 'flex' }}>
          <GerencialSidebar
            equipeSelecionada={equipeSelecionada}
            onEquipeChange={setEquipeSelecionada}
            equipes={data?.equipes || []}
          />

          <main
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            {/* Filtro de Trimestre */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setTrimestreSelecionado('Todos')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    backgroundColor: trimestreSelecionado === 'Todos' ? COLORS.primary : COLORS.surface,
                    color: '#fff',
                  }}
                >
                  Todos
                </button>
                {TRIMESTRES.map((tri) => (
                  <button
                    key={tri}
                    onClick={() => setTrimestreSelecionado(tri)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      backgroundColor: trimestreSelecionado === tri ? COLORS.primary : COLORS.surface,
                      color: '#fff',
                    }}
                  >
                    {tri}
                  </button>
                ))}
              </div>
            </div>

            {/* EBITDA Card */}
            {data?.ebitda && (
              <div style={{ marginBottom: '24px' }}>
                <EbitdaCard
                  valor={data.ebitda.valor}
                  meta={data.ebitda.meta}
                  percentual={data.ebitda.percentual}
                />
              </div>
            )}

            {/* Grid de conteúdo */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
                marginBottom: '24px',
              }}
            >
              {/* Desempenho por Equipe */}
              {data?.teamPerformance && (
                <TeamPerformanceTable teams={data.teamPerformance} />
              )}

              {/* KPIs que precisam de atenção */}
              {data?.kpisAtencao && (
                <KpisAtencaoTable kpis={data.kpisAtencao} />
              )}
            </div>

            {/* OKRs Section */}
            {data?.okrs && (
              <OkrsSection okrs={data.okrs} titulo="OKRs do Período" />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
