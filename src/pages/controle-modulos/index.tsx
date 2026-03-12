/**
 * Página - Controle de Módulos
 * Layout sidebar + header (padrão Branches)
 * Click no card abre modal de edição com dropdowns
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RefreshCw, AlertTriangle, ChevronDown, ChevronRight, Edit2, Plus, Pencil, Settings, BarChart, PieChart, TrendingUp, Database, Folder, Link, ExternalLink, Target, DollarSign, Clipboard, GitBranch, CheckCircle, Users, LayoutDashboard, FileSpreadsheet, Code2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Header, Sidebar, EditModuloModal, AddExternalLinkModal, GerenciarGruposModal, EditGrupoModal } from '@/modules/controle-modulos/components';
import { useControleModulos } from '@/modules/controle-modulos/hooks';
import type { ModuloConfig } from '@/modules/controle-modulos/types';
import type { ExternalLinkData } from '@/modules/controle-modulos/components/AddExternalLinkModal';
import type { GrupoInfo } from '@/modules/controle-modulos/components/GerenciarGruposModal';

// Mapeamento de nomes de ícone para componentes Lucide
const ICON_MAP: Record<string, React.ElementType> = {
  settings: Settings,
  'bar-chart': BarChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  database: Database,
  folder: Folder,
  link: Link,
  'external-link': ExternalLink,
  target: Target,
  'dollar-sign': DollarSign,
  money: DollarSign,
  clipboard: Clipboard,
  'git-branch': GitBranch,
  'code': Code2,
  'check-circle': CheckCircle,
  users: Users,
  'layout-dashboard': LayoutDashboard,
  dashboard: LayoutDashboard,
  'file-spreadsheet': FileSpreadsheet,
  chart: BarChart,
  trophy: Target,
  wallet: DollarSign,
  funnel: TrendingUp,
};

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function ControleModulosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { modulos, loading, error, refetch, updateModulo, createModulo } = useControleModulos();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConfig | null>(null);
  const [addLinkOpen, setAddLinkOpen] = useState(false);
  const [gruposModalOpen, setGruposModalOpen] = useState(false);
  const [editGrupoNome, setEditGrupoNome] = useState<string | null>(null);
  const [gruposDaPlanilha, setGruposDaPlanilha] = useState<GrupoInfo[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Buscar grupos da planilha (com ícone)
  const fetchGruposCustomizados = useCallback(async () => {
    try {
      const res = await fetch('/api/controle-modulos/grupos?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setGruposDaPlanilha(data.grupos || []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchGruposCustomizados();
  }, [fetchGruposCustomizados]);

  // Derivar autorização diretamente dos dados já carregados (single source of truth)
  const isAuthorized = useMemo(() => {
    if (!user || modulos.length === 0) return null; // ainda carregando
    const cm = modulos.find(m => m.moduloId === 'controle-modulos');
    if (!cm || !cm.ativo) return false;
    if ((user.accessLevel ?? 0) < cm.nvlAcesso) return false;
    if (cm.usuariosPermitidos.length > 0 && !cm.usuariosPermitidos.includes(user.username)) return false;
    return true;
  }, [user, modulos]);

  // Redirecionar se não autenticado ou sem permissão
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && !loading && isAuthenticated && isAuthorized === false) {
      router.push('/');
    }
  }, [authLoading, loading, isAuthenticated, isAuthorized, router]);

  // Agrupar módulos por grupo
  const gruposMap = useMemo(() => {
    const map = new Map<string, ModuloConfig[]>();
    const sorted = [...modulos].sort((a, b) => a.ordem - b.ordem);
    sorted.forEach(m => {
      const g = m.grupo || 'Outros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    });
    return map;
  }, [modulos]);

  // Expandir todos os grupos quando carregar pela primeira vez
  useEffect(() => {
    if (gruposMap.size > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(gruposMap.keys()));
    }
  }, [gruposMap]);

  const toggleGroup = useCallback((grupo: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(grupo)) next.delete(grupo);
      else next.add(grupo);
      return next;
    });
  }, []);

  const handleSaveField = useCallback(async (moduloId: string, field: string, value: string) => {
    const ok = await updateModulo(moduloId, field, value);
    return ok;
  }, [updateModulo]);

  // Salvar grupo via EditGrupoModal (PUT na API + renomear módulos se necessário)
  const handleSaveGrupo = useCallback(async (
    grupoOriginal: string,
    updates: { nome?: string; icone?: string; ordem?: number; ativo?: boolean }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/controle-modulos/grupos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupo: grupoOriginal, ...updates }),
      });
      if (!res.ok) return false;

      // Se renomeou, atualizar grupo em todos os módulos
      if (updates.nome && updates.nome !== grupoOriginal) {
        const modsInGroup = gruposMap.get(grupoOriginal) || [];
        for (const mod of modsInGroup) {
          await updateModulo(mod.moduloId, 'grupo', updates.nome);
        }
        setExpandedGroups((prev) => {
          const next = new Set(prev);
          next.delete(grupoOriginal);
          next.add(updates.nome!);
          return next;
        });
      }

      // Atualizar dados locais
      await fetchGruposCustomizados();
      await refetch();
      return true;
    } catch {
      return false;
    }
  }, [gruposMap, updateModulo, fetchGruposCustomizados, refetch]);

  const handleCreateExternalLink = useCallback(async (data: ExternalLinkData) => {
    const ok = await createModulo(data);
    return ok;
  }, [createModulo]);

  // Lista de nomes de grupos existentes (módulos + planilha GRUPOS)
  const gruposExistentes = useMemo(() => {
    const nomesDaPlanilha = gruposDaPlanilha.map(g => g.nome);
    return Array.from(new Set([...modulos.map(m => m.grupo).filter(Boolean), ...nomesDaPlanilha]));
  }, [modulos, gruposDaPlanilha]);

  // Mapa de ícone por grupo (planilha é a fonte)
  const grupoIconeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of gruposDaPlanilha) {
      map.set(g.nome, g.icone);
    }
    return map;
  }, [gruposDaPlanilha]);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Loading (auth OU dados dos módulos OU autorização ainda não determinada)
  if (authLoading || loading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4" style={{ color: '#6c757d' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#212529' }}>
        <div className="text-center">
          <AlertTriangle size={48} color="#f59e0b" className="mx-auto mb-4" />
          <h2 style={{ color: '#F8F9FA', fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
            Acesso Restrito
          </h2>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Controle de Módulos - Central Viva</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
      />

      <div
        className="min-h-screen transition-all duration-300"
        style={{
          backgroundColor: '#212529',
          marginLeft: `${sidebarWidth}px`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Barra de ações */}
        <div
          className="px-4 mb-4 flex items-center justify-between"
          style={{ marginTop: '-8px' }}
        >
          <div>
            <span style={{ color: '#9ca3af', fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem' }}>
              {modulos.length} módulos configurados
            </span>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span style={{ color: '#dc3545', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'right' }}>
                {error}
              </span>
            )}
            <button
              onClick={() => setGruposModalOpen(true)}
              style={{
                backgroundColor: 'rgba(255,102,0,0.10)',
                border: '1px solid #FF6600',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#FF6600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
              title="Gerenciar grupos"
            >
              <Plus size={16} />
              Grupos
            </button>
            <button
              onClick={() => setAddLinkOpen(true)}
              style={{
                backgroundColor: 'rgba(139,92,246,0.15)',
                border: '1px solid #8b5cf6',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#8b5cf6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 600,
              }}
              title="Adicionar link externo"
            >
              <Plus size={16} />
              Link Externo
            </button>
            <button
              onClick={() => refetch(true)}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                padding: '6px 14px',
                color: '#ADB5BD',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontFamily: 'Poppins, sans-serif',
              }}
              title="Atualizar dados"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 pb-8">
          {loading && modulos.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4" style={{ color: '#6c757d', fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem' }}>
                  Carregando módulos...
                </p>
              </div>
            </div>
          ) : (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #333' }}>
              {/* Table header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 80px 120px 90px 140px 70px 50px',
                  gap: 0,
                  backgroundColor: '#1a1d21',
                  padding: '10px 16px',
                  borderBottom: '1px solid #333',
                }}
              >
                {['Módulo', 'Path', 'Tipo', 'Nível', 'Status', 'Usuários', 'Ordem', ''].map((col) => (
                  <span
                    key={col}
                    style={{
                      color: '#6c757d',
                      fontFamily: 'Poppins, sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>

              {/* Groups */}
              {Array.from(gruposMap.entries())
                .sort(([a], [b]) => {
                  const ordemA = gruposDaPlanilha.find(g => g.nome === a)?.ordem ?? 99;
                  const ordemB = gruposDaPlanilha.find(g => g.nome === b)?.ordem ?? 99;
                  return ordemA - ordemB;
                })
                .map(([grupo, mods]) => {
                const isExpanded = expandedGroups.has(grupo);
                const grupoInfo = gruposDaPlanilha.find(g => g.nome === grupo);
                const isInativo = grupoInfo && !grupoInfo.ativo;
                return (
                  <div key={grupo}>
                    {/* Group header row */}
                    <div
                      onClick={() => toggleGroup(grupo)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        backgroundColor: '#262a30',
                        borderBottom: '1px solid #333',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s',
                        opacity: isInativo ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d3239'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#262a30'; }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} color="#FF6600" />
                      ) : (
                        <ChevronRight size={16} color="#FF6600" />
                      )}
                      {(() => {
                        const IconComp = ICON_MAP[grupoIconeMap.get(grupo) || 'settings'] || Settings;
                        return <IconComp size={14} color="#FF6600" />;
                      })()}

                      <span
                        style={{
                          color: '#F8F9FA',
                          fontFamily: "'Poppins', sans-serif",
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {grupo}
                      </span>
                      <span
                        style={{
                          color: '#6c757d',
                          fontSize: '0.72rem',
                          fontFamily: 'Poppins, sans-serif',
                        }}
                      >
                        ({mods.length})
                      </span>

                      {grupoInfo && (
                        <span
                          style={{
                            color: '#FF6600',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            backgroundColor: 'rgba(255,102,0,0.1)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid rgba(255,102,0,0.2)',
                          }}
                          title="Posição na sidebar"
                        >
                          Sidebar #{grupoInfo.ordem}
                        </span>
                      )}

                      {isInativo && (
                        <span
                          style={{
                            color: '#ef4444',
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            fontFamily: 'Poppins, sans-serif',
                            backgroundColor: 'rgba(239,68,68,0.1)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            border: '1px solid rgba(239,68,68,0.3)',
                          }}
                        >
                          INATIVO
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditGrupoNome(grupo);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: 0.5,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}
                        title="Editar grupo"
                      >
                        <Pencil size={13} color="#FF6600" />
                      </button>
                    </div>

                    {/* Module rows */}
                    {isExpanded && mods.map((mod) => {
                      const nivelColor = mod.nvlAcesso === 0 ? '#10b981' : '#f59e0b';
                      const nivelLabel = mod.nvlAcesso === 0 ? 'Rede' : 'Franqueadora';
                      const hasUsers = mod.usuariosPermitidos.length > 0;

                      return (
                        <div
                          key={mod.moduloId}
                          onClick={() => setEditingModulo(mod)}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 2fr 80px 120px 90px 140px 70px 50px',
                            gap: 0,
                            padding: '10px 16px',
                            backgroundColor: '#212529',
                            borderBottom: '1px solid #2a2e33',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            opacity: mod.ativo ? 1 : 0.5,
                            alignItems: 'center',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d3239'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#212529'; }}
                        >
                          {/* Nome */}
                          <span
                            style={{
                              color: '#F8F9FA',
                              fontFamily: "'Poppins', sans-serif",
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {mod.moduloNome}
                          </span>

                          {/* Path */}
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.75rem',
                              fontFamily: "'Fira Code', monospace",
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {mod.moduloPath}
                          </span>

                          {/* Tipo */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              fontFamily: 'Poppins, sans-serif',
                              color: (mod as any).tipo === 'externo' ? '#8b5cf6' : '#6c757d',
                              backgroundColor: (mod as any).tipo === 'externo' ? 'rgba(139,92,246,0.1)' : 'rgba(107,114,128,0.1)',
                              padding: '2px 6px',
                              borderRadius: 6,
                              width: 'fit-content',
                            }}
                          >
                            {(mod as any).tipo === 'externo' ? '↗ Externo' : 'Interno'}
                          </span>

                          {/* Nível */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              fontFamily: 'Poppins, sans-serif',
                              color: nivelColor,
                              backgroundColor: `${nivelColor}15`,
                              padding: '2px 8px',
                              borderRadius: 6,
                              border: `1px solid ${nivelColor}30`,
                              width: 'fit-content',
                            }}
                          >
                            {mod.nvlAcesso} — {nivelLabel}
                          </span>

                          {/* Status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: mod.ativo ? '#10b981' : '#ef4444',
                              }}
                            />
                            <span
                              style={{
                                color: mod.ativo ? '#10b981' : '#ef4444',
                                fontSize: '0.72rem',
                                fontFamily: 'Poppins, sans-serif',
                                fontWeight: 500,
                              }}
                            >
                              {mod.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          {/* Usuários */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              fontFamily: 'Poppins, sans-serif',
                              color: hasUsers ? '#3b82f6' : '#6c757d',
                              backgroundColor: hasUsers ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              width: 'fit-content',
                            }}
                          >
                            {hasUsers ? `${mod.usuariosPermitidos.length} usuários` : 'Todos'}
                          </span>

                          {/* Ordem */}
                          <span
                            style={{
                              color: '#6c757d',
                              fontSize: '0.72rem',
                              fontFamily: 'Poppins, sans-serif',
                            }}
                          >
                            #{mod.ordem}
                          </span>

                          {/* Edit icon */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Edit2 size={14} color="#6c757d" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal de edição */}
      <EditModuloModal
        isOpen={!!editingModulo}
        onClose={() => setEditingModulo(null)}
        modulo={editingModulo}
        onSave={handleSaveField}
        gruposExistentes={gruposExistentes}
      />

      {/* Modal de novo link externo */}
      <AddExternalLinkModal
        isOpen={addLinkOpen}
        onClose={() => setAddLinkOpen(false)}
        onSave={handleCreateExternalLink}
        gruposExistentes={gruposExistentes}
      />

      {/* Modal de gerenciar grupos */}
      <GerenciarGruposModal
        isOpen={gruposModalOpen}
        onClose={() => setGruposModalOpen(false)}
        gruposEmUso={Array.from(new Set(modulos.map(m => m.grupo).filter(Boolean)))}
        onGruposChanged={fetchGruposCustomizados}
      />

      {/* Modal de editar grupo */}
      <EditGrupoModal
        isOpen={!!editGrupoNome}
        onClose={() => setEditGrupoNome(null)}
        grupoNome={editGrupoNome}
        gruposDaPlanilha={gruposDaPlanilha}
        onSave={handleSaveGrupo}
      />
    </>
  );
}
