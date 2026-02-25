/**
 * Página Principal - Gerenciamento de Branches
 * Página única com Sidebar + seção Releases + seção Ramificações
 * Filtro por usuário via sidebar
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Plus, RefreshCw, AlertTriangle, GitMerge, GitBranch } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  BranchesHeader,
  KanbanBoard,
  ReleaseCard,
  BranchCard,
  BranchesSidebar,
  CreateReleaseModal,
  CreateBranchModal,
  EditCardModal,
} from '@/modules/branches/components';
import type { Release, Branch } from '@/modules/branches/types';
import { useBranchesData } from '@/modules/branches/hooks/useBranchesData';
import { useBranchActions } from '@/modules/branches/hooks/useBranchActions';
import {
  AUTHORIZED_USERNAMES,
  KANBAN_COLUMNS_RELEASE,
  KANBAN_COLUMNS_BRANCH,
} from '@/modules/branches/types';
import type { KanbanStatus } from '@/modules/branches/types';
import { getProximaVersao, gerarNomeRelease, getDataAtual } from '@/modules/branches/utils';

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 60;

export default function BranchesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { releases, branches, loading, error, refetch } = useBranchesData();
  const {
    creating,
    updating,
    actionError,
    createRelease,
    createBranch,
    updateStatus,
    updateStatusWithTracking,
    updateLink,
    updateDescricao,
    updateModulo,
    saveAllFields,
    initHeaders,
  } = useBranchActions();

  const [showCreateRelease, setShowCreateRelease] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
  const [selectedReleaseVersao, setSelectedReleaseVersao] = useState<number>(1);
  const [initialized, setInitialized] = useState(false);

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterUsers, setFilterUsers] = useState<string[]>([]);

  // Modal de edição
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Verificar autorização
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return AUTHORIZED_USERNAMES.includes(user.username);
  }, [user]);

  // Inicializar headers na primeira vez
  useEffect(() => {
    if (isAuthorized && !initialized) {
      initHeaders().then(() => setInitialized(true));
    }
  }, [isAuthorized, initialized, initHeaders]);

  // Redirecionar se não autorizado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!authLoading && isAuthenticated && !isAuthorized) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAuthorized, router]);

  // Filtrar releases e branches por usuário
  const filteredReleases = useMemo(() => {
    if (filterUsers.length === 0) return releases;
    return releases.filter(r => filterUsers.includes(r.criadoPor));
  }, [releases, filterUsers]);

  const filteredBranches = useMemo(() => {
    if (filterUsers.length === 0) return branches;
    return branches.filter(b => filterUsers.includes(b.criadoPor));
  }, [branches, filterUsers]);

  // Handler para criar release
  const handleCreateRelease = useCallback(async () => {
    if (!user) return;
    const result = await createRelease(
      user.username,
      user.firstName || user.username,
      releases
    );
    if (result) {
      setShowCreateRelease(false);
      await refetch();
    }
  }, [user, releases, createRelease, refetch]);

  // Handler para abrir modal de branch
  const handleOpenBranchModal = useCallback((releaseId: string, releaseVersao: number) => {
    setSelectedReleaseId(releaseId);
    setSelectedReleaseVersao(releaseVersao);
    setShowCreateBranch(true);
  }, []);

  // Handler para criar branch
  const handleCreateBranch = useCallback(async (modulo: string, descricao: string) => {
    if (!user) return;
    const result = await createBranch(
      user.username,
      user.firstName || user.username,
      selectedReleaseId,
      selectedReleaseVersao,
      modulo,
      descricao
    );
    if (result) {
      setShowCreateBranch(false);
      await refetch();
    }
  }, [user, selectedReleaseId, selectedReleaseVersao, createBranch, refetch]);

  // Handler para status com refetch (com rastreamento de aprovação e entrega)
  const handleUpdateStatus = useCallback(async (id: string, status: KanbanStatus) => {
    let ok: boolean;
    if ((status === 'aprovada' || status === 'concluida') && user) {
      ok = await updateStatusWithTracking(id, status, {
        aprovadoPor: user.username,
        aprovadoPorNome: user.firstName || user.username,
      });
    } else {
      ok = await updateStatus(id, status);
    }
    if (ok) await refetch();
    return ok;
  }, [updateStatus, updateStatusWithTracking, refetch, user]);

  // Handler para salvar todos os campos de uma vez (modal de edição)
  const handleSaveAll = useCallback(async (payload: {
    id: string;
    status?: KanbanStatus;
    link?: string;
    descricao?: string;
    modulo?: string;
  }) => {
    const ok = await saveAllFields({
      ...payload,
      approvalInfo: user ? {
        aprovadoPor: user.username,
        aprovadoPorNome: user.firstName || user.username,
      } : undefined,
    });
    if (ok) await refetch();
    return ok;
  }, [saveAllFields, refetch, user]);

  // Handler para link com refetch
  const handleUpdateLink = useCallback(async (id: string, link: string) => {
    const ok = await updateLink(id, link);
    if (ok) await refetch();
    return ok;
  }, [updateLink, refetch]);

  // Handler para descrição com refetch
  const handleUpdateDescricao = useCallback(async (id: string, desc: string) => {
    const ok = await updateDescricao(id, desc);
    if (ok) await refetch();
    return ok;
  }, [updateDescricao, refetch]);

  // Handler para módulo com refetch
  const handleUpdateModulo = useCallback(async (id: string, modulo: string) => {
    const ok = await updateModulo(id, modulo);
    if (ok) await refetch();
    return ok;
  }, [updateModulo, refetch]);

  // Contagens para releases (5 colunas)
  const releaseCounts = useMemo(() => {
    const counts: Record<KanbanStatus, number> = {
      'em-desenvolvimento': 0,
      'em-revisao': 0,
      'aprovada': 0,
      'concluida': 0,
      'descartada': 0,
    };
    filteredReleases.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    return counts;
  }, [filteredReleases]);

  // Contagens para branches (5 colunas)
  const branchCounts = useMemo(() => {
    const counts: Record<KanbanStatus, number> = {
      'em-desenvolvimento': 0,
      'em-revisao': 0,
      'aprovada': 0,
      'concluida': 0,
      'descartada': 0,
    };
    filteredBranches.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return counts;
  }, [filteredBranches]);

  // Dados para o modal de criação
  const nextVersion = getProximaVersao(releases);
  const releasePreviewName = user
    ? gerarNomeRelease(nextVersion, user.username, getDataAtual())
    : '';

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Loading & Auth
  if (authLoading) {
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
        <title>Branches - Central Viva</title>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Poppins:wght@300;400;500;600;700&family=Fira+Code:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Sidebar */}
      <BranchesSidebar
        isCollapsed={sidebarCollapsed}
        onCollapseChange={setSidebarCollapsed}
        filterUsers={filterUsers}
        onFilterUsersChange={setFilterUsers}
      />

      <div
        className="min-h-screen transition-all duration-300"
        style={{
          backgroundColor: '#212529',
          marginLeft: `${sidebarWidth}px`,
        }}
      >
        {/* Header */}
        <BranchesHeader />

        {/* Barra de ações */}
        <div
          className="px-4 mb-4 flex items-center justify-end"
          style={{ marginTop: '-8px' }}
        >
          <div className="flex items-center gap-3">
            {/* Filtro ativo indicator */}
            {filterUsers.length > 0 && (
              <span style={{
                color: '#FF6600',
                fontSize: '0.75rem',
                fontWeight: 500,
                backgroundColor: 'rgba(255,102,0,0.1)',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255,102,0,0.3)',
              }}>
                Filtro: {filterUsers.length} usuário{filterUsers.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Erro se houver */}
            {(error || actionError) && (
              <span style={{ color: '#dc3545', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'right' }}>
                {error || actionError}
              </span>
            )}

            {/* Refresh */}
            <button
              onClick={() => refetch()}
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
          {/* Loading */}
          {loading && releases.length === 0 && branches.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-3" style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                  Carregando dados...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* ========== SEÇÃO RELEASES ========== */}
              <section style={{ marginBottom: '40px' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title section-title-gradient" style={{ marginBottom: 0 }}>
                    <GitMerge size={20} style={{ color: '#FF6600', flexShrink: 0 }} />
                    RELEASES
                  </h2>

                  <button
                    onClick={() => setShowCreateRelease(true)}
                    style={{
                      backgroundColor: '#FF6600',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      fontFamily: 'Poppins, sans-serif',
                      boxShadow: '0 2px 8px rgba(255,102,0,0.3)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Plus size={18} />
                    Nova Release
                  </button>
                </div>

                <KanbanBoard columns={KANBAN_COLUMNS_RELEASE} counts={releaseCounts} onDrop={(id, newStatus) => handleUpdateStatus(id, newStatus)}>
                  {(status: KanbanStatus) =>
                    filteredReleases
                      .filter(r => r.status === status)
                      .map(release => (
                        <ReleaseCard
                          key={release.id}
                          release={release}
                          branches={branches}
                          columns={KANBAN_COLUMNS_RELEASE}
                          onClick={() => setEditingRelease(release)}
                          onCreateBranch={handleOpenBranchModal}
                          updating={updating}
                        />
                      ))
                  }
                </KanbanBoard>
              </section>

              {/* Separador */}
              <div
                style={{
                  height: '1px',
                  backgroundColor: '#333',
                  marginBottom: '32px',
                }}
              />

              {/* ========== SEÇÃO RAMIFICAÇÕES ========== */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title section-title-gradient" style={{ marginBottom: 0 }}>
                    <GitBranch size={20} style={{ color: '#FF6600', flexShrink: 0 }} />
                    RAMIFICAÇÕES
                  </h2>
                </div>

                <KanbanBoard columns={KANBAN_COLUMNS_BRANCH} counts={branchCounts} onDrop={(id, newStatus) => handleUpdateStatus(id, newStatus)}>
                  {(status: KanbanStatus) =>
                    filteredBranches
                      .filter(b => b.status === status)
                      .map(branch => (
                        <BranchCard
                          key={branch.id}
                          branch={branch}
                          columns={KANBAN_COLUMNS_BRANCH}
                          onClick={() => setEditingBranch(branch)}
                          updating={updating}
                        />
                      ))
                  }
                </KanbanBoard>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Modais */}
      <CreateReleaseModal
        isOpen={showCreateRelease}
        onClose={() => setShowCreateRelease(false)}
        onCreate={handleCreateRelease}
        creating={creating}
        nextVersion={nextVersion}
        userName={user?.firstName || user?.username || ''}
        previewName={releasePreviewName}
      />

      <CreateBranchModal
        isOpen={showCreateBranch}
        onClose={() => setShowCreateBranch(false)}
        onCreate={handleCreateBranch}
        creating={creating}
        releaseVersao={selectedReleaseVersao}
        userLogin={user?.username || ''}
        userName={user?.firstName || user?.username || ''}
      />

      {/* Modal de edição - Release */}
      <EditCardModal
        isOpen={!!editingRelease}
        onClose={() => setEditingRelease(null)}
        release={editingRelease}
        releaseBranches={editingRelease ? branches.filter(b => b.releaseId === editingRelease.id) : []}
        releaseColumns={KANBAN_COLUMNS_RELEASE}
        branchColumns={KANBAN_COLUMNS_BRANCH}
        onSaveAll={handleSaveAll}
        onCreateBranch={handleOpenBranchModal}
        updating={updating}
      />

      {/* Modal de edição - Branch */}
      <EditCardModal
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        branch={editingBranch}
        branchColumns={KANBAN_COLUMNS_BRANCH}
        releaseColumns={KANBAN_COLUMNS_RELEASE}
        onSaveAll={handleSaveAll}
        updating={updating}
      />
    </>
  );
}
