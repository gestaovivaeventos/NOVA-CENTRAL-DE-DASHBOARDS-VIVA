/**
 * Grid de KPI Cards para o módulo Carteira
 */

import React from 'react';
import { KPIsCarteira } from '@/modules/carteira/types';
import KPICard from './KPICard';
import { 
  Target, 
  Wallet, 
  Users, 
  PartyPopper, 
  AlertTriangle 
} from 'lucide-react';

interface KPICardsProps {
  kpis: KPIsCarteira;
  loading?: boolean;
}

export default function KPICards({ kpis, loading = false }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Atingimento de MAC */}
      <KPICard
        titulo="Atingimento MAC"
        valor={kpis.atingimentoMAC.realizado}
        formatarComoMoeda={true}
        percentual={kpis.atingimentoMAC.percentual}
        meta={kpis.atingimentoMAC.meta}
        loading={loading}
        icone={<Target size={16} />}
      />

      {/* Fundos Ativos */}
      <KPICard
        titulo="Fundos Ativos"
        valor={kpis.fundosAtivos}
        subtitulo="fundos em operação"
        loading={loading}
        icone={<Wallet size={16} />}
      />

      {/* Alunos Ativos */}
      <KPICard
        titulo="Alunos Ativos"
        valor={kpis.alunosAtivos}
        subtitulo="integrantes ativos"
        loading={loading}
        icone={<Users size={16} />}
      />

      {/* Alunos Evento Principal */}
      <KPICard
        titulo="Evento Principal"
        valor={kpis.alunosEventoPrincipal}
        subtitulo="alunos aderidos"
        loading={loading}
        icone={<PartyPopper size={16} />}
      />

      {/* Inadimplentes */}
      <KPICard
        titulo="Inadimplentes"
        valor={kpis.integrantesInadimplentes}
        subtitulo="integrantes"
        loading={loading}
        icone={<AlertTriangle size={16} />}
      />
    </div>
  );
}
