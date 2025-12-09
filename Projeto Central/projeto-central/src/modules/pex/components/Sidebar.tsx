/**
 * Sidebar - Componente de filtros lateral recolhível
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Trophy, BarChart3, Settings, LayoutDashboard } from 'lucide-react';

interface SidebarProps {
  quarters: string[];
  unidades: string[];
  clusters: string[];
  consultores: string[];
  quarterSelecionado: string;
  unidadeSelecionada: string;
  clusterSelecionado: string;
  consultorSelecionado: string;
  onQuarterChange: (QUARTER: string) => void;
  onUnidadeChange: (unidade: string) => void;
  onClusterChange: (cluster: string) => void;
  onConsultorChange: (consultor: string) => void;
  onCollapseChange: (collapsed: boolean) => void;
  currentPage?: string;
  isFranchiser?: boolean;
}

export default function Sidebar({
  quarters,
  unidades,
  clusters,
  consultores,
  quarterSelecionado,
  unidadeSelecionada,
  clusterSelecionado,
  consultorSelecionado,
  onQuarterChange,
  onUnidadeChange,
  onClusterChange,
  onConsultorChange,
  onCollapseChange,
  currentPage = 'resultados',
  isFranchiser = false
}: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchUnidade, setSearchUnidade] = useState('');
  const [isUnidadeDropdownOpen, setIsUnidadeDropdownOpen] = useState(false);

  // Estilo para os option elements dos selects
  const selectOptionStyle = `
    select option {
      background-color: #2a2f36 !important;
      color: white !important;
      padding: 8px 12px !important;
    }
    select option:checked {
      background-color: #FF6600 !important;
      color: white !important;
    }
  `;

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange(newCollapsedState);
  };
  
  // Filtrar unidades baseado na pesquisa
  const unidadesFiltradas = unidades.filter(unidade =>
    unidade.toLowerCase().includes(searchUnidade.toLowerCase())
  );
  
  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.unidade-dropdown')) {
        setIsUnidadeDropdownOpen(false);
      }
    };
    
    if (isUnidadeDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUnidadeDropdownOpen]);

  return (
    <>
      <style>{selectOptionStyle}</style>
      <div
        style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: isCollapsed ? '0px' : '280px',
        backgroundColor: '#343A40',
        borderRight: isCollapsed ? 'none' : '2px solid #343A40',
        transition: 'width 0.3s ease',
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Botão de Toggle - Sempre visível */}
      <button
        onClick={toggleCollapse}
        title={isCollapsed ? "Mostrar Filtros" : "Esconder Filtros"}
        style={{
          position: 'fixed',
          left: isCollapsed ? '10px' : '270px',
          top: '80px',
          width: '40px',
          height: '40px',
          background: 'linear-gradient(to bottom, #FF7A33 0%, #FF6600 50%, #E55A00 100%)',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 101,
          transition: 'left 0.3s ease, transform 0.2s',
          boxShadow: '0 4px 12px rgba(255, 102, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 102, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 102, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          style={{ 
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <path 
            d="M9 18l6-6-6-6" 
            stroke="#000000" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Conteúdo da Sidebar */}
      {!isCollapsed && (
        <div style={{ padding: '20px', paddingTop: '70px', flex: 1 }}>
          {/* Botões de Navegação */}
          <nav style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Botão Dashboard */}
            <button
              onClick={() => router.push('/pex/dashboard')}
              className={`
                group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                ${currentPage === 'dashboard' 
                  ? 'bg-orange-500/10 border border-orange-500 text-orange-500' 
                  : 'text-gray-400 border border-transparent hover:bg-white/5'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: currentPage === 'dashboard' ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              <LayoutDashboard size={20} strokeWidth={currentPage === 'dashboard' ? 2.5 : 2} />
              <span>Dashboard</span>
            </button>

            {/* Botão Ranking */}
            <button
              onClick={() => router.push('/pex/ranking')}
              className={`
                group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                ${currentPage === 'ranking' 
                  ? 'bg-orange-500/10 border border-orange-500 text-orange-500' 
                  : 'text-gray-400 border border-transparent hover:bg-white/5'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: currentPage === 'ranking' ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              <Trophy size={20} strokeWidth={currentPage === 'ranking' ? 2.5 : 2} />
              <span>Ranking</span>
            </button>

            {/* Botão Resultados */}
            <button
              onClick={() => router.push('/pex/resultados')}
              className={`
                group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                ${currentPage === 'resultados' 
                  ? 'bg-orange-500/10 border border-orange-500 text-orange-500' 
                  : 'text-gray-400 border border-transparent hover:bg-white/5'}
              `}
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '0.95rem',
                fontWeight: currentPage === 'resultados' ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              <BarChart3 size={20} strokeWidth={currentPage === 'resultados' ? 2.5 : 2} />
              <span>Resultados</span>
            </button>

            {/* Botão Gerenciamento de Parâmetros */}
            {isFranchiser && (
              <button
                onClick={() => router.push('/pex/parametros')}
                className={`
                  group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                  ${currentPage === 'parametros' 
                    ? 'bg-orange-500/10 border border-orange-500 text-orange-500' 
                    : 'text-gray-400 border border-transparent hover:bg-white/5'}
                `}
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '0.95rem',
                  fontWeight: currentPage === 'parametros' ? 600 : 500,
                  cursor: 'pointer',
                  justifyContent: 'flex-start'
                }}
              >
                <Settings size={24} strokeWidth={currentPage === 'parametros' ? 2.5 : 2} style={{ flexShrink: 0 }} />
                <span style={{ textAlign: 'left' }}>Gerenciamento de Parâmetros</span>
              </button>
            )}
          </nav>

          {/* Título e Filtros - apenas na página de resultados */}
          {currentPage === 'resultados' && (
            <>
              <div style={{ 
                marginBottom: '30px',
                paddingBottom: '15px',
                borderBottom: '2px solid #555'
              }}>
              </div>

              {/* Filtro de Quarter */}
              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#aaa',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  📊 Quarter
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={quarterSelecionado || ''}
                    onChange={(e) => onQuarterChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(to bottom, #5a6573 0%, #4a5563 50%, #3a4553 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: 'Poppins, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      paddingRight: '40px'
                    } as React.CSSProperties}
                  >
                    {quarters.map((quarter) => (
                      <option key={quarter} value={quarter}>
                        {quarter === '1' ? '1º Quarter' : quarter === '2' ? '2º Quarter' : quarter === '3' ? '3º Quarter' : '4º Quarter'}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: 'white' }}>▼</span>
                </div>
              </div>

              {/* Filtro de Consultor */}
              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#aaa',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  👤 Consultor Responsável
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={consultorSelecionado || ''}
                    onChange={(e) => onConsultorChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(to bottom, #5a6573 0%, #4a5563 50%, #3a4553 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: 'Poppins, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      paddingRight: '40px'
                    } as React.CSSProperties}
                  >
                    <option value="">Todos os Consultores</option>
                    {consultores.map((consultor) => (
                      <option key={consultor} value={consultor}>
                        {consultor}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: 'white' }}>▼</span>
                </div>
              </div>

              {/* Filtro de Cluster */}
              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{
                    display: 'block',
                    color: '#aaa',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  🎯 Cluster
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={clusterSelecionado || ''}
                    onChange={(e) => onClusterChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(to bottom, #5a6573 0%, #4a5563 50%, #3a4553 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: 'Poppins, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      paddingRight: '40px'
                    } as React.CSSProperties}
                  >
                    <option value="">Todos os Clusters</option>
                    {clusters.map((cluster) => (
                      <option key={cluster} value={cluster}>
                        {cluster}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.7rem', color: 'white' }}>▼</span>
                </div>
              </div>

              {/* Filtro de Unidade */}
              <div style={{ marginBottom: '25px' }} className="unidade-dropdown">
                <label
                  style={{
                    display: 'block',
                    color: '#aaa',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                >
                  🏢 Unidades
                </label>
                
                {/* Dropdown customizado com pesquisa integrada */}
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setIsUnidadeDropdownOpen(!isUnidadeDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'linear-gradient(to bottom, #5a6573 0%, #4a5563 50%, #3a4553 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      fontFamily: 'Poppins, sans-serif',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <span>{unidadeSelecionada || 'Todas as Unidades'}</span>
                    <span style={{ fontSize: '0.7rem' }}>▼</span>
                  </div>
                  
                  {/* Menu dropdown */}
                  {isUnidadeDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        backgroundColor: '#2a2f36',
                        border: '2px solid #FF6600',
                        borderRadius: '8px',
                        zIndex: 1000,
                        maxHeight: '300px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      {/* Caixa de pesquisa dentro do dropdown */}
                      <div style={{ padding: '8px', borderBottom: '1px solid #3a3f46' }}>
                        <input
                          type="text"
                          placeholder="🔍 Pesquisar..."
                          value={searchUnidade}
                          onChange={(e) => setSearchUnidade(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            backgroundColor: '#1f2329',
                            color: 'white',
                            border: '1px solid #3a3f46',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontFamily: 'Poppins, sans-serif',
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      {/* Lista de opções */}
                      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        <div
                          onClick={() => {
                            onUnidadeChange('');
                            setIsUnidadeDropdownOpen(false);
                            setSearchUnidade('');
                          }}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontFamily: 'Poppins, sans-serif',
                            color: !unidadeSelecionada ? '#FF6600' : '#ccc',
                            fontWeight: !unidadeSelecionada ? 600 : 400,
                            backgroundColor: !unidadeSelecionada ? '#1f2329' : 'transparent',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1f2329';
                            e.currentTarget.style.color = '#FF6600';
                          }}
                          onMouseLeave={(e) => {
                            if (!unidadeSelecionada) {
                              e.currentTarget.style.backgroundColor = '#1f2329';
                              e.currentTarget.style.color = '#FF6600';
                            } else {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#ccc';
                            }
                          }}
                        >
                          Todas as Unidades
                        </div>
                        
                        {unidadesFiltradas.map((unidade) => (
                          <div
                            key={unidade}
                            onClick={() => {
                              onUnidadeChange(unidade);
                              setIsUnidadeDropdownOpen(false);
                              setSearchUnidade('');
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontFamily: 'Poppins, sans-serif',
                              color: unidadeSelecionada === unidade ? '#FF6600' : '#ccc',
                              fontWeight: unidadeSelecionada === unidade ? 600 : 400,
                              backgroundColor: unidadeSelecionada === unidade ? '#1f2329' : 'transparent',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#1f2329';
                              e.currentTarget.style.color = '#FF6600';
                            }}
                            onMouseLeave={(e) => {
                              if (unidadeSelecionada === unidade) {
                                e.currentTarget.style.backgroundColor = '#1f2329';
                                e.currentTarget.style.color = '#FF6600';
                              } else {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#ccc';
                              }
                            }}
                          >
                            {unidade}
                          </div>
                        ))}
                        
                        {searchUnidade && unidadesFiltradas.length === 0 && (
                          <div style={{
                            padding: '16px 12px',
                            textAlign: 'center',
                            color: '#aaa',
                            fontSize: '0.85rem',
                            fontStyle: 'italic'
                          }}>
                            Nenhuma unidade encontrada
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </>
  );
}
