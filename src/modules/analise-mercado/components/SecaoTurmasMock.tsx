/**
 * SecaoTurmasMock — Análise de Turmas (dados mockados)
 * 
 * Mesma estrutura da SecaoAlunos, porém:
 * - Métrica ativa: turmas (sem seletor de matrícula/concluinte/ingressante)
 * - Remove gráfico "Por Gênero" (não faz sentido no contexto turma)
 * - Dados mockados até termos a fonte real
 */

import React, { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
} from 'chart.js';
import { Building2 } from 'lucide-react';
import type { FiltrosAnaliseMercado } from '../types';
import { fmtNum, fmtInteiro, fmtPct, CORES } from '../utils/formatters';
import dynamic from 'next/dynamic';
import TabelaRanking from './TabelaRanking';
import CardInsight from './CardInsight';

ChartJS.register(ArcElement);

const MapaBrasil = dynamic(() => import('./MapaBrasilLeaflet'), { ssr: false });

// ═══════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════

const MOCK_DISTRIBUICAO = {
  presencial: 312_450,
  ead: 487_230,
  publica: 198_680,
  privada: 601_000,
};

const MOCK_CURSOS = [
  { nome: 'Pedagogia', area: 'Educação', turmas: 48_320, instituicoes: 1_545, presencial: 18_200, ead: 30_120, publica: 12_800, privada: 35_520 },
  { nome: 'Administração', area: 'Negócios, administração e direito', turmas: 42_180, instituicoes: 1_778, presencial: 15_600, ead: 26_580, publica: 8_400, privada: 33_780 },
  { nome: 'Direito', area: 'Negócios, administração e direito', turmas: 38_950, instituicoes: 1_449, presencial: 28_200, ead: 10_750, publica: 9_800, privada: 29_150 },
  { nome: 'Enfermagem', area: 'Saúde e bem-estar', turmas: 29_870, instituicoes: 1_115, presencial: 22_100, ead: 7_770, publica: 7_200, privada: 22_670 },
  { nome: 'Educação Física', area: 'Educação', turmas: 27_640, instituicoes: 997, presencial: 12_800, ead: 14_840, publica: 6_100, privada: 21_540 },
  { nome: 'Psicologia', area: 'Ciências sociais, comunicação e informação', turmas: 24_510, instituicoes: 1_033, presencial: 18_900, ead: 5_610, publica: 5_800, privada: 18_710 },
  { nome: 'Análise E Desenvolvimento De Sistemas', area: 'Computação e Tecnologias da Informação e Comunicação (TIC)', turmas: 22_340, instituicoes: 895, presencial: 8_200, ead: 14_140, publica: 4_600, privada: 17_740 },
  { nome: 'Ciências Contábeis', area: 'Negócios, administração e direito', turmas: 19_870, instituicoes: 1_319, presencial: 9_100, ead: 10_770, publica: 4_200, privada: 15_670 },
  { nome: 'Medicina', area: 'Saúde e bem-estar', turmas: 18_640, instituicoes: 395, presencial: 18_640, ead: 0, publica: 8_900, privada: 9_740 },
  { nome: 'Fisioterapia', area: 'Saúde e bem-estar', turmas: 15_890, instituicoes: 892, presencial: 12_400, ead: 3_490, publica: 3_200, privada: 12_690 },
  { nome: 'Engenharia Civil', area: 'Engenharia, produção e construção', turmas: 14_520, instituicoes: 780, presencial: 11_200, ead: 3_320, publica: 5_100, privada: 9_420 },
  { nome: 'Farmácia', area: 'Saúde e bem-estar', turmas: 12_180, instituicoes: 640, presencial: 9_800, ead: 2_380, publica: 2_800, privada: 9_380 },
];

