/**
 * Grid de KPI Cards para o módulo Carteira
 */

import React from 'react';
import { KPIsCarteira } from '@/modules/carteira/types';
import KPICard from './KPICard';
import { formatPercent, formatCurrency } from '@/modules/carteira/utils/formatacao';

interface KPICardsProps {
  kpis: KPIsCarteira;
  loading?: boolean;
}

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
        />

        {/* Fundos Ativos */}
        <KPICard
          titulo="Fundos Ativos"
          valor={kpis.fundosAtivos}
          subtitulo="fundos em operação"
          loading={loading}
        />

        {/* Integrantes Ativos */}
        <KPICard
          titulo="Integrantes Ativos"
          valor={kpis.alunosAtivos}
          subtitulo="integrantes ativos"
          loading={loading}
        />

        {/* MAC Atual - Meta de Alunos do Contrato */}
        <KPICard
          titulo="MAC Atual"
          valor={kpis.atingimentoMAC.meta}
          subtitulo="meta de alunos do contrato"
          loading={loading}
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
        />

        {/* Evento Principal */}
        <KPICard
          titulo="Evento Principal"
          valor={kpis.alunosEventoPrincipal}
          subtitulo="aderidos ao principal"
          loading={loading}
        />

        {/* Inadimplentes - valor absoluto + % sobre integrantes ativos */}
        <KPICard
          titulo="Inadimplentes"
          valor={kpis.integrantesInadimplentes}
          destaque={`${kpis.alunosAtivos > 0 ? ((kpis.integrantesInadimplentes / kpis.alunosAtivos) * 100).toFixed(1) : 0}% da base ativa`}
          loading={loading}
        />

        {/* Nunca Pagaram - valor absoluto + % sobre integrantes ativos */}
        <KPICard
          titulo="Nunca Pagaram"
          valor={kpis.nuncaPagaram}
          destaque={`${kpis.alunosAtivos > 0 ? ((kpis.nuncaPagaram / kpis.alunosAtivos) * 100).toFixed(1) : 0}% da base ativa`}
          loading={loading}
        />
      </div>
    </div>
  );
}
