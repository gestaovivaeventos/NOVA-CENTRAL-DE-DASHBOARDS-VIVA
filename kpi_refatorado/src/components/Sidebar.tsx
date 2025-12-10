'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Headphones,
  Rocket,
  Flag,
  Star,
  TrendingUp,
  Gauge,
  DollarSign,
  Monitor,
  Package,
  Megaphone,
  Users,
  LogOut,
  Target,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
  teams: string[];
}

const iconMap: Record<string, React.ElementType> = {
  Headphones,
  Rocket,
  Flag,
  Star,
  TrendingUp,
  Gauge,
  DollarSign,
  Monitor,
  Package,
  Megaphone,
  Users,
};

const teamIcons: Record<string, string> = {
  'ATENDIMENTO': 'Headphones',
  'CONSULTORIA PERFORMANCE': 'Rocket',
  'EXPANSÃO': 'Flag',
  'FEAT': 'Star',
  'GESTÃO': 'TrendingUp',
  'PÓS VENDA - CAF': 'Gauge',
  'CASH OUT | CONTROLADORIA': 'DollarSign',
  'FINANCEIRO (CSC)': 'DollarSign',
  'TI': 'Monitor',
  'SQUAD FORNECEDORES': 'Package',
  'MARKETING': 'Megaphone',
  'GESTÃO DE PESSOAS': 'Users',
  'MARKETING E GROWTH': 'Megaphone',
  'PERFORMANCE': 'TrendingUp',
};

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 80;

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onCollapseChange,
  selectedTeam,
  onTeamSelect,
  teams,
}) => {
  const isFeatTeam = selectedTeam === 'FEAT';
  const accentColor = isFeatTeam ? '#EA2B82' : '#FF6600';

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 bg-dark-secondary overflow-y-auto transition-all duration-300 z-50"
      style={{
        width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        borderRight: '2px solid #343A40',
        overflow: 'visible',
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => onCollapseChange(!isCollapsed)}
        className="absolute w-8 h-8 flex items-center justify-center rounded-md bg-dark-secondary border border-orange-500 hover:bg-orange-500/20 cursor-pointer transition-all duration-200 shadow-lg"
        style={{
          top: '24px',
          right: '-16px',
          zIndex: 60,
        }}
        title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
      >
        {isCollapsed ? (
          <ChevronRight size={18} className="text-orange-500" />
        ) : (
          <ChevronLeft size={18} className="text-orange-500" />
        )}
      </button>

      {/* Conteúdo da Sidebar */}
      <div 
        className={`${isCollapsed ? 'px-2 pt-16' : 'p-5 pt-16'} flex flex-col`}
        style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
      >
        {/* Botão OKR */}
        <button
          className={`
            flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
            ${isCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-4 py-2.5 w-full'}
          `}
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            height: isCollapsed ? '48px' : 'auto',
            marginBottom: '12px',
          }}
          title={isCollapsed ? 'OKRs' : undefined}
        >
          <Target size={isCollapsed ? 22 : 20} strokeWidth={2} />
          {!isCollapsed && <span>OKRs</span>}
        </button>
        
        <hr className="border-dark-tertiary mb-4" />

        {/* Page Indicator */}
        <nav className="flex flex-col gap-1.5 mb-6">
          <div
            className={`
              group flex items-center rounded-lg transition-all duration-200
              ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4'}
              bg-orange-500/10 border border-orange-500 text-orange-500
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              height: isCollapsed ? '48px' : '42px',
              whiteSpace: 'nowrap',
              borderColor: accentColor,
              color: accentColor,
              backgroundColor: `${accentColor}15`,
            }}
          >
            <BarChart3 size={isCollapsed ? 22 : 20} strokeWidth={2.5} />
            {!isCollapsed && <span>KPIs</span>}
          </div>
        </nav>

        <hr className="border-dark-tertiary mb-4" />

        {/* Teams Navigation */}
        <div className="flex flex-col gap-1.5 flex-1">
          {!isCollapsed && (
            <span
              style={{
                color: '#6c757d',
                fontSize: '0.7rem',
                fontFamily: 'Poppins, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Selecione um time:
            </span>
          )}
          {teams.map((team) => {
            const iconName = teamIcons[team] || 'Users';
            const IconComponent = iconMap[iconName] || Users;
            const isActive = selectedTeam === team;

            return (
              <button
                key={team}
                onClick={() => onTeamSelect(team)}
                className={`
                  group flex items-center rounded-lg transition-all duration-200
                  ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4'}
                  ${isActive
                    ? ''
                    : 'text-gray-400 border border-gray-600/50 hover:bg-white/5'
                  }
                `}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: !isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                  height: isCollapsed ? '48px' : '42px',
                  whiteSpace: 'nowrap',
                  ...(isActive && {
                    backgroundColor: `${accentColor}15`,
                    border: `1px solid ${accentColor}`,
                    color: accentColor,
                  }),
                }}
                title={isCollapsed ? team : undefined}
              >
                <IconComponent size={isCollapsed ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
                {!isCollapsed && <span className="truncate">{team}</span>}
              </button>
            );
          })}
        </div>

        {/* Espaçador flexível para empurrar os botões para baixo */}
        <div className="flex-grow" />

        {/* Área inferior: Central + Sair */}
        <div className={`${isCollapsed ? 'pb-4 pt-6' : 'pb-6 pt-6'}`}>
          <hr className="border-dark-tertiary mb-4 mt-4" />
          
          {/* Link para Central de Dashboards */}
          <a
            href="https://central-dashs-viva-html.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-white/5
              ${isCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-4 py-2.5 w-full'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              height: isCollapsed ? '48px' : 'auto',
            }}
            title="Central de Dashboards"
          >
            <Home size={isCollapsed ? 22 : 20} strokeWidth={2} />
            {!isCollapsed && <span>Central de Dashboards</span>}
          </a>

          {/* Botão de Logout */}
          <button
            onClick={() => {
              // TODO: Implementar função de logout
            }}
            className={`
              flex items-center rounded-lg transition-all duration-200 text-gray-400 border border-gray-600/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50
              ${isCollapsed ? 'justify-center p-3 w-full mt-2' : 'gap-3 px-4 py-2.5 w-full mt-2'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              height: isCollapsed ? '48px' : 'auto',
            }}
            title={isCollapsed ? 'Sair' : undefined}
          >
            <LogOut size={isCollapsed ? 22 : 20} strokeWidth={2} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
