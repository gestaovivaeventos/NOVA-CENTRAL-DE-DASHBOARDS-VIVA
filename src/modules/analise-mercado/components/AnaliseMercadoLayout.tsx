/**
 * AnaliseMercadoLayout — Layout principal com sidebar de franquias
 * Sidebar: lista de franquias para filtro territorial
 * Content: área principal com os dashboards
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Home,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Franquia, FiltrosAnaliseMercado, DadosInstituicao } from '../types';

interface AnaliseMercadoLayoutProps {
  children: React.ReactNode;
  titulo?: string;
  franquias: Franquia[];
  franquiaSelecionada: string | null;
  onFranquiaChange: (id: string | null) => void;
  filtros: FiltrosAnaliseMercado;
  onFiltrosChange: (filtros: Partial<FiltrosAnaliseMercado>) => void;
  anosDisponiveis: number[];
  areasDisponiveis: string[];
  cursosDisponiveis: string[];
  instituicoesDisponiveis: DadosInstituicao[];
  estadosDisponiveis: { uf: string; nome: string }[];
  municipiosDisponiveis: string[];
}

const SIDEBAR_WIDTH_EXPANDED = 280;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function AnaliseMercadoLayout({
  children,
  titulo = 'ANÁLISE DE MERCADO',
  franquias,
  franquiaSelecionada,
  onFranquiaChange,
  filtros,
  onFiltrosChange,
  anosDisponiveis,
  areasDisponiveis,
  cursosDisponiveis,
  instituicoesDisponiveis,
  estadosDisponiveis,
  municipiosDisponiveis,
}: AnaliseMercadoLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analise_mercado_sidebar_collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [dataAtual, setDataAtual] = useState('');
  const [buscaInstituicao, setBuscaInstituicao] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [buscaCurso, setBuscaCurso] = useState('');
  const [dropdownCursoAberto, setDropdownCursoAberto] = useState(false);
  const dropdownCursoRef = React.useRef<HTMLDivElement>(null);
  const [buscaMunicipio, setBuscaMunicipio] = useState('');
  const [dropdownMunicipioAberto, setDropdownMunicipioAberto] = useState(false);
  const dropdownMunicipioRef = React.useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
      if (dropdownCursoRef.current && !dropdownCursoRef.current.contains(e.target as Node)) {
        setDropdownCursoAberto(false);
      }
      if (dropdownMunicipioRef.current && !dropdownMunicipioRef.current.contains(e.target as Node)) {
        setDropdownMunicipioAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nome da instituição selecionada
  const nomeInstSelecionada = filtros.instituicaoId
    ? instituicoesDisponiveis.find(i => i.codIes === filtros.instituicaoId)?.nome ?? ''
    : '';

  // Filtrar lista de instituições pela busca (mostra todas se busca vazia)
  const instFiltradas = buscaInstituicao.length >= 2
    ? instituicoesDisponiveis.filter(i =>
        i.nome.toLowerCase().includes(buscaInstituicao.toLowerCase())
      ).slice(0, 50)
    : instituicoesDisponiveis.slice(0, 50);

  // Filtrar lista de cursos pela busca (mostra todos se busca vazia)
  const cursosFiltrados = buscaCurso.length >= 2
    ? cursosDisponiveis.filter(c =>
        c.toLowerCase().includes(buscaCurso.toLowerCase())
      ).slice(0, 50)
    : cursosDisponiveis.slice(0, 50);

  // Filtrar lista de municípios pela busca (mostra todos se busca vazia)
  const municipiosFiltrados = buscaMunicipio.length >= 2
    ? municipiosDisponiveis.filter(m =>
        m.toLowerCase().includes(buscaMunicipio.toLowerCase())
      ).slice(0, 50)
    : municipiosDisponiveis.slice(0, 50);

  // Nome do município selecionado
  const nomeMunicipioSelecionado = filtros.municipio ?? '';

  // Nome do curso selecionado
  const nomeCursoSelecionado = filtros.curso ?? '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('analise_mercado_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  useEffect(() => {
    setDataAtual(new Date().toLocaleDateString('pt-BR'));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* ━━━ Sidebar ━━━ */}
      <aside
        className="fixed left-0 top-0 bottom-0 overflow-y-auto transition-all duration-300 z-50"
        style={{
          width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          backgroundColor: '#1a1d21',
          borderRight: '1px solid #333',
        }}
      >
        {/* Header — Perfil */}
        <div style={{
          padding: isCollapsed ? '16px 10px' : '16px 20px',
          borderBottom: '1px solid #333',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            {!isCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  color: '#F8F9FA', fontSize: '0.95rem', fontWeight: 600,
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  marginBottom: 2, lineHeight: 1.2,
                }}>
                  {user?.firstName || user?.username || 'Usuário'}
                </h2>
                <p style={{ color: '#6c757d', fontSize: '0.7rem', marginBottom: 2 }}>Franqueadora</p>
                <p style={{ color: '#4a5568', fontSize: '0.6rem' }}>
                  Atualizado: {dataAtual || new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-orange-500/20"
            style={{
              width: 32, height: 32, borderRadius: 6,
              backgroundColor: '#1a1d21', border: '1px solid #FF6600',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#FF6600', transition: 'all 0.2s',
              flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Conteúdo Sidebar */}
        <div
          className={`${isCollapsed ? 'px-2 pt-4' : 'p-4 pt-4'} flex flex-col`}
          style={{ height: 'calc(100% - 90px)', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {/* ── Seção: Filtros de Dados ── */}
          {!isCollapsed ? (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Filtros (Ano, Instituição, Área) */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Filter size={14} color="#FF6600" />
                  <span style={{
                    color: '#FF6600', fontSize: '0.72rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    fontFamily: "'Poppins', sans-serif",
                  }}>
                    Filtros
                  </span>
                </div>

                {(() => {
                  const sidebarSelectStyle: React.CSSProperties = {
                    width: '100%',
                    backgroundColor: '#2D3238',
                    color: '#F8F9FA',
                    border: '1px solid #495057',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    fontFamily: "'Poppins', sans-serif",
                    cursor: 'pointer',
                    outline: 'none',
                  };
                  const sidebarLabelStyle: React.CSSProperties = {
                    color: '#6C757D',
                    fontSize: '0.62rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: 3,
                    display: 'block',
                  };
                  const disabledSelectStyle: React.CSSProperties = {
                    ...sidebarSelectStyle,
                    opacity: 0.4,
                    cursor: 'not-allowed',
                  };
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* 1. Ano */}
                      <div>
                        <label style={sidebarLabelStyle}>Ano</label>
                        <select
                          style={sidebarSelectStyle}
                          value={filtros.ano}
                          onChange={e => onFiltrosChange({ ano: Number(e.target.value) })}
                        >
                          {anosDisponiveis.map(a => (
                            <option key={a} value={a}>{a}</option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Rede (Pública × Privada) */}
                      <div>
                        <label style={sidebarLabelStyle}>Rede</label>
                        <select
                          style={sidebarSelectStyle}
                          value={filtros.tipoInstituicao}
                          onChange={e => onFiltrosChange({ tipoInstituicao: e.target.value as 'todos' | 'publica' | 'privada' })}
                        >
                          <option value="todos">Todas</option>
                          <option value="publica">Pública</option>
                          <option value="privada">Privada</option>
                        </select>
                      </div>

                      {/* 3. Estado (UF) */}
                      <div>
                        <label style={sidebarLabelStyle}>Estado (UF)</label>
                        <select
                          style={sidebarSelectStyle}
                          value={filtros.estado ?? ''}
                          onChange={e => onFiltrosChange({ estado: e.target.value || null })}
                        >
                          <option value="">Todos</option>
                          {estadosDisponiveis.map(e => (
                            <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Município (busca + dropdown) */}
                      <div>
                        <label style={sidebarLabelStyle}>Município</label>
                        <div ref={dropdownMunicipioRef} style={{ position: 'relative' }}>
                          {filtros.municipio ? (
                            <div style={{
                              ...sidebarSelectStyle,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 6, cursor: 'default',
                            }}>
                              <span style={{
                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                fontSize: '0.7rem',
                              }} title={nomeMunicipioSelecionado}>
                                {nomeMunicipioSelecionado}
                              </span>
                              <button
                                onClick={() => {
                                  onFiltrosChange({ municipio: null });
                                  setBuscaMunicipio('');
                                }}
                                style={{
                                  background: 'none', border: 'none', color: '#FF6600',
                                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0,
                                }}
                                title="Limpar filtro"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder={filtros.estado ? 'Buscar município...' : 'Selecione um estado'}
                              value={buscaMunicipio}
                              onChange={e => {
                                setBuscaMunicipio(e.target.value);
                                setDropdownMunicipioAberto(true);
                              }}
                              onFocus={() => { if (filtros.estado) setDropdownMunicipioAberto(true); }}
                              disabled={!filtros.estado}
                              style={{
                                ...(filtros.estado ? sidebarSelectStyle : disabledSelectStyle),
                                cursor: filtros.estado ? 'text' : 'not-allowed',
                              }}
                            />
                          )}
                          {dropdownMunicipioAberto && municipiosFiltrados.length > 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', maxHeight: 200, overflowY: 'auto',
                              zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            }}>
                              {municipiosFiltrados.map(m => (
                                <button
                                  key={m}
                                  onClick={() => {
                                    onFiltrosChange({ municipio: m });
                                    setBuscaMunicipio('');
                                    setDropdownMunicipioAberto(false);
                                  }}
                                  style={{
                                    width: '100%', textAlign: 'left', padding: '6px 10px',
                                    backgroundColor: 'transparent', border: 'none',
                                    color: '#F8F9FA', fontSize: '0.7rem', cursor: 'pointer',
                                    borderBottom: '1px solid #3a3f47',
                                    fontFamily: "'Poppins', sans-serif",
                                  }}
                                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)'; }}
                                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          )}
                          {dropdownMunicipioAberto && buscaMunicipio.length >= 2 && municipiosFiltrados.length === 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', padding: '8px 10px',
                              zIndex: 100, color: '#6C757D', fontSize: '0.7rem',
                              fontFamily: "'Poppins', sans-serif",
                            }}>
                              Nenhum município encontrado
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 5. Instituição (busca) */}
                      <div>
                        <label style={sidebarLabelStyle}>Instituição</label>
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                          {filtros.instituicaoId ? (
                            <div style={{
                              ...sidebarSelectStyle,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 6, cursor: 'default',
                            }}>
                              <span style={{
                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                fontSize: '0.7rem',
                              }} title={nomeInstSelecionada}>
                                {nomeInstSelecionada}
                              </span>
                              <button
                                onClick={() => {
                                  onFiltrosChange({ instituicaoId: null });
                                  setBuscaInstituicao('');
                                }}
                                style={{
                                  background: 'none', border: 'none', color: '#FF6600',
                                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0,
                                }}
                                title="Limpar filtro"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Buscar instituição..."
                              value={buscaInstituicao}
                              onChange={e => {
                                setBuscaInstituicao(e.target.value);
                                setDropdownAberto(true);
                              }}
                              onFocus={() => setDropdownAberto(true)}
                              style={{
                                ...sidebarSelectStyle,
                                cursor: 'text',
                              }}
                            />
                          )}
                          {dropdownAberto && instFiltradas.length > 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', maxHeight: 200, overflowY: 'auto',
                              zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            }}>
                              {instFiltradas.map(inst => (
                                <button
                                  key={inst.codIes}
                                  onClick={() => {
                                    onFiltrosChange({ instituicaoId: inst.codIes });
                                    setBuscaInstituicao('');
                                    setDropdownAberto(false);
                                  }}
                                  style={{
                                    width: '100%', textAlign: 'left', padding: '6px 10px',
                                    backgroundColor: 'transparent', border: 'none',
                                    color: '#F8F9FA', fontSize: '0.7rem', cursor: 'pointer',
                                    borderBottom: '1px solid #3a3f47',
                                    fontFamily: "'Poppins', sans-serif",
                                  }}
                                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)'; }}
                                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                                >
                                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {inst.nome}
                                  </span>
                                  <span style={{ color: '#6C757D', fontSize: '0.6rem' }}>
                                    {inst.uf} · {inst.tipo === 'publica' ? 'Pública' : 'Privada'} · {inst.matriculas.toLocaleString('pt-BR')} matr.
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {dropdownAberto && buscaInstituicao.length >= 2 && instFiltradas.length === 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', padding: '8px 10px',
                              zIndex: 100, color: '#6C757D', fontSize: '0.7rem',
                              fontFamily: "'Poppins', sans-serif",
                            }}>
                              Nenhuma instituição encontrada
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 6. Curso (busca) */}
                      <div>
                        <label style={sidebarLabelStyle}>Curso</label>
                        <div ref={dropdownCursoRef} style={{ position: 'relative' }}>
                          {filtros.curso ? (
                            <div style={{
                              ...sidebarSelectStyle,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: 6, cursor: 'default',
                            }}>
                              <span style={{
                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                fontSize: '0.7rem',
                              }} title={nomeCursoSelecionado}>
                                {nomeCursoSelecionado}
                              </span>
                              <button
                                onClick={() => {
                                  onFiltrosChange({ curso: null });
                                  setBuscaCurso('');
                                }}
                                style={{
                                  background: 'none', border: 'none', color: '#FF6600',
                                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0,
                                }}
                                title="Limpar filtro"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <input
                              type="text"
                              placeholder="Buscar curso..."
                              value={buscaCurso}
                              onChange={e => {
                                setBuscaCurso(e.target.value);
                                setDropdownCursoAberto(true);
                              }}
                              onFocus={() => setDropdownCursoAberto(true)}
                              style={{
                                ...sidebarSelectStyle,
                                cursor: 'text',
                              }}
                            />
                          )}
                          {dropdownCursoAberto && cursosFiltrados.length > 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', maxHeight: 200, overflowY: 'auto',
                              zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            }}>
                              {cursosFiltrados.map(curso => (
                                <button
                                  key={curso}
                                  onClick={() => {
                                    onFiltrosChange({ curso });
                                    setBuscaCurso('');
                                    setDropdownCursoAberto(false);
                                  }}
                                  style={{
                                    width: '100%', textAlign: 'left', padding: '6px 10px',
                                    backgroundColor: 'transparent', border: 'none',
                                    color: '#F8F9FA', fontSize: '0.7rem', cursor: 'pointer',
                                    borderBottom: '1px solid #3a3f47',
                                    fontFamily: "'Poppins', sans-serif",
                                  }}
                                  onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = 'rgba(255,102,0,0.15)'; }}
                                  onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = 'transparent'; }}
                                >
                                  <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {curso}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                          {dropdownCursoAberto && buscaCurso.length >= 2 && cursosFiltrados.length === 0 && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, right: 0,
                              backgroundColor: '#2D3238', border: '1px solid #495057',
                              borderRadius: '0 0 6px 6px', padding: '8px 10px',
                              zIndex: 100, color: '#6C757D', fontSize: '0.7rem',
                              fontFamily: "'Poppins', sans-serif",
                            }}>
                              Nenhum curso encontrado
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Limpar todos os filtros */}
                      {(filtros.tipoInstituicao !== 'todos' || filtros.estado || filtros.municipio || filtros.instituicaoId || filtros.curso) && (
                        <button
                          onClick={() => {
                            onFiltrosChange({
                              tipoInstituicao: 'todos',
                              estado: null,
                              municipio: null,
                              instituicaoId: null,
                              curso: null,
                            });
                            setBuscaInstituicao('');
                            setBuscaMunicipio('');
                            setBuscaCurso('');
                          }}
                          style={{
                            width: '100%', padding: '6px 10px',
                            backgroundColor: 'rgba(255,102,0,0.1)',
                            border: '1px solid rgba(255,102,0,0.3)',
                            borderRadius: 6, color: '#FF6600',
                            fontSize: '0.7rem', fontWeight: 600,
                            fontFamily: "'Poppins', sans-serif",
                            cursor: 'pointer', textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          ) : (
            /* Ícones quando recolhido */
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => { setIsCollapsed(false); }}
                className="p-2.5 rounded-lg transition-all"
                style={{
                  backgroundColor: 'rgba(255,102,0,0.2)',
                  color: '#FF6600',
                }}
                title="Filtros"
              >
                <Filter size={20} />
              </button>
            </div>
          )}

          {/* Espaçador */}
          <div className="flex-grow" />

          {/* Área inferior: Central + Sair */}
          <div className={`${isCollapsed ? 'pb-4' : 'pb-6'}`}>
            <hr className="border-gray-700/50 mb-4" />
            <a
              href="/"
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-orange-500/50 hover:bg-[#2a2e38] hover:text-white
                ${isCollapsed ? 'justify-center p-2.5 w-full' : 'gap-3 px-3 py-2.5 w-full'}
              `}
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', fontWeight: 500 }}
              title="Central de Dashboards"
            >
              <Home size={18} strokeWidth={2} className="text-orange-400" />
              {!isCollapsed && <span>Central de Dashboards</span>}
            </a>

            <button
              onClick={handleLogout}
              className={`
                flex items-center rounded-lg transition-all duration-200 text-gray-300 bg-[#252830] border border-gray-700 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400
                ${isCollapsed ? 'justify-center p-2.5 w-full mt-2' : 'gap-3 px-3 py-2.5 w-full mt-2'}
              `}
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.875rem', fontWeight: 500 }}
              title={isCollapsed ? 'Sair' : undefined}
            >
              <LogOut size={18} strokeWidth={2} />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ━━━ Conteúdo Principal ━━━ */}
      <main
        className="min-h-screen transition-all duration-300 flex flex-col"
        style={{
          marginLeft: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
          width: isCollapsed
            ? `calc(100% - ${SIDEBAR_WIDTH_COLLAPSED}px)`
            : `calc(100% - ${SIDEBAR_WIDTH_EXPANDED}px)`,
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
                <div className="relative w-44 h-14">
                  <Image
                    src="/images/logo_viva.png"
                    alt="Viva Eventos"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
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

              {/* Badge */}
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>
                  📊 DADOS INEP
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
