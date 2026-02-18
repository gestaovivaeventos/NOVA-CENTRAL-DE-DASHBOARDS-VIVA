/**
 * Hook para operações de criação/atualização de branches e releases
 */

import { useState, useCallback } from 'react';
import type { Release, Branch, KanbanStatus } from '../types';
import { 
  gerarId, 
  getDataAtual, 
  gerarNomeRelease, 
  gerarNomeBranch, 
  getProximaVersao, 
  releaseToRow, 
  branchToRow 
} from '../utils';

interface UseBranchActionsReturn {
  creating: boolean;
  updating: boolean;
  actionError: string | null;
  createRelease: (login: string, nomeDisplay: string, releases: Release[]) => Promise<Release | null>;
  createBranch: (
    login: string,
    nomeDisplay: string,
    releaseId: string,
    releaseVersao: number,
    modulo: string,
    descricao: string
  ) => Promise<Branch | null>;
  updateStatus: (id: string, status: KanbanStatus) => Promise<boolean>;
  updateLink: (id: string, link: string) => Promise<boolean>;
  updateDescricao: (id: string, descricao: string) => Promise<boolean>;
  updateModulo: (id: string, modulo: string) => Promise<boolean>;
  initHeaders: () => Promise<boolean>;
}

export function useBranchActions(): UseBranchActionsReturn {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const createRelease = useCallback(async (
    login: string,
    nomeDisplay: string,
    releases: Release[]
  ): Promise<Release | null> => {
    setCreating(true);
    setActionError(null);

    try {
      const versao = getProximaVersao(releases);
      const data = getDataAtual();
      const id = gerarId();
      const nomeCompleto = gerarNomeRelease(versao, login, data);

      const release: Release = {
        id,
        tipo: 'release',
        versao,
        nomeCompleto,
        criadoPor: login,
        criadoPorNome: nomeDisplay,
        dataCriacao: data,
        status: 'em-desenvolvimento',
        linkVercel: '',
        descricao: '',
        ramificacoes: [],
      };

      const row = releaseToRow(release);
      const response = await fetch('/api/branches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: row }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao criar release');
      }

      return release;
    } catch (err: any) {
      setActionError(err.message);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const createBranch = useCallback(async (
    login: string,
    nomeDisplay: string,
    releaseId: string,
    releaseVersao: number,
    modulo: string,
    descricao: string
  ): Promise<Branch | null> => {
    setCreating(true);
    setActionError(null);

    try {
      const data = getDataAtual();
      const id = gerarId();
      const nomeCompleto = gerarNomeBranch(login, releaseVersao, modulo, data);

      const branch: Branch = {
        id,
        tipo: 'branch',
        releaseId,
        releaseVersao,
        nomeCompleto,
        criadoPor: login,
        criadoPorNome: nomeDisplay,
        modulo,
        dataCriacao: data,
        status: 'em-desenvolvimento',
        linkBranch: '',
        descricao,
      };

      const row = branchToRow(branch);
      const response = await fetch('/api/branches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: row }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Erro ao criar ramificação');
      }

      return branch;
    } catch (err: any) {
      setActionError(err.message);
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  const updateField = useCallback(async (id: string, field: string, value: string): Promise<boolean> => {
    setUpdating(true);
    setActionError(null);

    try {
      const response = await fetch('/api/branches/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field, value }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Erro ao atualizar ${field}`);
      }

      return true;
    } catch (err: any) {
      setActionError(err.message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, []);

  const updateStatus = useCallback((id: string, status: KanbanStatus) => {
    return updateField(id, 'status', status);
  }, [updateField]);

  const updateLink = useCallback((id: string, link: string) => {
    return updateField(id, 'link', link);
  }, [updateField]);

  const updateDescricao = useCallback((id: string, descricao: string) => {
    return updateField(id, 'descricao', descricao);
  }, [updateField]);

  const updateModulo = useCallback((id: string, modulo: string) => {
    return updateField(id, 'modulo', modulo);
  }, [updateField]);

  const initHeaders = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/branches/init', {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    creating,
    updating,
    actionError,
    createRelease,
    createBranch,
    updateStatus,
    updateLink,
    updateDescricao,
    updateModulo,
    initHeaders,
  };
}
