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
  fundosAtivos: 'Total de fundos que estão atualmente em operação na carteira.',
  integrantesAtivos: 'Total de integrantes com status ativo nos fundos. São os alunos que estão participando efetivamente.',
  macAtual: 'Meta de Alunos do Contrato - quantidade de alunos que cada fundo precisa atingir conforme contrato.',
  tatAtual: 'Total de Alunos da Turma - soma de todos os alunos matriculados, independente do status.',
  eventoPrincipal: 'Quantidade de integrantes que aderiram ao evento principal (formatura/baile).',
  inadimplentes: 'Integrantes com pagamentos em atraso. O percentual é calculado sobre a base de integrantes ativos.',
  nuncaPagaram: 'Integrantes que nunca realizaram nenhum pagamento. O percentual é calculado sobre a base de integrantes ativos.',
};

export default function KPICards({ kpis, loading = false }: KPICardsProps) {
  return (
    <div className="space-y-4">
      {/* Primeira linha - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Atingimento de MAC - somente percentual */}
        <KPICard
          titulo="Atingimento MAC"
          valor={formatPercent(kpis.atingimentoMAC.percentual)}
          subtitulo="integrantes / meta alunos"
          loading={loading}
          tooltip={TOOLTIPS.atingimentoMAC}
        />

        {/* Fundos Ativos */}
        <KPICard
          titulo="Fundos Ativos"
          valor={kpis.fundosAtivos}
          subtitulo="fundos em operação"
          loading={loading}
          tooltip={TOOLTIPS.fundosAtivos}
        />

        {/* Integrantes Ativos */}
        <KPICard
          titulo="Integrantes Ativos"
          valor={kpis.alunosAtivos}
          subtitulo="integrantes ativos"
          loading={loading}
          tooltip={TOOLTIPS.integrantesAtivos}
        />

        {/* MAC Atual - Meta de Alunos do Contrato */}
        <KPICard
          titulo="MAC Atual"
          valor={kpis.atingimentoMAC.meta}
          subtitulo="meta de alunos do contrato"
          loading={loading}
          tooltip={TOOLTIPS.macAtual}
        />
      </div>

      {/* Segunda linha - 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TAT Atual */}
        <KPICard
          titulo="TAT Atual"
          valor={kpis.tatAtual}
          subtitulo="total de alunos da turma"
          loading={loading}
          tooltip={TOOLTIPS.tatAtual}
        />

        {/* Evento Principal */}
        <KPICard
          titulo="Evento Principal"
          valor={kpis.alunosEventoPrincipal}
          subtitulo="aderidos ao principal"
          loading={loading}
          tooltip={TOOLTIPS.eventoPrincipal}
        />

        {/* Inadimplentes - valor absoluto + % sobre integrantes ativos */}
        <KPICard
          titulo="Inadimplentes"
          valor={kpis.integrantesInadimplentes}
          destaque={`${kpis.alunosAtivos > 0 ? ((kpis.integrantesInadimplentes / kpis.alunosAtivos) * 100).toFixed(1) : 0}% da base ativa`}
          loading={loading}
          tooltip={TOOLTIPS.inadimplentes}
        />

        {/* Nunca Pagaram - valor absoluto + % sobre integrantes ativos */}
        <KPICard
          titulo="Nunca Pagaram"
          valor={kpis.nuncaPagaram}
          destaque={`${kpis.alunosAtivos > 0 ? ((kpis.nuncaPagaram / kpis.alunosAtivos) * 100).toFixed(1) : 0}% da base ativa`}
          loading={loading}
          tooltip={TOOLTIPS.nuncaPagaram}
        />
      </div>
    </div>
  );
}
