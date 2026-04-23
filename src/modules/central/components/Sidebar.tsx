'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Search, X, ChevronDown, FolderOpen } from 'lucide-react';
import { useModuloPermissions } from '@/modules/controle-modulos/hooks';
import { getLucideIcon } from '@/modules/controle-modulos/config/icones';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Definição de dashboard
interface Dashboard {
  id: string;
  label: string;
  path: string;
  icon: string;
  tipo: 'interno' | 'externo';
  urlExterna: string;
  subgrupo: string;
  ordem: number;
  beta: boolean;
}

// Definição de subgrupo
interface SubgrupoItem {
  nome: string;
  icone: string;
  ordem: number;
  dashboards: Dashboard[];
}

// Definição de grupo
interface DashboardGroup {
  id: string;
  name: string;
  dashboards: Dashboard[];
  subgrupos: SubgrupoItem[];
  iconName?: string;
}

// Info de grupo vinda da API
interface GrupoAPIInfo {
  nome: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

// Info de subgrupo vinda da API
interface SubgrupoAPIInfo {
  nome: string;
  grupo: string;
  icone: string;
  ordem: number;
  ativo: boolean;
}

// Grupos de dashboards - 100% dinâmico a partir da planilha BASE MODULOS
const buildDashboardGroups = (
  modulos: { moduloId: string; moduloNome: string; moduloPath: string; grupo: string; ordem: number; icone: string; tipo?: string; urlExterna?: string; subgrupo?: string; beta?: boolean }[],
  allowedIds: Set<string>,
  gruposInfo: GrupoAPIInfo[],
  subgruposInfo: SubgrupoAPIInfo[]
): DashboardGroup[] => {
  const grupoMap = new Map<string, GrupoAPIInfo>();
  for (const g of gruposInfo) {
    grupoMap.set(g.nome.toLowerCase(), g);
  }

  const subgrupoMap = new Map<string, SubgrupoAPIInfo[]>();
  for (const sg of subgruposInfo) {
    if (!sg.ativo) continue;
    const key = sg.grupo.toLowerCase();
    if (!subgrupoMap.has(key)) subgrupoMap.set(key, []);
    subgrupoMap.get(key)!.push(sg);
  }

  const allowed = modulos
    .filter(m => allowedIds.has(m.moduloId))
    .sort((a, b) => a.ordem - b.ordem);

  const groupMap = new Map<string, Dashboard[]>();
  for (const m of allowed) {
    const g = m.grupo || 'Outros';
    const info = grupoMap.get(g.toLowerCase());
    if (info && !info.ativo) continue;

    if (!groupMap.has(g)) groupMap.set(g, []);
    groupMap.get(g)!.push({
      id: m.moduloId,
      label: m.moduloNome,
      path: m.moduloPath,
      icon: m.icone || 'dashboard',
      tipo: (m.tipo as 'interno' | 'externo') || 'interno',
      urlExterna: m.urlExterna || '',
      subgrupo: m.subgrupo || '',
      ordem: m.ordem,
      beta: m.beta || false,
    });
  }

  const groups = Array.from(groupMap.entries()).map(([name, dashboards]) => {
    const info = grupoMap.get(name.toLowerCase());
    const sgInfos = subgrupoMap.get(name.toLowerCase()) || [];
    
    // Separar dashboards com e sem subgrupo
    const withSub = new Map<string, Dashboard[]>();
    const withoutSub: Dashboard[] = [];
    
    for (const d of dashboards) {
      if (d.subgrupo) {
        if (!withSub.has(d.subgrupo)) withSub.set(d.subgrupo, []);
        withSub.get(d.subgrupo)!.push(d);
      } else {
        withoutSub.push(d);
      }
    }

    const subgrupos: SubgrupoItem[] = sgInfos
      .sort((a, b) => a.ordem - b.ordem)
      .filter(sg => withSub.has(sg.nome))
      .map(sg => ({
        nome: sg.nome,
        icone: sg.icone || 'folder',
        ordem: sg.ordem,
        dashboards: withSub.get(sg.nome) || [],
      }));

    // Subgrupos referenciados por módulos mas não cadastrados
    for (const [sgName, sgDashes] of withSub.entries()) {
      if (!subgrupos.some(s => s.nome === sgName)) {
        subgrupos.push({
          nome: sgName,
          icone: 'folder',
          ordem: 99,
          dashboards: sgDashes,
        });
      }
    }

    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      dashboards: withoutSub,
      subgrupos,
      iconName: info?.icone,
    };
  });

