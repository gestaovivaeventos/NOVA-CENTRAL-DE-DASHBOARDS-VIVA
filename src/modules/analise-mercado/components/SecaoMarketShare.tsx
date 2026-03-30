/**
 * SecaoMarketShare — Clientes & Market Share (Storytelling)
 *
 * Fluxo narrativo:
 * 1. Evolução Histórica — como o market share evoluiu no território
 * 2. Cursos & Áreas — quais concentram mais alunos no território
 * 3. Fatia por Instituição — participação dentro de cada IES
 */

import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Target,
  TrendingUp,
  BookOpen,
  Building2,
} from 'lucide-react';
import type {
  DadosMarketShare,
  MarketShareCurso,
  MarketShareInstituicao,
} from '../types';
import { fmtNum, fmtPct, CORES } from '../utils/formatters';
import CardInsight from './CardInsight';
import TabelaRanking from './TabelaRanking';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler, ChartDataLabels,
);

// ─── Helpers ────────────────────────────────
/** Numbered section label — same pattern as SecaoAlunos */
const SectionLabel = ({ num, label, cor }: { num: string; label: string; cor: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
    <span style={{
      width: 26, height: 26, borderRadius: '50%',
      backgroundColor: `${cor}18`, border: `1.5px solid ${cor}50`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: cor, fontSize: '0.7rem', fontWeight: 700,
      fontFamily: "'Orbitron', monospace", flexShrink: 0,
    }}>
      {num}
    </span>
    <span style={{
      color: '#ADB5BD', fontSize: '0.72rem', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      fontFamily: "'Poppins', sans-serif",
    }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: '#495057' }} />
  </div>
);


// ─── Component ──────────────────────────────
interface SecaoMarketShareProps {
  dados: DadosMarketShare;
}

