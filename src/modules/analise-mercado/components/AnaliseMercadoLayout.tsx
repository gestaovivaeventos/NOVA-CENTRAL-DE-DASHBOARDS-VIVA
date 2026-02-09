/**
 * AnaliseMercadoLayout - Layout wrapper para páginas do módulo Análise de Mercado
 * Padrão visual igual ao Fluxo Projetado
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Home, 
  LogOut,
  BarChart3,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Filter
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { NivelEnsino } from '@/modules/analise-mercado/types';

interface AnaliseMercadoLayoutProps {
  children: React.ReactNode;
  titulo?: string;
  nivelEnsino?: NivelEnsino;
  onNivelChange?: (nivel: NivelEnsino) => void;
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 60;

const FILTER_OPTIONS: { id: NivelEnsino; label: string; short: string; icon: typeof GraduationCap; color: string }[] = [
  { id: 'superior', label: 'Ensino Superior', short: 'SUP', icon: GraduationCap, color: '#3B82F6' },
  { id: 'medio', label: 'Ensino Médio', short: 'MED', icon: BookOpen, color: '#10B981' },
  { id: 'medicina', label: 'Medicina', short: 'MED', icon: Stethoscope, color: '#8B5CF6' },
];

export default function AnaliseMercadoLayout({ children, titulo = 'ANÁLISE DE MERCADO', nivelEnsino, onNivelChange }: AnaliseMercadoLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analise_mercado_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [dataAtual, setDataAtual] = useState<string>('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Persistir estado da sidebar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analise_mercado_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  // Data atual
  useEffect(() => {
    const hoje = new Date();
    setDataAtual(hoje.toLocaleDateString('pt-BR'));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Sidebar */}
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
                  Franqueadora
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
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-orange-500/20"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#1a1d21',
              border: '1px solid #FF6600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#FF6600',
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
          {/* Navegação */}
          {!isCollapsed && (
            <div className="space-y-2 mb-4">
              <button 
                onClick={() => router.push('/analise-mercado')}
                className="flex items-center gap-2 w-full px-3 py-2.5 bg-orange-500/20 border border-orange-500 text-orange-400 rounded-lg transition-all text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Visão Geral</span>
              </button>
            </div>
          )}

          {/* Ícones quando recolhido */}
          {isCollapsed && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => router.push('/analise-mercado')}
                className="p-2.5 rounded-lg transition-all bg-orange-500/30 text-orange-400"
                title="Visão Geral"
              >
                <BarChart3 size={20} />
              </button>
            </div>
          )}

          {/* Filtro por Nível de Ensino — expansível */}
          {nivelEnsino && onNivelChange && (() => {
            const current = FILTER_OPTIONS.find(f => f.id === nivelEnsino) || FILTER_OPTIONS[0];
            return isCollapsed ? (
              <div className="flex flex-col items-center gap-2" style={{ marginTop: 12 }}>
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="p-2.5 rounded-lg transition-all"
                  style={{ backgroundColor: `${current.color}25`, border: `1px solid ${current.color}`, color: current.color }}
                  title={`Filtro: ${current.label}`}
                >
                  <Filter size={18} />
                </button>
                {filterOpen && FILTER_OPTIONS.filter(f => f.id !== nivelEnsino).map(f => (
                  <button
                    key={f.id}
                    onClick={() => { onNivelChange(f.id); setFilterOpen(false); }}
                    className="p-2.5 rounded-lg transition-all"
                    style={{ backgroundColor: 'transparent', border: '1px solid #495057', color: '#6C757D' }}
                    title={f.label}
                  >
                    <f.icon size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                {/* Botão principal — mostra seleção atual */}
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                    backgroundColor: `${current.color}18`,
                    border: `1px solid ${current.color}`,
                    color: current.color,
                    fontFamily: "'Poppins', sans-serif", fontSize: '0.82rem', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  <current.icon size={16} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{current.label}</span>
                  <ChevronDown size={14} style={{ transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </button>

                {/* Opções expansíveis */}
                <div style={{
                  overflow: 'hidden',
                  maxHeight: filterOpen ? '200px' : '0px',
                  transition: 'max-height 0.25s ease',
                  marginTop: filterOpen ? 4 : 0,
                }}>
                  {FILTER_OPTIONS.filter(f => f.id !== nivelEnsino).map(f => (
                    <button
                      key={f.id}
                      onClick={() => { onNivelChange(f.id); setFilterOpen(false); }}
                      className="flex items-center gap-2 w-full rounded-lg transition-all text-sm"
                      style={{
                        padding: '8px 12px', marginTop: 2,
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        color: '#ADB5BD', fontWeight: 400,
                        fontFamily: "'Poppins', sans-serif",
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${f.color}15`; (e.currentTarget as HTMLButtonElement).style.color = f.color; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#ADB5BD'; }}
                    >
                      <f.icon size={15} />
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Espaçador flexível */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-gray-700/50 mb-4" />
            
            {/* Link para Central de Dashboards */}
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-orange-500/50 hover:bg-[#2a2e38] hover:text-white
                ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-3 py-2.5 w-full'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title="Central de Dashboards"
            >
              <Home size={18} strokeWidth={2} className="text-orange-400" />
              {!isCollapsed && <span>Central de Dashboards</span>}
            </a>

            {/* Botão de Logout */}
            <button
              onClick={handleLogout}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400
                ${isCollapsed ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-3 py-2.5 w-full mt-2'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={18} strokeWidth={2} />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main 
        className="min-h-screen transition-all duration-300 flex flex-col"
        style={{
          marginLeft: isCollapsed ? `${SIDEBAR_WIDTH_COLLAPSED}px` : `${SIDEBAR_WIDTH_EXPANDED}px`,
          width: isCollapsed ? `calc(100% - ${SIDEBAR_WIDTH_COLLAPSED}px)` : `calc(100% - ${SIDEBAR_WIDTH_EXPANDED}px)`,
        }}
      >
        {/* Header */}
        <header className="bg-dark-primary transition-all duration-300">
          <div className="px-5 py-4">
            <div 
              className="bg-dark-secondary p-5 rounded-lg flex justify-between items-center"
              style={{
                boxShadow: '0 4px 10px rgba(255,102,0,0.12)',
                borderBottom: '3px solid #FF6600',
              }}
            >
              <div className="flex items-center gap-6">
                {/* Logo */}
                <div className="relative w-44 h-14">
                  <Image 
                    src="/images/logo_viva.png" 
                    alt="Viva Eventos" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
                
                {/* Título */}
                <div className="border-l border-gray-600 pl-6 h-14 flex items-center">
                  <h1 
                    className="text-3xl font-bold uppercase tracking-wider"
                    style={{ 
                      fontFamily: "'Orbitron', 'Poppins', sans-serif",
                      background: 'linear-gradient(to bottom, #F8F9FA 0%, #ADB5BD 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    {titulo}
                  </h1>
                </div>
              </div>

              {/* Badge de validação */}
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                }}
              >
                <span style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 600 }}>
                  ⚠️ DADOS MOCKADOS
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <div className="px-5 pb-5 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