  groups.sort((a, b) => {
    const ordemA = grupoMap.get(a.name.toLowerCase())?.ordem ?? 99;
    const ordemB = grupoMap.get(b.name.toLowerCase())?.ordem ?? 99;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return groups;
};

// Ícones SVG inline
const icons: Record<string, JSX.Element> = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  money: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  funnel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  wallet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  fluxo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  network: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  projetos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 18l6-6-6-6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6l-6 6 6 6" />
    </svg>
  ),
  branch: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v12" />
      <circle cx="6" cy="18" r="3" fill="none" />
      <circle cx="18" cy="6" r="3" fill="none" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9a9 9 0 01-9 9" />
    </svg>
  ),
  results: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  config: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  starFilled: (
    <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  externalLink: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  marketing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  creditcard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  people: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  report: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  tool: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
    </svg>
  ),
};

// Mapeamento de nomes de ícone da API GRUPOS → chave do record 'icons'
const grupoIconToSidebarIcon: Record<string, string> = {
  'target': 'target',
  'chart': 'chart',
  'money': 'money',
  'trophy': 'trophy',
  'users': 'users',
  'settings': 'settings',
  'dashboard': 'dashboard',
  'file-spreadsheet': 'results',
  'code': 'code',
  'git-branch': 'branch',
  'bar-chart': 'chart',
  'pie-chart': 'chart',
  'trending-up': 'fluxo',
  'database': 'settings',
  'folder': 'projetos',
  'link': 'settings',
  'external-link': 'settings',
  'wallet': 'wallet',
  'funnel': 'funnel',
  'clipboard': 'report',
  'layout-dashboard': 'dashboard',
};

// Componente de Dashboard Item (reutilizável)
const DashboardItem = ({
  dashboard,
  active,
  isFavorite,
  onToggleFavorite,
  onClose,
  indent,
}: {
  dashboard: Dashboard;
  active: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  indent: number;
}) => {
  const isExternal = dashboard.tipo === 'externo' && dashboard.urlExterna;
  const labelLen = dashboard.label.length;
  const fontSize = labelLen > 30 ? '0.72rem' : labelLen > 20 ? '0.78rem' : '0.82rem';

  const linkContent = (
    <>
      <span style={{ opacity: active ? 1 : 0.55, flexShrink: 0, width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(() => { const Icon = getLucideIcon(dashboard.icon); return <Icon size={16} />; })()}
      </span>
      <span style={{ flex: 1, minWidth: 0, lineHeight: '1.3', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: 6 }}>
        {dashboard.label}
        {dashboard.beta && (
          <span title="Versão beta em validação interna" style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: '#fff',
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: '0.5rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            lineHeight: 1.4,
            flexShrink: 0,
            cursor: 'default',
          }}>BETA</span>
        )}
      </span>
      {isExternal && (
        <span style={{ opacity: 0.4, flexShrink: 0 }}>
          {icons.externalLink}
        </span>
      )}
    </>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: active ? 'rgba(255, 102, 0, 0.12)' : 'transparent',
        borderLeft: active ? '3px solid #FF6600' : '3px solid transparent',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderLeftColor = 'rgba(255, 102, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderLeftColor = 'transparent';
        }
      }}
    >
      {isExternal ? (
        <a
          href={dashboard.urlExterna}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: `8px 12px 8px ${indent}px`,
            color: '#9ca3af',
            textDecoration: 'none',
            fontFamily: "'Poppins', sans-serif",
            fontSize,
            fontWeight: 500,
            minWidth: 0,
          }}
        >
          {linkContent}
        </a>
      ) : (
        <Link
          href={dashboard.path}
          onClick={() => onClose()}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: `8px 12px 8px ${indent}px`,
            color: active ? '#FF6600' : '#9ca3af',
            textDecoration: 'none',
            fontFamily: "'Poppins', sans-serif",
            fontSize,
            fontWeight: active ? 600 : 500,
            minWidth: 0,
          }}
        >
          {linkContent}
        </Link>
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(dashboard.id);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isFavorite ? '#fbbf24' : '#3a3f47',
          transition: 'color 0.2s',
        }}
        title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        {isFavorite ? icons.starFilled : icons.star}
      </button>
    </div>
  );
};

