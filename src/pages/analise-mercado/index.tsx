/**
 * Análise de Mercado - Comparativo Brasil vs Viva
 * Layout lado a lado para comparar mercado nacional com participação Viva
 * Acesso: Somente Franqueadora (accessLevel = 1)
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import { AnaliseMercadoLayout } from '@/modules/analise-mercado';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus, Star, Globe, Building2, Users, GraduationCap, Stethoscope, BookOpen } from 'lucide-react';
import type { KPIMercado } from '@/modules/analise-mercado/types';

export default function AnaliseMercadoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { dados, loading, dadosFiltrados } = useAnaliseMercado();
  const [visaoAtiva, setVisaoAtiva] = useState<'comparativo' | 'brasil' | 'viva'>('comparativo');
  const [accessChecked, setAccessChecked] = useState(false);

  // Verificar autenticação e permissão (apenas Franqueadora)
  useEffect(() => {
    if (!authLoading && !accessChecked) {
      if (!isAuthenticated) {
        router.replace('/login');
        return;
      }
      if (user && user.accessLevel !== 1) {
        router.replace('/');
        return;
      }
      setAccessChecked(true);
    }
  }, [isAuthenticated, authLoading, user, router, accessChecked]);

  // Loading state
  if (authLoading || loading || !accessChecked) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#212529', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FF6600',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
          <p style={{ marginTop: '16px', color: '#adb5bd' }}>Carregando dados de mercado...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Verificar permissão
  if (user && user.accessLevel !== 1) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#212529', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h3 style={{ color: '#F8F9FA', fontSize: '1.2rem', marginBottom: '8px' }}>Acesso Restrito</h3>
          <p style={{ color: '#adb5bd' }}>Este módulo é exclusivo para usuários com nível de acesso Franqueadora.</p>
        </div>
      </div>
    );
  }

  const { evolucao, participacao, segmentos, kpis } = dadosFiltrados;
  const ultimoAno = participacao[participacao.length - 1];
  const ultimoEvolucao = evolucao[evolucao.length - 1];
  const medicina = segmentos.find(s => s.id === 'medicina');

  // Opções padrão dos gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#ADB5BD', usePointStyle: true, padding: 12, font: { size: 11 } } },
      datalabels: { display: false },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ADB5BD', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ADB5BD', font: { size: 10 } } },
    },
  };

  // ===== DADOS DOS GRÁFICOS - VISÃO BRASIL =====
  const brasilEvolucaoData = {
    labels: evolucao.map(d => d.ano.toString()),
    datasets: [
      {
        label: 'Matriculados (milhões)',
        data: evolucao.map(d => d.matriculados_total / 1000000),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Concluintes (milhares)',
        data: evolucao.map(d => d.concluintes_total / 1000),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const brasilModalidadeData = {
    labels: evolucao.map(d => d.ano.toString()),
    datasets: [
      { label: 'Presencial', data: evolucao.map(d => d.matriculados_presencial / 1000000), backgroundColor: '#3B82F6', borderRadius: 4 },
      { label: 'EAD', data: evolucao.map(d => d.matriculados_ead / 1000000), backgroundColor: '#8B5CF6', borderRadius: 4 },
    ],
  };

  const brasilSegmentosData = {
    labels: ['Ensino Superior', 'Medicina', 'Ensino Médio'],
    datasets: [{
      data: [
        ultimoEvolucao?.concluintes_total || 0,
        ultimoEvolucao?.concluintes_medicina || 0,
        ultimoEvolucao?.concluintes_ensino_medio || 0,
      ],
      backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981'],
      borderColor: '#343A40',
      borderWidth: 2,
    }],
  };

  // ===== DADOS DOS GRÁFICOS - VISÃO VIVA =====
  const vivaEvolucaoData = {
    labels: participacao.map(d => d.ano.toString()),
    datasets: [
      {
        label: 'Total Viva',
        data: participacao.map(d => d.viva_total),
        borderColor: '#FF6600',
        backgroundColor: 'rgba(255, 102, 0, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Presencial',
        data: participacao.map(d => d.viva_presencial),
        borderColor: '#10B981',
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const vivaDistribuicaoData = {
    labels: ['Medicina', 'Outros Presencial', 'EAD/Híbrido'],
    datasets: [{
      data: [
        ultimoAno?.viva_medicina || 0,
        (ultimoAno?.viva_presencial || 0) - (ultimoAno?.viva_medicina || 0),
        (ultimoAno?.viva_total || 0) - (ultimoAno?.viva_presencial || 0),
      ],
      backgroundColor: ['#FF6600', '#3B82F6', '#6B7280'],
      borderColor: '#343A40',
      borderWidth: 2,
    }],
  };

  const vivaMarketShareData = {
    labels: participacao.map(d => d.ano.toString()),
    datasets: [
      { label: 'Share Total (%)', data: participacao.map(d => d.participacao_total), backgroundColor: '#FF6600', borderRadius: 4 },
      { label: 'Share Presencial (%)', data: participacao.map(d => d.participacao_presencial), backgroundColor: '#3B82F6', borderRadius: 4 },
      { label: 'Share Medicina (%)', data: participacao.map(d => d.participacao_medicina), backgroundColor: '#8B5CF6', borderRadius: 4 },
    ],
  };

  // Componente Card de Métrica
  const MetricCard = ({ titulo, valor, subtitulo, cor, icon: Icon }: { titulo: string; valor: string; subtitulo?: string; cor: string; icon: any }) => (
    <div style={{
      backgroundColor: '#2D3238',
      borderRadius: '8px',
      padding: '16px',
      borderLeft: `3px solid ${cor}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={16} color={cor} />
        <p style={{ color: '#6C757D', fontSize: '0.7rem', textTransform: 'uppercase', margin: 0 }}>{titulo}</p>
      </div>
      <p style={{ color: '#F8F9FA', fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>{valor}</p>
      {subtitulo && <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: 0 }}>{subtitulo}</p>}
    </div>
  );

  // Componente Card de Gráfico
  const ChartCard = ({ titulo, children, altura = '240px', corBorda }: { titulo: string; children: React.ReactNode; altura?: string; corBorda?: string }) => (
    <div style={{
      backgroundColor: '#2D3238',
      borderRadius: '8px',
      padding: '16px',
      height: '100%',
      borderTop: corBorda ? `3px solid ${corBorda}` : undefined,
    }}>
      <h3 style={{ color: '#F8F9FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{titulo}</h3>
      <div style={{ height: altura }}>{children}</div>
    </div>
  );

  // Componente de Seção com cor
  const SectionHeader = ({ titulo, cor, icon: Icon }: { titulo: string; cor: string; icon: any }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <div style={{ 
        width: '36px', height: '36px', borderRadius: '8px', 
        backgroundColor: `${cor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <Icon size={20} color={cor} />
      </div>
      <h2 style={{ color: cor, fontSize: '1rem', fontWeight: 700, margin: 0 }}>{titulo}</h2>
    </div>
  );

  return (
    <>
      <Head>
        <title>Análise de Mercado | Viva Eventos</title>
      </Head>

      <AnaliseMercadoLayout titulo="ANÁLISE DE MERCADO">
        {/* Aviso de Dados Mockados */}
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '6px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span>⚠️</span>
          <p style={{ color: '#F59E0B', fontSize: '0.8rem', margin: 0 }}>
            <strong>Validação de Layout</strong> - Dados fictícios para visualização
          </p>
        </div>

        {/* Tabs de Navegação */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[
            { id: 'comparativo', label: 'Comparativo', icon: Users },
            { id: 'brasil', label: 'Visão Brasil', icon: Globe },
            { id: 'viva', label: 'Visão Viva', icon: Building2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setVisaoAtiva(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: visaoAtiva === tab.id ? '2px solid #FF6600' : '1px solid #495057',
                backgroundColor: visaoAtiva === tab.id ? 'rgba(255, 102, 0, 0.15)' : '#2D3238',
                color: visaoAtiva === tab.id ? '#FF6600' : '#ADB5BD',
                fontSize: '0.85rem',
                fontWeight: visaoAtiva === tab.id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== LAYOUT COMPARATIVO ===== */}
        {visaoAtiva === 'comparativo' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* COLUNA BRASIL */}
            <div>
              <SectionHeader titulo="VISÃO BRASIL" cor="#3B82F6" icon={Globe} />
              
              {/* Métricas Brasil */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <MetricCard 
                  titulo="Matriculados" 
                  valor={`${(ultimoEvolucao?.matriculados_total / 1000000).toFixed(1)}M`}
                  subtitulo="Total 2025"
                  cor="#3B82F6"
                  icon={Users}
                />
                <MetricCard 
                  titulo="Concluintes" 
                  valor={`${(ultimoEvolucao?.concluintes_total / 1000000).toFixed(2)}M`}
                  subtitulo="Total 2025"
                  cor="#10B981"
                  icon={GraduationCap}
                />
                <MetricCard 
                  titulo="Medicina" 
                  valor={`${(ultimoEvolucao?.concluintes_medicina / 1000).toFixed(0)}K`}
                  subtitulo="Concluintes"
                  cor="#8B5CF6"
                  icon={Stethoscope}
                />
                <MetricCard 
                  titulo="Ensino Médio" 
                  valor={`${(ultimoEvolucao?.concluintes_ensino_medio / 1000000).toFixed(2)}M`}
                  subtitulo="Concluintes"
                  cor="#F59E0B"
                  icon={BookOpen}
                />
              </div>

              {/* Gráficos Brasil */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ChartCard titulo="Evolução do Mercado" altura="200px" corBorda="#3B82F6">
                  <Line data={brasilEvolucaoData} options={chartOptions} />
                </ChartCard>
                <ChartCard titulo="Modalidade: Presencial vs EAD" altura="200px" corBorda="#3B82F6">
                  <Bar data={brasilModalidadeData} options={chartOptions} />
                </ChartCard>
              </div>
            </div>

            {/* COLUNA VIVA */}
            <div>
              <SectionHeader titulo="VISÃO VIVA" cor="#FF6600" icon={Building2} />
              
              {/* Métricas Viva */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <MetricCard 
                  titulo="Alunos Viva" 
                  valor={ultimoAno?.viva_total.toLocaleString('pt-BR') || '0'}
                  subtitulo="Total 2025"
                  cor="#FF6600"
                  icon={Users}
                />
                <MetricCard 
                  titulo="Market Share" 
                  valor={`${ultimoAno?.participacao_total.toFixed(2)}%`}
                  subtitulo="Total"
                  cor="#10B981"
                  icon={TrendingUp}
                />
                <MetricCard 
                  titulo="Medicina Viva" 
                  valor={ultimoAno?.viva_medicina.toLocaleString('pt-BR') || '0'}
                  subtitulo={`${ultimoAno?.participacao_medicina.toFixed(1)}% share`}
                  cor="#8B5CF6"
                  icon={Stethoscope}
                />
                <MetricCard 
                  titulo="Presencial" 
                  valor={ultimoAno?.viva_presencial.toLocaleString('pt-BR') || '0'}
                  subtitulo={`${ultimoAno?.participacao_presencial.toFixed(2)}% share`}
                  cor="#3B82F6"
                  icon={GraduationCap}
                />
              </div>

              {/* Gráficos Viva */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ChartCard titulo="Evolução Alunos Viva" altura="200px" corBorda="#FF6600">
                  <Line data={vivaEvolucaoData} options={chartOptions} />
                </ChartCard>
                <ChartCard titulo="Market Share por Segmento" altura="200px" corBorda="#FF6600">
                  <Bar data={vivaMarketShareData} options={chartOptions} />
                </ChartCard>
              </div>
            </div>
          </div>
        )}

        {/* ===== LAYOUT BRASIL ===== */}
        {visaoAtiva === 'brasil' && (
          <div>
            <SectionHeader titulo="MERCADO EDUCACIONAL BRASILEIRO" cor="#3B82F6" icon={Globe} />
            
            {/* Métricas Brasil - Grid completo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <MetricCard titulo="Matriculados Total" valor={`${(ultimoEvolucao?.matriculados_total / 1000000).toFixed(1)}M`} cor="#3B82F6" icon={Users} />
              <MetricCard titulo="Concluintes Total" valor={`${(ultimoEvolucao?.concluintes_total / 1000000).toFixed(2)}M`} cor="#10B981" icon={GraduationCap} />
              <MetricCard titulo="Presencial" valor={`${(ultimoEvolucao?.matriculados_presencial / 1000000).toFixed(1)}M`} cor="#8B5CF6" icon={Building2} />
              <MetricCard titulo="EAD" valor={`${(ultimoEvolucao?.matriculados_ead / 1000000).toFixed(1)}M`} cor="#F59E0B" icon={Globe} />
              <MetricCard titulo="Medicina" valor={`${(ultimoEvolucao?.concluintes_medicina / 1000).toFixed(0)}K`} cor="#EF4444" icon={Stethoscope} />
              <MetricCard titulo="Ensino Médio" valor={`${(ultimoEvolucao?.concluintes_ensino_medio / 1000000).toFixed(2)}M`} cor="#06B6D4" icon={BookOpen} />
            </div>

            {/* Gráficos Brasil */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <ChartCard titulo="Evolução: Matriculados x Concluintes" altura="280px" corBorda="#3B82F6">
                <Line data={brasilEvolucaoData} options={chartOptions} />
              </ChartCard>
              <ChartCard titulo="Modalidade: Presencial x EAD (milhões)" altura="280px" corBorda="#3B82F6">
                <Bar data={brasilModalidadeData} options={chartOptions} />
              </ChartCard>
              <ChartCard titulo="Distribuição Concluintes 2025" altura="280px" corBorda="#3B82F6">
                <Doughnut data={brasilSegmentosData} options={{
                  ...chartOptions,
                  plugins: { ...chartOptions.plugins, legend: { position: 'bottom' as const, labels: { color: '#ADB5BD', padding: 12 } } },
                }} />
              </ChartCard>
            </div>

            {/* Tabela de Evolução */}
            <div style={{ marginTop: '24px', backgroundColor: '#2D3238', borderRadius: '8px', padding: '16px', borderTop: '3px solid #3B82F6' }}>
              <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Série Histórica do Mercado</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #495057' }}>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'left', padding: '8px' }}>Ano</th>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Matriculados</th>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Concluintes</th>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Presencial</th>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>EAD</th>
                    <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Medicina</th>
                  </tr>
                </thead>
                <tbody>
                  {evolucao.map((e, idx) => (
                    <tr key={e.ano} style={{ borderBottom: '1px solid #3D4349', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '10px 8px', color: '#F8F9FA', fontWeight: 600 }}>{e.ano}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD' }}>{(e.matriculados_total / 1000000).toFixed(2)}M</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD' }}>{(e.concluintes_total / 1000).toFixed(0)}K</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD' }}>{(e.matriculados_presencial / 1000000).toFixed(2)}M</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD' }}>{(e.matriculados_ead / 1000000).toFixed(2)}M</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8B5CF6' }}>{(e.concluintes_medicina / 1000).toFixed(0)}K</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== LAYOUT VIVA ===== */}
        {visaoAtiva === 'viva' && (
          <div>
            <SectionHeader titulo="PARTICIPAÇÃO VIVA EVENTOS" cor="#FF6600" icon={Building2} />
            
            {/* Métricas Viva - Grid completo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <MetricCard titulo="Alunos Total" valor={ultimoAno?.viva_total.toLocaleString('pt-BR') || '0'} cor="#FF6600" icon={Users} />
              <MetricCard titulo="Share Total" valor={`${ultimoAno?.participacao_total.toFixed(2)}%`} cor="#10B981" icon={TrendingUp} />
              <MetricCard titulo="Presencial" valor={ultimoAno?.viva_presencial.toLocaleString('pt-BR') || '0'} cor="#3B82F6" icon={Building2} />
              <MetricCard titulo="Share Presencial" valor={`${ultimoAno?.participacao_presencial.toFixed(2)}%`} cor="#8B5CF6" icon={TrendingUp} />
              <MetricCard titulo="Medicina" valor={ultimoAno?.viva_medicina.toLocaleString('pt-BR') || '0'} cor="#EF4444" icon={Stethoscope} />
              <MetricCard titulo="Share Medicina" valor={`${ultimoAno?.participacao_medicina.toFixed(1)}%`} cor="#F59E0B" icon={Star} />
            </div>

            {/* Gráficos Viva */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <ChartCard titulo="Evolução Alunos Viva" altura="280px" corBorda="#FF6600">
                <Line data={vivaEvolucaoData} options={chartOptions} />
              </ChartCard>
              <ChartCard titulo="Market Share por Segmento (%)" altura="280px" corBorda="#FF6600">
                <Bar data={vivaMarketShareData} options={chartOptions} />
              </ChartCard>
              <ChartCard titulo="Distribuição Atual (2025)" altura="280px" corBorda="#FF6600">
                <Doughnut data={vivaDistribuicaoData} options={{
                  ...chartOptions,
                  plugins: { ...chartOptions.plugins, legend: { position: 'bottom' as const, labels: { color: '#ADB5BD', padding: 12 } } },
                }} />
              </ChartCard>
            </div>

            {/* Destaque Medicina */}
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Star size={20} color="#FFD700" fill="#FFD700" />
                  <h3 style={{ color: '#8B5CF6', fontSize: '1rem', fontWeight: 700, margin: 0 }}>Medicina - Cluster Premium</h3>
                </div>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div>
                    <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: 0 }}>TICKET MÉDIO</p>
                    <p style={{ color: '#F8F9FA', fontSize: '1.25rem', fontWeight: 700, margin: '2px 0' }}>
                      R$ {medicina?.ticket_medio.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: 0 }}>MARKET SHARE</p>
                    <p style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 700, margin: '2px 0' }}>
                      {ultimoAno?.participacao_medicina.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: 0 }}>MARGEM</p>
                    <p style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 700, margin: '2px 0' }}>
                      {medicina?.margem_percentual}%
                    </p>
                  </div>
                </div>
                
                <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                  <p style={{ color: '#10B981', fontSize: '0.75rem', margin: 0, lineHeight: 1.4 }}>
                    ✓ Alta previsibilidade<br/>
                    ✓ Tendência de crescimento<br/>
                    ✓ Principal cluster de valor
                  </p>
                </div>
              </div>

              {/* Tabela de Evolução Viva */}
              <div style={{ backgroundColor: '#2D3238', borderRadius: '8px', padding: '16px', borderTop: '3px solid #FF6600' }}>
                <h3 style={{ color: '#F8F9FA', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Série Histórica Viva</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #495057' }}>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'left', padding: '8px' }}>Ano</th>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Total</th>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Share</th>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Presencial</th>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Medicina</th>
                      <th style={{ color: '#6C757D', fontWeight: 600, textAlign: 'right', padding: '8px' }}>Share Med.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participacao.map((p, idx) => (
                      <tr key={p.ano} style={{ borderBottom: '1px solid #3D4349', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px 8px', color: '#F8F9FA', fontWeight: 600 }}>{p.ano}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#FF6600', fontWeight: 600 }}>{p.viva_total.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#10B981' }}>{p.participacao_total.toFixed(2)}%</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD' }}>{p.viva_presencial.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#8B5CF6' }}>{p.viva_medicina.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '10px 8px', textAlign: 'right', color: '#F59E0B', fontWeight: 600 }}>{p.participacao_medicina.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </AnaliseMercadoLayout>
    </>
  );
}
