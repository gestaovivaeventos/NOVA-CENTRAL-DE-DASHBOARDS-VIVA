'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Target,
  Headphones,
  Rocket,
  Flag,
  Star,
  TrendingUp,
  Gauge,
  DollarSign,
  Monitor,
  Package,
  Lightbulb,
  Megaphone,
  Users,
  LogOut,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
  selectedQuarter: string;
  onQuarterSelect: (quarter: string) => void;
  quarters: string[];
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
  Lightbulb,
  Megaphone,
  Users,
};

const teamIcons: Record<string, string> = {
  'ATENDIMENTO': 'Headphones',
  'CONSULTORIA': 'Rocket',
  'EXPANSÃO': 'Flag',
  'FEAT | GROWTH': 'Star',
  'FEAT': 'Star',
  'GESTÃO': 'TrendingUp',
  'POS VENDA': 'Gauge',
  'QUOKKA': 'DollarSign',
  'TI': 'Monitor',
  'FORNECEDORES': 'Package',
  'INOVAÇÃO': 'Lightbulb',
  'MARKETING': 'Megaphone',
  'GP': 'Users',
};

const SIDEBAR_WIDTH_EXPANDED = 300;
const SIDEBAR_WIDTH_COLLAPSED = 80;

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onCollapseChange,
  selectedTeam,
  onTeamSelect,
  selectedQuarter,
  onQuarterSelect,
  quarters,
  teams,
}) => {
  const isFeatTeam = selectedTeam === 'FEAT | GROWTH' || selectedTeam === 'FEAT';
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
        className="absolute w-8 h-8 flex items-center justify-center rounded-md bg-dark-secondary cursor-pointer transition-all duration-200 shadow-lg"
        style={{
          top: '24px',
          right: '-16px',
          zIndex: 60,
          border: `1px solid ${accentColor}`,
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${accentColor}20`}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
      >
        {isCollapsed ? (
          <ChevronRight size={18} style={{ color: accentColor }} />
        ) : (
          <ChevronLeft size={18} style={{ color: accentColor }} />
        )}
      </button>

      {/* Conteúdo da Sidebar */}
      <div 
        className={`${isCollapsed ? 'px-2 pt-16' : 'p-5 pt-16'} flex flex-col`}
        style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
      >
        {/* Page Indicator - OKRs (ativo) */}
        <nav className="flex flex-col gap-1.5 mb-3">
          <div
            className={`
              group flex items-center rounded-lg transition-all duration-200
              ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              height: isCollapsed ? '48px' : '42px',
              whiteSpace: 'nowrap',
              border: `1px solid ${accentColor}`,
              color: accentColor,
              backgroundColor: `${accentColor}15`,
            }}
          >
            <Target size={isCollapsed ? 22 : 20} strokeWidth={2.5} />
            {!isCollapsed && <span>OKRs</span>}
          </div>
        </nav>

        {/* Botão KPIs */}
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
          }}
          title={isCollapsed ? 'KPIs' : undefined}
        >
          <BarChart3 size={isCollapsed ? 22 : 20} strokeWidth={2} />
          {!isCollapsed && <span>KPIs</span>}
        </button>
        
        <hr className="border-dark-tertiary mb-4 mt-4" />

        {/* Quarter Selector */}
        <div className="flex flex-col gap-1.5 mb-4">
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
              Selecione o Quarter:
            </span>
          )}
          
          {isCollapsed ? (
            // Modo collapsed: mostrar apenas o quarter selecionado
            <button
              className="group flex items-center justify-center p-3 rounded-lg transition-all duration-200"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 600,
                height: '48px',
                backgroundColor: `${accentColor}15`,
                border: `1px solid ${accentColor}`,
                color: accentColor,
              }}
              title={`Quarter: ${selectedQuarter}`}
            >
              <Calendar size={22} strokeWidth={2.5} />
            </button>
          ) : (
            // Modo expanded: mostrar todos os quarters
            <div className="flex gap-2 flex-wrap">
              {quarters.map((quarter) => {
                const isActive = selectedQuarter === quarter;
                return (
                  <button
                    key={quarter}
                    onClick={() => onQuarterSelect(quarter)}
                    className={`
                      group flex items-center justify-center rounded-lg transition-all duration-200
                      ${isActive
                        ? ''
                        : 'text-gray-400 border border-gray-600/50 hover:bg-white/5'
                      }
                    `}
                    style={{
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 600 : 500,
                      padding: '8px 16px',
                      minWidth: '48px',
                      boxShadow: !isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                      ...(isActive && {
                        backgroundColor: `${accentColor}15`,
                        border: `1px solid ${accentColor}`,
                        color: accentColor,
                      }),
                    }}
                  >
                    {quarter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