// Componente de Grupo colapsável - Estilo Mundo Viva
const CollapsibleGroup = ({ 
  group, 
  searchTerm,
  favorites,
  onToggleFavorite,
  onClose,
  router,
}: { 
  group: DashboardGroup; 
  searchTerm: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubgrupos, setOpenSubgrupos] = useState<Set<string>>(new Set());
  const preSearchState = useRef<{ isOpen: boolean; openSubgrupos: Set<string> } | null>(null);

  const toggleSubgrupo = (nome: string) => {
    setOpenSubgrupos(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome); else next.add(nome);
      return next;
    });
  };

  const groupIcon = useMemo(() => {
    const iconName = group.iconName || 'dashboard';
    const Icon = getLucideIcon(iconName);
    return <Icon size={16} />;
  }, [group.iconName]);

  // Todos os dashboards do grupo (incluindo os de subgrupos)
  const allDashboards = useMemo(() => {
    const all = [...group.dashboards];
    for (const sg of group.subgrupos) {
      all.push(...sg.dashboards);
    }
    return all;
  }, [group.dashboards, group.subgrupos]);

  const normalize = (str: string) =>
    str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filteredDashboards = useMemo(() => {
    if (!searchTerm) return group.dashboards;
    const search = normalize(searchTerm);
    return group.dashboards.filter(d => normalize(d.label).includes(search));
  }, [group.dashboards, searchTerm]);

  const filteredSubgrupos = useMemo(() => {
    if (!searchTerm) return group.subgrupos;
    const search = normalize(searchTerm);
    return group.subgrupos
      .map(sg => {
        // Se o nome do subgrupo bate com a busca, mostra todos os dashboards dele
        if (normalize(sg.nome).includes(search)) {
          return sg;
        }
        // Senão, filtra individual os dashboards
        return {
          ...sg,
          dashboards: sg.dashboards.filter(d => normalize(d.label).includes(search)),
        };
      })
      .filter(sg => sg.dashboards.length > 0);
  }, [group.subgrupos, searchTerm]);

  useEffect(() => {
    if (searchTerm && (filteredDashboards.length > 0 || filteredSubgrupos.length > 0)) {
      // Salvar estado antes de expandir tudo pela busca
      if (!preSearchState.current) {
        preSearchState.current = { isOpen, openSubgrupos: new Set(openSubgrupos) };
      }
      setIsOpen(true);
      if (filteredSubgrupos.length > 0) {
        setOpenSubgrupos(new Set(filteredSubgrupos.map(sg => sg.nome)));
      }
    } else if (!searchTerm && preSearchState.current) {
      // Restaurar estado anterior quando a busca é limpa
      setIsOpen(preSearchState.current.isOpen);
      setOpenSubgrupos(preSearchState.current.openSubgrupos);
      preSearchState.current = null;
    }
  }, [searchTerm, filteredDashboards.length, filteredSubgrupos.length]);

  const totalVisible = filteredDashboards.length + filteredSubgrupos.reduce((sum, sg) => sum + sg.dashboards.length, 0);
  if (totalVisible === 0) return null;

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/');
  };

  // Verifica se algum dashboard do grupo está ativo
  const groupHasActive = allDashboards.some(d => d.tipo !== 'externo' && isActive(d.path));

  return (
    <div style={{ marginBottom: 2 }}>
      {/* Header do grupo - full-width, estilo Mundo Viva */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '11px 14px',
          backgroundColor: isOpen ? 'rgba(255, 102, 0, 0.1)' : groupHasActive ? 'rgba(255, 102, 0, 0.05)' : 'transparent',
          border: 'none',
          borderLeft: isOpen ? '3px solid #FF6600' : groupHasActive ? '3px solid rgba(255, 102, 0, 0.4)' : '3px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          gap: 10,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 102, 0, 0.07)';
            e.currentTarget.style.borderLeftColor = 'rgba(255, 102, 0, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = groupHasActive ? 'rgba(255, 102, 0, 0.05)' : 'transparent';
            e.currentTarget.style.borderLeftColor = groupHasActive ? 'rgba(255, 102, 0, 0.4)' : 'transparent';
          }
        }}
      >
        <span style={{
          width: 20,
          minWidth: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? '#FF6600' : '#6b7280',
          transition: 'color 0.15s',
        }}>
          {groupIcon}
        </span>
        <span style={{
          color: isOpen ? '#e5e7eb' : '#9ca3af',
          fontWeight: 600,
          fontSize: '0.73rem',
          lineHeight: 1.25,
          fontFamily: "'Poppins', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          flex: 1,
          textAlign: 'left',
          transition: 'color 0.15s',
        }}>
          {group.name}
        </span>
        <span style={{
          color: isOpen ? '#FF6600' : '#4b5563',
          display: 'flex',
          alignItems: 'center',
          transition: 'all 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <ChevronDown size={16} />
        </span>
      </button>

      {/* Conteúdo expandido - intercalado por ordem */}
      {isOpen && (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          borderLeft: '3px solid rgba(255, 102, 0, 0.15)',
        }}>
          {(() => {
            // Montar lista intercalada: dashboards avulsos + subgrupos, ordenados por ordem
            type SidebarRenderItem =
              | { type: 'dash'; dashboard: Dashboard; ordem: number }
              | { type: 'subgrupo'; sg: typeof filteredSubgrupos[0]; ordem: number };

            const items: SidebarRenderItem[] = [];

            for (const d of filteredDashboards) {
              items.push({ type: 'dash', dashboard: d, ordem: d.ordem });
            }
            for (const sg of filteredSubgrupos) {
              items.push({ type: 'subgrupo', sg, ordem: sg.ordem });
            }

            items.sort((a, b) => a.ordem - b.ordem);

            return items.map((item) => {
              if (item.type === 'dash') {
                const dashboard = item.dashboard;
                return (
                  <DashboardItem
                    key={dashboard.id}
                    dashboard={dashboard}
                    active={dashboard.tipo !== 'externo' && isActive(dashboard.path)}
                    isFavorite={favorites.includes(dashboard.id)}
                    onToggleFavorite={onToggleFavorite}
                    onClose={onClose}
                    indent={28}
                  />
                );
              }

              // Subgrupo
              const sg = item.sg;
              const sgOpen = openSubgrupos.has(sg.nome);
              const sgHasActive = sg.dashboards.some(d => d.tipo !== 'externo' && isActive(d.path));
              return (
                <div key={`sg-${sg.nome}`}>
                  <button
                    onClick={() => toggleSubgrupo(sg.nome)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '7px 14px 7px 22px',
                      backgroundColor: sgOpen ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                      border: 'none',
                      borderLeft: sgOpen ? '2px solid #10b981' : sgHasActive ? '2px solid rgba(16, 185, 129, 0.3)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!sgOpen) {
                        e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.04)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!sgOpen) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {(() => { const Icon = getLucideIcon(sg.icone || 'folder'); return <Icon size={13} color={sgOpen ? '#10b981' : '#555'} />; })()}
                    <span style={{
                      color: sgOpen ? '#a7f3d0' : '#6b7280',
                      fontWeight: 600,
                      fontSize: '0.68rem',
                      fontFamily: "'Poppins', sans-serif",
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      flex: 1,
                      textAlign: 'left',
                    }}>
                      {sg.nome}
                    </span>
                    <span style={{
                      color: sgOpen ? '#10b981' : '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                      transform: sgOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      <ChevronDown size={13} />
                    </span>
                  </button>
                  {sgOpen && (
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                      {sg.dashboards.map((dashboard) => (
                        <DashboardItem
                          key={dashboard.id}
                          dashboard={dashboard}
                          active={dashboard.tipo !== 'externo' && isActive(dashboard.path)}
                          isFavorite={favorites.includes(dashboard.id)}
                          onToggleFavorite={onToggleFavorite}
                          onClose={onClose}
                          indent={40}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [gruposInfo, setGruposInfo] = useState<GrupoAPIInfo[]>([]);
  const [subgruposInfo, setSubgruposInfo] = useState<SubgrupoAPIInfo[]>([]);
  const [gruposLoaded, setGruposLoaded] = useState(false);
  const [subgruposLoaded, setSubgruposLoaded] = useState(false);
  const { allowedIds, modulos, loading: modulosLoading } = useModuloPermissions(
    user?.username,
    user?.accessLevel,
    { unitNames: user?.unitNames }
  );

  // Buscar dados de grupos da API (ícone, ordem, ativo)
  const fetchGruposInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/controle-modulos/grupos?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setGruposInfo(data.grupos || []);
      }
    } catch {
      // silently fail — usa defaults
    } finally {
      setGruposLoaded(true);
    }
  }, []);

  // Buscar dados de subgrupos da API
  const fetchSubgruposInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/controle-modulos/subgrupos');
      if (res.ok) {
        const data = await res.json();
        setSubgruposInfo(data.subgrupos || []);
      }
    } catch {
      // silently fail
    } finally {
      setSubgruposLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchGruposInfo();
    fetchSubgruposInfo();
  }, [fetchGruposInfo, fetchSubgruposInfo]);

  const allDataLoaded = !modulosLoading && gruposLoaded && subgruposLoaded;

  const dashboardGroups = useMemo(() => buildDashboardGroups(modulos, allowedIds, gruposInfo, subgruposInfo), [modulos, allowedIds, gruposInfo, subgruposInfo]);

  // Carregar favoritos do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('dashboard-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        setFavorites([]);
      }
    }
  }, []);

  // Salvar favoritos no localStorage e disparar evento para atualizar outras páginas
  const toggleFavorite = (id: string) => {
    const newFavorites = favorites.includes(id)
      ? favorites.filter(f => f !== id)
      : [...favorites, id];
    
    setFavorites(newFavorites);
    localStorage.setItem('dashboard-favorites', JSON.stringify(newFavorites));
    
    // Disparar evento customizado para notificar outras páginas
    window.dispatchEvent(new CustomEvent('favorites-updated', { detail: newFavorites }));
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
        }}
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          flex flex-col
          w-64 h-screen lg:h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header mobile */}
        <div 
          style={{ borderBottom: '1px solid #333' }}
          className="h-16 flex items-center justify-between px-4 lg:hidden"
        >
          <span className="text-dark-text font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-dark-bg text-dark-text-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation - ocupa todo o espaço disponível até o footer */}
        <nav 
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #1a1d21',
          }}
        >
          <style jsx>{`
            nav::-webkit-scrollbar {
              width: 5px;
            }
            nav::-webkit-scrollbar-track {
              background: #1a1d21;
            }
            nav::-webkit-scrollbar-thumb {
              background: #444;
              border-radius: 3px;
            }
            nav::-webkit-scrollbar-thumb:hover {
              background: #666;
            }
          `}</style>
          {/* Barra de Pesquisa */}
          <div style={{ padding: '12px 12px 8px', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#FF6600',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '8px',
                border: '1px solid #333',
                background: '#15181c',
                color: '#e5e7eb',
                fontSize: '0.82rem',
                fontFamily: "'Poppins', sans-serif",
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FF6600';
                e.target.style.boxShadow = '0 0 0 1px rgba(255, 102, 0, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#333';
                e.target.style.boxShadow = 'none';
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 4,
                }}
                title="Limpar pesquisa"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Separador */}
          <div style={{ height: 1, background: '#2a2d32', margin: '4px 0 6px' }} />

          {/* Grupos de Dashboards - só renderizar após todos os dados carregarem */}
          {!allDataLoaded ? (
            <div style={{ padding: '16px 14px' }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{
                    height: 14,
                    width: `${60 + i * 8}%`,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderRadius: 4,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                </div>
              ))}
              <style>{`
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.8; }
                }
              `}</style>
            </div>
          ) : (
            dashboardGroups.map((group) => (
              <CollapsibleGroup
                key={group.id}
                group={group}
                searchTerm={searchTerm}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onClose={onClose}
                router={router}
              />
            ))
          )}

          {/* Mensagem quando nenhum resultado */}
          {searchTerm && dashboardGroups.every(g => 
            g.dashboards.every(d => !d.label.toLowerCase().includes(searchTerm.toLowerCase()))
          ) && (
            <div style={{
              textAlign: 'center',
              padding: '20px 10px',
              color: '#6b7280',
              fontSize: '0.85rem',
            }}>
              Nenhum dashboard encontrado
            </div>
          )}
          
          {/* Espaçador para garantir que o último item fique visível */}
          <div style={{ height: '16px' }} />
        </nav>

        {/* Footer */}
        <div 
          style={{ 
            backgroundColor: '#1a1d21',
            borderTop: '1px solid #333',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          className="px-4"
        >
          <p style={{
            fontSize: '0.75rem',
            color: '#6c757d',
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '0.3px',
            opacity: 0.8
          }}>
            📊 Developed by Gestão de Dados - VIVA Eventos Brasil 2025
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
