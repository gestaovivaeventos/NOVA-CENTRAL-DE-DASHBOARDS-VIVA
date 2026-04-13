/**
 * Grid de KPI Cards para o módulo Carteira
 * Com tooltips explicativos para cada indicador
 */

import React from 'react';
import { KPIsCarteira } from '@/modules/carteira/types';
import KPICard from './KPICard';
import { formatPercent, formatCurrency } from '@/modules/carteira/utils/formatacao';

interface KPICardsProps {
  kpis: KPIsCarteira;
  loading?: boolean;
}

// Textos explicativos para cada KPI
const TOOLTIPS = {
  atingimentoMAC: 'Percentual de atingimento da Meta de Alunos do Contrato. Calculado: (Integrantes Ativos ÷ MAC) × 100',
  macAtual: 'Meta de Alunos do Contrato - quantidade de alunos que cada fundo precisa atingir conforme contrato.',
  integrantesAtivos: 'Total de integrantes com status ativo nos fundos. São os alunos que estão participando efetivamente.',
  eventoPrincipal: 'Quantidade de integrantes que aderiram ao evento principal (formatura/baile).',
  tatAtual: 'Total de Alunos da Turma - soma de todos os alunos matriculados, independente do status.',
  fundosAtivos: 'Total de fundos que estão atualmente em operação na carteira.',
  endividados: 'Integrantes endividados: soma dos inadimplentes (pagamentos em atraso) com integrantes com débitos futuros. O percentual é calculado sobre a base de integrantes ativos.',
  inadimplentes: 'Integrantes com pagamentos em atraso. O percentual é calculado sobre a base de integrantes ativos.',
  nuncaPagaram: 'Integrantes que nunca realizaram nenhum pagamento. O percentual é calculado sobre a base de integrantes ativos.',
  desligados: 'Integrantes que foram desligados dos fundos. O percentual é calculado sobre a base de integrantes ativos.',
};

export default function KPICards({ kpis, loading = false }: KPICardsProps) {
  const calcPercent = (value: number) => 
    kpis.alunosAtivos > 0 ? ((value / kpis.alunosAtivos) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      {/* Primeira linha - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Atingimento de MAC */}
        <KPICard
          titulo="Atingimento MAC"
          valor={formatPercent(kpis.atingimentoMAC.percentual)}
          subtitulo="integrantes / meta alunos"
          loading={loading}
          tooltip={TOOLTIPS.atingimentoMAC}
        />

        {/* MAC Atual */}
        <KPICard
          titulo="MAC Atual"
          valor={kpis.atingimentoMAC.meta}
          subtitulo="meta de alunos do contrato"
          loading={loading}
          tooltip={TOOLTIPS.macAtual}
        />

        {/* Integrantes Ativos */}
        <KPICard
          titulo="Integrantes Ativos"
          valor={kpis.alunosAtivos}
          subtitulo="integrantes ativos"
          loading={loading}
          tooltip={TOOLTIPS.integrantesAtivos}
        />

        {/* Evento Principal */}
        <KPICard
          titulo="Integrantes Aderidos ao Evento Principal"
          valor={kpis.alunosEventoPrincipal}
          destaque={`${calcPercent(kpis.alunosEventoPrincipal)}% dos integrantes ativos`}
          loading={loading}
          tooltip={TOOLTIPS.eventoPrincipal}
        />

        {/* TAT Atual */}
        <KPICard
          titulo="TAT Atual"
          valor={kpis.tatAtual}
          subtitulo="total de alunos da turma"
          loading={loading}
          tooltip={TOOLTIPS.tatAtual}
        />
      </div>

      {/* Segunda linha - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Fundos Ativos */}
        <KPICard
          titulo="Fundos Ativos"
          valor={kpis.fundosAtivos}
          subtitulo="fundos em operação"
          loading={loading}
          tooltip={TOOLTIPS.fundosAtivos}
        />

        {/* Integrantes Endividados */}
        <KPICard
          titulo="Integrantes Endividados"
          valor={kpis.integrantesEndividados}
          destaque={`${calcPercent(kpis.integrantesEndividados)}% dos integrantes ativos`}
          loading={loading}
          tooltip={TOOLTIPS.endividados}
        />

        {/* Inadimplentes */}
        <KPICard
          titulo="Integrantes Inadimplentes"
          valor={kpis.integrantesInadimplentes}
          destaque={`${calcPercent(kpis.integrantesInadimplentes)}% dos integrantes ativos`}
          loading={loading}
          tooltip={TOOLTIPS.inadimplentes}
        />

        {/* Nunca Pagaram */}
        <KPICard
          titulo="Integrantes que Nunca Pagaram"
          valor={kpis.nuncaPagaram}
          destaque={`${calcPercent(kpis.nuncaPagaram)}% dos integrantes ativos`}
          loading={loading}
          tooltip={TOOLTIPS.nuncaPagaram}
        />

        {/* Integrantes Desligados */}
        <KPICard
          titulo="Integrantes Desligados"
          valor={kpis.integrantesDesligados}
          destaque={`${calcPercent(kpis.integrantesDesligados)}% dos integrantes ativos`}
          loading={loading}
          tooltip={TOOLTIPS.desligados}
        />
      </div>
    </div>
  );
}
