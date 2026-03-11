/**
 * Página - Controle de Módulos
 * Layout sidebar + header (padrão Branches)
 * Click no card abre modal de edição com dropdowns
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RefreshCw, AlertTriangle, Settings } from 'lucide-react';
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
            Array.from(gruposMap.entries()).map(([grupo, mods]) => (
              <div key={grupo} style={{ marginBottom: 32 }}>
                {/* Grupo header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    paddingBottom: 8,
                    borderBottom: '1px solid #333',
                  }}
                >
                  <Settings size={16} color="#FF6600" />
                  <h3
                    style={{
                      color: '#F8F9FA',
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: '1rem',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {grupo}
                  </h3>
                  <span
                    style={{
                      color: '#6c757d',
                      fontSize: '0.75rem',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    ({mods.length})
                  </span>
                </div>

                {/* Cards grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {mods.map(mod => (
                    <ModuloCard
                      key={mod.moduloId}
                      modulo={mod}
                      onClick={() => setEditingModulo(mod)}
                    />
                  ))}
                </div>
              </div>
            ))
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

// ======= ModuloCard inline component =======
function ModuloCard({ modulo, onClick }: { modulo: ModuloConfig; onClick: () => void }) {
  const nivelColor = modulo.nvlAcesso === 0 ? '#10b981' : '#f59e0b';
  const nivelLabel = modulo.nvlAcesso === 0 ? 'Rede' : 'Franqueadora';
  const statusColor = modulo.ativo ? '#10b981' : '#ef4444';
  const hasUsers = modulo.usuariosPermitidos.length > 0;

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#2d3239',
        border: `1px solid ${modulo.ativo ? '#333' : '#ef444450'}`,
        borderRadius: 12,
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: modulo.ativo ? 1 : 0.6,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#FF6600';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,102,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = modulo.ativo ? '#333' : '#ef444450';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: nome + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h4
          style={{
            color: '#F8F9FA',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: '0.95rem',
            margin: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {modulo.moduloNome}
        </h4>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: statusColor,
            flexShrink: 0,
            marginLeft: 8,
          }}
          title={modulo.ativo ? 'Ativo' : 'Inativo'}
        />
      </div>

      {/* Path */}
      <p
        style={{
          color: '#6c757d',
          fontSize: '0.75rem',
          fontFamily: "'Fira Code', monospace",
          margin: '0 0 10px 0',
        }}
      >
        {modulo.moduloPath}
      </p>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* Nível de acesso */}
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
          }}
        >
          Nível {modulo.nvlAcesso} — {nivelLabel}
        </span>

        {/* Usuários */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.68rem',
            fontWeight: 500,
            fontFamily: 'Poppins, sans-serif',
            color: hasUsers ? '#3b82f6' : '#6c757d',
            backgroundColor: hasUsers ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {hasUsers ? `${modulo.usuariosPermitidos.length} usuários` : 'Todos'}
        </span>

        {/* Ordem */}
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            fontFamily: 'Poppins, sans-serif',
            color: '#6c757d',
            backgroundColor: 'rgba(107,114,128,0.1)',
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          #{modulo.ordem}
        </span>
      </div>
    </div>
  );
}
