import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Home,
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
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  selectedTeam: string;
  onTeamSelect: (team: string) => void;
  selectedQuarter: string;
  onQuarterSelect: (quarter: string) => void;
  selectedYear: string;
  onYearSelect: (year: string) => void;
  quarters: string[];
  teams: string[];
  years: string[];
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
const SIDEBAR_WIDTH_COLLAPSED = 60;

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onCollapseChange,
  selectedTeam,
  onTeamSelect,
  selectedQuarter,
  onQuarterSelect,
  selectedYear,
  onYearSelect,
  quarters,
  teams,
  years,
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isFeatTeam = selectedTeam === 'FEAT | GROWTH' || selectedTeam === 'FEAT';
  const accentColor = isFeatTeam ? '#EA2B82' : '#FF6600';
  
  // Gerar data apenas no cliente para evitar erro de hidratação
  const [dataAtual, setDataAtual] = useState<string>('');
  
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(`${hoje.toLocaleDateString('pt-BR')}, ${hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
      style={{
        width: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
        backgroundColor: '#1a1d21',
        borderRight: '1px solid #333',
      }}
    >
      {/* Header com Perfil do Usuário */}
      <div
        style={{
          padding: isCollapsed ? '16px 10px' : '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          {/* Info do Usuário */}
          {!isCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  color: '#F8F9FA',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '2px',
                  lineHeight: '1.2',
                }}
              >
                {user?.firstName || user?.username || 'Usuário'}
              </h2>
              <p
                style={{
                  color: '#6c757d',
                  fontSize: '0.7rem',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '1.2',
                }}
              >
                {user?.unitNames?.[0] || 'Franquia'}
              </p>
              <p
                style={{
                  color: '#4a5568',
                  fontSize: '0.6rem',
                }}
              >
                Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Botão Toggle */}
        <button
          onClick={() => onCollapseChange(!isCollapsed)}
          className="hover:bg-orange-500/20"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: '#1a1d21',
            border: `1px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: accentColor,
            transition: 'all 0.2s',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Conteúdo da Sidebar */}
      <div
        className={`${isCollapsed ? 'px-2 pt-4' : 'p-5 pt-4'} flex flex-col`}
        style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
      >
        {/* Year Selector */}
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
              Selecione o Ano:
            </span>
          )}

          {isCollapsed ? (
            // Modo collapsed: mostrar apenas o ano selecionado
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
              title={`Ano: ${selectedYear}`}
            >
              <Calendar size={22} strokeWidth={2.5} />
            </button>
          ) : (
            // Modo expanded: mostrar todos os anos
            <div className="flex gap-2 flex-wrap">
              {years.map((year) => {
                const isActive = selectedYear === year;
                return (
                  <button
                    key={year}
                    onClick={() => onYearSelect(year)}
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
                      minWidth: '60px',
                      boxShadow: !isActive ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none',
                      ...(isActive && {
                        backgroundColor: `${accentColor}15`,
                        border: `1px solid ${accentColor}`,
                        color: accentColor,
                      }),
                    }}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <hr className="border-dark-tertiary mb-4" />

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
          <Link
            href="/"
            className={`
              flex items-center rounded-lg transition-all duration-200 hover:bg-white/5
              ${isCollapsed ? 'justify-center p-3 w-full' : 'gap-3 px-4 py-2.5 w-full'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#9ca3af',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              height: isCollapsed ? '48px' : 'auto',
              textDecoration: 'none',
            }}
            title="Central de Dashboards"
          >
            <Home size={isCollapsed ? 22 : 20} strokeWidth={2} />
            {!isCollapsed && <span>Central de Dashboards</span>}
          </Link>

          {/* Botão de Logout */}
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className={`
              flex items-center rounded-lg transition-all duration-200 hover:bg-red-500/10
              ${isCollapsed ? 'justify-center p-3 w-full mt-2' : 'gap-3 px-4 py-2.5 w-full mt-2'}
            `}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 500,
              color: '#9ca3af',
              border: '1px solid rgba(75, 85, 99, 0.5)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              height: isCollapsed ? '48px' : 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f87171';
              e.currentTarget.style.borderColor = 'rgba(248, 113, 113, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.5)';
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
