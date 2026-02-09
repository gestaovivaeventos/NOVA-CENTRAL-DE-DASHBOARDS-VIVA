/**
 * Análise de Mercado — Dashboard Simplificado
 * Cards com total do mercado + % Viva, tabela de evolução, distribuição
 * Filtro: Ensino Superior | Ensino Médio | Medicina
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useAnaliseMercado } from '@/modules/analise-mercado/hooks/useAnaliseMercado';
import { AnaliseMercadoLayout } from '@/modules/analise-mercado';
import { Doughnut, Bar, Chart } from 'react-chartjs-2';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { NivelEnsino } from '@/modules/analise-mercado/types';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('pt-BR');
}
function fmtN(n: number): string { return n.toLocaleString('pt-BR'); }

export default function AnaliseMercadoPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading, dadosFiltrados } = useAnaliseMercado();
  const [nivel, setNivel] = useState<NivelEnsino>('superior');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authLoading && !ready) {
      if (!isAuthenticated) { router.replace('/login'); return; }
      if (user && user.accessLevel !== 1) { router.replace('/'); return; }
      setReady(true);
    }
  }, [isAuthenticated, authLoading, user, router, ready]);

  if (authLoading || loading || !ready) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#212529', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #FF6600', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 16, color: '#adb5bd' }}>Carregando...</p>
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (user && user.accessLevel !== 1) return null;

  const { evolucao, participacao } = dadosFiltrados;
  const ultimo = participacao[participacao.length - 1];
  const penultimo = participacao.length > 1 ? participacao[participacao.length - 2] : null;
  const evUlt = evolucao[evolucao.length - 1];
  const evPen = evolucao.length > 1 ? evolucao[evolucao.length - 2] : null;

  // helpers por nível
  const mat = (e: typeof evUlt) => !e ? 0 : nivel === 'superior' ? e.matriculados_total : nivel === 'medio' ? e.matriculados_ensino_medio : e.matriculados_medicina;
  const conc = (e: typeof evUlt) => !e ? 0 : nivel === 'superior' ? e.concluintes_total : nivel === 'medio' ? e.concluintes_ensino_medio : e.concluintes_medicina;
  const pres = (e: typeof evUlt) => !e ? 0 : nivel === 'superior' ? e.matriculados_presencial : mat(e);
  const ead = (e: typeof evUlt) => !e ? 0 : nivel === 'superior' ? e.matriculados_ead : 0;
  const shareTotal = (p: typeof ultimo) => !p ? 0 : nivel === 'superior' ? p.participacao_total : nivel === 'medio' ? p.participacao_ensino_medio : p.participacao_medicina;
  const sharePres = (p: typeof ultimo) => !p ? 0 : nivel === 'superior' ? p.participacao_presencial : shareTotal(p);
  const shareEad = (p: typeof ultimo) => !p ? 0 : nivel === 'superior' ? p.participacao_ead : 0;
  const vivaTot = (p: typeof ultimo) => !p ? 0 : nivel === 'superior' ? p.viva_total : nivel === 'medio' ? p.viva_ensino_medio : p.viva_medicina;

  const nivelLabel = nivel === 'superior' ? 'Ensino Superior' : nivel === 'medio' ? 'Ensino Médio' : 'Medicina';
  const cor = nivel === 'superior' ? '#3B82F6' : nivel === 'medio' ? '#10B981' : '#8B5CF6';

  // variações
  const varMat = evPen ? ((mat(evUlt) - mat(evPen)) / mat(evPen) * 100) : 0;
  const varConc = evPen ? ((conc(evUlt) - conc(evPen)) / conc(evPen) * 100) : 0;
  const varPres = evPen ? ((pres(evUlt) - pres(evPen)) / pres(evPen) * 100) : 0;
  const varEad = evPen && ead(evPen) ? ((ead(evUlt) - ead(evPen)) / ead(evPen) * 100) : 0;

  // doughnut concluintes
  const doughnutData = {
    labels: ['Ens. Superior', 'Medicina', 'Ensino Médio'],
    datasets: [{
      data: [evUlt?.concluintes_total || 0, evUlt?.concluintes_medicina || 0, evUlt?.concluintes_ensino_medio || 0],
      backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981'],
      borderColor: '#343A40', borderWidth: 2,
    }],
  };

  return (
    <>
      <Head><title>Análise de Mercado | Viva Eventos</title></Head>
      <AnaliseMercadoLayout titulo="ANÁLISE DE MERCADO" nivelEnsino={nivel} onNivelChange={setNivel}>

        {/* Aviso mockado */}
        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6, padding: '8px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>⚠️</span>
          <p style={{ color: '#F59E0B', fontSize: '0.75rem', margin: 0 }}><strong>Validação de Layout</strong> — Dados fictícios</p>
        </div>

        {/* CARDS — cada card tem total mercado + % Viva */}
        <div style={{ display: 'grid', gridTemplateColumns: nivel === 'superior' ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 16, marginBottom: 28 }}>
          {/* Matriculados */}
          <Card titulo="MATRICULADOS" cor={cor} valor={fmt(mat(evUlt))} subtitulo={nivelLabel} share={shareTotal(ultimo)} variacao={varMat} vivaLabel="Matriculados Viva" vivaNumero={fmt(vivaTot(ultimo))} />
          {/* Concluintes */}
          <Card titulo="CONCLUINTES" cor="#F59E0B" valor={fmt(conc(evUlt))} subtitulo={nivelLabel} share={shareTotal(ultimo)} variacao={varConc} vivaLabel="Concluintes Viva" vivaNumero={fmt(Math.round(conc(evUlt) * shareTotal(ultimo) / 100))} />
          {/* Presencial */}
          {nivel === 'superior' && (
            <Card titulo="PRESENCIAL" cor="#10B981" valor={fmt(pres(evUlt))} subtitulo="Matriculados" share={sharePres(ultimo)} variacao={varPres} />
          )}
          {/* EAD */}
          {nivel === 'superior' && (
            <Card titulo="EAD" cor="#8B5CF6" valor={fmt(ead(evUlt))} subtitulo="Matriculados" share={shareEad(ultimo)} variacao={varEad} />
          )}
        </div>

        {/* TABELA EVOLUÇÃO POR ANO */}
        <h2 style={{ color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #FF6600', paddingBottom: 8, marginBottom: 16, fontFamily: "'Poppins', sans-serif" }}>
          Evolução por Ano — {nivelLabel}
        </h2>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2D3238' }}>
                <Th left>Ano</Th>
                <Th>Matriculados</Th>
                <Th>Concluintes</Th>
                {nivel === 'superior' && <Th>Presencial</Th>}
                {nivel === 'superior' && <Th>EAD</Th>}
                <Th>Matriculados Viva</Th>
                <Th>Concluintes Viva</Th>
                <Th>Evolução Viva</Th>
              </tr>
            </thead>
            <tbody>
              {evolucao.map((e, i) => {
                const p = participacao[i];
                const concViva = Math.round(conc(e) * shareTotal(p) / 100);
                return (
                  <tr key={e.ano} style={{ borderBottom: '1px solid #3D4349', backgroundColor: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <Td left bold>{e.ano}</Td>
                    <Td>{fmt(mat(e))}</Td>
                    <Td>{fmt(conc(e))}</Td>
                    {nivel === 'superior' && <Td>{fmt(pres(e))}</Td>}
                    {nivel === 'superior' && <Td>{fmt(ead(e))}</Td>}
                    <Td cor="#FF6600" bold>{fmt(vivaTot(p))}</Td>
                    <Td cor="#FF6600" bold>{fmt(concViva)}</Td>
                    <Td cor="#10B981" bold>{shareTotal(p).toFixed(2)}%</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* GRÁFICOS */}
        <h2 style={{ color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #FF6600', paddingBottom: 8, marginBottom: 16, fontFamily: "'Poppins', sans-serif" }}>
          Análise Gráfica ({evUlt?.ano || 2025})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Gráfico Rosca - Distribuição Concluintes */}
          <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20 }}>
            <p style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Distribuição Concluintes</p>
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                  legend: { 
                    position: 'left',
                    align: 'start',
                    labels: { 
                      color: '#ADB5BD', 
                      padding: 15, 
                      font: { size: 11 },
                      boxWidth: 15,
                      boxHeight: 15,
                    } 
                  }, 
                  datalabels: { 
                    color: '#F8F9FA',
                    font: { size: 11, weight: 'bold' },
                    anchor: 'end',
                    align: 'end',
                    offset: 8,
                    borderWidth: 2,
                    borderColor: (ctx: any) => ctx.dataset.backgroundColor[ctx.dataIndex],
                    borderRadius: 4,
                    backgroundColor: '#343A40',
                    padding: { top: 4, bottom: 4, left: 6, right: 6 },
                    formatter: (value: number, ctx: any) => {
                      const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                      const pct = ((value / total) * 100).toFixed(1);
                      return `${pct}%`;
                    },
                  },
                },
                layout: {
                  padding: 30,
                },
              }} />
            </div>
          </div>
          {/* Gráfico Colunas - Presencial x EAD (só para Superior) */}
          {nivel === 'superior' ? (
            <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20 }}>
              <p style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Presencial x EAD</p>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: evolucao.map(e => e.ano),
                    datasets: [
                      {
                        label: 'Presencial',
                        data: evolucao.map(e => e.matriculados_presencial),
                        backgroundColor: '#10B981',
                        borderRadius: 4,
                      },
                      {
                        label: 'EAD',
                        data: evolucao.map(e => e.matriculados_ead),
                        backgroundColor: '#8B5CF6',
                        borderRadius: 4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#ADB5BD', padding: 12, font: { size: 11 } } },
                      datalabels: { 
                        color: '#F8F9FA',
                        font: { size: 10, weight: 'bold' },
                        anchor: 'end',
                        align: 'top',
                        formatter: (value: number) => fmt(value),
                      },
                    },
                    scales: {
                      x: { ticks: { color: '#6C757D', font: { size: 10 } }, grid: { display: false } },
                      y: { ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmt(v) }, grid: { color: '#3D4349' } },
                    },
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 20 }}>
              <p style={{ color: '#ADB5BD', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>Evolução de Matriculados</p>
              <div style={{ height: 260 }}>
                <Chart
                  type="bar"
                  data={{
                    labels: evolucao.map(e => e.ano),
                    datasets: [
                      {
                        type: 'bar' as const,
                        label: 'Matriculados',
                        data: evolucao.map(e => mat(e)),
                        backgroundColor: cor,
                        borderRadius: 4,
                        order: 2,
                      },
                      {
                        type: 'line' as const,
                        label: 'Matriculados Viva',
                        data: participacao.map(p => vivaTot(p)),
                        borderColor: '#FF6600',
                        backgroundColor: '#FF6600',
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#FF6600',
                        tension: 0.3,
                        order: 1,
                        yAxisID: 'y1',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#ADB5BD', padding: 12, font: { size: 11 } } },
                      datalabels: { 
                        color: '#F8F9FA',
                        font: { size: 10, weight: 'bold' },
                        anchor: 'end',
                        align: 'top',
                        formatter: (value: number) => fmt(value),
                      },
                    },
                    scales: {
                      x: { ticks: { color: '#6C757D', font: { size: 10 } }, grid: { display: false } },
                      y: { 
                        position: 'left',
                        ticks: { color: '#6C757D', font: { size: 10 }, callback: (v: any) => fmt(v) }, 
                        grid: { color: '#3D4349' },
                      },
                      y1: {
                        position: 'right',
                        ticks: { color: '#FF6600', font: { size: 10 }, callback: (v: any) => fmt(v) },
                        grid: { display: false },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

      </AnaliseMercadoLayout>
    </>
  );
}

// ===== Card único: total mercado + % Viva =====
function Card({ titulo, cor, valor, subtitulo, share, variacao: v, vivaLabel, vivaNumero }: {
  titulo: string; cor: string; valor: string; subtitulo: string; share: number; variacao: number;
  vivaLabel?: string; vivaNumero?: string;
}) {
  const up = v >= 0;
  return (
    <div style={{
      backgroundColor: '#343A40', borderRadius: 12, padding: 20,
      position: 'relative', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: cor }} />

      {/* Label */}
      <p style={{ color: '#ADB5BD', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', fontFamily: "'Poppins', sans-serif" }}>
        {titulo}
      </p>

      {/* Valor grande (total mercado) */}
      <div style={{ color: cor, fontSize: '2rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", lineHeight: 1.1 }}>
        {valor}
      </div>
      <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: '4px 0 0' }}>{subtitulo}</p>

      {/* Subtítulo Viva com número */}
      {vivaLabel && vivaNumero && (
        <div style={{ margin: '8px 0 0' }}>
          <p style={{ color: '#ADB5BD', fontSize: '0.65rem', textTransform: 'uppercase', margin: '0 0 4px' }}>{vivaLabel}</p>
          <div style={{ color: '#FF6600', fontSize: '2rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", lineHeight: 1.1 }}>
            {vivaNumero}
          </div>
        </div>
      )}

      {/* Separador */}
      <div style={{ borderTop: '1px solid #495057', margin: '12px 0' }} />

      {/* Linha inferior: share Viva + variação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: '#6C757D', fontSize: '0.6rem', margin: '0 0 2px', textTransform: 'uppercase' }}>Participação Viva</p>
          <span style={{ color: '#FF6600', fontSize: '1.2rem', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
            {share.toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {up ? <TrendingUp size={14} color="#10B981" /> : <TrendingDown size={14} color="#EF4444" />}
          <span style={{ color: up ? '#10B981' : '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>
            {up ? '+' : ''}{v.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ===== Tabela helpers =====
function Th({ children, left }: { children: React.ReactNode; left?: boolean }) {
  return <th style={{ color: '#6C757D', fontWeight: 600, padding: '12px 10px', textAlign: left ? 'left' : 'right', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid #495057' }}>{children}</th>;
}
function Td({ children, left, cor, bold }: { children: React.ReactNode; left?: boolean; cor?: string; bold?: boolean }) {
  return <td style={{ padding: '10px', textAlign: left ? 'left' : 'right', color: cor || '#ADB5BD', fontWeight: bold ? 600 : 400 }}>{children}</td>;
}