export default function SecaoMarketShare({ dados }: SecaoMarketShareProps) {
  const { resumo, evolucao, porCurso, porInstituicao } = dados;

  // Unique areas for filter
  const areasUnicas = useMemo(() => [...new Set(porCurso.map(c => c.area))].sort(), [porCurso]);
  const [areaFiltro, setAreaFiltro] = useState<string | null>(null);
  const cursosFiltrados = areaFiltro ? porCurso.filter(c => c.area === areaFiltro) : porCurso;

  // ━━━ Chart Data ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const chartLabels = evolucao.map(e => e.ano.toString());

  // Gráfico 1: Participação % x Mercado Total
  const participacaoMercadoData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Participação %',
        data: evolucao.map(e => e.participacao),
        borderColor: CORES.laranja,
        backgroundColor: `${CORES.laranja}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: CORES.laranja,
        borderWidth: 2.5,
        yAxisID: 'y-pct',
      },
      {
        label: 'Mercado Total',
        data: evolucao.map(e => e.mercadoTotal),
        borderColor: CORES.cinza,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: CORES.cinza,
        borderWidth: 2,
        yAxisID: 'y-mercado',
      },
    ],
  };
  const participacaoMercadoOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: { color: '#ADB5BD', padding: 14, font: { size: 11, family: "'Poppins', sans-serif" }, usePointStyle: true, pointStyleWidth: 12 },
      },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'top', offset: 4,
        formatter: (v: number, ctx: any) => ctx.dataset.yAxisID === 'y-pct' ? `${v}%` : fmtNum(v),
      },
      tooltip: { backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1, titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 12 },
    },
    scales: {
      x: { grid: { color: '#495057', lineWidth: 0.5 }, ticks: { color: '#6C757D', font: { size: 12, family: "'Poppins', sans-serif" } } },
      'y-pct': {
        position: 'left', grid: { color: '#495057', lineWidth: 0.5 },
        beginAtZero: true,
        ticks: { color: CORES.laranja, font: { size: 10 }, callback: (v: number) => `${v}%` },
        title: { display: true, text: 'Participação %', color: CORES.laranja, font: { size: 10 } },
      },
      'y-mercado': {
        position: 'right', grid: { drawOnChartArea: false },
        beginAtZero: true,
        ticks: { color: CORES.cinza, font: { size: 10 }, callback: (v: number) => fmtNum(v) },
        title: { display: true, text: 'Mercado Total', color: CORES.cinza, font: { size: 10 } },
      },
    },
  };

  // Gráfico 2: Alunos Clientes x Mercado Total
  const alunosMercadoData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Alunos Clientes',
        data: evolucao.map(e => e.clientesAlunos),
        borderColor: CORES.azul,
        backgroundColor: `${CORES.azul}20`,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: CORES.azul,
        borderWidth: 2.5,
        yAxisID: 'y-clientes',
      },
      {
        label: 'Mercado Total',
        data: evolucao.map(e => e.mercadoTotal),
        borderColor: CORES.cinza,
        backgroundColor: 'transparent',
        tension: 0.4,
        fill: false,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: CORES.cinza,
        borderWidth: 2,
        yAxisID: 'y-mercado',
      },
    ],
  };
  const alunosMercadoOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: {
        display: true, position: 'top',
        labels: { color: '#ADB5BD', padding: 14, font: { size: 11, family: "'Poppins', sans-serif" }, usePointStyle: true, pointStyleWidth: 12 },
      },
      datalabels: {
        display: true, color: '#F8F9FA',
        font: { size: 10, weight: 'bold', family: "'Poppins', sans-serif" },
        anchor: 'end', align: 'top', offset: 4,
        formatter: (v: number, ctx: any) => ctx.dataset.yAxisID === 'y-clientes' ? fmtNum(v) : fmtNum(v),
      },
      tooltip: { backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1, titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 12 },
    },
    scales: {
      x: { grid: { color: '#495057', lineWidth: 0.5 }, ticks: { color: '#6C757D', font: { size: 12, family: "'Poppins', sans-serif" } } },
      'y-clientes': {
        position: 'left', grid: { color: '#495057', lineWidth: 0.5 },
        beginAtZero: true,
        ticks: { color: CORES.azul, font: { size: 10 }, callback: (v: number) => fmtNum(v) },
        title: { display: true, text: 'Alunos Clientes', color: CORES.azul, font: { size: 10 } },
      },
      'y-mercado': {
        position: 'right', grid: { drawOnChartArea: false },
        beginAtZero: true,
        ticks: { color: CORES.cinza, font: { size: 10 }, callback: (v: number) => fmtNum(v) },
        title: { display: true, text: 'Mercado Total', color: CORES.cinza, font: { size: 10 } },
      },
    },
  };

  // ━━━ Table columns ━━━━━━━━━━━━━━━━━━━━━━━━
  const colsCurso: { key: keyof MarketShareCurso & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'nome', label: 'Curso', tipo: 'texto' },
    { key: 'area', label: 'Área', tipo: 'texto', largura: '160px' },
    { key: 'mercadoTotal', label: 'Mercado Total', tipo: 'numero' },
    { key: 'clientesViva', label: 'Clientes VIVA', tipo: 'numero' },
    { key: 'participacao', label: 'Participação', tipo: 'percentual', largura: '150px' },
    { key: 'oportunidade', label: 'Oportunidade', tipo: 'numero' },
  ];

  const colsInstituicao: { key: keyof MarketShareInstituicao & string; label: string; tipo: 'texto' | 'numero' | 'percentual'; largura?: string }[] = [
    { key: 'nome', label: 'Instituição', tipo: 'texto' },
    { key: 'tipo', label: 'Tipo', tipo: 'texto', largura: '70px' },
    { key: 'municipio', label: 'Município', tipo: 'texto', largura: '120px' },
    { key: 'totalAlunos', label: 'Total Alunos', tipo: 'numero' },
    { key: 'alunosClientes', label: 'Clientes VIVA', tipo: 'numero' },
    { key: 'participacao', label: 'Fatia VIVA', tipo: 'percentual', largura: '150px' },
    { key: 'cursos', label: 'Cursos', tipo: 'numero', largura: '65px' },
  ];

  // Variação último ano
  const ultimaEv = evolucao[evolucao.length - 1];
  const penultimaEv = evolucao[evolucao.length - 2];
  const varPct = penultimaEv ? ultimaEv.participacao - penultimaEv.participacao : 0;

  return (
    <div>
      {/* Banner mockados */}
      <div style={{
        backgroundColor: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 6, padding: '8px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span>⚠️</span>
        <p style={{ color: '#F59E0B', fontSize: '0.75rem', margin: 0 }}>
          <strong>Dados Mockados</strong> — Visualização com dados simulados para validação de layout.
        </p>
      </div>

      {/* ━━━ KPI Cards (4 principais) ━━━━━━━━━━━━ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: 14,
        marginBottom: 20,
      }}>
        {[
          { titulo: 'MERCADO TOTAL', valor: resumo.mercadoTotalAlunos, cor: CORES.azul, sub: 'alunos no território', icone: <Target size={15} /> },
          { titulo: 'CLIENTES VIVA', valor: resumo.alunosClientes, cor: CORES.verde, sub: `${resumo.instituicoesClientes} de ${resumo.totalInstituicoes} IES`, icone: <Building2 size={15} /> },
          { titulo: 'PARTICIPAÇÃO', valor: null, valorStr: fmtPct(resumo.participacaoAlunos), cor: CORES.laranja, sub: `${varPct >= 0 ? '+' : ''}${varPct.toFixed(1)}pp vs ano anterior`, icone: <TrendingUp size={15} /> },
        ].map((kpi, i) => (
          <div
            key={i}
            style={{
              backgroundColor: '#343A40', borderRadius: 12, padding: 20,
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: kpi.cor }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ color: kpi.cor }}>{kpi.icone}</span>
              <p style={{
                color: '#ADB5BD', fontSize: '0.65rem', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {kpi.titulo}
              </p>
            </div>
            <div style={{
              color: kpi.cor, fontSize: '1.8rem', fontWeight: 700,
              fontFamily: "'Orbitron', sans-serif", lineHeight: 1.1,
            }}>
              {kpi.valorStr ?? fmtNum(kpi.valor!)}
            </div>
            <p style={{ color: '#6C757D', fontSize: '0.7rem', margin: '6px 0 0' }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           1. EVOLUÇÃO HISTÓRICA — tendência do market share
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="1" label="Evolução Histórica" cor={CORES.azul} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {/* Gráfico 1 — Participação % × Mercado Total */}
        <CardInsight
          titulo="Participação % × Mercado Total"
          valor={fmtPct(resumo.participacaoAlunos)}
          subtitulo="participação atual"
          cor={CORES.laranja}
          icone={<TrendingUp size={16} />}
          iniciaExpandido
          resumo={[
            { label: String(evolucao[0]?.ano), valor: fmtPct(evolucao[0]?.participacao), cor: CORES.cinza },
            { label: String(ultimaEv?.ano), valor: fmtPct(ultimaEv?.participacao), cor: CORES.laranja },
          ]}
        >
          <div style={{ height: 240, marginTop: 8 }}>
            <Line data={participacaoMercadoData} options={participacaoMercadoOptions} />
          </div>
        </CardInsight>

        {/* Gráfico 2 — Alunos Clientes × Mercado Total */}
        <CardInsight
          titulo="Alunos Clientes × Mercado Total"
          valor={fmtNum(resumo.alunosClientes)}
          subtitulo="clientes atuais"
          cor={CORES.azul}
          icone={<Target size={16} />}
          iniciaExpandido
          resumo={[
            { label: String(evolucao[0]?.ano), valor: fmtNum(evolucao[0]?.clientesAlunos), cor: CORES.cinza },
            { label: String(ultimaEv?.ano), valor: fmtNum(ultimaEv?.clientesAlunos), cor: CORES.azul },
          ]}
        >
          <div style={{ height: 240, marginTop: 8 }}>
            <Line data={alunosMercadoData} options={alunosMercadoOptions} />
          </div>
        </CardInsight>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           2. CURSOS & ÁREAS — onde estão os alunos
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="2" label="Cursos & Áreas do Conhecimento" cor={CORES.verde} />
      <div style={{ marginBottom: 24 }}>
        {/* Tabela completa de cursos com filtro de área */}
        <div>
          <CardInsight
            titulo="Ranking Completo por Curso"
            valor={`${porCurso.length} cursos`}
            cor={CORES.verde}
            icone={<BookOpen size={16} />}
            iniciaExpandido
          >
            {/* Filtro de Área */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 10px', flexWrap: 'wrap' }}>
              <span style={{ color: '#6C757D', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase' }}>Área:</span>
              <button
                onClick={() => setAreaFiltro(null)}
                style={{
                  padding: '4px 12px', borderRadius: 14, fontSize: '0.7rem', cursor: 'pointer',
                  backgroundColor: !areaFiltro ? `${CORES.verde}20` : 'transparent',
                  border: `1px solid ${!areaFiltro ? CORES.verde : '#495057'}`,
                  color: !areaFiltro ? CORES.verde : '#6C757D',
                  fontFamily: "'Poppins', sans-serif", fontWeight: !areaFiltro ? 700 : 500,
                }}
              >
                Todas
              </button>
              {areasUnicas.map(area => (
                <button
                  key={area}
                  onClick={() => setAreaFiltro(areaFiltro === area ? null : area)}
                  style={{
                    padding: '4px 12px', borderRadius: 14, fontSize: '0.7rem', cursor: 'pointer',
                    backgroundColor: areaFiltro === area ? `${CORES.verde}20` : 'transparent',
                    border: `1px solid ${areaFiltro === area ? CORES.verde : '#495057'}`,
                    color: areaFiltro === area ? CORES.verde : '#6C757D',
                    fontFamily: "'Poppins', sans-serif", fontWeight: areaFiltro === area ? 700 : 500,
                  }}
                >
                  {area}
                </button>
              ))}
            </div>
            <TabelaRanking<MarketShareCurso>
              titulo=""
              dados={cursosFiltrados}
              colunas={colsCurso}
              linhasVisiveis={15}
              destaqueCor={CORES.verde}
            />
          </CardInsight>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           3. FATIA POR INSTITUIÇÃO — market share dentro da IES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionLabel num="3" label="Fatia por Instituição" cor={CORES.roxo} />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo="Participação VIVA dentro de cada IES"
          valor={`${resumo.instituicoesClientes}/${resumo.totalInstituicoes} IES atendidas`}
          cor={CORES.roxo}
          icone={<Building2 size={16} />}
          iniciaExpandido
          resumo={[
            { label: 'Pública', valor: String(porInstituicao.filter(i => i.tipo === 'publica').length), cor: CORES.azul },
            { label: 'Privada', valor: String(porInstituicao.filter(i => i.tipo === 'privada').length), cor: CORES.laranja },
          ]}
        >
          <div style={{ marginTop: 12 }}>
            <TabelaRanking<MarketShareInstituicao>
              titulo=""
              dados={porInstituicao}
              colunas={colsInstituicao}
              linhasVisiveis={15}
              destaqueCor={CORES.roxo}
            />
          </div>
        </CardInsight>
      </div>

    </div>
  );
}
