/**
 * Utilitários do módulo de Gerenciamento de Branches
 */

import type { Release, Branch, BranchSheetRow, KanbanStatus } from '../types';

/**
 * Gera a data atual no formato dd.mm.yyyy
 */
export function getDataAtual(): string {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}.${mes}.${ano}`;
}

/**
 * Gera um ID único
 */
export function gerarId(): string {
  // Gerar ID simples sem precisar de uuid
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Calcula a próxima versão de release
 */
export function getProximaVersao(releases: Release[]): number {
  if (releases.length === 0) return 1;
  const maxVersao = Math.max(...releases.map(r => r.versao));
  return maxVersao + 1;
}

/**
 * Gera o nome padronizado de uma release
 * Formato: release_v{N}/{login_usuario}/{dd.mm.yyyy}
 */
export function gerarNomeRelease(versao: number, loginUsuario: string, data: string): string {
  return `release_v${versao}/${loginUsuario}/${data}`;
}

/**
 * Gera o nome padronizado de uma branch/ramificação
 * Formato: {login}_r_v{N}/{modulo}/{dd.mm.yyyy}
 */
export function gerarNomeBranch(
  loginUsuario: string,
  releaseVersao: number,
  modulo: string,
  data: string
): string {
  return `${loginUsuario}_r_v${releaseVersao}/${modulo}/${data}`;
}

/**
 * Converte row da planilha para Release
 */
export function rowToRelease(row: BranchSheetRow): Release {
  return {
    id: row.id,
    tipo: 'release',
    versao: parseInt(row.versao) || 1,
    nomeCompleto: row.nomeCompleto,
    criadoPor: row.criadoPor,
    criadoPorNome: row.criadoPorNome,
    dataCriacao: row.dataCriacao,
    status: row.status as KanbanStatus,
    linkVercel: row.linkVercelOuBranch,
    descricao: row.descricao || '',
    ramificacoes: [],
    aprovadoPor: row.aprovadoPor || '',
    aprovadoPorNome: row.aprovadoPorNome || '',
    dataAprovacao: row.dataAprovacao || '',
    entreguePor: row.entreguePor || '',
    entreguePorNome: row.entreguePorNome || '',
    dataEntrega: row.dataEntrega || '',
  };
}

/**
 * Converte row da planilha para Branch
 */
export function rowToBranch(row: BranchSheetRow): Branch {
  return {
    id: row.id,
    tipo: 'branch',
    releaseId: row.releaseId,
    releaseVersao: parseInt(row.versao) || 1,
    nomeCompleto: row.nomeCompleto,
    criadoPor: row.criadoPor,
    criadoPorNome: row.criadoPorNome,
    modulo: row.modulo,
    dataCriacao: row.dataCriacao,
    status: row.status as KanbanStatus,
    linkBranch: row.linkVercelOuBranch,
    descricao: row.descricao,
    aprovadoPor: row.aprovadoPor || '',
    aprovadoPorNome: row.aprovadoPorNome || '',
    dataAprovacao: row.dataAprovacao || '',
    entreguePor: row.entreguePor || '',
    entreguePorNome: row.entreguePorNome || '',
    dataEntrega: row.dataEntrega || '',
  };
}

/**
 * Converte Release para array de valores da planilha
 */
export function releaseToRow(release: Release): string[] {
  return [
    release.id,
    'release',
    String(release.versao),
    release.nomeCompleto,
    release.criadoPor,
    release.criadoPorNome,
    '', // modulo (vazio para release)
    release.dataCriacao,
    release.status,
    release.linkVercel,
    release.descricao || '',
    '', // release_id (vazio para release)
    '', // aprovado_por
    '', // aprovado_por_nome
    '', // data_aprovacao
    '', // entregue_por
    '', // entregue_por_nome
    '', // data_entrega
  ];
}

/**
 * Converte Branch para array de valores da planilha
 */
export function branchToRow(branch: Branch): string[] {
  return [
    branch.id,
    'branch',
    String(branch.releaseVersao),
    branch.nomeCompleto,
    branch.criadoPor,
    branch.criadoPorNome,
    branch.modulo,
    branch.dataCriacao,
    branch.status,
    branch.linkBranch,
    branch.descricao,
    branch.releaseId,
    '', // aprovado_por
    '', // aprovado_por_nome
    '', // data_aprovacao
    '', // entregue_por
    '', // entregue_por_nome
    '', // data_entrega
  ];
}

/**
 * Parseia rows da planilha para objetos tipados
 */
export function parseSheetRows(rows: string[][]): { releases: Release[]; branches: Branch[] } {
  if (!rows || rows.length < 2) return { releases: [], branches: [] };

  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  const releases: Release[] = [];
  const branches: Branch[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const getVal = (colName: string) => {
      const idx = headers.indexOf(colName);
      return idx >= 0 ? (row[idx] || '') : '';
    };

    const tipo = getVal('tipo');
    const sheetRow: BranchSheetRow = {
      id: getVal('id'),
      tipo: tipo as 'release' | 'branch',
      versao: getVal('versao'),
      nomeCompleto: getVal('nome_completo'),
      criadoPor: getVal('criado_por'),
      criadoPorNome: getVal('criado_por_nome'),
      modulo: getVal('modulo'),
      dataCriacao: getVal('data_criacao'),
      status: (getVal('status') || 'em-desenvolvimento') as KanbanStatus,
      linkVercelOuBranch: getVal('link'),
      descricao: getVal('descricao'),
      releaseId: getVal('release_id'),
      aprovadoPor: getVal('aprovado_por'),
      aprovadoPorNome: getVal('aprovado_por_nome'),
      dataAprovacao: getVal('data_aprovacao'),
      entreguePor: getVal('entregue_por'),
      entreguePorNome: getVal('entregue_por_nome'),
      dataEntrega: getVal('data_entrega'),
    };

    if (!sheetRow.id) continue;

    if (tipo === 'release') {
      releases.push(rowToRelease(sheetRow));
    } else if (tipo === 'branch') {
      branches.push(rowToBranch(sheetRow));
    }
  }

  // Vincular ramificações às releases
  releases.forEach(release => {
    release.ramificacoes = branches
      .filter(b => b.releaseId === release.id)
      .map(b => b.id);
  });

  return { releases, branches };
}
