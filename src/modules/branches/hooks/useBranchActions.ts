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

interface ApprovalInfo {
  aprovadoPor: string;
  aprovadoPorNome: string;
}

interface SaveAllFieldsPayload {
  id: string;
  status?: KanbanStatus;
  link?: string;
  descricao?: string;
  modulo?: string;
  approvalInfo?: ApprovalInfo;
}

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
  updateStatusWithTracking: (id: string, status: KanbanStatus, approvalInfo?: ApprovalInfo) => Promise<boolean>;
  updateLink: (id: string, link: string) => Promise<boolean>;
  updateDescricao: (id: string, descricao: string) => Promise<boolean>;
  updateModulo: (id: string, modulo: string) => Promise<boolean>;
  saveAllFields: (payload: SaveAllFieldsPayload) => Promise<boolean>;
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
        aprovadoPor: '',
        aprovadoPorNome: '',
        dataAprovacao: '',
        entreguePor: '',
        entreguePorNome: '',
        dataEntrega: '',
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
        aprovadoPor: '',
        aprovadoPorNome: '',
        dataAprovacao: '',
        entreguePor: '',
        entreguePorNome: '',
        dataEntrega: '',
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

  /**
   * Atualiza o status e, se for 'aprovada' ou 'concluida', salva as informações de rastreamento.
   */
  const updateStatusWithTracking = useCallback(async (
    id: string,
    status: KanbanStatus,
    approvalInfo?: ApprovalInfo
  ): Promise<boolean> => {
    setUpdating(true);
    setActionError(null);

    try {
      // Atualizar o status
      const statusOk = await updateField(id, 'status', status);
      if (!statusOk) return false;

      if (status === 'aprovada' && approvalInfo) {
        // Salvar informações de aprovação
        const dataAprovacao = getDataAtual();
        await updateField(id, 'aprovado_por', approvalInfo.aprovadoPor);
        await updateField(id, 'aprovado_por_nome', approvalInfo.aprovadoPorNome);
        await updateField(id, 'data_aprovacao', dataAprovacao);
      }

      if (status === 'concluida' && approvalInfo) {
        // Salvar informações de entrega
        const dataEntrega = getDataAtual();
        await updateField(id, 'entregue_por', approvalInfo.aprovadoPor);
        await updateField(id, 'entregue_por_nome', approvalInfo.aprovadoPorNome);
        await updateField(id, 'data_entrega', dataEntrega);
      }

      return true;
    } catch (err: any) {
      setActionError(err.message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [updateField]);

  /**
   * Salva todos os campos editáveis de uma vez (status, link, descrição, módulo).
   * Rastreia automaticamente aprovação e entrega.
   */
  const saveAllFields = useCallback(async (payload: SaveAllFieldsPayload): Promise<boolean> => {
    setUpdating(true);
    setActionError(null);

    try {
      const { id, status, link, descricao, modulo, approvalInfo } = payload;

      // Atualizar status (com rastreamento se necessário)
      if (status !== undefined) {
        await updateField(id, 'status', status);

        if (status === 'aprovada' && approvalInfo) {
          const dataAprovacao = getDataAtual();
          await updateField(id, 'aprovado_por', approvalInfo.aprovadoPor);
          await updateField(id, 'aprovado_por_nome', approvalInfo.aprovadoPorNome);
          await updateField(id, 'data_aprovacao', dataAprovacao);
        }

        if (status === 'concluida' && approvalInfo) {
          const dataEntrega = getDataAtual();
          await updateField(id, 'entregue_por', approvalInfo.aprovadoPor);
          await updateField(id, 'entregue_por_nome', approvalInfo.aprovadoPorNome);
          await updateField(id, 'data_entrega', dataEntrega);
        }
      }

      // Atualizar link
      if (link !== undefined) {
        await updateField(id, 'link', link);
      }

      // Atualizar descrição
      if (descricao !== undefined) {
        await updateField(id, 'descricao', descricao);
      }

      // Atualizar módulo
      if (modulo !== undefined) {
        await updateField(id, 'modulo', modulo);
      }

      return true;
    } catch (err: any) {
      setActionError(err.message);
      return false;
    } finally {
      setUpdating(false);
    }
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
    updateStatusWithTracking,
    updateLink,
    updateDescricao,
    updateModulo,
    saveAllFields,
    initHeaders,
  };
}
