/**
 * Página - Controle de Módulos
 * Layout sidebar + header (padrão Branches)
 * Click no card abre modal de edição com dropdowns
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RefreshCw, AlertTriangle, Settings, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Header, Sidebar, EditModuloModal } from '@/modules/controle-modulos/components';
import { useControleModulos } from '@/modules/controle-modulos/hooks';
import type { ModuloConfig } from '@/modules/controle-modulos/types';

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function ControleModulosPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { modulos, loading, error, refetch, updateModulo } = useControleModulos();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingModulo, setEditingModulo] = useState<ModuloConfig | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
              {Array.from(gruposMap.entries()).map(([grupo, mods]) => {
                const isExpanded = expandedGroups.has(grupo);
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
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d3239'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#262a30'; }}
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} color="#FF6600" />
                      ) : (
                        <ChevronRight size={16} color="#FF6600" />
                      )}
                      <Settings size={14} color="#FF6600" />
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
      />
    </>
  );
}