const MOCK_INSTITUICOES = [
  { codIes: 1, nome: 'Universidade Paulista', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 320, turmas: 28_450, uf: 'SP' },
  { codIes: 2, nome: 'Universidade Estácio de Sá', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 280, turmas: 24_120, uf: 'RJ' },
  { codIes: 3, nome: 'Universidade Pitágoras Unopar Anhanguera', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 310, turmas: 22_890, uf: 'PR' },
  { codIes: 4, nome: 'Centro Universitário Leonardo da Vinci', tipo: 'privada' as const, modalidade: 'ead' as const, cursos: 180, turmas: 19_340, uf: 'SC' },
  { codIes: 5, nome: 'Universidade de São Paulo', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 340, turmas: 18_760, uf: 'SP' },
  { codIes: 6, nome: 'Universidade Federal de Minas Gerais', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 290, turmas: 15_430, uf: 'MG' },
  { codIes: 7, nome: 'Universidade Cruzeiro do Sul', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 200, turmas: 14_870, uf: 'SP' },
  { codIes: 8, nome: 'Universidade Federal do Rio de Janeiro', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 260, turmas: 13_950, uf: 'RJ' },
  { codIes: 9, nome: 'Universidade Federal do Paraná', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 230, turmas: 12_180, uf: 'PR' },
  { codIes: 10, nome: 'Universidade Anhembi Morumbi', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 190, turmas: 11_540, uf: 'SP' },
  { codIes: 11, nome: 'Pontifícia Universidade Católica de MG', tipo: 'privada' as const, modalidade: 'ambas' as const, cursos: 210, turmas: 10_890, uf: 'MG' },
  { codIes: 12, nome: 'Universidade Federal da Bahia', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 220, turmas: 10_320, uf: 'BA' },
  { codIes: 13, nome: 'Universidade Federal do Rio Grande do Sul', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 240, turmas: 9_870, uf: 'RS' },
  { codIes: 14, nome: 'Universidade Federal de Pernambuco', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 200, turmas: 9_340, uf: 'PE' },
  { codIes: 15, nome: 'Universidade Federal do Ceará', tipo: 'publica' as const, modalidade: 'presencial' as const, cursos: 190, turmas: 8_760, uf: 'CE' },
];

