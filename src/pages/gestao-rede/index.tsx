/**
 * Gestão Rede - Dashboard Principal
 * Visualização da estrutura hierárquica das franquias
 */

import React, { useState, useMemo, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  GestaoRedeLayout,
  KPICard,
  HierarquiaTree,
  GraficoDonut,
  GraficoBarras,
  TabelaFranquias,
  Footer,
} from '@/modules/gestao-rede';
import { 
  FRANQUIAS_MOCK, 
  calcularResumoRede, 
  montarArvoreHierarquica,
  CORES 
} from '@/modules/gestao-rede/utils';

export default function GestaoRedeDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Dados mockados
  const franquias = FRANQUIAS_MOCK;
  const resumo = useMemo(() => calcularResumoRede(franquias), [franquias]);
  const arvoreHierarquica = useMemo(() => montarArvoreHierarquica(franquias), [franquias]);

  // Estado para filtro de tabela
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');
  
  // Franquias filtradas
  const franquiasFiltradas = useMemo(() => {
    if (filtroStatus === 'TODOS') return franquias;
    return franquias.filter(f => f.status === filtroStatus);
  }, [franquias, filtroStatus]);

  // Dados para gráficos
  const dadosStatusGeral = [
    { nome: 'Ativas', valor: resumo.ativas, cor: CORES.ativas },
    { nome: 'Inativas', valor: resumo.inativas, cor: CORES.inativas },
  ];

  const dadosOperacao = [
    { nome: 'Em Implantação', valor: resumo.emImplantacao, cor: CORES.implantacao },
    { nome: 'Em Operação', valor: resumo.emOperacao, cor: CORES.operacao },
  ];

  const dadosMaturidade = [
    { nome: 'Incubação 1', valor: resumo.incubacao1, cor: CORES.incubacao1 },
    { nome: 'Incubação 2', valor: resumo.incubacao2, cor: CORES.incubacao2 },
    { nome: 'Incubação 3', valor: resumo.incubacao3, cor: CORES.incubacao3 },
    { nome: 'Maduras', valor: resumo.maduras, cor: CORES.maduras },
  ];

  const dadosBarrasStatus = [
    { nome: 'Maduras', valor: resumo.maduras, cor: CORES.maduras },
    { nome: 'Em Implantação', valor: resumo.emImplantacao, cor: CORES.implantacao },
    { nome: 'Em Incubação', valor: resumo.emIncubacao, cor: CORES.incubacao },
    { nome: 'Inativas', valor: resumo.inativas, cor: CORES.inativas },
  ];

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#212529',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#adb5bd',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FF6600',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p>Carregando...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Gestão Rede - Viva Eventos</title>
        <link 
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>

      <GestaoRedeLayout currentPage="dashboard">
        {/* Header */}
        <div style={{ backgroundColor: '#212529' }}>
          <div className="container mx-auto px-4 py-6">
            <div 
              style={{
                backgroundColor: '#343A40',
                padding: '20px 30px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
                borderBottom: '3px solid #FF6600',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div className="flex items-center space-x-6">
                <div style={{ position: 'relative', width: '140px', height: '50px' }}>
                  <Image 
                    src="/images/logo_viva.png" 
                    alt="Viva Eventos" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
                
                <div className="border-l border-gray-600 pl-6 h-14 flex flex-col justify-center">
                  <h1 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Gestão Rede
                  </h1>
                  <span style={{ 
                    color: '#adb5bd', 
                    fontSize: '0.75rem',
                    fontFamily: 'Poppins, sans-serif' 
                  }}>
                    Visão Geral da Rede de Franquias
                  </span>
                </div>
              </div>

              {/* Info badge */}
              <div style={{
                backgroundColor: '#FF660020',
                border: '1px solid #FF6600',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Building2 size={18} style={{ color: '#FF6600' }} />
                <span style={{ color: '#FF6600', fontWeight: 600, fontSize: '0.9rem' }}>
                  Dados Mockados para Validação
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="container mx-auto px-4 py-6">
          {/* KPIs Principais */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '24px'
          }}>
            <KPICard
              titulo="Total de Franquias"
              valor={resumo.totalFranquias}
              cor={CORES.primaria}
              icone={<Building2 size={32} />}
            />
            <KPICard
              titulo="Franquias Ativas"
              valor={resumo.ativas}
              total={resumo.totalFranquias}
              porcentagem={(resumo.ativas / resumo.totalFranquias) * 100}
              cor={CORES.ativas}
              icone={<CheckCircle size={32} />}
              onClick={() => setFiltroStatus(filtroStatus === 'ATIVA' ? 'TODOS' : 'ATIVA')}
              selecionado={filtroStatus === 'ATIVA'}
            />
            <KPICard
              titulo="Franquias Inativas"
              valor={resumo.inativas}
              total={resumo.totalFranquias}
              porcentagem={(resumo.inativas / resumo.totalFranquias) * 100}
              cor={CORES.inativas}
              icone={<XCircle size={32} />}
              onClick={() => setFiltroStatus(filtroStatus === 'INATIVA' ? 'TODOS' : 'INATIVA')}
              selecionado={filtroStatus === 'INATIVA'}
            />
            <KPICard
              titulo="Em Implantação"
              valor={resumo.emImplantacao}
              total={resumo.ativas}
              porcentagem={(resumo.emImplantacao / resumo.ativas) * 100}
              cor={CORES.implantacao}
              icone={<Clock size={32} />}
              subtitulo="das ativas"
            />
            <KPICard
              titulo="Em Incubação"
              valor={resumo.emIncubacao}
              total={resumo.emOperacao}
              porcentagem={resumo.emOperacao > 0 ? (resumo.emIncubacao / resumo.emOperacao) * 100 : 0}
              cor={CORES.incubacao}
              icone={<TrendingUp size={32} />}
              subtitulo="em operação"
            />
            <KPICard
              titulo="Franquias Maduras"
              valor={resumo.maduras}
              total={resumo.emOperacao}
              porcentagem={resumo.emOperacao > 0 ? (resumo.maduras / resumo.emOperacao) * 100 : 0}
              cor={CORES.maduras}
              icone={<Zap size={32} />}
              subtitulo="em operação"
            />
          </div>

          {/* Grid de 2 colunas */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Hierarquia em Árvore */}
            <HierarquiaTree 
              data={arvoreHierarquica}
              expandido={true}
            />

            {/* Gráficos lado a lado */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Gráfico Donut - Status Geral */}
              <GraficoDonut
                dados={dadosStatusGeral}
                titulo="Distribuição por Status"
                valorCentral={resumo.totalFranquias}
                labelCentral="Total"
                tamanho={180}
              />

              {/* Gráfico Donut - Maturidade */}
              <GraficoDonut
                dados={dadosMaturidade}
                titulo="Distribuição por Maturidade"
                valorCentral={resumo.emOperacao}
                labelCentral="Em Operação"
                tamanho={180}
              />
            </div>
          </div>

          {/* Gráfico de Barras */}
          <div style={{ marginBottom: '24px' }}>
            <GraficoBarras
              dados={dadosBarrasStatus}
              titulo="Visão Comparativa por Categoria"
              mostrarValores={true}
              mostrarPorcentagem={true}
            />
          </div>

          {/* Cards de Incubação */}
          <div style={{
            backgroundColor: '#343A40',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{
              color: '#adb5bd',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #555',
              fontFamily: 'Poppins, sans-serif',
            }}>
              Detalhamento - Franquias em Incubação
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '16px'
            }}>
              {[
                { fase: 1, valor: resumo.incubacao1, cor: CORES.incubacao1, descricao: 'Primeiros 6 meses' },
                { fase: 2, valor: resumo.incubacao2, cor: CORES.incubacao2, descricao: '6 a 12 meses' },
                { fase: 3, valor: resumo.incubacao3, cor: CORES.incubacao3, descricao: '12 a 18 meses' },
              ].map((item) => (
                <div 
                  key={item.fase}
                  style={{
                    backgroundColor: '#212529',
                    borderRadius: '10px',
                    padding: '16px',
                    borderLeft: `4px solid ${item.cor}`,
                    transition: 'transform 0.2s',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      color: '#adb5bd',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}>
                      Incubação {item.fase}
                    </span>
                    <span style={{
                      backgroundColor: item.cor,
                      color: '#000',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      fontFamily: "'Orbitron', 'Poppins', sans-serif",
                    }}>
                      {item.valor}
                    </span>
                  </div>
                  <p style={{
                    color: '#6c757d',
                    fontSize: '0.75rem',
                    margin: 0,
                  }}>
                    {item.descricao}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de Franquias */}
          <TabelaFranquias 
            franquias={franquiasFiltradas}
            titulo={
              filtroStatus === 'TODOS' 
                ? 'Todas as Franquias' 
                : filtroStatus === 'ATIVA' 
                  ? 'Franquias Ativas' 
                  : 'Franquias Inativas'
            }
          />

          {/* Footer */}
          <Footer />
        </div>
      </GestaoRedeLayout>
    </>
  );
}