const MOCK_ESTADOS = [
  { uf: 'SP', nome: 'São Paulo', turmas: 198_400, matriculas: 198_400, concluintes: 0, instituicoes: 620, percentual: 24.8 },
  { uf: 'MG', nome: 'Minas Gerais', turmas: 89_200, matriculas: 89_200, concluintes: 0, instituicoes: 380, percentual: 11.2 },
  { uf: 'RJ', nome: 'Rio de Janeiro', turmas: 78_600, matriculas: 78_600, concluintes: 0, instituicoes: 310, percentual: 9.8 },
  { uf: 'PR', nome: 'Paraná', turmas: 62_100, matriculas: 62_100, concluintes: 0, instituicoes: 240, percentual: 7.8 },
  { uf: 'RS', nome: 'Rio Grande do Sul', turmas: 51_400, matriculas: 51_400, concluintes: 0, instituicoes: 220, percentual: 6.4 },
  { uf: 'BA', nome: 'Bahia', turmas: 45_800, matriculas: 45_800, concluintes: 0, instituicoes: 180, percentual: 5.7 },
  { uf: 'SC', nome: 'Santa Catarina', turmas: 39_200, matriculas: 39_200, concluintes: 0, instituicoes: 170, percentual: 4.9 },
  { uf: 'GO', nome: 'Goiás', turmas: 32_500, matriculas: 32_500, concluintes: 0, instituicoes: 140, percentual: 4.1 },
  { uf: 'PE', nome: 'Pernambuco', turmas: 30_800, matriculas: 30_800, concluintes: 0, instituicoes: 130, percentual: 3.9 },
  { uf: 'CE', nome: 'Ceará', turmas: 28_100, matriculas: 28_100, concluintes: 0, instituicoes: 120, percentual: 3.5 },
  { uf: 'PA', nome: 'Pará', turmas: 22_600, matriculas: 22_600, concluintes: 0, instituicoes: 100, percentual: 2.8 },
  { uf: 'DF', nome: 'Distrito Federal', turmas: 20_400, matriculas: 20_400, concluintes: 0, instituicoes: 95, percentual: 2.6 },
  { uf: 'MA', nome: 'Maranhão', turmas: 16_200, matriculas: 16_200, concluintes: 0, instituicoes: 80, percentual: 2.0 },
  { uf: 'MT', nome: 'Mato Grosso', turmas: 14_800, matriculas: 14_800, concluintes: 0, instituicoes: 70, percentual: 1.9 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', turmas: 12_400, matriculas: 12_400, concluintes: 0, instituicoes: 65, percentual: 1.6 },
  { uf: 'ES', nome: 'Espírito Santo', turmas: 11_800, matriculas: 11_800, concluintes: 0, instituicoes: 60, percentual: 1.5 },
  { uf: 'PB', nome: 'Paraíba', turmas: 10_200, matriculas: 10_200, concluintes: 0, instituicoes: 55, percentual: 1.3 },
  { uf: 'RN', nome: 'Rio Grande do Norte', turmas: 9_400, matriculas: 9_400, concluintes: 0, instituicoes: 50, percentual: 1.2 },
  { uf: 'AL', nome: 'Alagoas', turmas: 7_800, matriculas: 7_800, concluintes: 0, instituicoes: 40, percentual: 1.0 },
  { uf: 'PI', nome: 'Piauí', turmas: 7_200, matriculas: 7_200, concluintes: 0, instituicoes: 38, percentual: 0.9 },
  { uf: 'SE', nome: 'Sergipe', turmas: 5_600, matriculas: 5_600, concluintes: 0, instituicoes: 30, percentual: 0.7 },
  { uf: 'AM', nome: 'Amazonas', turmas: 8_900, matriculas: 8_900, concluintes: 0, instituicoes: 45, percentual: 1.1 },
  { uf: 'TO', nome: 'Tocantins', turmas: 4_800, matriculas: 4_800, concluintes: 0, instituicoes: 25, percentual: 0.6 },
  { uf: 'RO', nome: 'Rondônia', turmas: 4_200, matriculas: 4_200, concluintes: 0, instituicoes: 22, percentual: 0.5 },
  { uf: 'AC', nome: 'Acre', turmas: 2_400, matriculas: 2_400, concluintes: 0, instituicoes: 12, percentual: 0.3 },
  { uf: 'AP', nome: 'Amapá', turmas: 1_800, matriculas: 1_800, concluintes: 0, instituicoes: 10, percentual: 0.2 },
  { uf: 'RR', nome: 'Roraima', turmas: 1_200, matriculas: 1_200, concluintes: 0, instituicoes: 8, percentual: 0.2 },
];

const TOTAL_TURMAS_MOCK = MOCK_DISTRIBUICAO.presencial + MOCK_DISTRIBUICAO.ead; // 799.680

interface SecaoTurmasMockProps {
  filtros: FiltrosAnaliseMercado;
  onEstadoClick: (uf: string) => void;
}

export default function SecaoTurmasMock({ filtros, onEstadoClick }: SecaoTurmasMockProps) {
  const [busca, setBusca] = useState('');
  const [sortKey, setSortKey] = useState<'turmas' | 'nome'>('turmas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 10;

  // ─── Section header ───
  const SectionHeader = ({ num, label }: { num: string; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 8 }}>
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        backgroundColor: `${CORES.laranja}18`, border: `1.5px solid ${CORES.laranja}50`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: CORES.laranja, fontSize: '0.7rem', fontWeight: 700,
        fontFamily: "'Orbitron', monospace", flexShrink: 0,
      }}>
        {num}
      </span>
      <span style={{
        color: '#ADB5BD', fontSize: '0.72rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.05em',
        fontFamily: "'Poppins', sans-serif",
      }}>
        {label} ({filtros.ano})
      </span>
      <span style={{
        color: CORES.laranja, fontSize: '0.68rem', fontWeight: 700,
        backgroundColor: `${CORES.laranja}15`, padding: '3px 10px',
        borderRadius: 10, border: `1px solid ${CORES.laranja}40`,
      }}>
        Turmas
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#495057' }} />
    </div>
  );

  // ─── Donut configs ───
  const donutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#F8F9FA',
        font: { size: 11, weight: 'bold' as const },
        formatter: (value: number, ctx: any) => {
          const total = ctx.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
          return total ? `${((value / total) * 100).toFixed(1)}%` : '-';
        },
      },
    },
  };

  const DonutLegend = ({ items }: { items: { label: string; valor: number; cor: string }[] }) => {
    const total = items.reduce((s, i) => s + i.valor, 0) || 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: item.cor, flexShrink: 0 }} />
            <span style={{ color: '#ADB5BD', fontSize: '0.72rem', flex: 1 }}>{item.label}</span>
            <span style={{ color: item.cor, fontSize: '0.78rem', fontWeight: 700 }}>{fmtNum(item.valor)}</span>
            <span style={{ color: '#6C757D', fontSize: '0.6rem' }}>({((item.valor / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    );
  };

  // ─── Tabela de cursos ───
  const cursosFiltrados = useMemo(() => {
    let resultado = [...MOCK_CURSOS];
    if (busca.trim()) {
      const termo = busca.toLowerCase().trim();
      resultado = resultado.filter(c =>
        c.nome.toLowerCase().includes(termo) || c.area.toLowerCase().includes(termo)
      );
    }
    resultado.sort((a, b) => {
      if (sortKey === 'nome') return sortDir === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
      return sortDir === 'desc' ? b.turmas - a.turmas : a.turmas - b.turmas;
    });
    return resultado;
  }, [busca, sortKey, sortDir]);

  const totalPaginas = Math.ceil(cursosFiltrados.length / ITENS_POR_PAGINA);
  const cursosPaginados = cursosFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);
  const totalTurmasCursos = cursosFiltrados.reduce((s, c) => s + c.turmas, 0);

  // ─── Top 15 instituições (bar chart) ───
  const top15Inst = MOCK_INSTITUICOES.slice(0, 15);
  const instBarData = {
    labels: top15Inst.map(i => i.nome.length > 15 ? i.nome.substring(0, 15) + '…' : i.nome),
    datasets: [{
      label: 'Turmas',
      data: top15Inst.map(i => i.turmas),
      backgroundColor: CORES.laranja, borderRadius: 3,
    }],
  };

  const miniChartOpts: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, datalabels: { display: false },
      tooltip: { backgroundColor: '#1a1d21', borderColor: '#495057', borderWidth: 1, titleColor: '#F8F9FA', bodyColor: '#ADB5BD', padding: 10,
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fmtNum(ctx.raw)}` } } },
    scales: {
      x: { ticks: { color: '#6C757D', font: { size: 9 } }, grid: { display: false } },
      y: { ticks: { color: '#6C757D', font: { size: 9 }, callback: (v: any) => fmtNum(v) }, grid: { color: '#3D4349' } },
    },
  };

  // ─── Estados para mapa ───
  const totalBrasil = MOCK_ESTADOS.reduce((s, e) => s + e.turmas, 0) || 1;
  const estadosComPct = MOCK_ESTADOS.map(e => ({
    ...e,
    matriculas: e.turmas, // MapaBrasil uses "matriculas" key
    percentual: (e.turmas / totalBrasil) * 100,
  }));

  const rankEstadoColunas = [
    { key: 'uf' as const, label: 'UF', tipo: 'texto' as const, largura: '50px' },
    { key: 'turmas' as const, label: 'Turmas', tipo: 'numero' as const },
    { key: 'percentual' as const, label: '% Brasil', tipo: 'percentual' as const },
  ];

  const handleSort = (key: 'turmas' | 'nome') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const thStyle = (key: string): React.CSSProperties => ({
    color: sortKey === key ? '#FF6600' : '#6C757D',
    fontWeight: 600, padding: '10px 8px',
    textAlign: 'right', fontSize: '0.66rem',
    textTransform: 'uppercase', letterSpacing: '0.03em',
    borderBottom: '2px solid #495057',
    cursor: 'pointer', whiteSpace: 'nowrap',
    transition: 'color 0.15s',
    userSelect: 'none',
  });

  return (
    <div>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           1. DISTRIBUIÇÃO — 2 Gráficos de Rosca (sem Gênero)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="1" label="Distribuição de Turmas" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 24 }}>
        {/* ── Rosca 1: Modalidade ── */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
          <h4 style={{
            color: CORES.verde, fontSize: '0.73rem', fontWeight: 600, margin: '0 0 10px',
            fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Por Modalidade
          </h4>
          <div style={{ height: 170 }}>
            <Doughnut data={{
              labels: ['Presencial', 'EAD'],
              datasets: [{ data: [MOCK_DISTRIBUICAO.presencial, MOCK_DISTRIBUICAO.ead], backgroundColor: [CORES.verde, CORES.roxo], borderColor: '#343A40', borderWidth: 3 }],
            }} options={donutOptions} />
          </div>
          <DonutLegend items={[
            { label: 'Presencial', valor: MOCK_DISTRIBUICAO.presencial, cor: CORES.verde },
            { label: 'EAD', valor: MOCK_DISTRIBUICAO.ead, cor: CORES.roxo },
          ]} />
        </div>

        {/* ── Rosca 2: Tipo de Instituição ── */}
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, padding: 18, border: '1px solid #495057' }}>
          <h4 style={{
            color: CORES.azul, fontSize: '0.73rem', fontWeight: 600, margin: '0 0 10px',
            fontFamily: "'Poppins', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Por Instituição
          </h4>
          <div style={{ height: 170 }}>
            <Doughnut data={{
              labels: ['Pública', 'Privada'],
              datasets: [{ data: [MOCK_DISTRIBUICAO.publica, MOCK_DISTRIBUICAO.privada], backgroundColor: [CORES.azul, CORES.laranja], borderColor: '#343A40', borderWidth: 3 }],
            }} options={donutOptions} />
          </div>
          <DonutLegend items={[
            { label: 'Pública', valor: MOCK_DISTRIBUICAO.publica, cor: CORES.azul },
            { label: 'Privada', valor: MOCK_DISTRIBUICAO.privada, cor: CORES.laranja },
          ]} />
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           2. POR CURSO — Tabela de turmas por curso
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="2" label="Turmas por Curso" />
      <div style={{ marginBottom: 24 }}>
        <div style={{ backgroundColor: '#343A40', borderRadius: 12, border: '1px solid #495057', overflow: 'hidden' }}>
          {/* Barra de Busca */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid #495057',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Buscar por nome ou área do curso..."
                value={busca}
                onChange={e => { setBusca(e.target.value); setPaginaAtual(1); }}
                style={{
                  width: '100%', padding: '7px 10px 7px 14px',
                  backgroundColor: '#2D3238', border: '1px solid #495057',
                  borderRadius: 6, color: '#F8F9FA', fontSize: '0.75rem',
                  outline: 'none', fontFamily: "'Poppins', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Tabela */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle('nome'), textAlign: 'left', paddingLeft: 20 }} onClick={() => handleSort('nome')}>Curso</th>
                  <th style={thStyle('area')}>Área</th>
                  <th style={thStyle('turmas')} onClick={() => handleSort('turmas')}>Turmas ▼</th>
                  <th style={thStyle('presencial')}>Presencial</th>
                  <th style={thStyle('ead')}>EAD</th>
                  <th style={thStyle('instituicoes')}>Instituições</th>
                </tr>
              </thead>
              <tbody>
                {cursosPaginados.map((curso, i) => (
                  <tr key={curso.nome} style={{ borderBottom: '1px solid #3D4349', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#3D434920')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 8px 10px 20px', color: '#F8F9FA', fontSize: '0.78rem', fontWeight: 600 }}>
                      {curso.nome}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: '#495057', color: '#ADB5BD',
                        padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem',
                        whiteSpace: 'nowrap',
                      }}>
                        {curso.area}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.laranja, fontWeight: 700, fontSize: '0.78rem' }}>
                      {fmtInteiro(curso.turmas)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.verde, fontSize: '0.75rem' }}>
                      {fmtInteiro(curso.presencial)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: CORES.roxo, fontSize: '0.75rem' }}>
                      {fmtInteiro(curso.ead)}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', color: '#ADB5BD', fontSize: '0.75rem' }}>
                      {fmtInteiro(curso.instituicoes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
              padding: '12px', borderTop: '1px solid #495057',
            }}>
              <button
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual(p => p - 1)}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid #495057',
                  backgroundColor: 'transparent', color: paginaAtual === 1 ? '#495057' : '#ADB5BD',
                  cursor: paginaAtual === 1 ? 'not-allowed' : 'pointer', fontSize: '0.7rem',
                }}
              >
                ← Anterior
              </button>
              <span style={{ color: '#6C757D', fontSize: '0.7rem' }}>
                {paginaAtual} / {totalPaginas}
              </span>
              <button
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual(p => p + 1)}
                style={{
                  padding: '4px 10px', borderRadius: 4, border: '1px solid #495057',
                  backgroundColor: 'transparent', color: paginaAtual === totalPaginas ? '#495057' : '#ADB5BD',
                  cursor: paginaAtual === totalPaginas ? 'not-allowed' : 'pointer', fontSize: '0.7rem',
                }}
              >
                Próximo →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           3. POR INSTITUIÇÃO — Ranking de IES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="3" label="Turmas por Instituição" />
      <div style={{ marginBottom: 24 }}>
        <CardInsight
          titulo={`Turmas por Instituição (${filtros.ano})`}
          cor={CORES.laranja}
          icone={<Building2 size={16} />}
          iniciaExpandido
          resumo={[
            { label: 'Instituições', valor: fmtInteiro(MOCK_INSTITUICOES.length), cor: CORES.laranja },
            { label: 'Total Turmas', valor: fmtInteiro(MOCK_INSTITUICOES.reduce((s, i) => s + i.turmas, 0)), cor: '#ADB5BD' },
          ]}
        >
          <div style={{ marginTop: 14 }}>
            <div style={{ height: 200, marginBottom: 16 }}>
              <Bar data={instBarData} options={{
                ...miniChartOpts,
                indexAxis: 'x' as const,
                plugins: { ...miniChartOpts.plugins,
                  tooltip: { ...miniChartOpts.plugins.tooltip,
                    callbacks: {
                      ...miniChartOpts.plugins.tooltip.callbacks,
                      title: (items: any[]) => items.length ? top15Inst[items[0].dataIndex]?.nome || '' : '',
                    },
                  },
                  datalabels: {
                    color: '#F8F9FA', font: { size: 8, weight: 'bold' as const },
                    anchor: 'end' as const, align: 'top' as const,
                    formatter: (v: number) => fmtInteiro(v),
                  },
                },
              }} />
            </div>
            <TabelaRanking
              titulo=""
              dados={MOCK_INSTITUICOES}
              colunas={[
                { key: 'nome', label: 'Instituição', tipo: 'texto' },
                { key: 'tipo', label: 'Tipo', tipo: 'texto', largura: '70px' },
                { key: 'cursos', label: 'Cursos', tipo: 'numero', largura: '70px' },
                { key: 'turmas', label: 'Turmas', tipo: 'numero' },
                { key: 'uf', label: 'UF', tipo: 'texto', largura: '50px' },
              ]}
              linhasVisiveis={10}
            />
          </div>
        </CardInsight>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
           4. GEOGRAFIA — Distribuição territorial
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <SectionHeader num="4" label="Distribuição Geográfica" />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginBottom: 24 }}>
        <MapaBrasil
          dados={estadosComPct}
          metrica="matriculas"
          cidades={{}}
          estadoSelecionado={filtros.estado}
          onEstadoClick={onEstadoClick}
          ano={filtros.ano}
        />
        {filtros.estado ? (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <TabelaRanking
                titulo={`Ranking por Estado — Turmas (${filtros.ano})`}
                dados={estadosComPct}
                colunas={rankEstadoColunas}
                linhasVisiveis={10}
                fillHeight
              />
            </div>
          </div>
        ) : (
          <TabelaRanking
            titulo={`Ranking por Estado — Turmas (${filtros.ano})`}
            dados={estadosComPct}
            colunas={rankEstadoColunas}
            linhasVisiveis={10}
          />
        )}
      </div>
    </div>
  );
}
